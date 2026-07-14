import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const panel = fs.readFileSync(path.join(rootDir, 'src/InvestigationToolPanel.jsx'), 'utf8');
const identityPanel = fs.readFileSync(path.join(rootDir, 'src/IdentityIntelligencePanel.jsx'), 'utf8');
const groups = fs.readFileSync(path.join(rootDir, 'src/investigationToolGroups.js'), 'utf8');
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const model = fs.readFileSync(path.join(rootDir, 'src/visualWorkspaceModel.js'), 'utf8');
const rail = fs.readFileSync(path.join(rootDir, 'src/CategoryTileRail.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayInvestigationToolsThemeV1.css'), 'utf8');
const identityStyles = fs.readFileSync(path.join(rootDir, 'src/identityIntelligencePanel.css'), 'utf8');
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
  'Address history',
  'Associates and household links',
  'Linked identity and access records',
  'Save report to evidence packet',
]) mustContain('IdentityIntelligencePanel.jsx', identityPanel, anchor);

for (const forbidden of [
  'Background detail report',
  'fraud score',
  'Red flag',
  'Green flag',
  'AI recommendation',
]) {
  mustNotContain('IdentityIntelligencePanel.jsx', identityPanel, forbidden);
  mustNotContain('visualWorkspaceModel.js', model, forbidden);
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
  "import IdentityIntelligencePanel from './IdentityIntelligencePanel.jsx'",
  "import InvestigationToolPanel from './InvestigationToolPanel.jsx'",
  "import TimelinePanel from './TimelinePanel.jsx'",
  "from './investigationToolGroups.js'",
  'categories={investigationToolGroups}',
  "tool === 'Customer 360'",
  "tool === 'Identity Intelligence'",
  '<IdentityIntelligencePanel {...activeToolProps} />',
  "tool === 'Timeline'",
  '<TimelinePanel {...activeToolProps} />',
  '<InvestigationToolPanel {...activeToolProps} />',
  'rowsFor(tool, activeCase, reportPackets)',
]) mustContain('VisualWorkspace.jsx', workspace, anchor);

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
  '@media (max-width: 430px)',
  '@media (max-width: 350px)',
]) mustContain('displayInvestigationToolsThemeV1.css', styles, anchor);

for (const anchor of [
  '.identity-search-card',
  '.identity-search-fields',
  '.identity-search-result',
  '.identity-full-report',
  '.identity-report-sections',
  '@media (max-width: 720px)',
]) mustContain('identityIntelligencePanel.css', identityStyles, anchor);

mustContain('main.jsx', entrypoint, "import './displayInvestigationToolsThemeV1.css';");
mustContain('main.jsx', entrypoint, "import './identityIntelligencePanel.css';");
mustContain('investigation-tools-browser.spec.mjs', browser, 'approved Investigation tools preserve identity lookup, real records, Evidence First, and responsive layouts');
mustContain('investigation-tools-browser.spec.mjs', browser, 'mobile-chromium');
mustContain('Investigation tools handoff', handoff, 'agent/investigation-tools-approved-theme-v1');
mustContain('Investigation tools handoff', handoff, 'Timeline only');
mustContain('Source of Truth', sourceOfTruth, '`docs/FRAUD_ACADEMY_INVESTIGATION_TOOLS_THEME_V1.md`');
mustContain('README', readme, 'The approved Investigation tools handoff lives in');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'position: fixed',
]) {
  mustNotContain('displayInvestigationToolsThemeV1.css', styles, forbidden);
  mustNotContain('identityIntelligencePanel.css', identityStyles, forbidden);
  mustNotContain('InvestigationToolPanel.jsx', panel, forbidden);
  mustNotContain('IdentityIntelligencePanel.jsx', identityPanel, forbidden);
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
  mustNotContain('IdentityIntelligencePanel.jsx visible copy', identityPanel, forbidden);
  mustNotContain('CategoryTileRail.jsx visible copy', rail, forbidden);
}

if (failures.length) {
  console.error('Investigation tools smoke check failed. Repair these focused tool-workspace anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Investigation tools smoke check passed. Identity lookup and full profile reporting, contextual grouping, record review, evidence actions, responsive safety, Evidence First wording, and protected persistence boundaries remain intact.');
