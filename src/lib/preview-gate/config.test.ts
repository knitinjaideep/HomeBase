import { afterEach, describe, expect, it, vi } from "vitest";
import { getPreviewGateSecrets, isPreviewGateEnabled, PreviewGateMisconfiguredError } from "./config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isPreviewGateEnabled", () => {
  it("defaults to disabled when unset", () => {
    vi.stubEnv("PREVIEW_GATE_ENABLED", "");
    expect(isPreviewGateEnabled()).toBe(false);
  });

  it("is disabled for any value other than \"true\"", () => {
    vi.stubEnv("PREVIEW_GATE_ENABLED", "false");
    expect(isPreviewGateEnabled()).toBe(false);
    vi.stubEnv("PREVIEW_GATE_ENABLED", "1");
    expect(isPreviewGateEnabled()).toBe(false);
  });

  it("is enabled when set to \"true\" (case/whitespace tolerant)", () => {
    vi.stubEnv("PREVIEW_GATE_ENABLED", " TRUE ");
    expect(isPreviewGateEnabled()).toBe(true);
  });
});

describe("getPreviewGateSecrets", () => {
  it("returns trimmed secrets when both are set", () => {
    vi.stubEnv("PREVIEW_ACCESS_KEY", "  secret-key  ");
    vi.stubEnv("PREVIEW_COOKIE_SECRET", "  cookie-secret  ");
    expect(getPreviewGateSecrets()).toEqual({ accessKey: "secret-key", cookieSecret: "cookie-secret" });
  });

  it("throws PreviewGateMisconfiguredError when the access key is missing", () => {
    vi.stubEnv("PREVIEW_ACCESS_KEY", "");
    vi.stubEnv("PREVIEW_COOKIE_SECRET", "cookie-secret");
    expect(() => getPreviewGateSecrets()).toThrow(PreviewGateMisconfiguredError);
  });

  it("throws PreviewGateMisconfiguredError when the cookie secret is missing", () => {
    vi.stubEnv("PREVIEW_ACCESS_KEY", "secret-key");
    vi.stubEnv("PREVIEW_COOKIE_SECRET", "");
    expect(() => getPreviewGateSecrets()).toThrow(PreviewGateMisconfiguredError);
  });

  it("throws PreviewGateMisconfiguredError when both are missing", () => {
    vi.stubEnv("PREVIEW_ACCESS_KEY", "");
    vi.stubEnv("PREVIEW_COOKIE_SECRET", "");
    expect(() => getPreviewGateSecrets()).toThrow(PreviewGateMisconfiguredError);
  });
});
