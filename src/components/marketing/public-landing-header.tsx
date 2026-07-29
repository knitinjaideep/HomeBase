import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "#why-homescope", label: "Why HomeScope" },
  { href: "#how-it-works", label: "How it works" },
];

/**
 * The minimal header for the public landing page only. Deliberately separate
 * from `AppNav` (authenticated nav + sign-out) and simpler than the spec's
 * full mobile-menu ask — informational links just hide below `md` rather
 * than collapsing into a new hamburger pattern, since none exists elsewhere
 * in this app and the logo + Log in stay reachable either way.
 */
export function PublicLandingHeader() {
  return (
    <header className="relative z-10">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 rounded-2xl border border-line/40 bg-surface/35 px-4 py-2 shadow-sm backdrop-blur-xl sm:px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-lg text-ink">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white"
          >
            H
          </span>
          HomeScope
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex min-h-[2.75rem] items-center rounded-lg px-3.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink sm:px-4"
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}
