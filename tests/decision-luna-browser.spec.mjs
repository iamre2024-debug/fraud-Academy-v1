import { test, expect } from '@playwright/test';
import { openWorkflowStage, openWorkspacePages } from './workspace-page-helpers.mjs';

const caseId = 'FA-ATO-24018';
const learnerChoice = 'Insufficient Evidence';
const forbiddenLockedCopy = /(?:\/100|Strong package|Solid package|Developing package|Needs more support|Package strengths|Next coaching focus)/i;

async function seedIncompleteCase(page) {
  await page.addInitScript(({ activeCaseId, completedTools }) => {
    if (sessionStorage.getItem('fraud-academy-decision-luna-test-seeded') === 'yes') return;
    localStorage.setItem('fraud-academy-completed-tools-v1', JSON.stringify({ [activeCaseId]: completedTools }));
    localStorage.setItem('fraud-academy-visual-tray-v1', JSON.stringify({ [activeCaseId]: [] }));
    localStorage.setItem('fraud-academy-notes-v1', JSON.stringify({ [activeCaseId]: [] }));
    localStorage.setItem('fraud-academy-review-packages-v1', JSON.stringify({
      [activeCaseId]: [{ id: 'legacy-empty-choice-package', caseId: activeCaseId, choice: '' }],
    }));
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

async function openMobileWorkspaceMenu(page) {
  const menuButton = page.getByRole('button', { name: 'Open workspace menu', exact: true });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  return page.locator('.mission-workspace-overflow > section');
}

async function openMobileMissionPath(page) {
  const menu = await openMobileWorkspaceMenu(page);
  await menu.getByRole('button', { name: /Mission Path|Path/i }).click();
  const workflow = page.locator('.mission-path-v3');
  await expect(workflow).toBeVisible();
  await expect(page.locator('.mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'workflow');
  return workflow;
}

async function openMobileIndicators(page) {
  const workflow = await openMobileMissionPath(page);
  await workflow.getByRole('button', { name: /Indicators/ }).click();
  await expect(page.locator('.mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'indicators');
  const indicators = page.locator('.mission-indicators-review');
  await expect(indicators).toBeVisible();
  return indicators;
}

async function openMobileDecision(page) {
  const menu = await openMobileWorkspaceMenu(page);
  await menu.getByRole('button', { name: /Decide/ }).click();
  const decision = page.locator('[data-decision-screen="approved-theme-v1"]');
  await expect(page.locator('.mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'determination');
  await expect(decision).toBeVisible();
  return decision;
}

async function openMobileDebrief(page) {
  const workflow = await openMobileMissionPath(page);
  await workflow.getByRole('button', { name: /Debrief/ }).click();
  await expect(page.locator('.mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'debrief');
  await expect(page.locator('[data-luna-screen="approved-theme-v1"]')).toBeVisible();
}

test('workflow decision inputs save and unlock Luna on desktop and mobile', async ({ page }, testInfo) => {
  await seedIncompleteCase(page);
  await page.goto('/');

  const isMobile = testInfo.project.name === 'mobile-chromium';
  const detectedLayout = isMobile ? 'mobile' : 'desktop';
  await expect(page.locator('body')).toHaveAttribute('data-layout-detected', detectedLayout);
  await expect(page.locator('body')).toHaveAttribute('data-layout-mode', detectedLayout);
  const settingsButton = page.getByRole('button', { name: 'Open Settings', exact: true });
  const layoutControl = page.getByRole('group', { name: 'Layout mode', exact: true });
  if (!isMobile) {
    await settingsButton.click();
    await expect(layoutControl.getByRole('button')).toHaveCount(3);
    await expect(layoutControl.getByRole('button', { name: 'Auto', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await settingsButton.click();
  }

  if (isMobile) {
    const indicators = await openMobileIndicators(page);
    await expect(indicators.getByText('Case Indicators Review', { exact: true })).toBeVisible();
    await expect(indicators.getByText('No conclusion is selected for you.', { exact: true })).toBeVisible();
    await expect(indicators.getByRole('heading', { name: 'Account Takeover decision checklist', exact: true })).toBeVisible();
    await expect(indicators.getByText('Red flags', { exact: true })).toBeVisible();
    await expect(indicators.getByText('Green flags', { exact: true })).toBeVisible();
    await expect(indicators.locator('.decision-flag-columns')).toBeVisible();
    await expect(indicators.getByText('Matched to this case: phishing', { exact: true })).toBeVisible();
    await expect(indicators.getByRole('button', { name: 'Review pinned evidence', exact: true })).toBeVisible();

    const lockedWorkflow = await openMobileMissionPath(page);
    const lockedDebriefStage = lockedWorkflow.getByRole('button', { name: /Debrief/ });
    await expect(lockedDebriefStage).toBeDisabled();
    await expect(lockedDebriefStage).toHaveAttribute('aria-disabled', 'true');
  }

  const decision = isMobile ? await openMobileDecision(page) : await openDecision(page);
  await expect(decision).toHaveAttribute('data-case-id', caseId);
  await expect(decision.getByRole('heading', { name: 'Submit Decision', exact: true })).toBeVisible();
  if (isMobile) {
    await expect(decision.locator('.decision-mobile-evidence-summary')).toBeVisible();
    await expect(decision.getByText('Quick Pad identifiers remain separate and do not count as evidence.', { exact: true })).toBeVisible();
    await expect(decision.getByRole('group', { name: 'Operational decision', exact: true })).toBeVisible();
    await expect(decision.getByRole('group', { name: 'Final investigative finding', exact: true })).toBeVisible();
    await expect(decision.locator('.decision-flag-workspace')).toHaveCount(0);
    await expect(decision.locator('.decision-status-grid')).toBeHidden();
    await expect(decision.locator('.decision-v1-lock')).toBeHidden();
    await expect(decision.locator('.decision-direct-submit-note')).toBeHidden();
  } else {
    await expect(decision.getByText('Evidence First protection', { exact: true })).toBeVisible();
    await expect(decision.getByRole('heading', { name: 'Account Takeover decision checklist', exact: true })).toBeVisible();
    await expect(decision.getByText('Red flags', { exact: true })).toBeVisible();
    await expect(decision.getByText('Green flags', { exact: true })).toBeVisible();
    await expect(decision.locator('.decision-status-grid article')).toHaveCount(4);
    await expect(decision.getByText('0/9', { exact: true })).toBeVisible();
    await expect(decision.getByText('You can submit a decision without reviewing every tool. Open only the records needed to prove your selected flags.', { exact: true })).toBeVisible();
    await expect(decision.getByText('Matched to this case: phishing', { exact: true })).toBeVisible();
  }
  await expect(decision.getByRole('heading', { name: 'Decision readiness', exact: true })).toHaveCount(0);
  await expect(decision.getByText(/Decision needs attention/i)).toHaveCount(0);
  const savePackage = decision.getByRole('button', { name: 'Submit Decision', exact: true });
  await expect(savePackage).toBeVisible();
  await expect(savePackage).toBeDisabled();
  await expect(decision.getByText('Select one valid determination before submitting. Tools, flags, pins, notes, and rationale remain optional.', { exact: true })).toBeVisible();

  const decisionLayout = await page.evaluate(() => {
    const panel = document.querySelector('[data-decision-screen="approved-theme-v1"]');
    const workspace = document.querySelector('.decision-v1-workspace');
    const metrics = document.querySelector('.decision-status-grid');
    const flagColumns = document.querySelector('.decision-flag-columns');
    const mobileChoiceLabel = document.querySelector('[data-decision-part] .decision-choice-group label');
    const viewportWidth = window.innerWidth;
    const rect = panel?.getBoundingClientRect();
    const renderedGridColumnCount = (grid) => {
      if (!grid || grid.getClientRects().length === 0) return 0;
      return getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
    };
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelOverflow: rect ? Math.max(0, -rect.left, rect.right - viewportWidth) : Number.POSITIVE_INFINITY,
      workspaceColumns: renderedGridColumnCount(workspace),
      metricColumns: renderedGridColumnCount(metrics),
      flagColumns: renderedGridColumnCount(flagColumns),
      mobileChoiceLabelColumns: renderedGridColumnCount(mobileChoiceLabel),
      position: panel ? getComputedStyle(panel).position : '',
    };
  });

  const lockedLuna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="locked"]');
  await expect(lockedLuna).toBeAttached();
  await expect(lockedLuna).toBeHidden();
  if (!isMobile) {
    const workflow = await openWorkspacePages(page);
    const lockedDebriefStage = workflow.getByRole('button', { name: /Debrief/ });
    await expect(lockedDebriefStage).toBeDisabled();
    await expect(lockedDebriefStage).toHaveAttribute('aria-disabled', 'true');
  }
  await expect(lockedLuna).toBeHidden();
  expect(await lockedLuna.innerText()).not.toMatch(forbiddenLockedCopy);

  expect(decisionLayout.documentWidth).toBeLessThanOrEqual(decisionLayout.viewportWidth + 1);
  expect(decisionLayout.panelOverflow).toBeLessThanOrEqual(4);
  expect(decisionLayout.position).toBe('static');
  if (isMobile) {
    expect(decisionLayout.workspaceColumns).toBe(1);
    expect(decisionLayout.metricColumns).toBe(0);
    expect(decisionLayout.flagColumns).toBe(0);
    expect(decisionLayout.mobileChoiceLabelColumns).toBe(1);
  } else {
    expect(decisionLayout.workspaceColumns).toBe(1);
    expect(decisionLayout.metricColumns).toBe(4);
    expect(decisionLayout.flagColumns).toBe(2);
  }

  if (isMobile) await openMobileDecision(page);
  else await openDecision(page);

  const selectedChoice = isMobile ? 'Insufficient' : learnerChoice;
  await decision.getByRole('radio', { name: selectedChoice, exact: true }).check();
  if (isMobile) {
    await expect(savePackage).toBeDisabled();
    await decision.getByRole('radio', { name: 'Inconclusive', exact: true }).check();
  }
  await decision.getByRole('combobox', { name: 'Learner confidence' }).selectOption('High');
  await expect(savePackage).toBeEnabled();
  await savePackage.click();

  await expect(page.locator('.visual-os-frame, .mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'debrief');
  const savedPackage = await page.evaluate((activeCaseId) => {
    const packages = JSON.parse(localStorage.getItem('fraud-academy-review-packages-v1') || '{}');
    return packages[activeCaseId]?.[0] ?? null;
  }, caseId);
  expect(savedPackage).not.toBeNull();
  expect(savedPackage.completedTools).toEqual([]);
  expect(savedPackage.decisionIndicators).toEqual([]);
  expect(savedPackage.reason).toBe('');
  expect(savedPackage.blockers).toEqual([]);
  expect(savedPackage.coachingGaps.length).toBeGreaterThan(0);
  if (isMobile) {
    expect(savedPackage.operationalDecision).toBe('Insufficient');
    expect(savedPackage.finalFinding).toBe('Inconclusive');
    expect(savedPackage.decisionMode).toBe('separated');
  }

  const luna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="unlocked"]');
  await expect(luna).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'What you submitted', exact: true })).toBeVisible();
  await expect(luna.getByText(selectedChoice, { exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'How well your decision was supported', exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'What you handled well', exact: true })).toBeVisible();
  await expect(luna.getByRole('heading', { name: 'What to improve next time', exact: true })).toBeVisible();
  await expect(luna.locator('[aria-label="Decision-quality breakdown"]')).toBeVisible();
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
  expect(debriefLayout.columns).toBe(isMobile ? 1 : 2);

  if (!isMobile) {
    await settingsButton.click();
    await layoutControl.getByRole('button', { name: 'Mobile', exact: true }).click();
    await expect(page.locator('body')).toHaveAttribute('data-layout-preference', 'mobile');
    await expect(page.locator('body')).toHaveAttribute('data-layout-mode', 'mobile');
    await expect(page.locator('.mission-mobile-root')).toBeVisible();
    await expect(page.locator('.mission-mobile-root .luna-v1-debrief-grid')).toBeVisible();
    const mobilePreview = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      frameWidth: document.querySelector('.mission-mobile-root')?.getBoundingClientRect().width ?? Number.POSITIVE_INFINITY,
      stackedCards: (() => {
        const visibleGrid = [...document.querySelectorAll('.luna-v1-debrief-grid')]
          .find((grid) => {
            const rect = grid.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
        const cards = visibleGrid ? [...visibleGrid.querySelectorAll(':scope > .luna-v1-card')] : [];
        if (cards.length < 2) return false;
        const first = cards[0].getBoundingClientRect();
        const second = cards[1].getBoundingClientRect();
        return second.top >= first.bottom - 1;
      })(),
    }));
    expect(mobilePreview.frameWidth).toBeGreaterThanOrEqual((mobilePreview.viewportWidth * 0.94) - 1);
    expect(mobilePreview.frameWidth).toBeLessThanOrEqual((mobilePreview.viewportWidth * 0.94) + 1);
    expect(mobilePreview.stackedCards).toBe(true);

    await page.getByRole('button', { name: 'Open workspace menu', exact: true }).click();
    await page.getByRole('navigation', { name: 'Workspace shortcuts', exact: true })
      .getByRole('button', { name: /Display/ })
      .click();
    await page.getByRole('combobox', { name: 'Layout mode', exact: true }).selectOption('desktop');
    await expect(page.locator('body')).toHaveAttribute('data-layout-preference', 'desktop');
    await expect(page.locator('body')).toHaveAttribute('data-layout-mode', 'desktop');
    await expect(page.locator('.mission-mobile-root')).toHaveCount(0);
    await expect(page.locator('.visual-os-frame, .mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'debrief');
    await expect(luna).toBeVisible();
    const desktopCardsShareRow = await page.evaluate(() => {
      const visibleGrid = [...document.querySelectorAll('.luna-v1-debrief-grid')]
        .find((grid) => {
          const rect = grid.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
      const cards = visibleGrid ? [...visibleGrid.querySelectorAll(':scope > .luna-v1-card')] : [];
      if (cards.length < 2) return false;
      const first = cards[0].getBoundingClientRect();
      const second = cards[1].getBoundingClientRect();
      return Math.abs(second.top - first.top) <= 2 && second.left > first.left;
    });
    expect(desktopCardsShareRow).toBe(true);
    await page.getByRole('button', { name: 'Open Settings', exact: true }).click();
    await page.getByRole('group', { name: 'Layout mode', exact: true }).getByRole('button', { name: 'Auto', exact: true }).click();
    await page.getByRole('button', { name: 'Open Settings', exact: true }).click();
  }

  await luna.getByRole('button', { name: 'View Case Summary', exact: true }).click();
  await expect(page.locator('.visual-os-frame, .mission-workspace-v3'))
    .toHaveAttribute('data-workspace-screen', 'briefing');
  const summary = isMobile
    ? page.locator('.mission-briefing-v4')
    : page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(summary).toBeVisible();

  await page.reload();
  const persistedLuna = page.locator('[data-luna-screen="approved-theme-v1"][data-luna-state="unlocked"]');
  if (isMobile) await openMobileDebrief(page);
  else await openWorkflowStage(page, /Debrief/);
  await expect(persistedLuna).toBeVisible();
  await expect(persistedLuna).toContainText(selectedChoice);

  await persistedLuna.getByRole('button', { name: 'Finish and Return to Queue', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'cases');
  await expect(page.locator('[data-cases-theme-v1="approved"]')).toBeVisible();
});
