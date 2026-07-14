import { test, expect } from '@playwright/test';

const caseId = 'FA-ATO-24018';
const requiredTools = [
  'Case Summary',
  'Customer 360',
  'Identity Intelligence',
  'Login History',
  'Transaction History',
  'Evidence Center',
  'Link Analysis',
];
const learnerChoice = 'Request more information from customer';
const rationale = 'The reviewed records support another information request because the current package documents the timeline, linked activity, and remaining evidence gap.';
const forbiddenLockedCopy = /(?:\/100|Strong package|Solid package|Developing package|Needs more support|Package strengths|Next coaching focus)/i;

async function seedReadyCase(page) {
  await page.addInitScript(({ activeCaseId, completedTools }) => {
    if (sessionStorage.getItem('fraud-academy-decision-luna-test-seeded') === 'yes') return;
    localStorage.setItem('fraud-academy-completed-tools-v1', JSON.stringify({ [activeCaseId]: completedTools }));
    localStorage.setItem('fraud-academy-visual-tray-v1', JSON.stringify({ [activeCaseId]: ['TRAINING-ID-1001', 'EVT-1014'] }));
    localStorage.setItem('fraud-academy-notes-v1', JSON.stringify({
      [activeCaseId]: ['Jul 11 · Investigation note · Reviewed the access sequence and documented the remaining customer-information gap.'],
    }));
    localStorage.setItem('fraud-academy-case-report-packets-v1', JSON.stringify({ [activeCaseId]: [] }));
    localStorage.removeItem('fraud-academy-review-packages-v1');
    localStorage.removeItem('fraud-academy-decision-drafts-v1');
    sessionStorage.setItem('fraud-academy-decision-luna-test-seeded', 'yes');
  }, { activeCaseId: caseId, completedTools: requiredTools });
}

async function openDecision(page) {
  await page.locator('.active-case-workflow').getByRole('button', { name: /Determination/ }).click();
  const decision = page.locator('[data-decision-screen="approved-theme-v1"]');
  await expect(decision).toBeVisible();
  return decision;
}

test('standalone Decision and Luna preserve Evidence First, package submission, debrief routes, and responsive safety', async ({ page }, testInfo) => {
  await seedReadyCase(page);
  await page.goto('/');

  const decision = await openDecision(page);
  await expect(decision).toHaveAttribute('data-case-id', caseId);
  await expect(decision.getByRole('heading', { name: 'Submit Decision', exact: true })).toBeVisible();
  await expect(decision.getByText('Evidence First protection', { exact: true })).toBeVisible();
  await expect(decision.getByRole('button', { name: 'Back to investigation tools', exact: true })).toBeVisible();
  await expect(decision.getByRole('heading', { name: 'Package readiness', exact: true })).toHaveCount(0);
  await expect(page.locator('.decision-status-grid')).toHaveCount(0);
  await expect(page.locator('.decision-v1-checklist')).toHaveCount(0);
  await expect(page.locator('[data-workflow-stage="briefing"]')).toHaveCount(0);
  await expect(page.locator('[data-workflow-stage="indicators"]')).toHaveCount(0);

  const lockedLuna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="locked"]');
  await expect(lockedLuna).toBeAttached();
  await expect(lockedLuna).toContainText('Evidence First lock is active.');
  expect(await lockedLuna.innerText()).not.toMatch(forbiddenLockedCopy);

  const layout = await page.evaluate(() => {
    const panel = document.querySelector('[data-decision-screen="approved-theme-v1"]');
    const form = document.querySelector('.decision-standalone-form');
    const rect = panel?.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelOverflow: rect ? Math.max(0, -rect.left, rect.right - viewportWidth) : Number.POSITIVE_INFINITY,
      formWidth: form?.getBoundingClientRect().width ?? 0,
      position: panel ? getComputedStyle(panel).position : '',
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelOverflow).toBeLessThanOrEqual(4);
  expect(layout.formWidth).toBeLessThanOrEqual(Math.min(760, layout.viewportWidth));
  expect(layout.position).toBe('static');

  const choice = decision.getByRole('combobox', { name: 'Learner decision choice' });
  await choice.selectOption({ label: learnerChoice });
  await decision.getByRole('combobox', { name: 'Learner confidence' }).selectOption('High');
  await decision.getByRole('textbox', { name: 'Learner rationale' }).fill(rationale);
  const savePackage = decision.getByRole('button', { name: /Save learner package/ });
  await expect(savePackage).toBeVisible();
  await savePackage.click();

  await expect(decision.getByRole('heading', { name: `Learner package saved for ${caseId}` })).toBeVisible();
  await expect(decision.getByText('Luna debrief unlocked', { exact: true })).toBeVisible();

  const luna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="unlocked"]');
  await expect(luna).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'Your submitted determination', exact: true })).toBeVisible();
  await expect(luna.getByText(learnerChoice, { exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'How Luna read the package', exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'What your package did well', exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'Next coaching focus', exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'Decision-quality breakdown', exact: true })).toBeVisible();

  const debriefLayout = await page.evaluate(() => {
    const grid = document.querySelector('.luna-v1-debrief-grid');
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      columns: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });
  expect(debriefLayout.documentWidth).toBeLessThanOrEqual(debriefLayout.viewportWidth + 1);
  expect(debriefLayout.columns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 2);

  await luna.getByRole('button', { name: 'View Case Summary', exact: true }).click();
  await expect(page.locator('[data-case-briefing-screen="approved-theme-v1"]')).toBeVisible();

  await page.reload();
  const persistedLuna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="unlocked"]');
  await expect(persistedLuna).toBeAttached();
  await expect(persistedLuna).toContainText(learnerChoice);

  await persistedLuna.getByRole('button', { name: 'Finish and Return to Queue', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'cases');
  await expect(page.locator('[data-cases-theme-v1="approved"]')).toBeVisible();
});
