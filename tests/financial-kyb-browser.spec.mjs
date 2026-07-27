import { test, expect } from '@playwright/test';
import {
  createGeneratedCase,
  getGeneratedCaseTruth,
} from '../src/data/generatedCases.js';
import { getFinancialInvestigation } from '../src/data/financialInvestigationRecords.js';
import { selectToolGroup } from './workspace-page-helpers.mjs';

const forbiddenPreDecisionCopy = /\b(?:fraud\s+(?:rule|score)|risk\s+score|automatic\s+risk\s+(?:label|conclusion)|accepted\s+determination|correct\s+determination|scenario\s+truth|hidden\s+(?:case\s+)?truth|final\s+finding)\b/i;

const personalCardCase = createGeneratedCase({
  index: 97000,
  customerType: 'personal',
  productType: 'credit-card',
  workflowType: 'credit-risk-review',
  difficulty: 'standard',
  evidenceDepth: 'standard',
});

const personalInstallmentLoanCase = createGeneratedCase({
  index: 97002,
  customerType: 'personal',
  productType: 'personal-loan',
  workflowType: 'credit-risk-review',
  difficulty: 'standard',
  evidenceDepth: 'standard',
});

const businessPayrollCase = createGeneratedCase({
  index: 97003,
  customerType: 'business',
  productType: 'payroll-product',
  workflowType: 'payroll-change-alert',
  difficulty: 'standard',
  evidenceDepth: 'standard',
});

const personalCardModel = getFinancialInvestigation(personalCardCase);
const personalLoanModel = getFinancialInvestigation(personalInstallmentLoanCase);
const businessPayrollModel = getFinancialInvestigation(businessPayrollCase);

function cents(value) {
  return Math.round(Number(value) * 100);
}

async function seedGeneratedCase(page, caseRecord, testInfo) {
  const layoutMode = testInfo.project.name === 'mobile-chromium' ? 'mobile' : 'desktop';
  await page.addInitScript(({ record, layout }) => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', layout);
    window.localStorage.setItem('fraud-academy-generated-cases-v1', JSON.stringify([record]));
    window.localStorage.removeItem('fraud-academy-review-packages-v1');
    window.localStorage.removeItem('fraud-academy-decision-drafts-v1');
    window.localStorage.removeItem('fraud-academy-note-drafts-v1');
  }, { record: caseRecord, layout: layoutMode });
}

async function openFinancialInvestigation(page, caseRecord, testInfo) {
  await seedGeneratedCase(page, caseRecord, testInfo);
  await page.goto('/');

  const caseSelector = page.locator('.visual-case-switcher select').first();
  await expect(caseSelector.locator(`option[value="${caseRecord.id}"]`)).toHaveCount(1);
  await caseSelector.selectOption(caseRecord.id);
  await expect(caseSelector).toHaveValue(caseRecord.id);

  const mobileBriefingFiles = page.getByRole('navigation', { name: 'Case briefing files' });
  if (await mobileBriefingFiles.isVisible()) {
    await mobileBriefingFiles.getByRole('button', { name: 'Investigation launchpad' }).click();
  }
  await page.getByRole('button', { name: /Begin investigation/i }).click();

  await selectToolGroup(page, /Transactions & Financial/);
  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const toolSelect = toolPanel.getByRole('combobox', { name: 'Choose investigation tool' });
  await expect(toolSelect.locator('option[value="Financial Investigation"]')).toHaveCount(1);
  await toolSelect.selectOption('Financial Investigation');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Financial Investigation');
  await expect(toolPanel.getByRole('heading', {
    name: 'What financial activity is recorded for this product and review period?',
    exact: true,
  })).toBeVisible();

  return toolPanel;
}

async function assertEvidenceFirstFinancialWorkspace(toolPanel, caseRecord) {
  const text = await toolPanel.innerText();
  const hiddenTruth = getGeneratedCaseTruth(caseRecord, { submitted: true });

  expect(text).not.toMatch(forbiddenPreDecisionCopy);
  expect(text).not.toContain(caseRecord.alertReason);
  expect(text).not.toMatch(/\b(?:Alert reason|Case alert)\b/i);
  if (hiddenTruth?.findingBasis) expect(text).not.toContain(hiddenTruth.findingBasis);
  if (hiddenTruth?.classification) expect(text).not.toContain(hiddenTruth.classification);
  if (hiddenTruth?.finalFinding) expect(text).not.toContain(hiddenTruth.finalFinding);
}

