import { test, expect } from '@playwright/test';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import { getBusiness360Dossier } from '../src/data/business360Dossier.js';
import {
  activeCaseSelector,
  selectToolGroup,
} from './workspace-page-helpers.mjs';

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
    window.localStorage.removeItem('fraud-academy-business-intel-workspace-v1');
  }, generatedCases);
}

async function openIdentityIntel(page) {
  await page.goto('/');
  const briefing = page.locator('[data-workspace-page="briefing"]');
  await expect(briefing).toBeVisible();
  await briefing.getByRole('navigation', { name: 'Case briefing files' })
    .getByRole('button', { name: 'Investigation launchpad', exact: true })
    .click();
  await briefing.getByRole('button', { name: /Begin investigation/i }).click();
  await selectToolGroup(page, /Identity & Customer/, 'Identity Intel / People Search');
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

async function openGeneratedBusinessSearch(page) {
  await useMobileLayout(page, [businessCase]);
  await page.goto('/');
  const caseSelector = activeCaseSelector(page);
  await expect(caseSelector.locator(`option[value="${businessCase.id}"]`)).toHaveCount(1);
  await caseSelector.selectOption(businessCase.id);
  await selectToolGroup(page, /Business & Payment Verification/, 'Business 360');
  const businessPage = page.locator('[data-mobile-business-intel-reference="true"]');
  await expect(businessPage).toHaveAttribute('data-business-intelligence-stage', 'search');
  return businessPage;
}

async function runBusinessIdSearch(businessPage) {
  await businessPage.getByRole('textbox', { name: 'Search Business Intelligence by legal business name' })
    .fill(businessDossier.profile.legalName);
  await businessPage.getByRole('textbox', { name: 'Search Business Intelligence by Training Business ID' })
    .fill(businessDossier.profile.registrationFileNumber);
  await businessPage.getByRole('button', { name: 'Run Business Search', exact: true }).click();
  const summary = businessPage.getByRole('region', { name: 'Business Match Summary' });
  await expect(summary).toContainText(businessDossier.profile.registrationFileNumber);
  return summary;
}

async function reopenThroughRoutedBusinessPin(page, businessPage) {
  const summary = await runBusinessIdSearch(businessPage);
  await summary.getByRole('button', { name: 'Pin business', exact: true }).click();
  await businessPage.getByRole('button', { name: 'Back to Tool Map', exact: true }).click();
  const map = page.locator('[data-mobile-tool-map="reference-v1"]');
  await expect(map).toBeVisible();
  await map.getByRole('button', { name: 'Open Pinned Evidence from Tool Map', exact: true }).click();
  await page.getByRole('button', {
    name: new RegExp(`Open pinned evidence ${businessDossier.profile.registrationFileNumber}`),
  }).click();
  await expect(businessPage).toHaveAttribute('data-business-intelligence-stage', 'search');
  await expect(
    businessPage.getByRole('textbox', { name: 'Search Business Intelligence by Training Business ID' }),
  ).toHaveValue(businessDossier.profile.registrationFileNumber);
}

async function leaveAndReopenBusinessPage(page, businessPage) {
  await businessPage.getByRole('button', { name: 'Back to Tool Map', exact: true }).click();
  await expect(businessPage).toHaveCount(0);
  await selectToolGroup(page, /Business & Payment Verification/, 'Business 360');
  await expect(businessPage).toHaveAttribute('data-business-intelligence-stage', 'search');
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
  const caseSelector = activeCaseSelector(page);
  await expect(caseSelector.locator(`option[value="${businessCase.id}"]`)).toHaveCount(1);
  await caseSelector.selectOption(businessCase.id);
  await selectToolGroup(page, /Business & Payment Verification/, 'Business 360');

  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Business 360');

  const missionPage = page.locator('[data-business-intel-reference-page="true"]');
  const businessPage = missionPage.locator('[data-mobile-business-intel-reference="true"]');
  await expect(businessPage).toBeVisible();
  await expect(businessPage.getByRole('heading', { name: 'Business Intelligence', exact: true })).toBeVisible();
  await expect(page.locator('[data-mobile-360-header="true"]')).toHaveCount(0);
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
  await expect(businessPage).toHaveAttribute('data-business-intelligence-stage', 'search');
  expect(await businessPage.innerText()).not.toMatch(forbiddenReferenceConclusions);

  await summary.getByRole('button', { name: 'Pin business', exact: true }).click();
  await summary.getByRole('button', { name: 'Save summary note', exact: true }).click();
  await businessPage.getByRole('button', { name: 'Open Business 360', exact: true }).click();
  await expect(businessPage).toHaveAttribute('data-business-intelligence-stage', 'business-360');
  const businessBoard = businessPage.locator('[data-mobile-360-screen="business"]');
  await expect(businessBoard).toBeVisible();
  await expect(businessBoard.getByRole('heading', { name: businessDossier.profile.legalName, exact: true })).toBeVisible();
  await expect(businessBoard.getByRole('heading', { name: 'Business products & accounts', exact: true })).toBeVisible();
  await expect(businessBoard.getByRole('heading', { name: 'Credit & loans', exact: true })).toBeVisible();
  await expect(businessBoard.getByRole('heading', { name: 'Payroll overview', exact: true })).toBeVisible();
  await expect(businessBoard.getByRole('heading', { name: 'Business updates', exact: true })).toBeVisible();
  await expect(businessBoard.getByRole('heading', { name: 'Recent notes', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate((caseId) => {
    const saved = JSON.parse(localStorage.getItem('fraud-academy-business-intel-workspace-v1') || '{}');
    return saved[caseId];
  }, businessCase.id)).toMatchObject({
    submittedSearch: {
      mode: 'businessId',
      businessName: businessDossier.profile.legalName,
      secondary: businessDossier.profile.registrationFileNumber,
    },
    intelReportOpen: true,
  });
  await businessPage.getByRole('button', { name: 'Back to Business Intelligence', exact: true }).click();
  await expect(businessPage).toHaveAttribute('data-business-intelligence-stage', 'search');
  await expect(nameSearch).toHaveValue(businessDossier.profile.legalName);
  await expect(idSearch).toHaveValue(businessDossier.profile.registrationFileNumber);
  await businessPage.getByRole('button', { name: 'Open Business 360', exact: true }).click();
  await expect(businessPage).toHaveAttribute('data-business-intelligence-stage', 'business-360');
  await expect(businessPage.locator('[data-mobile-360-screen="business"]')).toBeVisible();
  await businessBoard.locator('[data-360-account]').first().click();
  const accountDrawer = page.getByRole('dialog', { name: 'Business products & accounts' });
  await expect(accountDrawer).toContainText('Destination ID');
  await expect(accountDrawer).toContainText('Bank Code');
  await accountDrawer.getByRole('button', { name: 'Close Business products & accounts' }).click();

  await businessPage.getByRole('button', { name: 'Mark Business Intelligence reviewed', exact: true }).click();
  await expect(businessPage.getByRole('button', { name: '✓ Business Intelligence reviewed', exact: true })).toBeVisible();

  await businessPage.getByRole('button', { name: 'Back to Business Intelligence', exact: true }).click();
  await expect(businessPage).toHaveAttribute('data-business-intelligence-stage', 'search');
  await expect(nameSearch).toHaveValue(businessDossier.profile.legalName);
  await expect(idSearch).toHaveValue(businessDossier.profile.registrationFileNumber);
  await idSearch.fill('BIZ-STALE-RESULT');
  await businessPage.getByRole('button', { name: 'Run Business Search', exact: true }).click();
  await expect(businessPage.getByRole('region', { name: 'Business Match Summary' })).toHaveCount(0);
  await expect(businessPage.locator('.business-360-section')).toHaveCount(0);
  await assertContained(page, '[data-mobile-business-intel-reference="true"]');
});

test('routed Business ID stays cleared after leaving and reopening Business Intelligence', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Dedicated reference page is mobile-only.');
  const businessPage = await openGeneratedBusinessSearch(page);
  await reopenThroughRoutedBusinessPin(page, businessPage);

  await businessPage.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(businessPage.getByText('Business Intel hidden until a search is run.', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate((caseId) => {
    const saved = JSON.parse(localStorage.getItem('fraud-academy-business-intel-workspace-v1') || '{}');
    return saved[caseId]?.relationshipId;
  }, businessCase.id)).toBe('');
  await leaveAndReopenBusinessPage(page, businessPage);

  await expect(
    businessPage.getByRole('textbox', { name: 'Search Business Intelligence by legal business name' }),
  ).toHaveValue('');
  await expect(
    businessPage.getByRole('textbox', { name: 'Search Business Intelligence by Training Business ID' }),
  ).toHaveValue('');
  await expect(businessPage.getByRole('region', { name: 'Business Match Summary' })).toHaveCount(0);
});

test('new phone search replaces a routed Business ID after leaving and reopening Business Intelligence', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Dedicated reference page is mobile-only.');
  const businessPage = await openGeneratedBusinessSearch(page);
  await reopenThroughRoutedBusinessPin(page, businessPage);

  await businessPage.getByRole('combobox', { name: 'Choose Business Intelligence search method' })
    .selectOption('phone');
  await businessPage.getByRole('textbox', { name: 'Search Business Intelligence by legal business name' })
    .fill(businessDossier.profile.legalName);
  await businessPage.getByRole('textbox', { name: 'Search Business Intelligence by Business phone' })
    .fill(businessDossier.profile.phone);
  await businessPage.getByRole('button', { name: 'Run Business Search', exact: true }).click();
  await expect(businessPage.getByRole('region', { name: 'Business Match Summary' }))
    .toContainText(businessDossier.profile.legalName);
  await expect.poll(() => page.evaluate((caseId) => {
    const saved = JSON.parse(localStorage.getItem('fraud-academy-business-intel-workspace-v1') || '{}');
    return saved[caseId];
  }, businessCase.id)).toMatchObject({
    relationshipId: businessDossier.profile.registrationFileNumber,
    submittedSearch: {
      mode: 'phone',
      businessName: businessDossier.profile.legalName,
      secondary: businessDossier.profile.phone,
    },
  });

  await leaveAndReopenBusinessPage(page, businessPage);
  await expect(
    businessPage.getByRole('combobox', { name: 'Choose Business Intelligence search method' }),
  ).toHaveValue('phone');
  await expect(
    businessPage.getByRole('textbox', { name: 'Search Business Intelligence by Business phone' }),
  ).toHaveValue(businessDossier.profile.phone);
  await expect(
    businessPage.getByRole('textbox', { name: 'Search Business Intelligence by Training Business ID' }),
  ).toHaveCount(0);
  await expect(businessPage.getByRole('region', { name: 'Business Match Summary' }))
    .toContainText(businessDossier.profile.registrationFileNumber);
});
