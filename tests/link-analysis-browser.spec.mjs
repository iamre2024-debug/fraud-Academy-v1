import { test, expect } from '@playwright/test';
import { selectToolGroup } from './workspace-page-helpers.mjs';

test('Link Analysis uses the dedicated graph, exact account matches, and evidence actions', async ({ page }, testInfo) => {
  await page.goto('/');
  await selectToolGroup(page, 'Links & Related Cases');

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const workspace = panel.locator('[data-link-analysis-workspace]');
  await expect(panel).toHaveAttribute('data-tool-name', 'Link Analysis');
  await expect(workspace).toBeVisible();
  await expect(workspace.locator('[data-link-analysis-map]')).toBeVisible();
  await expect(workspace.getByRole('heading', { name: 'Exact cross-account matches', exact: true })).toBeVisible();
  await expect(workspace.getByText('Verified Links Summary', { exact: true })).toBeVisible();
  await expect(workspace.getByText('Luna · factual link summary', { exact: true })).toBeVisible();

  const searchShell = workspace.locator('.link-analysis-search-shell');
  await searchShell.locator('summary').click();
  const search = workspace.getByRole('textbox', { name: 'Search Link Analysis identifier' });
  await expect(search).toHaveValue('(214) 555-0184');
  await expect(workspace.locator('[data-link-account]')).toHaveCount(3);
  await expect(workspace.getByText('3 matched accounts', { exact: true })).toBeVisible();

  const firstAccount = workspace.locator('[data-link-account]').first();
  await firstAccount.locator('.link-analysis-account-heading').click();
  await expect(firstAccount.locator('.link-analysis-account-detail')).toBeVisible();
  await expect(firstAccount).toContainText('Exact shared identifier');
  await expect(firstAccount).toContainText('Verified source');
  await firstAccount.getByRole('button', { name: 'Open Account', exact: true }).click();
  await expect(workspace.getByRole('region', { name: /Open account/ })).toBeVisible();
  await expect(workspace.getByRole('region', { name: /Open account/ })).toContainText('Current-case boundary');

  const phoneNode = workspace.getByRole('button', { name: /Search Phone/ });
  await expect(phoneNode).toBeVisible();
  const destinationNode = workspace.getByRole('button', { name: /Search Destination ID/ });
  await expect(destinationNode).toBeVisible();
  await destinationNode.click();
  await expect(search).toHaveValue('DST-CARD-4410');
  await expect(workspace.locator('[data-link-account]')).toHaveCount(2);

  await searchShell.locator('summary').click();
  await search.fill('NO-EXACT-MATCH');
  await workspace.getByRole('button', { name: 'Search Links', exact: true }).click();
  await expect(workspace.getByText('0 matched accounts', { exact: true })).toBeVisible();

  await searchShell.locator('summary').click();
  await workspace.locator('.link-analysis-suggestions button').filter({ hasText: '(214) 555-0184' }).click();
  await expect(workspace.locator('[data-link-account]')).toHaveCount(3);
  await workspace.getByRole('button', { name: 'Pin Search', exact: true }).click();
  await workspace.getByRole('button', { name: 'Save Factual Summary', exact: true }).click();
  await workspace.getByRole('button', { name: 'Mark Reviewed', exact: true }).click();
  await expect(workspace.getByRole('button', { name: '✓ Link Analysis Reviewed', exact: true })).toBeVisible();

  const forbidden = await workspace.textContent();
  expect(forbidden).not.toMatch(/\b(?:high risk|medium risk|low risk|fraud score|risk score|confirmed current fraud)\b/i);

  const layout = await page.evaluate(() => {
    const panelElement = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const map = document.querySelector('[data-link-analysis-map]');
    const accounts = document.querySelector('.link-analysis-account-list');
    const viewportWidth = window.innerWidth;
    const fits = (element) => {
      const box = element?.getBoundingClientRect();
      return Boolean(box && box.left >= -1 && box.right <= viewportWidth + 1);
    };
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelFits: fits(panelElement),
      mapFits: fits(map),
      accountsFit: fits(accounts),
      columns: getComputedStyle(document.querySelector('.link-analysis-main-grid')).gridTemplateColumns.split(' ').filter(Boolean).length,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelFits).toBe(true);
  expect(layout.mapFits).toBe(true);
  expect(layout.accountsFit).toBe(true);
  expect(layout.columns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 2);

  if (testInfo.project.name === 'mobile-chromium') {
    await expect(page.locator('.mission-workspace-bar[data-link-analysis-header="true"]')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Choose active Link Analysis case' })).toBeVisible();
    await expect(page.locator('.mission-workspace-case-selector')).toHaveCount(0);
  } else {
    await expect(workspace.getByRole('heading', { name: 'Link Analysis', exact: true })).toBeVisible();
  }
});
