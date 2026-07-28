import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/auth/callback", "/get-started"];

/**
 * Refreshes the Supabase session cookie and redirects unauthenticated requests to
 * /login — except for the public paths above. "/" and "/get-started" are public
 * so a logged-out visitor sees the welcome page / path selection instead of
 * being bounced to /login; each of those pages does its own server-side check
 * to send an *authenticated* visitor into the app (see src/app/page.tsx and
 * src/app/get-started/page.tsx) rather than duplicating that logic here.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run any logic between createServerClient and getUser().
  // A hanging session refresh is a hard-to-diagnose bug per Supabase's own
  // guidance — keep this call immediately after client creation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (path !== "/") url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = request.nextUrl.searchParams.get("redirectTo") || "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
