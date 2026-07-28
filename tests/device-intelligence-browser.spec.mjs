import { test, expect } from '@playwright/test';
import {
  generateCaseFromQueue,
  selectToolGroup,
} from './workspace-page-helpers.mjs';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'mobile-chromium') return;
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  });
});

test('generated Device ID lookup returns a complete profile and never leaks a stale result', async ({ page }, testInfo) => {
  await page.goto('/');
  await generateCaseFromQueue(page, {
    customerType: 'personal',
    product: 'credit-card',
    workflow: 'card-account-takeover',
    alertReason: 'New card-access or wallet activity observed',
    scenario: 'cat-scenario-01',
    difficulty: 'deep',
    evidenceDepth: 'deep',
    count: '1',
  });
  await selectToolGroup(page, /Login, Session, Device & IP/, 'Device Intelligence');

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(panel).toHaveAttribute('data-tool-name', 'Device Intelligence');

  const search = panel.getByRole('textbox', { name: 'Search Device Intelligence records' });
  const reviewButton = panel.getByRole('button', { name: 'Mark Device Intelligence reviewed' });
  const lookupStatus = testInfo.project.name === 'mobile-chromium'
    ? panel.getByLabel('Device Intelligence lookup').getByText('Lookup required', { exact: true })
    : panel.getByText('Lookup required', { exact: true }).first();
  await expect(lookupStatus).toBeVisible();
  await expect(panel.getByText('Run a device lookup to reveal', { exact: false }).first()).toBeVisible();
  await expect(reviewButton).toBeDisabled();

  const firstDevice = panel.locator('[data-device-intelligence-record]').first();
  const deviceId = await firstDevice.getAttribute('data-device-intelligence-record');
  expect(deviceId).toMatch(/^DEV-GEN-[A-Z0-9-]+$/i);

  await search.fill(deviceId);
  await expect(panel.locator('[data-device-intelligence-record]')).toHaveCount(1);
  const detail = panel.locator('.device-detail-panel');
  await expect(detail).toBeVisible();
  await expect(detail).toContainText(deviceId);
  await expect(detail).toContainText('Training Mobile OS 18');
  await expect(detail).toContainText('Chrome Mobile training browser');
  const fingerprintDetails = testInfo.project.name === 'mobile-chromium'
    ? panel.locator('.mobile-device-lookup-details')
    : panel.locator('.device-intel-snapshot');
  await expect(fingerprintDetails.getByText(/^FP-/)).toBeVisible();
  await expect(detail.getByText(/^BR-/)).toBeVisible();
  await expect(detail).not.toContainText(/Lookup needed|Run a device lookup to reveal/i);
  const deviceHistory = panel.locator('.device-history-panel').first();
  await expect(deviceHistory).toContainText(/SES-[A-Z0-9-]+/i);
  await expect(deviceHistory).toContainText(/Face ID|Fingerprint|Biometric|Password|Code|MFA/i);
  await expect(reviewButton).toBeEnabled();

  await search.fill(`${deviceId}-MISSING`);
  await expect(panel.getByText('No matching device record returned', { exact: true })).toBeVisible();
  await expect(panel.locator('.investigation-tool-empty[role="status"]')).toContainText('No device intelligence records match this lookup.');
  await expect(panel.locator('.device-detail-panel')).toHaveCount(0);
  await expect(panel).not.toContainText('Training Mobile OS 18');
  await expect(reviewButton).toBeDisabled();

  await page.screenshot({ path: testInfo.outputPath(`device-intelligence-generated-${testInfo.project.name}.png`), fullPage: true });
});
