import { claimGeneratorChoices, coreClaimTypes } from '../src/data/claimRegistry.js';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { getFinancialInvestigation } from '../src/data/financialInvestigationRecords.js';
import { getKybReview } from '../src/data/kybReviewRecords.js';
import { getMerchantIntelligence } from '../src/data/merchantIntelligenceRecords.js';
import { getCaseDocuments, getCaseDocumentRequests } from '../src/data/documentRecords.js';
import { getReviewChoices } from '../src/data/reviewPackage.js';
import { scenarioTemplates } from '../src/data/scenarioEngine.js';
import { trainingCases } from '../src/data/cases.js';

const failures = [];
const genericIntakePattern = /review the related|available when that tool|available for comparison|intake channel:|fictional subject|fictional packet contains/i;
const generatedAccountIds = new Set();
const allScenarios = coreClaimTypes.flatMap((claimType) => claimType.scenarios.map((scenario) => ({ claimType, scenario })));
const scenarioIds = new Set(allScenarios.map(({ scenario }) => scenario.id));

if (coreClaimTypes.length !== 10) failures.push(`Expected 10 core claim types, found ${coreClaimTypes.length}.`);
if (allScenarios.length !== 79) failures.push(`Expected 79 Bible v2.1 scenarios, found ${allScenarios.length}.`);
if (scenarioIds.size !== allScenarios.length) failures.push('Scenario IDs are not unique.');
if (scenarioTemplates.length !== allScenarios.length) failures.push('Scenario Engine is not using the unified claim registry.');
if (JSON.stringify(claimGeneratorChoices()).includes('correctDetermination')) failures.push('Generator choices expose the hidden determination.');
if (scenarioTemplates.some((item) => item.caseTruth || item.correctDetermination)) failures.push('Scenario Engine previews expose hidden truth metadata.');

