import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchGeographies } from "@/lib/geography/search";

/**
 * GET /api/geographies/search?q=princ&state=NJ&limit=8
 *
 * Location autocomplete for signed-in users. Reads only the `geographies`
 * table in Supabase — the Census API is never called from here (or from the
 * browser); it is only used by the sync command.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  try {
    const results = await searchGeographies(supabase, {
      query: (params.get("q") ?? "").slice(0, 80),
      state: params.get("state") ?? undefined,
      limit: Number(params.get("limit")) || undefined,
    });
    return NextResponse.json({ results }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("Geography search failed", err);
    return NextResponse.json({ error: "Search is unavailable right now" }, { status: 500 });
  }
}
