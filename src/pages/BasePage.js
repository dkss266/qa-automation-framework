/**
 * BasePage
 * Shared helpers for all Page Objects.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async waitForSpinnerToDisappear() {
    const spinner = this.page.locator('.oxd-loading-spinner');
    if (await spinner.count()) {
      await spinner.first().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    }
  }

  async goto(path = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.waitForSpinnerToDisappear();
  }
}

module.exports = { BasePage };
