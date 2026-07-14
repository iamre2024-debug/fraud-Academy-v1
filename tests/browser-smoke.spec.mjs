import { test, expect } from '@playwright/test';

const builtInCases = [
  { id: 'FA-ATO-24018', person: 'Maya Sterling' },
  { id: 'FA-CB-24007', person: 'Jordan Ellis' },
  { id: 'FA-CR-24003', person: 'Avery Brooks' },
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
  const allTools = page.getByRole('button', { name: /All tools/ });
  if (await allTools.isVisible().catch(() => false)) await allTools.click();

  if (tool === 'Timeline') {
    const workflow = page.getByRole('navigation', { name: 'Active case workflow' });
    await workflow.getByRole('button', { name: /Timeline/ }).click();
    const timeline = page.locator('[data-timeline-screen="approved-theme-v1"]');
    await expect(timeline).toBeVisible();
    await expect(timeline.getByRole('heading', { name: 'Case Timeline', exact: true })).toBeVisible();
    await expect(timeline.locator('[data-timeline-event]').first()).toBeVisible();
    await expect(timeline.locator('.timeline-detail')).toBeAttached();
    return;
  }

  const categoryButton = page.locator('[data-investigation-tool-groups="approved-theme-v1"] .visual-category-row button').filter({ hasText: category });
  await expect(categoryButton).toBeVisible();
  await categoryButton.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await categoryButton.evaluate((element) => element.click());

  if (tool === 'Payment Verification') {
    const payment = page.locator('[data-payment-verification-screen="lookup-packet-v1"]');
    await expect(payment).toBeVisible();
    await expect(payment.getByRole('heading', { name: 'Verification Object Lookup', exact: true })).toBeVisible();
    return;
  }

  if (tool === 'Business Intelligence') {
    await page.getByRole('combobox', { name: 'Choose investigation tool' }).selectOption(tool);
    const business = page.locator('[data-business-intelligence-screen="lookup-report-v1"]');
    await expect(business).toBeVisible();
    await expect(business.getByRole('heading', { name: 'Business Search', exact: true })).toBeVisible();
    return;
  }

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const selector = panel.getByRole('combobox', { name: 'Choose investigation tool' });
  await expect(panel).toBeVisible();
  if (await selector.inputValue() !== tool) await selector.selectOption({ label: tool });
  await expect(selector).toHaveValue(tool);
  await expect(panel).toHaveAttribute('data-tool-name', tool);
  await expect(panel.getByRole('heading', { name: tool, exact: true })).toBeVisible();
  await expect(panel.locator('[data-investigation-record]').first()).toBeVisible();
  await expect(panel.locator('.investigation-tool-detail')).toBeAttached();
}

test('approved Dashboard resumes the active case without answer leaks', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /Dashboard/ }).click();

  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'dashboard');
  await expect(page.locator('[data-react-navigation-panel="dashboard"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Investigator dashboard' })).toBeVisible();
  await expect(page.locator('.dashboard-active-case')).toContainText(builtInCases[0].id);
  await expect(page.locator('.dashboard-quick-grid').getByRole('button', { name: /Case Queue/ })).toBeVisible();
  await expect(page.locator('.dashboard-quick-grid').getByRole('button', { name: /Evidence Workspace/ })).toBeVisible();
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
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'cases');
  await expect(queue.getByRole('heading', { name: 'Case Queue' })).toBeVisible();
  await expect(queue.getByLabel('Search cases')).toBeVisible();
  await expect(queue.getByRole('combobox', { name: 'Priority', exact: true })).toBeVisible();
  await expect(queue.getByRole('combobox', { name: 'Sort', exact: true })).toBeVisible();
  await expect(queue.getByRole('button', { name: 'Detail', exact: true })).toBeVisible();
  await expect(queue.getByRole('button', { name: 'Compact', exact: true })).toBeVisible();
  await expect(cards).toHaveCount(3);

  await queue.getByLabel('Search cases').fill('Jordan Ellis');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('FA-CB-24007');

  const jordanItem = queue.locator('.case-queue-item').filter({ hasText: 'Jordan Ellis' });
  await jordanItem.getByRole('button', { name: /Preview/ }).click();
  await expect(queue.getByRole('complementary', { name: 'Selected case preview' })).toContainText('Jordan Ellis');
  await expect(queue.getByRole('complementary', { name: 'Selected case preview' })).toContainText('Chargeback Claim');

  await queue.getByLabel('Search cases').fill('');
  await queue.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('High');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('FA-ATO-24018');
  await queue.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('all');

  await queue.getByRole('button', { name: 'Compact', exact: true }).click();
  await expect(queue.locator('.case-queue-list')).toHaveClass(/view-compact/);

  const layout = await page.evaluate(() => {
    const panel = document.querySelector('.cases-theme-v1-panel');
    const preview = document.querySelector('.case-queue-preview');
    const panelRect = panel?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelLeft: panelRect?.left ?? 0,
      panelRight: panelRect?.right ?? 0,
      previewPosition: preview ? getComputedStyle(preview).position : '',
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelLeft).toBeGreaterThanOrEqual(-1);
  expect(layout.panelRight).toBeLessThanOrEqual(layout.viewportWidth + 1);
  if (testInfo.project.name === 'mobile-chromium') expect(layout.previewPosition).toBe('static');
  else expect(layout.previewPosition).toBe('sticky');

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

  await openCoreTool(page, 'Business & Payment Verification', 'Payment Verification');
  await openCoreTool(page, 'Business & Payment Verification', 'Business Intelligence');
  await openCoreTool(page, 'Evidence & Documents', 'Evidence Center');
  await openCoreTool(page, 'Links & Related Cases', 'Link Analysis');
  await openCoreTool(page, 'Links & Related Cases', 'System Access Lane');
  await openCoreTool(page, 'Workflow Review', 'Timeline');

  await assertEvidenceFirstLock(page, builtInCases[0].id);
});

test('responsive investigation records stay inside the viewport', async ({ page }) => {
  await page.goto('/');
  await openCoreTool(page, 'Business & Payment Verification', 'Payment Verification');

  const payment = page.locator('[data-payment-verification-screen="lookup-packet-v1"]');
  await expect(payment).toBeVisible();
  const layout = await page.evaluate(() => {
    const panel = document.querySelector('[data-payment-verification-screen="lookup-packet-v1"]');
    const rect = panel?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      left: rect?.left ?? -99,
      right: rect?.right ?? 99999,
      overflow: panel ? panel.scrollWidth - panel.clientWidth : 99,
    };
  });
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.left).toBeGreaterThanOrEqual(-1);
  expect(layout.right).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.overflow).toBeLessThanOrEqual(1);
  await assertEvidenceFirstLock(page, builtInCases[0].id);
});

test('generated cases persist through reload and remain Evidence First', async ({ page }) => {
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
    await expect(page.locator('[data-login-history-screen="event-review-v1"]')).toBeAttached();
    await expect(page.locator('[data-login-record]').first()).toBeAttached();
    await assertEvidenceFirstLock(page, generatedId);
  }

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
});
