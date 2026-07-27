import assert from 'node:assert/strict';
import fs from 'node:fs';
import { trainingCases } from '../src/data/cases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { coreClaimTypes } from '../src/data/claimRegistry.js';
import {
  CUSTOMER_TYPES,
  FINAL_FINDINGS,
  PRODUCT_TYPES,
  WORKFLOW_TYPES,
  isWorkflowEnabled,
} from '../src/data/caseDomain.js';
import {
  createGeneratedCase,
  getGeneratedCaseTruth,
} from '../src/data/generatedCases.js';
import {
  CASE_MIGRATION_IDS,
  migrateCloudSnapshotCaseData,
  migrateGeneratedCase,
  migrateHistoricalPayrollDestinations,
  migrateLegacyCaseTruth,
  migratePersistenceResources,
} from '../src/data/caseMigration.js';
import {
  employeePayrollHistory,
  getEmployeeProfiles,
  getPayrollHistory,
} from '../src/data/businessPayrollWorkspace.js';
import {
  businessResearchSections,
  getBusinessResearch,
  lunaBusinessResearchStatuses,
} from '../src/data/kybReviewRecords.js';
import { getBusiness360Dossier } from '../src/data/business360Dossier.js';
import { getFinancialInvestigation } from '../src/data/financialInvestigationRecords.js';
import { assertNoHiddenFindingLeak, hiddenFindingLeakPaths } from '../src/data/hiddenFindingGuard.js';
import { getFinancialRecords } from '../src/data/caseToolData.js';
import { resolvePaymentLookup } from '../src/data/paymentVerification.js';
import { storageKeys } from '../src/data/persistenceKeys.js';

const builtInCases = enrichTrainingCases(trainingCases);
const generatedCases = [];
const scenarioKeys = new Set();
let generationIndex = 87000000;

for (const claimType of coreClaimTypes) {
  for (const scenario of claimType.scenarios) {
    assert.equal(
      isWorkflowEnabled(scenario.customerType, scenario.productType, scenario.workflowType),
      true,
      `${scenario.id} must use an enabled Customer Type → Product → Review Workflow combination.`,
    );
    scenarioKeys.add(`${scenario.workflowType}:${scenario.id}`);
    for (let variantOffset = 0; variantOffset < 4; variantOffset += 1) {
      const generated = createGeneratedCase({
        index: generationIndex,
        customerType: scenario.customerType,
        productType: scenario.productType,
        workflowType: scenario.workflowType,
        scenarioId: scenario.id,
        difficulty: ['light', 'standard', 'deep', 'deep'][variantOffset],
        evidenceDepth: ['light', 'standard', 'deep', 'deep'][variantOffset],
      });
      generationIndex += 1;
      assert.equal(generated.scenarioId, scenario.id, `${scenario.id} must remain selectable by exact ID.`);
      assert.equal(generated.customerType, scenario.customerType);
      assert.equal(generated.productType, scenario.productType);
      assert.equal(generated.workflowType, scenario.workflowType);
      assertNoHiddenFindingLeak(generated, `${generated.id} pre-submission case`);
      assert.deepEqual(hiddenFindingLeakPaths(generated), []);
      const truth = getGeneratedCaseTruth(generated, { submitted: true });
      assert.ok(truth?.hiddenFinding, `${generated.id} must have a frozen explicit hidden finding after submission.`);
      generatedCases.push(generated);
    }
  }
}

assert.equal(scenarioKeys.size, 84, 'Every catalog scenario must be exercised.');
assert.equal(generatedCases.length, 336, 'Four generated variations per scenario must be exercised.');
assertNoHiddenFindingLeak(builtInCases, 'built-in pre-submission catalog');

const findings = new Set(generatedCases.map((activeCase) => (
  getGeneratedCaseTruth(activeCase, { submitted: true })?.hiddenFinding
)));
assert.ok(
  findings.has(FINAL_FINDINGS.FRAUD_CONFIRMED)
  && [...findings].some((finding) => finding !== FINAL_FINDINGS.FRAUD_CONFIRMED),
  'Generated variations must include both concerning and explainable outcomes.',
);

