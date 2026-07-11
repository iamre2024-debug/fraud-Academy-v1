import { test, expect } from '@playwright/test';

async function assertViewportSafety(page, selector) {
  const target = page.locator(selector).first();
  await expect(target).toBeVisible();

  const metrics = await page.evaluate((targetSelector) => {
    const element = document.querySelector(targetSelector);
    const rect = element?.getBoundingClientRect();
    const visibleControls = [...document.querySelectorAll('button, input, select, textarea, [role="button"]')]
      .filter((control) => {
        const style = getComputedStyle(control);
        const controlRect = control.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && controlRect.width > 0 && controlRect.height > 0;
      });

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      targetLeft: rect?.left ?? Number.NEGATIVE_INFINITY,
      targetRight: rect?.right ?? Number.POSITIVE_INFINITY,
      targetWidth: rect?.width ?? 0,
      smallestControl: visibleControls.length
        ? Math.min(...visibleControls.map((control) => control.getBoundingClientRect().height))
        : 44,
    };
  }, selector);

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.targetLeft).toBeGreaterThanOrEqual(-4);
  expect(metrics.targetRight).toBeLessThanOrEqual(metrics.viewportWidth + 4);
  expect(metrics.targetWidth).toBeGreaterThan(0);
  expect(metrics.smallestControl).toBeGreaterThanOrEqual(39);
}

async function useGlobalNav(page, name) {
  await page.locator('.visual-react-bottom-nav').getByRole('button', { name: new RegExp(name, 'i') }).click();
}

test('final responsive polish keeps every completed top-level surface inside compact phone and wide desktop viewports', async ({ page }, testInfo) => {
  const compactPhone = testInfo.project.name === 'mobile-chromium';
  await page.setViewportSize(compactPhone ? { width: 350, height: 740 } : { width: 1440, height: 1000 });
  await page.goto('/');

  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
  await assertViewportSafety(page, '.visual-os-frame');
  await expect(page.locator('.active-case-workflow')).toBeVisible();
  await expect(page.locator('[data-workflow-stage="briefing"]')).toBeVisible();

  await useGlobalNav(page, 'Dashboard');
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'dashboard');
  await assertViewportSafety(page, '.dashboard-v1-shell');

  await useGlobalNav(page, 'Cases');
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'cases');
  await assertViewportSafety(page, '[data-cases-theme-v1="approved"]');

  await useGlobalNav(page, 'Academy');
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'academy');
  await assertViewportSafety(page, '[data-academy-screen="approved-theme-v1"]');

  await useGlobalNav(page, 'Dashboard');
  await page.locator('.dashboard-agent-mark').click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'profile');
  await assertViewportSafety(page, '[data-profile-screen="approved-theme-v1"]');

  await page.locator('[data-profile-screen="approved-theme-v1"]').getByRole('button', { name: 'Open Academy Progress', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'progress');
  await assertViewportSafety(page, '.academy-progress-panel');

  await useGlobalNav(page, 'Workspace');
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
  await assertViewportSafety(page, '.visual-os-frame');

  const navMetrics = await page.evaluate(() => {
    const nav = document.querySelector('.visual-react-bottom-nav');
    const buttons = [...(nav?.querySelectorAll('button') ?? [])];
    const navRect = nav?.getBoundingClientRect();
    return {
      count: buttons.length,
      navLeft: navRect?.left ?? -1,
      navRight: navRect?.right ?? Number.POSITIVE_INFINITY,
      minButtonHeight: buttons.length ? Math.min(...buttons.map((button) => button.getBoundingClientRect().height)) : 0,
    };
  });

  expect(navMetrics.count).toBe(4);
  expect(navMetrics.navLeft).toBeGreaterThanOrEqual(-1);
  expect(navMetrics.navRight).toBeLessThanOrEqual((compactPhone ? 350 : 1440) + 1);
  expect(navMetrics.minButtonHeight).toBeGreaterThanOrEqual(44);
});
