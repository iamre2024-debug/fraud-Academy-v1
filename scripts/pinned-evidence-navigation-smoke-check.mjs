import { trainingCases } from '../src/data/cases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { workspaceTools } from '../src/investigationToolGroups.js';
import { searchLinkRelationships } from '../src/data/linkAnalysisRecords.js';
import { resolvePinnedEvidence } from '../src/pinnedEvidenceNavigation.js';

const cases = enrichTrainingCases(trainingCases);
const activeCase = cases[0];
const checks = [
  ['LOG-1005', 'Login History', 'LOG-1005'],
  [activeCase.loginHistory[0].session, 'Session History', activeCase.loginHistory[0].session],
  [activeCase.loginHistory[0].ip, 'IP Intelligence', `IP-${activeCase.loginHistory[0].id}`],
  [activeCase.trainingId, 'Customer 360', 'C360-REL'],
];

for (const [pin, expectedTool, expectedRecordId] of checks) {
  const result = resolvePinnedEvidence(pin, activeCase, workspaceTools);
  if (!result) throw new Error(`${pin} did not resolve.`);
  if (result.tool !== expectedTool) throw new Error(`${pin} resolved to ${result.tool}, expected ${expectedTool}.`);
  if (result.recordId !== expectedRecordId) throw new Error(`${pin} resolved to ${result.recordId}, expected ${expectedRecordId}.`);
}

const fallback = resolvePinnedEvidence('DOC-UNSAVED-01 | Affidavit', activeCase, workspaceTools);
if (fallback?.tool !== 'Document Viewer' || fallback.recordId !== 'DOC-UNSAVED-01') {
  throw new Error('Document prefix fallback did not preserve the saved identifier.');
}

const phone = activeCase.customer.contact.phone;
for (const pin of [
  `LNK-Phone Number: ${phone}`,
  `LNK-Phone Number: ${phone} · ACCT-02455-HIST`,
]) {
  const result = resolvePinnedEvidence(pin, activeCase, workspaceTools);
  if (
    result?.tool !== 'Link Analysis'
    || result.query !== phone
    || result.identifierType !== 'phone'
    || result.row !== null
  ) {
    throw new Error(`${pin} did not restore the exact Link Analysis search value.`);
  }
  const reopened = searchLinkRelationships({
    query: result.query,
    identifierType: 'phone',
    cases,
    activeCase,
  });
  if (reopened.matches.length < 3) {
    throw new Error(`${pin} reopened Link Analysis without its matched accounts.`);
  }
}

const addressPin = resolvePinnedEvidence(
  'LNK-Address: 12-34 Main St. · ACCT-TEST-1002',
  activeCase,
  workspaceTools,
);
if (
  addressPin?.query !== '12-34 Main St.'
  || addressPin.identifierType !== 'address'
  || addressPin.recordId !== 'ACCT-TEST-1002'
) {
  throw new Error('Typed Link Analysis address pin did not preserve its original search and linked account.');
}

console.log('Pinned evidence navigation smoke check passed.');
