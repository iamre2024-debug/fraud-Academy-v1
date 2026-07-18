import { test, expect } from '@playwright/test';
import { selectToolGroup } from './workspace-page-helpers.mjs';

const secondCase = { id: 'FA-CB-24007', person: 'Jordan Ellis' };
const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate|suggested first tool|investigator question)\b/i;

test('approved Customer 360 is a complete Evidence First dossier', async ({ page }, testInfo) => {
  await page.goto('/');

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing).toBeVisible();
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();

  const customer360 = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer360).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Customer 360', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Customer Identity Snapshot', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Current Case Snapshot', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Baseline before the claim', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Process coaching', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Latest case files', exact: true })).toBeVisible();
  await expect(customer360.getByText('Suggested Next Step', { exact: true })).toBeVisible();

  const tabs = customer360.getByRole('tablist', { name: 'Customer 360 dossier tabs' });
  await tabs.getByRole('tab', { name: 'Accounts', exact: true }).click();
  await expect(customer360.getByRole('heading', { name: 'Products & Accounts', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Relationship Overview', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Account & Payment Snapshot', exact: true })).toBeVisible();
  await expect(customer360.locator('[data-customer-account-snapshot]')).toHaveCount(1);
  await expect(customer360.locator('[data-customer-account-snapshot]').first()).toContainText('BC-441');
  await expect(customer360.locator('[data-customer-account-snapshot]').first()).toContainText('DST-CARD-4410');
  await expect(customer360.getByRole('button', { name: 'Pin identifiers', exact: true })).toBeVisible();
  await expect(customer360.locator('[data-customer-account-snapshot]').getByRole('button', { name: 'Open Payment Verification', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Accounts & Products', exact: true })).toBeVisible();
  await expect(customer360.locator('.customer-360-structured-records article')).toHaveCount(3);

  await tabs.getByRole('tab', { name: 'Devices & Access', exact: true }).click();
  await expect(customer360.getByRole('heading', { name: 'Security & Access Summary', exact: true })).toBeVisible();

  await tabs.getByRole('tab', { name: 'Contact History', exact: true }).click();
  await expect(customer360.getByRole('heading', { name: 'Contact Information', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Recent Customer Contact', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Recent Customer Contact Log', exact: true })).toBeVisible();

  await tabs.getByRole('tab', { name: 'Profile & Relationship', exact: true }).click();
  await expect(customer360.getByRole('heading', { name: 'Prior Claims / Disputes', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Prior Claims & Disputes Records', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Profile & Relationship History', exact: true })).toBeVisible();
  await expect(customer360.locator('[data-customer-record]').first()).toBeVisible();

  await tabs.getByRole('tab', { name: 'Notes', exact: true }).click();
  await expect(customer360.getByRole('heading', { name: 'Customer 360 Notes', exact: true })).toBeVisible();

  const relatedTools = customer360.getByRole('navigation', { name: 'Customer 360 related tools' });
  await expect(relatedTools.getByRole('button')).toHaveCount(7);

  await tabs.getByRole('tab', { name: 'Profile & Relationship', exact: true }).click();
  await expect(customer360.locator('[data-profile-event]')).toHaveCount(7);
  await expect(customer360.locator('[data-profile-event]').first()).toContainText('Old value');
  await expect(customer360.locator('[data-profile-event]').first()).toContainText('New value');
  await expect(customer360.locator('[data-profile-event]').first()).toContainText('Device / session');
  const profileDownload = page.waitForEvent('download');
  await customer360.getByRole('button', { name: 'Export History', exact: true }).click();
  expect((await profileDownload).suggestedFilename()).toBe('FA-ATO-24018-profile-relationship-history.txt');

  await tabs.getByRole('tab', { name: 'Overview', exact: true }).click();

  const layout = await page.evaluate(() => {
    const panel = document.querySelector('[data-customer-360-screen="approved-theme-v1"]');
    const identity = document.querySelector('[data-dossier-section="identity"]');
    const caseSnapshot = document.querySelector('[data-dossier-section="case"]');
    const actions = document.querySelector('.customer-360-actions');
    const fieldGrid = document.querySelector('.customer-360-field-grid');
    const viewportWidth = window.innerWidth;
    const rect = (element) => element?.getBoundingClientRect();
    const fits = (element) => {
      const box = rect(element);
      return Boolean(box && box.left >= -1 && box.right <= viewportWidth + 1);
    };

    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelFits: fits(panel),
      identityFits: fits(identity),
      caseFits: fits(caseSnapshot),
      identityTop: rect(identity)?.top ?? 0,
      caseTop: rect(caseSnapshot)?.top ?? 0,
      actionColumns: actions ? getComputedStyle(actions).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      fieldColumns: fieldGrid ? getComputedStyle(fieldGrid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelFits).toBe(true);
  expect(layout.identityFits).toBe(true);
  expect(layout.caseFits).toBe(true);

  if (testInfo.project.name === 'mobile-chromium') {
    expect(Math.abs(layout.identityTop - layout.caseTop)).toBeGreaterThan(20);
    expect(layout.actionColumns).toBe(2);
    expect(layout.fieldColumns).toBe(1);
  } else {
    expect(Math.abs(layout.identityTop - layout.caseTop)).toBeLessThanOrEqual(2);
    expect(layout.actionColumns).toBe(6);
    expect(layout.fieldColumns).toBe(2);
  }

  const search = customer360.getByRole('textbox', { name: 'Search Customer 360 dossier' });
  await search.fill('phone');
  await expect(customer360).toContainText(/dossier sections/);
  await expect(customer360.getByRole('heading', { name: 'Contact Information', exact: true })).toBeVisible();
  await search.clear();

  await customer360.getByRole('button', { name: 'Mark Customer 360 reviewed', exact: true }).click();
  await expect(customer360.getByRole('button', { name: '✓ Customer 360 reviewed', exact: true })).toBeVisible();

  await relatedTools.getByRole('button', { name: 'Transaction History', exact: true }).click();
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toHaveAttribute('data-tool-name', 'Transaction History');
  await selectToolGroup(page, /Identity & Customer/);
  await expect(customer360).toBeVisible();

  await relatedTools.getByRole('button', { name: 'Identity Intel', exact: true }).click();
  const identityTool = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(identityTool).toHaveAttribute('data-tool-name', 'Identity Intel / People Search');
  await expect(identityTool.getByText('Identity report hidden until a search is run.', { exact: true })).toBeVisible();
  await selectToolGroup(page, /Identity & Customer/);
  await expect(customer360).toBeVisible();

  const selector = page.locator('.visual-case-switcher select');
  await selector.selectOption(secondCase.id);
  await expect(selector).toHaveValue(secondCase.id);
  await expect(briefing.getByText(secondCase.person, { exact: true }).first()).toBeVisible();
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();
  await expect(customer360.getByText(secondCase.person, { exact: true }).first()).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Card and merchant context', exact: true })).toBeVisible();

  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', secondCase.id);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);
});
