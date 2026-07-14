import { test, expect } from '@playwright/test';

const secondCase = { id: 'FA-CB-24007', person: 'Jordan Ellis' };
const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate|suggested first tool|investigator question)\b/i;

test('approved Investigation tools are contextual, functional, and responsive', async ({ page }, testInfo) => {
  await page.goto('/');

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing).toBeVisible();
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();

  const customer360 = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer360).toBeVisible();
  await customer360.getByRole('navigation', { name: 'Customer 360 related tools' })
    .getByRole('button', { name: 'Identity Intel', exact: true })
    .click();

  const groupRail = page.locator('[data-investigation-tool-groups="approved-theme-v1"]');
  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const allTools = page.getByRole('button', { name: /All tools/ });
  const returnToToolsIfNeeded = async () => {
    if (await allTools.isVisible().catch(() => false)) await allTools.click();
  };
  if (testInfo.project.name === 'mobile-chromium') {
    await expect(allTools).toBeVisible();
    await allTools.click();
  }

  await expect(groupRail).toBeVisible();
  await expect(groupRail.getByRole('button')).toHaveCount(7);
  await expect(groupRail.getByRole('button', { name: /Identity & Customer/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(toolPanel).toBeVisible();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Identity Intelligence');
  await expect(toolPanel.getByRole('heading', { name: 'Identity Intelligence', exact: true })).toBeVisible();
  await expect(toolPanel.getByText('Background detail report', { exact: true }).first()).toBeVisible();
  await expect(toolPanel).toContainText('Training ID');
  await expect(toolPanel).toContainText('Session');
  await expect(page.getByText('Case Report', { exact: true })).toHaveCount(0);
  await expect(toolPanel.getByText('Working question', { exact: true })).toBeVisible();
  await expect(toolPanel.locator('.investigation-tool-flow span')).toHaveCount(7);
  await expect(toolPanel.locator('.investigation-tool-metrics article')).toHaveCount(4);

  const records = toolPanel.locator('[data-investigation-record]');
  await expect(records.first()).toBeVisible();
  const recordCount = await records.count();
  expect(recordCount).toBeGreaterThan(0);

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
    expect(Math.abs(layout.recordsTop - layout.detailTop)).toBeLessThanOrEqual(2);
  }

  const firstRecordId = await records.first().getAttribute('data-investigation-record');
  expect(firstRecordId).toBeTruthy();
  const search = toolPanel.getByRole('textbox', { name: 'Search Identity Intelligence records' });
  await search.fill(firstRecordId);
  await expect(toolPanel.locator('[data-investigation-record]')).toHaveCount(1);
  await search.clear();

  if (recordCount > 1) {
    const secondRecord = toolPanel.locator('[data-investigation-record]').nth(1);
    const secondRecordId = await secondRecord.getAttribute('data-investigation-record');
    await secondRecord.getByRole('button', { name: 'Open record', exact: true }).click();
    await expect(toolPanel.locator(`[data-investigation-record="${secondRecordId}"]`)).toHaveClass(/selected/);
    await expect(toolPanel.locator('.investigation-tool-detail')).toContainText(secondRecordId);
  }

  const activeDetail = toolPanel.locator('.investigation-tool-detail');
  await activeDetail.getByRole('button', { name: 'Pin record', exact: true }).click();
  await expect(page.locator('.tray-card')).toContainText('Pinned');
  await activeDetail.getByRole('button', { name: 'Save expanded note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('Expanded Identity Intelligence record');
  await activeDetail.getByRole('button', { name: 'Save evidence packet', exact: true }).click();
  await expect(page.locator('.case-report-packet-panel')).toContainText('1 saved');

  await groupRail.getByRole('button', { name: /Login, Device & IP/ }).click();
  await returnToToolsIfNeeded();
  const toolSelect = toolPanel.getByRole('combobox', { name: 'Choose investigation tool' });
  await expect(toolSelect).toHaveValue('Login History');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Login History');
  await expect(groupRail.getByRole('button', { name: /Login, Device & IP/ })).toHaveAttribute('aria-pressed', 'true');

  await groupRail.getByRole('button', { name: /Transactions & Financial/ }).click();
  await returnToToolsIfNeeded();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Transaction History');
  await expect(toolPanel.getByRole('heading', { name: 'Transaction History', exact: true })).toBeVisible();

  await groupRail.getByRole('button', { name: /Business & Payment Verification/ }).click();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Payment Verification');
  await expect(toolPanel.getByRole('heading', { name: 'Payment Verification', exact: true })).toBeVisible();

  await toolPanel.getByRole('button', { name: 'Mark Payment Verification reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: '✓ Payment Verification reviewed', exact: true })).toBeVisible();

  await toolPanel.getByRole('navigation', { name: 'Investigation record next routes' })
    .getByRole('button', { name: 'Open Timeline', exact: true })
    .click();
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toHaveCount(0);
  await expect(page.locator('.activity-panel')).toContainText('Timeline');

  await returnToToolsIfNeeded();
  const selector = page.locator('.visual-case-switcher select');
  await selector.selectOption(secondCase.id);
  await expect(selector).toHaveValue(secondCase.id);
  await expect(briefing.getByText(secondCase.person, { exact: true }).first()).toBeVisible();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Login History');
  await expect(toolPanel.locator('.investigation-tool-header-actions')).toContainText(secondCase.id);

  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', secondCase.id);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);
});
