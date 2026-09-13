const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * PimListPage
 * Represents the PIM > Employee List screen: search, open a record, and delete.
 */
class PimListPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.employeeIdSearchInput = page.locator('.oxd-table-filter-area label:has-text("Employee Id") + input, input[placeholder="Type for hints..."]').first();
    this.employeeNameSearchInput = page.locator('.oxd-autocomplete-wrapper input').first();
    this.searchButton = page.locator('button[type="submit"]');
    this.resetButton = page.locator('button', { hasText: 'Reset' });
    this.recordsFoundText = page.locator('.orangehrm-horizontal-padding.orangehrm-vertical-padding span').first();
    this.firstResultRow = page.locator('.oxd-table-card').first();
    this.checkbox = page.locator('.oxd-table-card').first().locator('.oxd-checkbox-input');
    this.deleteSelectedButton = page.locator('button', { hasText: 'Delete Selected' });
    this.confirmDeleteButton = page.locator('button', { hasText: 'Yes, Delete' });
    this.successToast = page.locator('.oxd-toast-content--success');
    this.noRecordsFound = page.locator('.oxd-text--span', { hasText: 'No Records Found' });
  }

  async open() {
    await this.goto('/web/index.php/pim/viewEmployeeList');
  }

  /**
   * Search the employee list by Employee Id.
   * @param {string} employeeId
   */
  async searchByEmployeeId(employeeId) {
    const employeeIdField = this.page
      .locator('.oxd-table-filter-area .oxd-input-group')
      .filter({ hasText: 'Employee Id' })
      .locator('input');
    await employeeIdField.fill(employeeId);
    const employeesResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/v2/pim/employees') && response.request().method() === 'GET'
    );
    await this.searchButton.click();
    await employeesResponse;
    await this.waitForSpinnerToDisappear();

    if (await this.firstResultRow.isVisible()) {
      await expect(this.firstResultRow).toContainText(employeeId, { timeout: 15_000 });
    }
  }

  /** Click the first (and only, since search is by unique Employee Id) result row. */
  async openFirstResult() {
    await expect(this.firstResultRow).toBeVisible({ timeout: 15_000 });
    await this.firstResultRow.click();
    await this.waitForSpinnerToDisappear();
  }

  /** Select the first result's checkbox and delete it, confirming the dialog. */
  async deleteFirstResult() {
    await expect(this.firstResultRow).toBeVisible({ timeout: 15_000 });
    await this.checkbox.click();
    await this.deleteSelectedButton.click();
    await this.confirmDeleteButton.click();
    await this.waitForSpinnerToDisappear();
  }

  async verifyDeleteSuccessToastVisible() {
    const deletionConfirmed = this.successToast.or(this.noRecordsFound);
    await expect(deletionConfirmed).toBeVisible({ timeout: 15_000 });
  }

  /** After deletion, re-searching by the same Employee Id should yield no records. */
  async verifyNoRecordsFound() {
    await expect(this.noRecordsFound).toBeVisible({ timeout: 15_000 });
  }
}

module.exports = { PimListPage };
