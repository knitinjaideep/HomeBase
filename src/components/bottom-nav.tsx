"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/util";

const ITEMS = [
  { href: "/journey", label: "Journey", icon: JourneyIcon },
  { href: "/properties", label: "Homes", icon: HomesIcon },
  { href: "/toolkit", label: "Toolkit", icon: ToolkitIcon },
];

const TOOLKIT_ROUTES = ["/toolkit", "/compare", "/finances", "/lenders", "/professionals", "/resources", "/timeline"];

function isActive(pathname: string, href: string): boolean {
  if (href === "/journey") return pathname.startsWith("/journey");
  if (href === "/properties") return pathname.startsWith("/properties") || pathname.startsWith("/visit");
  if (href === "/toolkit") return TOOLKIT_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  return pathname === href;
}

/** The mobile primary nav. Three items only — Settings lives behind the top-bar icon. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-content items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                active ? "text-accent" : "text-ink-subtle",
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
