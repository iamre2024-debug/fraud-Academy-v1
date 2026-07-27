import { trainingCases } from '../src/data/cases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { workspaceTools } from '../src/investigationToolGroups.js';
import { resolvePinnedEvidence } from '../src/pinnedEvidenceNavigation.js';

const activeCase = enrichTrainingCases(trainingCases)[0];
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

const customerProfilePin = `${activeCase.trainingId} · ${activeCase.person}`;
const reopenedCustomerProfile = resolvePinnedEvidence(customerProfilePin, activeCase, workspaceTools);
if (
  reopenedCustomerProfile?.tool !== 'Customer 360'
  || reopenedCustomerProfile.query !== activeCase.trainingId
  || reopenedCustomerProfile.recordId !== 'C360-REL'
  || reopenedCustomerProfile.row?.pin !== activeCase.trainingId
) {
  throw new Error('Customer 360 profile pin did not restore the original customer Training ID and relationship record.');
}

const fallback = resolvePinnedEvidence('DOC-UNSAVED-01 | Affidavit', activeCase, workspaceTools);
if (fallback?.tool !== 'Document Viewer' || fallback.recordId !== 'DOC-UNSAVED-01') {
  throw new Error('Document prefix fallback did not preserve the saved identifier.');
}

const legacyAliasFallback = resolvePinnedEvidence(
  'FIN-UNSAVED-01 | Historical financial record',
  activeCase,
  ['Financial Intelligence'],
);
if (
  legacyAliasFallback?.tool !== 'Financial Investigation'
  || legacyAliasFallback.recordId !== 'FIN-UNSAVED-01'
) {
  throw new Error('Legacy navigation tool aliases did not reopen the canonical source tool.');
}

const invalidPersonalBusinessRoute = resolvePinnedEvidence(
  'BIZ-UNSAVED-01 | Historical business record',
  activeCase,
  ['Business Intelligence'],
);
if (invalidPersonalBusinessRoute !== null) {
  throw new Error('Pinned evidence navigation exposed a business-only tool on a personal case.');
}

const linkedPersonalBusinessRoute = resolvePinnedEvidence(
  'BIZ-UNSAVED-02 | Owned training business',
  {
    ...activeCase,
    availableTools: [...activeCase.availableTools, 'Business 360'],
    linkedBusinesses: [{
      businessId: 'BIZ-UNSAVED-02',
      relationship: 'Beneficial owner',
    }],
  },
  ['Customer 360', 'Business 360', 'KYB Review', 'Payroll History'],
);
if (
  linkedPersonalBusinessRoute?.tool !== 'Business 360'
  || linkedPersonalBusinessRoute.recordId !== 'BIZ-UNSAVED-02'
) {
  throw new Error('Pinned evidence navigation did not preserve the explicit ownership-linked Business 360 route.');
}

console.log('Pinned evidence navigation smoke check passed.');
