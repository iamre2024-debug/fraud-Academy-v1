import fs from 'node:fs';
import { trainingCases as baseCases } from '../src/data/cases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { buildCoreToolRecords } from '../src/data/coreToolRecords.js';
import { financialRecordsByCase } from '../src/data/financialRecords.js';
import { getFinancialInvestigation, financialInvestigationTabs } from '../src/data/financialInvestigationRecords.js';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import { getKybReview, kybReviewTabs, matchesKybReviewLookup } from '../src/data/kybReviewRecords.js';
import { buildKybReviewReport } from '../src/data/kybReviewReport.js';
import { buildLunaDebrief } from '../src/data/lunaDebrief.js';

const failures = [];
const cases = enrichTrainingCases(baseCases);
const remainingModules = [
  'Payment Verification',
  'KYB Review',
  'Document Viewer',
  'Link Analysis',
  'Timeline',
];

function fail(message) {
  failures.push(message);
}

function hasMerchantLane(activeCase) {
  return activeCase.availableTools?.includes('Merchant Intelligence')
    || ['fraud-chargeback', 'non-fraud-chargeback', 'first-party-fraud'].includes(activeCase.claimTypeId)
    || activeCase.id === 'FA-CB-24007';
}

function applicableFinancialTabs(activeCase) {
  return financialInvestigationTabs.filter((tab) => tab.id !== 'merchant' || hasMerchantLane(activeCase));
}

for (const activeCase of cases) {
  for (const tool of remainingModules) {
    const data = buildCoreToolRecords(tool, activeCase, { rows: [] });
    if (!data || !Array.isArray(data.columns) || data.columns.length !== 7) {
      fail(`${activeCase.id} ${tool}: expected a seven-column investigation record set.`);
      continue;
    }
    if (!Array.isArray(data.rows) || data.rows.length === 0) {
      fail(`${activeCase.id} ${tool}: expected case-specific records.`);
    }
    for (const record of data.rows) {
      if (!record.id || !Array.isArray(record.values) || record.values.length !== data.columns.length || !record.detail) {
        fail(`${activeCase.id} ${tool}: malformed record ${record.id ?? 'unknown'}.`);
        break;
      }
    }
  }

  const financialWorkspace = getFinancialInvestigation(activeCase);
  if (financialInvestigationTabs.length !== 10) fail(`${activeCase.id} Financial Investigation: expected ten Bible v2 sections.`);
  for (const tab of applicableFinancialTabs(activeCase)) {
    if (!financialWorkspace.recordsByTab[tab.id]?.length) fail(`${activeCase.id} Financial Investigation: ${tab.label} has no case-specific records.`);
  }
  if (!hasMerchantLane(activeCase) && financialWorkspace.recordsByTab.merchant?.length) {
    fail(`${activeCase.id} Financial Investigation: merchant records must remain empty outside merchant lanes.`);
  }

  const kybWorkspace = getKybReview(activeCase);
  if (kybReviewTabs.length !== 8) fail(`${activeCase.id} KYB Review: expected eight review sections.`);
  for (const tab of kybReviewTabs) {
    if (!kybWorkspace.recordsByTab[tab.id]?.length) fail(`${activeCase.id} KYB Review: ${tab.label} has no case-specific records.`);
  }
  for (const lookupValue of kybWorkspace.lookupValues) {
    if (!matchesKybReviewLookup(kybWorkspace, lookupValue)) fail(`${activeCase.id} KYB Review: exact lookup failed for ${lookupValue}.`);
  }
  if (matchesKybReviewLookup(kybWorkspace, kybWorkspace.profile.legalName.slice(0, 5))) fail(`${activeCase.id} KYB Review: partial lookup must not reveal the profile.`);
  const kybReport = buildKybReviewReport(activeCase);
  if (kybReport.title !== 'KYB Business Report' || kybReport.pages.length !== 3 || kybReport.relatedTools.includes('Business Intelligence')) {
    fail(`${activeCase.id} KYB Review: report contract is incomplete or uses a retired tool name.`);
  }
}

const generatedCase = createGeneratedCase({ index: 8081, claimTypeId: 'business-loan-bust-out', evidenceDepth: 'deep', difficulty: 'deep' });
const generatedFinancial = getFinancialInvestigation(generatedCase);
const generatedKyb = getKybReview(generatedCase);
if (!applicableFinancialTabs(generatedCase).every((tab) => generatedFinancial.recordsByTab[tab.id]?.length)) fail('Generated Financial Investigation must populate every applicable section.');
if (generatedFinancial.recordsByTab.merchant?.length) fail('Generated non-merchant Financial Investigation must not receive merchant records.');
if (!kybReviewTabs.every((tab) => generatedKyb.recordsByTab[tab.id]?.length)) fail('Generated KYB Review must populate all eight sections.');
if (!generatedKyb.profile.legalName.includes(generatedCase.profile.business)) fail('Generated KYB Review must use the generated case business instead of a built-in profile.');

