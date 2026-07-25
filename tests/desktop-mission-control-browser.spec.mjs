import { test, expect } from '@playwright/test';

async function assertDesktopWidthSafe(page, label) {
  const layout = await page.evaluate(() => {
    const root = document.querySelector('.desktop-mission-control-v2');
    const visiblePage = document.querySelector('.desktop-page:not([hidden])');
    const rootRect = root?.getBoundingClientRect();
    const pageRect = visiblePage?.getBoundingClientRect();
    const clippedCards = [...document.querySelectorAll('.desktop-page:not([hidden]) article, .desktop-page:not([hidden]) .dashboard-quick-grid > button')]
      .filter((element) => element.scrollWidth > element.clientWidth + 2)
      .map((element) => element.className || element.textContent?.trim().slice(0, 50));
    return {
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      rootLeft: rootRect?.left ?? -1,
      rootRight: rootRect?.right ?? Number.POSITIVE_INFINITY,
      pageLeft: pageRect?.left ?? -1,
      pageRight: pageRect?.right ?? Number.POSITIVE_INFINITY,
      clippedCards,
    };
  });

  expect(layout.documentWidth, `${label} document width`).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.bodyWidth, `${label} body width`).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.rootLeft, `${label} root left`).toBeGreaterThanOrEqual(-1);
  expect(layout.rootRight, `${label} root right`).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.pageLeft, `${label} page left`).toBeGreaterThanOrEqual(-1);
  expect(layout.pageRight, `${label} page right`).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.clippedCards, `${label} clipped cards`).toEqual([]);
}

async function openDashboard(page) {
  await page.getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: 'Dashboard', exact: true })
    .click();
  await expect(page.locator('[data-react-navigation-panel="dashboard"]')).toBeVisible();
}

test('desktop mission control renders complete wide pages and exact workspace shortcuts', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('fraud-academy-layout-mode-v1', 'desktop'));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await openDashboard(page);

  await expect(page.locator('.desktop-mission-control-v2')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Investigator dashboard', exact: true })).toBeVisible();
  await expect(page.locator('.desktop-active-case')).toBeVisible();
  await expect(page.locator('.desktop-shortcuts .dashboard-quick-grid > button')).toHaveCount(8);
  await assertDesktopWidthSafe(page, 'Dashboard');

  const shortcuts = page.locator('.desktop-shortcuts');
  await shortcuts.getByRole('button', { name: /Timeline/ }).click();
  await expect(page.locator('.visual-os-frame')).toHaveAttribute('data-workspace-screen', 'timeline');
  await expect(page.locator('.visual-os-frame')).toHaveAttribute('data-active-tool', 'Timeline');

  await openDashboard(page);
  await shortcuts.getByRole('button', { name: /Pinned Evidence/ }).click();
  await expect(page.locator('.visual-os-frame')).toHaveAttribute('data-workspace-screen', 'evidence');

  await openDashboard(page);
  await shortcuts.getByRole('button', { name: /Case Notes/ }).click();
  await expect(page.locator('.visual-os-frame')).toHaveAttribute('data-workspace-screen', 'notes');

  await openDashboard(page);
  await shortcuts.getByRole('button', { name: /Tool Library/ }).click();
  await expect(page.locator('.visual-os-frame')).toHaveAttribute('data-workspace-screen', 'tool-menu');
  await assertDesktopWidthSafe(page, 'Workspace');

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
  await expect(page.locator('.visual-os-frame')).toHaveAttribute('data-workspace-screen', 'tool-menu');

  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await navigation.getByRole('button', { name: 'Cases', exact: true }).click();
  await expect(page.locator('[data-cases-theme-v1="approved"]')).toBeVisible();
  await assertDesktopWidthSafe(page, 'Cases');

  await navigation.getByRole('button', { name: 'Academy', exact: true }).click();
  await expect(page.locator('[data-academy-screen="approved-theme-v1"]')).toBeVisible();
  await assertDesktopWidthSafe(page, 'Academy');

  await page.getByRole('button', { name: 'Open Agent profile', exact: true }).first().click();
  await expect(page.locator('[data-profile-screen="approved-theme-v1"]')).toBeVisible();
  await assertDesktopWidthSafe(page, 'Profile');
});
