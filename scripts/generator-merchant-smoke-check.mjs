import { claimGeneratorChoices, coreClaimTypes } from '../src/data/claimRegistry.js';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import { getFinancialInvestigation } from '../src/data/financialInvestigationRecords.js';
import { getMerchantIntelligence } from '../src/data/merchantIntelligenceRecords.js';
import { getReviewChoices } from '../src/data/reviewPackage.js';
import { scenarioTemplates } from '../src/data/scenarioEngine.js';

const failures = [];
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
    const sections = new Set(merchant.records.map((item) => item.section));
    for (const section of ['overview', 'history', 'authorization', 'fulfillment', 'disputes', 'reason-code']) {
      if (!sections.has(section)) failures.push(`${scenario.id} is missing Merchant Intelligence section ${section}.`);
    }
    for (const field of ['entryMode', 'avs', 'cvv', 'threeDS', 'otp', 'walletToken', 'device', 'ip', 'attempts']) {
      if (!merchant.authorization?.[field]) failures.push(`${scenario.id} is missing merchant authorization field ${field}.`);
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
