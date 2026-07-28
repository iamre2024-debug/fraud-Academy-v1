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
  await expect(panel.getByRole('region', { name: 'Payment Verification result hidden' })).toBeVisible();
  await expect(panel.getByRole('region', { name: 'Account snapshot' })).toHaveCount(0);
  await expect(panel.getByRole('status', { name: 'Payment verification result' })).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Mark Payment Verification reviewed' })).toBeDisabled();

  await panel.getByRole('button', { name: 'Run verification', exact: true }).click();
  await expect(panel.getByRole('alert')).toContainText('Bank Code, Destination ID, and person, owner, or business name are required.');

  await panel.getByRole('textbox', { name: 'Bank Code', exact: true }).fill('BC-404');
  await panel.getByRole('textbox', { name: 'Destination ID', exact: true }).fill('DST-MISSING');
  await panel.getByRole('textbox', { name: 'Owner or business name', exact: true }).fill('Maya Sterling');
  await panel.getByRole('button', { name: 'Run verification', exact: true }).click();
  await expect(panel.getByText('Destination Not Found', { exact: true }).first()).toBeVisible();
  await expect(panel.getByRole('status', { name: 'Payment verification result' })).toHaveCount(0);

  await panel.getByRole('button', { name: 'Edit search', exact: true }).click();
  await runPaymentVerification(panel, {
    bankCode: 'BC-441',
    destinationId: 'DST-CARD-4410',
    ownerName: 'Maya Sterling',
  });

  const result = panel.getByRole('status', { name: 'Payment verification result' });
  const snapshot = panel.getByRole('region', { name: 'Account snapshot' });
  await expect(result).toBeFocused();
  await expect(snapshot).toContainText('Matches person name');
  await expect(
    snapshot.locator('article').filter({ hasText: 'Account status' }).getByText('Open', { exact: true }),
  ).toBeVisible();
  await expect(snapshot).toContainText('No NSF found');
  await expect(snapshot).toContainText('7 years, 11 months');
  for (const label of ['Name relationship', 'Account status', 'NSF result', 'Time open / on record']) {
    await expect(snapshot.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(result).not.toContainText(/Maya Sterling|account holder|ownership status|verification attempts|98%|confidence score|fraud score|ready for payments/i);
  await expect(result).not.toContainText(/\b(?:approve|deny|hold|release)\b/i);
  await expect(panel.getByRole('button', { name: 'Mark Payment Verification reviewed' })).toBeEnabled();

  await page.screenshot({ path: testInfo.outputPath(`payment-verification-result-${testInfo.project.name}.png`), fullPage: true });
});

