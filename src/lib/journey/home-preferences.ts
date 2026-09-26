import type { HomePreferences } from "@/lib/models";

/**
 * Home-preferences vocabulary and the deterministic rules built on it: the
 * preset lists the form offers, the "is this activity defined" completion rule,
 * and the plain-English preview sentence. No AI — every phrase comes from the
 * tables below.
 *
 * Where each answer is stored:
 *  - towns, minimum bedrooms and bathrooms → `homePreferences` (reused by
 *    "What we know so far", personalization and search)
 *  - home types, preset and custom must-have / would-love / avoid lists, extra
 *    notes → this activity's `responses` JSON (`homePreferencesResponsesSchema`)
 */

export const HOME_TYPES = [
  { id: "single-family", label: "Single family", noun: "single-family home" },
  { id: "townhouse", label: "Townhouse", noun: "townhouse" },
  { id: "condo", label: "Condo", noun: "condo" },
  { id: "multi-family", label: "Multi-family", noun: "multi-family home" },
  { id: "other", label: "Other", noun: "home" },
] as const;
export type HomeTypeId = (typeof HOME_TYPES)[number]["id"];
export const HOME_TYPE_IDS = HOME_TYPES.map((t) => t.id) as [HomeTypeId, ...HomeTypeId[]];

export interface Preset {
  id: string;
  label: string;
  /** How it reads inside a sentence ("a garage", "central AC"). */
  phrase: string;
}

export const MUST_HAVE_PRESETS: Preset[] = [
  { id: "garage", label: "Garage", phrase: "a garage" },
  { id: "backyard", label: "Backyard", phrase: "a backyard" },
  { id: "home-office", label: "Home office", phrase: "a home office" },
  { id: "central-ac", label: "Central AC", phrase: "central AC" },
  { id: "basement", label: "Basement", phrase: "a basement" },
  { id: "good-schools", label: "Good schools", phrase: "good schools" },
];

export const WOULD_LOVE_PRESETS: Preset[] = [
  { id: "finished-basement", label: "Finished basement", phrase: "a finished basement" },
  { id: "walkable-downtown", label: "Walkable downtown", phrase: "a walkable downtown" },
  { id: "large-kitchen", label: "Large kitchen", phrase: "a large kitchen" },
  { id: "quiet-street", label: "Quiet street", phrase: "a quiet street" },
  { id: "updated-bathrooms", label: "Updated bathrooms", phrase: "updated bathrooms" },
];

export const AVOID_PRESETS: Preset[] = [
  { id: "busy-road", label: "Busy road", phrase: "a busy road" },
  { id: "hoa", label: "HOA", phrase: "an HOA" },
  { id: "fixer-upper", label: "Fixer-upper", phrase: "a fixer-upper" },
  { id: "long-commute", label: "Long commute", phrase: "a long commute" },
];

/** Minimum-count options. Stored as numbers on `homePreferences`, 0 = no minimum. */
export const BEDROOM_OPTIONS = [2, 3, 4, 5];
export const BATHROOM_OPTIONS = [1, 1.5, 2, 2.5, 3];

/** The answers this activity collects, in the shape the form and helpers share. */
export interface HomePreferenceAnswers {
  towns: string[];
  minBedrooms: number;
  minBathrooms: number;
  homeTypes: HomeTypeId[];
  homeTypeOther: string;
  mustHave: string[];
  mustHaveCustom: string[];
  wouldLove: string[];
  wouldLoveCustom: string[];
  avoid: string[];
  avoidCustom: string[];
}

/** "4+" — the bedroom/bathroom minimum as people say it. */
export function formatMinimum(n: number): string {
  return `${n}+`;
}

