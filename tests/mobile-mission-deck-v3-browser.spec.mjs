import { expect, test } from '@playwright/test';

async function capture(page, testInfo, name) {
  if (process.env.CAPTURE_MISSION_VISUALS !== '1') return;
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
}

async function assertPhoneGeometry(page) {
  const geometry = await page.evaluate(() => {
    const dock = document.querySelector('.mission-mobile-dock')?.getBoundingClientRect();
    const root = document.querySelector('.mission-mobile-root')?.getBoundingClientRect();
    const buttons = [...document.querySelectorAll('.mission-mobile-dock button')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height, label: button.textContent.trim() };
    });
    return {
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      root: root ? { left: root.left, right: root.right, width: root.width } : null,
      dock: dock ? { left: dock.left, right: dock.right, bottom: dock.bottom } : null,
      viewportHeight: window.innerHeight,
      buttons,
    };
  });

  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.root.left).toBeGreaterThanOrEqual(0);
  expect(geometry.root.right).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.root.width).toBeGreaterThanOrEqual(geometry.viewport - 1);
  expect(geometry.dock.left).toBeGreaterThanOrEqual(0);
  expect(geometry.dock.right).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.dock.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
  expect(geometry.buttons).toHaveLength(6);
  expect(geometry.buttons.every((button) => button.width >= 44 && button.height >= 44)).toBe(true);
  expect(geometry.buttons.map((button) => button.label)).toEqual(['⌂Home', '▣Cases', '⊞Workspace', '◇Academy', '☾Agent', '❝Quotes']);
}

test('mobile mounts the approved Fraud Academy shell and generated cases inherit the reference tool pages', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Dedicated phone renderer');
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  });
  await page.goto('/');

  const root = page.locator('.mission-mobile-root');
  const dock = page.getByRole('navigation', { name: 'Mission navigation' });
  await expect(root).toBeVisible();
  await expect(page.locator('.visual-os-frame')).toHaveCount(0);
  await expect(dock.getByRole('button')).toHaveCount(6);

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 412, height: 600 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport);
    await assertPhoneGeometry(page);
  }
  await page.setViewportSize({ width: 390, height: 844 });

  await dock.getByRole('button', { name: /Home/ }).click();
  const dashboard = page.locator('.mobile-reference-dashboard');
  await expect(dashboard).toBeVisible();
  await expect(dashboard.getByRole('heading', { name: 'Good morning Ree, let’s stop fraud ✨' })).toBeVisible();
  await expect(dashboard.getByRole('button', { name: 'Open Luna agent panel' })).toContainText('Luna');
  await expect(dashboard.locator('.mobile-dashboard-grid .mobile-dashboard-card')).toHaveCount(3);
  await expect(dashboard.locator('.mobile-dashboard-active-case')).toContainText('FA-ATO-24018');
  await expect(dashboard.locator('.mobile-dashboard-academy-panel')).toContainText('Academy Progress');
  await expect(dashboard.locator('.mobile-dashboard-panels')).toContainText('Agent Panel');
  await expect(dashboard.locator('.mobile-dashboard-panels')).toContainText('Quotes');
  await capture(page, testInfo, '01-approved-dashboard');

  await dock.getByRole('button', { name: /Quotes/ }).click();
  await expect(page.locator('.mobile-quotes-page')).toBeVisible();
  await expect(page.locator('.mobile-quotes-page')).toContainText('Evidence before assumptions');

  await dock.getByRole('button', { name: /Workspace/ }).click();
  await expect(page.locator('.mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'briefing');
  await expect(page.locator('.mission-briefing-v4')).toBeVisible();
  await page.getByRole('button', { name: /Open workspace/i }).click();
  await expect(page.locator('[data-mobile-reference-tool="Customer 360"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /Open Quick Pad/ })).toBeVisible();

  await page.getByRole('button', { name: 'Open workspace menu' }).click();
  await page.getByRole('navigation', { name: 'Workspace shortcuts' })
    .getByRole('button', { name: /All tools/ })
    .click();
  const toolMap = page.locator('.mission-evidence-map');
  await expect(toolMap).toBeVisible();
  await expect(toolMap.locator('.mission-map-tool-node')).toHaveCount(6);
  await expect(toolMap).not.toContainText('KYB Review');
  await expect(toolMap).not.toContainText('System Access Lane');
  await capture(page, testInfo, '02-approved-tool-map');

  await page.getByRole('button', { name: 'Open workspace menu' }).click();
  await page.getByRole('navigation', { name: 'Workspace shortcuts' })
    .getByRole('button', { name: /Decide/ })
    .click();
  const decision = page.locator('.mission-decision-page');
  await expect(decision).toBeVisible();
  await expect(decision.getByRole('group', { name: 'Operational decision' })).toBeVisible();
  await expect(decision.getByRole('group', { name: 'Final investigative finding' })).toBeVisible();
  await expect(decision.getByRole('button', { name: 'Submit Decision' })).toBeDisabled();
  await capture(page, testInfo, '03-separated-decision');

  await dock.getByRole('button', { name: /Cases/ }).click();
  const queue = page.locator('.cases-theme-v1-panel');
  await expect(queue).toBeVisible();
  await queue.getByLabel('Generate case count').selectOption('1');
  await queue.getByRole('button', { name: 'Generate cases', exact: true }).click();

  await expect(page.locator('.mission-briefing-v4')).toBeVisible();
  await page.getByRole('button', { name: 'Open workspace menu' }).click();
  const generatedCaseId = await page.getByRole('combobox', { name: 'Choose active mission case' }).inputValue();
  expect(generatedCaseId).toMatch(/-G\d+$/);
  await page.getByRole('button', { name: 'Open workspace menu' }).click();
  await page.getByRole('button', { name: /Open workspace/i }).click();
  await expect(page.locator('[data-customer-360-screen="approved-theme-v2"]')).toHaveAttribute('data-case-id', generatedCaseId);
  await assertPhoneGeometry(page);
  await capture(page, testInfo, '04-generated-customer-360');
});
