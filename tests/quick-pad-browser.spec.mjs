import { test, expect } from '@playwright/test';
import { openToolGroups, selectToolGroup } from './workspace-page-helpers.mjs';

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(({ mobile }) => {
    if (!window.sessionStorage.getItem('quick-pad-test-ready')) {
      window.localStorage.removeItem('fraud-academy-quick-pad-v1');
      window.sessionStorage.setItem('quick-pad-test-ready', 'true');
    }
    if (mobile) window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  }, { mobile: testInfo.project.name === 'mobile-chromium' });
});

test('Quick Pad keeps an account ID available across tools and reloads', async ({ page }) => {
  await page.goto('/');
  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  if (test.info().project.name === 'mobile-chromium') {
    await selectToolGroup(page, /Identity & Customer/, 'Customer 360');
  } else {
    await briefing.getByRole('button', { name: /Begin Investigation/ }).click();
  }

  const customer = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  const mobile = test.info().project.name === 'mobile-chromium';
  let lookupValue;
  if (mobile) {
    const devicePin = customer.getByRole('button', { name: /^Add Device ID .* to Quick Pad$/ }).first();
    const pinLabel = await devicePin.getAttribute('aria-label');
    lookupValue = pinLabel.match(/^Add Device ID (.+) to Quick Pad$/)?.[1];
    await devicePin.click();
  } else {
    await customer.getByRole('tab', { name: 'Accounts', exact: true }).click();
    const account = customer.locator('[data-customer-account]').first();
    lookupValue = await account.getAttribute('data-customer-account');
    await account.getByRole('button', { name: `Add ${lookupValue} to Quick Pad` }).click();
  }

  const trigger = page.getByRole('button', { name: 'Open Quick Pad, 1 saved item' });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const pad = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await expect(pad).toContainText(mobile ? 'Device ID' : 'Account ID');
  await expect(pad).toContainText(lookupValue);
  await pad.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(pad.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();

  if (mobile) {
    await expect(pad.getByRole('button', { name: 'Use here', exact: true })).toHaveCount(0);
    await pad.getByRole('button', { name: 'Close Quick Pad', exact: true }).click();
    const toolMap = await openToolGroups(page);
    await toolMap.locator('.mobile-tool-map-cluster').filter({ hasText: 'Login, Session, Device & IP' }).click();
    await toolMap.getByRole('region', { name: 'Login, Session, Device & IP tools' })
      .getByRole('button', { name: /Device Intelligence/ })
      .click();
    await page.getByRole('button', { name: 'Open Quick Pad, 1 saved item' }).click();
    await page.getByRole('dialog', { name: 'Keep lookup details close' })
      .getByRole('button', { name: 'Use here', exact: true })
      .click();
    await expect(page.getByRole('textbox', { name: 'Search Device Intelligence records' })).toHaveValue(lookupValue);
  } else {
    await pad.getByRole('button', { name: 'Use here', exact: true }).click();
    await expect(customer.getByRole('textbox', { name: 'Search Customer 360 dossier' })).toHaveValue(lookupValue);
  }

  await page.reload();
  await page.getByRole('button', { name: 'Open Quick Pad, 1 saved item' }).click();
  await expect(page.getByRole('dialog', { name: 'Keep lookup details close' })).toContainText(lookupValue);
});

test('Quick Pad scratch note is case-scoped and can become a formal note', async ({ page }) => {
  await page.goto('/');
  if (test.info().project.name === 'mobile-chromium') {
    await page.getByRole('navigation', { name: 'Mission navigation' })
      .getByRole('button', { name: /Cases/ })
      .click();
  }
  await page.getByRole('button', { name: 'Open Quick Pad, 0 saved items' }).click();
  const pad = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await pad.getByRole('button', { name: 'Scratch note', exact: true }).click();
  await pad.getByRole('textbox', { name: 'Case Quick Pad scratch note' }).fill('Confirm the destination ID against Payment Verification.');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('fraud-academy-quick-pad-v1') || '{}')['FA-ATO-24018']?.scratch)).toBe('Confirm the destination ID against Payment Verification.');
  await page.reload();
  await page.getByRole('button', { name: 'Open Quick Pad, 0 saved items' }).click();
  const restored = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await restored.getByRole('button', { name: 'Scratch note', exact: true }).click();
  await expect(restored.getByRole('textbox', { name: 'Case Quick Pad scratch note' })).toHaveValue('Confirm the destination ID against Payment Verification.');
  await restored.getByRole('button', { name: 'Add to case notes', exact: true }).click();
  await expect(restored.getByRole('textbox', { name: 'Case Quick Pad scratch note' })).toHaveValue('');
});
