import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { trainingCases } from '../src/data/cases.js';
import { getFinancialRecords } from '../src/data/caseToolData.js';
import {
  openMobileWorkspaceMenu,
  openMobileWorkspaceShortcut,
} from './workspace-page-helpers.mjs';

const activeCase = enrichTrainingCases(trainingCases)[0];
const paymentRecord = getFinancialRecords(activeCase).paymentVerification[0];
const screenshotRoot = process.env.MOBILE_REFERENCE_SCREENSHOT_DIR
  ? path.resolve(process.env.MOBILE_REFERENCE_SCREENSHOT_DIR)
  : null;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
    window.localStorage.removeItem('fraud-academy-quick-pad-v1');
    window.localStorage.removeItem('fraud-academy-note-drafts-v1');
  });
});

async function openCustomer360(page) {
  await page.goto('/');
  await expect(page.locator('[data-mobile-reference-briefing="v2"]')).toBeVisible();
  await page.getByRole('button', { name: 'Open workspace ›', exact: true }).click();
  await expect(page.locator('[data-mobile-reference-tool="Customer 360"]')).toBeVisible();
}

async function openToolGroup(page, groupLabel) {
  if (!await page.locator('[data-investigation-tool-groups="approved-theme-v1"]').isVisible()) {
    await openMobileWorkspaceShortcut(page, 'All tools');
  }
  const group = page.locator('.mission-map-tool-node').filter({ hasText: groupLabel });
  await expect(group).toBeVisible();
  await group.click();
}

async function switchTool(page, toolName) {
  const workspace = page.locator('.mission-workspace-v3');
  if (await workspace.getAttribute('data-active-tool') !== toolName) {
    const menu = await openMobileWorkspaceMenu(page);
    const select = menu.getByRole('combobox', { name: 'Choose mobile investigation tool' });
    await expect(select).toBeVisible();
    await select.selectOption(toolName);
  }
  await expect(workspace).toHaveAttribute('data-active-tool', toolName);
  await expect(page.locator('.mission-tool-page')).toBeVisible();
}

async function assertMobileGeometry(page) {
  const geometry = await page.evaluate(() => {
    const dock = document.querySelector('.mission-mobile-dock')?.getBoundingClientRect();
    const quickPad = document.querySelector('.case-quick-pad-trigger')?.getBoundingClientRect();
    const workspaceViewport = document.querySelector(
      '.mission-mobile-root[data-mobile-mission-tab="workspace"] .mission-mobile-viewport',
    )?.getBoundingClientRect();
    const buttons = [...document.querySelectorAll('.mission-mobile-dock button')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height, label: button.textContent.trim() };
    });
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      layoutWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      dock: dock ? { left: dock.left, right: dock.right, top: dock.top, bottom: dock.bottom } : null,
      quickPad: quickPad ? { left: quickPad.left, right: quickPad.right, top: quickPad.top, bottom: quickPad.bottom } : null,
      workspaceViewport: workspaceViewport ? { top: workspaceViewport.top, bottom: workspaceViewport.bottom } : null,
      buttons,
    };
  });

  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.layoutWidth + 1);
  expect(geometry.bodyWidth).toBeLessThanOrEqual(geometry.layoutWidth + 1);
  expect(geometry.buttons.map((item) => item.label)).toEqual(['⌂Home', '▣Cases', '⊞Workspace', '◇Academy', '☾Agent', '❝Quotes']);
  expect(geometry.buttons.every((item) => item.width >= 44 && item.height >= 44)).toBe(true);
  expect(geometry.dock.left).toBeGreaterThanOrEqual(0);
  expect(geometry.dock.right).toBeLessThanOrEqual(geometry.layoutWidth + 1);
  expect(geometry.dock.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
  if (geometry.quickPad) {
    expect(geometry.quickPad.right).toBeLessThanOrEqual(geometry.layoutWidth);
    expect(geometry.quickPad.bottom).toBeLessThanOrEqual(geometry.dock.top);
    expect(geometry.quickPad.top).toBeGreaterThanOrEqual(geometry.workspaceViewport.bottom - 1);
  }
}

async function screenshot(page, name) {
  if (!screenshotRoot) return;
  fs.mkdirSync(screenshotRoot, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotRoot, `${name}.png`),
    animations: 'disabled',
    fullPage: false,
  });
}

async function captureQuickPadPair(page, slug) {
  await page.evaluate(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector(
      '.mission-mobile-root[data-mobile-mission-tab="workspace"] .mission-mobile-viewport',
    )?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  });
  await expect(page.getByRole('button', { name: /Open Quick Pad/ })).toBeVisible();
  await screenshot(page, `${slug}-quick-pad-collapsed`);
  await page.getByRole('button', { name: /Open Quick Pad/ }).click();
  await expect(page.getByRole('dialog', { name: 'Keep lookup details close' })).toBeVisible();
  await screenshot(page, `${slug}-quick-pad-expanded`);
  await page.getByRole('button', { name: 'Close Quick Pad', exact: true }).click();
}

