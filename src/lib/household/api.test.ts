import { describe, it, expect } from "vitest";
import { normalizeInviteCode } from "./api";

describe("normalizeInviteCode", () => {
  it("strips dashes and spaces", () => {
    expect(normalizeInviteCode("K7FD-M9QX-4R2P")).toBe("K7FDM9QX4R2P");
    expect(normalizeInviteCode("k7fd m9qx 4r2p")).toBe("K7FDM9QX4R2P");
  });

  it("uppercases lowercase input", () => {
    expect(normalizeInviteCode("k7fdm9qx4r2p")).toBe("K7FDM9QX4R2P");
  });

  it("strips any other stray punctuation a user might paste", () => {
    expect(normalizeInviteCode(" K7FD—M9QX_4R2P!\n")).toBe("K7FDM9QX4R2P");
  });

  it("is idempotent — matches the server's own normalization for an already-clean code", () => {
    expect(normalizeInviteCode("K7FDM9QX4R2P")).toBe("K7FDM9QX4R2P");
  });
});