for (const activeCase of [...builtInCases, ...generatedCases]) {
  const tools = [...(activeCase.availableTools ?? []), ...(activeCase.requiredTools ?? [])];
  assert.equal(tools.includes('KYB Review'), false, `${activeCase.id} must not expose standalone KYB Review.`);
  if (activeCase.productType === PRODUCT_TYPES.PAYROLL_PRODUCT) {
    assert.equal(tools.includes('Transaction History'), false, `${activeCase.id} payroll must not expose Transaction History.`);
    assert.ok(
      [WORKFLOW_TYPES.PAYROLL_CHANGE_ALERT, WORKFLOW_TYPES.PAYROLL_ACCOUNT_TAKEOVER]
        .includes(activeCase.workflowType),
      `${activeCase.id} payroll must use a payroll workflow.`,
    );
  }
}

const businessCases = generatedCases.filter((activeCase) => activeCase.customerType === CUSTOMER_TYPES.BUSINESS);
for (const activeCase of businessCases) {
  const research = getBusinessResearch(activeCase);
  assert.ok(
    businessResearchSections.every((section) => research.recordsBySection[section.id]?.length),
    `${activeCase.id} Business 360 must include all reusable profile sections.`,
  );
  for (const result of research.profile.research) {
    assert.ok(lunaBusinessResearchStatuses.includes(result.status));
    assert.ok(result.source);
    assert.ok(result.checkedDate);
    assert.doesNotMatch(
      `${result.status} ${result.finding}`,
      /\b(?:fraud|fraudulent|fake business|shell company|nonexistent business)\b/i,
    );
  }
}

const businessDossier = getBusiness360Dossier(businessCases[0]);
for (const owner of businessDossier.owners) {
  for (const field of [
    'fullLegalName',
    'dateOfBirth',
    'trainingId',
    'ownershipPercentage',
    'businessTitle',
    'controllingPartyStatus',
    'guarantorStatus',
    'personalPhone',
    'personalEmail',
    'currentResidentialAddress',
    'previousResidentialAddress',
    'identityVerificationStatus',
    'addressVerificationStatus',
  ]) assert.ok(owner[field], `Business owner ${owner.id} must include ${field}.`);
}

const payrollCases = generatedCases.filter((activeCase) => activeCase.productType === PRODUCT_TYPES.PAYROLL_PRODUCT);
const builtInPayrollCase = builtInCases.find((activeCase) => activeCase.id === 'FA-CR-24003');
assert.ok(builtInPayrollCase.availableTools.includes('Business 360'));
assert.ok(builtInPayrollCase.availableTools.includes('Employee Profile'));
assert.ok(builtInPayrollCase.availableTools.includes('Payroll History'));
assert.equal(getPayrollHistory(builtInPayrollCase).contractIssues.length, 0);
const observedRunTypes = new Set();
const observedRunStates = new Set();
let sawSplitDeposit = false;
let sawPaperCheck = false;
for (const activeCase of payrollCases) {
  const workspace = getPayrollHistory(activeCase);
  assert.ok(workspace.companyPayrollProfile);
  assert.equal(workspace.contractIssues.length, 0, `${activeCase.id} payroll must reconcile.`);
  for (const run of workspace.payrollRuns) {
    observedRunTypes.add(run.runType);
    observedRunStates.add(run.status);
    assert.ok(run.fundingStatus, `${run.id} must state funding status.`);
    assert.equal(run.employeeCount, run.employees.length);
    for (const employee of run.employees) {
      const paystub = employee.paystub;
      assert.ok(paystub.paymentMethod);
      assert.ok(paystub.settlementStatus);
      const destinationTotal = paystub.paymentDestinations
        .reduce((sum, destination) => sum + Number(destination.amount ?? 0), 0);
      assert.equal(
        Math.round(destinationTotal * 100),
        Math.round(Number(paystub.summary.netPay) * 100),
        `${paystub.id} destinations must reconcile to net pay.`,
      );
      sawSplitDeposit ||= paystub.paymentDestinations.length > 1;
      sawPaperCheck ||= paystub.paymentMethod === 'Paper check';
      const selectedHistory = employeePayrollHistory(workspace, employee.employeeId);
      assert.ok(selectedHistory.paychecks.length);
      assert.ok(selectedHistory.paychecks.every((paycheck) => paycheck.employeeId === employee.employeeId));
    }
  }
  const employees = getEmployeeProfiles(activeCase);
  for (const employee of employees) {
    for (const field of [
      'legalName',
      'dateOfBirth',
      'trainingId',
      'currentResidentialAddress',
      'previousResidentialAddress',
      'id',
      'employer',
      'department',
      'role',
      'position',
      'manager',
      'status',
      'workLocation',
      'hireDate',
      'terminationDate',
      'paySchedule',
      'compensationType',
      'currentRate',
      'rateHistory',
      'w4FilingStatus',
      'w4MultipleJobsSelection',
      'w4Dependents',
      'w4OtherIncome',
      'w4Deductions',
      'w4ExtraWithholding',
      'federalElection',
      'stateElection',
      'localElection',
      'taxJurisdiction',
      'taxExemptionStatus',
      'taxEffectiveDate',
    ]) assert.notEqual(employee[field], undefined, `${activeCase.id} employee ${employee.id} must include ${field}.`);
  }
}
for (const requiredType of ['Regular', 'Bonus', 'Off-cycle', 'Correction', 'Reversal']) {
  assert.ok(observedRunTypes.has(requiredType), `Generated payroll must cover ${requiredType} runs.`);
}
for (const requiredState of ['Pending', 'Failed', 'Returned']) {
  assert.ok(observedRunStates.has(requiredState), `Generated payroll must cover ${requiredState} runs.`);
}
assert.ok(sawSplitDeposit, 'Payroll variations must include split deposits.');
assert.ok(sawPaperCheck, 'Payroll variations must include paper checks.');

