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

const fallback = resolvePinnedEvidence('DOC-UNSAVED-01 | Affidavit', activeCase, workspaceTools);
if (fallback?.tool !== 'Document Viewer' || fallback.recordId !== 'DOC-UNSAVED-01') {
  throw new Error('Document prefix fallback did not preserve the saved identifier.');
}

console.log('Pinned evidence navigation smoke check passed.');
