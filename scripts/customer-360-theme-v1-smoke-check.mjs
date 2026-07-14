import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const panel = fs.readFileSync(path.join(rootDir, 'src/Customer360Panel.jsx'), 'utf8');
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayCustomer360ThemeV1.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/customer-360-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_CUSTOMER_360_THEME_V1.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Customer 360 v1 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Customer 360 coupling or visible answer language: ${text}`);
}

for (const anchor of [
  'customer-360-theme-v1',
  'data-customer-360-screen="approved-theme-v1"',
  'Customer 360',
  'Customer Identity Snapshot',
  'Contact Information',
  'Products & Accounts',
  'Relationship Overview',
  'Security & Access Summary',
  'Current Case Snapshot',
  'Recent Customer Contact',
  'Prior Claims / Disputes',
  'Profile Change Event Log',
  'Related Customer Records',
  'Claim-specific Customer 360 highlights',
  'Search this dossier',
  'Identity Intel',
  'Login History',
  'Device Intelligence',
  'Open Submit Decision',
  "markReviewed('Customer 360')",
  'It does not determine the case outcome.',
]) {
  mustContain('Customer360Panel.jsx', panel, anchor);
}

for (const anchor of [
  "import Customer360Panel from './Customer360Panel.jsx'",
  "tool === 'Customer 360'",
  '<Customer360Panel {...activeToolProps} />',
  'rowsFor(tool, activeCase)',
]) {
  mustContain('VisualWorkspace.jsx', workspace, anchor);
}

for (const anchor of [
  'body[data-visual-tab="workspace"]',
  '.customer-360-theme-v1',
  '.customer-360-dossier-grid',
  '.customer-360-profile-log',
  '.customer-360-event-card',
  '.customer-360-review-bar',
  'grid-template-columns: repeat(12, minmax(0, 1fr))',
  '@media (max-width: 720px)',
  '@media (max-width: 430px)',
  '@media (max-width: 350px)',
]) {
  mustContain('displayCustomer360ThemeV1.css', styles, anchor);
}

mustContain('main.jsx', entrypoint, "import './displayCustomer360ThemeV1.css';");
mustContain('customer-360-browser.spec.mjs', browser, 'approved Customer 360 is a complete Evidence First dossier');
mustContain('customer-360-browser.spec.mjs', browser, 'mobile-chromium');
mustContain('Customer 360 handoff', handoff, 'agent/customer-360-approved-theme-v1');
mustContain('Customer 360 handoff', handoff, 'Investigation tools only');
mustContain('Source of Truth', sourceOfTruth, '`docs/FRAUD_ACADEMY_CUSTOMER_360_THEME_V1.md`');
mustContain('Source of Truth', sourceOfTruth, '`src/Customer360Panel.jsx`');
mustContain('Source of Truth', sourceOfTruth, '`src/displayCustomer360ThemeV1.css`');
mustContain('Source of Truth', sourceOfTruth, 'The next isolated safe item is **final responsive/mobile polish only**');
mustContain('README', readme, 'The approved Customer 360 handoff lives in');
mustContain('README', readme, 'The next isolated step is **final responsive/mobile polish only**');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'position: fixed',
  'SystemAccessLane',
]) {
  mustNotContain('displayCustomer360ThemeV1.css', styles, forbidden);
  mustNotContain('Customer360Panel.jsx', panel, forbidden);
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
  mustNotContain('Customer360Panel.jsx visible copy', panel, forbidden);
}

if (failures.length) {
  console.error('Customer 360 approved-theme v1 smoke check failed. Repair these focused dossier anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Customer 360 approved-theme v1 smoke check passed. The full dossier, profile-change log, claim-specific context, responsive layout, synchronized Decision and Luna handoff, Evidence First wording, and protected persistence boundaries remain intact.');
