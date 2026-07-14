import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const panel = fs.readFileSync(path.join(rootDir, 'src/LoginHistoryPanel.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/loginHistoryPanel.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/display-phase-four-browser.spec.mjs'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const displayHandoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_DISPLAY_HANDOFF.md'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required responsive record anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden responsive record coupling: ${text}`);
}

for (const anchor of [
  'data-login-history-screen="event-review-v1"',
  'data-login-record={login.id}',
  'Login History filters',
  'Search Login History',
  'Filter login result',
  'Filter login method',
  'Filter login location',
  'Selected login and session detail',
  'login-detail-grid',
  'Open Session History',
  'Open Device Intelligence',
  'Open IP Intelligence',
]) mustContain('LoginHistoryPanel.jsx', panel, anchor);

for (const anchor of [
  '.login-history-panel',
  '.login-history-workspace',
  '.login-record-list',
  '.login-detail-grid',
  'grid-template-columns:repeat(2,minmax(0,1fr))',
  '@media(max-width:720px)',
  'grid-template-columns:minmax(0,1fr)',
]) mustContain('loginHistoryPanel.css', styles, anchor);

mustContain('main.jsx', entrypoint, "import './loginHistoryPanel.css';");
mustContain('display-phase-four-browser.spec.mjs', browser, 'responsive login records stay labeled and inside the mobile tool page');
mustContain('display-phase-four-browser.spec.mjs', browser, '[data-login-history-screen="event-review-v1"]');
mustContain('display-phase-four-browser.spec.mjs', browser, '[data-login-record]');
mustContain('display-phase-four-browser.spec.mjs', browser, 'panelOverflow');
mustContain('display-phase-four-browser.spec.mjs', browser, 'recordOverflow');
mustContain('display-phase-four-browser.spec.mjs', browser, "testInfo.project.name === 'mobile-chromium'");
mustContain('Display Handoff', displayHandoff, 'Completed in the focused responsive-record change:');
mustContain('Source of Truth', sourceOfTruth, '`src/displayPhaseFour.css`');

for (const forbidden of ['generatedCaseRepository', 'indexedDB', 'localStorage', 'SystemAccessLane', 'position: fixed']) {
  mustNotContain('loginHistoryPanel.css', styles, forbidden);
  mustNotContain('LoginHistoryPanel.jsx', panel, forbidden);
}

for (const forbidden of ['Fraudulent', 'Legitimate', 'Correct answer', 'AI recommendation', 'Red flag', 'Green flag', 'fraud score']) {
  mustNotContain('LoginHistoryPanel.jsx', panel, forbidden);
}

if (failures.length) {
  console.error('Responsive record smoke check failed. Repair these Login History card and session-detail anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Responsive record smoke check passed. Filtered Login History cards, selected session detail, mobile containment, and Evidence First wording remain intact.');