async function assertFinancialViewport(page, toolPanel) {
  const layout = await toolPanel.evaluate((panel) => {
    const bounds = panel.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      left: bounds.left,
      right: bounds.right,
      width: bounds.width,
    };
  });
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.left).toBeGreaterThanOrEqual(-1);
  expect(layout.right).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.width).toBeGreaterThan(250);
}

test('personal credit-card Financial Investigation formats dated comparisons and reconciles spending filters', async ({ page }, testInfo) => {
  const toolPanel = await openFinancialInvestigation(page, personalCardCase, testInfo);
  const tabs = toolPanel.getByRole('navigation', { name: 'Financial Investigation sections' });

  await expect(toolPanel.locator('.financial-account-strip')).toContainText('Personal');
  await expect(toolPanel.locator('.financial-account-strip')).toContainText('Credit card');
  await expect(tabs.getByRole('button', { name: 'Spending Analysis', exact: true })).toBeVisible();
  await expect(tabs.getByRole('button', { name: 'Personal Deposit Analysis', exact: true })).toHaveCount(0);

  const utilizationRecord = personalCardModel.recordsBySection['account-review'].find((record) => (
    record.fields.some(([label]) => label === 'Utilization')
  ));
  expect(utilizationRecord).toBeTruthy();
  const utilization = utilizationRecord.fields.find(([label]) => label === 'Utilization')?.[1];
  expect(utilization).toMatch(/^\d+(?:\.\d+)?%$/);
  await toolPanel.locator(`[data-financial-investigation-record="${utilizationRecord.id}"]`).click();
  const utilizationField = toolPanel.locator('.financial-record-detail')
    .getByText('Utilization', { exact: true })
    .locator('..');
  await expect(utilizationField).toContainText(utilization);

  await tabs.getByRole('button', { name: 'Current vs Historical', exact: true }).click();
  const comparisonGrid = toolPanel.getByRole('region', {
    name: 'Current and historical financial comparisons',
  });
  const comparisonCards = comparisonGrid.locator('article');
  await expect(comparisonCards).toHaveCount(personalCardModel.comparisons.length);
  for (const comparison of personalCardModel.comparisons) {
    const card = comparisonCards.filter({ hasText: comparison.label });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(`Baseline ${comparison.baselineDisplay}`);
    await expect(card).toContainText(comparison.baselineDateRange);
    await expect(card).toContainText(`Current ${comparison.currentDisplay}`);
    await expect(card).toContainText(comparison.currentDateRange);
    await expect(card).toContainText(comparison.explanation);
  }
  const currencyComparison = personalCardModel.comparisons.find((item) => item.valueType === 'currency');
  expect(currencyComparison?.baselineDisplay).toMatch(/^\$-?\d{1,3}(?:,\d{3})*\.\d{2}$/);
  expect(currencyComparison?.currentDisplay).toMatch(/^\$-?\d{1,3}(?:,\d{3})*\.\d{2}$/);

  await tabs.getByRole('button', { name: 'Spending Analysis', exact: true }).click();
  const spendingSummary = toolPanel.getByRole('region', { name: 'Spending total reconciliation' });
  await expect(spendingSummary).toContainText(personalCardModel.spending.visibleTotalDisplay);
  await expect(spendingSummary).toContainText(personalCardModel.spending.periodOutflowDisplay);
  await expect(spendingSummary).toContainText(personalCardModel.spending.periodRange.label);

  const granularityFilter = toolPanel.getByRole('combobox', {
    name: 'Financial Investigation spending granularity filter',
  });
  const dateFilter = toolPanel.getByRole('combobox', {
    name: 'Financial Investigation spending date filter',
  });
  for (const granularity of ['day', 'week', 'month']) {
    await granularityFilter.selectOption(granularity);
    const expectedBuckets = personalCardModel.spending.aggregations[granularity];
    const summaries = toolPanel.getByRole('region', {
      name: `Spending Analysis ${granularity} summaries`,
    });
    await expect(dateFilter.locator('option')).toHaveCount(expectedBuckets.length + 1);
    await expect(summaries.locator('article')).toHaveCount(expectedBuckets.length);

    for (const bucket of expectedBuckets) {
      const card = summaries.locator('article').filter({ hasText: bucket.label });
      await expect(card).toHaveCount(1);
      await expect(card).toContainText(
        `${bucket.visibleTotalDisplay} across ${bucket.transactionCount.toLocaleString('en-US')} record`,
      );
      await expect(card).toContainText(`${bucket.startDate} to ${bucket.endDate}`);
    }

    expect(cents(expectedBuckets.reduce((total, bucket) => total + bucket.visibleTotal, 0)))
      .toBe(cents(personalCardModel.spending.visibleTotal));
  }

  await granularityFilter.selectOption('month');
  const multiRecordMonth = personalCardModel.spending.aggregations.month.find(
    (bucket) => bucket.transactionCount > 1,
  );
  expect(multiRecordMonth).toBeTruthy();
  await dateFilter.selectOption(multiRecordMonth.id);
  await expect(toolPanel.locator('[data-financial-investigation-record]'))
    .toHaveCount(multiRecordMonth.transactionCount);
  const selectedMonthSummary = toolPanel.getByRole('region', {
    name: 'Spending Analysis month summaries',
  });
  await expect(selectedMonthSummary.locator('article')).toHaveCount(1);
  await expect(selectedMonthSummary).toContainText(multiRecordMonth.visibleTotalDisplay);

  await assertEvidenceFirstFinancialWorkspace(toolPanel, personalCardCase);
  await assertFinancialViewport(page, toolPanel);
});

