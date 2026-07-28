import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const investigationPanel = fs.readFileSync(path.join(rootDir, 'src/InvestigationToolPanel.jsx'), 'utf8');
const businessWorkspace = fs.readFileSync(path.join(rootDir, 'src/Business360Workspace.jsx'), 'utf8');
const financialWorkspace = fs.readFileSync(path.join(rootDir, 'src/FinancialInvestigationWorkspace.jsx'), 'utf8');
const paymentWorkspace = fs.readFileSync(path.join(rootDir, 'src/PaymentVerificationWorkspace.jsx'), 'utf8');
const panel = [
  investigationPanel,
  businessWorkspace,
  financialWorkspace,
  paymentWorkspace,
].join('\n');
const documentViewer = fs.readFileSync(path.join(rootDir, 'src/DocumentViewerWorkspace.jsx'), 'utf8');
const documentRecords = fs.readFileSync(path.join(rootDir, 'src/data/documentRecords.js'), 'utf8');
const businessPayrollWorkspace = fs.readFileSync(path.join(rootDir, 'src/data/businessPayrollWorkspace.js'), 'utf8');
const identityReport = fs.readFileSync(path.join(rootDir, 'src/data/identityIntelReport.js'), 'utf8');
const loginRecords = fs.readFileSync(path.join(rootDir, 'src/data/loginRecords.js'), 'utf8');
const sessionRecords = fs.readFileSync(path.join(rootDir, 'src/data/sessionRecords.js'), 'utf8');
const ipRecords = fs.readFileSync(path.join(rootDir, 'src/data/ipRecords.js'), 'utf8');
const accessReports = fs.readFileSync(path.join(rootDir, 'src/data/accessHistoryReports.js'), 'utf8');
const financialInvestigation = fs.readFileSync(path.join(rootDir, 'src/data/financialInvestigationRecords.js'), 'utf8');
const businessResearch = fs.readFileSync(path.join(rootDir, 'src/data/businessResearchRecords.js'), 'utf8');
const businessReport = fs.readFileSync(path.join(rootDir, 'src/data/kybReviewReport.js'), 'utf8');
const groups = fs.readFileSync(path.join(rootDir, 'src/investigationToolGroups.js'), 'utf8');
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const rail = fs.readFileSync(path.join(rootDir, 'src/CategoryTileRail.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayInvestigationToolsThemeV1.css'), 'utf8');
const referenceDeckStyles = fs.readFileSync(path.join(rootDir, 'src/referenceInvestigationDeck.css'), 'utf8');
const financialStyles = fs.readFileSync(path.join(rootDir, 'src/financialInvestigationWorkspace.css'), 'utf8');
const paymentStyles = fs.readFileSync(path.join(rootDir, 'src/paymentVerificationWorkspace.css'), 'utf8');
const documentInboxStyles = fs.readFileSync(path.join(rootDir, 'src/documentInbox.css'), 'utf8');
const workspaceState = fs.readFileSync(path.join(rootDir, 'src/useVisualWorkspaceCaseState.js'), 'utf8');
const workspaceModel = fs.readFileSync(path.join(rootDir, 'src/visualWorkspaceModel.js'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/investigation-tools-browser.spec.mjs'), 'utf8');
const documentBrowser = fs.readFileSync(path.join(rootDir, 'tests/document-viewer-browser.spec.mjs'), 'utf8');
const businessBrowser = fs.readFileSync(path.join(rootDir, 'tests/business-360-browser.spec.mjs'), 'utf8');
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
  'Account lockouts',
  'MFA completed',
  'Filter Login History by result',
  'Filter Login History by method',
  'Event type',
  'Failed-attempt count',
  'Operating system',
  'Authentication channel',
  'Session availability',
  'Password reset timing',
  'Post-login pages and actions are kept in Session History.',
  'Generate Login Timeline Report',
  'A successful MFA event is evidence of authentication activity, not a final conclusion about authorization.',
  'SessionHistoryWorkspace',
  'After login, what did the user do?',
  'Recorded sessions',
  'Normal logout',
  'Session timeout',
  'Filter Session History by logout state',
  'Filter Session History by activity',
  'Pages viewed',
  'Payee / token activity',
  'Transfer / purchase path',
  'Session Path',
  'Generate Session History Report',
  'IPIntelligenceWorkspace',
  'Where did the connection originate, and has it been seen elsewhere?',
  'Run IP Lookup',
  'No exact IP match',
  'VPN / proxy / TOR',
  'Residential status',
  'Seen elsewhere',
  'Location Sequence',
  'Generate IP Intelligence Report',
  'DocumentRequestWorkspace',
  'DocumentViewerWorkspace',
  'Document request workflow',
  'Paperwork inbox',
  'Request Paperwork',
  'Send Request',
  'Paperwork conversation',
  'Compose paperwork request',
  'setDocumentRequestsByCase',
  'Search Document Request',
  'Document request statuses',
  'Required / optional',
  'Authenticity flag',
  'Reviewer notes',
  'Save follow-up note',
  'Document Request review',
  'IdentityIntelWorkspace',
  'Run People Search',
  'Choose People Search method',
  'Search Identity Intel by Training ID',
  'Search Identity Intel by name',
  'Search Identity Intel by date of birth',
  'Identity report hidden until a search is run.',
  'Identity Match Summary',
  'View Full Profile Report',
  'Identity report counts',
  'Evidence Explorer',
  'Generate Identity Search Report',
  'Fictional training data only. Identity information is evidence, not a case conclusion.',
  'Mark Identity Intel / People Search reviewed',
  'TransactionHistoryWorkspace',
  'Case activity view',
  'Transaction detail drawer',
  'Transaction account and card rail',
  'Save transaction note',
  'Business360Workspace',
  'Luna Business Research',
  'Business 360 Research Report',
  'Business 360 review',
  'EmployeeProfileWorkspace',
  'Official contact / callback',
  'Employee Profile review',
  'PayrollHistoryWorkspace',
  'Company Payroll History',
  'Payroll Run Detail',
  'Employee Payroll History',
  'Individual Paystub',
  'Company funding Bank Code',
  'Employee Bank Code',
  'Payroll History review',
  'FinancialInvestigationWorkspace',
]) {
  mustContain('Investigation tool source files', panel, anchor);
}

