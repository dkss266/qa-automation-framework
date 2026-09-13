const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * LoginPage
 * Handles login and logout flows for the OrangeHRM demo application.
 */
class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorAlert = page.locator('.oxd-alert-content-text');
  }

  async open() {
    await this.goto('/web/index.php/auth/login');
  }

  /**
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    await expect(this.usernameInput).toBeVisible();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.waitForSpinnerToDisappear();
  }
}

module.exports = { LoginPage };
