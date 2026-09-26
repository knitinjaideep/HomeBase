import { monthLabel } from "@/lib/format";
import { getStage } from "@/lib/guide";
import type { JourneySnapshot } from "./snapshot";
import { readActivityResponses } from "./activity-responses";
import { townNames } from "./towns";
import { HOME_TYPES, MUST_HAVE_PRESETS, labelsFor } from "./home-preferences";

/** What the household has recorded in the structured Home preferences form. */
function homePreferenceResponses(s: JourneySnapshot) {
  return readActivityResponses("home-preferences", s.stageStates.find((x) => x.id === "home-preferences")?.responses);
}

function homeTypeLabels(s: JourneySnapshot): string[] {
  const r = homePreferenceResponses(s);
  return HOME_TYPES.filter((t) => r.homeTypes?.includes(t.id)).map((t) =>
    t.id === "other" && r.homeTypeOther?.trim() ? r.homeTypeOther.trim() : t.label,
  );
}

/** "Garage, Backyard, Central AC +2" — the first few, then a count of the rest. */
function compactList(items: string[], max = 3): string {
  return items.length <= max ? items.join(", ") : `${items.slice(0, max).join(", ")} +${items.length - max}`;
}

/**
 * "What we know so far": a few key answers the household has already recorded,
 * gathered for display on the Journey. Everything here is read straight from
 * data the household entered (profile, guardrails, preferences, town research)
 * — nothing is looked up, estimated, or filled in. A fact with no recorded
 * value is simply left out.
 */
export interface JourneyFact {
  id:
    | "timeline"
    | "towns"
    | "backupTowns"
    | "homeType"
    | "mustHaves"
    | "budget"
    | "payment"
    | "ownership"
    | "bedrooms"
    | "bathrooms"
    | "schools"
    | "commute";
  label: string;
  value: string;
  /** The activity that owns this answer — where the household can change it. */
  activityId: string;
  /** That activity's short name ("Towns"), for "from …" attribution. */
  source: string;
  /** The activity page to edit it on. */
  href: string;
  /** A stable key for choosing an icon. */
  icon: "calendar" | "map" | "home" | "money" | "clock" | "school" | "car" | "list";
  /** Display order; lower comes first. */
  priority: number;
}

type FactInput = Omit<JourneyFact, "source" | "href" | "priority">;

/** Display order of facts, most decision-shaping first. */
const FACT_PRIORITY: Record<JourneyFact["id"], number> = {
  timeline: 10,
  budget: 20,
  payment: 30,
  ownership: 40,
  towns: 50,
  backupTowns: 60,
  homeType: 70,
  bedrooms: 80,
  bathrooms: 90,
  mustHaves: 100,
  schools: 110,
  commute: 120,
};

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

/** Attach the owning activity's name and edit route, and the display order. */
function withMeta(fact: FactInput): JourneyFact {
  return {
    ...fact,
    source: getStage(fact.activityId)?.shortTitle ?? fact.activityId,
    href: `/journey/${fact.activityId}`,
    priority: FACT_PRIORITY[fact.id],
  };
}

/**
 * The reusable fact list, derived from one snapshot: ordered, with each fact
 * pointing at the activity that owns it. A missing answer yields no fact.
 */