for (const anchor of [
  "import PaymentVerificationWorkspace from './PaymentVerificationWorkspace.jsx'",
  "import './referenceInvestigationDeck.css'",
  "tool === 'Financial Investigation' || tool === 'Payment Verification'",
  'reference-investigation-shell',
  'data-reference-investigation-layout',
  'reference-investigation-header',
  'reference-investigation-controls',
  '<PaymentVerificationWorkspace',
  'quickPin={quickPin}',
]) {
  mustContain('InvestigationToolPanel.jsx', investigationPanel, anchor);
}

for (const anchor of [
  "import './paymentVerificationWorkspace.css'",
  'data-payment-verification-layout="mission-v2"',
  'Search before reveal',
  'Verify a specific payment destination',
  'Owner or business name',
  'Run verification',
  'Payment Verification result hidden',
  'Destination Not Found',
  'Name relationship',
  'Account status',
  'NSF result',
  'Time open / on record',
  'Searched payment identifiers',
  'Quick Pad Bank Code',
  'Quick Pad Destination ID',
  'Payment Verification lookup history',
  'Payment Verification review',
  'disabled={!activeRecord}',
]) {
  mustContain('PaymentVerificationWorkspace.jsx', paymentWorkspace, anchor);
}

for (const anchor of [
  "import './financialInvestigationWorkspace.css'",
  'data-financial-investigation-layout="mission-v2"',
  'Financial relationship overview',
  'Financial Investigation dashboard',
  'Activity summary',
  'Linked relationship accounts',
  'Recorded observations',
  'Evidence explorer',
  'Financial Investigation sections',
  'Search Financial Investigation records',
  'data-financial-investigation-record',
  'Expanded financial record',
  'Financial Investigation evidence summary',
  'Save evidence note',
  'Financial Investigation review',
  "markReviewed('Financial Investigation')",
]) {
  mustContain('FinancialInvestigationWorkspace.jsx', financialWorkspace, anchor);
}

for (const anchor of [
  'Identity & Customer',
  'Login, Session, Device & IP',
  'Transactions & Financial',
  'Business & Payment Verification',
  'Documents & Requests',
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
  'categories={visibleCategories}',
  "activeTool === 'Customer 360'",
  "activeTool === 'Timeline'",
  '<TimelinePanel {...activeToolProps} />',
  '<InvestigationToolPanel {...activeToolProps} />',
  'rowsFor(activeTool, activeCase)',
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
  '.document-viewer-findbar',
  '.document-folder-nav',
  '.document-viewer-layout',
  '.document-record-list',
  '.document-preview-workspace',
  '.document-page-stage',
  '.document-page',
  '.document-inspector',
  '.document-compare-workspace',
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
  '.kyb-lookup-panel',
  '.kyb-profile-header',
  '.kyb-review-tabs',
  '.kyb-review-workspace',
  '.kyb-record-detail',
  '.kyb-case-rail',
]) {
  mustContain('displayInvestigationToolsThemeV1.css', styles, anchor);
}

