import { test, expect } from '@playwright/test';

const builtInCases = [
  { id: 'FA-ATO-24018', person: 'Maya Sterling' },
  { id: 'FA-CB-24007', person: 'Jordan Ellis' },
  { id: 'FA-CR-24003', person: 'Avery Brooks' },
];

const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|open first tool|suggested first tool|investigator question)\b/i;

async function openCaseQueue(page) {
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /Cases/ }).click();
  await expect(page.locator('[data-react-navigation-panel="cases"]')).toBeVisible();
}

async function assertEvidenceFirstLock(page, expectedCaseId) {
  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', expectedCaseId);
  await expect(page.getByText('Evidence First lock is active.')).toBeAttached();
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);
}

async function openCoreTool(page, category, tool) {
  await page.locator('.visual-category-row button').filter({ hasText: category }).click();
  const selector = page.locator('.tool-select');
  await selector.selectOption({ label: tool });
  await expect(selector).toHaveValue(tool);
  await expect(page.locator('.tool-purpose-card strong')).toHaveText(tool);
  await expect(page.locator('.activity-row:not(.table-head)').first()).toBeVisible();
  await expect(page.locator('.record-detail-panel')).toBeAttached();
}

test('all three built-in cases open from the queue without answer leaks', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Fraud Academy OS/ })).toBeVisible();

  for (const item of builtInCases) {
    await openCaseQueue(page);
    await page.locator('.nav-case-card').filter({ hasText: item.id }).click();
    await expect(page.locator('.visual-case-switcher select')).toHaveValue(item.id);
    await expect(page.locator('.case-summary-meta-grid').getByText(item.person, { exact: true })).toBeVisible();
    await assertEvidenceFirstLock(page, item.id);
  }
});

test('completed core modules and System Access Lane render real records', async ({ page }) => {
  await page.goto('/');

  await openCoreTool(page, 'Financial', 'Payment Verification');
  await openCoreTool(page, 'Business', 'Business Intelligence');
  await openCoreTool(page, 'Evidence', 'Evidence Center');
  await openCoreTool(page, 'Connections', 'Link Analysis');
  await openCoreTool(page, 'Connections', 'System Access Lane');
  await openCoreTool(page, 'Investigation', 'Timeline');
  await openCoreTool(page, 'Investigation', 'Case Report');

  await expect(page.locator('.view-full-button')).toBeVisible();
  await assertEvidenceFirstLock(page, builtInCases[0].id);
});

test('generated cases open immediately, remain unique, and persist after reload', async ({ page }) => {
  await page.goto('/');
  const selector = page.locator('.visual-case-switcher select');
  const generateButton = page.getByRole('button', { name: /Generate \+ Open Case/ });
  const generatedIds = [];

  for (let index = 0; index < 3; index += 1) {
    const previousId = await selector.inputValue();
    await generateButton.click();
    await expect(generateButton).toBeEnabled();
    await expect.poll(() => selector.inputValue()).not.toBe(previousId);
    const generatedId = await selector.inputValue();
    expect(generatedId).toMatch(/^FA-(?:ATO|CB|FPF|EMAIL|CR)-G\d{8}$/);
    expect(generatedIds).not.toContain(generatedId);
    generatedIds.push(generatedId);
    await expect(page.locator('.visual-case-strip')).toContainText('Generated');
    await expect(page.locator('.activity-row:not(.table-head)').first()).toBeVisible();
    await assertEvidenceFirstLock(page, generatedId);
  }

  await expect(page.getByText('3 generated training cases saved locally')).toBeVisible();
  await page.reload();
  await expect(page.getByText('3 generated training cases saved locally')).toBeVisible();
  await openCaseQueue(page);

  for (const generatedId of generatedIds) {
    await expect(page.locator('.nav-case-card').filter({ hasText: generatedId })).toBeVisible();
  }

  await page.locator('.nav-case-card').filter({ hasText: generatedIds[0] }).click();
  await expect(selector).toHaveValue(generatedIds[0]);
  await assertEvidenceFirstLock(page, generatedIds[0]);
});
