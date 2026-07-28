import { test, expect } from '@playwright/test';
import { trainingCases } from '../src/data/cases.js';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import { getCustomer360Dossier } from '../src/data/customer360Dossier.js';
import { openWorkspacePages } from './workspace-page-helpers.mjs';

const defaultCase = {
  id: 'FA-ATO-24018',
  amount: '$742.18',
  alertReason: 'Unrecognized card transaction with recent account-access activity',
};

const forbiddenRelationshipProfileCopy = /\b(?:Current Case Snapshot|Claim-specific Customer 360 highlights|Suggested Next Step|Process coaching|Latest case files|Payment Account Change|Payment Verification Inputs|Reported allegation|Correct answer|Fraud Confirmed|Synthetic Identity|Bust[- ]Out|First[- ]Party Fraud|Mule Activity|Email Compromise|Scenario Truth)\b/i;

async function openCustomer360(page) {
  await page.goto('/');
  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing).toBeVisible();
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();
  const customer360 = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer360).toBeVisible();
  return customer360;
}

async function assertWithinViewport(page, selector) {
  const layout = await page.locator(selector).evaluate((panel) => {
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
  expect(layout.width).toBeGreaterThan(280);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'desktop');
  });
});

test('Customer 360 data excludes future updates, legacy fabrication, and intake-channel contamination', () => {
  const builtIn = trainingCases.find((item) => item.id === defaultCase.id);
  expect(builtIn).toBeTruthy();
  const futureProfileCase = {
    ...builtIn,
    customer: {
      ...builtIn.customer,
      profileChanges: [
        {
          id: 'PCH-FUTURE-C360',
          date: 'Jul 9, 2026',
          time: '8:15 AM',
          eventType: 'Address change',
          item: 'Mailing address updated after the case opened',
          oldValue: 'Prior training address',
          newValue: 'Future training address',
          channel: 'Customer profile',
          source: 'Relationship servicing',
        },
        ...builtIn.customer.profileChanges,
      ],
    },
  };
  const asOfDossier = getCustomer360Dossier(futureProfileCase);
  expect(asOfDossier.profileUpdates.map((event) => event.item))
    .not.toContain('Mailing address updated after the case opened');

  const legacyDossier = getCustomer360Dossier({
    id: 'FA-C360-LEGACY-PLAYWRIGHT',
    legacyDerivedEvidence: true,
    customerType: 'personal',
    productType: 'deposit-account',
    workflowType: 'personal-account-takeover',
    person: 'Rowan Vale',
    trainingId: 'TRN-C360-LEG-PW',
    opened: 'Jul 8, 2026',
    customer: {},
  });
  expect(legacyDossier.identity.legalName).toBe('Rowan Vale');
  expect(legacyDossier.identity.currentAddress).toBe('Not available in the current training record');
  expect(legacyDossier.identity.maskedMemberId).toBe('Not available in the current training record');
  expect(legacyDossier.profileUpdates).toEqual([]);
  expect(legacyDossier.security.trustedDevices).toEqual([]);
  expect(legacyDossier.serviceContacts).toEqual([]);
  expect(legacyDossier.coverage.sourceMode).toBe('Supplied records only');

  const intakeChannelCase = createGeneratedCase({
    index: 98004,
    difficulty: 'standard',
    evidenceDepth: 'deep',
    customerType: 'personal',
    productType: 'credit-card',
    workflowType: 'merchant-non-fraud-dispute',
  });
  expect(intakeChannelCase.intake.channel).toBe('Digital fraud intake');
  const generatedDossier = getCustomer360Dossier(intakeChannelCase);
  expect(generatedDossier.profileUpdates.length).toBeGreaterThan(0);
  expect(JSON.stringify(generatedDossier.profileUpdates)).not.toContain(intakeChannelCase.intake.channel);
});

