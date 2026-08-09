import { test, expect } from "@playwright/test";
import { signIn, createHousehold, skipTour, resetBackend } from "./helpers";

test("homeowner: path selection through viewing upcoming work", async ({ page }) => {
  await test.step("Select homeowner path", async () => {
    await resetBackend();
    await signIn(page, "owner-e2e@example.com");
    await createHousehold(page, "E2E Owner Household");
    await page.getByRole("radio", { name: "I own a home" }).check({ force: true });
    await page.getByRole("button", { name: "Continue" }).click();
  });

  await test.step("Finish owner onboarding", async () => {
    await page.getByRole("button", { name: "Enter HomeScope" }).click();
    await expect(page.getByRole("heading", { name: /HomeBase/i })).toBeVisible();
    await skipTour(page);
  });

  await test.step("Add home", async () => {
    await page.getByLabel("Name").fill("E2E Test Home");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Home overview saved.")).toBeVisible();
  });

  await test.step("Add maintenance item", async () => {
    await page.getByRole("link", { name: "Add maintenance item" }).click();
    await page.getByLabel("Title").fill("Replace HVAC filter");
    await page.getByRole("button", { name: "Add maintenance item" }).click();
    await expect(page.getByText("Replace HVAC filter")).toBeVisible();
  });

  await test.step("Complete maintenance", async () => {
    await page
      .locator("li", { hasText: "Replace HVAC filter" })
      .getByRole("button", { name: "Complete" })
      .click();
    await page.getByLabel("What was done").fill("Replaced the filter.");
    await page.getByRole("button", { name: "Save completion" }).click();
    await expect(page.getByText("Maintenance recorded.")).toBeVisible();
  });

  await test.step("Add repair note", async () => {
    await page.getByRole("button", { name: "Repairs & projects" }).click();
    await page.getByRole("button", { name: "Add repair / project" }).click();
    await page.getByLabel("Title").fill("Repaint exterior trim");
    await page.getByRole("button", { name: "Add repair / project" }).click();
    await expect(page.getByText("Repaint exterior trim")).toBeVisible();

    await page.getByText("Repaint exterior trim").click();
    await page.getByRole("button", { name: "Add note" }).click();
    await page.getByLabel("Note", { exact: true }).fill("Contractor quoted two coats, five-day turnaround.");
    await page.getByRole("button", { name: "Save note" }).click();
    await expect(page.getByText("Note added.")).toBeVisible();
  });

  await test.step("Upload receipt", async () => {
    await page.goto("/documents");
    await page.getByRole("button", { name: "Upload document" }).click();
    await page.getByLabel("Document name").fill("HVAC filter receipt");
    await page.getByLabel("Category").last().selectOption({ label: "Receipt" });
    await page.setInputFiles('input[type="file"]', {
      name: "receipt.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("e2e fixture receipt"),
    });
    await page.getByRole("button", { name: "Add document" }).click();
    await expect(page.getByRole("button", { name: /HVAC filter receipt/ })).toBeVisible();
  });

  await test.step("View upcoming work", async () => {
    await page.goto("/homebase");
    await expect(page.getByText("Next & upcoming maintenance")).toBeVisible();
  });
});
