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

async function assertCaseDeskVisible(page) {
  const rail = page.locator('.desktop-utility-rail');
  await expect(rail).toBeVisible();
  await expect(rail.getByText('Case desk', { exact: true })).toBeVisible();
  await expect(rail.locator(':scope > section')).toHaveCount(4);
}

test('desktop mission control renders complete wide pages and exact workspace shortcuts', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('fraud-academy-layout-mode-v1', 'desktop'));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await openDashboard(page);

  await expect(page.locator('.desktop-mission-control-v2')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Investigator dashboard', exact: true })).toBeVisible();
  await expect(page.locator('.desktop-active-case')).toBeVisible();
  await expect(page.locator('.desktop-case-path').getByRole('button')).toHaveCount(6);
  await expect(page.locator('.desktop-utility-rail > section')).toHaveCount(4);
  await expect(page.locator('.desktop-shortcuts .dashboard-quick-grid > button')).toHaveCount(8);
  await assertCaseDeskVisible(page);
  const detailWidths = await page.locator('.desktop-case-hero-copy dl > div').evaluateAll(
    (items) => items.map((item) => item.getBoundingClientRect().width),
  );
  expect(Math.min(...detailWidths)).toBeGreaterThanOrEqual(140);
  await assertDesktopWidthSafe(page, 'Dashboard');

  await page.locator('.desktop-utility-rail').getByRole('button', { name: 'Open Quick Pad', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
  await expect(page.getByRole('dialog', { name: 'Keep lookup details close' })).toBeVisible();
  await page.getByRole('button', { name: 'Close Quick Pad', exact: true }).click();
  await openDashboard(page);

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
  await assertCaseDeskVisible(page);
  await assertDesktopWidthSafe(page, 'Workspace');

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
  await expect(page.locator('.visual-os-frame')).toHaveAttribute('data-workspace-screen', 'tool-menu');

  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await navigation.getByRole('button', { name: 'Cases', exact: true }).click();
  await expect(page.locator('[data-cases-theme-v1="approved"]')).toBeVisible();
  await assertCaseDeskVisible(page);
  await assertDesktopWidthSafe(page, 'Cases');

  await navigation.getByRole('button', { name: 'Academy', exact: true }).click();
  await expect(page.locator('[data-academy-screen="approved-theme-v1"]')).toBeVisible();
  await assertCaseDeskVisible(page);
  await assertDesktopWidthSafe(page, 'Academy');

  await page.getByRole('button', { name: 'Open Agent profile', exact: true }).first().click();
  await expect(page.locator('[data-profile-screen="approved-theme-v1"]')).toBeVisible();
  await assertCaseDeskVisible(page);
  await assertDesktopWidthSafe(page, 'Profile');
});

test('desktop day, auto, and night themes share one stable layout and persist locally', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'desktop');
    if (!window.localStorage.getItem('fraud-academy-desktop-theme-v1')) {
      window.localStorage.setItem('fraud-academy-desktop-theme-v1', 'day');
    }
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await openDashboard(page);

  const root = page.locator('.desktop-mission-control-v2');
  const themeControl = page.getByRole('group', { name: 'Desktop theme', exact: true });
  await expect(root).toHaveAttribute('data-desktop-theme', 'day');
  await expect(themeControl.getByRole('button', { name: 'Day theme', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const dayLayout = await page.evaluate(() => {
    const hero = document.querySelector('.desktop-case-hero')?.getBoundingClientRect();
    const rail = document.querySelector('.desktop-utility-rail')?.getBoundingClientRect();
    return { hero: [hero?.x, hero?.y, hero?.width, hero?.height], rail: [rail?.x, rail?.y, rail?.width] };
  });

  await themeControl.getByRole('button', { name: 'Night theme', exact: true }).click();
  await expect(root).toHaveAttribute('data-desktop-theme', 'night');
  await expect(page.locator('body')).toHaveAttribute('data-desktop-theme', 'night');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('fraud-academy-desktop-theme-v1'))).toBe('night');
  const nightLayout = await page.evaluate(() => {
    const hero = document.querySelector('.desktop-case-hero')?.getBoundingClientRect();
    const rail = document.querySelector('.desktop-utility-rail')?.getBoundingClientRect();
    return { hero: [hero?.x, hero?.y, hero?.width, hero?.height], rail: [rail?.x, rail?.y, rail?.width] };
  });
  expect(nightLayout).toEqual(dayLayout);

  await page.reload();
  await expect(root).toHaveAttribute('data-desktop-theme', 'night');

  await themeControl.getByRole('button', { name: 'Auto theme', exact: true }).click();
  await expect(root).toHaveAttribute('data-desktop-theme-preference', 'auto');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(root).toHaveAttribute('data-desktop-theme', 'night');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(root).toHaveAttribute('data-desktop-theme', 'day');
  await assertDesktopWidthSafe(page, 'Day theme');
});