let sequence = 1780001000000;
for (const { claimType, scenario } of allScenarios) {
  const generated = createGeneratedCase({ index: sequence, claimTypeId: claimType.id, scenarioId: scenario.id, difficulty: 'deep', evidenceDepth: 'deep' });
  sequence += 1;

  if (generated.subtype !== scenario.subtype || generated.scenarioId !== scenario.id) failures.push(`${scenario.id} did not preserve its selected subtype.`);
  if (!generated.caseTruth?.correctDetermination || generated.correctDetermination !== generated.caseTruth.correctDetermination) failures.push(`${scenario.id} is missing hidden case truth.`);
  if (!getReviewChoices(generated).includes(generated.correctDetermination)) failures.push(`${scenario.id} has a hidden determination that is not valid for its decision rail.`);
  if (!generated.timelineEvents?.length || !generated.evidenceDocuments?.length || !generated.intakeAnswers?.length) failures.push(`${scenario.id} is missing complete generated outputs.`);
  if (generated.generatedPacketVersion !== 5) failures.push(`${scenario.id} is missing the complete-packet version marker.`);
  if (!generated.accountId?.startsWith('ACCT-')) failures.push(`${scenario.id} is missing its Account ID document lookup key.`);
  if (generatedAccountIds.has(generated.accountId)) failures.push(`${scenario.id} reused Account ID ${generated.accountId}.`);
  generatedAccountIds.add(generated.accountId);
  if (generated.customer?.relationship?.find((item) => item.label === 'Account ID')?.value !== generated.accountId) failures.push(`${scenario.id} does not expose its Account ID in Customer 360.`);
  if (/fictional packet contains both routine and exception evidence/i.test(generated.shortSummary)) failures.push(`${scenario.id} still uses the placeholder short summary.`);
  for (const expectedDetail of [generated.person, generated.amount, generated.reportedDate, generated.issueStartDate, scenario.statement, scenario.transactionInfo]) {
    if (!generated.shortSummary.includes(expectedDetail)) failures.push(`${scenario.id} short summary is missing generated case detail: ${expectedDetail}`);
  }
  if (generated.caseBriefing?.summary !== generated.shortSummary || generated.allegation !== generated.shortSummary) failures.push(`${scenario.id} does not use one complete narrative across its briefing summary fields.`);
  if (generated.documents.some((item) => /fictional case packet|available for .* fictional training packet/i.test(item.detail))) failures.push(`${scenario.id} still has generic generated document text.`);
  if (generated.intakeAnswers.length !== claimType.intakePrompts.length) failures.push(`${scenario.id} does not answer every Claim Intake prompt.`);
  if (generated.intakeAnswers.some((item) => genericIntakePattern.test(item.answer) || item.answer.length < 45)) failures.push(`${scenario.id} still has a generic or incomplete intake answer.`);
  if (generated.events.some((item) => /a record from another source|one source remains incomplete/i.test(item.detail))) failures.push(`${scenario.id} still has a generic timeline event.`);
  if (generated.identityRecords.some((item) => /fictional case|available for (case comparison|review)/i.test(item.history))) failures.push(`${scenario.id} still has generic identity history.`);
  if (generated.availableTools.includes('Financial Investigation') && generated.toolResults.financialIntel.some((item) => /record available|fictional .* financial record/i.test(`${item.value} ${item.context}`))) failures.push(`${scenario.id} still has generic Financial Investigation data.`);

  if (generated.availableTools.includes('Business 360') && generated.toolResults.business360?.length < 3) failures.push(`${scenario.id} is missing complete generated Business 360 relationships.`);
  if (generated.availableTools.includes('KYB Review') && generated.toolResults.businessIntel?.length < 4) failures.push(`${scenario.id} is missing complete generated KYB relationship data.`);
  if (generated.availableTools.includes('Employee Profile') && generated.toolResults.employeeProfile?.length < 2) failures.push(`${scenario.id} is missing complete generated employee-profile data.`);
  if (generated.availableTools.includes('Payment Verification')) {
    const payment = generated.toolResults.paymentVerification?.[0];
    for (const field of ['object', 'bankName', 'accountType', 'accountHolder', 'ownerMatch', 'accountStatus', 'priorUse', 'firstSeen', 'bankCode', 'destinationId', 'verificationOutcome']) {
      if (!payment?.[field]) failures.push(`${scenario.id} is missing Payment Verification field ${field}.`);
    }
  }
  if (!generated.taxonomyTags?.authorizationType || !generated.taxonomyTags?.lifecycleStage || !generated.taxonomyTags?.productRail || !generated.taxonomyTags?.riskPattern || !generated.taxonomyTags?.customerRole) failures.push(`${scenario.id} is missing multi-axis taxonomy tags.`);
  if (generated.scoringRules.complexityDependencies !== 2 || generated.scoringRules.missingDocumentCount < 1) failures.push(`${scenario.id} did not apply deep-review complexity.`);

  const usesLogin = generated.availableTools.includes('Login History');
  if (usesLogin && generated.loginHistory.length < 3) failures.push(`${scenario.id} is missing claim-appropriate access history.`);
  if (!usesLogin && generated.loginHistory.length) failures.push(`${scenario.id} contains access history outside its selected lane.`);

  const usesEmployee = generated.availableTools.includes('Employee Profile');
  if (usesEmployee && !generated.toolResults.employeeProfile?.length) failures.push(`${scenario.id} is missing required employee data.`);
  if (!usesEmployee && generated.toolResults.employeeProfile?.length) failures.push(`${scenario.id} contains employee data outside its selected lane.`);

  const merchantLane = ['fraud-chargeback', 'non-fraud-chargeback', 'first-party-fraud'].includes(claimType.id);
  if (merchantLane) {
    const merchant = getMerchantIntelligence(generated);
    const forbiddenChargebackTools = ['Financial Investigation', 'Payment Verification', 'Business 360', 'KYB Review', 'Employee Profile', 'Payroll History'];
    if (generated.availableTools.some((tool) => forbiddenChargebackTools.includes(tool))) failures.push(`${scenario.id} exposes a non-chargeback tool in the chargeback workflow.`);
    const sections = new Set(merchant.records.map((item) => item.section));
    for (const section of ['overview', 'history', 'authorization', 'fulfillment', 'disputes', 'reason-code']) {
      if (!sections.has(section)) failures.push(`${scenario.id} is missing Merchant Intelligence section ${section}.`);
    }
    for (const field of ['entryMode', 'avs', 'cvv', 'threeDS', 'otp', 'walletToken', 'device', 'ip', 'attempts']) {
      if (!merchant.authorization?.[field]) failures.push(`${scenario.id} is missing merchant authorization field ${field}.`);
    }
    if (!merchant.response?.status || !merchant.caseStatus || merchant.quickSummary.length !== 6) failures.push(`${scenario.id} is missing the chargeback response lifecycle summary.`);
    if (!merchant.merchantDocuments.length || !merchant.customerDocuments.length || !merchant.network.documents.length) failures.push(`${scenario.id} is missing source documents for a chargeback party.`);
    const sourceDocuments = getCaseDocuments(generated);
    if (!sourceDocuments.length || sourceDocuments.some((document) => /Driver License|EIN Assignment|Utility Bill|Phone Ownership/i.test(document.title))) failures.push(`${scenario.id} contains generic evidence-warehouse documents instead of chargeback source documents.`);
    if (getCaseDocumentRequests(generated).some((document) => document.folder !== 'Customer Evidence')) failures.push(`${scenario.id} places merchant-returned evidence in the customer request queue.`);
    if (merchant.scenario.id === 'recurring-cancellation') {
      const claimFields = new Map(merchant.claimDetails);
      const networkFields = new Map(merchant.network.fields);
      if (!claimFields.get('Cancellation date') || claimFields.get('Cancellation date') !== networkFields.get('Cancellation date sent')) failures.push(`${scenario.id} does not carry one cancellation date from intake through network submission.`);
      if (!claimFields.get('Cancellation method') || claimFields.get('Cancellation method') !== networkFields.get('Cancellation method sent')) failures.push(`${scenario.id} does not carry one cancellation method from intake through network submission.`);
    }
  } else if (generated.toolResults.merchantIntelligence) {
    failures.push(`${scenario.id} contains a merchant packet outside a merchant-review lane.`);
  }

  if (claimType.credit) {
    const credit = generated.toolResults.creditProfile;
    for (const field of ['family', 'relationshipStage', 'statedAnnualIncome', 'verifiedAnnualIncome', 'dti', 'creditScoreBand', 'tradelines', 'utilization', 'delinquencies', 'inquiries', 'averageMonthlyDeposits', 'averageMonthlyOutflow', 'nsfReturns', 'paymentHistory', 'completedDocuments', 'missingDocuments']) {
      if (credit?.[field] === undefined) failures.push(`${scenario.id} is missing structured credit field ${field}.`);
    }
    const financial = getFinancialInvestigation(generated);
    if (!financial.recordsByTab.overview.some((item) => item.id.endsWith('-CREDIT-PROFILE'))) failures.push(`${scenario.id} does not expose its credit profile in Financial Investigation.`);
    const nsfRecord = financial.recordsByTab.cash.find((item) => /NSF|returned-payment/i.test(item.title));
    if (nsfRecord?.value !== `${credit.nsfReturns} event(s)`) failures.push(`${scenario.id} formats an NSF event count as money instead of an event count.`);
  }
}

