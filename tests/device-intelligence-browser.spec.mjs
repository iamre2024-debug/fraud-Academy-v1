import { test, expect } from '@playwright/test';
import { selectToolGroup } from './workspace-page-helpers.mjs';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'mobile-chromium') return;
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  });
});

async function openCaseQueue(page) {
  const mobileNavigation = page.getByRole('navigation', { name: 'Mission navigation' });
  if (await mobileNavigation.isVisible()) {
    await mobileNavigation.getByRole('button', { name: 'Cases', exact: true }).click();
  } else {
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Cases', exact: true })
      .click();
  }
  const queue = page.locator('.cases-theme-v1-panel');
  await expect(queue).toBeVisible();
  return queue;
}

test('generated Device ID lookup returns a complete profile and never leaks a stale result', async ({ page }, testInfo) => {
  await page.goto('/');
  const queue = await openCaseQueue(page);
  await queue.getByLabel('Generate case claim type').selectOption('account-takeover');
  await queue.getByLabel('Generate case scenario').selectOption('ato-credential-stuffing');
  await queue.getByLabel('Generate case difficulty').selectOption('deep');
  await queue.getByLabel('Generate case evidence depth').selectOption('deep');
  await queue.getByLabel('Generate case count').selectOption('1');
  await queue.getByRole('button', { name: 'Generate cases', exact: true }).click();

  await expect(page.locator('[data-workspace-page="briefing"]')).toBeVisible();
  await selectToolGroup(page, /Login, Session, Device & IP/);

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  if (testInfo.project.name === 'mobile-chromium') {
    await panel.getByRole('button', { name: 'Open Device Intelligence', exact: true }).click();
  } else {
    await panel.getByRole('combobox', { name: 'Choose investigation tool' }).selectOption('Device Intelligence');
  }
  await expect(panel).toHaveAttribute('data-tool-name', 'Device Intelligence');

  const search = panel.getByRole('textbox', { name: 'Search Device Intelligence records' });
  const reviewButton = panel.getByRole('button', { name: 'Mark Device Intelligence reviewed' });
  await expect(panel.getByText('Lookup required', { exact: true })).toBeVisible();
  await expect(panel.getByText('Run a device lookup to reveal', { exact: true }).first()).toBeVisible();
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
  await expect(panel.locator('.device-intel-snapshot').getByText(/^FP-/)).toBeVisible();
  await expect(detail.getByText(/^BR-/)).toBeVisible();
  await expect(detail).not.toContainText(/Lookup needed|Run a device lookup to reveal/i);
  await expect(panel.locator('.device-history-panel')).toContainText(/Successful|Failed|Account locked/);
  await expect(reviewButton).toBeEnabled();

  await search.fill(`${deviceId}-MISSING`);
  await expect(panel.getByText('No matching device record returned', { exact: true })).toBeVisible();
  await expect(panel.locator('.investigation-tool-empty[role="status"]')).toContainText('No device intelligence records match this lookup.');
  await expect(panel.locator('.device-detail-panel')).toHaveCount(0);
  await expect(panel).not.toContainText('Training Mobile OS 18');
  await expect(reviewButton).toBeDisabled();

  await page.screenshot({ path: testInfo.outputPath(`device-intelligence-generated-${testInfo.project.name}.png`), fullPage: true });
});
