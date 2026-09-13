const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { LoginPage } = require('../src/pages/LoginPage');
const { DashboardPage } = require('../src/pages/DashboardPage');
const { AddEmployeePage } = require('../src/pages/AddEmployeePage');
const { PimListPage } = require('../src/pages/PimListPage');
const { EmployeeJobDetailsPage } = require('../src/pages/EmployeeJobDetailsPage');
const { PimApiClient } = require('../src/api/PimApiClient');
const { loadEmployees, generateUniqueEmployeeId, profilePicturePath } = require('../src/utils/testData');

const VALID_USERNAME = 'Admin';
const VALID_PASSWORD = 'admin123';

test.describe('OrangeHRM - Employee Lifecycle Management (E2E)', () => {
  const [employeeData] = loadEmployees();
  const employeeId = generateUniqueEmployeeId();
  const fullName = `${employeeData.firstName} ${employeeData.lastName}`;

  test('Login -> Add Employee -> Edit -> Validate via API -> Delete -> Logout', async ({ page, context }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const addEmployeePage = new AddEmployeePage(page);
    const pimListPage = new PimListPage(page);
    const jobDetailsPage = new EmployeeJobDetailsPage(page);

    // ---------- 1. Login ----------
    await test.step('Login with valid credentials', async () => {
      await loginPage.open();
      await loginPage.login(VALID_USERNAME, VALID_PASSWORD);
      await dashboardPage.verifyLoginSuccessful();
    });

    // ---------- 2. Add a New Employee (data-driven + picture upload) ----------
    await test.step('Add a new employee via PIM > Add Employee (data-driven)', async () => {
      await dashboardPage.navigateToPim();
      await addEmployeePage.open();
      await addEmployeePage.addEmployee(employeeData, employeeId, profilePicturePath());
      await addEmployeePage.verifyEmployeeCreated(fullName);
    });

    // ---------- 3. Edit Employee Information ----------
    await test.step('Search for the new employee and update Job Title / Employment Status', async () => {
      await pimListPage.open();
      await pimListPage.searchByEmployeeId(employeeId);
      await pimListPage.openFirstResult();

      await jobDetailsPage.openJobTab();
      await jobDetailsPage.updateJobDetails(
        employeeData.updatedJobTitle,
        employeeData.updatedEmploymentStatus
      );
      await jobDetailsPage.verifyUpdateSuccessful();

      const selectedJobTitle = await jobDetailsPage.getSelectedJobTitle();
      const selectedEmploymentStatus = await jobDetailsPage.getSelectedEmploymentStatus();
      expect(selectedJobTitle, 'Job Title should reflect the update in the UI').toContain(
        employeeData.updatedJobTitle
      );
      expect(
        selectedEmploymentStatus,
        'Employment Status should reflect the update in the UI'
      ).toContain(employeeData.updatedEmploymentStatus);
    });

    // ---------- 4. Validate Employee via API (cross-check UI vs API) ----------
    let empNumber;
    await test.step('Validate the employee details via the PIM REST API', async () => {
      // Reuse the already-authenticated session's cookies for API calls.
      const apiContext = await playwrightRequest.newContext({
        baseURL: 'https://opensource-demo.orangehrmlive.com',
        storageState: await context.storageState(),
      });
      const apiClient = new PimApiClient(apiContext);

      const employeeRecord = await apiClient.getEmployeeByEmployeeId(employeeId);
      expect(employeeRecord, 'Employee should be found via API after creation').not.toBeNull();
      expect(employeeRecord.firstName, 'API firstName should match UI input').toBe(
        employeeData.firstName
      );
      expect(employeeRecord.lastName, 'API lastName should match UI input').toBe(
        employeeData.lastName
      );

      empNumber = employeeRecord.empNumber;

      const jobDetails = await apiClient.getEmployeeJobDetails(empNumber);
      expect(
        jobDetails.data?.jobTitle?.title,
        'API job title should match the value updated in the UI'
      ).toBe(employeeData.updatedJobTitle);

      await apiContext.dispose();
    });

    // ---------- 5. Delete the Employee ----------
    await test.step('Delete the employee from the UI and verify via UI + API', async () => {
      await pimListPage.open();
      await pimListPage.searchByEmployeeId(employeeId);
      await pimListPage.deleteFirstResult();
      await pimListPage.verifyDeleteSuccessToastVisible();

      await pimListPage.open();
      await pimListPage.searchByEmployeeId(employeeId);
      await pimListPage.verifyNoRecordsFound();

      // Cross-check deletion via the API as well.
      const apiContext = await playwrightRequest.newContext({
        baseURL: 'https://opensource-demo.orangehrmlive.com',
        storageState: await context.storageState(),
      });
      const apiClient = new PimApiClient(apiContext);
      const deletedRecord = await apiClient.getEmployeeByEmployeeId(employeeId);
      expect(deletedRecord, 'Employee should no longer be returned by the API after deletion').toBeNull();
      await apiContext.dispose();
    });

    // ---------- 6. Logout ----------
    await test.step('Logout and confirm the session is invalidated', async () => {
      await dashboardPage.logout();
      await dashboardPage.verifyLogoutSuccessful();

      // Confirm the session is truly invalidated: a protected route should
      // bounce back to the login page instead of loading the dashboard.
      await page.goto('/web/index.php/pim/viewEmployeeList');
      await expect(page).toHaveURL(/login/, { timeout: 15_000 });
    });
  });
});
