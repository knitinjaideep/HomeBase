import { monthLabel } from "@/lib/format";
import type { JourneySnapshot } from "./snapshot";

/**
 * "What we know so far": a few key answers the household has already recorded,
 * gathered for display on the Journey. Everything here is read straight from
 * data the household entered (profile, guardrails, preferences, town research)
 * — nothing is looked up, estimated, or filled in. A fact with no recorded
 * value is simply left out.
 */
export interface JourneyFact {
  id: "timeline" | "towns" | "budget" | "ownership" | "bedrooms" | "schools" | "commute";
  label: string;
  value: string;
  /** Where the household can change or review it. */
  href: string;
}

/** $1,150,000 → "$1.15M", $950,000 → "$950K". Compact, for one-line display. */
function compactMoney(value: number): string {
  if (value >= 1_000_000) return `$${trimZero((value / 1_000_000).toFixed(2))}M`;
  if (value >= 1_000) return `$${trimZero((value / 1_000).toFixed(0))}K`;
  return `$${value}`;
}

/** "1.50" → "1.5", "1.00" → "1"; whole numbers like "950" are left alone. */
function trimZero(text: string): string {
  return text.includes(".") ? text.replace(/\.?0+$/, "") : text;
}

export function journeyFacts(s: JourneySnapshot): JourneyFact[] {
  const facts: JourneyFact[] = [];
  const { household, financial, preferences } = s;

  if (household.idealPurchaseStart && household.idealPurchaseEnd) {
    const start = monthLabel(household.idealPurchaseStart);
    const end = monthLabel(household.idealPurchaseEnd);
    facts.push({
      id: "timeline",
      label: "Target timeline",
      value: start === end ? start : `${start} – ${end}`,
      href: "/settings",
    });
  }

  const primaryTownNames = s.towns.filter((t) => t.designation === "primary").map((t) => t.name);
  const towns = primaryTownNames.length > 0 ? primaryTownNames : preferences.primaryTowns;
  if (towns.length > 0) {
    facts.push({ id: "towns", label: "Primary towns", value: towns.join(", "), href: "/journey/town-research" });
  }

  const min = financial.priceComfortableMin;
  const max = financial.priceComfortableMax;
  if (typeof min === "number" && typeof max === "number" && max > 0) {
    facts.push({
      id: "budget",
      label: "Comfortable price range",
      value: `${compactMoney(min)} – ${compactMoney(max)}`,
      href: "/settings",
    });
  }

  if (household.minOwnershipYears > 0) {
    facts.push({
      id: "ownership",
      label: "Plan to stay",
      value: `${household.minOwnershipYears}+ years`,
      href: "/settings",
    });
  }

  if (preferences.minBedrooms > 0) {
    facts.push({
      id: "bedrooms",
      label: "Bedrooms",
      value: `${preferences.minBedrooms}+ beds`,
      href: "/journey/home-preferences",
    });
  }

  if (preferences.minSchoolRating > 0) {
    facts.push({
      id: "schools",
      label: "School threshold",
      value: `Rating ${preferences.minSchoolRating}+`,
      href: "/journey/school-priorities",
    });
  }

  if (preferences.maxCommuteMinutes > 0) {
    facts.push({
      id: "commute",
      label: "Max commute",
      value: `${preferences.maxCommuteMinutes} min`,
      href: "/journey/commute",
    });
  }

  return facts;
}
