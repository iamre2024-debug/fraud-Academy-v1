import { test, expect } from '@playwright/test';
import { selectToolGroup } from './workspace-page-helpers.mjs';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'mobile-chromium') return;
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  });
});

async function openBusinessToolGroup(page) {
  await page.goto('/');
  const caseSelector = page.locator('.visual-case-switcher select');
  await caseSelector.selectOption('FA-CR-24003');
  await expect(caseSelector).toHaveValue('FA-CR-24003');
  await selectToolGroup(page, /Business & Payment Verification/);
  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(panel).toBeVisible();
  return {
    panel,
    toolSelect: panel.getByRole('combobox', { name: 'Choose investigation tool' }),
  };
}

test('Business 360 and Payroll History provide complete responsive workspaces', async ({ page }, testInfo) => {
  const { panel, toolSelect } = await openBusinessToolGroup(page);

  await expect(toolSelect.locator('option', { hasText: 'KYB Review' })).toHaveCount(0);
  await toolSelect.selectOption('Business 360');
  await expect(panel).toHaveAttribute('data-tool-name', 'Business 360');
  const businessProfile = panel.locator('.business-360-dossier');
  await expect(businessProfile).toContainText('Lakeside Office Supply LLC');
  for (const label of ['Legal business name', 'DBA', 'Entity type', 'Masked EIN', 'State registration / file number', 'Formation date', 'Formation state', 'Business standing', 'Industry', 'NAICS']) {
    await expect(businessProfile.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(businessProfile).not.toContainText('FA-CR-24003');
  await expect(businessProfile).not.toContainText('CLM-CR-24003');
  await expect(businessProfile).not.toContainText('DST-7740');
  await expect(businessProfile).not.toContainText(/Case context|Payment account change|fraud conclusion/i);

  const businessTabs = panel.getByRole('tablist', { name: 'Business 360 sections' });
  await businessTabs.getByRole('tab', { name: 'Owners & Control', exact: true }).click();
  await expect(panel.getByRole('heading', { name: 'Owners and Controlling Parties', exact: true })).toBeVisible();
  await expect(panel).toContainText('Renee Wallace');
  await expect(panel.getByRole('button', { name: 'Open Owner Profile', exact: true }).first()).toBeVisible();

  await businessTabs.getByRole('tab', { name: 'Luna Business Research', exact: true }).click();
  const luna = panel.getByRole('region', { name: 'Luna Business Research', exact: true });
  await expect(luna.locator('[data-research-status]')).toHaveCount(5);
  for (const topic of [
    'Owner-to-business relationship',
    'State entity registration',
    'Professional or industry license',
    'Website, domain, or directory presence',
    'Name, address, phone, email, owners, and dates',
  ]) {
    await expect(luna).toContainText(topic);
  }
  await expect(luna).toContainText(/Checked/);
  await expect(luna).toContainText('not proof that the business does not exist');
  await expect(luna).not.toContainText(/\b(?:confirmed fraud|fake business|fraudulent owner|shell company|nonexistent business)\b/i);

  await panel.getByRole('button', { name: 'Mark Business 360 reviewed', exact: true }).click();
  await expect(panel.getByRole('button', { name: '✓ Business 360 reviewed', exact: true })).toBeVisible();

  const businessLayout = await page.evaluate(() => {
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    };
  });
  expect(businessLayout.documentWidth).toBeLessThanOrEqual(businessLayout.viewportWidth + 1);

  await toolSelect.selectOption('Payroll History');
  await expect(panel).toHaveAttribute('data-tool-name', 'Payroll History');
  const companyHeader = panel.getByRole('region', { name: 'Company payroll header' });
  await expect(companyHeader).toContainText('Lakeside Office Supply LLC');
  for (const label of ['Payroll ID', 'Pay schedule', 'Next pay date', 'Active employee count', 'Selected date range']) {
    await expect(companyHeader.getByText(label, { exact: true })).toBeVisible();
  }
  const companySummary = panel.getByRole('region', { name: 'Company payroll selected-range summary' });
  for (const label of ['Total payroll cost', 'Employees paid', 'Gross wages', 'Employee taxes withheld', 'Employer taxes', 'Deductions', 'Employer contributions', 'Reimbursements', 'Net pay', 'Total funding amount']) {
    await expect(companySummary.getByText(label, { exact: true })).toBeVisible();
  }
  const runList = panel.getByRole('region', { name: 'Company payroll runs' });
  await expect(runList.locator('[data-payroll-run]')).toHaveCount(6);
  await expect(runList).not.toContainText('Avery Brooks');
  await runList.getByRole('button', { name: 'Open Payroll', exact: true }).first().click();

  const runDetail = panel.getByRole('region', { name: 'Payroll Run Detail' });
  for (const label of ['Run ID', 'Pay period', 'Pay date', 'Run type', 'Status', 'Number of employees', 'Gross wages', 'Employee taxes', 'Employer taxes', 'Deductions', 'Employer contributions', 'Reimbursements', 'Net pay', 'Total company debit', 'Company funding Bank Code', 'Company funding account used', 'Submission date', 'Settlement date', 'Submitted by', 'Approved by']) {
    await expect(runDetail.getByText(label, { exact: true })).toBeVisible();
  }
  const employees = panel.getByRole('region', { name: 'Employees included in payroll run' });
  await expect(employees.locator('tbody tr')).toHaveCount(3);
  await employees.getByRole('button', { name: 'Avery Brooks', exact: true }).click();

  const employeeHistory = panel.getByRole('region', { name: 'Employee Payroll History' });
  await expect(employeeHistory).toContainText('Avery Brooks');
  await expect(employeeHistory).toContainText('EMP-LS-1042');
  await expect(employeeHistory.getByRole('button', { name: 'Open Employee Profile', exact: true })).toBeVisible();
  const paychecks = panel.getByRole('region', { name: 'Avery Brooks paycheck history' });
  await expect(paychecks.locator('[data-paycheck]')).toHaveCount(6);
  await expect(paychecks).not.toContainText(/Employment status|Department|Position|Pay schedule|Compensation type|Hire date|W-4|Tax elections/);
  await paychecks.locator('[data-paycheck]').last().click();

  const paystub = panel.getByRole('region', { name: 'Individual Paystub' });
  for (const heading of ['Employer', 'Employee', 'Paycheck', 'Earnings', 'Taxes', 'Deductions and contributions', 'Reimbursements', 'Adjustments', 'YTD snapshot']) {
    await expect(paystub.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  const payment = panel.getByRole('region', { name: 'Paystub payment destinations' });
  await expect(payment).toContainText('BC-612');
  await expect(payment).toContainText('DST-1048');
  await expect(payment).not.toContainText('DST-7740');
  for (const label of ['Payment method', 'Employee Bank Code', 'Destination ID', 'Deposited amount', 'Payment status', 'Settlement date', 'Payment record ID']) {
    await expect(payment.getByText(label, { exact: true })).toBeVisible();
  }
  await payment.getByRole('button', { name: 'Copy Bank Code', exact: true }).click();
  await payment.getByRole('button', { name: 'Pin Bank Code to Quick Pad', exact: true }).click();
  await payment.getByRole('button', { name: 'Copy Destination ID', exact: true }).click();
  await payment.getByRole('button', { name: 'Pin Destination ID to Quick Pad', exact: true }).click();
  await expect(page.getByRole('button', { name: /Open Quick Pad, 2 saved items/ })).toBeVisible();

  await payment.getByRole('button', { name: 'Open Payment Verification', exact: true }).click();
  await expect(panel).toHaveAttribute('data-tool-name', 'Payment Verification');
  await expect(panel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue('BC-612');
  await expect(panel.getByRole('textbox', { name: 'Destination ID', exact: true })).toHaveValue('DST-1048');
  await expect(panel.locator('.payment-detail-panel')).toHaveCount(0);
  await expect(panel.locator('.payment-verification-snapshot')).toHaveCount(0);

  const finalLayout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    panelRight: document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]')?.getBoundingClientRect().right ?? 0,
  }));
  expect(finalLayout.documentWidth).toBeLessThanOrEqual(finalLayout.viewportWidth + 1);
  expect(finalLayout.panelRight).toBeLessThanOrEqual(finalLayout.viewportWidth + 1);
});
