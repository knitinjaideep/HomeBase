import { test, expect } from "@playwright/test";
import { signIn, createHousehold, skipTour, resetBackend } from "./helpers";

test("buyer: path selection through converting a purchased home into HomeBase", async ({ page }) => {
  await test.step("Select buyer path", async () => {
    await resetBackend();
    await signIn(page, "buyer-e2e@example.com");
    await createHousehold(page, "E2E Buyer Household");
    await page.getByRole("radio", { name: "I’m buying a home" }).check({ force: true });
    await page.getByRole("button", { name: "Continue" }).click();
  });

  await test.step("Choose first-time and partner", async () => {
    await page.getByRole("radio", { name: "First-time buyer" }).check({ force: true });
    await page.getByRole("radio", { name: "With a partner" }).check({ force: true });
    await page.getByRole("button", { name: "Enter HomeScope" }).click();
  });

  await test.step("Open Journey", async () => {
    await expect(page.getByRole("heading", { name: "Home Journey" })).toBeVisible();
    await skipTour(page);
  });

  await test.step("Complete a checklist item", async () => {
    // Activities are parallel — open any one from the Journey overview.
    await page.getByRole("link", { name: /^Strategy/ }).first().click();
    // Cycles not-started -> in-progress -> completed; wait for each persisted
    // state to land (the click handler closes over render-time status) before
    // clicking again, so the second click doesn't re-send the same transition.
    const checkbox = page.getByRole("checkbox", { name: /Mark ".*" complete/ }).first();
    await checkbox.click();
    await expect(checkbox).toHaveClass(/border-accent/);
    await checkbox.click();
    await expect(checkbox).toHaveAttribute("aria-checked", "true");
  });

  let propertyId = "";

  await test.step("Add candidate home", async () => {
    await page.goto("/properties?add=1");
    await page.getByLabel("Address").fill("123 E2E Test Street");
    await page.getByRole("button", { name: "Save property" }).click();
    await expect(page.getByText("123 E2E Test Street")).toBeVisible();
    // The whole row is an absolutely-positioned overlay <a> (full-row click
    // target) on top of the visible text — target the link, not the text.
    await page.getByRole("link", { name: "123 E2E Test Street" }).click();
    await expect(page).toHaveURL(/\/properties\/[^/]+$/);
    propertyId = page.url().split("/properties/")[1];
  });

  await test.step("Add visit note", async () => {
    await page.goto(`/visit/${propertyId}`);
    await page.getByLabel("Immediate repairs").fill("Check the roof before closing.");
    await page.getByRole("button", { name: "Save visit notes" }).click();
    await expect(page.getByRole("status").getByText("Saved", { exact: true })).toBeVisible();
  });

  await test.step("Upload document", async () => {
    await page.goto("/documents");
    await page.getByRole("button", { name: "Upload document" }).click();
    await page.getByLabel("Document name").fill("Inspection report");
    await page.setInputFiles('input[type="file"]', {
      name: "inspection.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("e2e fixture file"),
    });
    await page.getByRole("button", { name: "Add document" }).click();
    await expect(page.getByRole("button", { name: /Inspection report/ })).toBeVisible();
  });

  await test.step("Convert purchased home into HomeBase", async () => {
    await page.goto(`/properties/${propertyId}`);
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Workflow status").selectOption({ label: "Under contract" });
    await page.getByRole("button", { name: "Save property" }).click();

    await page.getByRole("button", { name: "I bought this home" }).click();
    await page.getByLabel("Closing date").fill("2026-06-01");
    await page.getByRole("button", { name: "Confirm purchase" }).click();

    // Switching to homeowner mode flips the active mode immediately, so the
    // dialog hands off to /homebase (a buyer-only page can't stay mounted
    // once WorkspaceGate reacts) — which shows the optional starter-templates
    // step itself on arrival.
    await expect(page).toHaveURL(/\/homebase$/);
    await page.getByRole("button", { name: "Cancel" }).click();
  });
});
