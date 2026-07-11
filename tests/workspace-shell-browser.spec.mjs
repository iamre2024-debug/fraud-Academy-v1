import { test, expect } from '@playwright/test';

const firstCaseId = 'FA-ATO-24018';
const secondCase = { id: 'FA-CB-24007', person: 'Jordan Ellis' };
const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|open first tool|suggested first tool|investigator question)\b/i;

test('approved Workspace shell is compact, functional, and responsive', async ({ page }, testInfo) => {
  await page.goto('/');

  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
  await expect(page.locator('.workspace-shell-heading')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fraud Academy OS', exact: true })).toBeVisible();
  await expect(page.locator('.workspace-shell-heading')).toContainText('Investigation Workspace');
  await expect(page.locator('.workspace-shell-heading')).toContainText(`Evidence First · Active case ${firstCaseId}`);
  await expect(page.locator('.visual-case-strip')).toContainText(firstCaseId);

  const workflow = page.getByRole('navigation', { name: 'Active case workflow' });
  await expect(workflow.getByRole('button')).toHaveCount(7);
  await expect(workflow.getByRole('button', { name: /Case Briefing/ })).toHaveAttribute('aria-current', 'step');

  const layout = await page.evaluate(() => {
    const header = document.querySelector('.visual-hero');
    const caseStrip = document.querySelector('.visual-case-strip');
    const workflowList = document.querySelector('.active-case-workflow-list');
    const viewportWidth = window.innerWidth;
    const rect = (element) => element?.getBoundingClientRect();
    const fits = (element) => {
      const box = rect(element);
      return Boolean(box && box.left >= -1 && box.right <= viewportWidth + 1);
    };

    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      headerHeight: rect(header)?.height ?? 0,
      headerFits: fits(header),
      caseStripFits: fits(caseStrip),
      workflowFits: fits(workflowList),
      workflowColumns: workflowList ? getComputedStyle(workflowList).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.headerFits).toBe(true);
  expect(layout.caseStripFits).toBe(true);
  expect(layout.workflowFits).toBe(true);
  expect(layout.headerHeight).toBeLessThanOrEqual(110);

  if (testInfo.project.name === 'mobile-chromium') {
    expect(layout.workflowColumns).toBe(2);
  } else {
    expect(layout.workflowColumns).toBe(7);
  }

  await page.getByRole('button', { name: 'Open Help' }).click();
  await expect(page.locator('#visual-header-control-panel')).toContainText('Evidence First guide');
  await page.getByRole('button', { name: 'Close header panel' }).click();
  await expect(page.locator('#visual-header-control-panel')).toHaveCount(0);

  const selector = page.locator('.visual-case-switcher select');
  await selector.selectOption(secondCase.id);
  await expect(selector).toHaveValue(secondCase.id);
  await expect(page.locator('.workspace-shell-heading')).toContainText(`Active case ${secondCase.id}`);
  await expect(page.locator('.case-summary-meta-grid').getByText(secondCase.person, { exact: true })).toBeVisible();

  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', secondCase.id);
  await expect(page.getByText('Evidence First lock is active.')).toBeAttached();
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);
});
