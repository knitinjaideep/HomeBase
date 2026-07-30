import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPreviewGateSecrets, isPreviewGateEnabled, PreviewGateMisconfiguredError } from "@/lib/preview-gate/config";
import { PREVIEW_COOKIE_NAME } from "@/lib/preview-gate/cookie";
import { verifyPreviewToken } from "@/lib/preview-gate/token";
import { sanitizeReturnTo } from "@/lib/preview-gate/return-to";
import { PreviewAccessForm } from "./preview-access-form";

/**
 * /preview-access — public (listed in Supabase middleware's public paths)
 * and exempt from the preview gate itself (lib/preview-gate/gate.ts). That
 * gate already redirects unauthorized visitors here with a `returnTo`; this
 * page's own job is just to render the form, bounce past itself once the
 * gate no longer applies, or show a safe "unavailable" state if the server
 * is misconfigured — it never duplicates the gate's own redirect decision.
 *
 * Deliberately styled with a forced `dark` wrapper (not the app's normal
 * light/dark toggle) — this is a temporary, deliberately vault-like screen
 * shown before anything else in the product, not a themed product surface.
 */
export default async function PreviewAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  if (!isPreviewGateEnabled()) {
    redirect("/");
  }

  const { returnTo } = await searchParams;
  const destination = sanitizeReturnTo(returnTo ?? null);

  let misconfigured = false;
  try {
    const secrets = getPreviewGateSecrets();
    const cookieStore = await cookies();
    const token = cookieStore.get(PREVIEW_COOKIE_NAME)?.value;
    if (token && (await verifyPreviewToken(token, secrets.cookieSecret))) {
      redirect(destination);
    }
  } catch (error) {
    if (error instanceof PreviewGateMisconfiguredError) {
      misconfigured = true;
    } else {
      throw error;
    }
  }

  return (
    <div className="dark relative flex min-h-screen flex-col overflow-hidden bg-canvas text-ink">
      <BackdropGlow />
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 flex items-center gap-2 font-display text-lg text-ink">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white"
          >
            H
          </span>
          HomeScope
        </div>

        <div className="w-full max-w-sm animate-fade-in rounded-xl border border-line bg-surface p-6 shadow-lg">
          <h1 className="font-display text-2xl text-ink">Private preview</h1>
          <p className="mt-2 text-sm text-ink-muted">
            This application is still being prepared. Enter your preview access key to continue.
          </p>

          {misconfigured ? (
            <p
              role="alert"
              className="mt-6 rounded-lg border border-critical/30 bg-critical/10 px-3.5 py-2.5 text-sm text-ink"
            >
              Preview access is temporarily unavailable. Please try again shortly.
            </p>
          ) : (
            <PreviewAccessForm returnTo={destination} />
          )}

          <p className="mt-6 text-xs text-ink-subtle">
            Entering the preview key doesn&rsquo;t sign you in — your account login may still be
            required afterward.
          </p>
        </div>
      </main>
    </div>
  );
}

/** Same restrained mint/amber glow as /get-started's BackdropGlow — the app's existing accent pairing. */
function BackdropGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(55% 45% at 18% 0%, rgb(var(--accent) / 0.16), transparent 70%), radial-gradient(50% 45% at 92% 12%, rgb(var(--caution) / 0.14), transparent 72%)",
      }}
    />
  );
}
