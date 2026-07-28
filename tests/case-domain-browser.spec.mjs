import { test, expect } from '@playwright/test';
import { selectToolGroup } from './workspace-page-helpers.mjs';

const forbiddenInitialLabels = /\b(?:Fraud Claim|Synthetic Identity(?: Fraud)?|Synthetic Fraud|Bust[- ]Out(?: Fraud)?|First[- ]Party Fraud|Mule Activity|Email Fraud|Email Compromise|Compromised Mailbox|Spoofed Email|Stolen Identity|Fabricated Business Information|Owner Mismatch|Linked Prior Fraud|Scenario Truth|Correct Determination|BEC)\b/i;

const personalCreditCardWorkflows = [
  'unauthorized-card-transaction-claim',
  'merchant-non-fraud-dispute',
  'card-account-takeover',
  'credit-application-review',
  'credit-risk-review',
];

const businessProducts = [
  'business-account',
  'payroll-product',
  'business-credit-card',
  'business-loan',
];

const payrollWorkflows = [
  'payroll-change-alert',
  'payroll-account-takeover',
  'credit-application-review',
  'credit-risk-review',
];

async function optionValues(select) {
  return select.locator('option').evaluateAll((options) => options.map((option) => option.value));
}

async function assertNeutralGenerator(generator) {
  expect(await generator.innerText()).not.toMatch(forbiddenInitialLabels);
}

