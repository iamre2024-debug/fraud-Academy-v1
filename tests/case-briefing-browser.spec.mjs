import { test, expect } from '@playwright/test';
import {
  openMobileWorkspaceMenu,
  openMobileWorkspaceShortcut,
  openWorkflowStage,
  selectToolGroup,
} from './workspace-page-helpers.mjs';

const secondCase = { id: 'FA-CB-24007', person: 'Jordan Ellis' };
const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate|suggested first tool|investigator question)\b/i;
const forbiddenDecisionCopy = /\b(?:fraud score|correct answer|AI recommendations?|fraudulent|legitimate|suggested first tool|investigator question)\b/i;

async function verifyMobileBriefing(page, testInfo) {
  const briefing = page.locator('.mission-briefing-v4');
  const workspace = page.locator('.mission-workspace-v3');
  const dock = page.getByRole('navigation', { name: 'Mission navigation' });

  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
  await expect(workspace).toHaveAttribute('data-workspace-screen', 'briefing');
  await expect(page.locator('.mission-workspace-bar-briefing')
    .getByRole('heading', { name: 'Case Briefing', exact: true })).toBeVisible();
  await expect(briefing).toBeVisible();
  await expect(briefing.getByRole('heading', { name: 'FA-ATO-24018', exact: true })).toBeVisible();
  await expect(briefing.getByRole('heading', { name: 'Allegation Summary', exact: true })).toBeVisible();
  await expect(briefing.getByRole('heading', { name: 'Quick Facts', exact: true })).toBeVisible();
  await expect(briefing.getByRole('heading', { name: 'Evidence Checklist', exact: true })).toBeVisible();
  await expect(briefing.getByRole('button', { name: 'Open workspace ›', exact: true })).toBeVisible();
  await expect(briefing.getByRole('navigation', { name: 'Case briefing actions' })).toHaveCount(0);
  await expect(briefing.getByRole('navigation', { name: 'Case Briefing pages' })).toHaveCount(0);
  await expect(dock.getByRole('button', { name: 'Cases', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(dock.getByRole('button', { name: 'Workspace', exact: true })).not.toHaveAttribute('aria-current', 'page');
  expect(await briefing.innerText()).not.toMatch(forbiddenPreSubmissionCopy);

  const evidenceBeforePin = await page.evaluate((caseId) => JSON.stringify(
    JSON.parse(localStorage.getItem('fraud-academy-visual-tray-v1') || '{}')[caseId] ?? [],
  ), 'FA-ATO-24018');
  await briefing.getByRole('button', { name: 'Pin Case ID to Quick Pad', exact: true }).click();
  await expect.poll(() => page.evaluate((caseId) => {
    const pad = JSON.parse(localStorage.getItem('fraud-academy-quick-pad-v1') || '{}');
    return (pad[caseId]?.items ?? []).filter((item) => (
      item.label === 'Case ID'
      && item.value === caseId
      && item.sourceTool === 'Case Briefing'
    )).length;
  }, 'FA-ATO-24018')).toBe(1);
  const evidenceAfterPin = await page.evaluate((caseId) => JSON.stringify(
    JSON.parse(localStorage.getItem('fraud-academy-visual-tray-v1') || '{}')[caseId] ?? [],
  ), 'FA-ATO-24018');
  expect(evidenceAfterPin).toBe(evidenceBeforePin);

  for (const viewportSize of [
    { width: 320, height: 568 },
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 430, height: 932 },
    { width: 412, height: 600 },
  ]) {
    await page.setViewportSize(viewportSize);
    const mobileLayout = await page.evaluate(() => {
      const viewport = document.querySelector(
        '.mission-mobile-root[data-mobile-mission-tab="workspace"] .mission-mobile-viewport',
      );
      const briefingElement = document.querySelector('.mission-briefing-v4');
      const columns = document.querySelector('.mission-briefing-columns');
      const cta = document.querySelector('.mission-briefing-open-workspace');
      const back = document.querySelector('.mission-workspace-back');
      const overflow = document.querySelector('.mission-workspace-overflow > summary');
      const rect = briefingElement?.getBoundingClientRect();
      const ctaRect = cta?.getBoundingClientRect();
      const backRect = back?.getBoundingClientRect();
      const overflowRect = overflow?.getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        viewportScrollWidth: viewport?.scrollWidth ?? 0,
        viewportClientWidth: viewport?.clientWidth ?? 0,
        left: rect?.left ?? -1,
        right: rect?.right ?? Number.POSITIVE_INFINITY,
        ctaLeft: ctaRect?.left ?? -1,
        ctaRight: ctaRect?.right ?? Number.POSITIVE_INFINITY,
        ctaHeight: ctaRect?.height ?? 0,
        backSize: Math.min(backRect?.width ?? 0, backRect?.height ?? 0),
        overflowSize: Math.min(overflowRect?.width ?? 0, overflowRect?.height ?? 0),
        columnCount: columns
          ? getComputedStyle(columns).gridTemplateColumns.split(' ').filter(Boolean).length
          : 0,
      };
    });
    expect(mobileLayout.documentWidth).toBeLessThanOrEqual(mobileLayout.viewportWidth + 1);
    expect(mobileLayout.viewportScrollWidth).toBeLessThanOrEqual(mobileLayout.viewportClientWidth + 1);
    expect(mobileLayout.left).toBeGreaterThanOrEqual(0);
    expect(mobileLayout.right).toBeLessThanOrEqual(mobileLayout.viewportWidth + 1);
    expect(mobileLayout.ctaLeft).toBeGreaterThanOrEqual(0);
    expect(mobileLayout.ctaRight).toBeLessThanOrEqual(mobileLayout.viewportWidth + 1);
    expect(mobileLayout.ctaHeight).toBeGreaterThanOrEqual(44);
    expect(mobileLayout.backSize).toBeGreaterThanOrEqual(44);
    expect(mobileLayout.overflowSize).toBeGreaterThanOrEqual(44);
    expect(mobileLayout.columnCount).toBe(viewportSize.width <= 340 ? 1 : 2);
    if (process.env.CAPTURE_MISSION_VISUALS === '1' && [320, 390, 430].includes(viewportSize.width)) {
      await page.screenshot({
        path: testInfo.outputPath(`case-briefing-${viewportSize.width}.png`),
        animations: 'disabled',
        fullPage: false,
      });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });

  const menu = await openMobileWorkspaceMenu(page);
  await menu.getByRole('combobox', { name: 'Choose active mission case' }).selectOption(secondCase.id);
  await expect(briefing.getByText(secondCase.person, { exact: true }).first()).toBeVisible();
  await expect(briefing.getByRole('heading', { name: secondCase.id, exact: true })).toBeVisible();
  await expect(briefing).not.toContainText('FA-ATO-24018');
  await expect(briefing.getByRole('heading', { name: 'Evidence Checklist', exact: true })).toBeVisible();

  await openMobileWorkspaceShortcut(page, 'All tools');
  await expect(workspace).toHaveAttribute('data-workspace-screen', 'tool-menu');
  await expect(page.locator('[data-investigation-tool-groups="approved-theme-v1"]')).toBeVisible();

  await openMobileWorkspaceShortcut(page, 'Briefing');
  await expect(workspace).toHaveAttribute('data-workspace-screen', 'briefing');

  await openMobileWorkspaceShortcut(page, 'Timeline');
  await expect(workspace).toHaveAttribute('data-workspace-screen', 'timeline');
  await expect(workspace).toHaveAttribute('data-active-tool', 'Timeline');
  await expect(page.locator('[data-timeline-screen="approved-theme-v1"]')).toBeVisible();

  await openMobileWorkspaceShortcut(page, 'Briefing');
  await openMobileWorkspaceShortcut(page, 'Decide');
  await expect(workspace).toHaveAttribute('data-workspace-screen', 'determination');
  await expect(page.locator('.submit-decision-panel')).toBeVisible();
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenDecisionCopy);
}

