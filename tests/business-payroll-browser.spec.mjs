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
  const businessProfile = panel.getByRole('region', { name: 'Business 360 profile' });
  await expect(businessProfile).toContainText('Lakeside Office Supply LLC');
  for (const label of ['Legal name', 'DBA', 'Entity type', 'Masked EIN', 'State registration / file number', 'Formation date', 'Formation state', 'Current standing', 'Industry', 'NAICS']) {
    await expect(businessProfile.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(businessProfile).not.toContainText('FA-CR-24003');
  await expect(businessProfile).not.toContainText('CLM-CR-24003');
  await expect(businessProfile).not.toContainText('DST-7740');
  await expect(businessProfile).not.toContainText(/Case context|Payment account change|fraud conclusion/i);

  await panel.getByRole('button', { name: 'Ownership & Control', exact: true }).click();
  await expect(panel.getByRole('region', { name: 'Ownership and control summary' })).toContainText('Renee Wallace');
  await expect(panel.getByRole('button', { name: 'Open Owner Identity Profile', exact: true }).first()).toBeVisible();

  await panel.getByRole('button', { name: 'Operating Footprint', exact: true }).click();
  const footprint = panel.getByRole('region', { name: 'Operating footprint summary' });
  for (const label of ['Physical address', 'Mailing address', 'Registered agent', 'Phone', 'Business email', 'Website', 'Business age', 'Known operating locations', 'Estimated employee count']) {
    await expect(footprint.getByText(label, { exact: true })).toBeVisible();
  }

  await panel.getByRole('button', { name: 'Institution Relationship', exact: true }).click();
  const relationship = panel.getByRole('region', { name: 'Institution relationship summary' });
  await expect(relationship).toContainText('Restrictions or holds');
  await expect(relationship).toContainText('NSF / returned-payment context');
  await expect(relationship).toContainText('Recorded repayment source');

  await panel.getByRole('button', { name: 'Luna Business Research', exact: true }).click();
  const luna = panel.getByRole('region', { name: 'Luna Business Research' });
  await expect(luna.locator('[data-luna-status]')).toHaveCount(5);
  for (const topic of ['Owner linkage', 'Entity registration', 'Industry or professional license', 'Web presence', 'Cross-source consistency']) {
    await expect(luna).toContainText(topic);
  }
  await expect(luna).toContainText('Fictional source checked');
  await expect(luna).toContainText('Checked date');
  await expect(luna).toContainText('No live government, licensing, domain, directory, or internet search occurred.');
  await expect(luna).not.toContainText(/\b(?:confirmed fraud|fake business|fraudulent owner|shell company|nonexistent business)\b/i);

  const report = panel.getByRole('complementary', { name: 'Business 360 report' });
  await report.getByRole('button', { name: 'Generate report', exact: true }).click();
  await expect(report.getByRole('button', { name: 'Regenerate report', exact: true })).toBeVisible();
  const reportDownload = page.waitForEvent('download');
  await report.getByRole('button', { name: 'Export report', exact: true }).click();
  expect((await reportDownload).suggestedFilename()).toContain('RPT-B360');
  await panel.getByRole('button', { name: 'Mark Business 360 reviewed', exact: true }).click();
  await expect(panel.getByRole('button', { name: '✓ Business 360 reviewed', exact: true })).toBeVisible();

  const businessLayout = await page.evaluate(() => {
    const workspace = document.querySelector('.business-360-workspace');
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      columns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });
  expect(businessLayout.documentWidth).toBeLessThanOrEqual(businessLayout.viewportWidth + 1);
  expect(businessLayout.columns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 3);

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
  await expect(paystub).toContainText('BC-612');
  await expect(paystub).toContainText('DST-1048');
  await expect(paystub).not.toContainText('DST-7740');
  const payment = panel.getByRole('region', { name: 'Paystub payment destinations' });
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