for (const anchor of [
  'body[data-visual-tab="workspace"]',
  '.investigation-tools-theme-v1.reference-investigation-shell',
  '.reference-investigation-header',
  '.reference-investigation-title',
  '.reference-luna-mark',
  '.reference-investigation-controls',
  ':focus-visible',
  '@media (max-width: 720px)',
  '@media (max-width: 360px)',
]) {
  mustContain('referenceInvestigationDeck.css', referenceDeckStyles, anchor);
}

for (const anchor of [
  'body[data-visual-tab="workspace"]',
  '.payment-mission-deck',
  '.payment-mission-search',
  '.payment-mission-locked',
  '.payment-mission-result',
  '.payment-mission-facts',
  '.payment-mission-search-confirmation',
  '.payment-mission-actions',
  '.payment-mission-history',
  '.payment-mission-routes',
  '.payment-mission-review',
  ':focus-visible',
  '@media (max-width: 980px)',
  '@media (max-width: 720px)',
  '@media (prefers-reduced-motion: reduce)',
]) {
  mustContain('paymentVerificationWorkspace.css', paymentStyles, anchor);
}

for (const anchor of [
  'body[data-visual-tab="workspace"]',
  '.financial-mission-deck',
  '.financial-mission-overview',
  '.financial-mission-kpis',
  '.financial-mission-dashboard',
  '.financial-mission-activity',
  '.financial-mission-categories',
  '.financial-mission-accounts',
  '.financial-mission-observations',
  '.financial-mission-explorer',
  '.financial-investigation-findbar',
  '.financial-investigation-workspace',
  '.financial-record-detail',
  '.financial-case-rail',
  '.financial-mission-routes',
  '.financial-mission-review',
  ':focus-visible',
  '@media (max-width: 1050px)',
  '@media (max-width: 760px)',
  '@media (max-width: 520px)',
]) {
  mustContain('financialInvestigationWorkspace.css', financialStyles, anchor);
}

for (const anchor of [
  'data-document-viewer-screen="approved-theme-v1"',
  'Search by Account ID',
  'Customer documents are locked',
  'Search Document Viewer records',
  'Document folders',
  'Document preview',
  'Document page controls',
  'Extracted fields',
  'Document investigator note',
  'Add to summary',
  'Document comparison',
  'Document Viewer next routes',
  'Mark Document Viewer reviewed',
]) {
  mustContain('DocumentViewerWorkspace.jsx', documentViewer, anchor);
}

for (const anchor of [
  'Driver License Review',
  'Bank Statement',
  'EIN Assignment Notice',
  'Tax Return Transcript',
  'Utility Bill - Proof of Address',
  'Phone Ownership Report',
  'getCaseDocuments',
  'documentSearchText',
]) {
  mustContain('documentRecords.js', documentRecords, anchor);
}

for (const anchor of [
  'getTransactionHistory',
  'getBusiness360Workspace',
  'getEmployeeProfiles',
  'getPayrollHistory',
  'employeePayrollHistory',
  'findPayrollRecord',
  'Card not present',
  'companyPayrollProfile',
  'payrollRuns',
  'paymentDestinations',
]) {
  mustContain('businessPayrollWorkspace.js', businessPayrollWorkspace, anchor);
}

for (const anchor of [
  'getIdentityIntelReport',
  'matchesIdentityIntelSearch',
  "from './customer360Dossier.js'",
  'searchIds',
  'searchName',
  'searchDob',
  "criteria?.mode === 'id'",
  'Name / DOB match',
  'Watchlist / OFAC training result',
  'Address History',
  'Phone Numbers',
  'Email History',
  'Associates & Relatives',
  'Employment History',
  'Businesses & Ownership',
  'Professional Licenses',
  'Property Records',
  'Vehicle Records',
  'Bankruptcy Records',
  'Liens / Judgments',
  'Public Records',
  'Criminal Records (Training Only)',
  'Social & Digital Presence',
  'All records in this report are fictional training data',
]) {
  mustContain('identityIntelReport.js', identityReport, anchor);
}

for (const anchor of ['fullAccessTimestamp', 'Failed authentication', 'Account lockout', 'operatingSystem', 'profileChangeLink', 'sessionReference']) {
  mustContain('loginRecords.js', loginRecords, anchor);
}

