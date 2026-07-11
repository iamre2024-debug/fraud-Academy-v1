import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'compact-phone', width: 360, height: 760 },
  { name: 'standard-phone', width: 430, height: 860 },
  { name: 'large-phone-small-tablet', width: 640, height: 900 },
  { name: 'tablet', width: 900, height: 1024 },
  { name: 'laptop', width: 1280, height: 900 },
  { name: 'wide-desktop', width: 1600, height: 1000 },
];

const screenSelectors = {
  briefing: '[data-case-briefing-screen="approved-theme-v1"]',
  customer: '[data-customer-360-screen="approved-theme-v1"]',
  tools: '[data-investigation-tools-screen="approved-theme-v1"]',
  timeline: '[data-timeline-screen="approved-theme-v1"]',
  decision: '[data-decision-screen="approved-theme-v1"]',
  luna: '[data-luna-screen="approved-theme-v1"]',
  academy: '[data-academy-screen="approved-theme-v1"]',
  profile: '[data-profile-screen="approved-theme-v1"]',
};

async function auditViewport(page, selector, label) {
  const root = page.locator(selector).first();
  await expect(root, `${label} should be visible`).toBeVisible();

  const audit = await page.evaluate(({ rootSelector }) => {
    const element = document.querySelector(rootSelector);
    const rect = element?.getBoundingClientRect();
    const visibleButtons = [...document.querySelectorAll(`${rootSelector} button`)]
      .filter((button) => {
        const buttonRect = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && buttonRect.width > 0
          && buttonRect.height > 0;
      });
    const touchHeights = visibleButtons.map((button) => button.getBoundingClientRect().height);
    const bottomNav = document.querySelector('.visual-react-bottom-nav');
    const navRect = bottomNav?.getBoundingClientRect();

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      rootLeft: rect?.left ?? Number.POSITIVE_INFINITY,
      rootRight: rect?.right ?? Number.POSITIVE_INFINITY,
      minTouchHeight: touchHeights.length ? Math.min(...touchHeights) : 44,
      bottomNavLeft: navRect?.left ?? 0,
      bottomNavRight: navRect?.right ?? window.innerWidth,
      bottomNavVisible: Boolean(bottomNav && navRect && navRect.width > 0 && navRect.height > 0),
    };
  }, { rootSelector: selector });

  expect(audit.documentWidth, `${label} document width`).toBeLessThanOrEqual(audit.viewportWidth + 1);
  expect(audit.bodyWidth, `${label} body width`).toBeLessThanOrEqual(audit.viewportWidth + 1);
  expect(audit.rootLeft, `${label} left containment`).toBeGreaterThanOrEqual(-2);
  expect(audit.rootRight, `${label} right containment`).toBeLessThanOrEqual(audit.viewportWidth + 2);
  expect(audit.minTouchHeight, `${label} minimum visible button height`).toBeGreaterThanOrEqual(43);
  expect(audit.bottomNavVisible, `${label} bottom navigation`).toBe(true);
  expect(audit.bottomNavLeft, `${label} bottom navigation left containment`).toBeGreaterThanOrEqual(-2);
  expect(audit.bottomNavRight, `${label} bottom navigation right containment`).toBeLessThanOrEqual(audit.viewportWidth + 2);
}

async function openWorkspace(page) {
  await page.getByRole('button', { name: /Workspace/ }).last().click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
}

async function auditCompletedScreens(page, viewportName) {
  await page.getByRole('button', { name: /Dashboard/ }).last().click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'dashboard');
  await auditViewport(page, '[data-react-navigation-panel="dashboard"]', `${viewportName} Dashboard`);

  await page.getByRole('button', { name: /Cases/ }).last().click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'cases');
  await auditViewport(page, '[data-cases-theme-v1="approved"]', `${viewportName} Cases`);

  await openWorkspace(page);
  await auditViewport(page, screenSelectors.briefing, `${viewportName} Case Briefing`);

  await page.getByRole('button', { name: 'Begin Investigation', exact: true }).click();
  await auditViewport(page, screenSelectors.customer, `${viewportName} Customer 360`);

  await page.getByLabel('Choose identity investigation tool').selectOption({ label: 'Identity Intelligence' });
  await auditViewport(page, screenSelectors.tools, `${viewportName} Investigation tools`);

  await page.locator('[data-workflow-stage-button="timeline"]').click();
  await auditViewport(page, screenSelectors.timeline, `${viewportName} Timeline`);

  await page.locator('[data-workflow-stage-button="determination"]').click();
  await auditViewport(page, screenSelectors.decision, `${viewportName} Decision`);
  await auditViewport(page, screenSelectors.luna, `${viewportName} locked Luna`);
  await expect(page.locator(screenSelectors.luna)).toHaveAttribute('data-luna-state', 'locked');

  await page.getByRole('button', { name: /Academy/ }).last().click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'academy');
  await auditViewport(page, screenSelectors.academy, `${viewportName} Academy`);

  await page.locator('.visual-nav-profile-entry').click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'profile');
  await auditViewport(page, screenSelectors.profile, `${viewportName} Profile`);
}

test('all completed screens remain contained across the six approved responsive ranges', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'The desktop project drives the explicit six-range viewport matrix.');
  test.setTimeout(180_000);

  await page.goto('/');
  await expect(page.locator(screenSelectors.briefing)).toBeVisible();

  const builtInCaseId = await page.locator('.visual-case-switcher select').inputValue();
  expect(builtInCaseId).toBeTruthy();

  await page.getByRole('button', { name: /Generate \+ Open Case/ }).click();
  await expect.poll(() => page.locator('.visual-case-switcher select').inputValue()).not.toBe(builtInCaseId);
  const generatedCaseId = await page.locator('.visual-case-switcher select').inputValue();
  expect(generatedCaseId).toMatch(/^FA-/);

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(80);
    await auditCompletedScreens(page, viewport.name);
  }
});
