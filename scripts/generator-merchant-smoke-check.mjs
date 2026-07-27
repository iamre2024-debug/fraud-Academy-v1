import { claimGeneratorChoices, coreClaimTypes } from '../src/data/claimRegistry.js';
import {
  createGeneratedCase,
  getGeneratedCaseTruth,
} from '../src/data/generatedCases.js';
import {
  CASE_DOMAIN_VERSION,
  FINAL_FINDINGS,
  WORKFLOW_TYPES,
  isWorkflowEnabled,
  operationalDecisionsForWorkflow,
  validateCaseDomain,
} from '../src/data/caseDomain.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { getFinancialInvestigation } from '../src/data/financialInvestigationRecords.js';
import { getKybReview } from '../src/data/kybReviewRecords.js';
import { getMerchantIntelligence } from '../src/data/merchantIntelligenceRecords.js';
import {
  buildCustomerDocumentResponse,
  customerDocumentResponseOutcomes,
  getCustomerDocumentResponseOutcome,
} from '../src/data/customerDocumentResponses.js';
import { getCaseDocuments, getCaseDocumentRequests } from '../src/data/documentRecords.js';
import { scenarioTemplates } from '../src/data/scenarioEngine.js';
import { trainingCases } from '../src/data/cases.js';

const failures = [];
const genericIntakePattern = /review the related|available when that tool|available for comparison|intake channel:|fictional subject|fictional packet contains/i;
const answerBearingPattern = /\b(?:synthetic identity|bust[- ]?out|first[- ]party fraud|friendly fraud|email compromise|compromised mailbox|spoofed employee email)\b/i;
const generatedAccountIds = new Set();
const generatedCustomerResponseOutcomes = new Set();
const finalFindingValues = new Set(Object.values(FINAL_FINDINGS));
const allScenarios = coreClaimTypes.flatMap((claimType) => claimType.scenarios.map((scenario) => ({ claimType, scenario })));
const scenarioIds = new Set(allScenarios.map(({ scenario }) => scenario.id));

if (coreClaimTypes.length !== 14) failures.push(`Expected 14 neutral review workflows, found ${coreClaimTypes.length}.`);
if (allScenarios.length !== 84) failures.push(`Expected 84 neutral scenario packets, found ${allScenarios.length}.`);
if (scenarioIds.size !== allScenarios.length) failures.push('Neutral scenario IDs are not unique.');
if (scenarioTemplates.length < allScenarios.length) failures.push('Scenario Engine does not cover every unified registry scenario.');

const generatorChoicesText = JSON.stringify(claimGeneratorChoices());
if (/correctDetermination|caseTruth|findingBasis/.test(generatorChoicesText)) failures.push('Generator choices expose hidden truth.');
if (answerBearingPattern.test(generatorChoicesText)) failures.push('Generator choices expose an answer-bearing initial classification.');
if (scenarioTemplates.some((item) => item.caseTruth || item.correctDetermination || item.finalFinding)) {
  failures.push('Scenario Engine previews expose hidden truth metadata.');
}

