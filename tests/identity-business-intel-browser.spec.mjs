import { test, expect } from '@playwright/test';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import { getBusiness360Dossier } from '../src/data/business360Dossier.js';
import { selectToolGroup } from './workspace-page-helpers.mjs';

const businessCase = createGeneratedCase({
  index: 97241,
  customerType: 'business',
  productType: 'payroll-product',
  workflowType: 'payroll-change-alert',
  difficulty: 'standard',
  evidenceDepth: 'deep',
});
const businessDossier = getBusiness360Dossier(businessCase);
const forbiddenReferenceConclusions = /\b(?:High Confidence|Very Strong Match|Verified Business|Low Risk|AI Verified|Risk Score)\b/i;

async function useMobileLayout(page, generatedCases = []) {
  await page.addInitScript((cases) => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
    window.localStorage.setItem('fraud-academy-generated-cases-v1', JSON.stringify(cases));
    window.localStorage.removeItem('fraud-academy-completed-tools-v1');
    window.localStorage.removeItem('fraud-academy-notes-v1');
    window.localStorage.removeItem('fraud-academy-pinned-v1');
  }, generatedCases);
}

async function openIdentityIntel(page) {
  await page.goto('/');
  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing).toBeVisible();
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();
  const customer360 = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer360).toBeVisible();
  await customer360.getByRole('navigation', { name: 'Customer 360 related tools' })
    .getByRole('button', { name: 'Identity Intel', exact: true })
    .click();
  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Identity Intel / People Search');
  return toolPanel;
}

async function assertContained(page, selector) {
  const layout = await page.evaluate((target) => {
    const element = document.querySelector(target);
    const box = element?.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      left: box?.left,
      right: box?.right,
    };
  }, selector);
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.left).toBeGreaterThanOrEqual(-1);
  expect(layout.right).toBeLessThanOrEqual(layout.viewportWidth + 1);
}

test('Identity Intelligence uses search-first reference UI without changing its real report workflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Dedicated reference page is mobile-only.');
  await useMobileLayout(page);
  const toolPanel = await openIdentityIntel(page);
  const missionPage = page.locator('[data-identity-intel-reference-page="true"]');
  const identityPage = missionPage.locator('[data-mobile-identity-intel-reference="true"]');

  await expect(identityPage).toBeVisible();
  await expect(identityPage.getByRole('heading', { name: 'Identity Intel / People Search', exact: true })).toBeVisible();
  await expect(identityPage.getByLabel('Luna debrief is available after submission')).toContainText('After submit');
  await expect(toolPanel.locator(':scope > .investigation-tool-header')).toBeHidden();
  await expect(toolPanel.locator(':scope > .investigation-tool-question')).toBeHidden();
  await expect(toolPanel.locator(':scope > .investigation-tool-controls')).toBeHidden();
  await expect(identityPage.getByText('Identity report hidden until a search is run.', { exact: true })).toBeVisible();
  await expect(identityPage.locator('.identity-intel-summary')).toHaveCount(0);

  const idSearch = identityPage.getByRole('textbox', { name: 'Search Identity Intel by Training ID' });
  await idSearch.fill('TRN-NO-MATCH');
  await identityPage.getByRole('button', { name: 'Run People Search', exact: true }).click();
  await expect(identityPage.getByText('No fictional identity match returned for this search.', { exact: true })).toBeVisible();
  await expect(identityPage.locator('.identity-intel-summary')).toHaveCount(0);

  await idSearch.fill('TRN-8842-19');
  await identityPage.getByRole('button', { name: 'Run People Search', exact: true }).click();
  await expect(identityPage.getByRole('region', { name: 'Identity Match Summary' })).toContainText('Maya Sterling');
  await expect(identityPage.locator('.identity-intel-summary dl > div')).toHaveCount(10);
  await expect(identityPage.locator('.identity-intel-counts article')).toHaveCount(12);
  await expect(identityPage.getByRole('heading', { name: 'Personal Profile', exact: true })).toBeVisible();
  await expect(identityPage.getByRole('heading', { name: 'Linked Identifiers', exact: true })).toBeVisible();
  await expect(identityPage.getByRole('heading', { name: 'Background Report Summary', exact: true })).toBeVisible();
  expect(await identityPage.innerText()).not.toMatch(forbiddenReferenceConclusions);

  await identityPage.getByRole('button', { name: 'View Full Profile Report', exact: true }).click();
  await expect(identityPage.locator('.identity-intel-section-buttons button')).toHaveCount(17);
  await expect(identityPage.getByRole('heading', { name: 'Criteria and matched objects', exact: true })).toBeVisible();
  await expect(identityPage.getByRole('heading', { name: 'Identity Summary', exact: true })).toBeVisible();
  await identityPage.locator('.identity-intel-section-buttons button').filter({ hasText: /^Email History/ }).click();
  await expect(identityPage.getByRole('heading', { name: 'Email History', exact: true })).toBeVisible();
  await identityPage.getByRole('button', { name: 'Pin profile', exact: true }).click();
  await identityPage.getByRole('button', { name: 'Save section note', exact: true }).click();
  await identityPage.getByRole('button', { name: 'Mark Identity Intel / People Search reviewed', exact: true }).click();
  await expect(identityPage.getByRole('button', { name: '✓ Identity Intel / People Search reviewed', exact: true })).toBeVisible();

  await idSearch.fill('TRN-STALE-RESULT');
  await identityPage.getByRole('button', { name: 'Run People Search', exact: true }).click();
  await expect(identityPage.locator('.identity-intel-summary')).toHaveCount(0);
  await expect(identityPage.locator('.identity-intel-report')).toHaveCount(0);
  await assertContained(page, '[data-mobile-identity-intel-reference="true"]');
});

