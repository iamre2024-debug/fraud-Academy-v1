import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const panel = fs.readFileSync(path.join(rootDir, 'src/Customer360Panel.jsx'), 'utf8');
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayCustomer360ThemeV1.css'), 'utf8');
const attachedStyles = fs.readFileSync(path.join(rootDir, 'src/customer360AttachedPages.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/customer-360-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_CUSTOMER_360_THEME_V1.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Customer 360 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Customer 360 coupling or visible answer language: ${text}`);
}

for (const anchor of [
  'customer-360-theme-v1',
  'data-customer-360-screen="approved-theme-v1"',
  'Customer 360',
  'Identity Snapshot',
  'Training ID',
  'DOB / age',
  'Contact Information',
  'Products & Accounts',
  'Relationship Overview',
  'Security & Access',
  'Recent Customer Contact',
  'Prior Claims / Service History',
  'Profile Changes',
  'Related Customer Records',
  'Customer 360 record areas',
  'Identity Intel',
  'Login History',
  'Device Intelligence',
  'Submit Decision',
  "markReviewed('Customer 360')",
  'Detailed background searches remain inside Identity Intelligence.',
]) mustContain('Customer360Panel.jsx', panel, anchor);

for (const forbidden of [
  'Current Case Snapshot',
  'Save neutral dossier packet',
  'Not available in the current training packet',
]) mustNotContain('Customer360Panel.jsx', panel, forbidden);

for (const anchor of [
  "import Customer360Panel from './Customer360Panel.jsx'",
  "tool === 'Customer 360'",
  '<Customer360Panel {...activeToolProps} />',
  'rowsFor(tool, activeCase, reportPackets)',
]) mustContain('VisualWorkspace.jsx', workspace, anchor);

for (const anchor of [
  'body[data-visual-tab="workspace"]',
  '.customer-360-theme-v1',
  '.customer-360-review-bar',
  '@media (max-width: 720px)',
]) mustContain('displayCustomer360ThemeV1.css', styles, anchor);

for (const anchor of [
  '.customer-360-page-menu',
  '.customer-360-page-header',
  '.customer-360-page-fields',
  '.customer-360-page-event-list',
  '.customer-360-page-record-list',
  '@media (max-width: 720px)',
  'grid-template-columns: minmax(0, 1fr)',
]) mustContain('customer360AttachedPages.css', attachedStyles, anchor);

mustContain('main.jsx', entrypoint, "import './displayCustomer360ThemeV1.css';");
mustContain('main.jsx', entrypoint, "import './customer360AttachedPages.css';");
mustContain('customer-360-browser.spec.mjs', browser, 'approved Customer 360 presents real customer data in focused responsive pages');
mustContain('customer-360-browser.spec.mjs', browser, 'mobile-chromium');
mustContain('Customer 360 handoff', handoff, 'agent/customer-360-approved-theme-v1');
mustContain('Customer 360 handoff', handoff, 'Investigation tools only');
mustContain('Source of Truth', sourceOfTruth, '`docs/FRAUD_ACADEMY_CUSTOMER_360_THEME_V1.md`');
mustContain('Source of Truth', sourceOfTruth, '`src/Customer360Panel.jsx`');
mustContain('README', readme, 'The approved Customer 360 handoff lives in');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'position: fixed',
  'SystemAccessLane',
]) {
  mustNotContain('displayCustomer360ThemeV1.css', styles, forbidden);
  mustNotContain('customer360AttachedPages.css', attachedStyles, forbidden);
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
]) mustNotContain('Customer360Panel.jsx visible copy', panel, forbidden);

if (failures.length) {
  console.error('Customer 360 smoke check failed. Repair these focused customer-profile anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Customer 360 smoke check passed. Real profile values, focused record pages, profile-change history, related records, responsive layout, Evidence First wording, and protected persistence boundaries remain intact.');
