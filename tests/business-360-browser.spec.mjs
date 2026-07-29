import { test, expect } from '@playwright/test';
import { getBusiness360Dossier } from '../src/data/business360Dossier.js';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import { selectToolGroup } from './workspace-page-helpers.mjs';

const allowedResearchStatuses = new Set([
  'Verified match',
  'Partial match',
  'Conflicting information',
  'No record located',
  'Unable to verify',
  'Not applicable',
]);

const forbiddenHiddenConclusion = /\b(?:Fraud Confirmed|Fraud Not Found|Synthetic Identity|Bust[- ]Out|First[- ]Party Fraud|Mule Activity|Email Compromise|Compromised Mailbox|Correct Determination|Scenario Truth|Final Finding)\b/i;

const businessApplicationCase = createGeneratedCase({
  index: 96001,
  customerType: 'business',
  productType: 'business-loan',
  workflowType: 'credit-application-review',
  difficulty: 'standard',
  evidenceDepth: 'standard',
});

const payrollCase = createGeneratedCase({
  index: 96002,
  customerType: 'business',
  productType: 'payroll-product',
  workflowType: 'payroll-change-alert',
  difficulty: 'standard',
  evidenceDepth: 'standard',
});

const sparseBusinessCase = {
  ...businessApplicationCase,
  id: 'FA-BIZ-SPARSE-96003',
  person: 'Taylor Morgan',
  trainingId: 'TRN-SPARSE-96003',
  legacyDerivedEvidence: true,
  relationshipDataVersion: 0,
  businessProfile: {
    businessId: 'BIZ-SPARSE-96003',
    legalName: 'Sparse Training Services LLC',
    registrationFileNumber: 'TX-SOS-SPARSE-96003',
  },
  customer: {},
  toolResults: {},
  relationshipAccounts: [],
  parties: [],
  loginHistory: [],
  availableTools: ['Business 360'],
  requiredTools: [],
};

async function seedGeneratedCase(page, caseRecord) {
  await page.addInitScript((record) => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'desktop');
    window.localStorage.setItem('fraud-academy-generated-cases-v1', JSON.stringify([record]));
    window.localStorage.removeItem('fraud-academy-review-packages-v1');
    window.localStorage.removeItem('fraud-academy-decision-drafts-v1');
    window.localStorage.removeItem('fraud-academy-business-intel-workspace-v1');
  }, caseRecord);
}

async function openBusiness360(page, caseRecord) {
  await page.goto('/');
  const caseSelector = page.locator('.visual-case-switcher select').first();
  await expect(caseSelector.locator(`option[value="${caseRecord.id}"]`)).toHaveCount(1);
  await caseSelector.selectOption(caseRecord.id);
  await expect(caseSelector).toHaveValue(caseRecord.id);

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing).toBeVisible();
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();
  await selectToolGroup(page, /Business & Payment Verification/, 'Business 360');

  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const toolSelect = toolPanel.getByRole('combobox', { name: 'Choose investigation tool' });
  if (await toolSelect.inputValue() !== 'Business 360') await toolSelect.selectOption('Business 360');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Business 360');

  const searchStage = toolPanel.locator('[data-business-intelligence-stage="search"]');
  await expect(searchStage).toBeVisible();
  await expect(toolPanel.locator('[data-business-intelligence-stage="business-360"]')).toHaveCount(0);
  await expect(searchStage.getByText('Business Intel hidden until a search is run.', { exact: true })).toBeVisible();

  const dossier = getBusiness360Dossier(caseRecord);
  await searchStage.getByRole('textbox', { name: 'Search Business Intelligence by legal business name' })
    .fill(dossier.profile.legalName);
  await searchStage.getByRole('textbox', { name: 'Search Business Intelligence by Training Business ID' })
    .fill(dossier.profile.registrationFileNumber);
  await searchStage.getByRole('button', { name: 'Run Business Search', exact: true }).click();
  const matchSummary = searchStage.getByRole('region', { name: 'Business Match Summary' });
  await expect(matchSummary).toContainText(dossier.profile.legalName);
  await expect(toolPanel.locator('[data-business-intelligence-stage="business-360"]')).toHaveCount(0);
  await matchSummary.getByRole('button', { name: 'Open Business 360', exact: true }).click();

  const business360 = toolPanel.locator('[data-business-intelligence-stage="business-360"]');
  await expect(business360).toBeVisible();
  return { business360, toolPanel };
}