test('Customer 360 is a relationship-only personal profile with typed accounts and factual history', async ({ page }) => {
  const customer360 = await openCustomer360(page);
  const tabs = customer360.getByRole('tablist', { name: 'Customer 360 dossier tabs' });
  const observedText = [];

  await expect(customer360.getByRole('heading', { name: 'Customer 360', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Customer Identity Profile', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Contact Information', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Relationship Overview', exact: true })).toBeVisible();

  for (const label of [
    'Full legal name',
    'Preferred name',
    'Date of birth',
    'Current residential address',
    'Previous residential address',
    'Mobile phone',
    'Email',
    'Training ID',
    'Customer since',
    'Relationship length',
    'Customer segment',
    'Preferred contact',
    'Identity verification',
    'Verification method',
  ]) {
    await expect(customer360.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await expect(customer360.getByText('Maya Sterling', { exact: true }).first()).toBeVisible();
  await expect(customer360.getByText('TRN-8842-19', { exact: true }).first()).toBeVisible();
  observedText.push(await customer360.innerText());

  await tabs.getByRole('tab', { name: 'Accounts', exact: true }).click();
  await expect(customer360.getByRole('heading', { name: 'Products & Accounts', exact: true })).toBeVisible();
  const accountSection = customer360.getByRole('heading', { name: 'Accounts & Products', exact: true }).locator('..').locator('..');
  await expect(accountSection).toBeVisible();
  const accountCards = customer360.locator('.customer-360-account-records [data-customer-account]');
  await expect(accountCards).toHaveCount(3);
  const checking = customer360.locator('.customer-360-account-records [data-customer-account="ACCT-24018-4410"]');
  await expect(checking).toHaveCount(1);
  await expect(checking).toContainText('Everyday Checking');
  await expect(checking).toContainText('Account ID');
  await expect(checking.getByText('••••4410', { exact: true })).toBeVisible();
  await expect(checking).toContainText('Product type');
  await expect(checking).toContainText('Current balance');
  await expect(checking).toContainText('Available balance');
  await expect(checking).toContainText('Payment status');
  await expect(checking).toContainText('Past-due amount');
  await expect(checking).toContainText('Restrictions');
  await expect(checking).toContainText('Holds');
  await expect(checking.getByRole('button', { name: /Open account ACCT-24018-4410/ })).toBeEnabled();
  observedText.push(await customer360.innerText());

  await tabs.getByRole('tab', { name: 'Devices & Access', exact: true }).click();
  await expect(customer360.getByRole('heading', { name: 'Security & Access Summary', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Trusted Devices', exact: true })).toBeVisible();
  const trustedDevice = customer360.locator('[data-trusted-device="DEV-MAYA-IP16-001"]');
  await expect(trustedDevice).toContainText('Trusted');
  await expect(trustedDevice).toContainText('Face ID');
  const securityRoutes = customer360.getByRole('navigation', { name: 'Customer security history routes' });
  await expect(securityRoutes.getByRole('button', { name: 'Open Device Intelligence', exact: true })).toBeVisible();
  await expect(securityRoutes.getByRole('button', { name: 'Open Login History', exact: true })).toBeVisible();
  await expect(securityRoutes.getByRole('button', { name: 'Open Session History', exact: true })).toBeVisible();
  observedText.push(await customer360.innerText());

  await tabs.getByRole('tab', { name: 'Contact History', exact: true }).click();
  await expect(customer360.getByRole('heading', { name: 'Service Contact Notes', exact: true }).first()).toBeVisible();
  const serviceRecords = customer360.locator('.customer-360-service-records article');
  await expect(serviceRecords).toHaveCount(3);
  await expect(serviceRecords.first()).toContainText('Existing phone and email confirmed');
  await expect(serviceRecords.first()).toContainText('Customer self-service');
  observedText.push(await customer360.innerText());

  await tabs.getByRole('tab', { name: 'Profile History', exact: true }).click();
  await expect(customer360.getByRole('heading', { name: 'Profile Updates', exact: true })).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Profile Update Log', exact: true })).toBeVisible();
  const profileEvents = customer360.locator('[data-profile-event]');
  await expect(profileEvents.first()).toContainText('Previous value');
  await expect(profileEvents.first()).toContainText('New value');
  await expect(profileEvents.first()).toContainText('Device');
  await expect(profileEvents.first()).toContainText('Session');
  await expect(profileEvents.first()).not.toContainText('Compare');
  const profileDownload = page.waitForEvent('download');
  await customer360.getByRole('button', { name: 'Export Profile Update Report', exact: true }).click();
  expect((await profileDownload).suggestedFilename()).toBe('TRN-8842-19-profile-update-report.txt');
  observedText.push(await customer360.innerText());

  await tabs.getByRole('tab', { name: 'Notes', exact: true }).click();
  const learnerNotes = customer360.getByRole('heading', { name: 'Customer 360 Learner Notes', exact: true }).locator('..').locator('..');
  await expect(learnerNotes).toBeVisible();
  await expect(learnerNotes).toContainText('Learner-authored, case-scoped documentation');
  await expect(learnerNotes).not.toContainText('Existing phone and email confirmed');
  observedText.push(await customer360.innerText());

  const profileText = observedText.join('\n');
  expect(profileText).not.toMatch(forbiddenRelationshipProfileCopy);
  expect(profileText).not.toContain(defaultCase.id);
  expect(profileText).not.toContain(defaultCase.amount);
  expect(profileText).not.toContain(defaultCase.alertReason);
});

test('Customer 360 stays within the desktop viewport at a narrower responsive width', async ({ page }) => {
  await page.setViewportSize({ width: 980, height: 1000 });
  const customer360 = await openCustomer360(page);
  await assertWithinViewport(page, '[data-customer-360-screen="approved-theme-v1"]');

  const tabs = customer360.getByRole('tablist', { name: 'Customer 360 dossier tabs' });
  for (const tabName of ['Accounts', 'Devices & Access', 'Contact History', 'Profile History', 'Notes']) {
    await tabs.getByRole('tab', { name: tabName, exact: true }).click();
    await assertWithinViewport(page, '[data-customer-360-screen="approved-theme-v1"]');
  }
});

test('Customer 360 profile pins restore the original Training ID and matching profile', async ({ page }) => {
  const customer360 = await openCustomer360(page);
  await customer360.getByRole('button', { name: 'Pin customer', exact: true }).click();

  const workflow = await openWorkspacePages(page);
  await workflow.getByRole('button', { name: /Indicators|Evidence/ }).click();
  await page.getByRole('button', {
    name: 'Open pinned evidence TRN-8842-19 · Maya Sterling',
  }).click();

  const reopened = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(reopened).toBeVisible();
  await expect(page.locator('[data-opened-pinned-evidence="true"]')).toContainText('TRN-8842-19 · Maya Sterling');
  await expect(reopened.getByRole('textbox', { name: 'Search Customer 360 dossier' }))
    .toHaveValue('TRN-8842-19');
  await expect(reopened.getByRole('heading', { name: 'Customer Identity Profile', exact: true })).toBeVisible();
  await expect(reopened).toContainText('Maya Sterling');
  await expect(reopened.getByText('No customer-profile fields match this search.')).toHaveCount(0);
});
