const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * DashboardPage
 * Represents the post-login dashboard and the top navbar (user menu / logout).
 */
class DashboardPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.dashboardHeader = page.locator('h6', { hasText: 'Dashboard' });
    this.userDropdown = page.locator('.oxd-userdropdown-tab');
    this.logoutLink = page.locator('a', { hasText: 'Logout' });
    this.pimMenuItem = page.locator('a.oxd-main-menu-item', { hasText: 'PIM' });
  }

  /** Assert that login succeeded by checking dashboard visibility. */
  async verifyLoginSuccessful() {
    await expect(this.page).toHaveURL(/dashboard/, { timeout: 15_000 });
    await expect(this.dashboardHeader).toBeVisible({ timeout: 15_000 });
  }

  async navigateToPim() {
    await this.pimMenuItem.click();
    await this.waitForSpinnerToDisappear();
  }

  async logout() {
    await this.userDropdown.click();
    await this.logoutLink.click();
    await this.waitForSpinnerToDisappear();
  }

  /** Assert that logout succeeded and the session no longer has access to protected pages. */
  async verifyLogoutSuccessful() {
    await expect(this.page).toHaveURL(/login/, { timeout: 15_000 });
    await expect(this.page.locator('input[name="username"]')).toBeVisible();
  }
}

module.exports = { DashboardPage };
