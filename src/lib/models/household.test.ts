import { describe, it, expect } from "vitest";
import { householdInviteSchema, householdMemberSchema } from "./household";

describe("householdMemberSchema", () => {
  it("parses a valid member row", () => {
    const parsed = householdMemberSchema.parse({
      userId: "u1",
      email: "nitin@example.com",
      role: "owner",
      joinedAt: "2026-07-26T00:00:00.000Z",
    });
    expect(parsed.role).toBe("owner");
  });

  it("rejects an unknown role", () => {
    expect(() =>
      householdMemberSchema.parse({
        userId: "u1",
        email: "nitin@example.com",
        role: "admin",
        joinedAt: "2026-07-26T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("never carries a code or hash field", () => {
    expect(Object.keys(householdMemberSchema.shape)).not.toContain("code");
    expect(Object.keys(householdMemberSchema.shape)).not.toContain("codeHash");
  });
});

describe("householdInviteSchema", () => {
  it("parses a pending invite with null redeemedAt/revokedAt", () => {
    const parsed = householdInviteSchema.parse({
      id: "inv1",
      expiresAt: "2026-07-27T00:00:00.000Z",
      redeemedAt: null,
      revokedAt: null,
      createdAt: "2026-07-26T00:00:00.000Z",
    });
    expect(parsed.redeemedAt).toBeNull();
  });

  it("never carries a code or hash field", () => {
    expect(Object.keys(householdInviteSchema.shape)).not.toContain("code");
    expect(Object.keys(householdInviteSchema.shape)).not.toContain("codeHash");
  });
});