test('case taxonomy routes desktop and mobile generators and protects payroll/link evidence flow', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'desktop');
    window.localStorage.removeItem('fraud-academy-review-packages-v1');
    window.localStorage.removeItem('fraud-academy-decision-drafts-v1');
  });
  await page.goto('/');

  await page.getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: /Cases/ })
    .click();

  const desktopQueue = page.locator('[data-cases-theme-v1="approved"]');
  const desktopGenerator = desktopQueue.getByRole('region', { name: 'Generate fictional training cases' });
  const desktopCustomer = desktopGenerator.getByLabel('Generate case customer type');
  const desktopProduct = desktopGenerator.getByLabel('Generate case product');
  const desktopWorkflow = desktopGenerator.getByLabel('Generate case review workflow');

  await expect(desktopGenerator).toBeVisible();
  expect(await optionValues(desktopCustomer)).toEqual(['personal', 'business']);
  expect(await optionValues(desktopProduct)).toEqual(['credit-card', 'deposit-account', 'personal-loan']);
  expect(await optionValues(desktopWorkflow)).toEqual(personalCreditCardWorkflows);
  await assertNeutralGenerator(desktopGenerator);

  await desktopCustomer.selectOption('business');
  await expect(desktopCustomer).toHaveValue('business');
  await expect(desktopProduct).toHaveValue('business-account');
  expect(await optionValues(desktopProduct)).toEqual(businessProducts);

  await desktopProduct.selectOption('payroll-product');
  await expect(desktopProduct).toHaveValue('payroll-product');
  await expect(desktopWorkflow).toHaveValue('payroll-change-alert');
  expect(await optionValues(desktopWorkflow)).toEqual(payrollWorkflows);
  expect(await optionValues(desktopWorkflow)).not.toContain('business-account-takeover');

  await desktopWorkflow.selectOption('payroll-change-alert');
  await expect(desktopGenerator.locator('.case-generator-v2-context'))
    .toContainText('Business · Payroll or payroll-funding product · Payroll Change Alert');
  await assertNeutralGenerator(desktopGenerator);
  await desktopGenerator.getByLabel('Generate case count').selectOption('1');
  await desktopGenerator.getByRole('button', { name: 'Generate cases', exact: true }).click();

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing).toBeVisible();
  const generatedCaseId = await page.locator('.visual-case-switcher select').inputValue();
  expect(generatedCaseId).toMatch(/^FA-PCA-G\d+$/);
  await expect(briefing.locator('.case-summary-meta-grid')).toContainText('Business');
  await expect(briefing.locator('.case-summary-meta-grid')).toContainText('Payroll or payroll-funding product');
  await expect(briefing.locator('.case-summary-meta-grid')).toContainText('Payroll Change Alert');
  await expect(briefing.locator('.case-briefing-intake-answer-list')).toContainText('Request method: Unknown at intake');
  expect(await briefing.innerText()).not.toMatch(forbiddenInitialLabels);

  await selectToolGroup(page, /Business & Payment Verification/, 'Payroll History');
  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const toolSelect = toolPanel.getByRole('combobox', { name: 'Choose investigation tool' });
  await toolSelect.selectOption('Payroll History');
  const activeWorkspace = page.locator('.visual-os-frame, .mission-workspace-v3');
  await expect(activeWorkspace).toHaveAttribute('data-workspace-screen', 'tool');
  await expect(activeWorkspace).toHaveAttribute('data-active-tool', 'Payroll History');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Payroll History');

  const trustedContactFlow = toolPanel.getByRole('region', { name: 'Payroll change trusted contact workflow' });
  await expect(trustedContactFlow.getByRole('heading', { name: 'Unknown at intake', exact: true })).toBeVisible();
  await expect(toolPanel.locator('.payroll-email-evidence')).toHaveCount(0);
  await expect(toolPanel.getByText('Fictional message record', { exact: true })).toHaveCount(0);

  await trustedContactFlow.getByRole('button', { name: 'Record trusted business contact', exact: true }).click();
  await trustedContactFlow.getByRole('combobox', { name: 'Business-reported request method' }).selectOption('Email');
  await trustedContactFlow.getByRole('textbox', { name: 'Business statement' })
    .fill('The trusted business contact supplied the fictional request record.');
  await expect(trustedContactFlow).toContainText('call the employee using a trusted, previously known phone number');
  await expect(toolPanel.locator('.payroll-email-evidence')).toHaveCount(0);
  await trustedContactFlow.getByRole('button', { name: 'Business supplied email evidence', exact: true }).click();
  await trustedContactFlow.getByRole('button', { name: 'Save business response', exact: true }).click();
  const emailEvidence = toolPanel.getByRole('region', { name: 'Business-supplied email evidence' });
  await expect(emailEvidence).toBeVisible();
  await expect(emailEvidence).toContainText('From');
  await expect(emailEvidence).toContainText('Reply-To');
  await expect(emailEvidence).toContainText('Mailbox note');
  await expect(trustedContactFlow.getByRole('button', { name: 'Business response saved', exact: true })).toBeVisible();

  await expect.poll(() => page.evaluate((caseId) => (
    JSON.parse(localStorage.getItem('fraud-academy-payroll-investigations-v1') || '{}')[caseId]
  ), generatedCaseId)).toMatchObject({
    trustedContactStarted: true,
    requestMethod: 'Email',
    businessStatement: 'The trusted business contact supplied the fictional request record.',
    emailEvidenceProvided: true,
    businessResponseSaved: true,
  });

  await toolSelect.selectOption('Payment Verification');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Payment Verification');
  await toolSelect.selectOption('Payroll History');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Payroll History');
  await expect(trustedContactFlow.getByRole('combobox', { name: 'Business-reported request method' })).toHaveValue('Email');
  await expect(trustedContactFlow.getByRole('textbox', { name: 'Business statement' }))
    .toHaveValue('The trusted business contact supplied the fictional request record.');
  await expect(emailEvidence).toBeVisible();

  await page.reload();
  await page.getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: /Cases/ })
    .click();
  const reloadedQueue = page.locator('[data-cases-theme-v1="approved"]');
  await reloadedQueue.getByRole('searchbox', { name: 'Search cases' }).fill(generatedCaseId);
  const reloadedCase = reloadedQueue.locator('.case-queue-item').filter({ hasText: generatedCaseId });
  await expect(reloadedCase).toBeVisible();
  await reloadedCase.locator('.nav-case-card').click();
  await expect(briefing).toBeVisible();
  await selectToolGroup(page, /Business & Payment Verification/, 'Payroll History');
  await toolSelect.selectOption('Payroll History');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Payroll History');
  await expect(trustedContactFlow.getByRole('combobox', { name: 'Business-reported request method' })).toHaveValue('Email');
  await expect(trustedContactFlow.getByRole('textbox', { name: 'Business statement' }))
    .toHaveValue('The trusted business contact supplied the fictional request record.');
  await expect(emailEvidence).toBeVisible();
  await expect(trustedContactFlow.getByRole('button', { name: 'Business response saved', exact: true })).toBeVisible();

  await selectToolGroup(page, /Links & Related Cases/, 'Link Analysis');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Link Analysis');
  const linkWorkspace = toolPanel.locator('[data-link-analysis-workspace]');
  await expect(linkWorkspace).toHaveAttribute('data-link-analysis-state', 'empty');
  await expect(toolPanel.getByRole('status')).toContainText('Search before viewing account links.');
  await expect(toolPanel.locator('[data-link-account]')).toHaveCount(0);

  const linkSearch = linkWorkspace.getByRole('region', { name: 'Cross-account Link Analysis search' });
  await linkSearch.locator('summary').click();
  await toolPanel.getByRole('combobox', { name: 'Choose Link Analysis identifier type' }).selectOption('destination-id');
  await toolPanel.getByRole('textbox', { name: 'Search Link Analysis identifier' }).fill('DST-7740');
  await toolPanel.getByRole('button', { name: 'Search Links', exact: true }).click();
  const linkSummary = toolPanel.locator('.link-analysis-result-banner');
  await expect(linkSummary).toContainText('Searched Destination ID');
  await expect(linkSummary).toContainText('DST-7740');
  await expect(linkSummary).toContainText(/\d+ matched accounts?/);

  const firstMatch = toolPanel.locator('[data-link-account]').first();
  await expect(firstMatch).toBeVisible();
  await firstMatch.locator('.link-analysis-account-heading').click();
  const matchDetail = firstMatch.locator('.link-analysis-account-detail');
  await expect(matchDetail).toBeVisible();
  for (const requiredField of [
    'Customer or business',
    'Account ID',
    'Customer type',
    'Product',
    'Relationship to current case',
    'Exact shared identifier',
    'First use',
    'Last use',
    'Link source and confidence',
    'Account status or restriction',
  ]) {
    await expect(matchDetail.getByText(requiredField, { exact: true })).toBeVisible();
  }
  const openedCustomerName = await matchDetail.locator('dt')
    .filter({ hasText: /^Customer or business$/ })
    .locator('..')
    .locator('dd')
    .innerText();
  const openedAccountId = await firstMatch.getAttribute('data-link-account');
  await matchDetail.getByRole('button', { name: 'Open Account', exact: true }).click();
  const accountDossier = toolPanel.locator(`[data-link-account-dossier="${openedAccountId}"]`);
  await expect(accountDossier).toBeVisible();
  await expect(accountDossier.getByRole('heading', { name: openedCustomerName, exact: true })).toBeVisible();
  await expect(accountDossier).toContainText('Account context');
  await expect(accountDossier).toContainText('Relationship evidence');
  await expect(accountDossier).toContainText('Link provenance');
  await expect(accountDossier).toContainText('Status meaning');
  await expect(accountDossier.getByRole('region', { name: 'Current case evidence boundary' }))
    .toContainText('does not determine the current case finding');
  await expect(accountDossier.getByRole('button', { name: 'Close dossier', exact: true })).toBeVisible();
  await expect(matchDetail.locator('.link-analysis-evidence-warning')).toContainText('does not determine the current case finding');
  await expect(toolPanel.locator('.link-analysis-review-bar')).toContainText('An exact link is evidence—not an automatic conclusion');

  await page.getByRole('button', { name: 'Open Settings', exact: true }).click();
  await page.getByRole('group', { name: 'Layout mode' })
    .getByRole('button', { name: 'Mobile', exact: true })
    .click();
  await expect(page.locator('body')).toHaveAttribute('data-layout-mode', 'mobile');
  const mobileRoot = page.locator('.mission-mobile-root');
  await expect(mobileRoot).toBeVisible();
  await mobileRoot.getByRole('navigation', { name: 'Mission navigation' })
    .getByRole('button', { name: /Cases/ })
    .click();

  const mobileQueue = mobileRoot.locator('[data-mobile-case-queue="reference-v1"]');
  const quickPad = page.locator('.case-quick-pad');
  await quickPad.getByRole('button', { name: /Open Quick Pad/ }).click();
  await expect(quickPad).toHaveClass(/is-open/);
  await mobileQueue.getByRole('button', { name: /Create a fictional training case/ }).click();
  const mobileGenerator = mobileQueue.locator('#mobile-case-generator-dialog');
  const mobileCustomer = mobileGenerator.getByRole('combobox', { name: 'Customer type', exact: true });
  const mobileProduct = mobileGenerator.getByRole('combobox', { name: 'Product', exact: true });
  const mobileWorkflow = mobileGenerator.getByRole('combobox', { name: 'Review workflow', exact: true });
  await expect(mobileGenerator).toBeVisible();
  await expect(quickPad).toBeHidden();
  await expect(quickPad).not.toHaveClass(/is-open/);
  const closeGenerator = mobileGenerator.getByRole('button', { name: 'Close case generator', exact: true });
  const generateTrainingCase = mobileGenerator.getByRole('button', { name: 'Generate training case', exact: true });
  await expect(closeGenerator).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(generateTrainingCase).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeGenerator).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(mobileGenerator).toHaveCount(0);
  const generatorToggle = mobileQueue.getByRole('button', { name: /Create a fictional training case/ });
  await expect(generatorToggle).toBeFocused();
  await expect(quickPad).not.toHaveClass(/is-open/);
  await generatorToggle.click();
  await expect(mobileGenerator).toBeVisible();
  await expect(closeGenerator).toBeFocused();

  await mobileCustomer.selectOption('business');
  await expect(mobileProduct).toHaveValue('business-account');
  expect(await optionValues(mobileProduct)).toEqual(businessProducts);
  await mobileProduct.selectOption('payroll-product');
  await expect(mobileWorkflow).toHaveValue('payroll-change-alert');
  expect(await optionValues(mobileWorkflow)).toEqual(payrollWorkflows);

  await mobileCustomer.selectOption('personal');
  await expect(mobileProduct).toHaveValue('credit-card');
  await mobileProduct.selectOption('personal-loan');
  await expect(mobileWorkflow).toHaveValue('credit-application-review');
  expect(await optionValues(mobileWorkflow)).toEqual(['credit-application-review', 'credit-risk-review']);
  await assertNeutralGenerator(mobileGenerator);
  expect(await mobileQueue.innerText()).not.toMatch(forbiddenInitialLabels);
});

