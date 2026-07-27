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

async function openCaseQueue(page) {
  const mobileNavigation = page.getByRole('navigation', { name: 'Mission navigation' });
  if (await mobileNavigation.isVisible()) {
    await mobileNavigation.getByRole('button', { name: 'Cases', exact: true }).click();
  } else {
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Cases', exact: true })
      .click();
  }
  const queue = page.locator('.cases-theme-v1-panel');
  await expect(queue).toBeVisible();
  return queue;
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

test('Avery Customer 360 records the profile change without duplicating or prefilling Payment Verification', async ({ page }, testInfo) => {
  await page.goto('/');
  const caseSelector = page.locator('.visual-case-switcher select');
  await caseSelector.selectOption('FA-CR-24003');
  await expect(caseSelector).toHaveValue('FA-CR-24003');
  await selectToolGroup(page, /Identity & Customer/);

  const customer = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer).toBeVisible();
  const tabs = customer.getByRole('tablist', { name: 'Customer 360 dossier tabs' });
  await tabs.getByRole('tab', { name: 'Profile History', exact: true }).click();
  const profileEvent = customer.locator('[data-profile-event]').filter({ hasText: 'Payment destination added' });
  await expect(profileEvent).toBeVisible();
  await expect(profileEvent).toContainText('External payment account add');
  await expect(profileEvent).toContainText('No prior external destination on file');
  await expect(profileEvent).toContainText('Bank Code BC-204 · Destination ID DST-7740');
  for (const label of ['Previous value', 'New value', 'Channel', 'Source', 'User / actor', 'Device', 'Session', 'Authentication']) {
    await expect(profileEvent.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(profileEvent).not.toContainText(/\b(?:suspicious|unauthorized|fraudulent|fraud confirmed)\b/i);
  await expect(customer.getByRole('region', { name: 'Payment Account Change', exact: true })).toHaveCount(0);
  await expect(customer.getByRole('region', { name: 'Payment Verification Inputs' })).toHaveCount(0);
  await expect(customer.getByRole('button', { name: 'Prefill Payment Verification' })).toHaveCount(0);

  const panel = await openPaymentVerification(page);
  await expect(panel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue('');
  await expect(panel.getByRole('textbox', { name: 'Destination ID', exact: true })).toHaveValue('');
  await expect(panel.getByRole('textbox', { name: 'Owner or business name', exact: true })).toHaveValue('');
  await expect(panel.locator('.payment-verification-snapshot')).toHaveCount(0);
  await expect(panel.locator('.payment-detail-panel')).toHaveCount(0);
  await expect(panel.locator('.payment-comparison-panel')).toHaveCount(0);
  await expect(panel).not.toContainText('No prior external destination on file');

  await runPaymentVerification(panel, {
    bankCode: 'BC-204',
    destinationId: 'DST-7740',
    ownerName: 'Avery Brooks',
  });
  const revealedDetail = panel.locator('.payment-detail-panel');
  await expect(revealedDetail).toBeVisible();
  await expect(revealedDetail).toContainText('BC-204');
  await expect(revealedDetail).toContainText('DST-7740');
  const comparison = panel.getByRole('region', { name: 'Old versus new account comparison', exact: true });
  await expect(comparison).toContainText('No prior external destination on file');
  await expect(comparison).toContainText('BC-204 / DST-7740');
  await page.screenshot({ path: testInfo.outputPath(`payment-verification-avery-account-change-${testInfo.project.name}.png`), fullPage: true });
});

test('generated payroll carries one exact account change from Payroll History into gated verification', async ({ page }, testInfo) => {
  await page.goto('/');
  const queue = await openCaseQueue(page);
  await queue.getByLabel('Generate case customer type').selectOption('business');
  await queue.getByLabel('Generate case product').selectOption('payroll-product');
  await queue.getByLabel('Generate case review workflow').selectOption('payroll-change-alert');
  await queue.getByLabel('Generate case alert reason').selectOption('Employee payment destination changed');
  await queue.getByLabel('Generate case scenario').selectOption('pca-scenario-04');
  await queue.getByLabel('Generate case difficulty').selectOption('deep');
  await queue.getByLabel('Generate case evidence depth').selectOption('deep');
  await queue.getByLabel('Generate case count').selectOption('1');
  await queue.getByRole('button', { name: 'Generate cases', exact: true }).click();

  const briefing = page.locator('[data-workspace-page="briefing"]');
  await expect(briefing).toBeVisible();
  const generatedCaseId = await page.locator('.visual-case-switcher select').inputValue();
  expect(generatedCaseId).toMatch(/^FA-PCA-G\d+$/);

  await selectToolGroup(page, /Business & Payment Verification/);
  const payrollPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const toolSelector = payrollPanel.getByRole('combobox', { name: 'Choose investigation tool' });
  await toolSelector.selectOption('Payroll History');
  await expect(payrollPanel).toHaveAttribute('data-tool-name', 'Payroll History');

  const source = payrollPanel.getByRole('region', { name: 'Payroll History payment source identifiers', exact: true });
  await expect(source).toBeVisible();
  const sourceValues = await source.locator('dl > div').evaluateAll((rows) => Object.fromEntries(rows.map((row) => [
    row.querySelector('dt')?.textContent?.trim(),
    row.querySelector('dd')?.textContent?.trim(),
  ])));
  expect(sourceValues['Bank Code']).toMatch(/^BC-[A-Z0-9-]+$/i);
  expect(sourceValues['Destination ID']).toMatch(/^DST-[A-Z0-9-]+$/i);
  for (const label of ['Previous account / destination', 'New account / destination', 'Change comparison']) {
    expect(sourceValues[label]).toBeTruthy();
    expect(sourceValues[label]).not.toMatch(/not supplied|•{2,}|no new destination(?: added)?/i);
  }
  expect(sourceValues['New account / destination']).toContain(sourceValues['Bank Code']);
  expect(sourceValues['New account / destination']).toContain(sourceValues['Destination ID']);

  await source.getByRole('button', { name: 'Prefill Payment Verification', exact: true }).click();
  const verificationPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(verificationPanel).toHaveAttribute('data-tool-name', 'Payment Verification');
  await expect(verificationPanel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue(sourceValues['Bank Code']);
  await expect(verificationPanel.getByRole('textbox', { name: 'Destination ID', exact: true })).toHaveValue(sourceValues['Destination ID']);
  await expect(verificationPanel.getByRole('textbox', { name: 'Owner or business name', exact: true })).not.toHaveValue('');
  await expect(verificationPanel.locator('.payment-verification-snapshot')).toHaveCount(0);
  await expect(verificationPanel.locator('.payment-detail-panel')).toHaveCount(0);
  await expect(verificationPanel.locator('.payment-comparison-panel')).toHaveCount(0);

  await verificationPanel.getByRole('button', { name: 'Run verification', exact: true }).click();
  const comparison = verificationPanel.getByRole('region', { name: 'Old versus new account comparison', exact: true });
  await expect(comparison).toContainText(sourceValues['Previous account / destination']);
  await expect(comparison).toContainText(sourceValues['New account / destination']);
  await expect(comparison).toContainText(sourceValues['Change comparison']);
  await page.screenshot({ path: testInfo.outputPath(`payment-verification-generated-payroll-${testInfo.project.name}.png`), fullPage: true });
});
