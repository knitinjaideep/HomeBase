import { PublicHeader } from "./public-header";
import { WelcomeHero } from "./welcome-hero";
import { ProductPrinciples } from "./product-principles";
import { PublicFooter } from "./public-footer";

/**
 * The logged-out root ("/"). Deliberately calm and simple — no buyer/
 * homeowner cards, no app navigation, no account data. Those choices only
 * appear after "Get started" (see GetStartedView on /get-started).
 *
 * Wrapped in the app's own `.dark` class (not the user's theme preference) to
 * get the premium, editorial "deep charcoal + mint/amber glow" treatment the
 * design brief calls for, reusing the app's real dark-mode brand colors
 * (globals.css) rather than a second, one-off palette. Everything below the
 * hero renders with the same semantic tokens, so it inherits that same look.
 */
export function PublicWelcomePage() {
  return (
    <div className="dark flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />
      <main className="flex-1">
        <WelcomeHero />
        <ProductPrinciples />
      </main>
      <PublicFooter />
    </div>
  );
}