test('Business Intelligence searches the canonical Business 360 record before revealing detailed Intel', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Dedicated reference page is mobile-only.');
  await useMobileLayout(page, [businessCase]);
  await page.goto('/');
  const caseSelector = page.locator('.visual-case-switcher select').first();
  await expect(caseSelector.locator(`option[value="${businessCase.id}"]`)).toHaveCount(1);
  await caseSelector.selectOption(businessCase.id);
  await selectToolGroup(page, /Business & Payment Verification/);

  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const toolSelect = toolPanel.getByRole('combobox', { name: 'Choose investigation tool' });
  await toolSelect.selectOption('Business 360');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Business 360');

  const missionPage = page.locator('[data-business-intel-reference-page="true"]');
  const businessPage = missionPage.locator('[data-mobile-business-intel-reference="true"]');
  await expect(businessPage).toBeVisible();
  await expect(businessPage.getByRole('heading', { name: 'Business 360', exact: true })).toBeVisible();
  await expect(businessPage.getByText('Business Intel hidden until a search is run.', { exact: true })).toBeVisible();
  await expect(businessPage.getByRole('region', { name: 'Business Match Summary' })).toHaveCount(0);
  await expect(toolPanel.locator(':scope > .investigation-tool-header')).toBeHidden();
  await expect(toolPanel.locator(':scope > .investigation-tool-question')).toBeHidden();
  await expect(toolPanel.locator(':scope > .investigation-tool-controls')).toBeHidden();

  const nameSearch = businessPage.getByRole('textbox', { name: 'Search Business Intelligence by legal business name' });
  const idSearch = businessPage.getByRole('textbox', { name: 'Search Business Intelligence by Training Business ID' });
  await nameSearch.fill(businessDossier.profile.legalName);
  await idSearch.fill('BIZ-NO-MATCH');
  await businessPage.getByRole('button', { name: 'Run Business Search', exact: true }).click();
  await expect(businessPage.getByText('No matching fictional business returned.', { exact: true })).toBeVisible();
  await expect(businessPage.getByRole('region', { name: 'Business Match Summary' })).toHaveCount(0);

  await idSearch.fill(businessDossier.profile.registrationFileNumber);
  await businessPage.getByRole('button', { name: 'Run Business Search', exact: true }).click();
  const summary = businessPage.getByRole('region', { name: 'Business Match Summary' });
  await expect(summary).toContainText(businessDossier.profile.legalName);
  await expect(summary).toContainText(businessDossier.profile.registrationFileNumber);
  await expect(businessPage.getByRole('heading', { name: 'Business Profile', exact: true })).toBeVisible();
  await expect(businessPage.getByRole('heading', { name: 'License & EIN', exact: true })).toBeVisible();
  await expect(businessPage.getByRole('heading', { name: 'Payroll / Direct Deposit History', exact: true })).toBeVisible();
  await expect(businessPage.getByRole('heading', { name: 'Employee Roster Snapshot', exact: true })).toBeVisible();
  await expect(businessPage.getByRole('heading', { name: 'Verification Notes', exact: true })).toBeVisible();
  await expect(businessPage.getByRole('heading', { name: 'Business Source Coverage', exact: true })).toBeVisible();
  expect(await businessPage.innerText()).not.toMatch(forbiddenReferenceConclusions);

  await businessPage.getByRole('button', { name: 'View Detailed Business Intel', exact: true }).click();
  const tabs = businessPage.getByRole('tablist', { name: 'Business 360 sections' });
  await expect(tabs).toBeVisible();
  await expect(businessPage.getByRole('heading', { name: 'Business Information', exact: true })).toBeVisible();
  await tabs.getByRole('tab', { name: 'Owners & Control', exact: true }).click();
  await expect(businessPage.locator('[data-business-owner]').first()).toBeVisible();
  await businessPage.locator('[data-business-owner]').first().getByRole('button', { name: 'Open Owner Profile', exact: true }).click();
  await expect(businessPage.locator('.business-360-owner-profile')).toBeVisible();
  await businessPage.locator('.business-360-owner-profile').getByRole('button', { name: 'Close', exact: true }).click();
  await tabs.getByRole('tab', { name: 'Accounts & Products', exact: true }).click();
  await expect(businessPage.locator('[data-business-account]').first()).toBeVisible();
  await tabs.getByRole('tab', { name: 'Luna Business Research', exact: true }).click();
  await expect(businessPage.getByText('A missing or conflicting record is a source result, not proof', { exact: false })).toBeVisible();

  await summary.getByRole('button', { name: 'Pin business', exact: true }).click();
  await summary.getByRole('button', { name: 'Save summary note', exact: true }).click();
  await businessPage.getByRole('button', { name: 'Mark Business Intelligence reviewed', exact: true }).click();
  await expect(businessPage.getByRole('button', { name: '✓ Business Intelligence reviewed', exact: true })).toBeVisible();

  await idSearch.fill('BIZ-STALE-RESULT');
  await businessPage.getByRole('button', { name: 'Run Business Search', exact: true }).click();
  await expect(businessPage.getByRole('region', { name: 'Business Match Summary' })).toHaveCount(0);
  await expect(businessPage.locator('.business-360-section')).toHaveCount(0);
  await assertContained(page, '[data-mobile-business-intel-reference="true"]');
});
