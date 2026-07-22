// Chargeback lifecycle and real-document browser coverage.
import { test, expect } from '@playwright/test';
import { selectToolGroup } from './workspace-page-helpers.mjs';

const merchantCaseId = 'FA-CB-24007';
const nonMerchantCaseId = 'FA-ATO-24018';
const forbiddenPreSubmissionCopy = /\b(?:fraud score|correct answer|AI recommendations?|approve claim|deny claim)\b/i;

test('Merchant Intelligence presents a chargeback lifecycle with inspectable scenario documents', async ({ page }, testInfo) => {
  await page.goto('/');

  const caseSelector = page.locator('.visual-case-switcher select');
  await caseSelector.selectOption(merchantCaseId);
  await selectToolGroup(page, /Merchant & Disputes/);

  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Merchant Intelligence');
  await expect(toolPanel.locator('.merchant-lifecycle-summary')).toContainText('StreamBox Premium');
  await expect(toolPanel.locator('.merchant-lifecycle-summary')).toContainText('Recurring billing dispute');
  await expect(toolPanel.locator('.merchant-quick-summary')).toContainText('2');
  await expect(toolPanel.locator('.merchant-quick-summary')).toContainText('Challenged');
  await expect(toolPanel.locator('.merchant-lifecycle-tabs button')).toHaveCount(6);
  await expect(toolPanel.locator('[data-lifecycle-section="merchant-response"]')).toBeVisible();
  await expect(toolPanel.getByRole('heading', { name: 'Merchant response', exact: true })).toBeVisible();
  await expect(toolPanel.getByText('Challenged', { exact: true }).first()).toBeVisible();
  await expect(toolPanel.locator('[data-merchant-document]')).toHaveCount(5);

  await toolPanel.getByRole('button', { name: 'Open Billing history statement' }).click();
  await expect(toolPanel.locator('.merchant-document-viewer')).toBeVisible();
  await expect(toolPanel.locator('.merchant-document-sheet')).toContainText('BILLING HISTORY');
  await expect(toolPanel.locator('.merchant-document-sheet table')).toBeVisible();
  await expect(toolPanel.locator('.merchant-document-sheet')).toContainText('StreamBox Premium');
  await toolPanel.getByRole('button', { name: 'Pin document' }).click();
  await expect(page.locator('.tray-card')).toContainText('Pinned');
  await toolPanel.getByRole('button', { name: 'Save review note' }).click();
  await expect(page.locator('.notebook-card')).toContainText('Merchant Intelligence');
  await toolPanel.getByRole('button', { name: 'Back to evidence packet' }).click();

  const openSection = async (value, label) => {
    if (testInfo.project.name === 'mobile-chromium') await toolPanel.getByRole('combobox', { name: 'Choose chargeback lifecycle section' }).selectOption(value);
    else await toolPanel.getByRole('button', { name: label, exact: true }).click();
  };

  await openSection('claim-details', 'Claim Details');
  await expect(toolPanel.getByRole('heading', { name: 'Customer statement' })).toBeVisible();
  await openSection('network-submission', 'Network Submission');
  await expect(toolPanel.getByText('Card-network exchange', { exact: true })).toBeVisible();
  await openSection('customer-evidence', 'Customer Evidence');
  await expect(toolPanel.getByRole('button', { name: 'Pending Cancellation confirmation' })).toBeDisabled();
  await openSection('visa-requirements', 'Visa Requirements');
  await expect(toolPanel).toContainText('Merchant Intelligence does not select a reason code or decide the claim.');
  await openSection('case-status', 'Case Status');
  await expect(toolPanel.locator('.merchant-status-timeline li')).toHaveCount(6);

  await toolPanel.getByRole('button', { name: 'Mark Merchant Intelligence reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: 'Merchant Intelligence reviewed', exact: true })).toBeVisible();

  const layout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    panelRight: document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]')?.getBoundingClientRect().right,
    visibleLifecycleSections: [...document.querySelectorAll('.merchant-lifecycle-content > *')].filter((node) => getComputedStyle(node).display !== 'none').length,
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelRight).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.visibleLifecycleSections).toBe(1);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);

  await caseSelector.selectOption(nonMerchantCaseId);
  await expect(page.locator('[data-investigation-tool-groups="approved-theme-v1"] .visual-category-row > button').filter({ hasText: 'Merchant & Disputes' })).toHaveCount(0);
});