test('personal installment-loan Financial Investigation prioritizes dated payments and omits purchase spending', async ({ page }, testInfo) => {
  const toolPanel = await openFinancialInvestigation(page, personalInstallmentLoanCase, testInfo);
  const tabs = toolPanel.getByRole('navigation', { name: 'Financial Investigation sections' });

  await expect(toolPanel.locator('.financial-account-strip')).toContainText('Personal');
  await expect(toolPanel.locator('.financial-account-strip')).toContainText('Personal loan');
  await expect(tabs.getByRole('button', { name: 'Credit & Loan Payments', exact: true })).toBeVisible();
  await expect(tabs.getByRole('button', { name: 'Spending Analysis', exact: true })).toHaveCount(0);
  await expect(tabs.getByRole('button', { name: 'Personal Deposit Analysis', exact: true })).toHaveCount(0);

  await tabs.getByRole('button', { name: 'Credit & Loan Payments', exact: true }).click();
  const paymentSummary = toolPanel.getByRole('region', { name: 'Credit and loan payment summary' });
  await expect(paymentSummary).toContainText(personalLoanModel.payments.averageMonthlyPaymentDisplay);
  await expect(paymentSummary).toContainText(personalLoanModel.payments.actualTotalDisplay);

  const monthlyPayments = toolPanel.getByRole('region', { name: 'Monthly credit and loan payments' });
  await expect(monthlyPayments.locator('article')).toHaveCount(personalLoanModel.payments.monthlyRows.length);
  for (const month of personalLoanModel.payments.monthlyRows) {
    const card = monthlyPayments.locator('article').filter({ hasText: month.label });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(`${month.startDate} to ${month.endDate}`);
    await expect(card).toContainText(`Scheduled / minimum ${month.scheduledAmountDisplay}`);
    await expect(card).toContainText(`Actual ${month.actualPaidDisplay}`);
    await expect(card).toContainText('Status:');
    await expect(card).toContainText('Source:');
    await expect(card).toContainText('Balance after:');
  }

  const datedPayment = personalLoanModel.payments.datedRecords[0];
  expect(datedPayment).toBeTruthy();
  await toolPanel.locator(`[data-financial-investigation-record="${datedPayment.id}"]`).click();
  const paymentDetail = toolPanel.locator('.financial-record-detail');
  for (const field of [
    'Scheduled / minimum amount',
    'Actual paid',
    'Payment date',
    'Payment status',
    'Payment source',
    'Balance after payment',
  ]) {
    await expect(paymentDetail.getByText(field, { exact: true })).toBeVisible();
  }

  await assertEvidenceFirstFinancialWorkspace(toolPanel, personalInstallmentLoanCase);
  await assertFinancialViewport(page, toolPanel);
});

