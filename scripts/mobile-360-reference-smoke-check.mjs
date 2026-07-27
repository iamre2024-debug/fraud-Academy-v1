import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const component = read('src/Mobile360ReferencePages.jsx');
const workspace = read('src/MobileMissionWorkspace.jsx');
const styles = read('src/mobile360Reference.css');
const entrypoint = read('src/main.jsx');
const failures = [];

function requireAnchor(label, content, anchor) {
  if (!content.includes(anchor)) failures.push(`${label} is missing: ${anchor}`);
}

function forbid(label, content, pattern) {
  if (pattern.test(content)) failures.push(`${label} contains forbidden coupling: ${pattern}`);
}

for (const anchor of [
  'MobileCustomer360Reference',
  'getCustomer360Dossier',
  'data-mobile-360-screen="customer"',
  'Customer ID',
  'Training ID',
  'Profile updates',
  'Trusted devices & security',
  'Accounts & products',
  'Relationship',
  'Recent contact notes',
  "markReviewed('Customer 360')",
  'MobileBusiness360Reference',
  'getBusiness360Dossier',
  'data-mobile-360-screen="business"',
  'Masked EIN',
  'Owner address',
  'Business products & accounts',
  'Credit & loans',
  'Payroll overview',
  'Business updates',
  'Luna Business Research',
  "markReviewed('Business 360')",
  'Mobile360Drawer',
  'AccountDetails',
  'QuickPinButton',
]) requireAnchor('Mobile360ReferencePages.jsx', component, anchor);

for (const anchor of [
  "import {",
  'MobileCustomer360Reference',
  'MobileBusiness360Reference',
  'Mobile360LunaBadge',
  '<MobileCustomer360Reference',
  '<MobileBusiness360Reference',
  'data-mobile-360-header',
]) requireAnchor('MobileMissionWorkspace.jsx', workspace, anchor);

for (const anchor of [
  'Dedicated Customer 360 and Business 360 mobile pages',
  'body[data-layout-mode="mobile"] .mobile-360-reference',
  '.mobile-360-pair',
  '.mobile-360-account-grid',
  '.mobile-360-business-contact',
  '.mobile-360-drawer',
  '@media (max-width: 360px)',
]) requireAnchor('mobile360Reference.css', styles, anchor);

requireAnchor('main.jsx', entrypoint, "import './mobile360Reference.css';");

forbid('Mobile360ReferencePages.jsx', component, /activeCase\.(?:status|alertReason|amount|transactionInfo|scenarioTitle)/);
forbid('Mobile360ReferencePages.jsx', component, /\b(?:Fraud Confirmed|Correct answer|Scenario Truth|Final Finding|risk score|engagement score)\b/i);
forbid('mobile360Reference.css', styles, /body\[data-layout-mode="desktop"\]/);
forbid('mobile360Reference.css', styles, /!important/);

if (!/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(styles)) {
  failures.push('mobile360Reference.css must keep the approved two-column phone card rhythm.');
}

if (!/\.mobile-360-quick-pin\s*\{[^}]*min-height:\s*44px/s.test(styles)) {
  failures.push('Mobile 360 Quick Pad controls must keep a 44px minimum touch target.');
}

if (failures.length) {
  console.error('Mobile 360 reference smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mobile 360 reference smoke check passed. Customer and Business 360 use dedicated mobile components, shared factual dossiers, and scoped reference styling.');