async function fieldValue(section, label) {
  const field = section.getByText(label, { exact: true }).locator('..');
  await expect(field).toBeVisible();
  return field.locator('dd').innerText();
}

async function assertWithinViewport(page, locator) {
  const layout = await locator.evaluate((panel) => {
    const box = panel.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      left: box.left,
      right: box.right,
      width: box.width,
    };
  });
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.left).toBeGreaterThanOrEqual(-1);
  expect(layout.right).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.width).toBeGreaterThan(300);
}

test('Business 360 keeps company, owner, account, and factual research records outside the active case', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 1000 });
  await seedGeneratedCase(page, businessApplicationCase);
  const { business360 } = await openBusiness360(page, businessApplicationCase);
  const tabs = business360.getByRole('tablist', { name: 'Business 360 sections' });
  const observedText = [];

  const profileHeader = business360.locator('.business-360-profile').first();
  await expect(profileHeader.getByRole('heading', { name: businessApplicationCase.profile.business, exact: true })).toBeVisible();
  await expect(profileHeader).not.toContainText(businessApplicationCase.person);
  await expect(profileHeader).not.toContainText(businessApplicationCase.transactionInfo);

  const businessInformation = business360.getByRole('heading', { name: 'Business Information', exact: true }).locator('..').locator('..');
  await expect(businessInformation).toBeVisible();
  for (const label of [
    'Legal business name',
    'DBA',
    'Entity type',
    'Masked EIN',
    'Formation date',
    'Formation state',
    'State registration / file number',
    'Business standing',
    'Physical operating address',
    'Mailing address',
    'Registered-agent name',
    'Registered-agent address',
    'Business phone',
    'Business email',
    'Website',
    'Business age',
    'Customer since',
    'Relationship length',
  ]) {
    await expect(businessInformation.getByText(label, { exact: true })).toBeVisible();
  }
  const operatingAddress = await fieldValue(businessInformation, 'Physical operating address');
  const mailingAddress = await fieldValue(businessInformation, 'Mailing address');
  const registeredAgentAddress = await fieldValue(businessInformation, 'Registered-agent address');
  observedText.push(await business360.innerText());
  await assertWithinViewport(page, business360);

  await tabs.getByRole('tab', { name: 'Owners & Control', exact: true }).click();
  await expect(business360.getByRole('heading', { name: 'Owners and Controlling Parties', exact: true })).toBeVisible();
  const ownerCards = business360.locator('[data-business-owner]');
  expect(await ownerCards.count()).toBeGreaterThanOrEqual(2);
  await expect(ownerCards.first().getByRole('button', { name: 'Open Owner Profile', exact: true })).toBeVisible();
  await expect(business360.getByRole('button', { name: 'Open Employee Profile', exact: true })).toHaveCount(0);
  await ownerCards.first().getByRole('button', { name: 'Open Owner Profile', exact: true }).click();
  const ownerProfile = business360.locator('.business-360-owner-profile');
  await expect(ownerProfile).toBeVisible();
  const ownerAddress = await fieldValue(ownerProfile, 'Current residential address');
  await expect(ownerProfile.getByText('Previous residential address', { exact: true })).toBeVisible();
  expect(new Set([operatingAddress, mailingAddress, registeredAgentAddress, ownerAddress]).size).toBe(4);
  observedText.push(await business360.innerText());

  await tabs.getByRole('tab', { name: 'Accounts & Products', exact: true }).click();
  await expect(business360.getByRole('heading', { name: 'Business Accounts and Products', exact: true })).toBeVisible();
  const accountCards = business360.locator('[data-business-account]');
  expect(await accountCards.count()).toBeGreaterThanOrEqual(2);
  await accountCards.first().getByRole('button', { name: 'Open Account', exact: true }).click();
  const accountDetail = business360.locator('.business-360-account-detail');
  await expect(accountDetail).toBeVisible();
  for (const label of [
    'Account ID',
    'Product type',
    'Open date',
    'Status',
    'Current balance',
    'Available balance',
    'Available credit',
    'Credit limit',
    'Original loan amount',
    'Scheduled / minimum payment',
    'Next payment due',
    'Payment status',
    'Past-due amount',
    'Restrictions',
    'Holds',
  ]) {
    await expect(accountDetail.getByText(label, { exact: true })).toBeVisible();
  }
  observedText.push(await business360.innerText());
  await assertWithinViewport(page, business360);

  for (const tabName of ['Profile Updates', 'Access & Security', 'Contact History']) {
    await tabs.getByRole('tab', { name: tabName, exact: true }).click();
    observedText.push(await business360.innerText());
    await assertWithinViewport(page, business360);
  }

  await tabs.getByRole('tab', { name: 'Business Source Research', exact: true }).click();
  await expect(business360.getByRole('heading', { name: 'Business Source Research', exact: true })).toBeVisible();
  await expect(business360).toContainText('A missing or conflicting record is a source result, not proof');
  await expect(business360).toContainText('not a conclusion about the active review');
  const researchStatuses = await business360.locator('[data-research-status]').evaluateAll(
    (records) => records.map((record) => record.getAttribute('data-research-status')),
  );
  expect(researchStatuses.length).toBeGreaterThan(0);
  for (const status of researchStatuses) expect(allowedResearchStatuses.has(status)).toBe(true);
  observedText.push(await business360.innerText());
  await assertWithinViewport(page, business360);

  const profileText = observedText.join('\n');
  expect(profileText).not.toContain(businessApplicationCase.id);
  expect(profileText).not.toContain(businessApplicationCase.alertReason);
  expect(profileText).not.toContain(businessApplicationCase.amount);
  expect(profileText).not.toContain(businessApplicationCase.transactionInfo);
  expect(profileText).not.toContain(businessApplicationCase.scenarioTitle);
  expect(profileText).not.toMatch(forbiddenHiddenConclusion);
});

