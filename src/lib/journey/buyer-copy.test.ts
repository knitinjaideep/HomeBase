import { describe, it, expect } from "vitest";
import { buyerModeProfileSchema } from "@/lib/models";
import { buyerCopy } from "./buyer-copy";

const base = { id: "b1", createdAt: "2026-07-28T00:00:00.000Z", updatedAt: "2026-07-28T00:00:00.000Z" };

function profile(overrides: Partial<{ experience: string; arrangement: string }> = {}) {
  return buyerModeProfileSchema.parse({ ...base, ...overrides });
}

describe("buyerCopy", () => {
  it("defaults to first-time + solo wording when no profile is loaded yet", () => {
    expect(buyerCopy(undefined)).toMatchObject({ isFirstTime: true, isSolo: true, possessive: "my", subject: "I" });
  });

  it("defaults the same way when the household has no saved profile", () => {
    expect(buyerCopy(null)).toMatchObject({ isFirstTime: true, isSolo: true, possessive: "my", subject: "I" });
  });

  it("uses solo wording", () => {
    const copy = buyerCopy(profile({ arrangement: "solo" }));
    expect(copy.possessive).toBe("my");
    expect(copy.possessiveCapitalized).toBe("My");
    expect(copy.subject).toBe("I");
    expect(copy).toMatchObject({ isSolo: true, isPartner: false, isGroup: false });
  });

  it("uses partner wording", () => {
    const copy = buyerCopy(profile({ arrangement: "partner" }));
    expect(copy.possessive).toBe("our");
    expect(copy.possessiveCapitalized).toBe("Our");
    expect(copy.subject).toBe("we");
    expect(copy).toMatchObject({ isSolo: false, isPartner: true, isGroup: false });
  });

  it("uses group wording", () => {
    const copy = buyerCopy(profile({ arrangement: "group" }));
    expect(copy.possessive).toBe("the buying group's");
    expect(copy.possessiveCapitalized).toBe("The buying group's");
    expect(copy.subject).toBe("the buying group");
    expect(copy).toMatchObject({ isSolo: false, isPartner: false, isGroup: true });
  });

  it("flags first-time vs repeat experience", () => {
    expect(buyerCopy(profile({ experience: "first-time" }))).toMatchObject({ isFirstTime: true, isRepeat: false });
    expect(buyerCopy(profile({ experience: "repeat" }))).toMatchObject({ isFirstTime: false, isRepeat: true });
  });
});
