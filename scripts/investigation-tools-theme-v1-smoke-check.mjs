import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const panel = fs.readFileSync(path.join(rootDir, 'src/InvestigationToolPanel.jsx'), 'utf8');
const identityPanel = fs.readFileSync(path.join(rootDir, 'src/IdentityIntelligencePanel.jsx'), 'utf8');
const businessPanel = fs.readFileSync(path.join(rootDir, 'src/BusinessIntelligencePanel.jsx'), 'utf8');
const paymentPanel = fs.readFileSync(path.join(rootDir, 'src/PaymentVerificationPanel.jsx'), 'utf8');
const loginPanel = fs.readFileSync(path.join(rootDir, 'src/LoginHistoryPanel.jsx'), 'utf8');
const groups = fs.readFileSync(path.join(rootDir, 'src/investigationToolGroups.js'), 'utf8');
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const model = fs.readFileSync(path.join(rootDir, 'src/visualWorkspaceModel.js'), 'utf8');
const rail = fs.readFileSync(path.join(rootDir, 'src/CategoryTileRail.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayInvestigationToolsThemeV1.css'), 'utf8');
const identityStyles = fs.readFileSync(path.join(rootDir, 'src/identityIntelligencePanel.css'), 'utf8');
const businessStyles = fs.readFileSync(path.join(rootDir, 'src/businessIntelligencePanel.css'), 'utf8');
const paymentStyles = fs.readFileSync(path.join(rootDir, 'src/paymentVerificationPanel.css'), 'utf8');
const loginStyles = fs.readFileSync(path.join(rootDir, 'src/loginHistoryPanel.css'), 'utf8');
const switcher = fs.readFileSync(path.join(rootDir, 'src/DedicatedToolSwitcher.jsx'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/investigation-tools-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_INVESTIGATION_TOOLS_THEME_V1.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Investigation tools anchor: ${text}`);
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
  'Evidence packet',
  'Save expanded note',
  'Save evidence packet',
  'Open Timeline',
  'Open Submit Decision',
  'It does not determine the case outcome.',
]) mustContain('InvestigationToolPanel.jsx', panel, anchor);

for (const anchor of [
  'data-identity-intelligence-screen="lookup-report-v1"',
  'Background Profile Search',
  'Training ID + Name',
  'Training ID + DOB',
  'Run Search',
  'Identity Match Summary',
  'View Full Profile Report',
  'Full Profile Report',
  'Save report to evidence packet',
]) mustContain('IdentityIntelligencePanel.jsx', identityPanel, anchor);

for (const anchor of [
  'data-business-intelligence-screen="lookup-report-v1"',
  'Business Search',
  'Business name + Training Business ID',
  'Business name + phone',
  'Business name + address',
  'Run Business Search',
  'Business Match Summary',
  'View Full Business Report',
  'Full Business Report',
]) mustContain('BusinessIntelligencePanel.jsx', businessPanel, anchor);

for (const anchor of [
  'data-payment-verification-screen="lookup-packet-v1"',
  'Verification Object Lookup',
  'Run Verification Lookup',
  'Verification Match Summary',
  'View Full Verification Packet',
  'Full Verification Packet',
  'Ownership Comparison',
  'Prior Payroll Use',
]) mustContain('PaymentVerificationPanel.jsx', paymentPanel, anchor);

for (const anchor of [
  'data-login-history-screen="event-review-v1"',
  'Login History filters',
  'Search Login History',
  'Filter login result',
  'Filter login method',
  'Filter login location',
  'Selected login and session detail',
  'Open Session History',
  'Open Device Intelligence',
  'Open IP Intelligence',
]) mustContain('LoginHistoryPanel.jsx', loginPanel, anchor);

for (const forbidden of [
  'Background detail report',
  'fraud score',
  'Red flag',
  'Green flag',
  'AI recommendation',
]) {
  for (const [label, content] of [
    ['IdentityIntelligencePanel.jsx', identityPanel],
    ['BusinessIntelligencePanel.jsx', businessPanel],
    ['PaymentVerificationPanel.jsx', paymentPanel],
    ['LoginHistoryPanel.jsx', loginPanel],
    ['visualWorkspaceModel.js', model],
  ]) mustNotContain(label, content, forbidden);
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
]) mustContain('investigationToolGroups.js', groups, anchor);

for (const anchor of [
  "import BusinessIntelligencePanel from './BusinessIntelligencePanel.jsx'",
  "import DedicatedToolSwitcher from './DedicatedToolSwitcher.jsx'",
  "import IdentityIntelligencePanel from './IdentityIntelligencePanel.jsx'",
  "import LoginHistoryPanel from './LoginHistoryPanel.jsx'",
  "import PaymentVerificationPanel from './PaymentVerificationPanel.jsx'",
  "import InvestigationToolPanel from './InvestigationToolPanel.jsx'",
  "import TimelinePanel from './TimelinePanel.jsx'",
  '<DedicatedToolSwitcher activeCategory={activeCategory} tool={tool} openTool={openTool} />',
  "tool === 'Identity Intelligence'",
  '<IdentityIntelligencePanel {...activeToolProps} />',
  "tool === 'Login History'",
  '<LoginHistoryPanel {...activeToolProps} />',
  "tool === 'Payment Verification'",
  '<PaymentVerificationPanel {...activeToolProps} />',
  "tool === 'Business Intelligence'",
  '<BusinessIntelligencePanel {...activeToolProps} />',
  "tool === 'Timeline'",
  '<TimelinePanel {...activeToolProps} />',
  '<InvestigationToolPanel {...activeToolProps} />',
  'rowsFor(tool, activeCase, reportPackets)',
]) mustContain('VisualWorkspace.jsx', workspace, anchor);

for (const anchor of ['Identity Intelligence', 'Login History', 'Payment Verification', 'Business Intelligence', 'Choose investigation tool']) mustContain('DedicatedToolSwitcher.jsx', switcher, anchor);

for (const anchor of [
  'investigation-tool-groups-theme-v1',
  'data-investigation-tool-groups="approved-theme-v1"',
  'Contextual investigation tools',
  'Choose the next evidence question',
  'investigation-category-copy',
  'category-progress-track',
]) mustContain('CategoryTileRail.jsx', rail, anchor);

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
]) mustContain('displayInvestigationToolsThemeV1.css', styles, anchor);

for (const [label, content, anchors] of [
  ['identityIntelligencePanel.css', identityStyles, ['.identity-search-card', '.identity-full-report', '@media(max-width:720px)']],
  ['businessIntelligencePanel.css', businessStyles, ['.business-search-card', '.business-full-report', '@media(max-width:720px)']],
  ['paymentVerificationPanel.css', paymentStyles, ['.payment-lookup-card', '.payment-full-packet', '@media(max-width:720px)']],
  ['loginHistoryPanel.css', loginStyles, ['.login-filter-card', '.login-history-workspace', '@media(max-width:720px)']],
]) for (const anchor of anchors) mustContain(label, content, anchor);

for (const cssImport of [
  "import './identityIntelligencePanel.css';",
  "import './businessIntelligencePanel.css';",
  "import './paymentVerificationPanel.css';",
  "import './loginHistoryPanel.css';",
  "import './dedicatedToolSwitcher.css';",
]) mustContain('main.jsx', entrypoint, cssImport);

mustContain('investigation-tools-browser.spec.mjs', browser, 'investigation tools preserve full lookup workflows, real records, Evidence First, and mobile layouts');
mustContain('investigation-tools-browser.spec.mjs', browser, 'mobile-chromium');
mustContain('Investigation tools handoff', handoff, 'agent/investigation-tools-approved-theme-v1');
mustContain('Source of Truth', sourceOfTruth, '`docs/FRAUD_ACADEMY_INVESTIGATION_TOOLS_THEME_V1.md`');
mustContain('README', readme, 'The approved Investigation tools handoff lives in');

for (const forbidden of ['generatedCaseRepository', 'indexedDB', 'localStorage', 'position: fixed']) {
  for (const [label, content] of [
    ['displayInvestigationToolsThemeV1.css', styles],
    ['identityIntelligencePanel.css', identityStyles],
    ['businessIntelligencePanel.css', businessStyles],
    ['paymentVerificationPanel.css', paymentStyles],
    ['loginHistoryPanel.css', loginStyles],
    ['InvestigationToolPanel.jsx', panel],
    ['IdentityIntelligencePanel.jsx', identityPanel],
    ['BusinessIntelligencePanel.jsx', businessPanel],
    ['PaymentVerificationPanel.jsx', paymentPanel],
    ['LoginHistoryPanel.jsx', loginPanel],
  ]) mustNotContain(label, content, forbidden);
}

if (failures.length) {
  console.error('Investigation tools smoke check failed. Repair these focused tool-workspace anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Investigation tools smoke check passed. Identity and business searches, payment verification packets, filtered login/session review, generic record tools, responsive safety, Evidence First wording, and protected persistence boundaries remain intact.');
