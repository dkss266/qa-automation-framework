const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * EmployeeJobDetailsPage
 * Represents the "Job" tab on an employee's detail page, where Job Title
 * and Employment Status are edited.
 */
class EmployeeJobDetailsPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.jobTab = page.locator('a.oxd-topbar-body-nav-tab-item, .orangehrm-tabs-item', { hasText: 'Job' });
    this.jobTitleDropdown = page.locator('.oxd-input-group', { has: page.locator('label', { hasText: 'Job Title' }) }).locator('.oxd-select-text');
    this.employmentStatusDropdown = page.locator('.oxd-input-group', { has: page.locator('label', { hasText: 'Employment Status' }) }).locator('.oxd-select-text');
    this.dropdownOption = (text) => page.locator('.oxd-select-dropdown .oxd-select-option', { hasText: text });
    this.saveButton = page.locator('button[type="submit"]');
    this.successToast = page.locator('.oxd-toast-content--success');
  }

  async openJobTab() {
    await this.jobTab.click();
    await this.waitForSpinnerToDisappear();
  }

  /**
   * Update Job Title and Employment Status via the searchable dropdowns and save.
   * @param {string} jobTitle
   * @param {string} employmentStatus
   */
  async updateJobDetails(jobTitle, employmentStatus) {
    await this.jobTitleDropdown.click();
    await this.dropdownOption(jobTitle).click();

    await this.employmentStatusDropdown.click();
    await this.dropdownOption(employmentStatus).click();

    await this.saveButton.click();
    await this.waitForSpinnerToDisappear();
  }

  async verifyUpdateSuccessful() {
    await expect(this.successToast).toBeVisible({ timeout: 15_000 });
  }

  /** Read back the currently selected Job Title text (for UI-vs-API cross-check). */
  async getSelectedJobTitle() {
    return (await this.jobTitleDropdown.innerText()).trim();
  }

  /** Read back the currently selected Employment Status text (for UI-vs-API cross-check). */
  async getSelectedEmploymentStatus() {
    return (await this.employmentStatusDropdown.innerText()).trim();
  }
}

module.exports = { EmployeeJobDetailsPage };
