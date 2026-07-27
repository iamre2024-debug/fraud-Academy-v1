import { test, expect } from '@playwright/test';
import { selectToolGroup } from './workspace-page-helpers.mjs';

const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate)\b/i;

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'mobile-chromium') return;
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  });
});

async function openFinancialInvestigation(page) {
  await selectToolGroup(page, /Transactions & Financial/);
  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const toolSelector = panel.getByRole('combobox', { name: 'Choose investigation tool' });
  if (await toolSelector.inputValue() !== 'Financial Investigation') {
    await toolSelector.selectOption('Financial Investigation');
  }
  await expect(panel).toHaveAttribute('data-tool-name', 'Financial Investigation');
  await expect(panel).toHaveAttribute('data-reference-investigation-layout', 'mission-v2');
  await expect(panel.getByRole('heading', { name: 'Financial Investigation', exact: true })).toBeVisible();
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

async function expectSavedCaseState(page, testInfo, { pin, pinCount, noteCount }) {
  if (testInfo.project.name === 'mobile-chromium') {
    const status = page.locator('.mission-workspace-status');
    await expect(status).toContainText(`⭐ ${pinCount} pinned`);
    await expect(status).toContainText(`📝 ${noteCount} notes`);
    return;
  }
  await expect(page.locator('.tray-card')).toContainText(pin);
  await expect(page.locator('.notebook-card')).toContainText('Financial Investigation');
}

test('Financial Investigation renders actual dashboard evidence and keeps explorer actions functional', async ({ page }, testInfo) => {
  await page.goto('/');
  const panel = await openFinancialInvestigation(page);
  const deck = panel.locator('[data-financial-investigation-layout="mission-v2"]');

  await expect(deck).toBeVisible();
  await expect(deck.getByRole('region', { name: 'Financial relationship overview' })).toContainText('Everyday Checking');
  await expect(deck.getByRole('region', { name: 'Financial Investigation account metrics' })).toContainText('$1,100.42');

  const dashboard = deck.getByRole('region', { name: 'Financial Investigation dashboard' });
  await expect(dashboard).toBeVisible();
  await expect(dashboard.getByRole('heading', { name: 'Merchant / vendor trends', exact: true })).toBeVisible();
  await expect(dashboard.locator('.financial-mission-bars')).toContainText('Northstar Digital Market');
  await expect(dashboard.locator('.financial-mission-total')).toContainText('$865.09');
  await expect(dashboard.locator('.financial-mission-categories')).toContainText('Recorded activity channels');
  await expect(dashboard.locator('.financial-mission-accounts')).toContainText('3 supplied accounts');
  await expect(dashboard.locator('.financial-mission-observations')).toContainText('Balance snapshot');
  await expect(panel).not.toContainText(forbiddenPreSubmissionCopy);

  const explorer = deck.locator('.financial-mission-explorer');
  await expect(explorer).toHaveAttribute('open', '');
  await expect(explorer).toContainText('Search, filter, expand, pin, and document');

  const sectionNavigation = explorer.getByRole('navigation', { name: 'Financial Investigation sections' });
  await sectionNavigation.getByRole('button', { name: /^Spending Analysis\b/ }).click();
  await expect(sectionNavigation.getByRole('button', { name: /^Spending Analysis\b/ })).toHaveAttribute('aria-pressed', 'true');

  const granularity = explorer.getByRole('combobox', { name: 'Financial Investigation spending granularity filter' });
  const dateBucket = explorer.getByRole('combobox', { name: 'Financial Investigation spending date filter' });
  await granularity.selectOption('day');
  await expect(dateBucket.locator('option')).toHaveCount(4);
  await dateBucket.selectOption({ index: 1 });
  await expect(explorer.locator('[data-financial-investigation-record]')).toHaveCount(1);
  await dateBucket.selectOption('All dates');

  const records = explorer.locator('[data-financial-investigation-record]');
  await expect(records).toHaveCount(3);
  const firstRecordId = await records.first().getAttribute('data-financial-investigation-record');
  expect(firstRecordId).toBeTruthy();

  const search = explorer.getByRole('textbox', { name: 'Search Financial Investigation records' });
  await search.fill(firstRecordId);
  await expect(records).toHaveCount(1);
  await records.first().click();

  const detail = explorer.getByRole('region', { name: 'Expanded financial record' });
  await expect(detail).toBeVisible();
  await expect(detail).toContainText(firstRecordId);
  let pinCountBefore = 0;
  if (testInfo.project.name === 'mobile-chromium') {
    const pinCountMatch = (await page.locator('.mission-workspace-status').innerText())
      .match(/⭐\s+(\d+)\s+pinned/);
    expect(pinCountMatch).not.toBeNull();
    pinCountBefore = Number(pinCountMatch[1]);
  }
  await detail.getByRole('button', { name: 'Pin record', exact: true }).click();
  await detail.getByRole('button', { name: 'Save evidence note', exact: true }).click();
  await expectSavedCaseState(page, testInfo, {
    pin: firstRecordId,
    pinCount: pinCountBefore + 1,
    noteCount: 1,
  });

  await deck.getByRole('button', { name: 'Mark Financial Investigation reviewed', exact: true }).click();
  await expect(deck.getByRole('button', { name: '✓ Financial Investigation reviewed', exact: true })).toBeVisible();

  const layout = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const fits = (selector) => {
      const element = document.querySelector(selector);
      const rect = element?.getBoundingClientRect();
      return Boolean(rect && rect.left >= -1 && rect.right <= viewportWidth + 1);
    };
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelFits: fits('[data-investigation-tools-screen="approved-theme-v1"]'),
      deckFits: fits('[data-financial-investigation-layout="mission-v2"]'),
      dashboardFits: fits('.financial-mission-dashboard'),
      explorerFits: fits('.financial-mission-explorer'),
      recordListFits: fits('.financial-record-list'),
      detailFits: fits('.financial-record-detail'),
    };
  });
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelFits && layout.deckFits && layout.dashboardFits && layout.explorerFits).toBe(true);
  expect(layout.recordListFits && layout.detailFits).toBe(true);
});