const legacySummaryCase = createGeneratedCase({ index: sequence + 50, claimTypeId: 'business-loan-bust-out', scenarioId: 'blo-sleeper-llc-sudden-draw' });
const placeholderSummary = `${legacySummaryCase.scenarioTitle}. The fictional packet contains both routine and exception evidence for an Evidence First review.`;
const [upgradedLegacyCase] = enrichTrainingCases([{
  ...legacySummaryCase,
  accountId: undefined,
  generatedPacketVersion: 3,
  shortSummary: placeholderSummary,
  allegation: placeholderSummary,
  caseBriefing: { ...legacySummaryCase.caseBriefing, summary: placeholderSummary },
  intakeAnswers: legacySummaryCase.intakeAnswers.map((item) => ({ ...item, answer: 'Review the related fictional case records and document what is available or missing.' })),
}]);
if (/fictional packet contains both routine and exception evidence/i.test(upgradedLegacyCase.shortSummary)) failures.push('Previously saved generated cases do not upgrade their placeholder summary when loaded.');
if (upgradedLegacyCase.caseBriefing?.summary !== upgradedLegacyCase.shortSummary) failures.push('Upgraded generated-case briefing summary does not match its complete short summary.');
if (upgradedLegacyCase.generatedPacketVersion !== 5 || !upgradedLegacyCase.accountId || upgradedLegacyCase.intakeAnswers.some((item) => genericIntakePattern.test(item.answer)) || upgradedLegacyCase.toolResults.business360?.length < 3 || upgradedLegacyCase.toolResults.businessIntel?.length < 4) failures.push('Previously saved generated cases do not upgrade their full investigation packet when loaded.');

const enrichedBuiltIns = enrichTrainingCases(trainingCases);
const builtInAccountIds = new Set();
for (const builtIn of enrichedBuiltIns) {
  if (!builtIn.accountId?.startsWith('ACCT-') || builtInAccountIds.has(builtIn.accountId)) failures.push(`${builtIn.id} does not have a unique Account ID.`);
  builtInAccountIds.add(builtIn.accountId);
  if (builtIn.customer?.relationship?.find((item) => item.label === 'Account ID')?.value !== builtIn.accountId) failures.push(`${builtIn.id} does not expose its Account ID in Customer 360.`);
  if (!builtIn.intakeAnswers?.length || builtIn.intakeAnswers.some((item) => genericIntakePattern.test(item.answer) || item.answer.length < 45)) failures.push(`${builtIn.id} has a generic or incomplete Claim Intake answer.`);
}