for (const anchor of ['scenarioTemplate', 'hasCreatedSession', 'matchingProfileChanges', 'profileActions', 'activityTypes', 'Session timeout recorded']) {
  mustContain('sessionRecords.js', sessionRecords, anchor);
}

for (const anchor of ['defaultDetails(activeCase, ip, logins)', 'vpnProxyTor', 'crossCasePresence', 'observedLoginEvents', 'hasCreatedSession']) {
  mustContain('ipRecords.js', ipRecords, anchor);
}

for (const anchor of ['Login Timeline Report', 'Session History Report', 'IP Intelligence Report', 'generateAccessHistoryReport', 'getGeneratedAccessReportDocuments', 'Fictional data - not valid for real-world use']) {
  mustContain('accessHistoryReports.js', accessReports, anchor);
}

mustContain('documentRecords.js', documentRecords, 'getGeneratedAccessReportDocuments');
mustContain('documentRecords.js', documentRecords, 'getGeneratedBusiness360ReportDocuments');
mustContain('displayInvestigationToolsThemeV1.css', styles, '.access-history-filters');
mustContain('displayInvestigationToolsThemeV1.css', styles, '.ip-lookup-action');

for (const anchor of ['financialInvestigationTabs', 'Account Review', 'Current vs Historical', 'Spending Analysis', 'Personal Deposit Analysis', 'Credit & Loan Payments', 'Business Payroll Analysis', 'getFinancialInvestigation', 'financialRecordSearchText']) {
  mustContain('financialInvestigationRecords.js', financialInvestigation, anchor);
}

for (const anchor of ['businessResearchSections', 'Ownership & Control', 'Institution Relationship', 'Luna Business Research', 'getBusinessResearch', 'matchesBusinessResearchLookup', 'lunaBusinessResearchStatuses']) {
  mustContain('businessResearchRecords.js', businessResearch, anchor);
}

for (const anchor of ['Business 360 Research Report', 'generateBusiness360Report', 'getGeneratedBusiness360ReportDocuments', 'does not assign an investigation outcome']) {
  mustContain('kybReviewReport.js', businessReport, anchor);
}

mustContain('main.jsx', entrypoint, "import './displayInvestigationToolsThemeV1.css';");
mustContain('main.jsx', entrypoint, "import './documentInbox.css';");
mustContain('useVisualWorkspaceCaseState.js', workspaceState, 'setDocumentRequestsByCase');
mustContain('useVisualWorkspaceCaseState.js', workspaceState, 'storageKeys.documentRequests');
mustContain('visualWorkspaceModel.js', workspaceModel, "documentRequests: 'fraud-academy-document-requests-v2'");
for (const anchor of ['.document-request-inbox', '.document-request-compose-button', '.document-request-message-body', '[data-mobile-pane="compose"]', '.document-viewer-layout']) {
  mustContain('documentInbox.css', documentInboxStyles, anchor);
}
mustContain('investigation-tools-browser.spec.mjs', browser, 'approved Investigation tools are contextual, functional, and responsive');
mustContain('investigation-tools-browser.spec.mjs', browser, 'mobile-chromium');
mustContain('document-viewer-browser.spec.mjs', documentBrowser, 'requires an Account ID');
mustContain('document-viewer-browser.spec.mjs', documentBrowser, 'Document comparison');
mustContain('business-360-browser.spec.mjs', businessBrowser, 'Business 360 keeps company, owner, account, and factual research records outside the active case');
mustContain('business-360-browser.spec.mjs', businessBrowser, 'Business 360 exposes a payroll relationship summary and only supported payroll routes');
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
  mustNotContain('referenceInvestigationDeck.css', referenceDeckStyles, forbidden);
  mustNotContain('financialInvestigationWorkspace.css', financialStyles, forbidden);
  mustNotContain('paymentVerificationWorkspace.css', paymentStyles, forbidden);
  mustNotContain('Investigation tool source files', panel, forbidden);
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
  mustNotContain('Investigation tool visible copy', panel, forbidden);
  mustNotContain('CategoryTileRail.jsx visible copy', rail, forbidden);
}

if (failures.length) {
  console.error('Investigation tools approved-theme v1 smoke check failed. Repair these focused tool-workspace anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Investigation tools approved-theme v1 smoke check passed. Contextual grouping, focused record review, search, notes, pinning, review progress, workflow routes, responsive safety, Evidence First wording, protected persistence boundaries, and the synchronized Decision and Luna handoff remain intact.');
