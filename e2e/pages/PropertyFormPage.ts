import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object for the Add-Property flow: dashboard tab -> wizard -> the
 * multi-step PropertyForm. Encapsulates the custom <Select> (portal listbox)
 * and the label-derived `data-testid`s on each Field.
 */
export class PropertyFormPage {
  constructor(private readonly page: Page) {}

  private get main(): Locator {
    return this.page.locator("main");
  }

  /** Open the wizard from the agent dashboard. */
  async openWizard(): Promise<void> {
    await this.page.goto("/agent/dashboard");
    await this.page.getByRole("button", { name: "Add New Property" }).click();
    await expect(
      this.page.getByRole("heading", { name: "List Your Property" })
    ).toBeVisible();
  }

  /** Pick purpose/category/(listing type) and continue into the form. */
  async chooseFlow(
    purpose: string,
    category: string,
    listingType?: string
  ): Promise<void> {
    await this.main.getByRole("button", { name: new RegExp(purpose, "i") }).click();
    await this.main.getByRole("button", { name: new RegExp(category, "i") }).click();
    if (listingType) {
      await this.main
        .getByRole("button", { name: new RegExp(listingType, "i") })
        .click();
    }
    await this.page.getByRole("button", { name: /continue to form/i }).click();
    await expect(
      this.page.getByRole("heading", { name: "Add New Property" })
    ).toBeVisible();
  }

  field(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /** Fill a text/number/textarea input inside a Field. */
  async fill(fieldTestId: string, value: string): Promise<void> {
    await this.field(fieldTestId).locator("input, textarea").first().fill(value);
  }

  /** Choose an option in a custom <Select> inside a Field. */
  async select(fieldTestId: string, optionLabel: string | RegExp): Promise<void> {
    const field = this.field(fieldTestId);
    // Pre-scroll the field into view while the menu is CLOSED. The Select closes
    // itself on any page scroll, so if we let Playwright auto-scroll during the
    // option click the menu would detach mid-click.
    await field.scrollIntoViewIfNeeded();
    await field.getByRole("button").first().click();

    const menu = this.page.getByRole("listbox");
    await expect(menu).toBeVisible();
    await menu
      .getByRole("option", {
        name:
          typeof optionLabel === "string" ? new RegExp(optionLabel, "i") : optionLabel,
      })
      .first()
      .click();
  }

  next(): Promise<void> {
    return this.page.getByTestId("form-next").click();
  }
  prev(): Promise<void> {
    return this.page.getByTestId("form-prev").click();
  }
  submit(): Promise<void> {
    return this.page.getByTestId("form-submit").click();
  }

  /** The inline validation error banner. */
  error(): Locator {
    return this.page.getByTestId("form-error");
  }

  successScreen(): Locator {
    return this.page.getByTestId("property-submitted");
  }
}