test('Business 360 owner routes preserve the selected owner Training ID and personal identity context', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 1000 });
  await seedGeneratedCase(page, businessApplicationCase);

  const openFirstOwner = async () => {
    const workspace = await openBusiness360(page, businessApplicationCase);
    const tabs = workspace.business360.getByRole('tablist', { name: 'Business 360 sections' });
    await tabs.getByRole('tab', { name: 'Owners & Control', exact: true }).click();
    await workspace.business360.locator('[data-business-owner]').first()
      .getByRole('button', { name: 'Open Owner Profile', exact: true })
      .click();
    const ownerProfile = workspace.business360.locator('.business-360-owner-profile');
    await expect(ownerProfile).toBeVisible();
    return {
      ...workspace,
      ownerProfile,
      ownerName: await ownerProfile.getByRole('heading').innerText(),
      ownerTrainingId: await fieldValue(ownerProfile, 'Training ID'),
    };
  };

  const identity = await openFirstOwner();
  await identity.ownerProfile.getByRole('button', { name: 'Open Identity Information', exact: true }).click();
  await expect(identity.toolPanel).toHaveAttribute('data-tool-name', 'Identity Intel / People Search');
  await expect(identity.toolPanel.getByLabel('Search Identity Intel by Training ID')).toHaveValue(identity.ownerTrainingId);
  const matchSummary = identity.toolPanel.getByRole('region', { name: 'Identity Match Summary' });
  await expect(matchSummary.getByRole('heading', { name: identity.ownerName, exact: true })).toBeVisible();
  await expect(matchSummary).not.toContainText(businessApplicationCase.person);

  for (const route of [
    {
      button: 'Open Device History',
      tool: 'Device Intelligence',
      searchLabel: 'Search Device Intelligence records',
    },
    {
      button: 'Open Login History',
      tool: 'Login History',
      searchLabel: 'Search Login History records',
    },
    {
      button: 'Open Session History',
      tool: 'Session History',
      searchLabel: 'Search Session History records',
    },
  ]) {
    const ownerRoute = await openFirstOwner();
    await ownerRoute.ownerProfile.getByRole('button', { name: route.button, exact: true }).click();
    await expect(ownerRoute.toolPanel).toHaveAttribute('data-tool-name', route.tool);
    await expect(ownerRoute.toolPanel.getByLabel(route.searchLabel)).toHaveValue(ownerRoute.ownerTrainingId);
  }
});

