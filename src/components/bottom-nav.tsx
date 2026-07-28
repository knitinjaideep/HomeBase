"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/util";
import { getNavigationForMode, isNavItemActive } from "@/lib/workspace/navigation";
import type { ResolvedMode } from "@/lib/workspace/resolver";

<<<<<<< Updated upstream
const ITEMS = [
  { href: "/", label: "Journey", icon: JourneyIcon },
  { href: "/properties", label: "Homes", icon: HomesIcon },
  { href: "/toolkit", label: "Toolkit", icon: ToolkitIcon },
];
=======
type IconComponent = (props: { active: boolean }) => React.ReactElement;
>>>>>>> Stashed changes

/** Icons keyed by href — a presentation-only concern, kept separate from the pure nav config. */
const ICONS: Record<string, IconComponent> = {
  "/journey": JourneyIcon,
  "/properties": HomesIcon,
  "/toolkit": ToolkitIcon,
  "/homebase": HomeBaseIcon,
  "/maintenance": MaintenanceIcon,
  "/notes": NotesIcon,
};

<<<<<<< Updated upstream
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/journey");
  if (href === "/properties") return pathname.startsWith("/properties") || pathname.startsWith("/visit");
  if (href === "/toolkit") return TOOLKIT_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  return pathname === href;
}

/** The mobile primary nav. Three items only — Settings lives behind the top-bar icon. */
export function BottomNav() {
=======
/** The mobile primary nav. Items and destinations follow the active mode (see lib/workspace/navigation.ts). */
export function BottomNav({ mode }: { mode: ResolvedMode }) {
>>>>>>> Stashed changes
  const pathname = usePathname();
  const nav = getNavigationForMode(mode);

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-content items-stretch justify-around">
        {nav.map((item) => {
          const active = isNavItemActive(pathname, item);
          const Icon = ICONS[item.href] ?? HomeBaseIcon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                active ? "text-mode-accent" : "text-ink-subtle",
              )}
            >
              <Icon active={active} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function JourneyIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19V6a2 2 0 0 1 2-2h9l5 5v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

function HomesIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function ToolkitIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2Z" />
    </svg>
  );
}

function HomeBaseIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function MaintenanceIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v2H9z" />
      <path d="M9 13l2 2 4-4" />
    </svg>
  );
}

function NotesIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}