const personalFinancial = getFinancialInvestigation(
  generatedCases.find((activeCase) => (
    activeCase.customerType === CUSTOMER_TYPES.PERSONAL
    && activeCase.productType === PRODUCT_TYPES.DEPOSIT_ACCOUNT
  )),
);
const businessFinancial = getFinancialInvestigation(
  businessCases.find((activeCase) => activeCase.productType !== PRODUCT_TYPES.PAYROLL_PRODUCT),
);
const payrollFinancial = getFinancialInvestigation(payrollCases[0]);
assert.ok(personalFinancial.sectionIds.includes('account-review'));
assert.ok(personalFinancial.sectionIds.includes('deposits'));
assert.equal(personalFinancial.sectionIds.includes('payroll'), false);
assert.equal(businessFinancial.sectionIds.includes('deposits'), false);
assert.ok(payrollFinancial.sectionIds.includes('payroll'));
assert.equal(payrollFinancial.sectionIds.includes('deposits'), false);
for (const comparison of [
  ...personalFinancial.comparisons,
  ...businessFinancial.comparisons,
  ...payrollFinancial.comparisons,
]) {
  assert.ok(comparison.baselineDateRange);
  assert.ok(comparison.currentDateRange);
  assert.notEqual(comparison.baseline, undefined);
  assert.notEqual(comparison.current, undefined);
  assert.ok(comparison.supportRecordIds.length);
}
assert.ok(payrollFinancial.comparisons.some((item) => item.label === 'Payroll funding totals'));

const paymentCase = payrollCases.find((activeCase) => getFinancialRecords(activeCase).paymentVerification?.length);
const paymentRecords = getFinancialRecords(paymentCase).paymentVerification;
const paymentRecord = paymentRecords[0];
const found = resolvePaymentLookup(paymentRecords, {
  bankCode: paymentRecord.bankCode,
  destinationId: paymentRecord.destinationId,
  ownerName: paymentRecord.accountHolder,
});
assert.equal(found.state, 'found');
assert.equal(found.record.id, paymentRecord.id);
const notFound = resolvePaymentLookup(paymentRecords, {
  bankCode: paymentRecord.bankCode,
  destinationId: 'DESTINATION-NOT-FOUND',
  ownerName: paymentRecord.accountHolder,
});
assert.deepEqual(notFound, { state: 'not-found', record: null, nameMatchResult: 'Destination Not Found' });

