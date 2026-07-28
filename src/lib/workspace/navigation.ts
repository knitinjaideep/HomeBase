/**
 * The single source of truth for which primary destinations exist per mode,
 * which route a user should land on by default, and whether a given route is
 * allowed in the active mode. `AppNav`/`BottomNav` render from
 * `getNavigationForMode`; `WorkspaceGate` enforces `isRouteAvailableForMode`
 * and redirects to `getDefaultRouteForMode` — see docs/WORKSPACE_MODE.md for
 * why mode itself is resolved elsewhere (the resolver/gate). This file only
 * decides navigation and route access, never mode.
 */

import type { ResolvedMode } from "./resolver";

export interface NavItem {
  href: string;
  label: string;
  /** Route prefixes this item is also "active" for (a hub page reached via several URLs). Defaults to [href]. */
  matchPrefixes?: string[];
}

/** Preserved unchanged from the pre-existing buyer nav — only "Notes" is new. */
const BUYER_NAV: NavItem[] = [
  { href: "/journey", label: "Journey" },
  { href: "/properties", label: "Homes", matchPrefixes: ["/properties", "/visit"] },
  { href: "/notes", label: "Notes" },
  {
    href: "/toolkit",
    label: "Toolkit",
    matchPrefixes: ["/toolkit", "/compare", "/finances", "/lenders", "/professionals", "/resources", "/timeline"],
  },
];

/** All new: the homeowner experience has no pre-existing nav to preserve. */
const OWNER_NAV: NavItem[] = [
  { href: "/homebase", label: "HomeBase" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/notes", label: "Notes" },
];

/** Route prefixes exclusive to buying. Anything not listed here or below is shared. */
const BUYER_ONLY_PREFIXES = [
  "/journey",
  "/properties",
  "/visit",
  "/compare",
  "/finances",
  "/lenders",
  "/professionals",
  "/resources",
  "/timeline",
  "/toolkit",
];

/** Route prefixes exclusive to owning. */
const OWNER_ONLY_PREFIXES = ["/homebase", "/maintenance"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** The primary nav destinations for the given mode. Falls back to the buyer shape when mode is unselected. */
export function getNavigationForMode(mode: ResolvedMode): NavItem[] {
  return mode === "owning" ? OWNER_NAV : BUYER_NAV;
}

/** Where a user in this mode should land when no more specific route applies. */
export function getDefaultRouteForMode(mode: ResolvedMode): string {
  return mode === "owning" ? "/homebase" : "/journey";
}

/** Whether `pathname` is reachable in `mode` — false only for the other mode's exclusive routes. */
export function isRouteAvailableForMode(pathname: string, mode: ResolvedMode): boolean {
  if (mode === "owning" && matchesPrefix(pathname, BUYER_ONLY_PREFIXES)) return false;
  if (mode !== "owning" && matchesPrefix(pathname, OWNER_ONLY_PREFIXES)) return false;
  return true;
}

/** Whether a nav item should render as the active destination for `pathname`. */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
  return matchesPrefix(pathname, item.matchPrefixes ?? [item.href]);
}
