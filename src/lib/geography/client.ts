import type { GeographyResult } from "./search";

export type GeographySearchFn = (query: string, state?: string, signal?: AbortSignal) => Promise<GeographyResult[]>;

/** Browser-side search: calls HomeScope's own endpoint, which reads Supabase. Never Census. */
export const searchGeographiesApi: GeographySearchFn = async (query, state, signal) => {
  const params = new URLSearchParams({ q: query, limit: "10" });
  if (state) params.set("state", state);
  const res = await fetch(`/api/geographies/search?${params}`, { signal });
  if (!res.ok) throw new Error(`Location search failed (${res.status})`);
  const body = (await res.json()) as { results: GeographyResult[] };
  return body.results;
};
