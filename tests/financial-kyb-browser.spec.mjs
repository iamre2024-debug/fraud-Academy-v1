import { test, expect } from '@playwright/test';
import { selectCurrentGroupTool, selectToolGroup } from './workspace-page-helpers.mjs';

async function openInvestigationWorkspace(page, testInfo) {
  if (testInfo.project.name === 'mobile-chromium') {
    await page.addInitScript(() => {
      window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
    });
  }
  await page.goto('/');
  if (testInfo.project.name === 'mobile-chromium') {
    await page.locator('.mission-briefing-v4').getByRole('button', { name: /Open workspace/i }).click();
    await expect(page.locator('[data-mobile-reference-tool="Customer 360"]')).toBeVisible();
    return;
  }
  await page.locator('[data-case-briefing-screen="approved-theme-v1"]')
    .getByRole('button', { name: /Begin Investigation/ })
    .click();
  await page.locator('[data-customer-360-screen="approved-theme-v1"]')
    .getByRole('navigation', { name: 'Customer 360 related tools' })
    .getByRole('button', { name: 'Identity Intel', exact: true })
    .click();
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toBeVisible();
}

async function openMobileToolMap(page) {
  await page.getByRole('button', { name: 'Open workspace menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Workspace shortcuts' })
    .getByRole('button', { name: /All tools/ })
    .click();
}

async function verifyMobileFinancialAndBusinessIntelligence(page) {
  await openMobileToolMap(page);
  await selectToolGroup(page, /Transactions & Financial/);
  await selectCurrentGroupTool(page, 'Financial Investigation');

  const financial = page.locator('[data-financial-investigation-screen="approved-mobile-reference-v2"]');
  await expect(financial).toBeVisible();
  await expect(financial).toHaveAttribute('data-case-id', 'FA-ATO-24018');
  await expect(financial.getByRole('heading', { name: 'Account Review', exact: true })).toBeVisible();
  await expect(financial.getByRole('heading', { name: 'Spending Analysis', exact: true })).toBeVisible();
  await expect(financial.getByRole('heading', { name: 'Recent account activity', exact: true })).toBeVisible();
  await expect(financial.locator('.dossier-v2-metric-grid.dossier-v2-four article')).toHaveCount(4);
  await expect(financial.getByRole('navigation', { name: 'Spending analysis period' }).getByRole('button')).toHaveCount(3);
  await expect(financial.locator('.dossier-v2-transaction-list article').first()).toBeVisible();

  await financial.getByRole('button', { name: 'Pin account evidence', exact: true }).click();
  await financial.getByRole('button', { name: 'Add section note', exact: true }).click();
  await financial.getByRole('button', { name: 'Mark reviewed', exact: true }).click();
  await expect(financial.getByRole('button', { name: '✓ Reviewed', exact: true })).toBeVisible();
  await expect(page.locator('.mission-workspace-status')).toContainText('1 pinned');
  await expect(page.locator('.mission-workspace-status')).toContainText('1 notes');

  const financialLayout = await page.evaluate(() => {
    const tool = document.querySelector('[data-financial-investigation-screen="approved-mobile-reference-v2"]');
    const surface = document.querySelector('.mission-workspace-surface');
    const pair = document.querySelector('.dossier-v2-financial-pair');
    const viewportWidth = window.innerWidth;
    const rect = tool?.getBoundingClientRect();
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      surfaceScrollWidth: surface?.scrollWidth ?? 0,
      surfaceClientWidth: surface?.clientWidth ?? 0,
      toolLeft: rect?.left ?? -1,
      toolRight: rect?.right ?? Number.POSITIVE_INFINITY,
      pairColumns: pair ? getComputedStyle(pair).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });
  expect(financialLayout.documentWidth).toBeLessThanOrEqual(financialLayout.viewportWidth + 1);
  expect(financialLayout.surfaceScrollWidth).toBeLessThanOrEqual(financialLayout.surfaceClientWidth + 1);
  expect(financialLayout.toolLeft).toBeGreaterThanOrEqual(0);
  expect(financialLayout.toolRight).toBeLessThanOrEqual(financialLayout.viewportWidth + 1);
  expect(financialLayout.pairColumns).toBe(1);

  await page.getByRole('button', { name: 'Open workspace menu', exact: true }).click();
  await page.getByRole('combobox', { name: 'Choose active mission case' }).selectOption('FA-CR-24003');
  await openMobileToolMap(page);
  await selectToolGroup(page, /Business & Payment Verification/);
  await selectCurrentGroupTool(page, 'Business Intelligence');

  const businessIntelligence = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(businessIntelligence).toHaveAttribute('data-tool-name', 'Business Intelligence');
  await expect(businessIntelligence.getByRole('heading', { name: 'Business Intelligence', exact: true })).toBeVisible();
  await expect(businessIntelligence.getByRole('button', { name: 'Mark Business Intelligence reviewed', exact: true })).toBeDisabled();
  await expect(businessIntelligence.locator('.kyb-profile-header')).toHaveCount(0);

  await businessIntelligence.getByRole('button', { name: 'Use legal name', exact: true }).click();
  await businessIntelligence.getByRole('button', { name: 'Search business', exact: true }).click();
  await expect(businessIntelligence.locator('.kyb-profile-header')).toContainText('Lakeside Office Supply LLC');
  await expect(businessIntelligence.locator('.kyb-review-kpis article')).toHaveCount(4);
  await expect(businessIntelligence.locator('.kyb-review-tabs button')).toHaveCount(8);
  await expect(businessIntelligence.getByRole('button', { name: 'Mark Business Intelligence reviewed', exact: true })).toBeEnabled();

  await businessIntelligence.getByRole('button', { name: 'Owners & UBO', exact: true }).click();
  await businessIntelligence.locator('[data-kyb-review-record]').first().click();
  await businessIntelligence.locator('.kyb-record-detail').getByRole('button', { name: 'Pin record', exact: true }).click();
  await businessIntelligence.locator('.kyb-record-detail').getByRole('button', { name: 'Save evidence note', exact: true }).click();
  await expect(page.locator('.mission-workspace-status')).toContainText('1 pinned');
  await expect(page.locator('.mission-workspace-status')).toContainText('1 notes');

  const businessLayout = await page.evaluate(() => {
    const workspace = document.querySelector('.kyb-review-workspace');
    const panel = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const viewportWidth = window.innerWidth;
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelRight: panel?.getBoundingClientRect().right ?? 0,
      columns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });
  expect(businessLayout.documentWidth).toBeLessThanOrEqual(businessLayout.viewportWidth + 1);
  expect(businessLayout.panelRight).toBeLessThanOrEqual(businessLayout.viewportWidth + 1);
  expect(businessLayout.columns).toBe(1);
}

