import { test, expect } from '@playwright/test';

const secondCase = { id: 'FA-CB-24007', person: 'Jordan Ellis' };
const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate|suggested first tool|investigator question)\b/i;

test('approved Case Briefing is Evidence First, functional, and responsive', async ({ page }, testInfo) => {
  await page.goto('/');

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
  await expect(briefing).toBeVisible();
  await expect(briefing.getByRole('heading', { name: 'Case Briefing', exact: true })).toBeVisible();
  await expect(briefing.getByRole('heading', { name: 'Briefing summary', exact: true })).toBeVisible();
  await expect(briefing.getByRole('heading', { name: 'Luna Briefing Assistant', exact: true })).toBeVisible();
  await expect(briefing.getByRole('heading', { name: 'Recent documents', exact: true })).toBeVisible();

  const utilities = briefing.getByRole('navigation', { name: 'Case briefing utilities' });
  const quickRoutes = briefing.getByRole('navigation', { name: 'Case briefing quick routes' });
  await expect(utilities.getByRole('button')).toHaveCount(5);
  await expect(quickRoutes.getByRole('button')).toHaveCount(3);

  const layout = await page.evaluate(() => {
    const briefingElement = document.querySelector('[data-case-briefing-screen="approved-theme-v1"]');
    const overview = document.querySelector('.case-briefing-overview-card');
    const summary = document.querySelector('.case-briefing-summary-card');
    const utilityNav = document.querySelector('.case-briefing-utilities:not(.case-briefing-quick-routes)');
    const quickRouteNav = document.querySelector('.case-briefing-quick-routes');
    const viewportWidth = window.innerWidth;
    const rect = (element) => element?.getBoundingClientRect();
    const fits = (element) => {
      const box = rect(element);
      return Boolean(box && box.left >= -1 && box.right <= viewportWidth + 1);
    };

    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      briefingFits: fits(briefingElement),
      overviewFits: fits(overview),
      summaryFits: fits(summary),
      utilitiesFit: fits(utilityNav),
      quickRoutesFit: fits(quickRouteNav),
      overviewTop: rect(overview)?.top ?? 0,
      summaryTop: rect(summary)?.top ?? 0,
      utilityColumns: utilityNav ? getComputedStyle(utilityNav).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      quickRouteColumns: quickRouteNav ? getComputedStyle(quickRouteNav).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.briefingFits).toBe(true);
  expect(layout.overviewFits).toBe(true);
  expect(layout.summaryFits).toBe(true);
  expect(layout.utilitiesFit).toBe(true);
  expect(layout.quickRoutesFit).toBe(true);

  if (testInfo.project.name === 'mobile-chromium') {
    expect(Math.abs(layout.overviewTop - layout.summaryTop)).toBeGreaterThan(20);
    expect(layout.utilityColumns).toBe(2);
    expect(layout.quickRouteColumns).toBe(testInfo.project.use.viewport.width <= 430 ? 1 : 3);
  } else {
    expect(Math.abs(layout.overviewTop - layout.summaryTop)).toBeLessThanOrEqual(2);
    expect(layout.utilityColumns).toBe(6);
    expect(layout.quickRouteColumns).toBe(3);
  }

  const selector = page.locator('.visual-case-switcher select');
  await selector.selectOption(secondCase.id);
  await expect(selector).toHaveValue(secondCase.id);
  await expect(briefing.getByText(secondCase.person, { exact: true }).first()).toBeVisible();
  await expect(briefing).toContainText('Cardholder reports recurring billing after cancellation.');

  const workflow = page.getByRole('navigation', { name: 'Active case workflow' });

  await utilities.getByRole('button', { name: /Begin Investigation/ }).click();
  await expect(workflow.getByRole('button', { name: /Investigate/ })).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('.activity-panel')).toContainText('Customer 360');

  const allTools = page.getByRole('button', { name: /All tools/ });
  if (await allTools.isVisible().catch(() => false)) await allTools.click();
  await workflow.getByRole('button', { name: /Case Briefing/ }).click();
  await quickRoutes.getByRole('button', { name: 'Identity Intel', exact: true }).click();
  await expect(page.locator('.activity-panel')).toContainText('Identity Intelligence');

  if (await allTools.isVisible().catch(() => false)) await allTools.click();
  await workflow.getByRole('button', { name: /Case Briefing/ }).click();
  await quickRoutes.getByRole('button', { name: 'Login History', exact: true }).click();
  await expect(page.locator('.activity-panel')).toContainText('Login History');

  if (await allTools.isVisible().catch(() => false)) await allTools.click();
  await workflow.getByRole('button', { name: /Case Briefing/ }).click();
  await quickRoutes.getByRole('button', { name: 'Submit Decision', exact: true }).click();
  await expect(workflow.getByRole('button', { name: /Determination/ })).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('.submit-decision-panel')).toBeVisible();

  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', secondCase.id);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);
});
