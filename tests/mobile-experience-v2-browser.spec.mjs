import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('fraud-academy-layout-mode-v1'));
});

test('mobile uses a list-first queue and one-page workspace shell', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Phone-only interaction contract.');

  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-layout-mode', 'mobile');
  await expect(page.locator('.mobile-workspace-page-header')).toBeVisible();
  await expect(page.locator('.visual-case-strip')).toBeVisible();
  await expect(page.locator('.visual-case-strip > div')).toHaveCount(3);
  expect(await page.locator('.visual-case-strip > div').evaluateAll((items) => items.every((item) => getComputedStyle(item).display === 'none'))).toBe(true);
  await expect(page.locator('.visual-case-switcher select')).toBeVisible();
  await expect(page.locator('.generated-case-control-host')).toBeHidden();

  const visibleWorkspacePages = page.locator('.visual-os-frame > [data-workspace-page]:visible');
  await expect(visibleWorkspacePages).toHaveCount(1);
  await expect(visibleWorkspacePages).toHaveAttribute('data-workspace-page', 'briefing');

  const mainNavigation = page.getByRole('navigation', { name: 'Main navigation' });
  await mainNavigation.getByRole('button', { name: /Cases/ }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'cases');
  await expect(page.locator('.mobile-workspace-page-header')).toBeHidden();

  const queue = page.locator('[data-cases-theme-v1="approved"]');
  await expect(queue).toBeVisible();
  await expect(queue.getByRole('region', { name: 'Generate fictional training cases' })).toBeHidden();
  await expect(queue.getByRole('region', { name: 'Case queue controls' })).toBeHidden();
  await expect(queue.getByRole('complementary', { name: 'Selected case preview' })).toBeHidden();

  await queue.getByRole('button', { name: 'Open case filters', exact: true }).click();
  await expect(queue.getByRole('region', { name: 'Case queue controls' })).toBeVisible();
  await queue.getByRole('button', { name: 'Open case generator', exact: true }).click();
  await expect(queue.getByRole('region', { name: 'Generate fictional training cases' })).toBeVisible();

  await queue.locator('.case-queue-preview-control').first().click();
  const preview = queue.getByRole('complementary', { name: 'Selected case preview' });
  await expect(preview).toBeVisible();
  await expect(preview.getByRole('button', { name: 'Close selected case preview' })).toBeVisible();
  await expect(preview.getByRole('button', { name: /Open Case Briefing/ })).toBeVisible();

  const layout = await page.evaluate(() => {
    const nav = document.querySelector('.visual-react-bottom-nav')?.getBoundingClientRect();
    const previewBox = document.querySelector('.case-queue-preview')?.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      navBottom: nav?.bottom ?? 0,
      viewportHeight: window.innerHeight,
      previewWidth: previewBox?.width ?? 0,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.navBottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
  expect(layout.previewWidth).toBe(layout.viewportWidth);
});

test('desktop keeps the dense workspace and moves global navigation out of the content', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only layout contract.');

  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-layout-mode', 'desktop');
  await expect(page.locator('.mobile-workspace-page-header')).toBeHidden();

  const layout = await page.evaluate(() => {
    const nav = document.querySelector('.visual-react-bottom-nav');
    const navBox = nav?.getBoundingClientRect();
    const frameBox = document.querySelector('.visual-os-frame')?.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      navPosition: nav ? getComputedStyle(nav).position : '',
      navColumns: nav ? getComputedStyle(nav).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      navRight: navBox?.right ?? Number.POSITIVE_INFINITY,
      frameLeft: frameBox?.left ?? 0,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.navPosition).toBe('fixed');
  expect(layout.navColumns).toBe(1);
  expect(layout.navRight).toBeLessThan(layout.frameLeft);
});
