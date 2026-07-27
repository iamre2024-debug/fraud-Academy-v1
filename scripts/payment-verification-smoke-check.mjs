import fs from 'node:fs';
import { trainingCases } from '../src/data/cases.js';
import { getPayrollHistory } from '../src/data/businessPayrollWorkspace.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { getFinancialRecords } from '../src/data/caseToolData.js';
import { coreClaimTypes } from '../src/data/claimRegistry.js';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import {
  PAYMENT_NAME_RESULTS,
  buildPaymentLookupHint,
  comparePaymentOwner,
  parsePaymentLookupHint,
  resolvePaymentLookup,
} from '../src/data/paymentVerification.js';

const failures = [];
const cases = enrichTrainingCases(trainingCases);
const requiredFields = [
  'nameMatchResult',
  'ownershipStatus',
  'operationalStatus',
  'standingStatus',
  'paymentType',
  'paymentStatus',
  'priorUseHistory',
  'ownershipHistory',
  'returnHistory',
  'verificationAttempts',
  'reviewContext',
  'customerLink',
  'trustedContactSource',
  'callbackStatus',
  'evidenceSummary',
];
const canonicalChangeFields = [
  'bankCode',
  'destinationId',
  'oldDestination',
  'newDestination',
];
const paymentChangeEventPattern = /bank|destination|beneficiary|payment account|direct deposit|payroll/i;
const generatedPaymentChangeLanes = new Set([
  'payroll-direct-deposit',
  'email-bec',
  'credit-risk',
  'business-loan-bust-out',
  'application-verification',
  'ach-wire-check',
]);
const placeholderOrNoChangePattern = /•{2,}|\bplaceholder\b|no new destination(?: added)?/i;

function fail(message) {
  failures.push(message);
}

