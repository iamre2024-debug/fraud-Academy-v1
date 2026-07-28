import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getBusiness360Dossier } from '../src/data/business360Dossier.js';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import { openToolGroups, selectToolGroup } from './workspace-page-helpers.mjs';

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
const payrollDossier = getBusiness360Dossier(payrollCase);

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

async function openCustomer360FromTools(page) {
  await selectToolGroup(page, /Identity & Customer/);
  const customer = page.locator('[data-mobile-360-screen="customer"]');
  if (!(await customer.isVisible())) {
    const toolSelector = page.locator('[data-investigation-tools-screen="approved-theme-v1"]')
      .getByRole('combobox', { name: 'Choose investigation tool' });
    await expect(toolSelector).toBeVisible();
    await toolSelector.selectOption('Customer 360');
  }
  await expect(customer).toBeVisible();
  return customer;
}

async function openBusinessIntel(page) {
  await page.addInitScript((record) => {
    window.localStorage.setItem('fraud-academy-generated-cases-v1', JSON.stringify([record]));
  }, payrollCase);
  await page.goto('/');
  const caseSelector = page.getByRole('combobox', { name: 'Choose active mission case' }).first();
  await expect(caseSelector.locator(`option[value="${payrollCase.id}"]`)).toHaveCount(1);
  await caseSelector.selectOption(payrollCase.id);
  await selectToolGroup(page, /Business & Payment Verification/);
  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await toolPanel.getByRole('combobox', { name: 'Choose investigation tool' }).selectOption('Business 360');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Business 360');
  const businessPage = page.locator('[data-mobile-business-intel-reference="true"]');
  await expect(businessPage).toBeVisible();
  return { businessPage, toolPanel };
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
  await expect(customerActions.getByRole('button', { name: /Pinned Evidence/ })).toBeVisible();
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
  await page.getByRole('button', { name: 'Open Customer 360 actions' }).click();
  await page.getByRole('dialog', { name: 'Customer 360 actions' })
    .getByRole('button', { name: /Pinned Evidence/ })
    .click();
  const profilePin = page.getByRole('button', {
    name: 'Open pinned evidence TRN-8842-19 · Maya Sterling',
  });
  await expect(profilePin).toBeVisible();
  await profilePin.click();
  await expect(page.locator('[data-opened-pinned-evidence="true"]')).toContainText('TRN-8842-19 · Maya Sterling');
  await expect(page.locator('[data-mobile-360-screen="customer"]')).toContainText('Maya Sterling');
  await expect(page.locator('[data-mobile-360-screen="customer"]')).toContainText('TRN-8842-19');

  await page.getByRole('button', { name: 'Open Customer 360 actions' }).click();
  await page.getByRole('dialog', { name: 'Customer 360 actions' })
    .getByRole('button', { name: /Customer profile/ })
    .click();
  await page.getByRole('dialog', { name: 'Customer profile' })
    .getByRole('button', { name: 'Close Customer profile' })
    .click();
  await openCustomer360FromTools(page);
  await expect(page.getByRole('dialog', { name: 'Customer profile' })).toHaveCount(0);

  await assertMobileGeometry(page, customer);
  await capture(page, 'customer-360-reference');
});

