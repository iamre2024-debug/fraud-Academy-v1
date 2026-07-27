import { test, expect } from '@playwright/test';

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
    await page.getByRole('navigation', { name: 'Case briefing files' })
      .getByRole('button', { name: 'Investigation launchpad' })
      .click();
  }
  const beginInvestigation = test.info().project.name === 'mobile-chromium'
    ? page.getByRole('button', { name: /Begin investigation/i })
    : briefing.getByRole('button', { name: /Begin Investigation/ });
  await beginInvestigation.click();

  const customer = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  if (test.info().project.name !== 'mobile-chromium') {
    await customer.getByRole('tab', { name: 'Accounts', exact: true }).click();
  }
  const account = customer.locator('[data-customer-account]').first();
  const accountId = await account.getAttribute('data-customer-account');
  const pinAccount = test.info().project.name === 'mobile-chromium'
    ? account.getByRole('button', { name: `Pin Account ID ${accountId} to Quick Pad` })
    : account.getByRole('button', { name: `Add ${accountId} to Quick Pad` });
  await pinAccount.click();

  const trigger = page.getByRole('button', { name: 'Open Quick Pad, 1 saved item' });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const pad = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await expect(pad).toContainText('Account ID');
  await expect(pad).toContainText(accountId);
  await pad.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(pad.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();

  if (test.info().project.name === 'mobile-chromium') {
    await pad.getByRole('button', { name: 'Open record', exact: true }).click();
    await expect(customer.locator(`[data-customer-account="${accountId}"]`)).toBeVisible();
  } else {
    await pad.getByRole('button', { name: 'Use here', exact: true }).click();
    await expect(customer.getByRole('textbox', { name: 'Search Customer 360 dossier' })).toHaveValue(accountId);
  }

  await page.reload();
  await page.getByRole('button', { name: 'Open Quick Pad, 1 saved item' }).click();
  await expect(page.getByRole('dialog', { name: 'Keep lookup details close' })).toContainText(accountId);
});

test('Quick Pad scratch note is case-scoped and can become a formal note', async ({ page }) => {
  await page.goto('/');
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