test('approved mobile shell is safe at the required phone widths and every active tool is reachable', async ({ page }) => {
  await openCustomer360(page);
  const dock = page.getByRole('navigation', { name: 'Mission navigation' });
  await expect(dock.getByRole('button')).toHaveCount(6);

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 430, height: 932 },
    { width: 412, height: 600 },
  ]) {
    await page.setViewportSize(viewport);
    await assertMobileGeometry(page);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const groups = [
    ['Identity & Customer', ['Customer 360', 'Identity Intel / People Search']],
    ['Login, Session, Device & IP', ['Login History', 'Session History', 'Device Intelligence', 'IP Intelligence']],
    ['Transactions & Financial', ['Transaction History', 'Financial Investigation']],
    ['Business & Payment Verification', ['Payment Verification']],
    ['Documents & Requests', ['Document Viewer', 'Document Request']],
    ['Links & Related Cases', ['Link Analysis']],
  ];

  for (const [groupLabel, tools] of groups) {
    await openToolGroup(page, groupLabel);
    for (const toolName of tools) {
      await switchTool(page, toolName);
      await assertMobileGeometry(page);
    }
  }

  await openMobileWorkspaceShortcut(page, 'Briefing');
  await page.getByRole('navigation', { name: 'Case briefing actions' })
    .getByRole('button', { name: /Timeline/ })
    .click();
  await expect(page.locator('.mission-workspace-v3')).toHaveAttribute('data-active-tool', 'Timeline');
  await expect(page.locator('[data-timeline-screen="approved-theme-v1"]')).toBeVisible();
  await assertMobileGeometry(page);

  const menu = await openMobileWorkspaceMenu(page);
  await menu.getByRole('combobox', { name: 'Choose active mission case' }).selectOption('FA-CR-24003');
  await expect(page.locator('[data-mobile-reference-briefing="v2"]')).toBeVisible();
  await page.getByRole('button', { name: 'Open workspace ›', exact: true }).click();
  await openToolGroup(page, 'Business & Payment Verification');
  await switchTool(page, 'Business Intelligence');
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toHaveAttribute('data-tool-name', 'Business Intelligence');
  const businessMenu = await openMobileWorkspaceMenu(page);
  const businessOptions = await businessMenu
    .getByRole('combobox', { name: 'Choose mobile investigation tool' })
    .locator('option')
    .allTextContents();
  expect(businessOptions).toContain('Business Intelligence');
  expect(businessOptions).not.toContain('KYB Review');
});

test('Quick Pad collapsed and expanded states are captured in the four required tools', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openCustomer360(page);

  const customerAccount = page.locator('[data-customer-account]').first();
  const accountId = await customerAccount.getAttribute('data-customer-account');
  await customerAccount.getByRole('button', { name: `Pin Account ID ${accountId} to Quick Pad` }).click();
  await captureQuickPadPair(page, 'customer-360');

  await openToolGroup(page, 'Transactions & Financial');
  await switchTool(page, 'Financial Investigation');
  await expect(page.locator('[data-financial-investigation-screen]')).toBeVisible();
  await page.getByRole('button', { name: /Pin Transaction ID .* to Quick Pad/ }).first().click();
  await captureQuickPadPair(page, 'financial-investigation');

  await openToolGroup(page, 'Links & Related Cases');
  await switchTool(page, 'Link Analysis');
  const phoneSuggestion = page.locator('.mobile-link-suggestions button').filter({ hasText: 'Phone Number' }).first();
  await phoneSuggestion.click();
  await page.getByRole('button', { name: 'Search links' }).click();
  await expect(page.locator('.mobile-link-result-summary')).toBeVisible();
  await page.locator('.mobile-link-result-summary').getByRole('button', { name: /Quick Pad/ }).click();
  await captureQuickPadPair(page, 'link-analysis');

  await openToolGroup(page, 'Business & Payment Verification');
  await switchTool(page, 'Payment Verification');
  const payment = page.locator('[data-tool-name="Payment Verification"]');
  await payment.getByRole('textbox', { name: 'Bank Code', exact: true }).fill(paymentRecord.bankCode);
  await payment.getByRole('textbox', { name: 'Destination ID', exact: true }).fill(paymentRecord.destinationId);
  await payment.getByRole('textbox', { name: 'Owner or business name', exact: true }).fill(paymentRecord.accountHolder);
  await payment.getByRole('button', { name: 'Run verification', exact: true }).click();
  await expect(payment.locator('.payment-detail-panel')).toBeVisible();
  const paymentQuickPadActions = payment.locator('.payment-quick-pad-actions');
  await paymentQuickPadActions.getByRole('button', { name: /Bank Code/ }).click();
  await paymentQuickPadActions.getByRole('button', { name: /Destination ID/ }).click();
  await paymentQuickPadActions.getByRole('button', { name: /Bank Code/ }).click();
  await expect.poll(() => page.evaluate(({ caseId, bankCode, destinationId, recordId }) => {
    const pad = JSON.parse(localStorage.getItem('fraud-academy-quick-pad-v1') || '{}');
    const items = pad[caseId]?.items ?? [];
    const paymentItems = items.filter((item) => item.sourceTool === 'Payment Verification');
    return {
      bankCodes: paymentItems.filter((item) => (
        item.label === 'Bank Code'
        && item.value === bankCode
        && item.sourceRecordId === recordId
      )).length,
      destinationIds: paymentItems.filter((item) => (
        item.label === 'Destination ID'
        && item.value === destinationId
        && item.sourceRecordId === recordId
      )).length,
    };
  }, {
    caseId: activeCase.id,
    bankCode: paymentRecord.bankCode,
    destinationId: paymentRecord.destinationId,
    recordId: paymentRecord.id,
  })).toEqual({ bankCodes: 1, destinationIds: 1 });
  await captureQuickPadPair(page, 'payment-verification');

  await expect.poll(() => page.evaluate((caseId) => {
    const pad = JSON.parse(localStorage.getItem('fraud-academy-quick-pad-v1') || '{}');
    return pad[caseId]?.items?.length ?? 0;
  }, activeCase.id)).toBeGreaterThanOrEqual(5);
});