test('Payment Verification reuses Quick Pad identifiers without revealing a result early', async ({ page }) => {
  await page.goto('/');
  const panel = await openPaymentVerification(page);
  await runPaymentVerification(panel, {
    bankCode: 'BC-441',
    destinationId: 'DST-CARD-4410',
    ownerName: 'Maya Sterling',
  });

  await panel.getByRole('button', { name: 'Quick Pad Bank Code', exact: true }).click();
  await panel.getByRole('button', { name: 'Quick Pad Destination ID', exact: true }).click();
  await panel.getByRole('button', { name: 'Edit search', exact: true }).click();
  await expect(panel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue('');
  await expect(panel.getByRole('textbox', { name: 'Destination ID', exact: true })).toHaveValue('');

  await page.getByRole('button', { name: 'Open Quick Pad, 2 saved items' }).click();
  let pad = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await pad.locator('article').filter({ hasText: 'Bank Code' })
    .getByRole('button', { name: 'Use here', exact: true })
    .click();
  await expect(panel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue('BC-441');
  await expect(panel.getByRole('region', { name: 'Account snapshot' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Open Quick Pad, 2 saved items' }).click();
  pad = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await pad.locator('article').filter({ hasText: 'Destination ID' })
    .getByRole('button', { name: 'Use here', exact: true })
    .click();
  await expect(panel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue('BC-441');
  await expect(panel.getByRole('textbox', { name: 'Destination ID', exact: true })).toHaveValue('DST-CARD-4410');
  await expect(panel.getByRole('textbox', { name: 'Owner or business name', exact: true })).toHaveValue('');
  await expect(panel.getByRole('status', { name: 'Payment verification result' })).toHaveCount(0);

  await panel.getByRole('textbox', { name: 'Owner or business name', exact: true }).fill('Maya Sterling');
  await panel.getByRole('button', { name: 'Run verification', exact: true }).click();
  await expect(panel.getByRole('status', { name: 'Payment verification result' })).toBeVisible();
});

test('Payment Verification selects the actual account from duplicate destination records and keeps the result narrow', async ({ page }, testInfo) => {
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

  const result = panel.getByRole('status', { name: 'Payment verification result' });
  const snapshot = panel.getByRole('region', { name: 'Account snapshot' });
  await expect(result).toContainText('Partial Match');
  await expect(snapshot).toContainText('Partially matches person name');
  await expect(snapshot).toContainText('Open');
  await expect(snapshot).toContainText('No NSF found');
  await expect(snapshot).toContainText('First seen on the status date; no earlier history supplied');
  const confirmation = panel.locator('dl[aria-label="Searched payment identifiers"]');
  await expect(confirmation).toContainText('Source record');
  await expect(confirmation).toContainText('PAY-3302');

  await expect(result).not.toContainText(/A\. Brooks|account holder|ownership history|prior-use history|return \/ NSF history|verification attempts|evidence-first summary/i);
  await expect(result).not.toContainText(/\b(?:approve|deny|hold|release|ready for payments)\b/i);

  const layout = await page.evaluate(() => {
    const panelElement = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const detail = document.querySelector('.payment-mission-result');
    const facts = document.querySelector('.payment-mission-facts');
    const viewportWidth = window.innerWidth;
    const fits = (element) => {
      const rect = element?.getBoundingClientRect();
      return Boolean(rect && rect.left >= -1 && rect.right <= viewportWidth + 1);
    };
    return {
      panelFits: fits(panelElement),
      detailFits: fits(detail),
      factsFit: fits(facts),
      columns: getComputedStyle(facts).gridTemplateColumns.split(' ').filter(Boolean).length,
    };
  });
  expect(layout.panelFits && layout.detailFits && layout.factsFit).toBe(true);
  expect(layout.columns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 4);

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
  await expect(panel.getByRole('region', { name: 'Account snapshot' })).toHaveCount(0);
  await expect(panel.getByRole('status', { name: 'Payment verification result' })).toHaveCount(0);
  await expect(panel.locator('.payment-comparison-panel')).toHaveCount(0);
  await expect(panel).not.toContainText('No prior external destination on file');

  await runPaymentVerification(panel, {
    bankCode: 'BC-204',
    destinationId: 'DST-7740',
    ownerName: 'Avery Brooks',
  });
  const revealedDetail = panel.getByRole('status', { name: 'Payment verification result' });
  await expect(revealedDetail).toBeVisible();
  await expect(revealedDetail).toContainText('BC-204');
  await expect(revealedDetail).toContainText('DST-7740');
  await expect(revealedDetail).toContainText('Partially matches person name');
  await expect(revealedDetail).toContainText('PAY-3302');
  await expect(revealedDetail).not.toContainText('No prior external destination on file');
  await expect(revealedDetail).not.toContainText(/A\. Brooks|account holder|verification attempts|evidence-first summary/i);
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
  const payrollRecords = payrollPanel.getByRole('region', { name: 'Payroll History records' });
  const firstPayrollRecord = payrollRecords.locator('[data-payroll-history-record]').first();
  await expect(firstPayrollRecord).toBeVisible();
  await firstPayrollRecord.click();

  const paystubs = payrollPanel.getByRole('region', { name: 'Immutable employee paystubs' });
  const firstPaystub = paystubs.locator('tbody tr').first();
  await expect(firstPaystub).toBeVisible();
  const ownerName = (await firstPaystub.locator('td').first().innerText()).trim();
  const [bankCode, destinationId] = (await firstPaystub.locator('td').last().locator('span').innerText())
    .split('·')
    .map((value) => value.trim());
  expect(bankCode).toMatch(/^BC-[A-Z0-9-]+$/i);
  expect(destinationId).toMatch(/^DST-[A-Z0-9-]+$/i);

  await firstPaystub.getByRole('button', { name: 'Open Payment Verification', exact: true }).click();
  const verificationPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(verificationPanel).toHaveAttribute('data-tool-name', 'Payment Verification');
  await expect(verificationPanel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue(bankCode);
  await expect(verificationPanel.getByRole('textbox', { name: 'Destination ID', exact: true })).toHaveValue(destinationId);
  await expect(verificationPanel.getByRole('textbox', { name: 'Owner or business name', exact: true })).toHaveValue(ownerName);
  await expect(verificationPanel.getByRole('region', { name: 'Account snapshot' })).toHaveCount(0);
  await expect(verificationPanel.getByRole('status', { name: 'Payment verification result' })).toHaveCount(0);
  await expect(verificationPanel.locator('.payment-comparison-panel')).toHaveCount(0);

  await verificationPanel.getByRole('button', { name: 'Run verification', exact: true }).click();
  const result = verificationPanel.getByRole('status', { name: 'Payment verification result' });
  await expect(result).toContainText(bankCode);
  await expect(result).toContainText(destinationId);
  for (const label of ['Name relationship', 'Account status', 'NSF result', 'Time open / on record']) {
    await expect(result.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(result).not.toContainText(/account holder|ownership status|verification attempts|confidence score|ready for payments/i);
  await page.screenshot({ path: testInfo.outputPath(`payment-verification-generated-payroll-${testInfo.project.name}.png`), fullPage: true });
});
