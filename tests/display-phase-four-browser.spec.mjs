import { test, expect } from '@playwright/test';

test('responsive records stay labeled and inside the mobile tool page', async ({ page }, testInfo) => {
  await page.goto('/');

  const category = page.locator('[data-investigation-tool-groups="approved-theme-v1"] .visual-category-row button').filter({ hasText: 'Login, Device & IP' });
  await category.click();
  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(panel).toBeVisible();
  await panel.getByRole('combobox', { name: 'Choose investigation tool' }).selectOption({ label: 'Login History' });

  const record = panel.locator('[data-investigation-record]').first();
  await expect(record).toBeVisible();
  await expect(record.locator('dl > div').first()).toBeVisible();

  const layout = await page.evaluate(() => {
    const panelElement = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const recordElement = document.querySelector('[data-investigation-record]');
    const viewportWidth = window.innerWidth;
    const withinViewport = (element) => {
      const rect = element?.getBoundingClientRect();
      return Boolean(rect && rect.left >= -1 && rect.right <= viewportWidth + 1);
    };
    return {
      panelFits: withinViewport(panelElement),
      recordFits: withinViewport(recordElement),
      panelOverflow: panelElement?.scrollWidth - panelElement?.clientWidth ?? 99,
      recordOverflow: recordElement?.scrollWidth - recordElement?.clientWidth ?? 99,
    };
  });

  expect(layout.panelFits).toBe(true);
  expect(layout.recordFits).toBe(true);
  expect(layout.panelOverflow).toBeLessThanOrEqual(1);
  expect(layout.recordOverflow).toBeLessThanOrEqual(1);

  if (testInfo.project.name === 'mobile-chromium') {
    await expect(page.getByRole('button', { name: 'All tools', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'All tools', exact: true }).click();
    await expect(page.locator('[data-investigation-tool-groups="approved-theme-v1"]')).toBeVisible();
  }
});
