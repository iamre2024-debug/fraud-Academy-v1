import { test, expect } from '@playwright/test';
import { openWorkspacePages } from './workspace-page-helpers.mjs';

const caseId = 'FA-ATO-24018';

test('mobile indicators feed the saved determination package without exposing an answer', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Dedicated case-review pages render in mobile layout.');

  await page.addInitScript(({ activeCaseId }) => {
    localStorage.setItem('fraud-academy-visual-tray-v1', JSON.stringify({ [activeCaseId]: [] }));
    localStorage.setItem('fraud-academy-notes-v1', JSON.stringify({ [activeCaseId]: [] }));
    localStorage.setItem('fraud-academy-completed-tools-v1', JSON.stringify({ [activeCaseId]: [] }));
    localStorage.setItem('fraud-academy-review-packages-v1', JSON.stringify({ [activeCaseId]: [] }));
    localStorage.removeItem('fraud-academy-decision-drafts-v1');
    localStorage.removeItem('fraud-academy-note-drafts-v1');
  }, { activeCaseId: caseId });

  await page.goto('/');
  const frame = page.locator('.mission-workspace-v3');
  const workflow = await openWorkspacePages(page);
  await workflow.getByRole('button', { name: /Indicators/ }).click();

  await expect(frame).toHaveAttribute('data-workspace-screen', 'indicators');
  const indicators = page.locator('[data-mobile-review-screen="indicators"]');
  await expect(indicators).toBeVisible();
  await expect(indicators.getByRole('heading', { name: 'Case Indicators Review', exact: true })).toBeVisible();
  await expect(indicators.getByText('Evidence First', { exact: true })).toBeVisible();
  await expect(indicators.getByText('Selections organize your reasoning only. They never calculate or select the decision.', { exact: true })).toBeVisible();
  await expect(indicators.getByRole('radio')).toHaveCount(0);

  const firstIndicator = indicators.locator('.mobile-indicator-row').first();
  const indicatorCheckbox = firstIndicator.getByRole('checkbox');
  await expect(indicatorCheckbox).not.toBeChecked();
  await indicatorCheckbox.check();
  await firstIndicator.locator('input:not([type="checkbox"])').fill('LOG-1005');
  await firstIndicator.locator('textarea').fill('This recorded login should be compared with the customer statement and device history.');

  const note = 'Compared LOG-1005 with the recorded device and customer statement.';
  await indicators.getByRole('textbox', { name: 'New evidence note' }).fill(note);
  await indicators.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(indicators.getByText(note, { exact: true })).toBeVisible();

  const selectedIndicatorId = await firstIndicator.getByRole('checkbox').getAttribute('aria-label');
  await expect.poll(() => page.evaluate((activeCaseId) => {
    const drafts = JSON.parse(localStorage.getItem('fraud-academy-decision-drafts-v1') || '{}');
    const selected = Object.values(drafts[activeCaseId]?.indicators ?? {}).filter((item) => item.selected);
    return {
      count: selected.length,
      proof: selected[0]?.proof,
      explanation: selected[0]?.explanation,
    };
  }, caseId)).toEqual({
    count: 1,
    proof: 'LOG-1005',
    explanation: 'This recorded login should be compared with the customer statement and device history.',
  });
  expect(selectedIndicatorId).toMatch(/^Select indicator:/);

  await indicators.getByRole('button', { name: 'Continue to Determination', exact: true }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'determination');

  const determination = page.locator('[data-mobile-review-screen="determination"]');
  await expect(determination.getByRole('heading', { name: 'Determination', exact: true })).toBeVisible();
  await expect(determination.getByText('0 pins · 1 notes · 1 indicators', { exact: true })).toBeVisible();
  await expect(determination.getByRole('radio', { name: /^More Information Needed\b/ })).toBeVisible();
  await expect(determination.getByRole('radio', { name: 'Approve', exact: true })).toHaveCount(0);

  await determination.getByRole('radio', { name: /^More Information Needed\b/ }).check();
  await determination.getByRole('radio', { name: /^Inconclusive\b/ }).check();
  await determination.getByRole('combobox', { name: 'Learner confidence', exact: true }).selectOption('High');
  await determination.getByRole('textbox', { name: 'Finding basis', exact: true })
    .fill('LOG-1005 and the saved note require another source comparison before a final case conclusion.');

  const continueToSubmit = determination.getByRole('button', { name: 'Continue to Submit Decision', exact: true });
  await expect(continueToSubmit).toBeEnabled();
  await continueToSubmit.click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'submit');

  const finalReview = page.locator('[data-decision-layout="reference-final-review"]');
  await expect(finalReview).toBeVisible();
  await expect(finalReview.locator('.decision-selected-summary')).toContainText('More Information Needed');
  await expect(finalReview.locator('.decision-selected-summary')).toContainText('Inconclusive');
  const submit = finalReview.getByRole('button', { name: 'Confirm and Submit Decision', exact: true });
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(frame).toHaveAttribute('data-workspace-screen', 'debrief');
  await expect(page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="unlocked"]')).toBeVisible();

  const savedPackage = await page.evaluate((activeCaseId) => {
    const packages = JSON.parse(localStorage.getItem('fraud-academy-review-packages-v1') || '{}');
    return packages[activeCaseId]?.[0] ?? null;
  }, caseId);
  expect(savedPackage.operationalDecision).toBe('More Information Needed');
  expect(savedPackage.finalFinding).toBe('Inconclusive');
  expect(savedPackage.confidence).toBe('High');
  expect(savedPackage.pinnedEvidence).toEqual([]);
  expect(savedPackage.noteSnapshot.some((savedNote) => String(savedNote).includes('LOG-1005'))).toBe(true);
  expect(savedPackage.decisionIndicators).toHaveLength(1);
  expect(savedPackage.decisionIndicators[0].proof).toBe('LOG-1005');

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
});
