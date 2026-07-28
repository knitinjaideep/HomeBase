import Link from "next/link";

/**
 * The welcome page's single hero: eyebrow, H1, two short lines of copy, and
 * the two primary actions. No buyer/homeowner framing here — that only
 * appears after "Get started" is clicked (see GetStartedView). The mint
 * (accent) and amber (caution) glows hint at the two experiences without
 * naming them yet, using the app's own dark-mode brand colors (see
 * PublicWelcomePage's `dark` wrapper) rather than inventing a new palette.
 */
export function WelcomeHero() {
  return (
    <section className="relative overflow-hidden">
      <BackdropGlow />
      <div className="relative mx-auto max-w-content px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <div className="animate-rise mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-accent">
            Your home journey, in one place.
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
            From finding a home to caring for it.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            A private, notes-first place to keep the questions, visits, decisions, documents,
            repairs, and memories connected to your home.
          </p>
          <p className="mt-2 text-sm text-ink-subtle">Start where you are today.</p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/get-started"
              className="group inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
            >
              Get started
              <ArrowIcon className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-lg border border-line px-6 text-sm font-medium text-ink transition-colors hover:bg-surface-muted sm:w-auto"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Soft, still glows — no motion beyond the page's own gentle reveal. */
function BackdropGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(60% 50% at 15% -10%, rgb(var(--accent) / 0.22), transparent 70%), " +
          "radial-gradient(55% 50% at 100% 10%, rgb(var(--caution) / 0.18), transparent 72%)",
      }}
    />
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
