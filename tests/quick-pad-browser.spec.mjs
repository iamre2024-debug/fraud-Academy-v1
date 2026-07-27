import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(({ mobile }) => {
    if (!window.sessionStorage.getItem('quick-pad-test-ready')) {
      window.localStorage.removeItem('fraud-academy-quick-pad-v1');
      window.localStorage.removeItem('fraud-academy-notes-v1');
      window.localStorage.removeItem('fraud-academy-agent-notepad-v1');
      window.sessionStorage.setItem('quick-pad-test-ready', 'true');
    }
    if (mobile) window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  }, { mobile: testInfo.project.name === 'mobile-chromium' });
});

async function openCustomer360(page, mobile) {
  if (mobile) {
    await page.getByRole('button', { name: 'Open workspace ›', exact: true }).click();
    const customer = page.locator('[data-customer-360-screen="approved-theme-v2"]');
    await expect(customer).toBeVisible();
    return customer;
  }

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();
  const customer = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer).toBeVisible();
  await customer.getByRole('tab', { name: 'Accounts', exact: true }).click();
  return customer;
}

async function switchActiveCase(page, mobile, caseId) {
  let selector;
  if (mobile) {
    await page.getByRole('button', { name: 'Open workspace menu', exact: true }).click();
    selector = page.getByRole('combobox', { name: 'Choose active mission case', exact: true });
  } else {
    selector = page.locator('.visual-case-switcher select');
  }
  await expect(selector).toBeVisible();
  await selector.selectOption(caseId);
  if (mobile) {
    await expect(page.locator('.mission-workspace-title')).toContainText(caseId);
  } else {
    await expect(page.locator('.visual-case-strip')).toContainText(caseId);
  }
  await expect(page.locator('.case-quick-pad')).toHaveAttribute('aria-label', 'Case Quick Pad');
}