test('legacy IndexedDB cases and learner progress survive the versioned domain migration', async ({ page }) => {
  const legacyCaseId = 'FA-CR-G0099999';
  const generatedAt = 1722000009999;
  const savedAtIso = '2026-07-18T14:32:10.000Z';

  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'desktop');
  });
  await page.goto('/');

  await page.evaluate(async ({ caseId, generatedAtValue, savedAt }) => {
    const legacyCase = {
      id: caseId,
      generatedAt: generatedAtValue,
      claimTypeId: 'credit-risk',
      type: 'Synthetic Fraud',
      lane: 'Credit Risk',
      scenarioId: 'cr-synthetic-identity',
      scenarioTitle: 'Synthetic Identity',
      subtype: 'synthetic identity',
      alertReason: 'Synthetic fraud alert',
      taxonomyTags: { lifecycleStage: 'onboarding' },
      profile: { entityRole: 'Consumer applicant', business: 'Fictional Training Employer' },
      person: 'Morgan Training',
      trainingId: 'TRN-IDB-9999',
      accountId: 'ACCT-IDB-9999',
      priority: 'Medium',
      status: 'Generated',
      amount: '$1,250.00',
      opened: 'Jul 18, 2026',
      statement: { value: 'I submitted the requested application information.' },
      intakeAnswers: [{
        id: 'INT-IDB-9999',
        prompt: 'Was synthetic identity fraud confirmed?',
        answer: 'Synthetic identity was confirmed at intake.',
      }],
      events: [{
        id: 'EVT-IDB-9999',
        label: 'Synthetic fraud found',
        detail: 'First-party fraud and synthetic identity were established.',
      }],
      timelineEvents: [{
        id: 'TIM-IDB-9999',
        title: 'Bust-out fraud detected',
        detail: 'Fraud confirmed before review.',
      }],
      actionLog: [{
        id: 'ACT-IDB-9999',
        detail: 'Email compromise confirmed.',
      }],
      toolResults: {
        evidence: [{
          id: 'DOC-IDB-9999',
          result: 'Submitted identity fields conflict with a fictional training record.',
        }],
        rows: [{
          label: 'Synthetic identity match',
          detail: 'Fraud confirmed.',
        }],
      },
      caseTruth: {
        operationalDecision: 'Deny',
        finalFinding: 'Fraud Confirmed',
        findingBasis: 'Document DOC-IDB-9999 establishes the hidden training outcome.',
      },
      correctDetermination: 'Do Not Support Credit Request',
    };

    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('fraud-academy-os-v1', 1);
      request.onupgradeneeded = () => {
        const nextDatabase = request.result;
        if (!nextDatabase.objectStoreNames.contains('generatedCases')) {
          nextDatabase.createObjectStore('generatedCases', { keyPath: 'id' });
        }
        if (!nextDatabase.objectStoreNames.contains('metadata')) {
          nextDatabase.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await new Promise((resolve, reject) => {
      const transaction = database.transaction('generatedCases', 'readwrite');
      transaction.objectStore('generatedCases').put(legacyCase);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();

    window.localStorage.setItem('fraud-academy-decision-drafts-v1', JSON.stringify({
      [caseId]: {
        claimTypeId: 'credit-risk',
        choice: 'Do Not Support Credit Request',
        reason: 'Document DOC-IDB-9999 supports the saved decision.',
        updatedAt: generatedAtValue + 100,
      },
    }));
    window.localStorage.setItem('fraud-academy-review-packages-v1', JSON.stringify({
      [caseId]: [{
        id: 'PKG-IDB-9999',
        caseId,
        claimTypeId: 'credit-risk',
        choice: 'Do Not Support Credit Request',
        reason: 'Document DOC-IDB-9999 supports the saved package.',
        completedTools: ['Evidence Center', 'Financial Intelligence'],
        requiredTools: ['Case Summary', 'Evidence Center', 'Business Intelligence'],
        missingTools: ['Business Intelligence'],
        savedAt: 'Jul 18, 09:32 AM',
        savedAtIso: savedAt,
      }],
    }));
    window.localStorage.setItem('fraud-academy-completed-tools-v1', JSON.stringify({
      [caseId]: ['Case Summary', 'Identity Intel / People Search', 'Evidence Center', 'Financial Intelligence'],
    }));
    window.localStorage.setItem('fraud-academy-notes-v1', JSON.stringify({
      [caseId]: [
        'Learner note survives IndexedDB migration.',
        'Learner-authored Financial Intelligence wording stays unchanged.',
      ],
    }));
    window.localStorage.setItem('fraud-academy-action-log-v1', JSON.stringify({
      [caseId]: [{
        id: 'ACT-IDB-SAVED-9999',
        time: 'Jul 18, 09:31 AM',
        action: 'Opened Financial Intelligence',
        detail: 'Learner action detail remains unchanged.',
        source: 'Financial Intelligence',
      }],
    }));
    window.localStorage.setItem('fraud-academy-quick-pad-v1', JSON.stringify({
      [caseId]: {
        items: [{
          id: 'Financial Intelligence:Account ID:ACCT-IDB-9999',
          label: 'Account ID',
          value: 'ACCT-IDB-9999',
          sourceTool: 'Financial Intelligence',
          sourceRecordId: 'FIN-IDB-9999',
        }],
        scratch: 'Learner Quick Pad scratch survives unchanged.',
      },
    }));
  }, { caseId: legacyCaseId, generatedAtValue: generatedAt, savedAt: savedAtIso });

  await page.reload();
  await page.getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: /Cases/ })
    .click();
  const queue = page.locator('[data-cases-theme-v1="approved"]');
  const generatedFilter = queue.getByRole('navigation', { name: 'Case status filters' })
    .getByRole('button', { name: /^Generated \d+$/ });
  await generatedFilter.click();
  await expect(generatedFilter).toHaveAttribute('aria-pressed', 'true');
  await queue.getByRole('searchbox', { name: 'Search cases' }).fill(legacyCaseId);
  const migratedCaseCard = queue.locator('.case-queue-item').filter({ hasText: legacyCaseId });
  await expect(migratedCaseCard.locator('.case-queue-id', { hasText: legacyCaseId })).toBeVisible();
  expect(await queue.innerText()).not.toMatch(forbiddenInitialLabels);
  await migratedCaseCard.locator('.nav-case-card').click();
  const migratedBriefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(migratedBriefing).toBeVisible();
  expect(await migratedBriefing.innerText()).not.toMatch(forbiddenInitialLabels);

  const migrated = await page.evaluate(async (caseId) => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('fraud-academy-os-v1', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const generatedCase = await new Promise((resolve, reject) => {
      const transaction = database.transaction('generatedCases', 'readonly');
      const request = transaction.objectStore('generatedCases').get(caseId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const truthStore = await new Promise((resolve, reject) => {
      const transaction = database.transaction('metadata', 'readonly');
      const request = transaction.objectStore('metadata').get('generated-case-truth-snapshots-v1');
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return {
      generatedCase,
      truthSnapshot: truthStore?.byCaseId?.[caseId] ?? null,
      draft: JSON.parse(window.localStorage.getItem('fraud-academy-decision-drafts-v1'))?.[caseId],
      reviewPackage: JSON.parse(window.localStorage.getItem('fraud-academy-review-packages-v1'))?.[caseId]?.[0],
      completedTools: JSON.parse(window.localStorage.getItem('fraud-academy-completed-tools-v1'))?.[caseId],
      notes: JSON.parse(window.localStorage.getItem('fraud-academy-notes-v1'))?.[caseId],
      actions: JSON.parse(window.localStorage.getItem('fraud-academy-action-log-v1'))?.[caseId],
      quickPad: JSON.parse(window.localStorage.getItem('fraud-academy-quick-pad-v1'))?.[caseId],
    };
  }, legacyCaseId);

  expect(migrated.generatedCase.id).toBe(legacyCaseId);
  expect(migrated.generatedCase.generatedAt).toBe(generatedAt);
  expect(migrated.generatedCase.customerType).toBe('personal');
  expect(migrated.generatedCase.productType).toBe('credit-card');
  expect(migrated.generatedCase.workflowType).toBe('credit-application-review');
  expect(migrated.generatedCase.relationshipViewSchemaVersion).toBe(1);
  expect(migrated.generatedCase.relationshipDataVersion).toBe(0);
  expect(migrated.generatedCase.legacyDerivedEvidence).toBe(true);
  expect(migrated.generatedCase.alertReason).not.toMatch(/synthetic|fraud/i);
  expect(migrated.generatedCase.toolResults.evidence).toEqual([{
    id: 'DOC-IDB-9999',
    result: 'Submitted identity fields conflict with a fictional training record.',
  }]);
  expect(migrated.generatedCase).not.toHaveProperty('caseTruth');
  expect(migrated.generatedCase).not.toHaveProperty('correctDetermination');
  expect(migrated.generatedCase.intakeAnswers[0].answer)
    .toBe('Synthetic identity was confirmed at intake.');
  expect(migrated.generatedCase.events[0].detail)
    .toBe('First-party fraud and synthetic identity were established.');
  expect(migrated.generatedCase.timelineEvents[0].title)
    .toBe('Bust-out fraud detected');
  expect(migrated.generatedCase.actionLog[0].detail)
    .toBe('Email compromise confirmed.');
  expect(migrated.generatedCase.toolResults.rows[0]).toEqual({
    label: 'Synthetic identity match',
    detail: 'Fraud confirmed.',
  });
  expect(migrated.generatedCase.legacyMetadata.claimType).toBe('Synthetic Fraud');
  expect(migrated.generatedCase.legacyMetadata.scenarioTitle).toBe('Synthetic Identity');
  expect(migrated.truthSnapshot).not.toBeNull();
  expect(migrated.truthSnapshot.source).toBe('legacy-embedded');
  expect(migrated.truthSnapshot.capturedAt).toBe(generatedAt);
  expect(migrated.truthSnapshot.truth.operationalDecision).toBe('Deny');
  expect(migrated.truthSnapshot.truth.finalFinding).toBe('Fraud Confirmed');
  expect(migrated.truthSnapshot.truth.suspectedPatterns).toContain('synthetic-identity');
  expect(migrated.truthSnapshot.truth.legacyFinalFinding).toBe('Fraud Confirmed');
  expect(migrated.truthSnapshot.truth.findingBasis).toContain('DOC-IDB-9999');
  expect(migrated.truthSnapshot.truth.legacyEvidence.toolResults.rows[0].label)
    .toBe('Synthetic identity match');
  expect(migrated.truthSnapshot.truth.legacyEvidence.intakeAnswers[0].answer)
    .toBe('Synthetic identity was confirmed at intake.');
  expect(migrated.draft.operationalDecision).toBe('Deny');
  expect(migrated.draft.updatedAt).toBe(generatedAt + 100);
  expect(migrated.reviewPackage.id).toBe('PKG-IDB-9999');
  expect(migrated.reviewPackage.savedAtIso).toBe(savedAtIso);
  expect(migrated.reviewPackage.completedTools).toEqual(['Document Viewer', 'Financial Investigation']);
  expect(migrated.reviewPackage.requiredTools).toEqual(['Case Summary', 'Document Viewer', 'Business 360']);
  expect(migrated.reviewPackage.missingTools).toEqual(['Business 360']);
  expect(migrated.completedTools).toEqual([
    'Case Summary',
    'Identity Intel / People Search',
    'Document Viewer',
    'Financial Investigation',
  ]);
  expect(migrated.notes).toEqual([
    'Learner note survives IndexedDB migration.',
    'Learner-authored Financial Intelligence wording stays unchanged.',
  ]);
  expect(migrated.actions).toEqual([{
    id: 'ACT-IDB-SAVED-9999',
    time: 'Jul 18, 09:31 AM',
    action: 'Opened Financial Intelligence',
    detail: 'Learner action detail remains unchanged.',
    source: 'Financial Investigation',
  }]);
  expect(migrated.quickPad).toEqual({
    items: [{
      id: 'Financial Investigation:Account ID:ACCT-IDB-9999',
      label: 'Account ID',
      value: 'ACCT-IDB-9999',
      sourceTool: 'Financial Investigation',
      sourceRecordId: 'FIN-IDB-9999',
    }],
    scratch: 'Learner Quick Pad scratch survives unchanged.',
  });
});
