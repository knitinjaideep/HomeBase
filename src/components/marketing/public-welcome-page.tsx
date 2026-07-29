import { PublicLandingHeader } from "./public-landing-header";
import { LandingHero } from "./landing-hero";
import { LandingSparkles } from "./landing-sparkles";
import { LandingValueRow } from "./landing-value-row";
import { LandingQuickTour } from "./landing-quick-tour";
import { PublicFooter } from "./public-footer";

/**
 * The logged-out root ("/"). Deliberately calm and simple — no buyer/
 * homeowner cards, no app navigation, no account data. Those choices only
 * appear after "Get started" (see GetStartedView on /get-started).
 *
 * The whole page — header through footer — shares one `.landing-page`
 * background layer (see globals.css), sized to one viewport
 * (`min-height: 100svh`) so header, hero, value row, quick tour, and footer
 * all fit on one screen on typical laptop/desktop heights without a scroll —
 * only a genuinely short viewport (e.g. landscape phone) grows past it,
 * since it's a `min-height`, not a fixed one. The image's own overlay
 * gradient (globals.css) fades toward solid by the bottom of that space, so
 * it reads as one continuous background rather than a hero-only insert.
 * Picks its image and overlay purely from the ancestor `.dark` class the
 * rest of the app already toggles (lib/theme.ts) — no second theme system,
 * and the browser never fetches the inactive theme's image since the
 * non-matching CSS rule simply never applies.
 */
export function PublicWelcomePage() {
  return (
    <div className="landing-page relative flex flex-col overflow-hidden bg-canvas text-ink">
      <div className="landing-page__visual" aria-hidden="true" />
      <LandingSparkles />
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-content px-4 pt-3 sm:px-6 sm:pt-4">
          <PublicLandingHeader />
        </div>
        <main className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-center">
            <LandingHero />
          </div>
          <LandingValueRow />
          <LandingQuickTour />
        </main>
        <PublicFooter />
      </div>
    </div>
  );
}
