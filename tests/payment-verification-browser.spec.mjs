import { test, expect } from '@playwright/test';
import { runPaymentVerification, selectToolGroup } from './workspace-page-helpers.mjs';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'mobile-chromium') return;
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  });
});

async function selectCurrentGroupTool(page, toolName) {
  const mobileShell = page.locator('.mission-workspace-v3');
  if (await mobileShell.isVisible()) {
    const selector = page.getByRole('combobox', { name: 'Choose mobile investigation tool', exact: true });
    await expect(selector).toBeVisible();
    if (await selector.inputValue() !== toolName) await selector.selectOption(toolName);
    await expect(mobileShell).toHaveAttribute('data-active-tool', toolName);
    return;
  }

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const selector = panel.getByRole('combobox', { name: 'Choose investigation tool', exact: true });
  await expect(selector).toBeVisible();
  if (await selector.inputValue() !== toolName) await selector.selectOption(toolName);
  await expect(panel).toHaveAttribute('data-tool-name', toolName);
}

async function openPaymentVerification(page) {
  await selectToolGroup(page, /Business & Payment Verification/);
  await selectCurrentGroupTool(page, 'Payment Verification');
  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(panel).toBeVisible();
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

test('Avery Customer 360 shows the exact account change and prefills without revealing the result', async ({ page }, testInfo) => {
  await page.goto('/');
  const caseSelector = page.locator('.visual-case-switcher select');
  await caseSelector.selectOption('FA-CR-24003');
  await expect(caseSelector).toHaveValue('FA-CR-24003');
  await selectToolGroup(page, /Identity & Customer/);

  const customer = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer).toBeVisible();
  const accountChange = customer.getByRole('region', { name: 'Payment Account Change', exact: true });
  await expect(accountChange).toBeVisible();
  for (const label of ['Bank Code', 'Destination ID', 'Previous account / destination', 'New account / destination', 'Change comparison']) {
    await expect(accountChange.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(accountChange).toContainText('BC-204');
  await expect(accountChange).toContainText('DST-7740');
  await expect(accountChange).toContainText('No prior external destination on file');
  await expect(accountChange).toContainText('BC-204 / DST-7740');

  let prefillSource = accountChange;
  if (testInfo.project.name === 'mobile-chromium') {
    const profileEvent = customer.locator('[data-profile-event="PCH-3301"]');
    await expect(profileEvent).toBeVisible();
    await expect(profileEvent).toContainText('No prior external destination on file');
    await expect(profileEvent).toContainText('Bank Code BC-204 · Destination ID DST-7740');
  } else {
    const tabs = customer.getByRole('tablist', { name: 'Customer 360 dossier tabs' });
    await tabs.getByRole('tab', { name: 'Accounts', exact: true }).click();
    const inputs = customer.getByRole('region', { name: 'Payment Verification Inputs' });
    await expect(inputs).toContainText('BC-204');
    await expect(inputs).toContainText('DST-7740');
    await expect(inputs).toContainText('No prior external destination on file');
    await expect(inputs).toContainText('BC-204 / DST-7740');

    await tabs.getByRole('tab', { name: 'Profile History', exact: true }).click();
    const profileEvent = customer.locator('[data-profile-event="PCH-3301"]');
    await expect(profileEvent).toBeVisible();
    await expect(profileEvent).toContainText('No prior external destination on file');
    await expect(profileEvent).toContainText('Bank Code BC-204 · Destination ID DST-7740');
    const profileChange = profileEvent.getByRole('region', { name: 'Payment account change details for PCH-3301', exact: true });
    await expect(profileChange).toBeVisible();
    for (const label of ['Bank Code', 'Destination ID', 'Previous account / destination', 'New account / destination', 'Change comparison']) {
      await expect(profileChange.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(profileChange).toContainText('BC-204');
    await expect(profileChange).toContainText('DST-7740');
    await expect(profileChange).toContainText('No prior external destination on file');
    await expect(profileChange).toContainText('BC-204 / DST-7740');

    await tabs.getByRole('tab', { name: 'Accounts', exact: true }).click();
    prefillSource = inputs;
  }
  await prefillSource.getByRole('button', { name: 'Prefill Payment Verification' }).first().click();

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(panel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue('BC-204');
  await expect(panel.getByRole('textbox', { name: 'Destination ID', exact: true })).toHaveValue('DST-7740');
  await expect(panel.getByRole('textbox', { name: 'Owner or business name', exact: true })).toHaveValue('Avery Brooks');
  await expect(panel.locator('.payment-verification-snapshot')).toHaveCount(0);
  await expect(panel.locator('.payment-detail-panel')).toHaveCount(0);
  await expect(panel.locator('.payment-comparison-panel')).toHaveCount(0);
  await expect(panel).not.toContainText('No prior external destination on file');

  await panel.getByRole('button', { name: 'Run verification', exact: true }).click();
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
  await queue.getByLabel('Generate case claim type').selectOption('payroll-direct-deposit');
  await queue.getByLabel('Generate case scenario').selectOption('pay-direct-deposit-change');
  await queue.getByLabel('Generate case difficulty').selectOption('deep');
  await queue.getByLabel('Generate case evidence depth').selectOption('deep');
  await queue.getByLabel('Generate case count').selectOption('1');
  await queue.getByRole('button', { name: 'Generate cases', exact: true }).click();

  const briefing = page.locator('[data-workspace-page="briefing"]');
  await expect(briefing).toBeVisible();
  const generatedCaseId = await page.locator('.visual-case-switcher select').inputValue();
  expect(generatedCaseId).toMatch(/^FA-PAY-G\d+$/);

  await selectToolGroup(page, /Business & Payment Verification/);
  await selectCurrentGroupTool(page, 'Payroll History');
  const payrollPanel = testInfo.project.name === 'mobile-chromium'
    ? page.locator('[data-payroll-history-screen="approved-mobile-reference"]')
    : page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(payrollPanel).toBeVisible();
  if (testInfo.project.name !== 'mobile-chromium') {
    await expect(payrollPanel).toHaveAttribute('data-tool-name', 'Payroll History');
  }

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
