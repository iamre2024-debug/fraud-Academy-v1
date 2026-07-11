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
  'Case Report',
];
const learnerChoice = 'Request more information from customer';
const rationale = 'The reviewed records support another information request because the current package documents the timeline, linked activity, and remaining evidence gap.';
const forbiddenLockedCopy = /(?:\/100|Strong package|Solid package|Developing package|Needs more support|Package strengths|Next coaching focus)/i;

async function seedReadyCase(page) {
  await page.addInitScript(({ activeCaseId, completedTools }) => {
    localStorage.setItem('fraud-academy-completed-tools-v1', JSON.stringify({ [activeCaseId]: completedTools }));
    localStorage.setItem('fraud-academy-visual-tray-v1', JSON.stringify({ [activeCaseId]: ['TRAINING-ID-1001', 'EVT-1014'] }));
    localStorage.setItem('fraud-academy-notes-v1', JSON.stringify({
      [activeCaseId]: ['Jul 11 · Investigation note · Reviewed the access sequence and documented the remaining customer-information gap.'],
    }));
    localStorage.setItem('fraud-academy-case-report-packets-v1', JSON.stringify({ [activeCaseId]: [] }));
    localStorage.removeItem('fraud-academy-review-packages-v1');
    localStorage.removeItem('fraud-academy-decision-drafts-v1');
  }, { activeCaseId: caseId, completedTools: requiredTools });
}

async function openDecision(page) {
  await page.locator('.active-case-workflow').getByRole('button', { name: /Determination/ }).click();
  const decision = page.locator('[data-decision-screen="approved-theme-v1"]');
  await expect(decision).toBeVisible();
  return decision;
}

test('approved Decision and Luna preserve Evidence First, package submission, debrief routes, and responsive safety', async ({ page }, testInfo) => {
  await seedReadyCase(page);
  await page.goto('/');

  const decision = await openDecision(page);
  await expect(decision).toHaveAttribute('data-case-id', caseId);
  await expect(decision.getByRole('heading', { name: 'Submit Decision', exact: true })).toBeVisible();
  await expect(decision.getByText('Evidence First protection', { exact: true })).toBeVisible();
  await expect(decision.locator('.decision-status-grid article')).toHaveCount(4);
  await expect(decision.getByText('8/8', { exact: true })).toBeVisible();

  const lockedLuna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="locked"]');
  await expect(lockedLuna).toBeAttached();
  await expect(lockedLuna).toContainText('Evidence First lock is active.');
  await expect(lockedLuna.locator('.luna-v1-unlock-grid article')).toHaveCount(4);
  expect(await lockedLuna.innerText()).not.toMatch(forbiddenLockedCopy);

  const layout = await page.evaluate(() => {
    const panel = document.querySelector('[data-decision-screen="approved-theme-v1"]');
    const workspace = document.querySelector('.decision-v1-workspace');
    const metrics = document.querySelector('.decision-status-grid');
    const lockedGrid = document.querySelector('.luna-v1-unlock-grid');
    const viewportWidth = window.innerWidth;
    const rect = panel?.getBoundingClientRect();
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelFits: Boolean(rect && rect.left >= -1 && rect.right <= viewportWidth + 1),
      workspaceColumns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      metricColumns: metrics ? getComputedStyle(metrics).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      lockedColumns: lockedGrid ? getComputedStyle(lockedGrid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      position: panel ? getComputedStyle(panel).position : '',
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelFits).toBe(true);
  expect(layout.position).toBe('static');
  if (testInfo.project.name === 'mobile-chromium') {
    expect(layout.workspaceColumns).toBe(1);
    expect(layout.metricColumns).toBe(1);
    expect(layout.lockedColumns).toBe(1);
  } else {
    expect(layout.workspaceColumns).toBe(2);
    expect(layout.metricColumns).toBe(4);
    expect(layout.lockedColumns).toBe(4);
  }

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
  await expect(page.locator('[data-cases-screen="approved-theme-v1"]')).toBeVisible();
});