let sequence = 1780001000000;
for (const { claimType, scenario } of allScenarios) {
  const customerType = scenario.customerTypes[0];
  const productType = scenario.productTypes.find((candidate) => isWorkflowEnabled(customerType, candidate, claimType.workflowType));
  const domain = { customerType, productType, workflowType: claimType.workflowType };
  const generated = createGeneratedCase({
    index: sequence,
    ...domain,
    scenarioId: scenario.id,
    difficulty: 'deep',
    evidenceDepth: 'deep',
  });
  sequence += 1;

  if (!validateCaseDomain(generated).valid) failures.push(`${scenario.id} generated an unsupported domain combination.`);
  if (generated.customerType !== customerType || generated.productType !== productType || generated.workflowType !== claimType.workflowType) {
    failures.push(`${scenario.id} did not preserve customer, product, and workflow routing.`);
  }
  if (generated.domainSchemaVersion !== CASE_DOMAIN_VERSION || generated.generatedPacketVersion !== 7) {
    failures.push(`${scenario.id} is missing current domain or packet version metadata.`);
  }
  if (generated.subtype !== scenario.alertReason || generated.alertReason !== scenario.alertReason || generated.scenarioId !== scenario.id) {
    failures.push(`${scenario.id} did not preserve its neutral alert and scenario selection.`);
  }
  if (Object.prototype.hasOwnProperty.call(generated, 'caseTruth')
    || Object.prototype.hasOwnProperty.call(generated, 'correctDetermination')
    || Object.prototype.hasOwnProperty.call(generated, 'howItHappens')) {
    failures.push(`${scenario.id} exposes hidden truth on the public generated case.`);
  }
  if (getGeneratedCaseTruth(generated) !== undefined) failures.push(`${scenario.id} exposes truth before submission.`);
  const truth = getGeneratedCaseTruth(generated, { submitted: true });
  if (!truth?.operationalDecision || !truth.finalFinding || !truth.findingBasis) failures.push(`${scenario.id} is missing private post-submission truth.`);
  if (!operationalDecisionsForWorkflow(generated.workflowType).includes(truth?.operationalDecision)) {
    failures.push(`${scenario.id} has a private operational decision that is invalid for its workflow.`);
  }
  if (!finalFindingValues.has(truth?.finalFinding)) failures.push(`${scenario.id} has an unsupported final finding.`);

  const publicText = JSON.stringify({
    type: generated.type,
    subtype: generated.subtype,
    scenarioTitle: generated.scenarioTitle,
    alertReason: generated.alertReason,
    queueReason: generated.queueReason,
    shortSummary: generated.shortSummary,
    keyFacts: generated.keyFacts,
    intakeAnswers: generated.intakeAnswers,
    events: generated.events,
  });
  if (answerBearingPattern.test(publicText)) failures.push(`${scenario.id} exposes an answer-bearing pattern before submission.`);
  if (/\bSSN\b/.test(JSON.stringify(generated))) failures.push(`${scenario.id} generated unsafe SSN wording instead of Training ID.`);
  if (!generated.timelineEvents?.length || !generated.evidenceDocuments?.length || !generated.intakeAnswers?.length) {
    failures.push(`${scenario.id} is missing complete generated outputs.`);
  }
  if (!generated.accountId?.startsWith('ACCT-')) failures.push(`${scenario.id} is missing its Account ID document lookup key.`);
  if (generatedAccountIds.has(generated.accountId)) failures.push(`${scenario.id} reused Account ID ${generated.accountId}.`);
  generatedAccountIds.add(generated.accountId);
  if (generated.customer?.relationship?.find((item) => item.label === 'Account ID')?.value !== generated.accountId) {
    failures.push(`${scenario.id} does not expose its Account ID in Customer 360.`);
  }
  if (/fictional packet contains both routine and exception evidence/i.test(generated.shortSummary)) {
    failures.push(`${scenario.id} still uses the placeholder short summary.`);
  }
  for (const expectedDetail of [generated.person, generated.amount, generated.reportedDate, generated.issueStartDate, generated.transactionInfo]) {
    if (!generated.shortSummary.includes(expectedDetail)) failures.push(`${scenario.id} short summary is missing generated detail: ${expectedDetail}`);
  }
  if (generated.caseBriefing?.summary !== generated.shortSummary) failures.push(`${scenario.id} briefing and queue summary diverge.`);
  if (generated.allegation !== generated.reportedAllegation) failures.push(`${scenario.id} does not keep the allegation separate from the full briefing.`);
  if (generated.documents.some((item) => /fictional case packet|available for .* fictional training packet/i.test(item.detail))) {
    failures.push(`${scenario.id} still has generic generated document text.`);
  }
  if (generated.intakeAnswers.length !== claimType.intakePrompts.length) failures.push(`${scenario.id} does not answer every intake prompt.`);
  if (generated.intakeAnswers.some((item) => genericIntakePattern.test(item.answer) || item.answer.length < 45)) {
    failures.push(`${scenario.id} has a generic or incomplete intake answer.`);
  }
  if (generated.taxonomyTags?.customerType !== customerType
    || generated.taxonomyTags?.productType !== productType
    || generated.taxonomyTags?.workflowType !== claimType.workflowType) {
    failures.push(`${scenario.id} is missing explicit domain taxonomy tags.`);
  }
  if (generated.scoringRules.complexityDependencies !== 2 || generated.scoringRules.missingDocumentCount < 1) {
    failures.push(`${scenario.id} did not apply deep-review complexity.`);
  }

  const usesLogin = generated.availableTools.includes('Login History');
  if (usesLogin && generated.loginHistory.length < 3) failures.push(`${scenario.id} is missing access history.`);
  if (!usesLogin && generated.loginHistory.length) failures.push(`${scenario.id} contains access history outside its workflow.`);
  if (customerType === 'personal' && generated.availableTools.some((tool) => ['Business 360', 'KYB Review', 'Employee Profile', 'Payroll History'].includes(tool))) {
    failures.push(`${scenario.id} exposes business-only tools on a personal case.`);
  }

  if (generated.availableTools.includes('Business 360') && generated.toolResults.business360?.length < 3) {
    failures.push(`${scenario.id} is missing complete Business 360 relationships.`);
  }
  if (generated.availableTools.includes('KYB Review') && generated.toolResults.businessIntel?.length < 3) {
    failures.push(`${scenario.id} is missing complete KYB relationship data.`);
  }
  if (generated.availableTools.includes('Employee Profile') && !generated.toolResults.employeeProfile?.length) {
    failures.push(`${scenario.id} is missing employee or payroll-party data.`);
  }
  if (generated.availableTools.includes('Payment Verification')) {
    const payment = generated.toolResults.paymentVerification?.[0];
    for (const field of ['object', 'bankName', 'accountType', 'accountHolder', 'ownerMatch', 'accountStatus', 'priorUse', 'firstSeen', 'bankCode', 'destinationId', 'verificationOutcome']) {
      if (!payment?.[field]) failures.push(`${scenario.id} is missing Payment Verification field ${field}.`);
    }
  }

  const merchantLane = [
    WORKFLOW_TYPES.UNAUTHORIZED_CARD_TRANSACTION_CLAIM,
    WORKFLOW_TYPES.MERCHANT_NON_FRAUD_DISPUTE,
  ].includes(claimType.workflowType);
  if (merchantLane) {
    const merchant = getMerchantIntelligence(generated);
    const sections = new Set(merchant.records.map((item) => item.section));
    for (const section of ['overview', 'history', 'authorization', 'fulfillment', 'disputes', 'reason-code']) {
      if (!sections.has(section)) failures.push(`${scenario.id} is missing Merchant Intelligence section ${section}.`);
    }
    for (const field of ['entryMode', 'avs', 'cvv', 'threeDS', 'otp', 'walletToken', 'device', 'ip', 'attempts']) {
      if (!merchant.authorization?.[field]) failures.push(`${scenario.id} is missing merchant authorization field ${field}.`);
    }
    if (!merchant.response?.status || !merchant.caseStatus || merchant.quickSummary.length !== 6) {
      failures.push(`${scenario.id} is missing the merchant response lifecycle summary.`);
    }
    if (!merchant.merchantDocuments.length || !merchant.customerDocuments.length || !merchant.network.documents.length) {
      failures.push(`${scenario.id} is missing merchant, customer, or network source documents.`);
    }
    const sourceDocuments = getCaseDocuments(generated);
    if (!sourceDocuments.length || sourceDocuments.some((document) => /Driver License|EIN Assignment|Utility Bill|Phone Ownership/i.test(document.title))) {
      failures.push(`${scenario.id} contains generic evidence documents instead of merchant source documents.`);
    }
    const requestDocuments = getCaseDocumentRequests(generated);
    if (requestDocuments.some((document) => document.folder !== 'Customer Evidence')) {
      failures.push(`${scenario.id} places merchant evidence in the customer request queue.`);
    }
    const requestedCustomerDocument = requestDocuments.find((document) => !document.pages.length);
    if (requestedCustomerDocument) {
      const outcome = getCustomerDocumentResponseOutcome(generated, requestedCustomerDocument);
      const response = buildCustomerDocumentResponse({
        activeCase: generated,
        document: requestedCustomerDocument,
        outcome,
        receivedDate: 'Jul 21, 2026',
      });
      generatedCustomerResponseOutcomes.add(outcome);
      if (outcome === 'no-response' && response.customerSubmission) failures.push(`${scenario.id} creates a submission for a no-response outcome.`);
      if (outcome !== 'no-response' && !response.customerSubmission?.pages?.length) failures.push(`${scenario.id} lacks a reviewable customer submission.`);
    }
  } else if (generated.toolResults.merchantIntelligence) {
    failures.push(`${scenario.id} contains a merchant packet outside a card claim or merchant dispute.`);
  }

  if ([WORKFLOW_TYPES.CREDIT_APPLICATION_REVIEW, WORKFLOW_TYPES.CREDIT_RISK_REVIEW].includes(claimType.workflowType)) {
    const credit = generated.toolResults.creditProfile;
    for (const field of ['family', 'relationshipStage', 'statedAnnualIncome', 'verifiedAnnualIncome', 'dti', 'creditScoreBand', 'tradelines', 'utilization', 'delinquencies', 'inquiries', 'averageMonthlyDeposits', 'averageMonthlyOutflow', 'nsfReturns', 'paymentHistory', 'completedDocuments', 'missingDocuments']) {
      if (credit?.[field] === undefined) failures.push(`${scenario.id} is missing structured credit field ${field}.`);
    }
    const financial = getFinancialInvestigation(generated);
    if (!financial.recordsByTab.overview.some((item) => item.id.endsWith('-CREDIT-PROFILE'))) {
      failures.push(`${scenario.id} does not expose its credit profile in Financial Investigation.`);
    }
  }
}