test('Financial Investigation exposes generated payroll totals, filters, and exact Payroll History routing', async ({ page }) => {
  test.setTimeout(90_000);
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

  await expect(page.locator('[data-workspace-page="briefing"]')).toBeVisible();
  const caseSelector = page.locator('.visual-case-switcher select');
  await expect(caseSelector).toHaveValue(/^FA-PCA-G\d+$/);
  const generatedCaseId = await caseSelector.inputValue();
  expect(generatedCaseId).toMatch(/^FA-PCA-G\d+$/);

  const panel = await openFinancialInvestigation(page);
  const deck = panel.locator('[data-financial-investigation-layout="mission-v2"]');
  const dashboard = deck.getByRole('region', { name: 'Financial Investigation dashboard' });
  await expect(dashboard.getByRole('heading', { name: 'Payroll movement', exact: true })).toBeVisible();
  await expect(dashboard.locator('.financial-mission-activity')).toContainText('Exact company debits from Payroll History');
  await expect(dashboard.locator('.financial-mission-bars > button')).toHaveCount(2);
  await expect(dashboard).not.toContainText('Personal deposit analysis');

  await dashboard.locator('.financial-mission-bars > button').first().click();
  const explorer = deck.locator('.financial-mission-explorer');
  const sectionNavigation = explorer.getByRole('navigation', { name: 'Financial Investigation sections' });
  await expect(sectionNavigation.getByRole('button', { name: /^Business Payroll Analysis\b/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(explorer.getByRole('region', { name: 'Business payroll monthly totals' })).toBeVisible();

  const search = explorer.getByRole('textbox', { name: 'Search Financial Investigation records' });
  await search.clear();
  const runType = explorer.getByRole('combobox', { name: 'Financial Investigation payroll run-type filter' });
  const runStatus = explorer.getByRole('combobox', { name: 'Financial Investigation payroll run-status filter' });
  await expect(runType.locator('option')).not.toHaveCount(1);
  await expect(runStatus.locator('option')).not.toHaveCount(1);
  await runType.selectOption({ index: 1 });
  await expect(explorer.locator('[data-financial-investigation-record]').first()).toBeVisible();
  await runType.selectOption('All run types');

  const payPeriod = explorer.getByRole('combobox', { name: 'Financial Investigation pay-period filter' });
  await expect(payPeriod.locator('option')).toHaveCount(5);
  await payPeriod.selectOption({ index: 1 });
  const payrollRunId = await payPeriod.inputValue();
  expect(payrollRunId).toMatch(/-PR-\d+$/);

  const detail = explorer.getByRole('region', { name: 'Expanded financial record' });
  await expect(detail).toContainText(payrollRunId);
  await detail.getByRole('button', { name: `Open ${payrollRunId} in Payroll History`, exact: true }).click();
  await expect(panel).toHaveAttribute('data-tool-name', 'Payroll History');
  await expect(page.locator('.visual-os-frame, .mission-workspace-v3')).toHaveAttribute('data-active-tool', 'Payroll History');
  await expect(panel.locator(`[data-payroll-history-record="${payrollRunId}"]`)).toBeVisible();
});
