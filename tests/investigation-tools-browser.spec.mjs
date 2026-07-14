import { test, expect } from '@playwright/test';

const firstCase = { id: 'FA-ATO-24018', person: 'Maya Sterling', trainingId: 'TRN-8842-19' };
const secondCase = { id: 'FA-CB-24007', person: 'Jordan Ellis' };
const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate|suggested first tool|investigator question)\b/i;

test('approved Investigation tools preserve identity lookup, real records, Evidence First, and responsive layouts', async ({ page }, testInfo) => {
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
  await expect(identityPanel).toContainText('1 profile');
  await expect(identityPanel).toContainText('1988-02-19');
  await identityPanel.getByRole('button', { name: 'View Full Profile Report', exact: true }).click();

  const fullReport = identityPanel.locator('[data-identity-full-report]');
  await expect(fullReport).toBeVisible();
  await expect(fullReport.getByRole('heading', { name: 'Full Profile Report', exact: true })).toBeVisible();
  await expect(fullReport.locator('[data-identity-report-section]')).toHaveCount(16);
  await expect(fullReport.getByRole('heading', { name: 'Address history', exact: true })).toBeVisible();
  await expect(fullReport.getByRole('heading', { name: 'Associates and household links', exact: true })).toBeVisible();
  await expect(fullReport.getByRole('heading', { name: 'Linked identity and access records', exact: true })).toBeVisible();
  await expect(fullReport).toContainText('SES-7781');
  await expect(fullReport).toContainText('198.51.100.42');

  const identityLayout = await page.evaluate(() => {
    const panel = document.querySelector('[data-identity-intelligence-screen="lookup-report-v1"]');
    const report = document.querySelector('[data-identity-full-report]');
    const viewportWidth = window.innerWidth;
    const fits = (element) => {
      const box = element?.getBoundingClientRect();
      return Boolean(box && box.left >= -1 && box.right <= viewportWidth + 1);
    };
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth,
      panelFits: fits(panel),
      reportFits: fits(report),
      reportColumns: document.querySelector('.identity-report-sections')
        ? getComputedStyle(document.querySelector('.identity-report-sections')).gridTemplateColumns.split(' ').filter(Boolean).length
        : 0,
    };
  });
  expect(identityLayout.documentWidth).toBeLessThanOrEqual(identityLayout.viewportWidth + 1);
  expect(identityLayout.panelFits).toBe(true);
  expect(identityLayout.reportFits).toBe(true);
  expect(identityLayout.reportColumns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 2);

  await fullReport.getByRole('button', { name: 'Pin identity', exact: true }).click();
  await expect(page.locator('.tray-card')).toContainText('Pinned');
  await fullReport.getByRole('button', { name: 'Save report note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('Identity Intelligence report reviewed');
  await fullReport.getByRole('button', { name: 'Save report to evidence packet', exact: true }).click();
  await expect(page.locator('.case-report-packet-panel')).toContainText('1 saved');
  await fullReport.getByRole('button', { name: 'Mark Identity Intelligence reviewed', exact: true }).click();
  await expect(fullReport.getByRole('button', { name: '✓ Identity Intelligence reviewed', exact: true })).toBeVisible();

  const allTools = page.getByRole('button', { name: /All tools/ });
  if (testInfo.project.name === 'mobile-chromium') {
    await expect(allTools).toBeVisible();
    await allTools.click();
  }

  const groupRail = page.locator('[data-investigation-tool-groups="approved-theme-v1"]');
  await expect(groupRail).toBeVisible();
  await expect(groupRail.getByRole('button')).toHaveCount(7);
  await groupRail.getByRole('button', { name: /Login, Device & IP/ }).click();

  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(toolPanel).toBeVisible();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Login History');
  await expect(toolPanel.getByRole('heading', { name: 'Login History', exact: true })).toBeVisible();
  await expect(toolPanel.locator('[data-investigation-record]').first()).toBeVisible();

  const layout = await page.evaluate(() => {
    const groups = document.querySelector('.investigation-tool-groups-theme-v1 .visual-category-row');
    const workspace = document.querySelector('.investigation-tool-workspace');
    const recordsPanel = document.querySelector('.investigation-tool-records');
    const detail = document.querySelector('.investigation-tool-detail');
    const metrics = document.querySelector('.investigation-tool-metrics');
    const toolPanelElement = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const viewportWidth = window.innerWidth;
    const rect = (element) => element?.getBoundingClientRect();
    const fits = (element) => {
      const box = rect(element);
      return Boolean(box && box.left >= -1 && box.right <= viewportWidth + 1);
    };
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelFits: fits(toolPanelElement),
      recordsFit: fits(recordsPanel),
      detailFits: fits(detail),
      groupColumns: groups ? getComputedStyle(groups).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      workspaceColumns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      metricColumns: metrics ? getComputedStyle(metrics).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      recordsTop: rect(recordsPanel)?.top ?? 0,
      detailTop: rect(detail)?.top ?? 0,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelFits).toBe(true);
  expect(layout.recordsFit).toBe(true);
  expect(layout.detailFits).toBe(true);
  if (testInfo.project.name === 'mobile-chromium') {
    expect(layout.groupColumns).toBe(2);
    expect(layout.workspaceColumns).toBe(1);
    expect(layout.metricColumns).toBe(2);
    expect(layout.detailTop).toBeGreaterThan(layout.recordsTop + 20);
  } else {
    expect(layout.groupColumns).toBe(6);
    expect(layout.workspaceColumns).toBe(2);
    expect(layout.metricColumns).toBe(4);
  }

  const toolSelect = toolPanel.getByRole('combobox', { name: 'Choose investigation tool' });
  await toolSelect.selectOption('Payment Verification');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Payment Verification');
  await expect(toolPanel).toContainText('Authorization trail');

  await toolSelect.selectOption('Business Intelligence');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Business Intelligence');
  await expect(toolPanel).toContainText('Northstar Digital Market LLC');
  await expect(toolPanel).toContainText('Training Business ID');

  await toolSelect.selectOption('Document Viewer');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Document Viewer');
  await expect(toolPanel).toContainText('Customer statement');
  await expect(toolPanel).toContainText('Packet preview');

  if (await allTools.isVisible().catch(() => false)) await allTools.click();
  const selector = page.locator('.visual-case-switcher select');
  await selector.selectOption(secondCase.id);
  await expect(selector).toHaveValue(secondCase.id);
  await expect(briefing.getByText(secondCase.person, { exact: true }).first()).toBeVisible();

  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', secondCase.id);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);
});
