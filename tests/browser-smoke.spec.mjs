import { test, expect } from '@playwright/test';
import { openWorkflowStage, selectToolGroup } from './workspace-page-helpers.mjs';

const builtInCases = [
  { id: 'FA-ATO-24018', person: 'Maya Sterling', accountId: 'ACCT-24018-4410' },
  { id: 'FA-CB-24007', person: 'Jordan Ellis', accountId: 'ACCT-24007-8841' },
  { id: 'FA-CR-24003', person: 'Avery Brooks', accountId: 'ACCT-24003-3011' },
];

const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|open first tool|suggested first tool|investigator question)\b/i;

async function openCaseQueue(page) {
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /Cases/ }).click();
  await expect(page.locator('[data-cases-theme-v1="approved"]')).toBeVisible();
}

async function assertEvidenceFirstLock(page, expectedCaseId) {
  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', expectedCaseId);
  await expect(page.getByText('Evidence First lock is active.')).toBeAttached();
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);
}

async function openCoreTool(page, category, tool) {
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));

  if (tool === 'Timeline') {
    await openWorkflowStage(page, /Timeline/);
    const timeline = page.locator('[data-timeline-screen="approved-theme-v1"]');
    await expect(timeline).toBeVisible();
    await expect(timeline.getByRole('heading', { name: 'Case Timeline', exact: true })).toBeVisible();
    await expect(timeline.locator('[data-timeline-event]').first()).toBeVisible();
    await expect(timeline.locator('.timeline-detail')).toBeAttached();
    return;
  }

  await selectToolGroup(page, new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const selector = panel.getByRole('combobox', { name: 'Choose investigation tool' });
  await expect(panel).toBeVisible();
  if (await selector.inputValue() !== tool) await selector.selectOption({ label: tool });
  await expect(selector).toHaveValue(tool);
  await expect(panel).toHaveAttribute('data-tool-name', tool);
  await expect(panel.getByRole('heading', { name: tool, exact: true })).toBeVisible();

  if (tool === 'KYB Review') {
    await panel.getByRole('button', { name: 'Use legal name', exact: true }).click();
    await panel.getByRole('button', { name: 'Search business', exact: true }).click();
    await expect(panel.locator('.kyb-profile-header')).toBeVisible();
  }

  if (tool === 'Document Viewer') {
    const activeCaseId = await page.locator('.visual-case-switcher select').inputValue();
    const activeAccountId = builtInCases.find((item) => item.id === activeCaseId)?.accountId;
    await expect(panel.getByRole('heading', { name: 'Customer documents are locked', exact: true })).toBeVisible();
    await panel.getByRole('textbox', { name: 'Search by Account ID' }).fill(activeAccountId);
    await panel.getByRole('button', { name: 'Search account', exact: true }).click();
  }

  const specializedSelectors = {
    'Payment Verification': {
      record: '[data-payment-verification-record]',
      detail: '.payment-detail-panel',
    },
    'Document Viewer': {
      record: '[data-document-record]',
      detail: '.document-preview-workspace',
    },
    'KYB Review': {
      record: '[data-kyb-review-record]',
      detail: '.kyb-record-detail',
    },
  };
  const selectors = specializedSelectors[tool] ?? {
    record: '[data-investigation-record]',
    detail: '.investigation-tool-detail',
  };
  await expect(panel.locator(selectors.record).first()).toBeVisible();
  await expect(panel.locator(selectors.detail)).toBeAttached();
}

test('approved Dashboard resumes the active case without answer leaks', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /Dashboard/ }).click();

  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'dashboard');
  await expect(page.locator('[data-react-navigation-panel="dashboard"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Investigator dashboard' })).toBeVisible();
  await expect(page.locator('.dashboard-active-case')).toContainText(builtInCases[0].id);
  await expect(page.locator('.dashboard-quick-grid').getByRole('button', { name: /Case Queue/ })).toBeVisible();
  await expect(page.locator('.dashboard-quick-grid').getByRole('button', { name: /Investigation Workspace/ })).toBeVisible();
  await expect(page.locator('.dashboard-quick-grid').getByRole('button', { name: /Timeline/ })).toBeVisible();
  await expect(page.locator('.dashboard-quick-grid').getByRole('button', { name: /Progress/ })).toBeVisible();

  const dashboardLayout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    frameWidth: document.querySelector('.visual-os-frame')?.getBoundingClientRect().width ?? 0,
  }));

  expect(dashboardLayout.documentWidth).toBeLessThanOrEqual(dashboardLayout.viewportWidth + 1);
  expect(dashboardLayout.frameWidth).toBeLessThanOrEqual(dashboardLayout.viewportWidth + 1);
  await assertEvidenceFirstLock(page, builtInCases[0].id);

  await page.locator('.dashboard-primary-action').click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
  await expect(page.locator('.visual-case-switcher select')).toHaveValue(builtInCases[0].id);
  await assertEvidenceFirstLock(page, builtInCases[0].id);
});

