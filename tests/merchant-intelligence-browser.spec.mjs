import { test, expect } from '@playwright/test';

const merchantCaseId = 'FA-CB-24007';
const nonMerchantCaseId = 'FA-ATO-24018';
const forbiddenPreSubmissionCopy = /\b(?:fraud score|correct answer|AI recommendations?|approve claim|deny claim)\b/i;

test('Merchant Intelligence provides claim-specific evidence and stays out of unrelated lanes', async ({ page }, testInfo) => {
  await page.goto('/');

  const caseSelector = page.locator('.visual-case-switcher select');
  await caseSelector.selectOption(merchantCaseId);
  await expect(caseSelector).toHaveValue(merchantCaseId);

  const groupRail = page.locator('[data-investigation-tool-groups="approved-theme-v1"]');
  await groupRail.getByRole('button', { name: /Merchant & Disputes/ }).click();

  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Merchant Intelligence');
  await expect(toolPanel.getByRole('heading', { name: 'Merchant Intelligence', exact: true })).toBeVisible();
  await expect(toolPanel.getByRole('heading', { name: 'Is this a customer issue, merchant issue, fraud issue, or dispute issue?', exact: true })).toBeVisible();
  await expect(toolPanel.locator('.merchant-intelligence-profile')).toContainText('StreamBox Premium');
  await expect(toolPanel.locator('.merchant-intelligence-profile')).toContainText('MCC 4899');
  await expect(toolPanel.locator('.merchant-intelligence-metrics article')).toHaveCount(4);
  await expect(toolPanel.locator('.merchant-intelligence-tabs button')).toHaveCount(7);
  await expect(toolPanel.locator('[data-merchant-intelligence-record]')).toHaveCount(1);

  await toolPanel.getByRole('button', { name: 'Authorization', exact: true }).click();
  await expect(toolPanel.locator('.merchant-intelligence-detail')).toContainText('Entry mode');
  await expect(toolPanel.locator('.merchant-intelligence-detail')).toContainText('AVS');
  await expect(toolPanel.locator('.merchant-intelligence-detail')).toContainText('CVV');
  await expect(toolPanel.locator('.merchant-intelligence-detail')).toContainText('3DS');
  await expect(toolPanel.locator('.merchant-intelligence-detail')).toContainText('Wallet token');

  const search = toolPanel.getByRole('textbox', { name: 'Search Merchant Intelligence' });
  await search.fill('no-such-merchant-record');
  await expect(toolPanel.getByText('No merchant records match this search.', { exact: true })).toBeVisible();
  await search.clear();
  await expect(toolPanel.locator('[data-merchant-intelligence-record]')).toHaveCount(1);

  await toolPanel.getByRole('button', { name: 'Fulfillment', exact: true }).click();
  await expect(toolPanel.locator('.merchant-intelligence-detail')).toContainText(/Delivery|service|usage/i);
  await toolPanel.getByRole('button', { name: 'Disputes & Refunds', exact: true }).click();
  await expect(toolPanel.locator('.merchant-intelligence-detail')).toContainText('Prior disputes');
  await toolPanel.getByRole('button', { name: 'Subscription / Marketplace', exact: true }).click();
  await expect(toolPanel.locator('.merchant-intelligence-detail')).toContainText('Subscription status');
  await toolPanel.getByRole('button', { name: 'Reason Code', exact: true }).click();
  await expect(toolPanel.locator('.merchant-intelligence-detail')).toContainText('Response deadline');
  await expect(toolPanel.locator('.merchant-intelligence-rail')).toContainText('Reason-code context');

  await toolPanel.getByRole('button', { name: 'Pin record', exact: true }).click();
  await expect(page.locator('.tray-card')).toContainText('Pinned');
  await toolPanel.getByRole('button', { name: 'Save evidence note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('Merchant Intelligence');
  await toolPanel.getByRole('button', { name: 'Mark Merchant Intelligence reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: 'Merchant Intelligence reviewed', exact: true })).toBeVisible();

  const layout = await page.evaluate(() => {
    const panel = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const workspace = document.querySelector('.merchant-intelligence-workspace');
    const profile = document.querySelector('.merchant-intelligence-profile');
    const viewportWidth = window.innerWidth;
    const panelBox = panel?.getBoundingClientRect();
    const profileBox = profile?.getBoundingClientRect();
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelFits: Boolean(panelBox && panelBox.left >= -1 && panelBox.right <= viewportWidth + 1),
      profileFits: Boolean(profileBox && profileBox.left >= -1 && profileBox.right <= viewportWidth + 1),
      workspaceColumns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelFits).toBe(true);
  expect(layout.profileFits).toBe(true);
  expect(layout.workspaceColumns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 3);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);

  await caseSelector.selectOption(nonMerchantCaseId);
  await expect(caseSelector).toHaveValue(nonMerchantCaseId);
  await expect(groupRail.getByRole('button', { name: /Merchant & Disputes/ })).toHaveCount(0);
  await expect(toolPanel).toHaveCount(0);
  await groupRail.getByRole('button', { name: /Login, Session, Device & IP/ }).click();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Login History');
  await expect(toolPanel.getByRole('combobox', { name: 'Choose investigation tool' }).locator('option', { hasText: 'Merchant Intelligence' })).toHaveCount(0);
});