test('business payroll Financial Investigation reconciles month and pay-period totals and routes the exact run', async ({ page }, testInfo) => {
  const toolPanel = await openFinancialInvestigation(page, businessPayrollCase, testInfo);
  const tabs = toolPanel.getByRole('navigation', { name: 'Financial Investigation sections' });

  await expect(toolPanel.locator('.financial-account-strip')).toContainText('Business');
  await expect(toolPanel.locator('.financial-account-strip')).toContainText('Payroll or payroll-funding product');
  await expect(tabs.getByRole('button', { name: 'Business Payroll Analysis', exact: true })).toBeVisible();
  await expect(tabs.getByRole('button', { name: 'Personal Deposit Analysis', exact: true })).toHaveCount(0);
  await expect(tabs.getByRole('button', { name: 'Spending Analysis', exact: true })).toHaveCount(0);
  await expect(toolPanel).not.toContainText('Debt-to-income');
  await expect(toolPanel).not.toContainText(/\bDTI\b/);

  await tabs.getByRole('button', { name: 'Business Payroll Analysis', exact: true }).click();
  const monthlyTotals = toolPanel.getByRole('region', { name: 'Business payroll monthly totals' });
  await expect(monthlyTotals.locator('article')).toHaveCount(businessPayrollModel.payroll.months.length);
  for (const month of businessPayrollModel.payroll.months) {
    const monthRuns = businessPayrollModel.payroll.payPeriods.filter((run) => run.monthId === month.id);
    expect(cents(monthRuns.reduce((total, run) => total + run.total, 0)))
      .toBe(cents(month.companyDebit));

    const card = monthlyTotals.locator('article').filter({ hasText: month.label });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(`${month.startDate} to ${month.endDate}`);
    await expect(card).toContainText(`Total company debit ${month.companyDebitDisplay}`);
    await expect(card).toContainText(`${month.runCount} pay period`);
    await expect(card).toContainText('Gross wages');
    await expect(card).toContainText('Employee taxes');
    await expect(card).toContainText('Employer taxes');
    await expect(card).toContainText('Employer contributions');
    await expect(card).toContainText('Net payroll');
  }

  const payrollRecords = toolPanel.locator('[data-financial-investigation-record]');
  await expect(payrollRecords).toHaveCount(businessPayrollModel.payroll.records.length);
  for (const run of businessPayrollModel.payroll.records) {
    await expect(toolPanel.locator(`[data-financial-investigation-record="${run.id}"]`))
      .toContainText(run.value);
  }

  const monthFilter = toolPanel.getByRole('combobox', {
    name: 'Financial Investigation payroll month filter',
  });
  const periodFilter = toolPanel.getByRole('combobox', {
    name: 'Financial Investigation pay-period filter',
  });
  await expect(toolPanel.getByRole('combobox', {
    name: 'Financial Investigation payroll run-type filter',
  })).toBeVisible();
  await expect(toolPanel.getByRole('combobox', {
    name: 'Financial Investigation payroll run-status filter',
  })).toBeVisible();

  const selectedMonth = businessPayrollModel.payroll.months[0];
  const selectedRun = businessPayrollModel.payroll.records.find(
    (record) => record.monthId === selectedMonth.id,
  );
  await monthFilter.selectOption(selectedMonth.id);
  await expect(payrollRecords).toHaveCount(selectedMonth.runCount);
  await periodFilter.selectOption(selectedRun.id);
  await expect(payrollRecords).toHaveCount(1);
  await expect(toolPanel.locator('.financial-record-detail')).toContainText(selectedRun.id);

  await assertEvidenceFirstFinancialWorkspace(toolPanel, businessPayrollCase);
  await assertFinancialViewport(page, toolPanel);

  await toolPanel.getByRole('button', {
    name: `Open ${selectedRun.id} in Payroll History`,
    exact: true,
  }).click();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Payroll History');
  await expect(toolPanel.getByRole('region', { name: 'Payroll History detail' }))
    .toContainText(selectedRun.id);
  await expect(toolPanel.locator(`[data-payroll-history-record="${selectedRun.id}"]`))
    .toHaveClass(/active/);
});
