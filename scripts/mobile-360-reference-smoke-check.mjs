import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const component = read('src/Mobile360ReferencePages.jsx');
const workspace = read('src/MobileMissionWorkspace.jsx');
const styles = read('src/mobile360Reference.css');
const relationshipAccounts = read('src/data/relationshipAccounts.js');
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
  'Customer profile',
  'Profile updates',
  'Trusted devices & security',
  'Accounts & products',
  'Relationship',
  'Recent contact notes',
  'MobileBusiness360Reference',
  'getBusiness360Dossier',
  'data-mobile-360-screen="business"',
  'Masked EIN',
  'Owner address',
  'Business products & accounts',
  'Credit & loans',
  'Payroll overview',
  'Business updates',
  'Recent notes',
  'Luna Business Research',
  'Mobile360Drawer',
  'AccountDetails',
  'OwnerRelationshipRecords',
  'BusinessAccessRecords',
  'Personal accounts',
  'Trusted devices',
  'Contact history',
  'Destination ID',
  'Bank Code',
  'License applicability',
  'License search',
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
  'mobile-360-actions-menu',
  'detailRequest={mobile360DetailRequest}',
  'activeToolProps.markReviewed?.(activeTool)',
  'Open ${activeTool} actions',
  'Business profile',
  'Owners &amp; control',
]) requireAnchor('MobileMissionWorkspace.jsx', workspace, anchor);

for (const anchor of [
  'Dedicated Customer 360 and Business 360 mobile pages',
  'body[data-layout-mode="mobile"] .mobile-360-reference',
  '.mobile-360-pair',
  '.mobile-360-account-grid',
  '.mobile-360-business-contact',
  '.mobile-360-business-activity-pair.single',
  '.mobile-360-owner-record-group',
  '.mobile-360-actions-menu',
  '.mobile-360-drawer',
  '@media (max-width: 360px)',
]) requireAnchor('mobile360Reference.css', styles, anchor);

requireAnchor('main.jsx', entrypoint, "import './mobile360Reference.css';");

for (const anchor of [
  'destinationId',
  'maskedDestinationId',
  'bankCode',
]) requireAnchor('relationshipAccounts.js', relationshipAccounts, anchor);

forbid('Mobile360ReferencePages.jsx', component, /activeCase\.(?:status|alertReason|amount|transactionInfo|scenarioTitle)/);
forbid('Mobile360ReferencePages.jsx', component, /\b(?:Fraud Confirmed|Correct answer|Scenario Truth|Final Finding|risk score|engagement score)\b/i);
forbid('Mobile360ReferencePages.jsx', component, /mobile-360-(?:pin-profile|review|research-entry)/);
forbid('Mobile360ReferencePages.jsx', component, />\s*Open account\s*</);
forbid('mobile360Reference.css', styles, /body\[data-layout-mode="desktop"\]/);
forbid('mobile360Reference.css', styles, /!important/);
forbid('mobile360Reference.css', styles, /\.mobile-360-(?:pin-profile|review|research-entry)\b/);

const businessMain = component.slice(component.indexOf('export function MobileBusiness360Reference'));
const mainSectionOrder = [
  'title="Business products & accounts"',
  'title="Credit & loans"',
  'title="Payroll overview"',
  'title="Business updates"',
  'title="Recent notes"',
].map((anchor) => businessMain.indexOf(anchor));
if (mainSectionOrder.some((index) => index < 0)
  || mainSectionOrder.some((index, position) => position > 0 && index <= mainSectionOrder[position - 1])) {
  failures.push('Business 360 main cards must keep products/credit, payroll/updates, then full-width recent notes in reference order.');
}

if (!/\{!is360Tool\s*&&\s*\(\s*<footer className="mission-workspace-status"/s.test(workspace)) {
  failures.push('MobileMissionWorkspace.jsx must hide workspace status chips on Customer 360 and Business 360.');
}

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
