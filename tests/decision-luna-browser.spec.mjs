import { test, expect } from '@playwright/test';
import { openWorkflowStage } from './workspace-page-helpers.mjs';

const caseId = 'FA-ATO-24018';
const learnerChoice = 'Insufficient Evidence';
const forbiddenLockedCopy = /(?:\/100|Strong package|Solid package|Developing package|Needs more support|Package strengths|Next coaching focus)/i;

async function seedIncompleteCase(page) {
  await page.addInitScript(({ activeCaseId, completedTools }) => {
    if (sessionStorage.getItem('fraud-academy-decision-luna-test-seeded') === 'yes') return;
    localStorage.setItem('fraud-academy-completed-tools-v1', JSON.stringify({ [activeCaseId]: completedTools }));
    localStorage.setItem('fraud-academy-visual-tray-v1', JSON.stringify({ [activeCaseId]: [] }));
    localStorage.setItem('fraud-academy-notes-v1', JSON.stringify({ [activeCaseId]: [] }));
    localStorage.removeItem('fraud-academy-review-packages-v1');
    localStorage.removeItem('fraud-academy-decision-drafts-v1');
    localStorage.removeItem('fraud-academy-layout-mode-v1');
    sessionStorage.setItem('fraud-academy-decision-luna-test-seeded', 'yes');
  }, { activeCaseId: caseId, completedTools: [] });
}

async function openDecision(page) {
  await openWorkflowStage(page, /Determination/);
  const decision = page.locator('[data-decision-screen="approved-theme-v1"]');
  await expect(decision).toBeVisible();
  return decision;
}

