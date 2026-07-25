import { test, expect } from '@playwright/test';

async function capture(page, testInfo, name) {
  if (process.env.CAPTURE_MISSION_VISUALS !== '1') return;
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
}

async function assertPhoneGeometry(page) {
  const geometry = await page.evaluate(() => {
    const root = document.querySelector('.mission-mobile-root')?.getBoundingClientRect();
    const dock = document.querySelector('.mission-mobile-dock')?.getBoundingClientRect();
    const badHeadings = [...document.querySelectorAll('.mission-mobile-root h1, .mission-mobile-root h2, .mission-mobile-root h3')]
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.width < 58 && rect.height > 80;
      })
      .map((element) => element.textContent.trim());
    const categoryCards = [...document.querySelectorAll('.mission-evidence-page .visual-category-row > button')]
      .filter((element) => element.getBoundingClientRect().width > 0);
    return {
      viewport: window.innerWidth,
      expectedShellWidth: window.innerWidth * 0.94,
      documentWidth: document.documentElement.scrollWidth,
      rootLeft: root?.left ?? -1,
      rootRight: root?.right ?? window.innerWidth + 1,
      rootWidth: root?.width ?? 0,
      dockLeft: dock?.left ?? -1,
      dockRight: dock?.right ?? window.innerWidth + 1,
      dockBottom: dock?.bottom ?? window.innerHeight + 1,
      dockWidth: dock?.width ?? 0,
      viewportHeight: window.innerHeight,
      badHeadings,
      categoryCardWidths: categoryCards.map((element) => element.getBoundingClientRect().width),
      categoryTitleGeometry: categoryCards.map((element) => {
        const title = element.querySelector('.investigation-category-copy strong');
        const rect = title?.getBoundingClientRect();
        return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
      }),
      categoryFontSizes: categoryCards.flatMap((element) => (
        [...element.querySelectorAll('.investigation-category-copy strong, .investigation-category-copy small, .category-status-copy')]
          .map((text) => Number.parseFloat(getComputedStyle(text).fontSize))
      )),
    };
  });

  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.rootLeft).toBeGreaterThanOrEqual(((geometry.viewport - geometry.expectedShellWidth) / 2) - 1);
  expect(geometry.rootLeft).toBeLessThanOrEqual(((geometry.viewport - geometry.expectedShellWidth) / 2) + 1);
  expect(geometry.rootRight).toBeGreaterThanOrEqual(((geometry.viewport + geometry.expectedShellWidth) / 2) - 1);
  expect(geometry.rootRight).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.rootWidth).toBeGreaterThanOrEqual(geometry.expectedShellWidth - 1);
  expect(geometry.rootWidth).toBeLessThanOrEqual(geometry.expectedShellWidth + 1);
  expect(geometry.dockLeft).toBeGreaterThanOrEqual(geometry.rootLeft + 7);
  expect(geometry.dockRight).toBeLessThanOrEqual(geometry.rootRight - 7);
  expect(geometry.dockBottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
  expect(geometry.dockWidth).toBeGreaterThanOrEqual(geometry.expectedShellWidth - 18);
  expect(geometry.badHeadings).toEqual([]);
  expect(geometry.categoryCardWidths.every((width) => width >= 140)).toBe(true);
  expect(geometry.categoryTitleGeometry.every(({ width, height }) => width >= 70 && height <= 74)).toBe(true);
  expect(geometry.categoryFontSizes.every((size) => size >= 12)).toBe(true);
}

test('mobile mounts the dedicated Mission Deck and a generated case inherits every route', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Dedicated phone renderer');
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  });
  await page.goto('/');

  const root = page.locator('.mission-mobile-root');
  const dock = page.getByRole('navigation', { name: 'Mission navigation' });
  await expect(root).toBeVisible();
  await expect(page.locator('.visual-os-frame')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
  await expect(dock).toBeVisible();

  for (const width of [360, 393, 412, 628, 980]) {
    await page.setViewportSize({ width, height: 1536 });
    await assertPhoneGeometry(page);
  }
  await page.setViewportSize({ width: 393, height: 1536 });

  await dock.getByRole('button', { name: /Home/ }).click();
  await expect(page.locator('.mission-case-deck')).toBeVisible();
  await expect(page.locator('.mission-lighthouse')).toBeVisible();
  await expect(page.locator('.mission-case-layer')).toHaveCount(2);
  await expect(page.locator('.mission-command-drawers')).toBeVisible();
  await assertPhoneGeometry(page);
  await capture(page, testInfo, '01-dashboard');

  await dock.getByRole('button', { name: /Mission/ }).click();
  await expect(page.locator('.mission-briefing-v3')).toBeVisible();
  await expect(page.locator('.case-summary-visual')).toHaveCount(0);
  await expect(page.locator('.mission-briefing-tabs button')).toHaveCount(6);
  await page.locator('.mission-briefing-tabs button').nth(4).click();
  await expect(page.locator('.mission-briefing-file')).toContainText('Open viewer');
  await capture(page, testInfo, '02-briefing-paperwork');

  await page.getByRole('button', { name: 'Open mission pages' }).click();
  await expect(page.locator('.mission-path-v3')).toBeVisible();
  await page.locator('.mission-path-list').getByRole('button', { name: /Investigate/ }).click();
  await expect(page.locator('.mission-evidence-page .mission-evidence-map')).toBeVisible();
  const categoryButtons = page.locator('.mission-evidence-page .visual-category-row > button');
  await expect(categoryButtons).toHaveCount(6);
  await expect(categoryButtons.filter({ hasText: 'Business & Payment Verification' })).toBeVisible();
  await assertPhoneGeometry(page);
  await capture(page, testInfo, '03-evidence-map');

  await page.locator('.mission-evidence-page .visual-category-row > button').filter({ hasText: 'Documents & Requests' }).click();
  await expect(page.locator('.mission-tool-page')).toBeVisible();
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toHaveAttribute('data-tool-name', 'Document Viewer');
  await page.getByRole('button', { name: 'Open active case documents' }).click();
  await expect(page.locator('.document-folder-nav')).toBeVisible();
  await capture(page, testInfo, '04-document-folders');

  await page.getByRole('button', { name: 'Open mission pages' }).click();
  await page.locator('.mission-path-list').getByRole('button', { name: /Decision/ }).click();
  await expect(page.locator('.mission-decision-page')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit Decision' })).toBeVisible();
  await capture(page, testInfo, '05-decision');

  await dock.getByRole('button', { name: /Cases/ }).click();
  const queue = page.locator('.cases-theme-v1-panel');
  await expect(queue).toBeVisible();
  await queue.getByLabel('Generate case count').selectOption('1');
  await queue.getByRole('button', { name: 'Generate cases', exact: true }).click();

  await expect(page.locator('.mission-briefing-v3')).toBeVisible();
  const generatedCaseId = await page.locator('.mission-workspace-case-selector select').inputValue();
  expect(generatedCaseId).toMatch(/-G\d+$/);
  await expect(page.locator('.mission-briefing-identity')).toContainText(generatedCaseId);
  await page.getByRole('button', { name: 'Open mission pages' }).click();
  await page.locator('.mission-path-list').getByRole('button', { name: /Investigate/ }).click();
  await expect(page.locator('.mission-evidence-page .mission-evidence-map')).toBeVisible();
  await page.locator('.mission-evidence-page .mission-map-node.node-customer').click();
  await expect(page.locator('[data-customer-360-screen="approved-theme-v1"]')).toHaveAttribute('data-case-id', generatedCaseId);
  await assertPhoneGeometry(page);
  await capture(page, testInfo, '06-generated-customer-360');
});
