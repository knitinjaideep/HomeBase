/**
 * Server-only configuration for the temporary preview access gate. Reads
 * `PREVIEW_GATE_ENABLED` / `PREVIEW_ACCESS_KEY` / `PREVIEW_COOKIE_SECRET` —
 * never `NEXT_PUBLIC_*`, so none of this reaches the browser bundle.
 */

export class PreviewGateMisconfiguredError extends Error {
  constructor() {
    super("Preview gate is enabled but PREVIEW_ACCESS_KEY / PREVIEW_COOKIE_SECRET are not both set.");
    this.name = "PreviewGateMisconfiguredError";
  }
}

export type PreviewGateSecrets = {
  accessKey: string;
  cookieSecret: string;
};

/** Local development defaults to disabled unless the env var is explicitly "true". */
export function isPreviewGateEnabled(): boolean {
  return process.env.PREVIEW_GATE_ENABLED?.trim().toLowerCase() === "true";
}

/**
 * Throws {@link PreviewGateMisconfiguredError} rather than falling back to a
 * disabled state — the gate must fail closed (block access) when enabled but
 * missing a required secret, never fail open.
 */
export function getPreviewGateSecrets(): PreviewGateSecrets {
  const accessKey = process.env.PREVIEW_ACCESS_KEY?.trim();
  const cookieSecret = process.env.PREVIEW_COOKIE_SECRET?.trim();
  if (!accessKey || !cookieSecret) {
    throw new PreviewGateMisconfiguredError();
  }
  return { accessKey, cookieSecret };
}