test('approved Case Briefing is Evidence First, functional, and responsive', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile-chromium') {
    await page.addInitScript(() => {
      window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
    });
  }
  await page.goto('/');

  if (testInfo.project.name === 'mobile-chromium') {
    await verifyMobileBriefing(page, testInfo);
    return;
  }

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
  await expect(briefing).toBeVisible();
  await expect(briefing.getByRole('heading', { name: 'Case Briefing', exact: true })).toBeVisible();
  await expect(briefing.getByRole('heading', { name: 'Briefing summary', exact: true, includeHidden: true })).toHaveCount(1);
  await expect(briefing.getByRole('heading', { name: 'Case parties', exact: true, includeHidden: true })).toHaveCount(1);
  await expect(briefing.getByRole('heading', { name: 'Account and transaction details', exact: true, includeHidden: true })).toHaveCount(1);
  await expect(briefing.getByRole('heading', { name: 'Claim Intake Form', exact: true, includeHidden: true })).toHaveCount(1);
  await expect(briefing).toContainText('Two failed password attempts were recorded at 7:58 AM and 8:00 AM.');
  await expect(briefing).toContainText('personal iPhone and Dallas, TX');
  await expect(briefing).not.toContainText('Review the related fictional case records');
  await expect(briefing.getByRole('heading', { name: 'Records in this packet', exact: true })).toHaveCount(0);
  await expect(briefing.getByRole('heading', { name: 'Luna Briefing Assistant', exact: true })).toHaveCount(0);
  await expect(briefing.getByRole('heading', { name: 'Recent documents', exact: true, includeHidden: true })).toHaveCount(0);
  await expect(briefing).not.toContainText('Case packet');
  await expect(briefing.getByRole('heading', { name: 'Key focus areas', exact: true })).toHaveCount(0);
  await expect(briefing.getByRole('heading', { name: 'Recent actions', exact: true })).toHaveCount(0);
  await expect(briefing).toContainText('Assigned investigator');
  await expect(briefing).toContainText('Learner Agent');
  await expect(briefing).toContainText('Due date');
  await expect(briefing.locator('[data-case-briefing-parties="true"] .case-briefing-party-list article')).toHaveCount(2);
  await expect(briefing.locator('[data-case-briefing-details="true"] .case-briefing-detail-grid > div')).toHaveCount(8);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);

  const utilities = briefing.getByRole('navigation', { name: 'Case briefing utilities' });
  const quickRoutes = briefing.getByRole('navigation', { name: 'Case briefing quick routes' });
  await expect(utilities.locator('button')).toHaveCount(6);
  await expect(quickRoutes.locator('button')).toHaveCount(4);

  if (testInfo.project.name === 'mobile-chromium') {
    const pager = briefing.getByRole('navigation', { name: 'Case Briefing pages' });
    for (const heading of ['Briefing summary', 'Claim Intake Form', 'Key Case Facts', 'Case parties', 'Account and transaction details']) {
      await pager.getByRole('button', { name: 'Next' }).click();
      await expect(briefing.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    for (let pageNumber = 6; pageNumber > 1; pageNumber -= 1) await pager.getByRole('button', { name: 'Previous' }).click();
  }

  const layout = await page.evaluate(() => {
    const briefingElement = document.querySelector('[data-case-briefing-screen="approved-theme-v1"]');
    const overview = document.querySelector('.case-briefing-overview-card');
    const summary = document.querySelector('.case-briefing-summary-card');
    const parties = document.querySelector('.case-briefing-parties-card');
    const details = document.querySelector('.case-briefing-detail-card');
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
      partiesFit: fits(parties),
      detailsFit: fits(details),
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
  expect(layout.partiesFit).toBe(true);
  expect(layout.detailsFit).toBe(true);
  expect(layout.utilitiesFit).toBe(true);
  expect(layout.quickRoutesFit).toBe(true);

  if (testInfo.project.name === 'mobile-chromium') {
    expect(Math.abs(layout.overviewTop - layout.summaryTop)).toBeGreaterThan(20);
    expect(layout.utilityColumns).toBe(1);
    expect(layout.quickRouteColumns).toBe(1);
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
  await expect(briefing.getByRole('heading', { name: 'Transaction details', exact: true, includeHidden: true })).toHaveCount(1);
  await expect(briefing).toContainText('StreamBox Premium');
  await expect(briefing.getByRole('heading', { name: 'Reason code and review details', exact: true, includeHidden: true })).toHaveCount(1);
  await expect(briefing).toContainText('Training canceled-service / recurring billing review');
  await expect(briefing).toContainText('cancellation confirmation remains the required open evidence');

  await utilities.getByRole('button', { name: /Begin Investigation/ }).click();
  await expect(page.locator('[data-workflow-stage-button="investigate"]')).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('.activity-panel')).toContainText('Customer 360');

  await openWorkflowStage(page, /Case Briefing/);
  await quickRoutes.getByRole('button', { name: 'Transaction History', exact: true }).click();
  await expect(page.locator('.activity-panel')).toContainText('Transaction History');
  await openWorkflowStage(page, /Case Briefing/);
  await quickRoutes.getByRole('button', { name: 'Merchant Intelligence', exact: true }).click();
  await expect(page.locator('.activity-panel')).toContainText('Merchant Intelligence');
  await openWorkflowStage(page, /Case Briefing/);
  await quickRoutes.getByRole('button', { name: 'Document Request', exact: true }).click();
  await expect(page.locator('.activity-panel')).toContainText('Document Request');

  await openWorkflowStage(page, /Case Briefing/);
  await quickRoutes.getByRole('button', { name: 'Submit Decision', exact: true }).click();
  await expect(page.locator('[data-workflow-stage-button="determination"]')).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('.submit-decision-panel')).toBeVisible();

  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', secondCase.id);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenDecisionCopy);
});