for (const outcome of customerDocumentResponseOutcomes) {
  if (!generatedCustomerResponseOutcomes.has(outcome)) failures.push(`Generated card cases do not exercise the ${outcome} customer-response outcome.`);
}

const enrichedBuiltIns = enrichTrainingCases(trainingCases);
const builtInAccountIds = new Set();
for (const builtIn of enrichedBuiltIns) {
  if (!builtIn.accountId?.startsWith('ACCT-') || builtInAccountIds.has(builtIn.accountId)) failures.push(`${builtIn.id} does not have a unique Account ID.`);
  builtInAccountIds.add(builtIn.accountId);
  if (!builtIn.intakeAnswers?.length || builtIn.intakeAnswers.some((item) => genericIntakePattern.test(item.answer) || item.answer.length < 45)) {
    failures.push(`${builtIn.id} has a generic or incomplete intake answer.`);
  }
}

const businessApplication = createGeneratedCase({
  index: sequence + 50,
  customerType: 'business',
  productType: 'business-loan',
  workflowType: WORKFLOW_TYPES.CREDIT_APPLICATION_REVIEW,
  difficulty: 'deep',
  evidenceDepth: 'deep',
});
for (const role of ['Business account holder', 'Application submitter', 'Beneficial owner', 'Control person', 'Personal guarantor', 'Authorized administrator']) {
  if (!businessApplication.parties.some((party) => party.role === role)) failures.push(`Business application is missing ${role}.`);
}
for (const role of ['Application submitter', 'Beneficial owner', 'Control person', 'Personal guarantor', 'Authorized administrator']) {
  if (!businessApplication.toolResults.businessIntel.some((item) => item.type === role)) failures.push(`Business application KYB is missing ${role}.`);
}
if (businessApplication.toolResults.creditProfile?.customerType !== 'Business') failures.push('Business application generated a consumer credit profile.');
if (businessApplication.toolResults.creditProfile?.dti !== 'Not used as the primary business measure') failures.push('Business application incorrectly uses consumer DTI as its business measure.');
const businessRevenue = businessApplication.toolResults.creditProfile?.statedAnnualIncome;
if (!businessApplication.toolResults.businessIntel.some((item) => item.type === 'Operating and revenue context' && item.value === businessRevenue)) {
  failures.push('Business application KYB and credit profile disagree on stated revenue.');
}
const businessKyb = getKybReview(businessApplication);
if (businessKyb.profile.revenue.find((item) => item[1] === 'Stated annual revenue')?.[2] !== Number(businessRevenue.replace(/[^0-9.]/g, ''))) {
  failures.push('Business application KYB and Financial Investigation disagree on stated revenue.');
}