const creditReview = cases.find((item) => item.id === 'FA-CR-24003');
const paymentData = buildCoreToolRecords('Payment Verification', creditReview, { rows: [] });
const paymentText = JSON.stringify(paymentData);
if (!paymentText.includes('Bank Code') || !paymentText.includes('Destination ID')) {
  fail('Payment Verification must preserve Bank Code and Destination ID training-safe wording.');
}
for (const record of financialRecordsByCase['FA-CR-24003'].paymentVerification) {
  for (const field of [
    'bankName',
    'accountType',
    'accountHolder',
    'ownerMatch',
    'accountStatus',
    'priorUse',
    'firstSeen',
    'verificationMethod',
    'recoverability',
    'bankCode',
    'destinationId',
    'oldDestination',
    'newDestination',
    'changeComparison',
    'verificationOutcome',
    'verificationLog',
    'relatedRecords',
    'actions',
    'notes',
  ]) {
    if (!record[field] || (Array.isArray(record[field]) && record[field].length === 0)) {
      fail(`Payment Verification record ${record.id} is missing required Bible v2 field: ${field}.`);
    }
  }
}

const linkText = JSON.stringify(buildCoreToolRecords('Link Analysis', creditReview, { rows: [] }));
for (const anchor of ['Payment link', 'Document link', 'Business link', 'Digital link']) {
  if (!linkText.includes(anchor)) fail(`Link Analysis is missing ${anchor}.`);
}

const timelineText = JSON.stringify(buildCoreToolRecords('Timeline', creditReview, { rows: [] }));
for (const anchor of ['Login History', 'Transaction History', 'Payment Verification', 'Document Viewer']) {
  if (!timelineText.includes(anchor)) fail(`Timeline is missing ${anchor} records.`);
}

const lunaLocked = buildLunaDebrief({ activeCase: creditReview, reviewPackage: null });
if (lunaLocked !== null) fail('Luna must return no debrief before a Submitted Decision Record is saved.');

const lunaUnlocked = buildLunaDebrief({
  activeCase: creditReview,
  reviewPackage: {
    id: 'PKG-SMOKE',
    completedTools: ['Customer 360', 'Identity Intel / People Search', 'Login History', 'Transaction History', 'Payment Verification', 'Document Viewer'],
    pinnedEvidence: ['PAY-3301', 'PAY-3302'],
    noteSnapshot: ['Reviewed the system alert, Training ID, access history, and payment setup packet.'],
    reason: 'The saved package documents the system alert, identity setup, Payment Verification objects, access records, and evidence packet before post-submission coaching.',
    confidence: 'Medium',
  },
});
if (!lunaUnlocked || typeof lunaUnlocked.score !== 'number') {
  fail('Luna must produce post-submission scoring from a Submitted Decision Record.');
}

const activePanel = fs.readFileSync('src/ActiveToolPanel.jsx', 'utf8');
const caseSummary = fs.readFileSync('src/CaseSummaryCard.jsx', 'utf8');
const repositoryAdapter = fs.readFileSync('src/data/generatedCaseRepository.js', 'utf8');

if (!activePanel.includes('buildCoreToolRecords')) fail('ActiveToolPanel is not using the remaining-module record overlay.');
if (activePanel.includes("item !== 'System Access Lane'")) fail('The single System Access Lane must not be hidden by the module overlay.');
if (caseSummary.includes('Open First Tool')) fail('Case Summary still contains visible first-tool coaching.');
for (const forbidden of ['Suggested First Tool', 'Investigation Objective', 'Why am I here?', 'Who am I investigating?', 'Need to decide?']) {
  if (activePanel.includes(forbidden) || caseSummary.includes(forbidden)) fail(`Visible investigator coaching remains: ${forbidden}`);
}
for (const anchor of ['createIndexedDbRepository', 'migrateLegacyCases', 'generateAndSaveCase', "kind: 'indexedDB'"]) {
  if (!repositoryAdapter.includes(anchor)) fail(`Generated-case repository adapter is missing ${anchor}.`);
}
if (fs.existsSync('src/data/caseStorage.js')) fail('Stale PR caseStorage.js must not replace the IndexedDB repository boundary.');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Remaining module depth smoke check passed for all built-in cases, training-safe payment wording, neutral links and timeline records, pin-and-note evidence support, Luna submission locks, neutral tool wording, and the IndexedDB repository boundary.');
