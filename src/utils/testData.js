const fs = require('fs');
const path = require('path');

/**
 * Load the data-driven employee records from test-data/employees.json.
 * @returns {Array<object>}
 */
function loadEmployees() {
  const filePath = path.join(__dirname, '..', '..', 'test-data', 'employees.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Generate a unique, traceable Employee Id for this test run so repeated
 * executions never collide with previously created records.
 * Format: QA + last 8 digits of epoch millis, e.g. "QA45012233"
 */
function generateUniqueEmployeeId() {
  const epoch = Date.now().toString();
  return `QA${epoch.slice(-8)}`;
}

/** Absolute path to the sample profile picture used for the upload step. */
function profilePicturePath() {
  return path.join(__dirname, '..', '..', 'test-data', 'profile-picture.jpg');
}

module.exports = { loadEmployees, generateUniqueEmployeeId, profilePicturePath };