test('mobile Business Intelligence stays search-first and opens the active business dossier', async ({ page }) => {
  const { businessPage, toolPanel } = await openBusinessIntel(page);

  await expect(businessPage.getByText('Business Intel hidden until a search is run.', { exact: true })).toBeVisible();
  await expect(businessPage.getByRole('region', { name: 'Business Match Summary' })).toHaveCount(0);
  await expect(toolPanel.locator(':scope > .investigation-tool-header')).toBeHidden();
  await expect(toolPanel.locator(':scope > .investigation-tool-question')).toBeHidden();
  await expect(toolPanel.locator(':scope > .investigation-tool-controls')).toBeHidden();

  const nameSearch = businessPage.getByRole('textbox', { name: 'Search Business Intelligence by legal business name' });
  const idSearch = businessPage.getByRole('textbox', { name: 'Search Business Intelligence by Training Business ID' });
  await nameSearch.fill(payrollDossier.profile.legalName);
  await idSearch.fill('BIZ-NO-MATCH');
  await businessPage.getByRole('button', { name: 'Run Business Search', exact: true }).click();
  await expect(businessPage.getByText('No matching fictional business returned.', { exact: true })).toBeVisible();

  await idSearch.fill(payrollDossier.profile.registrationFileNumber);
  await businessPage.getByRole('button', { name: 'Run Business Search', exact: true }).click();
  const summary = businessPage.getByRole('region', { name: 'Business Match Summary' });
  await expect(summary).toContainText(payrollDossier.profile.legalName);
  await expect(summary).toContainText(payrollDossier.profile.registrationFileNumber);
  await expect(businessPage.getByRole('heading', { name: 'Business Profile', exact: true })).toBeVisible();
  await expect(businessPage.getByRole('heading', { name: 'License & EIN', exact: true })).toBeVisible();
  await expect(businessPage.getByRole('heading', { name: 'Payroll / Direct Deposit History', exact: true })).toBeVisible();
  await expect(businessPage.getByRole('heading', { name: 'Employee Roster Snapshot', exact: true })).toBeVisible();
  await expect(businessPage.getByRole('heading', { name: 'Verification Notes', exact: true })).toBeVisible();
  await expect(businessPage).not.toContainText(payrollCase.alertReason);
  await expect(businessPage).not.toContainText(payrollCase.scenarioTitle);
  await expect(businessPage).toHaveAttribute('data-business-intelligence-stage', 'search');

  await summary.getByRole('button', { name: 'Pin business', exact: true }).click();
  await summary.getByRole('button', { name: 'Save summary note', exact: true }).click();
  await businessPage.getByRole('button', { name: 'Open Business 360', exact: true }).click();
  await expect(businessPage).toHaveAttribute('data-business-intelligence-stage', 'business-360');
  const businessBoard = businessPage.locator('[data-mobile-360-screen="business"]');
  await expect(businessBoard).toBeVisible();
  await expect(businessBoard.getByRole('heading', { name: payrollDossier.profile.legalName, exact: true })).toBeVisible();
  await expect(businessBoard.getByRole('heading', { name: 'Business products & accounts', exact: true })).toBeVisible();
  await expect(businessBoard.getByRole('heading', { name: 'Credit & loans', exact: true })).toBeVisible();
  await expect(businessBoard.getByRole('heading', { name: 'Payroll overview', exact: true })).toBeVisible();
  await expect(businessBoard.getByRole('heading', { name: 'Business updates', exact: true })).toBeVisible();
  await expect(businessBoard.getByRole('heading', { name: 'Recent notes', exact: true })).toBeVisible();
  await businessBoard.locator('[data-360-account]').first().click();
  const accountDrawer = page.getByRole('dialog', { name: 'Business products & accounts' });
  await expect(accountDrawer).toContainText('Destination ID');
  await expect(accountDrawer).toContainText('Bank Code');
  await accountDrawer.getByRole('button', { name: 'Close Business products & accounts' }).click();

  await businessPage.getByRole('button', { name: 'Mark Business Intelligence reviewed', exact: true }).click();
  await expect(businessPage.getByRole('button', { name: '✓ Business Intelligence reviewed', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Open mission pages', exact: true }).click();
  await page.getByRole('button', { name: /Investigate/ }).click();
  const map = page.locator('[data-mobile-tool-map="reference-v1"]');
  await map.getByRole('button', { name: /Pinned Evidence/ }).click();
  const businessPin = page.getByRole('button', {
    name: new RegExp(`Open pinned evidence ${payrollDossier.profile.registrationFileNumber}`),
  });
  await expect(businessPin).toBeVisible();
  await businessPin.click();
  await expect(page.locator('[data-mobile-business-intel-reference="true"]'))
    .toHaveAttribute('data-business-360-profile', payrollDossier.profile.registrationFileNumber);
  await assertMobileGeometry(page, businessPage);
  await capture(page, 'business-360-reference');

  await page.locator('[data-mobile-business-intel-reference="true"]')
    .getByRole('button', { name: 'Open Submit Decision', exact: true })
    .click();
  await expect(page.locator('[data-mobile-review-screen="determination"]'))
    .toHaveAttribute('data-case-id', payrollCase.id);
});

test('personal credit review does not restore business or payroll-only tools', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Choose active mission case' }).selectOption('FA-CR-24003');
  const launchpad = page.getByRole('navigation', { name: 'Case briefing files' })
    .getByRole('button', { name: 'Investigation launchpad' });
  if (await launchpad.isVisible()) await launchpad.click();
  await page.getByRole('button', { name: /Begin investigation/i }).click();

  const customer = page.locator('[data-mobile-360-screen="customer"]');
  await expect(customer).toBeVisible();
  await expect(customer).toContainText('Avery Brooks');
  await expect(customer).toContainText('TRN-2044-77');

  await page.getByRole('button', { name: 'Open Customer 360 actions' }).click();
  await page.getByRole('dialog', { name: 'Customer 360 actions' })
    .getByRole('button', { name: /Relationship/ })
    .click();
  const relationshipDrawer = page.getByRole('dialog', { name: 'Relationship details' });
  await expect(relationshipDrawer).not.toContainText('Lakeside Office Supply LLC');
  await expect(relationshipDrawer.getByRole('button', { name: 'Open Business 360' })).toHaveCount(0);
  await relationshipDrawer.getByRole('button', { name: 'Close Relationship' }).click();

  await page.getByRole('button', { name: 'Open Customer 360 actions' }).click();
  await page.getByRole('dialog', { name: 'Customer 360 actions' })
    .getByRole('button', { name: /All tools/ })
    .click();
  const toolMap = await openToolGroups(page);
  await toolMap.locator('.mobile-tool-map-cluster')
    .filter({ hasText: 'Business & Payment Verification' })
    .click();
  const businessTray = toolMap.getByRole('region', { name: 'Business & Payment Verification tools' });
  await expect(businessTray.getByRole('button', { name: /Payment Verification/ })).toBeVisible();
  await expect(businessTray.getByRole('button', { name: /Business 360/ })).toHaveCount(0);
  await expect(businessTray.getByRole('button', { name: /Employee Profile/ })).toHaveCount(0);
  await expect(businessTray.getByRole('button', { name: /Payroll History/ })).toHaveCount(0);
});

test('mobile case switching replaces Customer 360 identity, accounts, and security state', async ({ page }) => {
  let customer = await openInitialCustomer360(page);
  await expect(customer).toContainText('Maya Sterling');
  await customer.locator('[data-360-account]').first().click();
  await page.getByRole('dialog', { name: 'Accounts & products' })
    .getByRole('button', { name: 'Close Accounts & products' })
    .click();

  await page.getByRole('button', { name: 'Back to previous mission screen' }).click();
  const caseSelector = page.getByRole('combobox', { name: 'Choose active mission case' });
  await expect(caseSelector).toBeVisible();
  await caseSelector.selectOption('FA-CB-24007');

  customer = await openCustomer360FromTools(page);
  await expect(customer).toContainText('Jordan Ellis');
  await expect(customer).toContainText('TRN-5510-06');
  await expect(customer).not.toContainText('Maya Sterling');
  await expect(customer.locator('[data-360-account="CARD-24007-8841"]')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Accounts & products' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Back to previous mission screen' }).click();
  await page.getByRole('combobox', { name: 'Choose active mission case' }).selectOption('FA-CR-24003');

  customer = await openCustomer360FromTools(page);
  await expect(customer).toContainText('Avery Brooks');
  await expect(customer).toContainText('TRN-2044-77');
  await expect(customer).not.toContainText('Jordan Ellis');
  await expect(customer).not.toContainText('Maya Sterling');
  await expect(customer.locator('[data-360-account="LINE-24003-3011"]')).toBeVisible();

  await page.getByRole('button', { name: 'Open Customer 360 actions' }).click();
  await page.getByRole('dialog', { name: 'Customer 360 actions' })
    .getByRole('button', { name: /Trusted devices & security/ })
    .click();
  const securityDrawer = page.getByRole('dialog', { name: 'Trusted devices & security' });
  await expect(securityDrawer).toContainText('DEV-AVERY-SAF-001');
  await expect(securityDrawer).not.toContainText('DEV-MAYA-IP16-001');
});