function present(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function paymentChangeEvents(activeCase) {
  return (activeCase.customer?.profileChanges ?? []).filter((event) => paymentChangeEventPattern.test([
    event.eventType,
    event.item,
    event.oldValue,
    event.newValue,
  ].filter(Boolean).join(' ')));
}

for (const activeCase of cases.filter((item) => item.availableTools?.includes('Payment Verification'))) {
  const records = getFinancialRecords(activeCase).paymentVerification;
  if (!records.length) fail(`${activeCase.id} has no Payment Verification records.`);
  for (const record of records) {
    for (const field of requiredFields) {
      if (record[field] === undefined || record[field] === '') fail(`${record.id} is missing ${field}.`);
    }
    for (const field of canonicalChangeFields) {
      if (!present(record[field])) fail(`${record.id} is missing canonical ${field}.`);
    }
    if (!PAYMENT_NAME_RESULTS.includes(record.nameMatchResult)) fail(`${record.id} has a non-canonical stored name result.`);
    if (/fraud/i.test(record.operationalStatus)) fail(`${record.id} incorrectly uses fraud as operational account status.`);
    if (/^(hold|pause|release|approve|deny|remove|close)\b/i.test(record.verificationOutcome)) fail(`${record.id} exposes a pre-decision verification outcome.`);
    if (record.actions.some((action) => /^(hold|pause|release|approve|deny|remove|close)\b/i.test(action))) fail(`${record.id} exposes a pre-decision action.`);
  }
}

if (comparePaymentOwner('Maya Sterling', 'Maya Sterling') !== 'Match') fail('Exact owner-name comparison failed.');
if (comparePaymentOwner('Maya Sterling', 'Maya S.') !== 'Partial Match') fail('Abbreviated owner-name comparison failed.');
if (comparePaymentOwner('Avery Brooks', 'Training Holder 1234') !== 'No Match') fail('Different owner-name comparison failed.');
if (comparePaymentOwner('', 'Avery Brooks') !== 'Unable to Verify') fail('Missing owner-name comparison failed.');

const creditCase = cases.find((item) => item.id === 'FA-CR-24003');
const creditRecords = getFinancialRecords(creditCase).paymentVerification;
const exactLookup = resolvePaymentLookup(creditRecords, { bankCode: 'BC-204', destinationId: 'DST-7740', ownerName: 'Avery Brooks' });
if (exactLookup.state !== 'found' || exactLookup.nameMatchResult !== 'Partial Match') fail('Exact destination lookup did not return the expected partial name result.');
const missingLookup = resolvePaymentLookup(creditRecords, { bankCode: 'BC-404', destinationId: 'DST-MISSING', ownerName: 'Avery Brooks' });
if (missingLookup.nameMatchResult !== 'Destination Not Found' || missingLookup.record) fail('Missing destination lookup leaked a record.');

const hint = buildPaymentLookupHint({ bankCode: 'BC-204', destinationId: 'DST-7740', ownerName: 'Avery Brooks' });
if (JSON.stringify(parsePaymentLookupHint(hint)) !== JSON.stringify({ bankCode: 'BC-204', destinationId: 'DST-7740', ownerName: 'Avery Brooks' })) fail('Payment lookup prefill did not round-trip.');

const generatedLaneVariants = new Set();
let generatedSequence = 1900000000000;
let eligibleGeneratedCases = 0;
for (const claimType of coreClaimTypes) {
  for (const scenario of claimType.scenarios) {
    generatedSequence += 1;
    const generated = createGeneratedCase({
      index: generatedSequence,
      claimTypeId: claimType.id,
      scenarioId: scenario.id,
      difficulty: 'deep',
      evidenceDepth: 'deep',
    });
    if (!generated.availableTools.includes('Payment Verification')) continue;
    eligibleGeneratedCases += 1;
    const records = getFinancialRecords(generated).paymentVerification;
    if (!records.length) {
      fail(`${scenario.id} exposes Payment Verification without a normalized record.`);
      continue;
    }
    for (const record of records) {
      generatedLaneVariants.add(record.laneVariant);
      for (const field of requiredFields) {
        if (record[field] === undefined || record[field] === '') fail(`${scenario.id}/${record.id} is missing ${field}.`);
      }
      for (const field of canonicalChangeFields) {
        if (!present(record[field])) fail(`${scenario.id}/${record.id} is missing canonical ${field}.`);
      }
      if (!/^BC-[A-Z0-9-]+$/i.test(record.bankCode ?? '')) fail(`${scenario.id}/${record.id} has a non-canonical Bank Code.`);
      if (!/^DST-[A-Z0-9-]+$/i.test(record.destinationId ?? '')) fail(`${scenario.id}/${record.id} has a non-canonical Destination ID.`);
      if (!PAYMENT_NAME_RESULTS.includes(record.nameMatchResult)) fail(`${scenario.id}/${record.id} has a non-canonical stored name result.`);
      if (/fraud/i.test(record.operationalStatus)) fail(`${scenario.id}/${record.id} uses fraud as operational status.`);
      if (!Array.isArray(record.verificationAttempts) || !record.verificationAttempts.length) fail(`${scenario.id}/${record.id} has no verification attempts.`);
      const resolved = resolvePaymentLookup(records, {
        bankCode: record.bankCode,
        destinationId: record.destinationId,
        ownerName: generated.person,
      });
      if (resolved.state !== 'found' || !PAYMENT_NAME_RESULTS.includes(resolved.nameMatchResult)) {
        fail(`${scenario.id}/${record.id} cannot be retrieved through the canonical lookup.`);
      }
    }

    if (generatedPaymentChangeLanes.has(generated.claimTypeId)) {
      const canonicalRecord = records[0];
      const matchingEvents = paymentChangeEvents(generated);
      if (!matchingEvents.length) {
        fail(`${scenario.id} has Payment Verification but no payment-related profile event.`);
      }
      for (const event of matchingEvents) {
        for (const field of canonicalChangeFields) {
          if (event[field] !== canonicalRecord[field]) {
            fail(`${scenario.id}/${event.id} ${field} does not match ${canonicalRecord.id}.`);
          }
        }
        const eventText = [
          event.detail,
          event.oldValue,
          event.newValue,
          event.bankCode,
          event.destinationId,
          event.oldDestination,
          event.newDestination,
        ].filter(Boolean).join(' ');
        if (!eventText.includes(canonicalRecord.bankCode) || !eventText.includes(canonicalRecord.destinationId)) {
          fail(`${scenario.id}/${event.id} does not expose the canonical Bank Code and Destination ID.`);
        }
        if (!eventText.includes(canonicalRecord.oldDestination) || !eventText.includes(canonicalRecord.newDestination)) {
          fail(`${scenario.id}/${event.id} does not expose the canonical previous and new destination.`);
        }
        if (placeholderOrNoChangePattern.test(eventText)) {
          fail(`${scenario.id}/${event.id} contains a masked, placeholder, or contradictory no-change destination.`);
        }
      }
    }

    if (generated.claimTypeId === 'payroll-direct-deposit') {
      const canonicalRecord = records[0];
      const payrollWorkspace = getPayrollHistory(generated);
      if (!payrollWorkspace.payrollRuns.length) {
        fail(`${scenario.id} has no generated company Payroll History runs.`);
      }
      for (const payrollRun of payrollWorkspace.payrollRuns) {
        const destinations = payrollRun.employees[0]?.paystub?.paymentDestinations ?? [];
        const hasCurrentDestination = destinations.some((destination) => destination.bankCode === canonicalRecord.bankCode && destination.destinationId === canonicalRecord.destinationId);
        const currentDestinationEffective = new Date(payrollRun.payDate) >= new Date(canonicalRecord.firstSeen);
        if (currentDestinationEffective && !hasCurrentDestination) fail(`${scenario.id}/${payrollRun.id} omits the destination effective for that payroll snapshot.`);
        if (!currentDestinationEffective && hasCurrentDestination) fail(`${scenario.id}/${payrollRun.id} backfills a destination introduced after the payroll posted.`);
        const payrollText = JSON.stringify(payrollRun);
        for (const gatedField of ['accountHolder', 'ownerMatch', 'ownershipStatus', 'operationalStatus', 'priorUseHistory']) {
          if (payrollText.includes(gatedField)) fail(`${scenario.id}/${payrollRun.id} exposes gated Payment Verification field ${gatedField}.`);
        }
      }
    }
  }
}

if (eligibleGeneratedCases < 1) fail('No generated Payment Verification cases were exercised.');
for (const expectedLane of ['Personal', 'Payroll', 'Business']) {
  if (!generatedLaneVariants.has(expectedLane)) fail(`Generated cases did not exercise the ${expectedLane} Payment Verification variant.`);
}

const fallbackCase = {
  id: 'FA-FALLBACK-PV',
  person: 'Training Customer',
  type: 'Account review',
  claimType: 'Account review',
  availableTools: ['Payment Verification'],
  opened: 'Training date',
};
const fallbackRecord = getFinancialRecords(fallbackCase).paymentVerification[0];
if (!fallbackRecord || requiredFields.some((field) => fallbackRecord[field] === undefined || fallbackRecord[field] === '')) {
  fail('Fallback case did not receive the normalized Payment Verification contract.');
}

const panel = fs.readFileSync(new URL('../src/InvestigationToolPanel.jsx', import.meta.url), 'utf8');
for (const anchor of [
  'Search before reveal',
  'Bank Code',
  'Destination ID',
  'Owner or business name',
  'Run verification',
  'Destination Not Found',
  'Name match result',
  'Ownership status',
  'Operational account status',
  'Verification attempts',
  'Evidence-first summary',
  'disabled={!lookupResult}',
]) {
  if (!panel.includes(anchor)) fail(`Payment Verification UI is missing: ${anchor}`);
}
for (const anchor of [
  'function PaymentSourceHandoff',
  "activeCase.availableTools?.includes('Payment Verification')",
  'Source identifiers · Evidence First',
  'Payment account change',
  'Bank Code',
  'Destination ID',
  'Previous account / destination',
  'New account / destination',
  'Change comparison',
  'data-payment-source-record',
  'Prefill Payment Verification',
  'buildPaymentLookupHint',
]) {
  if (!panel.includes(anchor)) fail(`Payment source handoff is missing: ${anchor}`);
}
if ((panel.match(/<PaymentSourceHandoff/g) ?? []).length < 2) {
  fail('Payment source handoff is not connected to every supported source workspace.');
}

if (failures.length) {
  console.error(`Payment Verification smoke check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`Payment Verification smoke check passed for all ${eligibleGeneratedCases} eligible generated scenarios plus every built-in and fallback case. Search-before-reveal, canonical Bank Code and Destination ID values, exact account-change history, canonical name results, ownership and prior-use history, split statuses, lane variants, attempts, source handoffs, and Evidence First wording are intact.`);
