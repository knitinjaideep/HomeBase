import { sha256Hex } from "./crypto";

export type PreviewGateAttemptResult = "success" | "failure" | "rate_limited";

/** Never log the submitted/configured key or the identifier in the clear. */
export async function logPreviewGateAttempt(
  result: PreviewGateAttemptResult,
  identifier: string,
): Promise<void> {
  const redactedIdentifier = (await sha256Hex(identifier)).slice(0, 12);
  const entry = {
    event: "preview_gate_attempt",
    result,
    identifier: redactedIdentifier,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    at: new Date().toISOString(),
  };
  if (result === "success") {
    console.info(JSON.stringify(entry));
  } else {
    console.warn(JSON.stringify(entry));
  }
}
