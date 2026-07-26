import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
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
