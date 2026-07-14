import fs from 'node:fs';
import { trainingCases as baseCases } from '../src/data/cases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { buildCoreToolRecords } from '../src/data/coreToolRecords.js';
import { financialRecordsByCase } from '../src/data/financialRecords.js';
import { buildLunaDebrief } from '../src/data/lunaDebrief.js';

const failures = [];
const cases = enrichTrainingCases(baseCases);
const remainingModules = [
  'Payment Verification',
  'Business Intelligence',
  'Evidence Center',
  'Link Analysis',
  'Timeline',
];

function fail(message) {
  failures.push(message);
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
}

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
for (const anchor of ['Payment link', 'Evidence link', 'Business link', 'Digital link']) {
  if (!linkText.includes(anchor)) fail(`Link Analysis is missing ${anchor}.`);
}

const timelineText = JSON.stringify(buildCoreToolRecords('Timeline', creditReview, { rows: [] }));
for (const anchor of ['Login History', 'Transaction History', 'Payment Verification', 'Evidence Center']) {
  if (!timelineText.includes(anchor)) fail(`Timeline is missing ${anchor} records.`);
}

const lunaLocked = buildLunaDebrief({ activeCase: creditReview, reviewPackage: null });
if (lunaLocked !== null) fail('Luna must return no debrief before a learner package is saved.');

const lunaUnlocked = buildLunaDebrief({
  activeCase: creditReview,
  reviewPackage: {
    id: 'PKG-SMOKE',
    completedTools: ['Customer 360', 'Identity Intelligence', 'Login History', 'Transaction History', 'Payment Verification', 'Evidence Center'],
    pinnedEvidence: ['PAY-3301', 'PAY-3302'],
    noteSnapshot: ['Reviewed the system alert, Training ID, access history, and payment setup packet.'],
    reason: 'The saved package documents the system alert, identity setup, Payment Verification objects, access records, and evidence packet before post-submission coaching.',
    confidence: 'Medium',
  },
});
if (!lunaUnlocked || typeof lunaUnlocked.score !== 'number') {
  fail('Luna must produce post-submission scoring from a saved learner package.');
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
