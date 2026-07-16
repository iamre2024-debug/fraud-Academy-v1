import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const briefing = fs.readFileSync(path.join(rootDir, 'src/CaseSummaryCard.jsx'), 'utf8');
const briefingDetails = fs.readFileSync(path.join(rootDir, 'src/data/caseBriefingDetails.js'), 'utf8');
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayCaseBriefingThemeV1.css'), 'utf8');
const routeStyles = fs.readFileSync(path.join(rootDir, 'src/displayCaseBriefingRoutesV1.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/case-briefing-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_CASE_BRIEFING_THEME_V1.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Case Briefing v1 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Case Briefing v1 coupling or visible answer language: ${text}`);
}

for (const anchor of [
  'case-briefing-theme-v1',
  'data-case-briefing-container="approved-theme-v1"',
  'data-case-briefing-screen="approved-theme-v1"',
  'Case Briefing',
  'Briefing summary',
  'Assigned investigator',
  'Due date',
  'Case parties',
  'data-case-briefing-parties="true"',
  'data-case-briefing-details="true"',
  'Reason code and review details',
  'case-briefing-chargeback-card',
  'Workspace',
  'Timeline',
  'Notes',
  'More Tools',
  'Begin Investigation',
  'case-briefing-quick-routes',
  'Case briefing quick routes',
  'Submit Decision',
  'const firstInvestigationTool =',
  'const quickRoutes = [...new Set(',
  'openTool(firstInvestigationTool',
  'quickRoutes.map((toolName)',
  'openRoute(toolName)',
  'decision-jump-button',
  '<small>Transaction / payee info</small>',
  '<small>Short summary</small>',
  '{activeCase.transactionInfo ?? activeCase.type}',
  '{activeCase.shortSummary ?? activeCase.queueReason}',
]) {
  mustContain('CaseSummaryCard.jsx', briefing, anchor);
}

for (const anchor of [
  'buildCaseBriefingPacket',
  'Account and transaction details',
  'Transaction details',
  'Payroll details',
  'Payment instruction details',
  'Credit details',
  'Application details',
]) {
  mustContain('caseBriefingDetails.js', briefingDetails, anchor);
}

for (const anchor of [
  'function openNotes()',
  'function openMoreTools()',
  'openNotes={openNotes}',
  'openMoreTools={openMoreTools}',
  'jumpDecision={jumpDecision}',
]) {
  mustContain('VisualWorkspace.jsx', workspace, anchor);
}

for (const anchor of [
  'body[data-visual-tab="workspace"]',
  '[data-workflow-stage="briefing"]',
  '.case-briefing-theme-v1',
  '.case-briefing-card-grid',
  '.case-briefing-parties-card',
  '.case-briefing-detail-card',
  '.case-briefing-party-list',
  '.case-briefing-chargeback-card',
  '.case-briefing-utilities',
  'grid-template-columns: repeat(12, minmax(0, 1fr))',
  '@media (max-width: 720px)',
  '@media (max-width: 430px)',
  '@media (max-width: 350px)',
]) {
  mustContain('displayCaseBriefingThemeV1.css', styles, anchor);
}

for (const anchor of [
  '.case-summary-visual[data-case-briefing-container="approved-theme-v1"]',
  '.case-briefing-quick-routes',
  'grid-template-columns: repeat(3, minmax(0, 1fr))',
  '@media (max-width: 430px)',
]) {
  mustContain('displayCaseBriefingRoutesV1.css', routeStyles, anchor);
}

mustContain('main.jsx', entrypoint, "import './displayCaseBriefingThemeV1.css';");
mustContain('main.jsx', entrypoint, "import './displayCaseBriefingRoutesV1.css';");
mustContain('case-briefing-browser.spec.mjs', browser, 'approved Case Briefing is Evidence First, functional, and responsive');
mustContain('case-briefing-browser.spec.mjs', browser, 'Case briefing quick routes');
mustContain('case-briefing-browser.spec.mjs', browser, 'mobile-chromium');
mustContain('Case Briefing handoff', handoff, 'agent/case-briefing-approved-theme-v1');
mustContain('Case Briefing handoff', handoff, 'Customer 360 only');
mustContain('Source of Truth', sourceOfTruth, '`docs/FRAUD_ACADEMY_CASE_BRIEFING_THEME_V1.md`');
mustContain('Source of Truth', sourceOfTruth, '`src/displayCaseBriefingThemeV1.css`');
mustContain('Source of Truth', sourceOfTruth, '`src/displayCaseBriefingRoutesV1.css`');
mustContain('Source of Truth', sourceOfTruth, 'The next isolated safe item is **final responsive/mobile polish only**');
mustContain('README', readme, 'The approved Case Briefing handoff lives in');
mustContain('README', readme, 'The next isolated step is **final responsive/mobile polish only**');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'position: fixed',
  'SystemAccessLane',
]) {
  mustNotContain('displayCaseBriefingThemeV1.css', styles, forbidden);
  mustNotContain('displayCaseBriefingRoutesV1.css', routeStyles, forbidden);
  mustNotContain('CaseSummaryCard.jsx', briefing, forbidden);
}

for (const forbidden of [
  'Fraudulent',
  'Legitimate',
  'Correct answer',
  'AI recommendation',
  'Red flag',
  'Green flag',
  'Key focus areas',
  'Recent actions',
  'Available evidence areas',
  'Records in this packet',
  'Luna Briefing Assistant',
  'Process support only',
  'organize the investigation without revealing an outcome',
  'Case packet',
  'Recent documents',
  'Open Document Request',
]) {
  mustNotContain('CaseSummaryCard.jsx visible copy', briefing, forbidden);
}

const summaryWrappers = briefing.match(/<DirectCollapsibleText as="strong" lines=\{2\} mobileLines=\{3\}>/g) ?? [];
if (summaryWrappers.length !== 2) {
  failures.push('CaseSummaryCard.jsx must keep exactly two direct strong wrappers for transaction/payee information and the short summary.');
}

if (failures.length) {
  console.error('Case Briefing approved-theme v1 smoke check failed. Repair these focused briefing anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Case Briefing approved-theme v1 smoke check passed. The card-grid hierarchy, functional quick routes, synchronized Decision and Luna handoff, Evidence First wording, responsive layout, direct text controls, and protected persistence boundaries remain intact.');
