import { test, expect } from '@playwright/test';
import { selectToolGroup } from './workspace-page-helpers.mjs';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'mobile-chromium') return;
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  });
});

test('Device and IP Intelligence use dedicated mobile evidence pages without changing desktop', async ({ page }, testInfo) => {
  await page.goto('/');
  await selectToolGroup(page, /Login, Session, Device & IP/);

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  if (testInfo.project.name === 'mobile-chromium') {
    await panel.getByRole('button', { name: 'Open Device Intelligence', exact: true }).click();
  } else {
    await panel.getByRole('combobox', { name: 'Choose investigation tool' }).selectOption('Device Intelligence');
  }
  await expect(panel).toHaveAttribute('data-tool-name', 'Device Intelligence');

  if (testInfo.project.name !== 'mobile-chromium') {
    await expect(panel.locator('[data-mobile-device-reference="true"]')).toHaveCount(0);
    await expect(panel.getByRole('heading', { name: 'Which devices appear in the case activity, and where do those devices repeat?', exact: true })).toBeVisible();
    await expect(panel.locator(':scope > .investigation-tool-header')).toBeVisible();
    return;
  }

  const deviceMission = page.locator('[data-device-intelligence-page="true"]');
  const devicePage = deviceMission.locator('[data-mobile-device-reference="true"]');
  await expect(deviceMission).toBeVisible();
  await expect(devicePage).toBeVisible();
  await expect(devicePage.getByRole('heading', { name: 'Device Intelligence', exact: true })).toBeVisible();
  await expect(devicePage.getByLabel('Luna debrief is available after submission')).toContainText('Debrief after submit');
  await expect(panel.locator(':scope > .investigation-tool-header')).toBeHidden();
  await expect(panel.locator(':scope > .investigation-tool-question')).toBeHidden();
  await expect(panel.locator(':scope > .investigation-tool-controls')).toBeHidden();
  await expect(devicePage.getByText('Lookup required', { exact: true }).first()).toBeVisible();
  await expect(devicePage.getByText('Run a device lookup to reveal', { exact: false })).toBeVisible();
  await expect(devicePage).not.toContainText(/Risk Score|High Risk|Medium Risk|Low Risk|AI Verified/i);

  const firstDevice = devicePage.locator('[data-device-intelligence-record]').first();
  const deviceId = await firstDevice.getAttribute('data-device-intelligence-record');
  await devicePage.getByRole('textbox', { name: 'Search Device Intelligence records' }).fill(deviceId);
  await expect(devicePage.locator('[data-device-intelligence-record]')).toHaveCount(1);
  await expect(devicePage.locator('.device-detail-panel')).toContainText(deviceId);
  await expect(devicePage.locator('.mobile-device-lookup-details').getByText(/^FP-/)).toBeVisible();
  await expect(devicePage.locator('.mobile-device-lookup-details').getByText(/^BR-/)).toBeVisible();
  const deviceHistory = devicePage.locator('.device-history-panel');
  await expect(deviceHistory.getByRole('heading', { name: 'Complete recorded event log', exact: true })).toBeVisible();
  await expect(deviceHistory.locator('article').first()).toContainText(/SES-[A-Z0-9-]+/i);
  await expect(deviceHistory.locator('article').first()).toContainText(/Face ID|Fingerprint|Biometric|Password|Code|MFA/i);
  await expect(devicePage.getByRole('button', { name: 'Mark Device Intelligence reviewed', exact: true })).toBeEnabled();

  await devicePage.getByRole('button', { name: 'Pin Device ID', exact: true }).click();
  await devicePage.getByRole('button', { name: 'Quick Pad Device ID', exact: true }).click();
  await devicePage.getByRole('button', { name: 'Save device note', exact: true }).click();
  await expect(page.locator('.tray-card')).toContainText('Pinned');

  const deviceLayout = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const elements = [
      document.querySelector('.mission-device-intelligence-page .mobile-intel-header'),
      document.querySelector('.mission-device-intelligence-page .mobile-device-primary'),
      document.querySelector('.mission-device-intelligence-page .mobile-device-facts'),
      document.querySelector('.mission-device-intelligence-page .mobile-device-history'),
    ];
    return {
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      allFit: elements.every((element) => {
        const box = element?.getBoundingClientRect();
        return Boolean(box && box.left >= -1 && box.right <= viewport + 1);
      }),
      minimumTarget: Math.min(...[...document.querySelectorAll('.mobile-device-reference button')].map((button) => button.getBoundingClientRect().height)),
    };
  });
  expect(deviceLayout.documentWidth).toBeLessThanOrEqual(deviceLayout.viewport + 1);
  expect(deviceLayout.allFit).toBe(true);
  expect(deviceLayout.minimumTarget).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: testInfo.outputPath('device-intelligence-reference-mobile.png'), fullPage: true });

  await devicePage.getByRole('button', { name: 'Open IP Intelligence', exact: true }).click();
  await expect(panel).toHaveAttribute('data-tool-name', 'IP Intelligence');

  const ipMission = page.locator('[data-ip-intelligence-page="true"]');
  const ipPage = ipMission.locator('[data-mobile-ip-reference="true"]');
  await expect(ipMission).toBeVisible();
  await expect(ipPage).toBeVisible();
  await expect(ipPage.getByRole('heading', { name: 'IP Intelligence', exact: true })).toBeVisible();
  await expect(ipPage.locator('.ip-intel-summary article')).toHaveCount(6);
  await expect(ipPage.getByText('Lookup required', { exact: true }).first()).toBeVisible();
  await expect(ipPage.locator('.ip-detail-grid')).toHaveCount(0);
  await expect(ipPage).not.toContainText(/Risk Score|High Risk|Medium Risk|Low Risk|AI Verified/i);

  const firstIp = ipPage.locator('[data-ip-intelligence-record]').first();
  const ipRecordId = await firstIp.getAttribute('data-ip-intelligence-record');
  const ipAddress = ipRecordId.replace(/^IP-/, '');
  await firstIp.click();
  await expect(ipPage.getByRole('textbox', { name: 'Search IP Intelligence records' })).toHaveValue(ipAddress);
  await ipPage.getByRole('button', { name: 'Run IP Lookup', exact: true }).click();
  await expect(ipPage.locator('.ip-detail-grid')).toContainText(ipAddress);
  await expect(ipPage.locator('.mobile-ip-usage [data-ip-usage-event]').first()).toBeVisible();
  await expect(ipPage.getByRole('button', { name: 'Mark IP Intelligence reviewed', exact: true })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('ip-intelligence-reference-mobile.png'), fullPage: true });

  await ipPage.getByRole('button', { name: 'Pin IP address', exact: true }).click();
  await ipPage.getByRole('button', { name: 'Save IP note', exact: true }).click();
  const download = page.waitForEvent('download');
  await ipPage.getByRole('button', { name: 'Generate IP Intelligence Report', exact: true }).click();
  await expect((await download).suggestedFilename()).toContain('RPT-IP');

  const ipSearch = ipPage.getByRole('textbox', { name: 'Search IP Intelligence records' });
  await ipSearch.fill('not-an-ip');
  await ipPage.getByRole('button', { name: 'Run IP Lookup', exact: true }).click();
  await expect(ipPage.getByText('No exact IP match', { exact: true }).first()).toBeVisible();
  await expect(ipPage.locator('.ip-detail-grid')).toHaveCount(0);
  await expect(ipPage.locator('.mobile-ip-detail')).not.toContainText(ipAddress);
  await expect(ipPage.getByRole('button', { name: 'Mark IP Intelligence reviewed', exact: true })).toBeDisabled();

  const ipLayout = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const elements = [
      document.querySelector('.mission-ip-intelligence-page .mobile-intel-header'),
      document.querySelector('.mission-ip-intelligence-page .mobile-ip-records'),
      document.querySelector('.mission-ip-intelligence-page .mobile-ip-detail'),
    ];
    return {
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      allFit: elements.every((element) => {
        const box = element?.getBoundingClientRect();
        return Boolean(box && box.left >= -1 && box.right <= viewport + 1);
      }),
    };
  });
  expect(ipLayout.documentWidth).toBeLessThanOrEqual(ipLayout.viewport + 1);
  expect(ipLayout.allFit).toBe(true);
});
