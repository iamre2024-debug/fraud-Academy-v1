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

const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|suggested first tool)\b/i;

async function assertResponsiveSafety(page, label, projectName) {
  const snapshot = await page.evaluate(({ selector, auditLabel }) => {
    const viewportWidth = window.innerWidth;
    const documentWidth = document.documentElement.scrollWidth;
    const visible = (element) => {
      if (!(element instanceof HTMLElement)) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const describe = (element) => {
      const aria = element.getAttribute('aria-label');
      const text = element.textContent?.replace(/\s+/g, ' ').trim().slice(0, 70);
      const classes = typeof element.className === 'string' ? element.className.trim().replace(/\s+/g, '.') : '';
      return aria || text || `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ''}`;
    };
    const bounds = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        name: describe(element),
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        overflow: Math.max(0, -rect.left, rect.right - viewportWidth),
      };
    };
    const surfaces = [...document.querySelectorAll(selector)]
      .filter(visible)
      .map((element) => ({ name: element.getAttribute('data-react-navigation-panel') || element.getAttribute('data-case-id') || describe(element), ...bounds(element) }));
    const bottomNav = document.querySelector('.visual-react-bottom-nav');
    const bottomButtons = bottomNav ? [...bottomNav.querySelectorAll('button')].filter(visible).map(bounds) : [];
    const criticalControls = [
      ...document.querySelectorAll('.visual-header-controls button, .header-panel-close, .active-case-workflow-list button, .visual-nav-profile-entry'),
    ].filter(visible).map(bounds);
    const currentSurface = [...document.querySelectorAll(selector)].find(visible);
    const surfaceButtons = currentSurface
      ? [...currentSurface.querySelectorAll('button, select, input:not([type="hidden"]), textarea')].filter(visible).slice(0, 30).map(bounds)
      : [];

    return {
      auditLabel,
      viewportWidth,
      documentWidth,
      bodyWidth: document.body.scrollWidth,
      surfaces,
      bottomNav: bottomNav && visible(bottomNav) ? bounds(bottomNav) : null,
      bottomButtons,
      criticalControls,
      surfaceButtons,
    };
  }, { selector: approvedSurfaceSelector, auditLabel: label });

  expect(snapshot.documentWidth, `${label}: document width`).toBeLessThanOrEqual(snapshot.viewportWidth + 1);
  expect(snapshot.bodyWidth, `${label}: body width`).toBeLessThanOrEqual(snapshot.viewportWidth + 1);
  expect(snapshot.surfaces.length, `${label}: visible approved surface`).toBeGreaterThan(0);
  for (const surface of snapshot.surfaces) {
    expect(surface.overflow, `${label}: ${surface.name} viewport overflow`).toBeLessThanOrEqual(4);
  }
  expect(snapshot.bottomNav, `${label}: global navigation`).not.toBeNull();
  expect(snapshot.bottomNav.overflow, `${label}: global navigation overflow`).toBeLessThanOrEqual(2);
  expect(snapshot.bottomButtons, `${label}: four permanent destinations`).toHaveLength(4);

  if (projectName === 'mobile-chromium') {
    for (const control of snapshot.bottomButtons) {
      expect(control.height, `${label}: bottom navigation ${control.name} height`).toBeGreaterThanOrEqual(44);
    }
    for (const control of snapshot.criticalControls) {
      expect(control.height, `${label}: critical control ${control.name} height`).toBeGreaterThanOrEqual(44);
      expect(control.width, `${label}: critical control ${control.name} width`).toBeGreaterThanOrEqual(44);
    }
    for (const control of snapshot.surfaceButtons) {
      expect(control.height, `${label}: current-surface control ${control.name} height`).toBeGreaterThanOrEqual(44);
    }
  }
}

async function openMainTab(page, name) {
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name }).click();
}

test('final responsive and mobile audit covers every approved screen without layout or Evidence First regressions', async ({ page }, testInfo) => {
  await page.goto('/');

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing).toBeVisible();
  await assertResponsiveSafety(page, 'Workspace and Case Briefing', testInfo.project.name);

  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();
  const customer360 = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer360).toBeVisible();
  await assertResponsiveSafety(page, 'Customer 360', testInfo.project.name);

  await customer360.getByRole('navigation', { name: 'Customer 360 related tools' }).getByRole('button', { name: 'Identity Intel', exact: true }).click();
  const investigationTools = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(investigationTools).toBeVisible();
  await assertResponsiveSafety(page, 'Investigation tools', testInfo.project.name);

  await page.getByRole('navigation', { name: 'Active case workflow' }).getByRole('button', { name: /Timeline/ }).click();
  await expect(page.locator('[data-timeline-screen="approved-theme-v1"]')).toBeVisible();
  await assertResponsiveSafety(page, 'Timeline', testInfo.project.name);

  await page.getByRole('navigation', { name: 'Active case workflow' }).getByRole('button', { name: /Determination/ }).click();
  await expect(page.locator('[data-decision-screen="approved-theme-v1"]')).toBeVisible();
  await expect(page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="locked"]')).toBeAttached();
  await assertResponsiveSafety(page, 'Decision and locked Luna', testInfo.project.name);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);

  await openMainTab(page, /Dashboard/);
  await expect(page.locator('[data-react-navigation-panel="dashboard"]')).toBeVisible();
  await assertResponsiveSafety(page, 'Dashboard', testInfo.project.name);

  await openMainTab(page, /Cases/);
  await expect(page.locator('[data-cases-theme-v1="approved"]')).toBeVisible();
  await assertResponsiveSafety(page, 'Cases', testInfo.project.name);

  await openMainTab(page, /Academy/);
  await expect(page.locator('[data-academy-screen="approved-theme-v1"]')).toBeVisible();
  await assertResponsiveSafety(page, 'Academy', testInfo.project.name);

  await page.getByRole('button', { name: 'Open Agent profile', exact: true }).click();
  await expect(page.locator('[data-profile-screen="approved-theme-v1"]')).toBeVisible();
  await assertResponsiveSafety(page, 'Profile', testInfo.project.name);

  await page.locator('[data-profile-screen="approved-theme-v1"]').getByRole('button', { name: 'Open Academy Progress', exact: true }).click();
  await expect(page.locator('[data-react-navigation-panel="progress"]')).toBeVisible();
  await assertResponsiveSafety(page, 'Academy Progress', testInfo.project.name);

  await openMainTab(page, /Workspace/);
  await expect(briefing).toBeVisible();
  await assertResponsiveSafety(page, 'Workspace return', testInfo.project.name);
});
