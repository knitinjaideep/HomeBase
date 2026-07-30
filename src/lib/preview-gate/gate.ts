import { NextResponse, type NextRequest } from "next/server";
import { getPreviewGateSecrets, isPreviewGateEnabled, PreviewGateMisconfiguredError } from "./config";
import { PREVIEW_COOKIE_NAME } from "./cookie";
import { verifyPreviewToken } from "./token";

// Framework static assets, PWA/manifest routes, and common image extensions
// never reach this module at all — src/middleware.ts's `config.matcher`
// excludes them before middleware runs. Only /preview-access needs a
// same-request exemption here.
const EXEMPT_PATHS = new Set(["/preview-access"]);

function isExemptPath(pathname: string): boolean {
  return EXEMPT_PATHS.has(pathname);
}

function isApiRequest(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function unauthorizedResponse(request: NextRequest): NextResponse {
  if (isApiRequest(request.nextUrl.pathname)) {
    return NextResponse.json(
      { error: { code: "PREVIEW_ACCESS_REQUIRED", message: "Preview access is required." } },
      { status: 401 },
    );
  }

  const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const url = request.nextUrl.clone();
  url.pathname = "/preview-access";
  url.search = "";
  if (destination !== "/") url.searchParams.set("returnTo", destination);
  return NextResponse.redirect(url);
}

function unavailableResponse(request: NextRequest): NextResponse {
  if (isApiRequest(request.nextUrl.pathname)) {
    return NextResponse.json(
      { error: { code: "PREVIEW_GATE_MISCONFIGURED", message: "Preview access is temporarily unavailable." } },
      { status: 503 },
    );
  }
  return new NextResponse("Preview access is temporarily unavailable. Please try again shortly.", {
    status: 503,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

/**
 * The outer preview-access layer, evaluated before Supabase session logic.
 * Returns `null` when the request should proceed untouched (gate disabled,
 * path exempt, or a valid signed cookie is present) — otherwise a response
 * that blocks the request.
 */
export async function evaluatePreviewGate(request: NextRequest): Promise<NextResponse | null> {
  if (!isPreviewGateEnabled()) return null;

  const pathname = request.nextUrl.pathname;

  let secrets;
  try {
    secrets = getPreviewGateSecrets();
  } catch (error) {
    if (error instanceof PreviewGateMisconfiguredError) {
      // Fail closed everywhere except the access page itself, which renders
      // its own safe "temporarily unavailable" state instead of a form.
      if (isExemptPath(pathname)) return null;
      return unavailableResponse(request);
    }
    throw error;
  }

  if (isExemptPath(pathname)) return null;

  const token = request.cookies.get(PREVIEW_COOKIE_NAME)?.value;
  if (token && (await verifyPreviewToken(token, secrets.cookieSecret))) {
    return null;
  }

  return unauthorizedResponse(request);
}