test('an incomplete decision saves and unlocks Luna on desktop and mobile', async ({ page }, testInfo) => {
  await seedIncompleteCase(page);
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
  await expect(decision.getByText('0/9', { exact: true })).toBeVisible();
  await expect(decision.getByText('You can submit a decision without reviewing every tool. Open only the records needed to prove your selected flags.', { exact: true })).toBeVisible();
  await expect(decision.getByText('Matched to this case: phishing', { exact: true })).toBeVisible();
  await expect(decision.getByRole('heading', { name: 'Decision readiness', exact: true })).toHaveCount(0);
  await expect(decision.getByText(/Decision needs attention/i)).toHaveCount(0);

  const decisionLayout = await page.evaluate(() => {
    const panel = document.querySelector('[data-decision-screen="approved-theme-v1"]');
    const workspace = document.querySelector('.decision-v1-workspace');
    const metrics = document.querySelector('.decision-status-grid');
    const flagColumns = document.querySelector('.decision-flag-columns');
    const viewportWidth = window.innerWidth;
    const rect = panel?.getBoundingClientRect();
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelOverflow: rect ? Math.max(0, -rect.left, rect.right - viewportWidth) : Number.POSITIVE_INFINITY,
      workspaceColumns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      metricColumns: metrics ? getComputedStyle(metrics).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      flagColumns: flagColumns ? getComputedStyle(flagColumns).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      position: panel ? getComputedStyle(panel).position : '',
    };
  });

  const lockedLuna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="locked"]');
  await expect(lockedLuna).toBeAttached();
  await expect(lockedLuna).toBeHidden();
  await openWorkflowStage(page, /Debrief/);
  await expect(lockedLuna).toBeVisible();
  await expect(lockedLuna).toContainText('Evidence First lock is active.');
  await expect(lockedLuna.locator('.luna-v1-unlock-grid article')).toHaveCount(4);
  expect(await lockedLuna.innerText()).not.toMatch(forbiddenLockedCopy);

  const lockedLayout = await page.evaluate(() => {
    const lockedGrid = document.querySelector('.luna-v1-unlock-grid');
    return {
      lockedColumns: lockedGrid ? getComputedStyle(lockedGrid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });

  expect(decisionLayout.documentWidth).toBeLessThanOrEqual(decisionLayout.viewportWidth + 1);
  expect(decisionLayout.panelOverflow).toBeLessThanOrEqual(4);
  expect(decisionLayout.position).toBe('static');
  if (testInfo.project.name === 'mobile-chromium') {
    expect(decisionLayout.workspaceColumns).toBe(1);
    expect(decisionLayout.metricColumns).toBe(1);
    expect(decisionLayout.flagColumns).toBe(1);
    expect(lockedLayout.lockedColumns).toBe(1);
  } else {
    expect(decisionLayout.workspaceColumns).toBe(1);
    expect(decisionLayout.metricColumns).toBe(4);
    expect(decisionLayout.flagColumns).toBe(2);
    expect(lockedLayout.lockedColumns).toBe(4);
  }

  await openDecision(page);

  await decision.getByRole('radio', { name: learnerChoice, exact: true }).check();
  await decision.getByRole('combobox', { name: 'Learner confidence' }).selectOption('High');
  const savePackage = decision.getByRole('button', { name: 'Submit Decision', exact: true });
  await expect(savePackage).toBeVisible();
  await savePackage.click();

  await expect(page.locator('.visual-os-frame')).toHaveAttribute('data-workspace-screen', 'debrief');
  const savedPackage = await page.evaluate((activeCaseId) => {
    const packages = JSON.parse(localStorage.getItem('fraud-academy-review-packages-v1') || '{}');
    return packages[activeCaseId]?.[0] ?? null;
  }, caseId);
  expect(savedPackage).not.toBeNull();
  expect(savedPackage.completedTools).toEqual([]);
  expect(savedPackage.decisionIndicators).toEqual([]);
  expect(savedPackage.reason).toBe('');
  expect(savedPackage.blockers.length).toBeGreaterThan(0);

  const luna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="unlocked"]');
  await expect(luna).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'What you submitted', exact: true })).toBeVisible();
  await expect(luna.getByText(learnerChoice, { exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'How well your decision was supported', exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'What you handled well', exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'What to improve next time', exact: true })).toBeVisible();
  await expect(luna.getByRole('region', { name: 'Decision-quality breakdown', exact: true })).toBeVisible();
  await expect(luna.getByText('Investigation package quality', { exact: true })).toBeVisible();

  const debriefStepNumbers = (await luna.locator('.luna-v1-step-index').allTextContents()).map((value) => value.trim());
  expect(new Set(debriefStepNumbers).size).toBe(debriefStepNumbers.length);
  expect(debriefStepNumbers).toEqual(['01', '02', '03', '04', '05', '06']);

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
    await expect(page.locator('.mission-mobile-root')).toBeVisible();
    const mobilePreview = await page.evaluate(() => ({
      frameWidth: document.querySelector('.mission-mobile-root')?.getBoundingClientRect().width ?? Number.POSITIVE_INFINITY,
      columns: getComputedStyle(document.querySelector('.luna-v1-debrief-grid')).gridTemplateColumns.split(' ').filter(Boolean).length,
    }));
    expect(mobilePreview.frameWidth).toBeLessThanOrEqual(460);
    expect(mobilePreview.columns).toBe(1);

    await page.getByRole('button', { name: 'Open Settings', exact: true }).click();
    await page.getByRole('combobox', { name: 'Layout mode', exact: true }).selectOption('desktop');
    await expect(page.locator('body')).toHaveAttribute('data-layout-preference', 'desktop');
    await expect(page.locator('body')).toHaveAttribute('data-layout-mode', 'desktop');
    const desktopPreviewColumns = await page.evaluate(() => getComputedStyle(document.querySelector('.luna-v1-debrief-grid')).gridTemplateColumns.split(' ').filter(Boolean).length);
    expect(desktopPreviewColumns).toBe(2);
    await page.getByRole('button', { name: 'Open Settings', exact: true }).click();
    await page.getByRole('group', { name: 'Layout mode', exact: true }).getByRole('button', { name: 'Auto', exact: true }).click();
    await page.getByRole('button', { name: 'Open Settings', exact: true }).click();
  }

  await luna.getByRole('button', { name: 'View Case Summary', exact: true }).click();
  await expect(page.locator('[data-case-briefing-screen="approved-theme-v1"]')).toBeVisible();

  await page.reload();
  const persistedLuna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="unlocked"]');
  await openWorkflowStage(page, /Debrief/);
  await expect(persistedLuna).toBeVisible();
  await expect(persistedLuna).toContainText(learnerChoice);

  await persistedLuna.getByRole('button', { name: 'Finish and Return to Queue', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'cases');
  await expect(page.locator('[data-cases-theme-v1="approved"]')).toBeVisible();
});
