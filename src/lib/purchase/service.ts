/**
 * Buyer → homeowner conversion — "I bought this home".
 *
 * Promotes a `properties` row (a candidate home) into the existing
 * `ownedHome` singleton by setting `ownedHome.sourcePropertyId`, rather than
 * copying data into a second record. Visits, notes, the deal, and documents
 * all keep pointing at the same property id they always did — nothing about
 * them changes here. See supabase/migrations/0027_purchase_conversion_schema.sql.
 *
 * Two-layer shape, matching `lib/maintenance/service.ts` / `lib/workspace/service.ts`:
 *   • `convertPropertyToOwnedHomeCore` takes an explicit `SupabaseClient` +
 *     `householdId`, so it's unit-testable against an in-memory fake.
 *   • `convertPropertyToOwnedHome` is the thin app wrapper.
 *
 * Step order is deliberate, so a failure partway through always leaves the
 * "I bought this home" button visible and safely re-clickable rather than
 * stuck in a half-converted state (the same "safe partial state" reasoning
 * `completeOwnerOnboarding` already documents):
 *   1. Load the property.
 *   2. Upsert `ownedHome` (idempotent: same result if repeated).
 *   3. Flip workspace mode, if requested (idempotent: sets a fixed value).
 *   4. Mark the property `purchased` LAST — the true "fully converted"
 *      signal the UI's duplicate-click guard keys off of. Every step before
 *      this one can safely re-run if it doesn't get here.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getCurrentHouseholdId } from "@/lib/household/current";
import { invalidateTables } from "@/lib/data/invalidation";
import { saveOwnedHomeCore } from "@/lib/maintenance/service";
import { completeOwnerOnboarding } from "@/lib/workspace/service";
import {
  OWNED_HOME_TABLE,
  WORKSPACE_TABLE,
  OWNER_MODE_PROFILE_TABLE,
  propertySchema,
  type OwnerPropertyType,
  type Property,
} from "@/lib/models";

const PROPERTIES_TABLE = "properties";

export interface ConvertPropertyInput {
  /** Required — the closing date, becomes `ownedHome.purchaseDate`. */
  closingDate: string;
  /** Optional — becomes `ownerModeProfile.moveInDate` when `switchMode` is true. */
  moveInDate?: string | null;
  /** Optional — becomes `ownedHome.purchasePrice`, falling back to the property's recorded sale/offer price. */
  finalPurchasePrice?: number | null;
  /** Whether to flip the workspace into homeowner mode as part of this conversion. */
  switchMode: boolean;
}

export interface ConvertPropertyResult {
  ownedHomeId: string;
  modeChanged: boolean;
}

/** `properties.propertyType` -> the narrower `ownerModeProfile.propertyType` enum. */
function mapPropertyTypeToOwner(propertyType: Property["propertyType"]): OwnerPropertyType {
  if (propertyType === "single-family") return "single-family";
  if (propertyType === "townhouse" || propertyType === "condo") return "condo-townhouse";
  return "other";
}

async function loadPropertyForConversion(
  client: SupabaseClient,
  householdId: string,
  propertyId: string,
): Promise<Property> {
  const { data, error } = await client
    .from(PROPERTIES_TABLE)
    .select("*")
    .eq("id", propertyId)
    .eq("householdId", householdId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Property ${propertyId} not found`);
  return propertySchema.parse(data);
}

export async function convertPropertyToOwnedHomeCore(
  client: SupabaseClient,
  householdId: string,
  propertyId: string,
  input: ConvertPropertyInput,
): Promise<ConvertPropertyResult> {
  const property = await loadPropertyForConversion(client, householdId, propertyId);

  await saveOwnedHomeCore(client, householdId, {
    name: property.address,
    address: property.address,
    yearBuilt: property.yearBuilt,
    purchaseDate: input.closingDate,
    purchasePrice: input.finalPurchasePrice ?? property.finalSalePrice ?? property.offerPrice ?? null,
    sourcePropertyId: propertyId,
  });

  const { data: ownedHomeRow, error: ownedHomeReadError } = await client
    .from(OWNED_HOME_TABLE)
    .select("id")
    .eq("householdId", householdId)
    .maybeSingle();
  if (ownedHomeReadError) throw new Error(ownedHomeReadError.message);
  if (!ownedHomeRow) throw new Error("Owned home was not created");

  if (input.switchMode) {
    await completeOwnerOnboarding(client, householdId, {
      moveInDate: input.moveInDate ?? null,
      propertyType: mapPropertyTypeToOwner(property.propertyType),
    });
  }

  const { error: statusError } = await client
    .from(PROPERTIES_TABLE)
    .update({ status: "purchased" })
    .eq("id", propertyId)
    .eq("householdId", householdId);
  if (statusError) throw new Error(statusError.message);

  return { ownedHomeId: ownedHomeRow.id as string, modeChanged: input.switchMode };
}

export async function convertPropertyToOwnedHome(
  propertyId: string,
  input: ConvertPropertyInput,
): Promise<ConvertPropertyResult> {
  const result = await convertPropertyToOwnedHomeCore(createClient(), getCurrentHouseholdId(), propertyId, input);
  invalidateTables([PROPERTIES_TABLE, OWNED_HOME_TABLE, OWNER_MODE_PROFILE_TABLE, WORKSPACE_TABLE]);
  return result;
}
