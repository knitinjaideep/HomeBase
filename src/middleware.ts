import { type NextRequest } from "next/server";
import { evaluatePreviewGate } from "@/lib/preview-gate/gate";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // The preview gate is an outer layer: evaluated first, and only ever
  // blocks (redirect/JSON 401/503) or passes through untouched — it never
  // substitutes for Supabase auth, which still runs normally below.
  const previewGateResponse = await evaluatePreviewGate(request);
  if (previewGateResponse) return previewGateResponse;

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next static assets, the PWA manifest/icon
     * routes, robots.txt, and common static file extensions.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest|icon|apple-icon|robots|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