const contaminatedPayroll = {
  employeeProfiles: [{
    id: 'EMP-1',
    paymentHistory: [
      {
        effectiveDate: '2026-01-01',
        method: 'Direct deposit',
        destinations: [{ id: 'OLD', bankCode: 'BANK-OLD', destinationId: 'DEST-OLD' }],
      },
      {
        effectiveDate: '2026-07-01',
        method: 'Direct deposit',
        destinations: [{ id: 'NEW', bankCode: 'BANK-NEW', destinationId: 'DEST-NEW' }],
      },
    ],
  }],
  payrollRuns: [{
    id: 'RUN-MAY',
    payDate: '2026-05-31',
    employees: [{
      employeeId: 'EMP-1',
      paystub: {
        id: 'STUB-MAY',
        payDate: '2026-05-31',
        summary: { netPay: 1000 },
        paymentDestinations: [{
          bankCode: 'BANK-NEW',
          destinationId: 'DEST-NEW',
          amount: 1000,
          firstSeen: '2026-07-01',
        }],
      },
    }],
  }, {
    id: 'RUN-JUN-GAP',
    payDate: '2026-06-15',
    employees: [{
      employeeId: 'EMP-MISSING',
      paystub: {
        id: 'STUB-JUN-GAP',
        payDate: '2026-06-15',
        summary: { netPay: 900 },
        paymentDestinations: [{
          bankCode: 'BANK-JULY',
          destinationId: 'DEST-JULY',
          amount: 900,
          firstSeen: '2026-07-01',
        }],
      },
    }],
  }],
};
const migratedDestinations = migrateHistoricalPayrollDestinations(contaminatedPayroll);
assert.equal(
  migratedDestinations.payrollRuns[0].employees[0].paystub.paymentDestinations[0].destinationId,
  'DEST-OLD',
);
const unavailableDestination = migratedDestinations.payrollRuns[1].employees[0].paystub.paymentDestinations[0];
assert.equal(unavailableDestination.destinationUnavailable, true);
assert.equal(unavailableDestination.destinationId, 'Unavailable');
assert.doesNotMatch(JSON.stringify(unavailableDestination), /DEST-JULY/);
assert.deepEqual(migrateHistoricalPayrollDestinations(migratedDestinations), migratedDestinations);

function legacyPayrollCase(id, events = []) {
  return {
    id,
    customerType: CUSTOMER_TYPES.BUSINESS,
    productType: PRODUCT_TYPES.PAYROLL_PRODUCT,
    workflowType: WORKFLOW_TYPES.CREDIT_RISK_REVIEW,
    domainSchemaVersion: 2,
    scenarioId: 'legacy-payroll-credit',
    caseTruth: {
      finalFinding: FINAL_FINDINGS.CREDIT_RISK_CONCERN,
      findingBasis: 'Existing payroll credit review finding.',
    },
    events,
  };
}

const defaultPayroll = migrateGeneratedCase(legacyPayrollCase('LEGACY-PAYROLL-DEFAULT'));
assert.equal(defaultPayroll.workflowType, WORKFLOW_TYPES.PAYROLL_CHANGE_ALERT);
assert.equal(defaultPayroll.caseTruth.hiddenFinding, FINAL_FINDINGS.CREDIT_RISK_CONCERN);
assert.equal(defaultPayroll.legacyMetadata.workflowReassignments.length, 1);
assert.deepEqual(migrateGeneratedCase(defaultPayroll), defaultPayroll);

const takeoverPayroll = migrateGeneratedCase(legacyPayrollCase('LEGACY-PAYROLL-ATO', [{
  id: 'SESSION-1',
  eventType: 'Unauthorized session compromise',
  detail: 'An unauthorized session compromise event was explicitly recorded.',
}]));
assert.equal(takeoverPayroll.workflowType, WORKFLOW_TYPES.PAYROLL_ACCOUNT_TAKEOVER);
assert.equal(takeoverPayroll.caseTruth.hiddenFinding, FINAL_FINDINGS.CREDIT_RISK_CONCERN);
assert.deepEqual(migrateGeneratedCase(takeoverPayroll), takeoverPayroll);

const derivedTruth = migrateLegacyCaseTruth({
  id: 'LEGACY-FINDING',
  customerType: CUSTOMER_TYPES.BUSINESS,
  productType: PRODUCT_TYPES.BUSINESS_ACCOUNT,
  workflowType: WORKFLOW_TYPES.BUSINESS_PAYMENT_INSTRUCTION_CHANGE_ALERT,
  caseTruth: {
    classification: 'Mailbox access and unrelated destination were established.',
    operationalDecision: 'Hold and Escalate',
  },
});
assert.ok(derivedTruth.hiddenFinding);
const frozenTruth = migrateLegacyCaseTruth({
  id: 'LEGACY-FINDING',
  customerType: CUSTOMER_TYPES.BUSINESS,
  productType: PRODUCT_TYPES.BUSINESS_ACCOUNT,
  workflowType: WORKFLOW_TYPES.BUSINESS_PAYMENT_INSTRUCTION_CHANGE_ALERT,
  caseTruth: derivedTruth,
  events: [{ detail: 'Narrative changed after the one-time derivation.' }],
});
assert.equal(frozenTruth.hiddenFinding, derivedTruth.hiddenFinding);

