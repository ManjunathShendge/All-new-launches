import { test, expect } from "@playwright/test";
import { PropertyFormPage } from "./pages/PropertyFormPage";
import { adminClient, cleanupE2EProperties } from "./helpers/db";
import { E2E_TITLE_PREFIX } from "./helpers/env";

test.describe("Add Property — residential sale", () => {
  test.afterAll(async () => {
    await cleanupE2EProperties();
  });

  test("wizard leads into the multi-step form", async ({ page }) => {
    const form = new PropertyFormPage(page);
    await form.openWizard();
    await form.chooseFlow("Sell", "Residential", "Single Unit");
    await expect(form.field("field-title")).toBeVisible();
    await expect(form.field("field-property-type")).toBeVisible();
  });

  test("blocks progress on an invalid core step", async ({ page }) => {
    const form = new PropertyFormPage(page);
    await form.openWizard();
    await form.chooseFlow("Sell", "Residential", "Single Unit");

    // Too-short title -> validation error, stay on core.
    await form.fill("field-title", "abc");
    await form.next();
    await expect(form.error()).toContainText(/min 5 chars/i);

    // Fix title but leave property type empty -> next error.
    await form.fill("field-title", "A Valid Enough Title");
    await form.next();
    await expect(form.error()).toContainText(/property type/i);
  });

  test("creates a listing end-to-end and persists correct data", async ({ page }) => {
    const title = `${E2E_TITLE_PREFIX} Playwright Villa ${Date.now()}`;
    const form = new PropertyFormPage(page);

    await form.openWizard();
    await form.chooseFlow("Sell", "Residential", "Single Unit");

    // 1. Core
    await form.fill("field-title", title);
    await form.select("field-property-type", "Apartment");
    await form.fill("field-expected-price", "5000000");
    await form.next();

    // 2. Physical (nothing required for residential)
    await form.next();

    // 3. Location
    await form.fill("field-city", "Bangalore");
    await form.fill("field-locality-micro-market", "Indiranagar");
    await form.next();

    // 4. Amenities & Legal (RERA only required for projects)
    await form.next();

    // 5. Media -> submit
    await form.submit();

    await expect(form.successScreen()).toBeVisible({ timeout: 20_000 });
    await expect(form.successScreen()).toContainText(/listed/i);

    // Verify what actually got written.
    const admin = adminClient();
    const { data } = await admin
      .from("properties")
      .select("title, status, transaction_type, property_category, price, city, locality")
      .eq("title", title)
      .maybeSingle();

    expect(data, "property should exist in the DB").not.toBeNull();
    expect(data?.status).toBe("pending"); // agent listings await approval
    expect(data?.transaction_type).toBe("sell");
    expect(data?.property_category).toBe("residential");
    expect(Number(data?.price)).toBe(5000000);
    expect(data?.city).toBe("Bangalore");
    expect(data?.locality).toBe("Indiranagar");
  });
});