test('Financial Investigation and KYB Review provide complete responsive workspaces', async ({ page }, testInfo) => {
  await openInvestigationWorkspace(page, testInfo);

  if (testInfo.project.name === 'mobile-chromium') {
    await verifyMobileFinancialAndBusinessIntelligence(page);
    return;
  }

  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');

  await selectToolGroup(page, /Transactions & Financial/);
  const toolSelect = toolPanel.getByRole('combobox', { name: 'Choose investigation tool' });
  await toolSelect.selectOption('Financial Investigation');

  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Financial Investigation');
  await expect(toolPanel.getByRole('heading', { name: 'Does the money make sense?', exact: true })).toBeVisible();
  await expect(toolPanel.locator('.financial-investigation-kpis article')).toHaveCount(4);
  await expect(toolPanel.locator('.financial-investigation-tabs button')).toHaveCount(10);
  await expect(toolPanel.locator('.financial-account-strip')).toContainText('Everyday Checking ending 4410');
  await expect(toolPanel.locator('[data-financial-investigation-record]').first()).toBeVisible();

  await toolPanel.getByRole('button', { name: 'Deposit Analysis', exact: true }).click();
  await expect(toolPanel.locator('.financial-deposit-trend')).toBeVisible();
  await expect(toolPanel.locator('[data-financial-investigation-record]')).toHaveCount(3);
  const financialSearch = toolPanel.getByRole('textbox', { name: 'Search Financial Investigation records' });
  await financialSearch.fill('Payroll');
  await expect(toolPanel.locator('[data-financial-investigation-record]')).toHaveCount(2);
  await financialSearch.clear();
  await toolPanel.locator('[data-financial-investigation-record]').first().click();
  await toolPanel.getByRole('button', { name: 'Pin record', exact: true }).click();
  await toolPanel.getByRole('button', { name: 'Save evidence note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('Financial Investigation');

  await toolPanel.getByRole('button', { name: 'Funds Flow', exact: true }).click();
  await expect(toolPanel.locator('[data-financial-investigation-record]')).toHaveCount(3);
  await expect(toolPanel.locator('.financial-record-detail')).toContainText('Source');
  await expect(toolPanel.locator('.financial-record-detail')).toContainText('Destination');
  await toolPanel.getByRole('button', { name: 'Mark Financial Investigation reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: '✓ Financial Investigation reviewed', exact: true })).toBeVisible();

  const financialLayout = await page.evaluate(() => {
    const panel = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const workspace = document.querySelector('.financial-investigation-workspace');
    const records = document.querySelector('.financial-record-workspace');
    const viewportWidth = window.innerWidth;
    const rect = (element) => element?.getBoundingClientRect();
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelRight: rect(panel)?.right ?? 0,
      workspaceColumns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      recordColumns: records ? getComputedStyle(records).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });
  expect(financialLayout.documentWidth).toBeLessThanOrEqual(financialLayout.viewportWidth + 1);
  expect(financialLayout.panelRight).toBeLessThanOrEqual(financialLayout.viewportWidth + 1);
  if (testInfo.project.name === 'mobile-chromium') {
    expect(financialLayout.workspaceColumns).toBe(1);
    expect(financialLayout.recordColumns).toBe(1);
  } else {
    expect(financialLayout.workspaceColumns).toBe(2);
    expect(financialLayout.recordColumns).toBe(2);
  }

  const caseSelector = page.locator('.visual-case-switcher select');
  await caseSelector.selectOption('FA-CR-24003');
  await expect(caseSelector).toHaveValue('FA-CR-24003');
  await selectToolGroup(page, /Business & Payment Verification/);
  await toolSelect.selectOption('KYB Review');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'KYB Review');
  await expect(toolPanel.getByRole('heading', { name: 'Do the business identity and operating records connect across independent sources?', exact: true })).toBeVisible();
  await expect(toolPanel.getByRole('button', { name: 'Mark KYB Review reviewed', exact: true })).toBeDisabled();
  await expect(toolPanel.locator('.kyb-profile-header')).toHaveCount(0);

  await toolPanel.getByRole('button', { name: 'Use legal name', exact: true }).click();
  await toolPanel.getByRole('button', { name: 'Search business', exact: true }).click();
  await expect(toolPanel.locator('.kyb-profile-header')).toContainText('Lakeside Office Supply LLC');
  await expect(toolPanel.locator('.kyb-review-kpis article')).toHaveCount(4);
  await expect(toolPanel.locator('.kyb-review-tabs button')).toHaveCount(8);
  await expect(toolPanel.getByRole('button', { name: 'Mark KYB Review reviewed', exact: true })).toBeEnabled();

  await toolPanel.getByRole('button', { name: 'Owners & UBO', exact: true }).click();
  await expect(toolPanel.locator('[data-kyb-review-record]')).toHaveCount(2);
  await toolPanel.locator('[data-kyb-review-record]').first().click();
  await expect(toolPanel.locator('.kyb-record-detail')).toContainText('Ownership');
  await toolPanel.locator('.kyb-record-detail').getByRole('button', { name: 'Pin record', exact: true }).click();
  await toolPanel.locator('.kyb-record-detail').getByRole('button', { name: 'Save evidence note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('KYB Review');

  await toolPanel.getByRole('button', { name: 'Revenue & Cash Flow', exact: true }).click();
  await expect(toolPanel.locator('[data-kyb-review-record]')).toHaveCount(3);
  await expect(toolPanel.locator('.kyb-record-detail')).toContainText('Amount');

  const reportActions = toolPanel.locator('.kyb-report-actions');
  await reportActions.getByRole('button', { name: 'Generate report', exact: true }).click();
  await expect(reportActions.getByRole('button', { name: 'Regenerate report', exact: true })).toBeVisible();
  const reportDownload = page.waitForEvent('download');
  await reportActions.getByRole('button', { name: 'Export report', exact: true }).click();
  expect((await reportDownload).suggestedFilename()).toContain('RPT-KYB');
  await toolPanel.getByRole('button', { name: 'Mark KYB Review reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: '✓ KYB Review reviewed', exact: true })).toBeVisible();

  const kybLayout = await page.evaluate(() => {
    const workspace = document.querySelector('.kyb-review-workspace');
    const panel = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const viewportWidth = window.innerWidth;
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelRight: panel?.getBoundingClientRect().right ?? 0,
      columns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });
  expect(kybLayout.documentWidth).toBeLessThanOrEqual(kybLayout.viewportWidth + 1);
  expect(kybLayout.panelRight).toBeLessThanOrEqual(kybLayout.viewportWidth + 1);
  expect(kybLayout.columns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 3);

  await expect(reportActions.getByRole('button', { name: 'Open in Document Viewer', exact: true })).toHaveCount(0);
});