const workedCaseId = 'WORKED-CASE-1';
const workedLegacy = {
  id: workedCaseId,
  customerType: CUSTOMER_TYPES.BUSINESS,
  productType: PRODUCT_TYPES.BUSINESS_ACCOUNT,
  workflowType: WORKFLOW_TYPES.BUSINESS_PAYMENT_INSTRUCTION_CHANGE_ALERT,
  domainSchemaVersion: 2,
  caseTruth: { finalFinding: FINAL_FINDINGS.INCONCLUSIVE },
};
const rawPersistence = {
  [storageKeys.completed]: { [workedCaseId]: ['KYB Review', 'Business 360'] },
  [storageKeys.notes]: { [workedCaseId]: [{ id: 'NOTE-1', source: 'KYB Review', text: 'Worked note survives.' }] },
  [storageKeys.actions]: { [workedCaseId]: [{ id: 'ACTION-1', sourceTool: 'KYB Review', detail: 'Worked action survives.' }] },
  [storageKeys.quickPad]: {
    [workedCaseId]: {
      items: [
        { id: 'KYB:REG-1', label: 'Registration', value: 'REG-1', sourceTool: 'KYB Review' },
        { id: 'Business 360:REG-1', label: 'Registration', value: 'REG-1', sourceTool: 'Business 360' },
      ],
      scratch: 'Worked Quick Pad text survives.',
    },
  },
  [storageKeys.packages]: {
    [workedCaseId]: [{
      id: 'PACKAGE-1',
      caseId: workedCaseId,
      completedTools: ['KYB Review'],
      requiredTools: ['KYB Review'],
      pinnedEvidence: ['KYB-1', 'REG-1', 'SOS-1', 'EIN-1'],
    }],
  },
};
const migratedPersistence = migratePersistenceResources(rawPersistence, [workedLegacy]);
const migratedPersistenceAgain = migratePersistenceResources(
  migratedPersistence.rawByKey,
  migratedPersistence.generatedCases,
);
assert.deepEqual(migratedPersistenceAgain, migratedPersistence);
assert.equal(migratedPersistence.generatedCases[0].id, workedCaseId);
assert.equal(migratedPersistence.rawByKey[storageKeys.notes][workedCaseId][0].id, 'NOTE-1');
assert.equal(migratedPersistence.rawByKey[storageKeys.packages][workedCaseId][0].id, 'PACKAGE-1');
assert.deepEqual(
  migratedPersistence.rawByKey[storageKeys.completed][workedCaseId],
  ['Business 360'],
);
assert.equal(
  migratedPersistence.rawByKey[storageKeys.quickPad][workedCaseId].items.length,
  1,
);
assert.deepEqual(
  migratedPersistence.rawByKey[storageKeys.schemaVersion].global.migrations,
  CASE_MIGRATION_IDS,
);

const cloudSnapshot = {
  generatedCases: {
    items: {
      [workedCaseId]: {
        value: workedLegacy,
        position: 1,
        version: { at: 1, deviceId: 'contract-test' },
        deleted: false,
      },
    },
  },
  resources: {
    [storageKeys.notes]: {
      entries: {
        [workedCaseId]: {
          value: rawPersistence[storageKeys.notes][workedCaseId],
          version: { at: 1, deviceId: 'contract-test' },
        },
      },
    },
  },
};
const migratedCloud = migrateCloudSnapshotCaseData(cloudSnapshot);
assert.deepEqual(migrateCloudSnapshotCaseData(migratedCloud), migratedCloud);
assert.equal(migratedCloud.generatedCases.items[workedCaseId].value.id, workedCaseId);

const panelSource = fs.readFileSync('src/InvestigationToolPanel.jsx', 'utf8');
assert.match(panelSource, /data-destination-unavailable/);
assert.doesNotMatch(panelSource, /case 'KYB Review'|toolName === 'KYB Review'/);

console.log(
  `Integrated functional contract passed for ${builtInCases.length} built-in cases, `
  + `${scenarioKeys.size} scenarios, and ${generatedCases.length} generated variations.`,
);