/** Trim, drop empties, and de-duplicate case-insensitively, keeping first spelling. */
export function cleanList(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const item = raw.trim();
    const key = item.toLowerCase();
    if (item && !seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

export function joinList(items: string[], conjunction: "and" | "or" = "and"): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
}

function phrases(presets: Preset[], ids: string[], custom: string[]): string[] {
  const chosen = presets.filter((p) => ids.includes(p.id)).map((p) => p.phrase);
  return [...chosen, ...cleanList(custom)];
}

export function homeTypeNouns(a: Pick<HomePreferenceAnswers, "homeTypes" | "homeTypeOther">): string[] {
  return HOME_TYPES.filter((t) => a.homeTypes.includes(t.id)).map((t) =>
    t.id === "other" ? (a.homeTypeOther.trim() ? a.homeTypeOther.trim().toLowerCase() : t.noun) : t.noun,
  );
}

export interface HomePreview {
  /** One readable sentence, or null when there is nothing to describe yet. */
  sentence: string | null;
  homeTypes: string[];
  locations: string[];
  mustHave: string[];
  wouldLove: string[];
  avoid: string[];
}

/** Deterministic, human-readable preview of the answers so far. */
export function describeHome(a: HomePreferenceAnswers): HomePreview {
  const nouns = homeTypeNouns(a);
  const locations = cleanList(a.towns);
  const mustParts = [
    ...(a.minBedrooms > 0 ? [`${formatMinimum(a.minBedrooms)} bedrooms`] : []),
    ...(a.minBathrooms > 0 ? [`${formatMinimum(a.minBathrooms)} bathrooms`] : []),
    ...phrases(MUST_HAVE_PRESETS, a.mustHave, a.mustHaveCustom),
  ];
  const wouldLove = phrases(WOULD_LOVE_PRESETS, a.wouldLove, a.wouldLoveCustom);
  const avoid = phrases(AVOID_PRESETS, a.avoid, a.avoidCustom);

  const hasAnything = nouns.length > 0 || locations.length > 0 || mustParts.length > 0;
  let sentence: string | null = null;
  if (hasAnything) {
    const noun = nouns.length > 0 ? joinList(nouns, "or") : "home";
    const article = /^[aeiou]/i.test(noun) ? "An" : "A";
    sentence = `${article} ${noun}`;
    if (locations.length > 0) sentence += ` in ${joinList(locations)}`;
    if (mustParts.length > 0) sentence += ` with ${joinList(mustParts)}`;
    sentence += ".";
  }

  return { sentence, homeTypes: nouns, locations, mustHave: mustParts, wouldLove, avoid };
}

/** Human labels for a stored preset list plus custom entries (for summaries). */
export function labelsFor(presets: Preset[], ids: string[], custom: string[]): string[] {
  return [...presets.filter((p) => ids.includes(p.id)).map((p) => p.label), ...cleanList(custom)];
}

/**
 * Deterministic completion rule — deliberately light. The activity counts as
 * defined once there is at least one home type AND at least one must-have,
 * where a bedroom or bathroom minimum counts as a must-have. Would-love, avoid,
 * towns, and notes are optional.
 */
export function homePreferencesDefined(a: HomePreferenceAnswers): boolean {
  const mustHaveCount =
    (a.minBedrooms > 0 ? 1 : 0) + (a.minBathrooms > 0 ? 1 : 0) + a.mustHave.length + cleanList(a.mustHaveCustom).length;
  return a.homeTypes.length > 0 && mustHaveCount > 0;
}

/** Assemble the shared answer shape from stored preferences plus the activity's responses. */
export function answersFrom(
  preferences: Pick<HomePreferences, "primaryTowns" | "minBedrooms" | "minBathrooms">,
  r: {
    homeTypes?: HomeTypeId[];
    homeTypeOther?: string;
    mustHave?: string[];
    mustHaveCustom?: string[];
    wouldLove?: string[];
    wouldLoveCustom?: string[];
    avoid?: string[];
    avoidCustom?: string[];
  },
): HomePreferenceAnswers {
  return {
    towns: preferences.primaryTowns,
    minBedrooms: preferences.minBedrooms,
    minBathrooms: preferences.minBathrooms,
    homeTypes: r.homeTypes ?? [],
    homeTypeOther: r.homeTypeOther ?? "",
    mustHave: r.mustHave ?? [],
    mustHaveCustom: r.mustHaveCustom ?? [],
    wouldLove: r.wouldLove ?? [],
    wouldLoveCustom: r.wouldLoveCustom ?? [],
    avoid: r.avoid ?? [],
    avoidCustom: r.avoidCustom ?? [],
  };
}
