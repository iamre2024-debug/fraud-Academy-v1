import { test, expect } from '@playwright/test';

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
  await expect(customer360.getByRole('heading', { name: 'Contact Information', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Products & Accounts', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Relationship Overview', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Security & Access Summary', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Current Case Snapshot', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Recent Customer Contact', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Prior Claims / Disputes', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Profile Change Event Log', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Related Customer Records', exact: true })).toBeVisible();

  const relatedTools = customer360.getByRole('navigation', { name: 'Customer 360 related tools' });
  await expect(relatedTools.getByRole('button')).toHaveCount(4);
  await expect(customer360.locator('[data-dossier-section]')).toHaveCount(8);
  await expect(customer360.locator('[data-profile-event]')).toHaveCount(7);

  const layout = await page.evaluate(() => {
    const panel = document.querySelector('[data-customer-360-screen="approved-theme-v1"]');
    const identity = document.querySelector('[data-dossier-section="identity"]');
    const contact = document.querySelector('[data-dossier-section="contact"]');
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
      contactFits: fits(contact),
      identityTop: rect(identity)?.top ?? 0,
      contactTop: rect(contact)?.top ?? 0,
      actionColumns: actions ? getComputedStyle(actions).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      fieldColumns: fieldGrid ? getComputedStyle(fieldGrid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelFits).toBe(true);
  expect(layout.identityFits).toBe(true);
  expect(layout.contactFits).toBe(true);

  if (testInfo.project.name === 'mobile-chromium') {
    expect(Math.abs(layout.identityTop - layout.contactTop)).toBeGreaterThan(20);
    expect(layout.actionColumns).toBe(1);
    expect(layout.fieldColumns).toBe(1);
  } else {
    expect(Math.abs(layout.identityTop - layout.contactTop)).toBeLessThanOrEqual(2);
    expect(layout.actionColumns).toBe(4);
    expect(layout.fieldColumns).toBe(2);
  }

  const search = customer360.getByRole('textbox', { name: 'Search Customer 360 dossier' });
  await search.fill('phone');
  await expect(customer360).toContainText(/dossier sections/);
  await expect(customer360.getByRole('heading', { name: 'Contact Information', exact: true })).toBeVisible();
  await search.clear();

  await customer360.getByRole('button', { name: 'Mark Customer 360 reviewed', exact: true }).click();
  await expect(customer360.getByRole('button', { name: '✓ Customer 360 reviewed', exact: true })).toBeVisible();

  await relatedTools.getByRole('button', { name: 'Identity Intel', exact: true }).click();
  const genericTool = page.locator('.activity-panel');
  await expect(genericTool).toContainText('Identity Intelligence');
  await genericTool.getByRole('combobox', { name: 'Choose investigation tool' }).selectOption('Customer 360');
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
