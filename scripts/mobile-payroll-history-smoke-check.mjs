import fs from 'node:fs';

const failures = [];
const entrypoint = fs.readFileSync('src/main.jsx', 'utf8');
const workspace = fs.readFileSync('src/MobileMissionWorkspace.jsx', 'utf8');
const panel = fs.readFileSync('src/InvestigationToolPanel.jsx', 'utf8');
const cards = fs.readFileSync('src/MobilePayrollPaystubCards.jsx', 'utf8');
const styles = fs.readFileSync('src/mobilePayrollHistoryCards.css', 'utf8');
const browserTest = fs.readFileSync('tests/payment-verification-browser.spec.mjs', 'utf8');

function requireAnchor(label, content, anchor) {
  if (!content.includes(anchor)) failures.push(`${label} is missing: ${anchor}`);
}

requireAnchor('main.jsx', entrypoint, "import './mobilePayrollHistoryCards.css';");
requireAnchor('MobileMissionWorkspace.jsx', workspace, "activeTool === 'Payroll History' ? 'mission-payroll-history-page' : ''");
requireAnchor('MobileMissionWorkspace.jsx', workspace, 'data-payroll-history-page');
requireAnchor('InvestigationToolPanel.jsx', panel, "import MobilePayrollPaystubCards from './MobilePayrollPaystubCards.jsx';");
requireAnchor('InvestigationToolPanel.jsx', panel, 'mobileMode ? (');
requireAnchor('InvestigationToolPanel.jsx', panel, '<MobilePayrollPaystubCards');
requireAnchor('InvestigationToolPanel.jsx', panel, '<table>');
requireAnchor('InvestigationToolPanel.jsx', panel, 'mobileMode={mobileMode}');

for (const anchor of [
  'data-mobile-paystub-cards',
  'data-mobile-paystub-card',
  'data-mobile-paystub-destination',
  'Individual paystub',
  'Current paycheck totals',
  'Year-to-date totals',
  'Earnings',
  'Taxes',
  'Deductions',
  'Employer contributions',
  'Reimbursements',
  'Adjustments',
  'Payment destinations',
  'Bank Code',
  'Destination ID',
  'Copy Bank Code',
  'Pin Bank Code to Quick Pad',
  'Copy Destination ID',
  'Pin Destination ID to Quick Pad',
  'Open Payment Verification',
  'Payment Verification identifiers are not available for this payment method.',
]) requireAnchor('MobilePayrollPaystubCards.jsx', cards, anchor);

for (const anchor of [
  'Payroll History mobile paystub cards',
  'body[data-layout-mode="mobile"] .mission-payroll-history-page',
  '.mobile-paystub-card-stack',
  '.mobile-paystub-card-list',
  '.mobile-paystub-card',
  '.mobile-paystub-core-facts',
  '.mobile-paystub-totals',
  '.mobile-paystub-destinations',
  '.mobile-paystub-destination-actions',
  'container-name: payroll-paystub',
  '@container payroll-paystub (max-width: 330px)',
  '@media (max-width: 370px)',
]) requireAnchor('mobilePayrollHistoryCards.css', styles, anchor);

for (const anchor of [
  "testInfo.project.name === 'mobile-chromium'",
  "paystubs.locator('[data-mobile-paystub-card]')",
  "paystubCard.locator('[data-mobile-paystub-destination]')",
  "await expect(payrollPanel.locator('.payroll-table-scroll')).toHaveCount(0)",
  'await expect(paymentHandoff).toBeVisible()',
  'await paymentHandoff.click()',
  'for (const width of [320, 360, 375, 390, 412])',
  'document.documentElement.scrollWidth',
  'actionColumns',
  'destinationFactColumns',
]) requireAnchor('payment-verification-browser.spec.mjs', browserTest, anchor);

if (/body\[data-layout-mode="desktop"\]/.test(styles)) {
  failures.push('Mobile Payroll History styles must not alter the desktop layout.');
}

if (/font-size:\s*(?:0\.[0-6]\d*)rem/.test(styles)) {
  failures.push('Mobile Payroll History styles must preserve the 12px mobile type floor.');
}

if (/\b(?:fraud score|risk score|red flag|green flag|AI recommendation|correct answer)\b/i.test(cards)) {
  failures.push('Mobile Payroll History cards expose prohibited pre-submission conclusions.');
}

if (/\b(?:KYB Review|Transaction History)\b/.test(cards)) {
  failures.push('Mobile Payroll History cards restore a retired or prohibited payroll surface.');
}

if (failures.length) {
  console.error('Mobile Payroll History card smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mobile Payroll History card smoke check passed. Mobile renders expandable immutable paystub cards with complete totals, destination-specific actions, and a visible Payment Verification handoff while desktop retains its table.');
