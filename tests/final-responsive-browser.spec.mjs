import { test, expect } from '@playwright/test';

const approvedSurfaceSelector = [
  '[data-react-navigation-panel]',
  '[data-cases-theme-v1="approved"]',
  '[data-case-briefing-screen="approved-theme-v1"]',
  '[data-customer-360-screen="approved-theme-v1"]',
  '[data-investigation-tools-screen="approved-theme-v1"]',
  '[data-timeline-screen="approved-theme-v1"]',
  '[data-decision-screen="approved-theme-v1"]',
  '[data-luna-screen="approved-theme-v1"]',
  '[data-academy-screen="approved-theme-v1"]',
  '[data-profile-screen="approved-theme-v1"]',
].join(',');

async function assertViewportSafe(page, rootSelector, label) {
  const result = await page.evaluate(({ rootSelector, approvedSurfaceSelector }) => {
    const root = document.querySelector(rootSelector);
    const frame = document.querySelector('.visual-os-frame');
    const viewportWidth = window.innerWidth;
    const overflow = (element) => {
      const rect = element?.getBoundingClientRect();
      return rect ? Math.max(0, -rect.left, rect.right - viewportWidth) : Number.POSITIVE_INFINITY;
    };
    const visible = (element) => {
      if (!(element instanceof HTMLElement)) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const visibleSurfaces = [...document.querySelectorAll(approvedSurfaceSelector)]
      .filter(visible)
      .map((element) => ({
        name: element.getAttribute('data-react-navigation-panel')
          || element.getAttribute('data-case-id')
          || element.getAttribute('data-active-tool')
          || element.className
          || element.tagName,
        overflow: overflow(element),
      }));
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      rootOverflow: overflow(root),
      frameOverflow: overflow(frame),
      rootPosition: root ? getComputedStyle(root).position : '',
      visibleSurfaces,
    };
  }, { rootSelector, approvedSurfaceSelector });

  expect(result.documentWidth, `${label} document width`).toBeLessThanOrEqual(result.viewportWidth + 1);
  expect(result.bodyWidth, `${label} body width`).toBeLessThanOrEqual(result.viewportWidth + 1);
  expect(result.rootOverflow, `${label} root overflow`).toBeLessThanOrEqual(4);
  expect(result.frameOverflow, `${label} frame overflow`).toBeLessThanOrEqual(2);
  expect(result.rootPosition, `${label} root position`).not.toBe('fixed');
  expect(result.visibleSurfaces.length, `${label} visible approved surface`).toBeGreaterThan(0);
  for (const surface of result.visibleSurfaces) {
    expect(surface.overflow, `${label} ${surface.name} overflow`).toBeLessThanOrEqual(4);
  }
}

async function openGlobalTab(page, label) {
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: new RegExp(label, 'i') }).click();
}

async function assertTouchTargets(page) {
  const sizes = await page.locator('.visual-react-bottom-nav button:visible').evaluateAll((buttons) => buttons.map((button) => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  expect(sizes.length).toBe(4);
  for (const size of sizes) {
    expect(size.width).toBeGreaterThanOrEqual(44);
    expect(size.height).toBeGreaterThanOrEqual(44);
  }
}

test('final responsive polish protects every completed global surface across compact, phone, small-tablet, tablet, desktop, and wide layouts', async ({ page }, testInfo) => {
  const viewports = testInfo.project.name === 'mobile-chromium'
    ? [{ width: 350, height: 780 }, { width: 412, height: 915 }, { width: 640, height: 900 }]
    : [{ width: 768, height: 900 }, { width: 1024, height: 900 }, { width: 1440, height: 1000 }];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await openGlobalTab(page, 'Dashboard');
    await expect(page.locator('.dashboard-v1-shell')).toBeVisible();
    await assertViewportSafe(page, '.dashboard-v1-shell', `Dashboard ${viewport.width}`);

    await openGlobalTab(page, 'Cases');
    await expect(page.locator('[data-cases-theme-v1="approved"]')).toBeVisible();
    await assertViewportSafe(page, '[data-cases-theme-v1="approved"]', `Cases ${viewport.width}`);

    await openGlobalTab(page, 'Academy');
    await expect(page.locator('[data-academy-screen="approved-theme-v1"]')).toBeVisible();
    await assertViewportSafe(page, '[data-academy-screen="approved-theme-v1"]', `Academy ${viewport.width}`);

    await page.getByRole('button', { name: 'Open Agent profile', exact: true }).first().click();
    await expect(page.locator('[data-profile-screen="approved-theme-v1"]')).toBeVisible();
    await assertViewportSafe(page, '[data-profile-screen="approved-theme-v1"]', `Profile ${viewport.width}`);

    await openGlobalTab(page, 'Workspace');
    await expect(page.locator('.active-case-workflow')).toBeVisible();
    await assertViewportSafe(page, '.visual-os-frame', `Workspace ${viewport.width}`);

    for (const stage of ['briefing', 'investigate', 'timeline', 'determination', 'debrief']) {
      const allTools = page.getByRole('button', { name: 'All tools', exact: true });
      if (await allTools.isVisible().catch(() => false)) await allTools.click();
      await page.locator(`[data-workflow-stage-button="${stage}"]`).click();
      await assertViewportSafe(page, '.visual-os-frame', `Workspace ${stage} ${viewport.width}`);
    }

    if (viewport.width <= 430) await assertTouchTargets(page);
  }
});
