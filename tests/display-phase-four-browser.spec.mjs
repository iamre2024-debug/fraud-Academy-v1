import { test, expect } from '@playwright/test';

test('responsive records become labeled mobile cards without record-surface overflow', async ({ page }, testInfo) => {
  await page.goto('/');

  const workflow = page.getByRole('navigation', { name: 'Active case workflow' });
  await workflow.getByRole('button', { name: /Summary/ }).click();

  const selector = page.locator('.activity-panel .tool-select');
  await expect(selector).toHaveValue('Case Report');

  const table = page.locator('.activity-table');
  const header = table.locator('.table-head');
  const firstRecord = table.locator('.activity-row:not(.table-head)').first();
  const firstCell = firstRecord.locator('[role="cell"][data-field]').first();

  await expect(table).toHaveAttribute('role', 'table');
  await expect(firstRecord).toBeVisible();
  await expect(firstCell).toHaveAttribute('data-field', /.+/);

  const layout = await page.evaluate(() => {
    const panel = document.querySelector('.activity-panel');
    const recordTable = document.querySelector('.activity-table');
    const record = document.querySelector('.activity-row:not(.table-head)');
    const viewportWidth = window.innerWidth;
    const withinViewport = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= viewportWidth + 1;
    };

    return {
      panelFits: withinViewport(panel),
      tableFits: withinViewport(recordTable),
      recordFits: withinViewport(record),
      panelOverflow: panel.scrollWidth - panel.clientWidth,
      recordOverflow: record.scrollWidth - record.clientWidth,
    };
  });

  expect(layout.panelFits).toBe(true);
  expect(layout.tableFits).toBe(true);
  expect(layout.recordFits).toBe(true);

  if (testInfo.project.name === 'mobile-chromium') {
    await expect(header).toBeHidden();
    expect(await firstRecord.evaluate((element) => getComputedStyle(element).display)).toBe('block');
    expect(layout.panelOverflow).toBeLessThanOrEqual(1);
    expect(layout.recordOverflow).toBeLessThanOrEqual(1);
    const mobileLabel = await firstCell.evaluate((element) => getComputedStyle(element, '::before').content);
    expect(mobileLabel).not.toBe('none');
    expect(mobileLabel).not.toBe('normal');
  } else {
    await expect(header).toBeVisible();
    expect(await firstRecord.evaluate((element) => getComputedStyle(element).display)).toBe('grid');
  }

  const activeCaseId = await page.locator('.visual-case-switcher select').inputValue();
  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', activeCaseId);
  await expect(page.getByText('Evidence First lock is active.')).toBeAttached();
});
