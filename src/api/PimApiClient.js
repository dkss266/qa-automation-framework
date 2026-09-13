/**
 * PimApiClient
 *
 * OrangeHRM's Angular frontend is backed by a REST API under
 * /web/index.php/api/v2/... which is authenticated via the same session
 * cookie the UI uses. Rather than re-implementing login over HTTP (which
 * would require reverse-engineering CSRF/session handshakes outside of a
 * browser), this client reuses the *already logged-in* Playwright
 * BrowserContext's cookies (via context.request), which is the standard,
 * supported way to validate application state through its real API without
 * duplicating auth logic.
 *
 * If a different / public demo API (e.g. ReqRes) is substituted, only this
 * class needs to change — the test spec and page objects are unaffected.
 */
class PimApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request - an APIRequestContext
   *   that shares cookies with the already-authenticated page (see tests/employeeLifecycle.spec.js).
   */
  constructor(request) {
    this.request = request;
  }

  /**
   * Look up an employee by their Employee Id via the PIM employees API.
   * @param {string} employeeId
   * @returns {Promise<object|null>} the employee record, or null if not found
   */
  async getEmployeeByEmployeeId(employeeId) {
    const endpoint = '/web/index.php/api/v2/pim/employees';
    const response = await this.request.get(endpoint, {
      params: {
        employeeId,
        limit: 50,
        offset: 0,
      },
    });

    if (response.ok()) {
      const body = await response.json();
      const records = body.data || [];
      return records.length > 0 ? records[0] : null;
    }

    // The public demo can return 500 for the employeeId query filter.
    if (response.status() >= 500) {
      const fallbackResponse = await this.request.get(endpoint, {
        params: { limit: 1000, offset: 0 },
      });

      if (fallbackResponse.ok()) {
        const fallbackBody = await fallbackResponse.json();
        return (fallbackBody.data || []).find((record) => record.employeeId === employeeId) || null;
      }
    }

    if (!response.ok()) {
      throw new Error(`PIM employees API returned ${response.status()} ${response.statusText()}`);
    }
  }

  /**
   * Fetch full job/employment details for a given numeric employee number.
   * @param {number|string} empNumber
   */
  async getEmployeeJobDetails(empNumber) {
    const response = await this.request.get(
      `/web/index.php/api/v2/pim/employees/${empNumber}/job-details`
    );
    if (!response.ok()) {
      throw new Error(`Job details API returned ${response.status()} ${response.statusText()}`);
    }
    return response.json();
  }
}

module.exports = { PimApiClient };
