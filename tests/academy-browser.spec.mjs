import { test, expect } from '@playwright/test';

const forbiddenCopy = /Fraudulent|Legitimate|Correct answer|AI recommendation|Red flag|Green flag|final answer/i;

async function openAcademy(page) {
  await page.locator('.visual-react-bottom-nav').getByRole('button', { name: 'Academy', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'academy');
  const academy = page.locator('[data-academy-screen="approved-theme-v1"]');
  await expect(academy).toBeVisible();
  return academy;
}

test('approved Academy preserves neutral learning routes and responsive safety', async ({ page }, testInfo) => {
  await page.goto('/');
  const academy = await openAcademy(page);

  await expect(academy.getByRole('heading', { name: 'Build investigator judgment', exact: true })).toBeVisible();
  await expect(academy.locator('.academy-stat-grid article')).toHaveCount(4);
  await expect(academy.locator('.academy-path-card')).toHaveCount(4);
  await expect(academy.getByText('Evidence First foundation', { exact: true })).toBeVisible();
  await expect(academy.getByText('Record review practice', { exact: true })).toBeVisible();
  await expect(academy.getByText('Evidence connections', { exact: true })).toBeVisible();
  await expect(academy.getByText('Case quality and submission', { exact: true })).toBeVisible();
  expect(await academy.innerText()).not.toMatch(forbiddenCopy);

  const layout = await page.evaluate(() => {
    const panel = document.querySelector('[data-academy-screen="approved-theme-v1"]');
    const mainGrid = document.querySelector('.academy-main-grid');
    const pathGrid = document.querySelector('.academy-path-grid');
    const statGrid = document.querySelector('.academy-stat-grid');
    const viewportWidth = window.innerWidth;
    const rect = panel?.getBoundingClientRect();
    const columns = (element) => element
      ? getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
      : 0;
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelOverflow: rect ? Math.max(0, -rect.left, rect.right - viewportWidth) : Number.POSITIVE_INFINITY,
      mainColumns: columns(mainGrid),
      pathColumns: columns(pathGrid),
      statColumns: columns(statGrid),
      position: panel ? getComputedStyle(panel).position : '',
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelOverflow).toBeLessThanOrEqual(4);
  expect(layout.position).not.toBe('fixed');
  if (testInfo.project.name === 'mobile-chromium') {
    expect(layout.mainColumns).toBe(1);
    expect(layout.pathColumns).toBe(1);
    expect(layout.statColumns).toBe(2);
  } else {
    expect(layout.mainColumns).toBe(2);
    expect(layout.pathColumns).toBe(2);
    expect(layout.statColumns).toBe(4);
  }

  await academy.getByRole('button', { name: 'Open Academy Progress', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'progress');
  await expect(page.getByRole('heading', { name: 'Saved package progress', exact: true })).toBeVisible();

  const academyAgain = await openAcademy(page);
  await academyAgain.getByRole('button', { name: 'Open Case Queue', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'cases');
  await expect(page.locator('[data-cases-theme-v1="approved"]')).toBeVisible();

  const academyFinal = await openAcademy(page);
  await academyFinal.getByRole('button', { name: /Continue active case/ }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
  await expect(page.locator('.active-case-workflow')).toBeVisible();
});
