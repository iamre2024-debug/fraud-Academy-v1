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
    const categoryCards = [...document.querySelectorAll('[data-mobile-tool-map="reference-v1"] .mobile-tool-map-cluster')]
      .filter((element) => element.getBoundingClientRect().width > 0);
    const brandText = document.querySelector('.mission-mobile-brand > span:last-child')?.getBoundingClientRect();
    const dockLabelHeights = [...document.querySelectorAll('.mission-mobile-dock button small')]
      .map((element) => element.getBoundingClientRect().height);
    return {
      viewport: window.innerWidth,
      expectedShellWidth: window.innerWidth * 0.94,
      expectedDockInset: window.innerWidth <= 370 ? 4 : 8,
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
        const title = element.querySelector('strong');
        const rect = title?.getBoundingClientRect();
        return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
      }),
      categoryFontSizes: categoryCards.flatMap((element) => (
        [...element.querySelectorAll('strong, small')]
          .map((text) => Number.parseFloat(getComputedStyle(text).fontSize))
      )),
      brandTextHeight: brandText?.height ?? 0,
      dockLabelHeights,
    };
  });

  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.rootLeft).toBeGreaterThanOrEqual(((geometry.viewport - geometry.expectedShellWidth) / 2) - 1);
  expect(geometry.rootLeft).toBeLessThanOrEqual(((geometry.viewport - geometry.expectedShellWidth) / 2) + 1);
  expect(geometry.rootRight).toBeGreaterThanOrEqual(((geometry.viewport + geometry.expectedShellWidth) / 2) - 1);
  expect(geometry.rootRight).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.rootWidth).toBeGreaterThanOrEqual(geometry.expectedShellWidth - 1);
  expect(geometry.rootWidth).toBeLessThanOrEqual(geometry.expectedShellWidth + 1);
  expect(geometry.dockLeft).toBeGreaterThanOrEqual(geometry.rootLeft + geometry.expectedDockInset - 1);
  expect(geometry.dockRight).toBeLessThanOrEqual(geometry.rootRight - geometry.expectedDockInset + 1);
  expect(geometry.dockBottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
  expect(geometry.dockWidth).toBeGreaterThanOrEqual(geometry.expectedShellWidth - 18);
  expect(geometry.badHeadings).toEqual([]);
  expect(geometry.categoryCardWidths.every((width) => width >= 118)).toBe(true);
  expect(geometry.categoryTitleGeometry.every(({ width, height }) => width >= 90 && height <= 74)).toBe(true);
  expect(geometry.categoryFontSizes.every((size) => size >= 12)).toBe(true);
  expect(geometry.brandTextHeight).toBeLessThanOrEqual(34);
  expect(geometry.dockLabelHeights.every((height) => height <= 18)).toBe(true);
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

  await page.locator('.mission-command-drawers').getByRole('button', { name: /Evidence Map/ }).click();
  await expect(page.locator('.mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'tool-menu');
  await expect(page.locator('[data-mobile-tool-map="reference-v1"]')).toBeVisible();

  await dock.getByRole('button', { name: /Academy/ }).click();
  await expect(page.locator('[data-mission-page="academy"]')).toBeVisible();
  await expect(page.locator('[data-academy-screen="approved-theme-v1"]')).toBeVisible();

  await dock.getByRole('button', { name: /Cases/ }).click();
  await expect(page.locator('[data-mission-page="cases"]')).toBeVisible();
  await expect(page.locator('[data-mobile-case-queue="reference-v1"]')).toBeVisible();

  await dock.getByRole('button', { name: /Workspace/ }).click();
  await expect(page.locator('.mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'briefing');
  await expect(page.locator('.mission-briefing-v3')).toBeVisible();
  await expect(page.locator('.case-summary-visual')).toHaveCount(0);
  await expect(page.locator('.mission-briefing-tabs button')).toHaveCount(6);
  await page.locator('.mission-briefing-tabs button').nth(4).click();
  await expect(page.locator('.mission-briefing-file')).toContainText('Open viewer');
  await capture(page, testInfo, '02-briefing-paperwork');

  await page.getByRole('button', { name: 'Open mission pages' }).click();
  await expect(page.locator('.mission-path-v3')).toBeVisible();
  await page.locator('.mission-path-list').getByRole('button', { name: /Investigate/ }).click();
  const toolMap = page.locator('[data-mobile-tool-map="reference-v1"]');
  await expect(toolMap).toBeVisible();
  const categoryButtons = toolMap.locator('.mobile-tool-map-cluster');
  await expect(categoryButtons).toHaveCount(5);
  await expect(categoryButtons.filter({ hasText: 'Business & Payment Verification' })).toBeVisible();
  await expect(page.locator('.mission-evidence-page .visual-category-row')).toBeHidden();
  await assertPhoneGeometry(page);
  await capture(page, testInfo, '03-evidence-map');

  await categoryButtons.filter({ hasText: 'Evidence & Workflow' }).click();
  const evidenceTools = toolMap.getByRole('region', { name: 'Evidence & Workflow tools' });
  await expect(evidenceTools).toBeVisible();
  await evidenceTools.getByRole('button', { name: /Document Viewer/ }).click();
  await expect(page.locator('.mission-tool-page')).toBeVisible();
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toHaveAttribute('data-tool-name', 'Document Viewer');
  const accountSearch = page.getByRole('textbox', { name: 'Search by Account ID' });
  await page.getByRole('button', { name: 'Use active case Account ID', exact: true }).click();
  await expect(accountSearch).not.toHaveValue('');
  await expect(page.getByRole('heading', { name: 'Customer documents are locked', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Search account', exact: true }).click();
  await expect(page.locator('.document-folder-nav')).toBeVisible();
  await capture(page, testInfo, '04-document-folders');

  await page.getByRole('button', { name: 'Open mission pages' }).click();
  await page.locator('.mission-path-list').getByRole('button', { name: /Decision/ }).click();
  const determination = page.locator('[data-mobile-review-screen="determination"]');
  await expect(determination).toBeVisible();
  await expect(determination.getByRole('button', { name: 'Continue to Submit Decision', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Open Quick Pad/ })).toHaveCount(0);
  await capture(page, testInfo, '05-decision');

  await dock.getByRole('button', { name: /Cases/ }).click();
  const queue = page.locator('[data-mobile-case-queue="reference-v1"]');
  await expect(queue).toBeVisible();
  await queue.getByRole('button', { name: /Create a fictional training case/ }).click();
  const generator = queue.getByRole('dialog', { name: 'Create a fictional training case', exact: true });
  await expect(generator).toBeVisible();
  await generator.getByLabel('Cases', { exact: true }).selectOption('1');
  await generator.getByRole('button', { name: 'Generate training case', exact: true }).click();

  await expect(page.locator('.mission-briefing-v3')).toBeVisible();
  const generatedCaseId = await page.locator('.mission-workspace-case-selector select').inputValue();
  expect(generatedCaseId).toMatch(/-G\d+$/);
  await expect(page.locator('.mission-briefing-identity')).toContainText(generatedCaseId);
  await page.getByRole('button', { name: 'Open mission pages' }).click();
  await page.locator('.mission-path-list').getByRole('button', { name: /Investigate/ }).click();
  const generatedToolMap = page.locator('[data-mobile-tool-map="reference-v1"]');
  await expect(generatedToolMap).toBeVisible();
  await generatedToolMap.locator('.mobile-tool-map-cluster').filter({ hasText: 'Identity & Customer' }).click();
  await generatedToolMap.getByRole('region', { name: 'Identity & Customer tools' })
    .getByRole('button', { name: /Customer 360/ })
    .click();
  await expect(page.locator('[data-customer-360-screen="approved-theme-v1"]')).toHaveAttribute('data-case-id', generatedCaseId);
  await assertPhoneGeometry(page);
  await capture(page, testInfo, '06-generated-customer-360');
});
