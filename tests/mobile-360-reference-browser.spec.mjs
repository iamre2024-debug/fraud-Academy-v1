import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import { openWorkspacePages, selectToolGroup } from './workspace-page-helpers.mjs';

const screenshotRoot = process.env.MOBILE_360_SCREENSHOT_DIR
  ? path.resolve(process.env.MOBILE_360_SCREENSHOT_DIR)
  : null;

const payrollCase = createGeneratedCase({
  index: 99360,
  customerType: 'business',
  productType: 'payroll-product',
  workflowType: 'payroll-change-alert',
  difficulty: 'standard',
  evidenceDepth: 'deep',
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
    window.localStorage.removeItem('fraud-academy-quick-pad-v1');
    window.localStorage.removeItem('fraud-academy-note-drafts-v1');
  });
  await page.setViewportSize({ width: 390, height: 844 });
});

async function capture(page, name) {
  if (!screenshotRoot) return;
  fs.mkdirSync(screenshotRoot, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotRoot, `${name}.png`),
    animations: 'disabled',
    fullPage: true,
  });
}

async function openInitialCustomer360(page) {
  await page.goto('/');
  const launchpad = page.getByRole('navigation', { name: 'Case briefing files' })
    .getByRole('button', { name: 'Investigation launchpad' });
  if (await launchpad.isVisible()) await launchpad.click();
  await page.getByRole('button', { name: /Begin investigation/i }).click();
  const customer = page.locator('[data-mobile-360-screen="customer"]');
  await expect(customer).toBeVisible();
  return customer;
}

async function assertMobileGeometry(page, locator) {
  const geometry = await locator.evaluate((panel) => {
    const rect = panel.getBoundingClientRect();
    return {
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      panelWidth: panel.scrollWidth,
      left: rect.left,
      right: rect.right,
      buttons: [...panel.querySelectorAll('button')]
        .filter((button) => button.offsetParent !== null)
        .map((button) => {
          const box = button.getBoundingClientRect();
          return { width: box.width, height: box.height, label: button.getAttribute('aria-label') || button.textContent.trim() };
        }),
    };
  });
  expect(geometry.document).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.panelWidth).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.buttons.every((button) => button.width >= 38 && button.height >= 38)).toBe(true);
}

