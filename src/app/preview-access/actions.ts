"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPreviewGateSecrets, isPreviewGateEnabled } from "@/lib/preview-gate/config";
import { PREVIEW_COOKIE_NAME, previewCookieOptions } from "@/lib/preview-gate/cookie";
import { createPreviewToken } from "@/lib/preview-gate/token";
import { timingSafeEqualStrings } from "@/lib/preview-gate/crypto";
import { sanitizeReturnTo } from "@/lib/preview-gate/return-to";
import { checkRateLimit, getClientIdentifier, resetRateLimit } from "@/lib/preview-gate/rate-limit";
import { logPreviewGateAttempt } from "@/lib/preview-gate/log";

export type PreviewAccessState = { error: string | null };

const GENERIC_INVALID_MESSAGE = "That access key is not valid.";
const RATE_LIMIT_MESSAGE = "Too many attempts. Please wait and try again.";
const MAX_KEY_LENGTH = 512;

export async function submitPreviewAccessKey(
  _prevState: PreviewAccessState,
  formData: FormData,
): Promise<PreviewAccessState> {
  if (!isPreviewGateEnabled()) {
    redirect("/");
  }

  const destination = sanitizeReturnTo(formData.get("returnTo")?.toString() ?? null);

  let secrets;
  try {
    secrets = getPreviewGateSecrets();
  } catch {
    // Misconfigured server — don't leak that detail to the visitor.
    return { error: GENERIC_INVALID_MESSAGE };
  }

  const headerList = await headers();
  const identifier = getClientIdentifier(headerList);

  if (!checkRateLimit(identifier).allowed) {
    await logPreviewGateAttempt("rate_limited", identifier);
    return { error: RATE_LIMIT_MESSAGE };
  }

  const submitted = formData.get("accessKey");
  const submittedKey = typeof submitted === "string" ? submitted.trim() : "";

  const isValid =
    submittedKey.length > 0 &&
    submittedKey.length <= MAX_KEY_LENGTH &&
    timingSafeEqualStrings(submittedKey, secrets.accessKey);

  if (!isValid) {
    await logPreviewGateAttempt("failure", identifier);
    return { error: GENERIC_INVALID_MESSAGE };
  }

  resetRateLimit(identifier);
  await logPreviewGateAttempt("success", identifier);

  const token = await createPreviewToken(secrets.cookieSecret);
  const cookieStore = await cookies();
  cookieStore.set(PREVIEW_COOKIE_NAME, token, previewCookieOptions());

  redirect(destination);
}
