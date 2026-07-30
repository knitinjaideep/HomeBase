import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { evaluatePreviewGate } from "./gate";
import { createPreviewToken } from "./token";
import { PREVIEW_COOKIE_NAME } from "./cookie";

const SECRET = "cookie-secret";

function enableGate() {
  vi.stubEnv("PREVIEW_GATE_ENABLED", "true");
  vi.stubEnv("PREVIEW_ACCESS_KEY", "the-key");
  vi.stubEnv("PREVIEW_COOKIE_SECRET", SECRET);
}

function request(url: string, cookieValue?: string): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    headers: cookieValue ? { cookie: `${PREVIEW_COOKIE_NAME}=${cookieValue}` } : undefined,
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("evaluatePreviewGate — disabled", () => {
  it("passes every request through untouched when the gate is disabled", async () => {
    vi.stubEnv("PREVIEW_GATE_ENABLED", "false");
    expect(await evaluatePreviewGate(request("/journey"))).toBeNull();
    expect(await evaluatePreviewGate(request("/api/whatever"))).toBeNull();
  });
});

describe("evaluatePreviewGate — enabled, unauthorized", () => {
  it("redirects a protected page request to /preview-access with a returnTo", async () => {
    enableGate();
    const response = await evaluatePreviewGate(request("/journey?tab=actions"));
    expect(response).not.toBeNull();
    expect(response!.status).toBe(307);
    const location = new URL(response!.headers.get("location")!);
    expect(location.pathname).toBe("/preview-access");
    expect(location.searchParams.get("returnTo")).toBe("/journey?tab=actions");
  });

  it("omits returnTo when the original destination is the root", async () => {
    enableGate();
    const response = await evaluatePreviewGate(request("/"));
    const location = new URL(response!.headers.get("location")!);
    expect(location.searchParams.has("returnTo")).toBe(false);
  });

  it("returns a JSON 401 for an unauthorized API request instead of a redirect", async () => {
    enableGate();
    const response = await evaluatePreviewGate(request("/api/something"));
    expect(response!.status).toBe(401);
    const body = await response!.json();
    expect(body).toEqual({
      error: { code: "PREVIEW_ACCESS_REQUIRED", message: "Preview access is required." },
    });
  });

  it("rejects a malformed or expired cookie the same way as a missing one", async () => {
    enableGate();
    const expired = await createPreviewToken(SECRET, Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 60);
    const response = await evaluatePreviewGate(request("/journey", expired));
    expect(response!.status).toBe(307);
  });
});

describe("evaluatePreviewGate — enabled, authorized", () => {
  it("passes through when a valid signed cookie is present", async () => {
    enableGate();
    const token = await createPreviewToken(SECRET);
    expect(await evaluatePreviewGate(request("/journey", token))).toBeNull();
  });

  it("rejects a cookie signed with a different secret (rotation invalidates it)", async () => {
    enableGate();
    const token = await createPreviewToken("a-different-secret");
    const response = await evaluatePreviewGate(request("/journey", token));
    expect(response!.status).toBe(307);
  });
});

describe("evaluatePreviewGate — the access page itself", () => {
  it("is always reachable, with or without a cookie", async () => {
    enableGate();
    expect(await evaluatePreviewGate(request("/preview-access"))).toBeNull();
    const token = await createPreviewToken(SECRET);
    expect(await evaluatePreviewGate(request("/preview-access", token))).toBeNull();
  });
});

describe("evaluatePreviewGate — misconfigured", () => {
  it("fails closed (503) for protected paths when secrets are missing", async () => {
    vi.stubEnv("PREVIEW_GATE_ENABLED", "true");
    vi.stubEnv("PREVIEW_ACCESS_KEY", "");
    vi.stubEnv("PREVIEW_COOKIE_SECRET", "");
    const response = await evaluatePreviewGate(request("/journey"));
    expect(response!.status).toBe(503);
  });

  it("returns a JSON 503 for API requests when misconfigured", async () => {
    vi.stubEnv("PREVIEW_GATE_ENABLED", "true");
    vi.stubEnv("PREVIEW_ACCESS_KEY", "");
    vi.stubEnv("PREVIEW_COOKIE_SECRET", "");
    const response = await evaluatePreviewGate(request("/api/something"));
    expect(response!.status).toBe(503);
    const body = await response!.json();
    expect(body.error.code).toBe("PREVIEW_GATE_MISCONFIGURED");
  });

  it("still lets the access page itself render (to show a safe error state)", async () => {
    vi.stubEnv("PREVIEW_GATE_ENABLED", "true");
    vi.stubEnv("PREVIEW_ACCESS_KEY", "");
    vi.stubEnv("PREVIEW_COOKIE_SECRET", "");
    expect(await evaluatePreviewGate(request("/preview-access"))).toBeNull();
  });
});