test('mobile Customer 360 is the coded reference dashboard with working record drawers', async ({ page }) => {
  const customer = await openInitialCustomer360(page);

  await expect(page.locator('[data-mobile-360-header="true"]')).toBeVisible();
  await expect(page.locator('.mobile-360-luna-badge')).toContainText('Luna');
  await expect(customer.getByRole('heading', { name: 'Maya Sterling', exact: true })).toBeVisible();
  await expect(customer).toContainText('Customer ID');
  await expect(customer).toContainText('Training ID');
  await expect(customer.getByRole('heading', { name: 'Profile updates', exact: true })).toBeVisible();
  await expect(customer.getByRole('heading', { name: 'Trusted devices & security', exact: true })).toBeVisible();
  await expect(customer.getByRole('heading', { name: 'Accounts & products', exact: true })).toBeVisible();
  await expect(customer.getByRole('heading', { name: 'Relationship', exact: true })).toBeVisible();
  await expect(customer.getByRole('heading', { name: 'Recent contact notes', exact: true })).toBeVisible();
  await expect(customer).not.toContainText('FA-ATO-24018');
  await expect(customer).not.toContainText('$742.18');
  await expect(page.locator('.mission-workspace-status')).toHaveCount(0);
  await expect(customer.locator('.mobile-360-review')).toHaveCount(0);
  await expect(customer.getByRole('button', { name: 'Open account' })).toHaveCount(0);

  const pairColumns = await customer.locator('.mobile-360-pair').first().evaluate(
    (pair) => getComputedStyle(pair).gridTemplateColumns.split(' ').length,
  );
  expect(pairColumns).toBe(2);

  await customer.getByRole('button', { name: 'View all Profile updates' }).click();
  const updateDrawer = page.getByRole('dialog', { name: 'Profile updates' });
  await expect(updateDrawer).toBeVisible();
  await expect(updateDrawer).toContainText('Previous value');
  await expect(updateDrawer).toContainText('New value');
  await updateDrawer.getByRole('button', { name: 'Close Profile updates' }).click();

  await customer.locator('[data-360-account]').first().click();
  const accountDrawer = page.getByRole('dialog', { name: 'Accounts & products' });
  await expect(accountDrawer).toBeVisible();
  await expect(accountDrawer).toContainText('Destination ID');
  await expect(accountDrawer).toContainText('Bank Code');
  await expect(accountDrawer).not.toContainText('Account ID');
  await expect(accountDrawer).toContainText('Current balance');
  await expect(accountDrawer).toContainText('Restrictions');
  await accountDrawer.getByRole('button', { name: 'Close Accounts & products' }).click();

  await page.getByRole('button', { name: 'Open Customer 360 actions' }).click();
  const customerActions = page.getByRole('dialog', { name: 'Customer 360 actions' });
  await expect(customerActions).toBeVisible();
  await expect(customerActions.getByRole('button', { name: /Customer profile/ })).toBeVisible();
  await expect(customerActions.getByRole('button', { name: /Profile updates/ })).toBeVisible();
  await expect(customerActions.getByRole('button', { name: /Trusted devices & security/ })).toBeVisible();
  await expect(customerActions.getByRole('button', { name: /Accounts & products/ })).toBeVisible();
  await expect(customerActions.getByRole('button', { name: /Relationship/ })).toBeVisible();
  await expect(customerActions).not.toContainText('FA-ATO-24018');
  await customerActions.getByRole('button', { name: /Customer profile/ }).click();
  const customerProfileDrawer = page.getByRole('dialog', { name: 'Customer profile' });
  await expect(customerProfileDrawer).toContainText('Verification method');
  await expect(customerProfileDrawer).toContainText('Last verified');
  await expect(customerProfileDrawer).toContainText('Training-data coverage');
  await customerProfileDrawer.getByRole('button', { name: 'Close Customer profile' }).click();

  await page.getByRole('button', { name: 'Open Customer 360 actions' }).click();
  await page.getByRole('dialog', { name: 'Customer 360 actions' })
    .getByRole('button', { name: /Pin profile/ })
    .click();
  const workflow = await openWorkspacePages(page);
  await workflow.getByRole('button', { name: /Indicators|Evidence/ }).click();
  const profilePin = page.getByRole('button', {
    name: 'Open pinned evidence TRN-8842-19 · Maya Sterling',
  });
  await expect(profilePin).toBeVisible();
  await profilePin.click();
  await expect(page.locator('[data-opened-pinned-evidence="true"]')).toContainText('TRN-8842-19 · Maya Sterling');
  await expect(page.locator('[data-mobile-360-screen="customer"]')).toContainText('Maya Sterling');
  await expect(page.locator('[data-mobile-360-screen="customer"]')).toContainText('TRN-8842-19');

  await assertMobileGeometry(page, customer);
  await capture(page, 'customer-360-reference');
});