export function journeyFacts(s: JourneySnapshot): JourneyFact[] {
  const inputs: FactInput[] = [];
  const { household, financial, preferences } = s;

  if (household.idealPurchaseStart && household.idealPurchaseEnd) {
    const start = monthLabel(household.idealPurchaseStart);
    const end = monthLabel(household.idealPurchaseEnd);
    inputs.push({
      id: "timeline",
      activityId: "strategy",
      icon: "calendar",
      label: "Target timeline",
      value: start === end ? start : `${start} – ${end}`,
    });
  }

  const townRows = { primary: townNames(s.towns, "primary"), backup: townNames(s.towns, "backup") };
  const primaryTowns = townRows.primary.length > 0 ? townRows.primary : preferences.primaryTowns;
  const backupTowns = townRows.backup.length > 0 ? townRows.backup : preferences.backupTowns;
  if (primaryTowns.length > 0) {
    inputs.push({ id: "towns", activityId: "town-research", icon: "map", label: "Primary towns", value: primaryTowns.join(", ") });
  }
  if (backupTowns.length > 0) {
    inputs.push({ id: "backupTowns", activityId: "town-research", icon: "map", label: "Backup towns", value: backupTowns.join(", ") });
  }

  const min = financial.priceComfortableMin;
  const max = financial.priceComfortableMax;
  if (typeof min === "number" && typeof max === "number" && max > 0) {
    inputs.push({
      id: "budget",
      activityId: "finances",
      icon: "money",
      label: "Comfortable price range",
      value: `${compactMoney(min)} – ${compactMoney(max)}`,
    });
  }

  if (typeof financial.paymentComfortable === "number" && financial.paymentComfortable > 0) {
    inputs.push({
      id: "payment",
      activityId: "finances",
      icon: "money",
      label: "Comfortable monthly payment",
      value: `$${Math.round(financial.paymentComfortable).toLocaleString("en-US")}/mo`,
    });
  }

  if (household.minOwnershipYears > 0) {
    inputs.push({
      id: "ownership",
      activityId: "strategy",
      icon: "clock",
      label: "Plan to stay",
      value: `${household.minOwnershipYears}+ years`,
    });
  }

  const types = homeTypeLabels(s);
  if (types.length > 0) {
    inputs.push({ id: "homeType", activityId: "home-preferences", icon: "home", label: "Home type", value: types.join(", ") });
  }

  const responses = homePreferenceResponses(s);
  const schoolsRecorded = preferences.minSchoolRating > 0;
  // "Good schools" as a must-have and the school threshold say the same thing;
  // show the threshold (more specific) and drop the duplicate.
  const mustHaveIds = schoolsRecorded ? (responses.mustHave ?? []).filter((id) => id !== "good-schools") : (responses.mustHave ?? []);
  const mustHaves = labelsFor(MUST_HAVE_PRESETS, mustHaveIds, responses.mustHaveCustom ?? []);
  if (mustHaves.length > 0) {
    inputs.push({ id: "mustHaves", activityId: "home-preferences", icon: "list", label: "Must-haves", value: compactList(mustHaves) });
  }

  if (preferences.minBedrooms > 0) {
    inputs.push({ id: "bedrooms", activityId: "home-preferences", icon: "home", label: "Bedrooms", value: `${preferences.minBedrooms}+` });
  }
  if (preferences.minBathrooms > 0) {
    inputs.push({ id: "bathrooms", activityId: "home-preferences", icon: "home", label: "Bathrooms", value: `${preferences.minBathrooms}+` });
  }

  if (schoolsRecorded) {
    inputs.push({
      id: "schools",
      activityId: "school-priorities",
      icon: "school",
      label: "School threshold",
      value: `Rating ${preferences.minSchoolRating}+`,
    });
  }

  if (preferences.maxCommuteMinutes > 0) {
    inputs.push({ id: "commute", activityId: "commute", icon: "car", label: "Max commute", value: `${preferences.maxCommuteMinutes} min` });
  }

  return dedupeFacts(inputs.map(withMeta)).sort((x, y) => x.priority - y.priority);
}

/** Drop any fact whose label and value repeat one already listed. */
function dedupeFacts(facts: JourneyFact[]): JourneyFact[] {
  const seen = new Set<string>();
  return facts.filter((f) => {
    const key = `${f.label}|${f.value}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Activities that record answers shown under "What we know so far". */
export const FACT_ACTIVITY_IDS = ["strategy", "finances", "town-research", "home-preferences", "school-priorities", "commute"] as const;

/** The facts that belong to one Stage, by the activities inside it. */
export function factsForStage(facts: JourneyFact[], activityIds: readonly string[]): JourneyFact[] {
  return facts.filter((f) => activityIds.includes(f.activityId));
}

/**
 * A one-line summary of what an activity has already recorded, keyed by
 * activity id — for its card on the Stage page. Only recorded answers appear;
 * an activity with nothing recorded has no entry.
 */
export function activitySummaries(s: JourneySnapshot): Record<string, string> {
  const facts = journeyFacts(s);
  const value = (id: JourneyFact["id"]) => facts.find((f) => f.id === id)?.value;
  const out: Record<string, string> = {};
  const set = (activityId: string, text: string | undefined) => {
    if (text) out[activityId] = text;
  };

  set("strategy", [value("timeline"), value("ownership")].filter(Boolean).join(" · "));
  set("finances", value("budget"));
  set("town-research", value("towns"));
  set(
    "home-preferences",
    [
      homeTypeLabels(s).join(" or ") || undefined,
      s.preferences.minBedrooms > 0 ? `${s.preferences.minBedrooms}+ beds` : undefined,
      s.preferences.minBathrooms > 0 ? `${s.preferences.minBathrooms}+ baths` : undefined,
    ]
      .filter(Boolean)
      .join(" · "),
  );
  set("school-priorities", value("schools"));
  set("commute", s.preferences.maxCommuteMinutes > 0 ? `≤ ${s.preferences.maxCommuteMinutes} min` : undefined);
  return out;
}
