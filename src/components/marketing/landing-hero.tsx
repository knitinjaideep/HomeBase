import Link from "next/link";

/**
 * The welcome page's single hero: eyebrow, H1, supporting copy, and the two
 * primary actions (Get started / Log in). No buyer/homeowner framing here —
 * that only appears after "Get started" (see GetStartedView on /get-started;
 * public-welcome-page.test.tsx asserts this page never shows that choice).
 * Sits directly on the shared `.landing-page` background artwork, vertically
 * centered by its parent (see PublicWelcomePage) — no background/glow of its
 * own. Kept deliberately compact (small gaps, a capped headline size) so the
 * value row, quick tour, and footer below it fit in the same viewport as the
 * hero on typical screens instead of requiring a scroll. The headline uses a
 * `clamp()` size (not fixed breakpoint jumps) so it scales smoothly with
 * viewport width instead of stepping.
 */
export function LandingHero() {
  return (
    <div className="mx-auto w-full max-w-content px-4 py-4 sm:px-6 sm:py-6">
      <div className="animate-rise mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">
          Your home. Your notes. Your journey.
        </p>
        <h1 className="mt-2 text-balance font-display leading-[1.1] text-ink text-[clamp(1.75rem,3vw+1rem,3.125rem)]">
          One place for the home you&rsquo;re finding or caring for.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
          Keep the notes, decisions, documents, questions, repairs, and memories that make a home
          yours.
        </p>

        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/get-started"
            className="group inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
          >
            Get started
            <ArrowIcon className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-lg border border-line bg-surface/70 px-6 text-sm font-medium text-ink backdrop-blur-sm transition-colors hover:bg-surface-muted sm:w-auto"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
