import type { BuyerArrangement, BuyerExperience, BuyerModeProfile } from "@/lib/models";

/**
 * Small copy-variation lookup for the Journey UI — pronoun wording by
 * `arrangement` and depth flags by `experience`. Deliberately not a rules
 * engine: no conditions, no derived state, just a table.
 */
export interface BuyerCopy {
  /** "my" | "our" | "the buying group's" */
  possessive: string;
  /** Same as `possessive`, sentence-cased. */
  possessiveCapitalized: string;
  /** "I" | "we" | "the buying group" */
  subject: string;
  isFirstTime: boolean;
  isRepeat: boolean;
  isSolo: boolean;
  isPartner: boolean;
  isGroup: boolean;
}

const ARRANGEMENT_WORDS: Record<BuyerArrangement, { possessive: string; subject: string }> = {
  solo: { possessive: "my", subject: "I" },
  partner: { possessive: "our", subject: "we" },
  group: { possessive: "the buying group's", subject: "the buying group" },
};

/** Defaults (no profile yet) match `buyerModeProfileSchema`'s own defaults. */
export function buyerCopy(profile: BuyerModeProfile | null | undefined): BuyerCopy {
  const arrangement: BuyerArrangement = profile?.arrangement ?? "solo";
  const experience: BuyerExperience = profile?.experience ?? "first-time";
  const words = ARRANGEMENT_WORDS[arrangement];

  return {
    possessive: words.possessive,
    possessiveCapitalized: words.possessive[0].toUpperCase() + words.possessive.slice(1),
    subject: words.subject,
    isFirstTime: experience === "first-time",
    isRepeat: experience === "repeat",
    isSolo: arrangement === "solo",
    isPartner: arrangement === "partner",
    isGroup: arrangement === "group",
  };
}
