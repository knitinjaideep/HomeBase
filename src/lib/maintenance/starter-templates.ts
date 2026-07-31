import type { OwnerPropertyType } from "@/lib/models";

/**
 * A starter maintenance checklist the homeowner can review and selectively
 * add from — nothing here is ever created automatically (see
 * StarterTemplatePicker). `appliesToCondo: false` items are things an HOA
 * typically handles (gutters, exterior/roof), so they're filtered out for
 * condo/townhouse homes rather than forcing every homeowner to track them.
 */
export interface MaintenanceTemplate {
  id: string;
  title: string;
  areaOrSystem: string;
  recurrenceMonths: number | null;
  appliesToCondo: boolean;
}

export const MAINTENANCE_STARTER_TEMPLATES: MaintenanceTemplate[] = [
  { id: "hvac-filter", title: "Replace HVAC filter", areaOrSystem: "HVAC", recurrenceMonths: 3, appliesToCondo: true },
  {
    id: "smoke-co-detectors",
    title: "Test smoke & carbon monoxide detectors",
    areaOrSystem: "Safety",
    recurrenceMonths: 6,
    appliesToCondo: true,
  },
  { id: "gutters", title: "Clean gutters", areaOrSystem: "Exterior", recurrenceMonths: 6, appliesToCondo: false },
  {
    id: "water-heater",
    title: "Flush water heater",
    areaOrSystem: "Plumbing",
    recurrenceMonths: 12,
    appliesToCondo: true,
  },
  {
    id: "exterior-inspection",
    title: "Exterior inspection (siding, roof, foundation)",
    areaOrSystem: "Exterior",
    recurrenceMonths: 12,
    appliesToCondo: false,
  },
  {
    id: "seasonal-hvac-prep",
    title: "Seasonal heating/cooling system prep",
    areaOrSystem: "HVAC",
    recurrenceMonths: 6,
    appliesToCondo: true,
  },
];

/** Condo/townhouse homes don't see HOA-handled items (gutters, exterior). Everyone else sees the full list. */
export function templatesForPropertyType(
  propertyType: OwnerPropertyType | null | undefined,
): MaintenanceTemplate[] {
  if (propertyType === "condo-townhouse") {
    return MAINTENANCE_STARTER_TEMPLATES.filter((t) => t.appliesToCondo);
  }
  return MAINTENANCE_STARTER_TEMPLATES;
}
