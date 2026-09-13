# OrangeHRM Employee Lifecycle - Playwright Automation

Automated end-to-end UI + API test suite for the **Employee Lifecycle Management**
scenario against the OrangeHRM demo site
(https://opensource-demo.orangehrmlive.com/), built with **Playwright + JavaScript**
and the **Page Object Model (POM)**.

## What it tests

Single, sequential end-to-end flow (`tests/employeeLifecycle.spec.js`), broken into
`test.step()` sections for a readable report:

1. **Login** with valid credentials and verify the dashboard loads.
2. **Add a new employee** (PIM > Add Employee) using **data-driven input** from
   `test-data/employees.json`, including a generated unique Employee Id and a
   **profile picture upload**. Verifies the record is created.
3. **Edit** the employee: search by Employee Id, open the **Job** tab, update
   **Job Title** and **Employment Status**, and verify the change is reflected.
4. **Validate via API**: calls OrangeHRM's internal PIM REST API
   (`/api/v2/pim/employees`, `/api/v2/pim/employees/{id}/job-details`) — reusing
   the already-authenticated browser session's cookies — and cross-checks the
   API response against what was entered/updated in the UI.
5. **Delete** the employee from the UI, then confirms the deletion both in the
   UI (search returns "No Records Found") and via the API (record no longer
   returned).
6. **Logout** and confirm the session is invalidated (a protected page redirects
   back to the login screen).

## Why the API step uses OrangeHRM's own internal API

OrangeHRM's Angular UI is itself powered by a session-cookie-authenticated REST
API under `/web/index.php/api/v2/...`. Rather than reverse-engineering a separate
HTTP login/CSRF handshake, `src/api/PimApiClient.js` reuses the Playwright
browser context's cookies (`context.storageState()`) to call that same API. This
is a realistic, commonly-used pattern for UI+API cross-validation and keeps the
API client fully decoupled from the page objects — if you'd rather point it at a
different API (e.g. ReqRes), only `PimApiClient.js` needs to change.

## Framework structure

```
qa-automation-framework/
├── playwright.config.js        # Test runner config: HTML report, video "on", base URL
├── package.json
├── test-data/
│   ├── employees.json          # Data-driven employee input
│   └── profile-picture.jpg     # Sample image used for the upload step
├── src/
│   ├── pages/                  # Page Object Model
│   │   ├── BasePage.js
│   │   ├── LoginPage.js
│   │   ├── DashboardPage.js
│   │   ├── AddEmployeePage.js
│   │   ├── PimListPage.js
│   │   └── EmployeeJobDetailsPage.js
│   ├── api/
│   │   └── PimApiClient.js     # Thin wrapper over the OrangeHRM PIM REST API
│   └── utils/
│       └── testData.js         # JSON loader + unique Employee Id generator
├── tests/
│   └── employeeLifecycle.spec.js
└── .github/workflows/playwright.yml   # Optional CI: runs the suite, uploads report + video
```

## Dependencies

- Node.js 18+ (Node 20 recommended)
- [`@playwright/test`](https://playwright.dev/) ^1.47 — test runner, assertions,
  browser automation, built-in HTML reporter, and video recording (all
  configured in `playwright.config.js`, no extra reporting library needed).

## Setup instructions

```bash
# 1. Unzip the project, then from inside the folder:
cd qa-automation-framework

# 2. Install dependencies
npm install

# 3. Install the Playwright browser binaries (one-time)
npx playwright install --with-deps chromium
```

## How to run the tests

```bash
# Headless run (default) — matches CI
npm test

# Watch it run in a real browser window
npm run test:headed

# Step through interactively with the Playwright Inspector
npm run test:debug

# Open the HTML report after a run
npm run report
```

After a run:
- **HTML report** → `test-results/html-report/index.html` (opened automatically
  via `npm run report`, or open the file directly in a browser).
- **Video of the run** → `test-results/artifacts/**/video.webm` (recorded for
  every test, per `use.video: 'on'` in `playwright.config.js`).
- **Trace / screenshots on failure** → same `test-results/artifacts/` folder.

## Notes

- The suite runs as a single sequential scenario (`workers: 1`,
  `fullyParallel: false`) because each step depends on the employee created in
  the previous one.
- A fresh, timestamp-based Employee Id (e.g. `QA45012233`) is generated on every
  run so re-running the suite never collides with a previously created record.
- Because the target is a shared public demo environment, occasional flakiness
  (slow responses, demo data resets) can happen — `retries: 1` is enabled in CI
  for that reason.
- If the site's demo data is ever reset in a way that changes dropdown option
  values (e.g. "QA Engineer" no longer exists in Job Title), just update
  `test-data/employees.json` to values currently available in the app.
