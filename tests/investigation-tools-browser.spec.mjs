import { test, expect } from '@playwright/test';

const firstCase = { id: 'FA-ATO-24018', person: 'Maya Sterling', trainingId: 'TRN-8842-19' };
const secondCase = { id: 'FA-CB-24007', person: 'Jordan Ellis' };
const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate|suggested first tool|investigator question)\b/i;

async function assertSurfaceFits(page, selector, label) {
  const layout = await page.evaluate(({ selector }) => {
    const element = document.querySelector(selector);
    const rect = element?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      left: rect?.left ?? -99,
      right: rect?.right ?? 99999,
      overflow: element ? element.scrollWidth - element.clientWidth : 99,
    };
  }, { selector });
  expect(layout.documentWidth, `${label} document width`).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.left, `${label} left`).toBeGreaterThanOrEqual(-1);
  expect(layout.right, `${label} right`).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.overflow, `${label} internal overflow`).toBeLessThanOrEqual(1);
}

test('investigation tools preserve full lookup workflows, real records, Evidence First, and mobile layouts', async ({ page }, testInfo) => {
  await page.goto('/');

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing).toBeVisible();
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();

  const customer360 = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer360).toBeVisible();
  await customer360.getByRole('navigation', { name: 'Customer 360 related tools' })
    .getByRole('button', { name: 'Identity Intel', exact: true })
    .click();

  const identityPanel = page.locator('[data-identity-intelligence-screen="lookup-report-v1"]');
  await expect(identityPanel).toBeVisible();
  await expect(identityPanel.getByRole('heading', { name: 'Background Profile Search', exact: true })).toBeVisible();
  await expect(identityPanel.getByRole('radio', { name: 'Training ID + Name', exact: true })).toBeChecked();
  await expect(identityPanel.getByRole('radio', { name: 'Training ID + DOB', exact: true })).toBeVisible();
  await expect(identityPanel.getByRole('heading', { name: 'Full Profile Report', exact: true })).toHaveCount(0);
  await expect(identityPanel.getByText('Background detail report', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Case Report', { exact: true })).toHaveCount(0);

  await identityPanel.getByLabel('Training ID', { exact: true }).fill(firstCase.trainingId);
  await identityPanel.getByLabel('Full name', { exact: true }).fill(firstCase.person);
  await identityPanel.getByRole('button', { name: 'Run Search', exact: true }).click();
  await expect(identityPanel.getByRole('heading', { name: 'Identity Match Summary', exact: true })).toBeVisible();
  await expect(identityPanel).toContainText('1988-02-19');
  await identityPanel.getByRole('button', { name: 'View Full Profile Report', exact: true }).click();

  const fullIdentityReport = identityPanel.locator('[data-identity-full-report]');
  await expect(fullIdentityReport).toBeVisible();
  await expect(fullIdentityReport.locator('[data-identity-report-section]')).toHaveCount(16);
  await expect(fullIdentityReport).toContainText('SES-7781');
  await expect(fullIdentityReport).toContainText('198.51.100.42');
  await assertSurfaceFits(page, '[data-identity-intelligence-screen="lookup-report-v1"]', 'Identity Intelligence');
  const identityColumns = await page.locator('.identity-report-sections').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length);
  expect(identityColumns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 2);

  await fullIdentityReport.getByRole('button', { name: 'Pin identity', exact: true }).click();
  await expect(page.locator('.tray-card')).toContainText('Pinned');
  await fullIdentityReport.getByRole('button', { name: 'Save report note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('Identity Intelligence report reviewed');
  await fullIdentityReport.getByRole('button', { name: 'Save report to evidence packet', exact: true }).click();
  await expect(page.locator('.case-report-packet-panel')).toContainText('1 saved');

  const dedicatedSwitcher = page.getByRole('combobox', { name: 'Choose investigation tool' });
  await dedicatedSwitcher.selectOption('Customer 360');
  await expect(customer360).toBeVisible();
  await customer360.getByRole('navigation', { name: 'Customer 360 related tools' }).getByRole('button', { name: 'Login History', exact: true }).click();

  const loginPanel = page.locator('[data-login-history-screen="event-review-v1"]');
  await expect(loginPanel).toBeVisible();
  await expect(loginPanel.getByRole('heading', { name: 'Login History', exact: true })).toBeVisible();
  await expect(loginPanel.locator('[data-login-record]')).toHaveCount(6);
  await expect(loginPanel.getByLabel('Filter login result')).toBeVisible();
  await expect(loginPanel.getByLabel('Filter login method')).toBeVisible();
  await expect(loginPanel.getByLabel('Filter login location')).toBeVisible();
  await loginPanel.getByLabel('Search Login History').fill('198.51.100.42');
  await expect(loginPanel.locator('[data-login-record]')).toHaveCount(1);
  await loginPanel.getByRole('button', { name: 'Clear Filters', exact: true }).click();
  await expect(loginPanel.locator('[data-login-record]')).toHaveCount(6);
  await loginPanel.locator('[data-login-record]').nth(1).getByRole('button', { name: 'Open event', exact: true }).click();
  await expect(loginPanel.getByRole('complementary', { name: 'Selected login and session detail' })).toContainText('Session ID');
  await expect(loginPanel.getByRole('complementary', { name: 'Selected login and session detail' })).toContainText('IP address');
  await expect(loginPanel.getByRole('navigation', { name: 'Login record related tools' })).toBeVisible();
  await assertSurfaceFits(page, '[data-login-history-screen="event-review-v1"]', 'Login History');
  const loginColumns = await page.locator('.login-history-workspace').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length);
  expect(loginColumns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 2);

  const allTools = page.getByRole('button', { name: /All tools/ });
  const showToolMenu = async () => {
    if (await allTools.isVisible().catch(() => false)) await allTools.click();
  };
  await showToolMenu();
  const groupRail = page.locator('[data-investigation-tool-groups="approved-theme-v1"]');
  await expect(groupRail.getByRole('button')).toHaveCount(7);
  await groupRail.getByRole('button', { name: /Business & Payment Verification/ }).click();

  const paymentPanel = page.locator('[data-payment-verification-screen="lookup-packet-v1"]');
  await expect(paymentPanel).toBeVisible();
  await expect(paymentPanel.getByRole('heading', { name: 'Verification Object Lookup', exact: true })).toBeVisible();
  await paymentPanel.getByLabel('Payment instrument', { exact: true }).fill('Debit card ending 4410');
  await paymentPanel.getByLabel('Processor destination', { exact: true }).fill('Merchant processor token MPT-7784');
  await paymentPanel.getByRole('button', { name: 'Run Verification Lookup', exact: true }).click();
  await expect(paymentPanel.getByRole('heading', { name: 'Verification Match Summary', exact: true })).toBeVisible();
  await paymentPanel.getByRole('button', { name: 'View Full Verification Packet', exact: true }).click();
  const paymentPacket = paymentPanel.locator('[data-payment-full-packet]');
  await expect(paymentPacket.locator('[data-payment-packet-section]')).toHaveCount(10);
  await expect(paymentPacket).toContainText('Ownership Comparison');
  await expect(paymentPacket).toContainText('Prior Payroll Use');
  await expect(paymentPacket).toContainText('Traditional bank debit card');
  await assertSurfaceFits(page, '[data-payment-verification-screen="lookup-packet-v1"]', 'Payment Verification');

  await page.getByRole('combobox', { name: 'Choose investigation tool' }).selectOption('Business Intelligence');
  const businessPanel = page.locator('[data-business-intelligence-screen="lookup-report-v1"]');
  await expect(businessPanel).toBeVisible();
  await expect(businessPanel.getByRole('heading', { name: 'Business Search', exact: true })).toBeVisible();
  await businessPanel.getByLabel('Business name', { exact: true }).fill('Northstar Digital Market LLC');
  await businessPanel.getByLabel('Training Business ID', { exact: true }).fill('TBI-NDM-7784');
  await businessPanel.getByRole('button', { name: 'Run Business Search', exact: true }).click();
  await expect(businessPanel.getByRole('heading', { name: 'Business Match Summary', exact: true })).toBeVisible();
  await businessPanel.getByRole('button', { name: 'View Full Business Report', exact: true }).click();
  const businessReport = businessPanel.locator('[data-business-full-report]');
  await expect(businessReport.locator('[data-business-report-section]')).toHaveCount(9);
  await expect(businessReport).toContainText('Business Operations');
  await expect(businessReport).toContainText('Payment Relationships');
  await expect(businessReport).toContainText('Northstar Payments LLC');
  await assertSurfaceFits(page, '[data-business-intelligence-screen="lookup-report-v1"]', 'Business Intelligence');

  await showToolMenu();
  await groupRail.getByRole('button', { name: /Evidence & Documents/ }).click();
  const genericTool = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(genericTool).toHaveAttribute('data-tool-name', 'Evidence Center');
  await genericTool.getByRole('combobox', { name: 'Choose investigation tool' }).selectOption('Document Viewer');
  await expect(genericTool).toHaveAttribute('data-tool-name', 'Document Viewer');
  await expect(genericTool).toContainText('Customer statement');
  await expect(genericTool).toContainText('Packet preview');

  await showToolMenu();
  const selector = page.locator('.visual-case-switcher select');
  await selector.selectOption(secondCase.id);
  await expect(selector).toHaveValue(secondCase.id);
  await expect(briefing.getByText(secondCase.person, { exact: true }).first()).toBeVisible();

  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', secondCase.id);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);
});
