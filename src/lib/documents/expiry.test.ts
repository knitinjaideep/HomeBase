import { describe, it, expect } from "vitest";
import { getDocumentExpiryStatus } from "./expiry";

describe("getDocumentExpiryStatus", () => {
  const today = new Date("2026-07-15T12:00:00.000Z");

  it("is 'no-date' when no expiration date was entered", () => {
    expect(getDocumentExpiryStatus(null, today)).toBe("no-date");
  });

  it("is 'expired' for a past expiration date", () => {
    expect(getDocumentExpiryStatus("2026-07-01", today)).toBe("expired");
  });

  it("is 'expiring-soon' for today and the next 60 days", () => {
    expect(getDocumentExpiryStatus("2026-07-15", today)).toBe("expiring-soon");
    expect(getDocumentExpiryStatus("2026-09-13", today)).toBe("expiring-soon");
  });

  it("is 'ok' beyond the expiring-soon window", () => {
    expect(getDocumentExpiryStatus("2026-09-14", today)).toBe("ok");
  });
});
