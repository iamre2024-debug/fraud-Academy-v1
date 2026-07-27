import { test, expect } from '@playwright/test';
import { openWorkspacePages, selectToolGroup } from './workspace-page-helpers.mjs';

test('workspace uses separate pages and pinned evidence reopens its source record', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-visual-tray-v1', JSON.stringify({
      'FA-ATO-24018': ['TRN-8842-19', 'LOG-1005', 'ZZZ-NOT-A-SOURCE'],
    }));
    window.localStorage.removeItem('fraud-academy-note-drafts-v1');
  });
  await page.goto('/');

  const frame = page.locator('.visual-os-frame, .mission-workspace-v3');
  const briefing = page.locator('[data-workspace-page="briefing"]');
  const workflow = page.locator('.active-case-workflow, .mission-path-v3');
  const toolMenu = page.locator('[data-workspace-page="tool-menu"]');
  const toolPage = page.locator('[data-workspace-page="tool"]');
  const indicators = page.locator('[data-workspace-page="indicators"]');

  await expect(frame).toHaveAttribute('data-workspace-screen', 'briefing');
  await expect(briefing).toBeVisible();
  await expect(workflow).toBeHidden();
  await expect(toolMenu).toBeHidden();
  await expect(toolPage).toBeHidden();
  await expect(indicators).toBeHidden();
  await expect(page.locator('.luna-visual-panel')).toBeHidden();

  if (testInfo.project.name === 'mobile-chromium') {
    await expect(page.getByRole('navigation', { name: 'Case briefing files' }).getByRole('button')).toHaveCount(6);
    const briefingPager = page.getByRole('navigation', { name: 'Briefing page controls' });
    await expect(briefingPager).toContainText('01');
    await expect(briefingPager).toContainText('of 06');
    await briefingPager.getByRole('button', { name: /Next/ }).click();
    await expect(page.locator('[data-mission-briefing-page="intake"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Case intake', exact: true })).toBeVisible();
    await page.getByRole('navigation', { name: 'Case briefing files' })
      .getByRole('button', { name: 'Investigation launchpad' })
      .click();
  }

  await page.getByRole('button', { name: /Begin investigation/i }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'tool');
  await expect(page.locator('[data-customer-360-screen="approved-theme-v1"]')).toBeVisible();
  await expect(briefing).toBeHidden();

  await openWorkspacePages(page);
  await workflow.getByRole('button', { name: /Investigate/ }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'tool-menu');
  await expect(toolMenu).toBeVisible();
  await selectToolGroup(page, 'Login, Session, Device & IP');
  await expect(frame).toHaveAttribute('data-workspace-screen', 'tool');
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toHaveAttribute('data-tool-name', 'Login History');
  await expect(toolMenu).toBeHidden();

  const loginSearch = page.getByRole('textbox', { name: 'Search Login History records' });
  await loginSearch.fill('LOG-1005');
  await openWorkspacePages(page);
  await workflow.getByRole('button', { name: /Investigate/ }).click();
  await selectToolGroup(page, 'Identity & Customer');
  await expect(page.locator('[data-customer-360-screen="approved-theme-v1"]')).toBeVisible();
  const backButton = page.getByRole('button', { name: /Back to previous (?:workspace page|mission screen)/ });
  await backButton.click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'tool-menu');
  await backButton.click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'workflow');
  await backButton.click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'tool');
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toHaveAttribute('data-tool-name', 'Login History');
  await expect(loginSearch).toHaveValue('LOG-1005');

  await openWorkspacePages(page);
  await expect(workflow).toBeVisible();
  await workflow.getByRole('button', { name: /Indicators|Evidence/ }).click();
  await expect(frame).toHaveAttribute(
    'data-workspace-screen',
    testInfo.project.name === 'mobile-chromium' ? 'indicators' : 'evidence',
  );
  await expect(indicators).toBeVisible();
  if (testInfo.project.name === 'mobile-chromium') {
    await expect(page.getByRole('heading', { name: 'Case Indicators Review', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Open pinned evidence deck', exact: true }).click();
    await expect(frame).toHaveAttribute('data-workspace-screen', 'evidence');
  }
  await expect(page.locator('.tray-card')).toBeVisible();
  await expect(page.locator('.notebook-card')).toBeHidden();

  await page.getByRole('button', { name: 'Open pinned evidence LOG-1005' }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'tool');
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toHaveAttribute('data-tool-name', 'Login History');
  await expect(page.locator('[data-opened-pinned-evidence="true"]')).toContainText('LOG-1005');
  await expect(page.getByRole('textbox', { name: 'Search Login History records' })).toHaveValue('LOG-1005');
  await expect(page.locator('[data-login-history-record="LOG-1005"]')).toBeVisible();
  await expect(page.locator('.login-detail-panel').getByRole('heading', { name: /LOG-1005/ })).toBeVisible();
  await page.waitForTimeout(180);
  const pinnedEvidenceVisibility = await page.evaluate(() => {
    const context = document.querySelector('[data-opened-pinned-evidence="true"]')?.getBoundingClientRect();
    const heading = document.querySelector('[data-opened-pinned-evidence="true"] h2')?.getBoundingClientRect();
    if (!context || !heading) return false;
    const hit = document.elementFromPoint(Math.min(window.innerWidth - 1, heading.left + 8), Math.max(1, heading.top + 8));
    return Boolean(hit && document.querySelector('[data-opened-pinned-evidence="true"]')?.contains(hit));
  });
  expect(pinnedEvidenceVisibility).toBe(true);

  await page.getByRole('button', { name: /Back to (?:Pinned Evidence|pins)/i }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'evidence');
  await page.getByRole('button', { name: 'Remove LOG-1005 from pinned evidence' }).click();
  await expect(page.getByRole('button', { name: 'Open pinned evidence LOG-1005' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open pinned evidence TRN-8842-19' })).toBeVisible();

  await page.getByRole('button', { name: 'Open pinned evidence ZZZ-NOT-A-SOURCE' }).click();
  const unavailablePin = page.getByRole('alert').filter({ hasText: 'ZZZ-NOT-A-SOURCE' });
  await expect(unavailablePin).toBeVisible();
  await expect(unavailablePin).toContainText('Source record unavailable');
  await unavailablePin.getByRole('button', { name: 'Retry source lookup' }).click();
  await expect(unavailablePin).toBeVisible();
  await unavailablePin.getByRole('button', { name: 'Remove pin' }).click();
  await expect(page.getByRole('button', { name: 'Open pinned evidence ZZZ-NOT-A-SOURCE' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Notes', exact: true }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'notes');
  await expect(page.locator('.notebook-card')).toBeVisible();
  await expect(page.locator('.tray-card')).toBeHidden();

  const caseOneDraft = 'Compare LOG-1005 with the first-seen device before deciding.';
  const caseTwoDraft = 'Check the cancellation record against the recurring charge.';
  const noteComposer = page.locator('.notebook-card textarea');
  await noteComposer.fill(caseOneDraft);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('fraud-academy-note-drafts-v1') || '{}')['FA-ATO-24018'])).toBe(caseOneDraft);

  const caseSwitcher = testInfo.project.name === 'mobile-chromium'
    ? page.getByRole('combobox', { name: 'Choose active mission case' })
    : page.locator('.visual-case-strip .visual-case-switcher select');
  await caseSwitcher.selectOption('FA-CB-24007');
  let caseWorkflow = await openWorkspacePages(page);
  await caseWorkflow.getByRole('button', { name: /Indicators|Evidence/ }).click();
  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('button', { name: 'Open full investigation notebook', exact: true }).click();
  } else {
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
  }
  await expect(noteComposer).toHaveValue('');
  await noteComposer.fill(caseTwoDraft);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('fraud-academy-note-drafts-v1') || '{}')['FA-CB-24007'])).toBe(caseTwoDraft);

  await caseSwitcher.selectOption('FA-ATO-24018');
  caseWorkflow = await openWorkspacePages(page);
  await caseWorkflow.getByRole('button', { name: /Indicators|Evidence/ }).click();
  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('button', { name: 'Open full investigation notebook', exact: true }).click();
  } else {
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
  }
  await expect(noteComposer).toHaveValue(caseOneDraft);

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    frame: document.querySelector('.visual-os-frame, .mission-workspace-v3')?.scrollWidth ?? 0,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
  expect(widths.frame).toBeLessThanOrEqual(widths.viewport + 1);
});
