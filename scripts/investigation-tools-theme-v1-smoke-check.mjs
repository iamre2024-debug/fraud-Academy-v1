import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const panel = fs.readFileSync(path.join(rootDir, 'src/InvestigationToolPanel.jsx'), 'utf8');
const businessPayrollWorkspace = fs.readFileSync(path.join(rootDir, 'src/data/businessPayrollWorkspace.js'), 'utf8');
const identityReport = fs.readFileSync(path.join(rootDir, 'src/data/identityIntelReport.js'), 'utf8');
const groups = fs.readFileSync(path.join(rootDir, 'src/investigationToolGroups.js'), 'utf8');
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const rail = fs.readFileSync(path.join(rootDir, 'src/CategoryTileRail.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayInvestigationToolsThemeV1.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/investigation-tools-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_INVESTIGATION_TOOLS_THEME_V1.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Investigation tools v1 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Investigation tools coupling or visible answer language: ${text}`);
}

for (const anchor of [
  'investigation-tools-theme-v1',
  'data-investigation-tools-screen="approved-theme-v1"',
  'Working question',
  'Search this tool',
  'Available {tool} records',
  'Expanded record',
  'Record history',
  'Connected objects',
  'Save expanded note',
  'Open Timeline',
  'Open Submit Decision',
  'It does not determine the case outcome.',
  'PaymentVerificationWorkspace',
  'Find the answer here',
  'Search Bank Code, Destination ID, account holder, status, match result, prior use, recovery, or action.',
  'Account Snapshot',
  'Old / prior account',
  'New destination',
  'Payroll / vendor change comparison',
  'Verification Call Drawer',
  'Action Panel',
  'Investigator Notes',
  'DeviceIntelligenceWorkspace',
  'Search a Device ID, fingerprint, browser, session, profile, wallet, or location to reveal device intelligence.',
  'Device Snapshot',
  'Run a device lookup to reveal',
  'Rooted / jailbroken',
  'Emulator-like indicator',
  'Shared device detection',
  'Wallet usage',
  'Normal behavior comparison',
  'Device History',
  'LoginHistoryWorkspace',
  'Every recorded login is available below.',
  'Recorded logins',
  'Failed / denied',
  'MFA events',
  'Authentication channel',
  'Session behavior',
  'Password reset timing',
  'Money movement link',
  'A successful MFA event is evidence of authentication activity, not a final conclusion about authorization.',
  'SessionHistoryWorkspace',
  'After login, what did the user do?',
  'Recorded sessions',
  'Normal logout',
  'Session timeout',
  'Pages viewed',
  'Payee / token activity',
  'Transfer / purchase path',
  'Session Path',
  'IPIntelligenceWorkspace',
  'Where did the connection originate, and has it been seen elsewhere?',
  'Run an IP lookup to reveal',
  'VPN / proxy / TOR',
  'Residential status',
  'Seen elsewhere',
  'Location Sequence',
  'DocumentRequestWorkspace',
  'Document request workflow',
  'Search Document Request',
  'Document request statuses',
  'Request queue',
  'Reason requested',
  'Required / optional',
  'Authenticity flag',
  'Reviewer notes',
  'Save follow-up note',
  'Document Request review',
  'IdentityIntelWorkspace',
  'Run People Search',
  'Identity report hidden until a search is run.',
  'Identity Match Summary',
  'Identity report counts',
  'Evidence Explorer',
  'Fictional training data only. Identity information is evidence, not a case conclusion.',
  'Mark Identity Intel / People Search reviewed',
  'TransactionHistoryWorkspace',
  '30-day training activity view',
  'Transaction detail drawer',
  'Transaction account and card rail',
  'Save transaction note',
  'Business360Workspace',
  'Business and KYB profile',
  'Business 360 review',
  'EmployeeProfileWorkspace',
  'Official contact / callback',
  'Employee Profile review',
  'PayrollHistoryWorkspace',
  'Payroll and direct deposit',
  'Trusted callback',
  'Payroll History review',
]) {
  mustContain('InvestigationToolPanel.jsx', panel, anchor);
}

for (const anchor of [
  'Identity & Customer',
  'Login, Device & IP',
  'Transactions & Financial',
  'Business & Payment Verification',
  'Evidence & Documents',
  'Links & Related Cases',
  'System Access Lane',
  'workflowReviewGroup',
  "tools: ['Timeline']",
  'groupForTool',
]) {
  mustContain('investigationToolGroups.js', groups, anchor);
}

for (const anchor of [
  "import InvestigationToolPanel from './InvestigationToolPanel.jsx'",
  "import TimelinePanel from './TimelinePanel.jsx'",
  "from './investigationToolGroups.js'",
  'categories={investigationToolGroups}',
  "tool === 'Customer 360'",
  "tool === 'Timeline'",
  '<TimelinePanel {...activeToolProps} />',
  '<InvestigationToolPanel {...activeToolProps} />',
  'rowsFor(tool, activeCase)',
]) {
  mustContain('VisualWorkspace.jsx', workspace, anchor);
}

for (const anchor of [
  'investigation-tool-groups-theme-v1',
  'data-investigation-tool-groups="approved-theme-v1"',
  'Contextual investigation tools',
  'Choose the next evidence question',
  'investigation-category-copy',
  'category-progress-track',
]) {
  mustContain('CategoryTileRail.jsx', rail, anchor);
}

for (const anchor of [
  'body[data-visual-tab="workspace"]',
  '.investigation-tool-groups-theme-v1',
  '.investigation-tools-theme-v1',
  '.investigation-tool-workspace',
  '.investigation-tool-detail',
  '.investigation-tool-record-card',
  'grid-template-columns: repeat(6, minmax(0, 1fr))',
  '@media (max-width: 960px)',
  '@media (max-width: 720px)',
  '@media (max-width: 430px)',
  '@media (max-width: 350px)',
  '.payment-verification-findbar',
  '.payment-verification-snapshot',
  '.payment-verification-workspace',
  '.payment-call-drawer',
  '.payment-action-panel',
  '.payment-notes-panel',
  '.device-intel-findbar',
  '.device-intel-snapshot',
  '.device-intel-workspace',
  '.device-history-panel',
  '.device-related-panel',
  '.device-notes-panel',
  '.login-history-findbar',
  '.login-history-summary',
  '.login-history-workspace',
  '.login-record-list',
  '.login-detail-panel',
  '.login-session-panel',
  '.login-related-panel',
  '.login-notes-panel',
  '.session-history-findbar',
  '.session-history-summary',
  '.session-history-workspace',
  '.session-record-list',
  '.session-detail-panel',
  '.session-activity-grid',
  '.session-path-panel',
  '.session-related-panel',
  '.session-notes-panel',
  '.ip-intel-findbar',
  '.ip-intel-summary',
  '.ip-intel-workspace',
  '.ip-record-list',
  '.ip-detail-panel',
  '.ip-observation-panel',
  '.ip-location-panel',
  '.ip-related-panel',
  '.ip-notes-panel',
  '.document-request-findbar',
  '.document-request-statuses',
  '.document-request-workspace',
  '.document-request-list',
  '.document-request-detail',
  '.document-request-summary',
  '.identity-intel-search',
  '.identity-intel-gate',
  '.identity-intel-summary',
  '.identity-intel-counts',
  '.identity-intel-workspace',
  '.identity-intel-sections',
  '.identity-intel-report',
  '.identity-intel-evidence',
  '.transaction-history-findbar',
  '.transaction-history-account-rail',
  '.transaction-history-workspace',
  '.transaction-history-detail',
  '.business-360-profile',
  '.business-360-workspace',
  '.employee-profile-summary',
  '.employee-profile-workspace',
  '.payroll-history-findbar',
  '.payroll-history-workspace',
]) {
  mustContain('displayInvestigationToolsThemeV1.css', styles, anchor);
}

for (const anchor of [
  'getTransactionHistory',
  'getBusiness360Workspace',
  'getEmployeeProfiles',
  'getPayrollHistory',
  'Card not present',
  'Fictional destination ending',
  'Training payroll callback channel',
]) {
  mustContain('businessPayrollWorkspace.js', businessPayrollWorkspace, anchor);
}

for (const anchor of [
  'getIdentityIntelReport',
  'matchesIdentityIntelSearch',
  'Name / DOB match',
  'Watchlist / OFAC training result',
  'Address History',
  'Phone Numbers',
  'Email History',
  'Associates & Relatives',
  'Employment History',
  'Businesses & Ownership',
  'Criminal Records (Training Only)',
  'Social & Digital Presence',
  'All records in this report are fictional training data',
]) {
  mustContain('identityIntelReport.js', identityReport, anchor);
}

mustContain('main.jsx', entrypoint, "import './displayInvestigationToolsThemeV1.css';");
mustContain('investigation-tools-browser.spec.mjs', browser, 'approved Investigation tools are contextual, functional, and responsive');
mustContain('investigation-tools-browser.spec.mjs', browser, 'mobile-chromium');
mustContain('Investigation tools handoff', handoff, 'agent/investigation-tools-approved-theme-v1');
mustContain('Investigation tools handoff', handoff, 'Timeline only');
mustContain('Source of Truth', sourceOfTruth, 'The next isolated safe item is **final responsive/mobile polish only**');
mustContain('README', readme, 'The next isolated step is **final responsive/mobile polish only**');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'position: fixed',
]) {
  mustNotContain('displayInvestigationToolsThemeV1.css', styles, forbidden);
  mustNotContain('InvestigationToolPanel.jsx', panel, forbidden);
  mustNotContain('investigationToolGroups.js', groups, forbidden);
}

for (const forbidden of [
  'Fraudulent',
  'Legitimate',
  'Correct answer',
  'AI recommendation',
  'Red flag',
  'Green flag',
  'fraud score',
]) {
  mustNotContain('InvestigationToolPanel.jsx visible copy', panel, forbidden);
  mustNotContain('CategoryTileRail.jsx visible copy', rail, forbidden);
}

if (failures.length) {
  console.error('Investigation tools approved-theme v1 smoke check failed. Repair these focused tool-workspace anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Investigation tools approved-theme v1 smoke check passed. Contextual grouping, focused record review, search, notes, pinning, review progress, workflow routes, responsive safety, Evidence First wording, protected persistence boundaries, and the synchronized Decision and Luna handoff remain intact.');
