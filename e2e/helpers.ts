import type { Page } from "@playwright/test";
import { MOCK_URL } from "./constants";

/**
 * Clears the mock backend's in-memory state. Playwright runs this suite
 * with a single worker, but the mock server is one process for the whole
 * run — without this, the second spec would inherit the first spec's
 * already-onboarded household and skip straight past its own onboarding.
 */
export async function resetBackend() {
  await fetch(`${MOCK_URL}/__reset`, { method: "POST" });
}

/** Signs in via the OTP form against the mock auth server (any code succeeds). */
export async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send sign-in code" }).click();
  await page.getByLabel("Code").fill("123456");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
}

/** Creates a brand-new household via the onboarding screen every fresh e2e account sees. */
export async function createHousehold(page: Page, name: string) {
  await page.getByRole("button", { name: "Create a household" }).click();
  await page.getByLabel("Household name").fill(name);
  await page.getByRole("button", { name: "Create household" }).click();
}

/** Dismisses the first-run product tour (it must be skippable — see the tour steps' spec). */
export async function skipTour(page: Page) {
  await page.getByRole("button", { name: "Skip" }).click();
}
