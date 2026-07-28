import Link from "next/link";

/**
 * The minimal header shown only on the logged-out public pages (welcome,
 * get-started). Deliberately separate from `AppNav` — that one assumes an
 * authenticated household and carries nav links, a theme toggle, and sign-out;
 * this one only ever needs a wordmark and the two logged-out actions.
 */
export function PublicHeader() {
  return (
    <header className="relative z-10">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-5 sm:px-6 sm:py-7">
        <Link href="/" className="flex items-center gap-2 font-display text-lg text-ink">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white"
          >
            H
          </span>
          HomeScope
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-[2.75rem] items-center rounded-lg px-3.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:px-4"
          >
            Log in
          </Link>
          <Link
            href="/get-started"
            className="inline-flex min-h-[2.75rem] items-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