test('approved Cases queue supports neutral search, filters, preview, and responsive layout', async ({ page }, testInfo) => {
  await page.goto('/');
  await openCaseQueue(page);

  const queue = page.locator('.cases-theme-v1-panel');
  const cards = queue.locator('.nav-case-card');
  const isMobile = testInfo.project.name === 'mobile-chromium';
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'cases');
  await expect(queue.getByRole('heading', { name: 'Case Queue' })).toBeVisible();
  if (isMobile) await queue.getByRole('button', { name: 'Open case filters', exact: true }).click();
  await expect(queue.getByLabel('Search cases')).toBeVisible();
  await expect(queue.getByRole('combobox', { name: 'Priority', exact: true })).toBeVisible();
  await expect(queue.getByRole('combobox', { name: 'Sort', exact: true })).toBeVisible();
  if (isMobile) {
    await expect(queue.getByRole('button', { name: 'Detail', exact: true })).toBeHidden();
    await expect(queue.getByRole('button', { name: 'Compact', exact: true })).toBeHidden();
  } else {
    await expect(queue.getByRole('button', { name: 'Detail', exact: true })).toBeVisible();
    await expect(queue.getByRole('button', { name: 'Compact', exact: true })).toBeVisible();
  }
  await expect(cards).toHaveCount(3);

  await queue.getByLabel('Search cases').fill('Jordan Ellis');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('FA-CB-24007');

  const jordanItem = queue.locator('.case-queue-item').filter({ hasText: 'Jordan Ellis' });
  await jordanItem.getByRole('button', { name: /Preview/ }).click();
  await expect(queue.getByRole('complementary', { name: 'Selected case preview' })).toContainText('Jordan Ellis');
  await expect(queue.getByRole('complementary', { name: 'Selected case preview' })).toContainText('Non-Fraud Chargeback Claim');
  await expect(queue.getByRole('complementary', { name: 'Selected case preview' })).toContainText('Reason code guide');
  if (isMobile) await queue.getByRole('button', { name: 'Close selected case preview', exact: true }).click();

  await queue.getByLabel('Search cases').fill('');
  await queue.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('High');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('FA-ATO-24018');
  await queue.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('all');

  if (!isMobile) {
    await queue.getByRole('button', { name: 'Compact', exact: true }).click();
    await expect(queue.locator('.case-queue-list')).toHaveClass(/view-compact/);
  }

  const layout = await page.evaluate(() => {
    const panel = document.querySelector('.cases-theme-v1-panel');
    const preview = document.querySelector('.case-queue-preview');
    const panelRect = panel?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelLeft: panelRect?.left ?? 0,
      panelRight: panelRect?.right ?? 0,
      previewDisplay: preview ? getComputedStyle(preview).display : '',
      previewPosition: preview ? getComputedStyle(preview).position : '',
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelLeft).toBeGreaterThanOrEqual(-1);
  expect(layout.panelRight).toBeLessThanOrEqual(layout.viewportWidth + 1);
  if (isMobile) {
    expect(layout.previewDisplay).toBe('none');
  } else {
    expect(layout.previewPosition).toBe('sticky');
  }

  if (isMobile) await queue.getByRole('button', { name: 'Open case generator', exact: true }).click();
  await expect(queue.getByLabel('Generate case claim type')).toBeVisible();
  await expect(queue.getByLabel('Generate case scenario')).toBeVisible();
  await expect(queue.getByLabel('Generate case count')).toBeVisible();
  await queue.getByLabel('Generate case claim type').selectOption('credit-risk');
  await queue.getByLabel('Generate case count').selectOption('5');
  await queue.getByRole('button', { name: 'Generate cases', exact: true }).click();
  await expect(queue.locator('[data-case-origin="generated"]')).toHaveCount(5);
  await expect(queue.getByRole('complementary', { name: 'Selected case preview' })).toContainText('Credit Risk Review');
  await expect(queue.getByRole('complementary', { name: 'Selected case preview' })).toContainText('Credit review details');

  await assertEvidenceFirstLock(page, builtInCases[0].id);
});

test('all three built-in cases open from the queue without answer leaks', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Fraud Academy OS/ })).toBeVisible();

  for (const item of builtInCases) {
    await openCaseQueue(page);
    await page.locator('.cases-theme-v1-panel .nav-case-card').filter({ hasText: item.id }).click();
    await expect(page.locator('.visual-case-switcher select')).toHaveValue(item.id);
    await expect(page.locator('.case-summary-meta-grid').getByText(item.person, { exact: true })).toBeVisible();
    await assertEvidenceFirstLock(page, item.id);
  }
});

test('completed core modules and System Access Lane render real records', async ({ page }) => {
  await page.goto('/');
  const caseSelector = page.locator('.visual-case-switcher select');
  await caseSelector.selectOption(builtInCases[2].id);
  await expect(caseSelector).toHaveValue(builtInCases[2].id);

  await openCoreTool(page, 'Business & Payment Verification', 'Payment Verification');
  await openCoreTool(page, 'Business & Payment Verification', 'KYB Review');
  await openCoreTool(page, 'Documents & Requests', 'Document Viewer');
  await openCoreTool(page, 'Links & Related Cases', 'Link Analysis');
  await openCoreTool(page, 'Links & Related Cases', 'System Access Lane');
  await openCoreTool(page, 'Workflow Review', 'Timeline');

  await expect(page.locator('[data-timeline-screen="approved-theme-v1"]')
    .getByRole('button', { name: /(?:Mark Timeline reviewed|✓ Timeline reviewed)/ }))
    .toBeVisible();
  await assertEvidenceFirstLock(page, builtInCases[2].id);
});