const duplicateBilling = createGeneratedCase({
  index: sequence + 51,
  customerType: 'personal',
  productType: 'credit-card',
  workflowType: WORKFLOW_TYPES.MERCHANT_NON_FRAUD_DISPUTE,
  scenarioId: 'ncb-duplicate-billing',
  difficulty: 'deep',
  evidenceDepth: 'deep',
});
if (!/duplicate-processing/i.test(duplicateBilling.chargebackDecision?.reasonCode)) failures.push('Duplicate billing lacks a scenario-specific reason code.');
if (!/Two settled transactions/i.test(duplicateBilling.toolResults.merchantIntelligence?.records.find((item) => item.section === 'fulfillment')?.summary ?? '')) {
  failures.push('Duplicate billing lacks scenario-specific merchant evidence.');
}

const walletCase = createGeneratedCase({
  index: sequence + 52,
  customerType: 'personal',
  productType: 'credit-card',
  workflowType: WORKFLOW_TYPES.UNAUTHORIZED_CARD_TRANSACTION_CLAIM,
  scenarioId: 'fcb-wallet-token',
  difficulty: 'deep',
  evidenceDepth: 'deep',
});
if (!/tokenized-card/i.test(walletCase.chargebackDecision?.reasonCode)) failures.push('Wallet activity lacks a token-specific reason code.');
if (!/TKN-/i.test(walletCase.toolResults.merchantIntelligence?.authorization?.walletToken ?? '')) failures.push('Wallet activity lacks a wallet-token record.');

const lightCase = createGeneratedCase({
  index: sequence + 53,
  customerType: 'personal',
  productType: 'credit-card',
  workflowType: WORKFLOW_TYPES.CARD_ACCOUNT_TAKEOVER,
  scenarioId: 'ato-phishing-wallet',
  difficulty: 'light',
  evidenceDepth: 'light',
});
const deepCase = createGeneratedCase({
  index: sequence + 53,
  customerType: 'personal',
  productType: 'credit-card',
  workflowType: WORKFLOW_TYPES.CARD_ACCOUNT_TAKEOVER,
  scenarioId: 'ato-phishing-wallet',
  difficulty: 'deep',
  evidenceDepth: 'light',
});
if (deepCase.events.length <= lightCase.events.length
  || deepCase.toolResults.transactions.length <= lightCase.toolResults.transactions.length
  || deepCase.scoringRules.complexityDependencies <= lightCase.scoringRules.complexityDependencies) {
  failures.push('Difficulty does not increase evidence conflicts, dependencies, and record depth.');
}

if (failures.length) {
  console.error('Generator and Merchant Intelligence smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Generator and Merchant Intelligence smoke check passed for all 84 neutral scenarios across 14 workflows.');
