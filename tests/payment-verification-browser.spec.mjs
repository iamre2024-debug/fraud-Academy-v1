import { test, expect } from '@playwright/test';
import { runPaymentVerification, selectToolGroup } from './workspace-page-helpers.mjs';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'mobile-chromium') return;
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  });
});

async function openPaymentVerification(page) {
  await selectToolGroup(page, /Business & Payment Verification/);
  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const selector = panel.getByRole('combobox', { name: 'Choose investigation tool' });
  if (await selector.inputValue() !== 'Payment Verification') await selector.selectOption('Payment Verification');
  await expect(panel).toHaveAttribute('data-tool-name', 'Payment Verification');
  return panel;
}

test('Payment Verification gates records, handles not-found, and reveals exact lookup evidence', async ({ page }, testInfo) => {
  await page.goto('/');
  const panel = await openPaymentVerification(page);

  await expect(panel.getByRole('heading', { name: 'Verify a specific payment destination' })).toBeVisible();
  await expect(panel.locator('.payment-verification-snapshot')).toHaveCount(0);
  await expect(panel.locator('.payment-detail-panel')).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Mark Payment Verification reviewed' })).toBeDisabled();

  await panel.getByRole('button', { name: 'Run verification', exact: true }).click();
  await expect(panel.getByRole('alert')).toContainText('Bank Code, Destination ID, and owner or business name are required.');

  await panel.getByRole('textbox', { name: 'Bank Code', exact: true }).fill('BC-404');
  await panel.getByRole('textbox', { name: 'Destination ID', exact: true }).fill('DST-MISSING');
  await panel.getByRole('textbox', { name: 'Owner or business name', exact: true }).fill('Maya Sterling');
  await panel.getByRole('button', { name: 'Run verification', exact: true }).click();
  await expect(panel.getByText('Destination Not Found', { exact: true }).first()).toBeVisible();
  await expect(panel.locator('.payment-detail-panel')).toHaveCount(0);

  await panel.getByRole('button', { name: 'Reset lookup', exact: true }).click();
  await runPaymentVerification(panel, {
    bankCode: 'BC-441',
    destinationId: 'DST-CARD-4410',
    ownerName: 'Maya Sterling',
  });

  await expect(panel.locator('.payment-verification-snapshot')).toContainText('Match');
  await expect(panel.getByText('Ownership status', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('Operational account status', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('Standing', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('Payment type', { exact: true }).first()).toBeVisible();
  await expect(panel.getByRole('heading', { name: /recorded attempts?/ })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Mark Payment Verification reviewed' })).toBeEnabled();
  await expect(panel.locator('.payment-action-panel')).not.toContainText(/\b(?:approve|deny|hold|release|pause)\b/i);

  await page.screenshot({ path: testInfo.outputPath(`payment-verification-result-${testInfo.project.name}.png`), fullPage: true });
});

test('Payment Verification keeps partial name, ownership, status, and history separate', async ({ page }, testInfo) => {
  await page.goto('/');
  const caseSelector = page.locator('.visual-case-switcher select');
  await caseSelector.selectOption('FA-CR-24003');
  await expect(caseSelector).toHaveValue('FA-CR-24003');
  const panel = await openPaymentVerification(page);

  await runPaymentVerification(panel, {
    bankCode: 'BC-204',
    destinationId: 'DST-7740',
    ownerName: 'Avery Brooks',
  });

  const snapshot = panel.locator('.payment-verification-snapshot');
  await expect(snapshot).toContainText('Partial Match');
  await expect(snapshot).toContainText('Pending');
  await expect(panel.locator('.payment-history-grid')).toContainText('Ownership history');
  await expect(panel.locator('.payment-history-grid')).toContainText('Prior-use history');
  await expect(panel.locator('.payment-history-grid')).toContainText('Return / NSF history');
  await expect(panel.locator('.payment-detail-grid')).toContainText('Business');
  await expect(panel.locator('.payment-verification-case-rail')).toContainText('Evidence-first summary');
  await expect(panel.locator('.payment-detail-grid')).not.toContainText(/Operational account status\s*Fraud/i);

  const layout = await page.evaluate(() => {
    const panelElement = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const detail = document.querySelector('.payment-detail-panel');
    const rail = document.querySelector('.payment-verification-case-rail');
    const viewportWidth = window.innerWidth;
    const fits = (element) => {
      const rect = element?.getBoundingClientRect();
      return Boolean(rect && rect.left >= -1 && rect.right <= viewportWidth + 1);
    };
    return {
      panelFits: fits(panelElement),
      detailFits: fits(detail),
      railFits: fits(rail),
      columns: getComputedStyle(document.querySelector('.payment-verification-workspace-revealed')).gridTemplateColumns.split(' ').filter(Boolean).length,
    };
  });
  expect(layout.panelFits && layout.detailFits && layout.railFits).toBe(true);
  expect(layout.columns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 2);

  await page.screenshot({ path: testInfo.outputPath(`payment-verification-credit-${testInfo.project.name}.png`), fullPage: true });
});

test('Customer 360 prefills identifiers without revealing the result', async ({ page }, testInfo) => {
  await page.goto('/');
  await selectToolGroup(page, /Identity & Customer/);

  const customer = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer).toBeVisible();
  await customer.getByRole('tab', { name: 'Accounts', exact: true }).click();
  const inputs = customer.getByRole('region', { name: 'Payment Verification Inputs' });
  await expect(inputs).toContainText('BC-441');
  await expect(inputs).toContainText('DST-CARD-4410');
  await inputs.getByRole('button', { name: 'Prefill Payment Verification' }).first().click();

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(panel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue('BC-441');
  await expect(panel.getByRole('textbox', { name: 'Destination ID', exact: true })).toHaveValue('DST-CARD-4410');
  await expect(panel.getByRole('textbox', { name: 'Owner or business name', exact: true })).toHaveValue('Maya Sterling');
  await expect(panel.locator('.payment-verification-snapshot')).toHaveCount(0);
  await expect(panel.locator('.payment-detail-panel')).toHaveCount(0);

  await panel.getByRole('button', { name: 'Run verification', exact: true }).click();
  await expect(panel.locator('.payment-detail-panel')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath(`payment-verification-prefill-${testInfo.project.name}.png`), fullPage: true });
});