async function assertMobilePadGeometry(page, pad) {
  const originalViewport = page.viewportSize();
  const mobileViewport = page.locator('.mission-mobile-viewport');

  await page.getByRole('button', { name: 'Close Quick Pad', exact: true }).click();
  await mobileViewport.evaluate((element) => { element.scrollTop = 240; });
  const scrollBeforeOpen = await mobileViewport.evaluate((element) => element.scrollTop);
  await page.getByRole('button', { name: /Open Quick Pad/ }).click();
  await expect.poll(() => mobileViewport.evaluate((element) => element.scrollTop)).toBe(scrollBeforeOpen);

  await pad.getByRole('button', { name: 'Scratch note', exact: true }).click();
  const textarea = pad.getByRole('textbox', { name: 'Case Quick Pad scratch note' });
  await textarea.focus();
  await page.setViewportSize({
    width: originalViewport.width,
    height: Math.min(560, originalViewport.height - 180),
  });

  const keyboardGeometry = await page.evaluate(() => {
    const panel = document.querySelector('.case-quick-pad-panel')?.getBoundingClientRect();
    const field = document.querySelector('[aria-label="Case Quick Pad scratch note"]')?.getBoundingClientRect();
    const dock = document.querySelector('.mission-mobile-dock')?.getBoundingClientRect();
    return {
      panelBottom: panel?.bottom ?? Number.POSITIVE_INFINITY,
      fieldBottom: field?.bottom ?? Number.POSITIVE_INFINITY,
      dockTop: dock?.top ?? Number.NEGATIVE_INFINITY,
      viewportHeight: window.visualViewport?.height ?? window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
  expect(keyboardGeometry.documentWidth).toBeLessThanOrEqual(keyboardGeometry.viewportWidth + 1);
  expect(keyboardGeometry.panelBottom).toBeLessThanOrEqual(keyboardGeometry.dockTop + 1);
  expect(keyboardGeometry.fieldBottom).toBeLessThanOrEqual(keyboardGeometry.viewportHeight + 1);

  await page.setViewportSize(originalViewport);
  await page.getByRole('button', { name: 'Close Quick Pad', exact: true }).click();
  await expect.poll(() => mobileViewport.evaluate((element) => element.scrollTop)).toBe(scrollBeforeOpen);
  await page.getByRole('button', { name: /Open Quick Pad/ }).click();
}

test('Quick Pad keeps one account ID available across tools, reloads, copies, and removes it', async ({ page }, testInfo) => {
  await page.goto('/');
  const mobile = testInfo.project.name === 'mobile-chromium';
  const customer = await openCustomer360(page, mobile);
  const account = customer.locator('[data-customer-account]').first();
  const accountId = await account.getAttribute('data-customer-account');
  const pinAccount = mobile
    ? account.getByRole('button', { name: `Pin Account ID ${accountId} to Quick Pad` })
    : account.getByRole('button', { name: `Add ${accountId} to Quick Pad` });
  await pinAccount.click();
  await pinAccount.click();
  await expect.poll(() => page.evaluate((activeCaseId) => {
    const pad = JSON.parse(localStorage.getItem('fraud-academy-quick-pad-v1') || '{}');
    return pad[activeCaseId]?.items?.length;
  }, 'FA-ATO-24018')).toBe(1);

  const trigger = page.getByRole('button', { name: 'Open Quick Pad, 1 saved item' });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const pad = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await expect(pad).toContainText('Account ID');
  await expect(pad).toContainText(accountId);
  await expect(pad).toContainText('Source · Customer 360');
  await expect(pad).toContainText('Copied facts only · not evidence');
  await pad.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(pad.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();

  await expect(pad.getByRole('button', { name: 'Open record', exact: true })).toHaveCount(0);
  await expect(pad.getByRole('button', { name: 'Use here', exact: true })).toHaveCount(0);
  await expect(customer.locator(`[data-customer-account="${accountId}"]`)).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Open Quick Pad, 1 saved item' }).click();
  const restored = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await expect(restored).toContainText(accountId);
  await restored.getByRole('button', { name: `Remove Account ID ${accountId}`, exact: true }).click();
  await expect(restored).not.toContainText(accountId);
  await page.getByRole('button', { name: 'Close Quick Pad', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open Quick Pad, 0 saved items' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Open Quick Pad, 0 saved items' })).toBeVisible();
});

test('Quick Pad scratch note is keyboard-safe, case-scoped, and separate from the investigator notebook', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile-chromium';
  const originalCaseId = 'FA-ATO-24018';
  const alternateCaseId = 'FA-CB-24007';
  const scratchText = 'Confirm the destination ID against Payment Verification.';

  await page.goto('/');
  await page.getByRole('button', { name: 'Open Quick Pad, 0 saved items' }).click();
  const pad = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await pad.getByRole('button', { name: 'Scratch note', exact: true }).click();
  await pad.getByRole('textbox', { name: 'Case Quick Pad scratch note' }).fill(scratchText);
  await expect(pad.getByRole('status')).toContainText(/Last saved|Saved with this case/);
  await expect.poll(() => page.evaluate((activeCaseId) => (
    JSON.parse(localStorage.getItem('fraud-academy-quick-pad-v1') || '{}')[activeCaseId]?.scratch
  ), originalCaseId)).toBe(scratchText);

  if (mobile) await assertMobilePadGeometry(page, pad);

  await page.reload();
  await page.getByRole('button', { name: 'Open Quick Pad, 0 saved items' }).click();
  let restored = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await restored.getByRole('button', { name: 'Scratch note', exact: true }).click();
  await expect(restored.getByRole('textbox', { name: 'Case Quick Pad scratch note' })).toHaveValue(scratchText);

  await page.getByRole('button', { name: 'Close Quick Pad', exact: true }).click();
  await switchActiveCase(page, mobile, alternateCaseId);
  await page.getByRole('button', { name: 'Open Quick Pad, 0 saved items' }).click();
  const alternatePad = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await expect(alternatePad).toContainText(`CASE QUICK PAD · ${alternateCaseId}`);
  await alternatePad.getByRole('button', { name: 'Scratch note', exact: true }).click();
  await expect(alternatePad.getByRole('textbox', { name: 'Case Quick Pad scratch note' })).toHaveValue('');
  await alternatePad.getByRole('button', { name: /Notebook/ }).click();
  await expect(alternatePad).toContainText('No formal case notes saved yet.');

  await page.getByRole('button', { name: 'Close Quick Pad', exact: true }).click();
  await switchActiveCase(page, mobile, originalCaseId);
  await page.getByRole('button', { name: 'Open Quick Pad, 0 saved items' }).click();
  restored = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await restored.getByRole('button', { name: 'Scratch note', exact: true }).click();
  await expect(restored.getByRole('textbox', { name: 'Case Quick Pad scratch note' })).toHaveValue(scratchText);
  await restored.getByRole('button', { name: 'Add to case notes', exact: true }).click();
  await expect(restored.getByRole('textbox', { name: 'Case Quick Pad scratch note' })).toHaveValue('');

  await restored.getByRole('button', { name: /Notebook/ }).click();
  await expect(restored.locator('[aria-label="Investigator notebook content"]')).toContainText(scratchText);
  const notebookState = await page.evaluate((activeCaseId) => {
    const caseNotes = JSON.parse(localStorage.getItem('fraud-academy-notes-v1') || '{}');
    const agentNotes = JSON.parse(localStorage.getItem('fraud-academy-agent-notepad-v1') || '{}');
    return {
      caseNotes: caseNotes[activeCaseId] ?? [],
      agentNotes: agentNotes['AGT-TRAIN-001'] ?? [],
    };
  }, originalCaseId);
  expect(notebookState.caseNotes.some((note) => note.includes(scratchText))).toBe(true);
  expect(notebookState.agentNotes.some((note) => note.caseId === originalCaseId && note.noteText === scratchText)).toBe(true);
});