test('responsive investigation records stay inside the viewport', async ({ page }, testInfo) => {
  await page.goto('/');
  await openCoreTool(page, 'Business & Payment Verification', 'Payment Verification');

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const recordList = panel.locator('.payment-record-list');
  const detail = panel.locator('.payment-detail-panel');
  const firstRecord = panel.locator('[data-payment-verification-record]').first();
  const firstField = panel.locator('.payment-detail-grid > div').first();

  await expect(firstRecord).toBeVisible();
  await expect(firstField).toBeVisible();

  const layout = await page.evaluate(() => {
    const panelElement = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const recordListElement = document.querySelector('.payment-record-list');
    const detailElement = document.querySelector('.payment-detail-panel');
    const record = document.querySelector('[data-payment-verification-record]');
    const fieldGrid = document.querySelector('.payment-detail-grid');
    const viewportWidth = window.innerWidth;
    const rect = (element) => element?.getBoundingClientRect();
    const withinViewport = (element) => {
      const box = rect(element);
      return Boolean(box && box.left >= -1 && box.right <= viewportWidth + 1);
    };

    return {
      panelFits: withinViewport(panelElement),
      listFits: withinViewport(recordListElement),
      detailFits: withinViewport(detailElement),
      recordFits: withinViewport(record),
      panelOverflow: panelElement.scrollWidth - panelElement.clientWidth,
      recordOverflow: record.scrollWidth - record.clientWidth,
      fieldColumns: fieldGrid ? getComputedStyle(fieldGrid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      listTop: rect(recordListElement)?.top ?? 0,
      detailTop: rect(detailElement)?.top ?? 0,
    };
  });

  expect(layout.panelFits).toBe(true);
  expect(layout.listFits).toBe(true);
  expect(layout.detailFits).toBe(true);
  expect(layout.recordFits).toBe(true);
  expect(layout.panelOverflow).toBeLessThanOrEqual(1);
  expect(layout.recordOverflow).toBeLessThanOrEqual(1);

  if (testInfo.project.name === 'mobile-chromium') {
    expect(layout.fieldColumns).toBe(1);
    expect(layout.detailTop).toBeGreaterThan(layout.listTop + 20);
  } else {
    expect(layout.fieldColumns).toBe(2);
    expect(Math.abs(layout.listTop - layout.detailTop)).toBeLessThanOrEqual(2);
  }

  await assertEvidenceFirstLock(page, builtInCases[0].id);
});

test('generated cases persist through reload and remain Evidence First', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'Phone case generation is covered through the dedicated Case Queue generator.');
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
    expect(generatedId).toMatch(/^FA-[A-Z]+-G\d{8}$/);
    expect(generatedIds).not.toContain(generatedId);
    generatedIds.push(generatedId);
    await expect(page.locator('.visual-case-strip')).toContainText('Generated');
    await expect(page.locator('[data-case-briefing-screen="approved-theme-v1"]')).toBeVisible();
    await assertEvidenceFirstLock(page, generatedId);
  }

  await openWorkflowStage(page, /Case Briefing/);
  const generatedBriefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(generatedBriefing).toBeVisible();
  await expect(generatedBriefing).not.toContainText('The fictional packet contains both routine and exception evidence');
  await expect(generatedBriefing.locator('.case-briefing-overview-card')).toContainText('The amount in scope is');
  await expect(generatedBriefing.locator('.case-briefing-overview-card')).toContainText('activity begins');

  await expect(page.getByText('3 generated training cases saved locally')).toBeVisible();
  await openCaseQueue(page);

  for (const generatedId of generatedIds) {
    await expect(page.locator('.cases-theme-v1-panel .nav-case-card').filter({ hasText: generatedId })).toBeVisible();
  }

  await page.locator('.cases-theme-v1-panel .nav-case-card').filter({ hasText: generatedIds[0] }).click();
  await expect(selector).toHaveValue(generatedIds[0]);
  await assertEvidenceFirstLock(page, generatedIds[0]);

  await page.reload();
  await expect(page.getByRole('heading', { name: /Fraud Academy OS/ })).toBeVisible();
  await openCaseQueue(page);

  for (const generatedId of generatedIds) {
    await expect(page.locator('.cases-theme-v1-panel .nav-case-card').filter({ hasText: generatedId })).toBeVisible();
  }

  await page.locator('.cases-theme-v1-panel .nav-case-card').filter({ hasText: generatedIds[0] }).click();
  await expect(page.locator('.visual-case-switcher select')).toHaveValue(generatedIds[0]);
  await assertEvidenceFirstLock(page, generatedIds[0]);
  await openWorkflowStage(page, /Case Briefing/);
  await expect(page.locator('[data-case-briefing-screen="approved-theme-v1"]')).not.toContainText('The fictional packet contains both routine and exception evidence');
});