test('Business 360 source-only sections show honest record-level empty states', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 1000 });
  await seedGeneratedCase(page, sparseBusinessCase);
  const { business360 } = await openBusiness360(page, sparseBusinessCase);
  const tabs = business360.getByRole('tablist', { name: 'Business 360 sections' });

  expect(await fieldValue(business360, 'Known operating locations')).toBe('No operating-location record is available.');

  await tabs.getByRole('tab', { name: 'Profile Updates', exact: true }).click();
  await expect(business360.getByRole('status')).toHaveText('No business profile-update record is available.');

  await tabs.getByRole('tab', { name: 'Access & Security', exact: true }).click();
  await expect(business360.getByText('No authorized-business-user record is available.', { exact: true })).toBeVisible();
  await expect(business360.getByText('No trusted-device record is available.', { exact: true })).toBeVisible();

  await tabs.getByRole('tab', { name: 'Contact History', exact: true }).click();
  await expect(business360.getByRole('status')).toHaveText('No business contact-history record is available.');
});

test('Business 360 exposes a payroll relationship summary and only supported payroll routes', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 1000 });
  await seedGeneratedCase(page, payrollCase);
  const { business360, toolPanel } = await openBusiness360(page, payrollCase);
  const tabs = business360.getByRole('tablist', { name: 'Business 360 sections' });

  await expect(business360.locator('.business-360-profile').first().getByRole('heading', {
    name: payrollCase.profile.business,
    exact: true,
  })).toBeVisible();
  await tabs.getByRole('tab', { name: 'Payroll Relationship', exact: true }).click();

  const payrollRelationship = business360.getByRole('heading', { name: 'Payroll Relationship', exact: true }).locator('..').locator('..');
  await expect(payrollRelationship).toBeVisible();
  for (const label of [
    'Payroll account status',
    'Payroll customer since',
    'Pay schedule',
    'Next scheduled payroll',
    'Active employee count',
    'Last completed payroll date',
    'Last payroll amount',
    'Average monthly payroll',
    'Payroll funding status',
    'Payroll administrator',
    'Authorized payroll users',
    'Employer tax-profile status',
  ]) {
    await expect(payrollRelationship.getByText(label, { exact: true })).toBeVisible();
  }

  const payrollRoutes = payrollRelationship.getByRole('navigation', { name: 'Payroll relationship routes' });
  await expect(payrollRoutes.getByRole('button', { name: 'Open Payroll History', exact: true })).toBeVisible();
  await expect(payrollRoutes.getByRole('button', { name: 'Open Employee Roster', exact: true })).toBeVisible();
  await expect(payrollRelationship).not.toContainText(payrollCase.id);
  await expect(payrollRelationship).not.toContainText(payrollCase.alertReason);
  await expect(payrollRelationship).not.toContainText(payrollCase.amount);
  await expect(payrollRelationship).not.toContainText(payrollCase.transactionInfo);
  expect(await payrollRelationship.innerText()).not.toMatch(forbiddenHiddenConclusion);
  await assertWithinViewport(page, business360);

  await payrollRoutes.getByRole('button', { name: 'Open Payroll History', exact: true }).click();
  const activeWorkspace = page.locator('.visual-os-frame, .mission-workspace-v3');
  await expect(activeWorkspace).toHaveAttribute('data-workspace-screen', 'tool');
  await expect(activeWorkspace).toHaveAttribute('data-active-tool', 'Payroll History');
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]'))
    .toHaveAttribute('data-tool-name', 'Payroll History');
});