const sleeperBusiness = createGeneratedCase({ index: sequence + 51, claimTypeId: 'business-loan-bust-out', scenarioId: 'blo-sleeper-llc-sudden-draw', difficulty: 'deep', evidenceDepth: 'deep' });
if (sleeperBusiness.toolResults.creditProfile?.customerType !== 'Business') failures.push('Sleeper LLC generated a consumer credit profile instead of a business credit profile.');
if (sleeperBusiness.toolResults.creditProfile?.missingDocuments.some((item) => /paystub|income-source confirmation/i.test(item))) failures.push('Sleeper LLC still contains consumer-only document requirements.');
if (sleeperBusiness.toolResults.creditProfile?.dti !== 'Not used as the primary business measure') failures.push('Sleeper LLC still uses consumer debt-to-income logic.');
if (sleeperBusiness.parties.some((party) => party.role === 'Employer')) failures.push('Sleeper LLC incorrectly adds an employer as a case party.');
if (!sleeperBusiness.briefingDetails.rows.some((row) => row.label === 'Employer / business' && row.value === sleeperBusiness.profile.business)) failures.push('Sleeper LLC briefing does not show the generated business in its business field.');
if (sleeperBusiness.scenarioFamily !== 'Existing business account review' || sleeperBusiness.toolResults.creditProfile?.relationshipStage !== 'Existing relationship review') failures.push('Sleeper LLC does not preserve its dormant existing-business relationship context.');
if (sleeperBusiness.toolResults.financialIntel.some((item) => /debt-to-income/i.test(item.type))) failures.push('Sleeper LLC Financial Investigation still shows a consumer debt-to-income row.');
const sleeperRevenue = sleeperBusiness.toolResults.creditProfile?.statedAnnualIncome;
if (!sleeperBusiness.toolResults.businessIntel.some((item) => item.type === 'Operating and revenue context' && item.value === sleeperRevenue)) failures.push('Sleeper LLC Business 360 and credit profile disagree on stated revenue.');
const sleeperKyb = getKybReview(sleeperBusiness);
if (sleeperKyb.profile.revenue.find((item) => item[1] === 'Stated annual revenue')?.[2] !== Number(sleeperRevenue.replace(/[^0-9.]/g, ''))) failures.push('Sleeper LLC KYB and Financial Investigation disagree on stated revenue.');

const duplicateBilling = createGeneratedCase({ index: sequence + 1, claimTypeId: 'non-fraud-chargeback', scenarioId: 'ncb-duplicate-billing', difficulty: 'deep', evidenceDepth: 'deep' });
if (!/duplicate-processing/i.test(duplicateBilling.chargebackDecision?.reasonCode)) failures.push('Duplicate billing did not receive a scenario-specific reason code.');
if (!/Two settled transactions/i.test(duplicateBilling.toolResults.merchantIntelligence?.records.find((item) => item.section === 'fulfillment')?.summary ?? '')) failures.push('Duplicate billing did not receive scenario-specific merchant evidence.');

const walletCase = createGeneratedCase({ index: sequence + 2, claimTypeId: 'fraud-chargeback', scenarioId: 'fcb-wallet-token', difficulty: 'deep', evidenceDepth: 'deep' });
if (!/tokenized-card/i.test(walletCase.chargebackDecision?.reasonCode)) failures.push('Wallet fraud did not receive a token-specific reason code.');
if (!/TKN-/i.test(walletCase.toolResults.merchantIntelligence?.authorization?.walletToken ?? '')) failures.push('Wallet fraud did not receive a wallet-token authorization record.');

const lightCase = createGeneratedCase({ index: sequence + 3, claimTypeId: 'account-takeover', scenarioId: 'ato-phishing-wallet', difficulty: 'light', evidenceDepth: 'light' });
const deepCase = createGeneratedCase({ index: sequence + 3, claimTypeId: 'account-takeover', scenarioId: 'ato-phishing-wallet', difficulty: 'deep', evidenceDepth: 'light' });
if (deepCase.events.length <= lightCase.events.length || deepCase.toolResults.transactions.length <= lightCase.toolResults.transactions.length || deepCase.scoringRules.complexityDependencies <= lightCase.scoringRules.complexityDependencies) failures.push('Difficulty does not increase evidence conflicts, dependencies, and record depth.');

if (failures.length) {
  console.error('Generator and Merchant Intelligence smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Generator and Merchant Intelligence smoke check passed for all 79 Bible v2.1 subtype scenarios.');
