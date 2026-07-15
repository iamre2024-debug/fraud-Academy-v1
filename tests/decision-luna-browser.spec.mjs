import { test, expect } from '@playwright/test';

const caseId = 'FA-ATO-24018';
const requiredTools = [
  'Case Summary',
  'Customer 360',
  'Login History',
  'Session History',
  'Device Intelligence',
  'IP Intelligence',
  'Transaction History',
  'Document Viewer',
  'Link Analysis',
];
const learnerChoice = 'Insufficient Evidence';
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
    localStorage.removeItem('fraud-academy-review-packages-v1');
    localStorage.removeItem('fraud-academy-decision-drafts-v1');
    localStorage.removeItem('fraud-academy-layout-mode-v1');
    sessionStorage.setItem('fraud-academy-decision-luna-test-seeded', 'yes');
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

  const detectedLayout = testInfo.project.name === 'mobile-chromium' ? 'mobile' : 'desktop';
  await expect(page.locator('body')).toHaveAttribute('data-layout-detected', detectedLayout);
  await expect(page.locator('body')).toHaveAttribute('data-layout-mode', detectedLayout);
  const settingsButton = page.getByRole('button', { name: 'Open Settings', exact: true });
  await settingsButton.click();
  const layoutControl = page.getByRole('group', { name: 'Layout mode', exact: true });
  await expect(layoutControl.getByRole('button')).toHaveCount(3);
  await expect(layoutControl.getByRole('button', { name: 'Auto', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await settingsButton.click();

  const decision = await openDecision(page);
  await expect(decision).toHaveAttribute('data-case-id', caseId);
  await expect(decision.getByRole('heading', { name: 'Submit Decision', exact: true })).toBeVisible();
  await expect(decision.getByText('Evidence First protection', { exact: true })).toBeVisible();
  await expect(decision.getByRole('heading', { name: 'Account Takeover decision checklist', exact: true })).toBeVisible();
  await expect(decision.getByText('Red flags', { exact: true })).toBeVisible();
  await expect(decision.getByText('Green flags', { exact: true })).toBeVisible();
  await expect(decision.locator('.decision-status-grid article')).toHaveCount(4);
  await expect(decision.getByText('9/9', { exact: true })).toBeVisible();

  const lockedLuna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="locked"]');
  await expect(lockedLuna).toBeAttached();
  await expect(lockedLuna).toContainText('Evidence First lock is active.');
  await expect(lockedLuna.locator('.luna-v1-unlock-grid article')).toHaveCount(4);
  expect(await lockedLuna.innerText()).not.toMatch(forbiddenLockedCopy);

  const layout = await page.evaluate(() => {
    const panel = document.querySelector('[data-decision-screen="approved-theme-v1"]');
    const workspace = document.querySelector('.decision-v1-workspace');
    const metrics = document.querySelector('.decision-status-grid');
    const flagColumns = document.querySelector('.decision-flag-columns');
    const lockedGrid = document.querySelector('.luna-v1-unlock-grid');
    const viewportWidth = window.innerWidth;
    const rect = panel?.getBoundingClientRect();
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelOverflow: rect ? Math.max(0, -rect.left, rect.right - viewportWidth) : Number.POSITIVE_INFINITY,
      workspaceColumns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      metricColumns: metrics ? getComputedStyle(metrics).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      flagColumns: flagColumns ? getComputedStyle(flagColumns).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      lockedColumns: lockedGrid ? getComputedStyle(lockedGrid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      position: panel ? getComputedStyle(panel).position : '',
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelOverflow).toBeLessThanOrEqual(4);
  expect(layout.position).toBe('static');
  if (testInfo.project.name === 'mobile-chromium') {
    expect(layout.workspaceColumns).toBe(1);
    expect(layout.metricColumns).toBe(1);
    expect(layout.flagColumns).toBe(1);
    expect(layout.lockedColumns).toBe(1);
  } else {
    expect(layout.workspaceColumns).toBe(2);
    expect(layout.metricColumns).toBe(4);
    expect(layout.flagColumns).toBe(2);
    expect(layout.lockedColumns).toBe(4);
  }

  const flagQuestion = 'Did a first-seen or unrecognized device access the account during the reported fraud period?';
  await decision.getByRole('checkbox', { name: `Green flag: ${flagQuestion}` }).check();
  await decision.getByRole('combobox', { name: `Proof for ${flagQuestion}` }).fill('LOG-1008 and DEV-MAYA-IP16-001');
  await decision.getByRole('textbox', { name: `Explanation for ${flagQuestion}` }).fill('The cited login and device record document the device reviewed during the reported period.');
  await decision.getByRole('radio', { name: learnerChoice, exact: true }).check();
  await decision.getByRole('combobox', { name: 'Learner confidence' }).selectOption('High');
  await decision.getByRole('textbox', { name: 'Learner rationale' }).fill(rationale);
  const savePackage = decision.getByRole('button', { name: 'Submit Decision', exact: true });
  await expect(savePackage).toBeVisible();
  await savePackage.click();

  await expect(decision.getByRole('heading', { name: `Decision submitted for ${caseId}` })).toBeVisible();
  await expect(decision.getByText('Luna debrief unlocked', { exact: true })).toBeVisible();

  const luna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="unlocked"]');
  await expect(luna).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'Your submitted determination', exact: true })).toBeVisible();
  await expect(luna.getByText(learnerChoice, { exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'How Luna read the package', exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'What your package did well', exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'Next coaching focus', exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'Decision-quality breakdown', exact: true })).toBeVisible();
  const notesQualityLabel = luna.getByText('Quality of notes', { exact: true });
  await notesQualityLabel.scrollIntoViewIfNeeded();
  await expect(notesQualityLabel).toBeVisible();

  const debriefStepNumbers = (await luna.locator('.luna-v1-step-index').allTextContents()).map((value) => value.trim());
  expect(new Set(debriefStepNumbers).size).toBe(debriefStepNumbers.length);
  expect(debriefStepNumbers).toEqual(['01', '02', '03', '04', '05']);

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

  if (testInfo.project.name !== 'mobile-chromium') {
    await settingsButton.click();
    await layoutControl.getByRole('button', { name: 'Mobile', exact: true }).click();
    await expect(page.locator('body')).toHaveAttribute('data-layout-preference', 'mobile');
    await expect(page.locator('body')).toHaveAttribute('data-layout-mode', 'mobile');
    const mobilePreview = await page.evaluate(() => ({
      frameWidth: document.querySelector('.visual-os-frame')?.getBoundingClientRect().width ?? Number.POSITIVE_INFINITY,
      columns: getComputedStyle(document.querySelector('.luna-v1-debrief-grid')).gridTemplateColumns.split(' ').filter(Boolean).length,
    }));
    expect(mobilePreview.frameWidth).toBeLessThanOrEqual(460);
    expect(mobilePreview.columns).toBe(1);

    await layoutControl.getByRole('button', { name: 'Desktop', exact: true }).click();
    await expect(page.locator('body')).toHaveAttribute('data-layout-preference', 'desktop');
    await expect(page.locator('body')).toHaveAttribute('data-layout-mode', 'desktop');
    const desktopPreviewColumns = await page.evaluate(() => getComputedStyle(document.querySelector('.luna-v1-debrief-grid')).gridTemplateColumns.split(' ').filter(Boolean).length);
    expect(desktopPreviewColumns).toBe(2);
    await layoutControl.getByRole('button', { name: 'Auto', exact: true }).click();
    await settingsButton.click();
  }

  await luna.getByRole('button', { name: 'View Case Summary', exact: true }).click();
  await expect(page.locator('[data-case-briefing-screen="approved-theme-v1"]')).toBeVisible();

  await page.reload();
  const persistedLuna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="unlocked"]');
  await expect(persistedLuna).toBeVisible();
  await expect(persistedLuna).toContainText(learnerChoice);

  await persistedLuna.getByRole('button', { name: 'Finish and Return to Queue', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'cases');
  await expect(page.locator('[data-cases-theme-v1="approved"]')).toBeVisible();
});
