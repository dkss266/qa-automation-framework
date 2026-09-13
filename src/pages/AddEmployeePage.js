const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * AddEmployeePage
 * Handles PIM > Add Employee: filling the data-driven form and uploading a profile picture.
 */
class AddEmployeePage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.addEmployeeButton = page.locator('button', { hasText: 'Add' });
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.middleNameInput = page.locator('input[name="middleName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    // Scope the input to the form group because OrangeHRM renders the label as a div.
    this.employeeIdInput = page.locator('.oxd-input-group').filter({ hasText: 'Employee Id' }).locator('input');
    this.fileInput = page.locator('input[type="file"]');
    this.saveButton = page.locator('button[type="submit"]');
    this.successToast = page.locator('.oxd-toast-content--success');
    this.employeeFullNameHeader = page.locator('.orangehrm-edit-employee-name');
  }

  async open() {
    await this.addEmployeeButton.click();
    await this.waitForSpinnerToDisappear();
    await expect(this.page).toHaveURL(/addEmployee/);
  }

  /**
   * Fill and submit the Add Employee form using data-driven input.
   * @param {{firstName: string, middleName?: string, lastName: string}} employee
   * @param {string} employeeId - unique employee id to assign (overrides auto-generated value)
   * @param {string} profilePicturePath - absolute path to the image file to upload
   */
  async addEmployee(employee, employeeId, profilePicturePath) {
    await this.firstNameInput.fill(employee.firstName);
    if (employee.middleName) {
      await this.middleNameInput.fill(employee.middleName);
    }
    await this.lastNameInput.fill(employee.lastName);

    // Override the auto-generated Employee Id with our unique, traceable id.
    await this.employeeIdInput.fill('');
    await this.employeeIdInput.fill(employeeId);

    // Upload profile picture.
    await this.fileInput.setInputFiles(profilePicturePath);

    await this.saveButton.click();
    await this.waitForSpinnerToDisappear();
  }

  /** Verify the employee was created: URL moves to the Personal Details / edit page. */
  async verifyEmployeeCreated(fullName) {
    await expect(this.page).toHaveURL(/viewPersonalDetails|editEmployee/, { timeout: 20_000 });
    await expect(this.employeeFullNameHeader).toContainText(fullName, { timeout: 15_000 });
  }
}

module.exports = { AddEmployeePage };