test('mobile Business 360 uses the reusable business dossier without case conclusions', async ({ page }) => {
  await page.addInitScript((record) => {
    window.localStorage.setItem('fraud-academy-generated-cases-v1', JSON.stringify([record]));
  }, payrollCase);
  await page.goto('/');

  const caseSelector = page.getByRole('combobox', { name: 'Choose active mission case' });
  await caseSelector.selectOption(payrollCase.id);
  const launchpad = page.getByRole('navigation', { name: 'Case briefing files' })
    .getByRole('button', { name: 'Investigation launchpad' });
  if (await launchpad.isVisible()) await launchpad.click();
  await page.getByRole('button', { name: /Begin investigation/i }).click();
  await selectToolGroup(page, /Business & Payment Verification/);

  const business = page.locator('[data-mobile-360-screen="business"]');
  await expect(business).toBeVisible();
  await expect(business.getByRole('heading', { name: payrollCase.profile.business, exact: true })).toBeVisible();
  await expect(business).toContainText('Masked EIN');
  await expect(business).toContainText('Owner address');
  await expect(business.getByRole('heading', { name: 'Business profile', exact: true })).toHaveCount(0);
  await expect(business.getByRole('heading', { name: 'Business products & accounts', exact: true })).toBeVisible();
  await expect(business.getByRole('heading', { name: 'Credit & loans', exact: true })).toBeVisible();
  await expect(business.getByRole('heading', { name: 'Payroll overview', exact: true })).toBeVisible();
  await expect(business.getByRole('heading', { name: 'Business updates', exact: true })).toBeVisible();
  await expect(business.getByRole('heading', { name: 'Recent notes', exact: true })).toBeVisible();
  await expect(business).not.toContainText(payrollCase.id);
  await expect(business).not.toContainText(payrollCase.alertReason);
  await expect(business).not.toContainText(payrollCase.amount);
  await expect(business).not.toContainText(payrollCase.scenarioTitle);
  await expect(page.locator('.mission-workspace-status')).toHaveCount(0);
  await expect(business.locator('.mobile-360-review')).toHaveCount(0);
  await expect(business.locator('.mobile-360-research-entry')).toHaveCount(0);

  const businessLayout = await business.evaluate((root) => {
    const cards = [...root.querySelectorAll('.mobile-360-section')];
    const findCard = (name) => cards.find((card) => card.querySelector('h3')?.textContent.trim() === name)?.getBoundingClientRect();
    const payroll = findCard('Payroll overview');
    const updates = findCard('Business updates');
    const notes = findCard('Recent notes');
    return {
      payrollTop: payroll?.top,
      updatesTop: updates?.top,
      lowerRowBottom: Math.max(payroll?.bottom ?? 0, updates?.bottom ?? 0),
      notesTop: notes?.top,
      payrollWidth: payroll?.width,
      notesWidth: notes?.width,
    };
  });
  expect(Math.abs(businessLayout.payrollTop - businessLayout.updatesTop)).toBeLessThanOrEqual(2);
  expect(businessLayout.notesTop).toBeGreaterThanOrEqual(businessLayout.lowerRowBottom + 8);
  expect(businessLayout.notesWidth).toBeGreaterThan(businessLayout.payrollWidth * 1.8);

  await page.getByRole('button', { name: 'Open Business 360 actions' }).click();
  const businessActions = page.getByRole('dialog', { name: 'Business 360 actions' });
  await expect(businessActions).toBeVisible();
  await businessActions.getByRole('button', { name: /Business profile/ }).click();
  const profileDrawer = page.getByRole('dialog', { name: 'Business profile' });
  await expect(profileDrawer).toBeVisible();
  await expect(profileDrawer).toContainText('Legal business name');
  await expect(profileDrawer).toContainText('State registration / file number');
  await expect(profileDrawer).toContainText('Website');
  await expect(profileDrawer).toContainText('License applicability');
  await expect(profileDrawer).toContainText('License search');
  await expect(profileDrawer).toContainText('Trusted business access & security');
  await expect(profileDrawer).toContainText('Authorized users');
  await expect(profileDrawer).toContainText('Last successful login');
  await profileDrawer.getByRole('button', { name: 'Close Business profile' }).click();

  await page.getByRole('button', { name: 'Open Business 360 actions' }).click();
  await page.getByRole('dialog', { name: 'Business 360 actions' })
    .getByRole('button', { name: /Owners & control/ })
    .click();
  const ownerDrawer = page.getByRole('dialog', { name: 'Owners & control' });
  await expect(ownerDrawer).toBeVisible();
  await expect(ownerDrawer).toContainText('Training ID');
  await expect(ownerDrawer).toContainText('Current residential address');
  await expect(ownerDrawer).toContainText('Previous residential address');
  await expect(ownerDrawer).toContainText('Personal accounts');
  await expect(ownerDrawer).toContainText('Destination ID');
  await expect(ownerDrawer).toContainText('Bank Code');
  await expect(ownerDrawer).toContainText('Trusted devices');
  await expect(ownerDrawer).toContainText('Contact history');
  await ownerDrawer.getByRole('button', { name: 'Close Owners & control' }).click();

  await page.getByRole('button', { name: 'Open Luna Business Research' }).click();
  const researchDrawer = page.getByRole('dialog', { name: 'Luna Business Research' });
  await expect(researchDrawer).toBeVisible();
  await expect(researchDrawer).toContainText('not proof that the business does not exist');
  expect(await researchDrawer.locator('[data-research-status]').count()).toBeGreaterThan(0);
  await researchDrawer.getByRole('button', { name: 'Close Luna Business Research' }).click();

  await assertMobileGeometry(page, business);
  await capture(page, 'business-360-reference');
});
