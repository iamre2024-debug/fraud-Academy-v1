import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const storage = new Map();
const localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
  clear() {
    storage.clear();
  },
};

globalThis.window = {
  localStorage,
  dispatchEvent() {},
};

const caseId = 'FA-CR-G0000042';
const generatedAt = 1722000000042;
const savedAtIso = '2026-07-18T14:32:10.000Z';
const evidence = [{
  id: 'DOC-LEGACY-42',
  result: 'Submitted identity fields conflict with a fictional training bureau record.',
}];
const hiddenPresentationPattern = /synthetic identity|synthetic fraud|bust[- ]?out|first[- ]party fraud|email compromise|compromised mailbox|fraud confirmed/i;
const hiddenTruth = {
  finalFinding: 'Synthetic identity indicators established',
  evidenceIds: ['DOC-LEGACY-42'],
};
const legacyGeneratedCase = {
  id: caseId,
  generatedAt,
  claimTypeId: 'credit-risk',
  type: 'Synthetic Fraud',
  lane: 'Credit Risk',
  scenarioId: 'cr-synthetic-identity',
  scenarioTitle: 'Synthetic Identity',
  subtype: 'synthetic identity',
  alertReason: 'Synthetic fraud alert',
  taxonomyTags: { lifecycleStage: 'onboarding' },
  // Personal generated profiles historically also carried an employer/business
  // string; it must not convert the customer into a business.
  profile: { entityRole: 'Consumer applicant', business: 'Fictional Training Employer' },
  statement: { value: 'I submitted the requested application information.' },
  intakeAnswers: [{
    id: 'INT-LEGACY-42',
    prompt: 'Was synthetic identity fraud confirmed?',
    answer: 'Synthetic identity was confirmed at intake.',
  }],
  events: [{
    id: 'EVT-LEGACY-42',
    label: 'Synthetic fraud found',
    detail: 'First-party fraud and synthetic identity were established.',
  }],
  timelineEvents: [{
    id: 'TIM-LEGACY-42',
    title: 'Bust-out fraud detected',
    detail: 'Fraud confirmed before review.',
  }],
  actionLog: [{
    id: 'ACT-LEGACY-42',
    detail: 'Email compromise confirmed.',
  }],
  toolResults: {
    evidence,
    rows: [{
      label: 'Synthetic identity match',
      detail: 'Fraud confirmed.',
    }],
  },
  caseTruth: hiddenTruth,
  correctDetermination: 'Do Not Support Credit Request',
};
const legacyDraft = {
  choice: 'Do Not Support Credit Request',
  confidence: 'High',
  reason: 'Identity record DOC-LEGACY-42 conflicts with the submitted application details.',
  updatedAt: 1722000022222,
};
const legacyPackage = {
  id: 'PKG-LEGACY-42',
  caseId,
  claimTypeId: 'credit-risk',
  claimType: 'Synthetic Fraud',
  lane: 'Credit Risk',
  scenarioId: 'cr-synthetic-identity',
  choice: 'Do Not Support Credit Request',
  reason: legacyDraft.reason,
  pinnedEvidence: ['DOC-LEGACY-42'],
  savedAt: 'Jul 18, 09:32 AM',
  savedAtIso,
};
const legacyDebrief = {
  id: 'PKG-LEGACY-42:debrief',
  packageId: 'PKG-LEGACY-42',
  completedAt: '2026-07-18T14:35:00.000Z',
  scenarioTruth: hiddenTruth,
};

const keyNames = {
  generated: 'fraud-academy-generated-cases-v1',
  decisions: 'fraud-academy-decision-drafts-v1',
  packages: 'fraud-academy-review-packages-v1',
  debriefs: 'fraud-academy-completed-debriefs-v1',
  notes: 'fraud-academy-notes-v1',
  metadata: 'fraud-academy-cloud-metadata-v1',
  generatedMetadata: 'fraud-academy-generated-case-metadata-v1',
};

localStorage.setItem(keyNames.generated, JSON.stringify([legacyGeneratedCase]));
localStorage.setItem(keyNames.decisions, JSON.stringify({ [caseId]: legacyDraft }));
localStorage.setItem(keyNames.packages, JSON.stringify({ [caseId]: [legacyPackage] }));
localStorage.setItem(keyNames.debriefs, JSON.stringify({ [caseId]: [legacyDebrief] }));
localStorage.setItem(keyNames.notes, JSON.stringify({ [caseId]: ['Learner note survives migration.'] }));

// Importing the cloud client is the pre-React migration entrypoint used by the
// active workspace model.
const {
  decryptCloudSnapshot,
  encryptCloudSnapshot,
  migrateLocalCaseStorage,
} = await import('../src/data/cloudSyncClient.js');
const {
  CASE_MIGRATION_VERSION,
  classifyLegacyCase,
  mergeGeneratedCaseRecords,
  migrateDecisionDraft,
  migrateGeneratedCase,
  migratePersistenceResources,
  migrateReviewPackage,
} = await import('../src/data/caseMigration.js');
const {
  CUSTOMER_TYPES,
  PRODUCT_TYPES,
  WORKFLOW_TYPES,
} = await import('../src/data/caseDomain.js');
const {
  materializeCloudSnapshot,
  mergeCloudSnapshots,
} = await import('../src/data/persistenceMerge.js');
const {
  generateAndSaveCase,
  listGeneratedCases,
  listGeneratedCaseTruthSnapshots,
  mergeGeneratedCases,
} = await import('../src/data/generatedCaseRepository.js');

assert.equal(
  classifyLegacyCase({
    id: 'FA-AWC-WIRE-1',
    claimTypeId: 'ach-wire-check',
    type: 'ACH / Wire / Check Review',
    scenarioId: 'awc-wire-beneficiary',
    transactionInfo: 'Wire payment instruction · fictional Destination ID DST-0917',
  }).workflowType,
  WORKFLOW_TYPES.WIRE_TRANSACTION_REVIEW,
  'The broad legacy rail label must not collapse a wire scenario into ACH.',
);
assert.equal(
  classifyLegacyCase({
    id: 'FA-AWC-ACH-1',
    claimTypeId: 'ach-wire-check',
    type: 'ACH / Wire / Check Review',
    scenarioId: 'awc-ach-originator',
    transactionInfo: 'ACH debit · fictional Bank Code BC-042',
  }).workflowType,
  WORKFLOW_TYPES.ACH_TRANSACTION_REVIEW,
);

const prefixOnlyDraft = migrateDecisionDraft({
  choice: 'Do Not Support Credit Request',
  reason: 'Legacy draft saved before generated-case context was available.',
}, { id: 'FA-CR-G0000999' });
assert.equal(prefixOnlyDraft.operationalDecision, 'Restrict / Reduce');
assert.equal(prefixOnlyDraft.legacyDecisionFormat, true);
const contextualDraft = migrateDecisionDraft(prefixOnlyDraft, {
  id: 'FA-CR-G0000999',
  customerType: CUSTOMER_TYPES.PERSONAL,
  productType: PRODUCT_TYPES.CREDIT_CARD,
  workflowType: WORKFLOW_TYPES.CREDIT_APPLICATION_REVIEW,
});
assert.equal(
  contextualDraft.operationalDecision,
  'Deny',
  'A legacy choice must be reinterpreted when the generated case later supplies authoritative workflow context.',
);
const contextualPackage = migrateReviewPackage({
  ...prefixOnlyDraft,
  id: 'PKG-CONTEXT-999',
  caseId: 'FA-CR-G0000999',
}, {
  id: 'FA-CR-G0000999',
  customerType: CUSTOMER_TYPES.PERSONAL,
  productType: PRODUCT_TYPES.CREDIT_CARD,
  workflowType: WORKFLOW_TYPES.CREDIT_APPLICATION_REVIEW,
});
assert.equal(contextualPackage.operationalDecision, 'Deny');

const migratedStoredDraft = JSON.parse(localStorage.getItem(keyNames.decisions))[caseId];
const migratedStoredPackage = JSON.parse(localStorage.getItem(keyNames.packages))[caseId][0];
const migratedStoredDebrief = JSON.parse(localStorage.getItem(keyNames.debriefs))[caseId][0];

assert.equal(migratedStoredDraft.operationalDecision, 'Deny');
assert.equal(migratedStoredDraft.finalFinding, '');
assert.equal(migratedStoredDraft.findingBasis, legacyDraft.reason);
assert.equal(migratedStoredDraft.evidenceRationale, legacyDraft.reason);
assert.equal(migratedStoredDraft.updatedAt, legacyDraft.updatedAt);
assert.equal(migratedStoredDraft.choice, legacyDraft.choice);
assert.equal(migratedStoredPackage.id, legacyPackage.id);
assert.equal(migratedStoredPackage.savedAt, legacyPackage.savedAt);
assert.equal(migratedStoredPackage.savedAtIso, savedAtIso);
assert.equal(migratedStoredPackage.operationalDecision, 'Deny');
assert.equal(migratedStoredPackage.finalFinding, '');
assert.equal(migratedStoredPackage.findingBasis, legacyPackage.reason);
assert.deepEqual(migratedStoredPackage.pinnedEvidence, ['DOC-LEGACY-42']);
assert.equal(migratedStoredDebrief.id, legacyDebrief.id);
assert.equal(migratedStoredDebrief.packageId, legacyDebrief.packageId);
assert.equal(migratedStoredDebrief.completedAt, legacyDebrief.completedAt);
assert.deepEqual(migratedStoredDebrief.scenarioTruth, hiddenTruth);
assert.deepEqual(
  JSON.parse(localStorage.getItem(keyNames.notes)),
  { [caseId]: ['Learner note survives migration.'] },
  'Unrelated learner progress must not be rewritten.',
);
assert.ok(
  JSON.parse(localStorage.getItem(keyNames.metadata)).resources[keyNames.decisions][caseId],
  'Local migration should advance cloud metadata for the migrated draft.',
);
assert.equal(migrateLocalCaseStorage(), false, 'The storage migration must be idempotent.');

const lateContextCaseId = 'FA-CR-G0000999';
localStorage.setItem(keyNames.decisions, JSON.stringify({
  ...JSON.parse(localStorage.getItem(keyNames.decisions)),
  [lateContextCaseId]: {
    choice: 'Do Not Support Credit Request',
    reason: 'Legacy draft persisted before its IndexedDB case was loaded.',
  },
}));
assert.equal(migrateLocalCaseStorage(), true);
assert.equal(
  JSON.parse(localStorage.getItem(keyNames.decisions))[lateContextCaseId].operationalDecision,
  'Restrict / Reduce',
);
assert.equal(migrateLocalCaseStorage([{
  id: lateContextCaseId,
  customerType: CUSTOMER_TYPES.PERSONAL,
  productType: PRODUCT_TYPES.CREDIT_CARD,
  workflowType: WORKFLOW_TYPES.CREDIT_APPLICATION_REVIEW,
}]), true);
assert.equal(
  JSON.parse(localStorage.getItem(keyNames.decisions))[lateContextCaseId].operationalDecision,
  'Deny',
  'Loading the generated case must correct a provisional prefix-only migration without changing the saved legacy choice.',
);
const decisionsAfterLateContext = JSON.parse(localStorage.getItem(keyNames.decisions));
delete decisionsAfterLateContext[lateContextCaseId];
localStorage.setItem(keyNames.decisions, JSON.stringify(decisionsAfterLateContext));

const [migratedGeneratedCase] = await listGeneratedCases();
assert.equal(migratedGeneratedCase.id, caseId);
assert.equal(migratedGeneratedCase.generatedAt, generatedAt);
assert.equal(migratedGeneratedCase.domainSchemaVersion, CASE_MIGRATION_VERSION);
assert.equal(migratedGeneratedCase.customerType, CUSTOMER_TYPES.PERSONAL);
assert.equal(migratedGeneratedCase.productType, PRODUCT_TYPES.CREDIT_CARD);
assert.equal(migratedGeneratedCase.workflowType, WORKFLOW_TYPES.CREDIT_APPLICATION_REVIEW);
assert.doesNotMatch(migratedGeneratedCase.alertReason, /synthetic|fraud/i);
assert.deepEqual(migratedGeneratedCase.toolResults.evidence, evidence);
assert.equal(
  Object.prototype.hasOwnProperty.call(migratedGeneratedCase, 'caseTruth'),
  false,
  'The public generated-case record must not retain embedded hidden truth.',
);
assert.equal(
  Object.prototype.hasOwnProperty.call(migratedGeneratedCase, 'correctDetermination'),
  false,
  'The public generated-case record must not retain the legacy hidden answer.',
);
assert.doesNotMatch(
  JSON.stringify({
    intakeAnswers: migratedGeneratedCase.intakeAnswers,
    events: migratedGeneratedCase.events,
    timelineEvents: migratedGeneratedCase.timelineEvents,
    actionLog: migratedGeneratedCase.actionLog,
    toolResults: migratedGeneratedCase.toolResults,
    scenarioId: migratedGeneratedCase.scenarioId,
    scenarioTitle: migratedGeneratedCase.scenarioTitle,
    subtype: migratedGeneratedCase.subtype,
  }),
  hiddenPresentationPattern,
  'Legacy intake, timeline, tool, and scenario labels must be neutralized on the public case.',
);
assert.equal(migratedGeneratedCase.legacyMetadata.claimType, legacyGeneratedCase.type);
assert.equal(migratedGeneratedCase.legacyMetadata.scenarioTitle, legacyGeneratedCase.scenarioTitle);
assert.equal(migratedGeneratedCase.legacyMetadata.alertReason, legacyGeneratedCase.alertReason);
assert.equal(migratedGeneratedCase.legacyMetadata.sourceDomainSchemaVersion, 0);
assert.deepEqual(
  migrateGeneratedCase(migratedGeneratedCase),
  migratedGeneratedCase,
  'Generated-case migration must be idempotent.',
);
const legacyTruthSnapshot = (await listGeneratedCaseTruthSnapshots())
  .find((snapshot) => snapshot.caseId === caseId);
assert.equal(legacyTruthSnapshot.source, 'legacy-embedded');
assert.equal(legacyTruthSnapshot.truth.finalFinding, 'Fraud Confirmed');
assert.deepEqual(legacyTruthSnapshot.truth.evidenceIds, hiddenTruth.evidenceIds);
assert.deepEqual(legacyTruthSnapshot.truth.suspectedPatterns, ['synthetic-identity']);
assert.equal(legacyTruthSnapshot.truth.operationalDecision, 'Deny');
assert.equal(legacyTruthSnapshot.truth.legacyFinalFinding, hiddenTruth.finalFinding);
assert.equal(
  legacyTruthSnapshot.truth.legacyEvidence.toolResults.rows[0].label,
  legacyGeneratedCase.toolResults.rows[0].label,
  'Neutralizing the public tool text must not overwrite the preserved legacy evidence snapshot.',
);
assert.equal(
  legacyTruthSnapshot.truth.legacyEvidence.intakeAnswers[0].answer,
  legacyGeneratedCase.intakeAnswers[0].answer,
);
const persistedGeneratedMetadata = JSON.parse(localStorage.getItem(keyNames.generatedMetadata));
assert.deepEqual(
  persistedGeneratedMetadata['generated-case-truth-snapshots-v1'].byCaseId[caseId].truth,
  JSON.parse(JSON.stringify(legacyTruthSnapshot.truth)),
  'The localStorage fallback must persist private truth separately so a reload cannot derive a changed answer from the catalog.',
);

const newlyGeneratedCase = await generateAndSaveCase({
  customerType: CUSTOMER_TYPES.PERSONAL,
  productType: PRODUCT_TYPES.CREDIT_CARD,
  workflowType: WORKFLOW_TYPES.CREDIT_APPLICATION_REVIEW,
  difficulty: 'light',
  evidenceDepth: 'light',
});
assert.equal(newlyGeneratedCase.caseTruth, undefined, 'New public case records must not contain hidden truth.');
const newTruthSnapshot = (await listGeneratedCaseTruthSnapshots())
  .find((snapshot) => snapshot.caseId === newlyGeneratedCase.id);
assert.equal(newTruthSnapshot.source, 'generated-at-creation');
assert.ok(newTruthSnapshot.truth.finalFinding);
assert.ok(newTruthSnapshot.truth.operationalDecision || newTruthSnapshot.truth.correctDetermination);

const explicitCloudCase = {
  ...legacyGeneratedCase,
  domainSchemaVersion: CASE_MIGRATION_VERSION,
  customerType: CUSTOMER_TYPES.BUSINESS,
  productType: PRODUCT_TYPES.BUSINESS_CREDIT_CARD,
  workflowType: WORKFLOW_TYPES.CREDIT_APPLICATION_REVIEW,
  alertReason: 'Business credit application information requires review.',
  reportedAllegation: '',
  suspectedPatterns: [],
  type: 'Credit Application Review',
  scenarioTitle: 'Business application information review',
  toolResults: {
    evidence: [{ id: 'REMOTE-EVIDENCE', result: 'Remote copy must not replace worked evidence.' }],
  },
  caseTruth: { finalFinding: 'Remote truth must not replace worked truth.' },
};

const migratedPrivateLegacyCase = migrateGeneratedCase(legacyGeneratedCase);
const directlyMerged = mergeGeneratedCaseRecords(migratedPrivateLegacyCase, explicitCloudCase);
assert.equal(directlyMerged.customerType, CUSTOMER_TYPES.BUSINESS);
assert.equal(directlyMerged.productType, PRODUCT_TYPES.BUSINESS_CREDIT_CARD);
assert.deepEqual(directlyMerged.toolResults.evidence, evidence);
assert.deepEqual(directlyMerged.caseTruth, legacyTruthSnapshot.truth);
assert.equal(directlyMerged.id, caseId);
assert.equal(directlyMerged.generatedAt, generatedAt);
assert.equal(directlyMerged.legacyMetadata.claimType, legacyGeneratedCase.type);

await mergeGeneratedCases([explicitCloudCase]);
const repositoryMerged = (await listGeneratedCases()).find((item) => item.id === caseId);
assert.equal(repositoryMerged.customerType, CUSTOMER_TYPES.BUSINESS);
assert.equal(repositoryMerged.productType, PRODUCT_TYPES.BUSINESS_CREDIT_CARD);
assert.deepEqual(repositoryMerged.toolResults.evidence, evidence);
assert.equal(repositoryMerged.caseTruth, undefined);
assert.equal(repositoryMerged.correctDetermination, undefined);
const repositoryMergedTruth = (await listGeneratedCaseTruthSnapshots())
  .find((snapshot) => snapshot.caseId === caseId);
assert.deepEqual(
  repositoryMergedTruth.truth,
  legacyTruthSnapshot.truth,
  'An incoming generated case must not replace the worked case truth snapshot.',
);

const itemId = `id:${caseId}`;
const localSnapshot = {
  schemaVersion: 1,
  resources: {},
  generatedCases: {
    mode: 'array',
    items: {
      [itemId]: {
        value: legacyGeneratedCase,
        position: 0,
        version: { at: generatedAt, deviceId: 'local-device' },
        deleted: false,
      },
    },
  },
};
const remoteSnapshot = {
  schemaVersion: 1,
  resources: {},
  generatedCases: {
    mode: 'array',
    items: {
      [itemId]: {
        value: explicitCloudCase,
        position: 0,
        version: { at: generatedAt + 1, deviceId: 'remote-device' },
        deleted: false,
      },
    },
  },
};
localSnapshot.generatedCaseTruth = {
  mode: 'array',
  items: {
    [itemId]: {
      value: legacyTruthSnapshot,
      position: 0,
      version: { at: generatedAt, deviceId: 'local-device' },
      deleted: false,
    },
  },
};
remoteSnapshot.generatedCaseTruth = {
  mode: 'array',
  items: {
    [itemId]: {
      value: {
        ...legacyTruthSnapshot,
        source: 'runtime-derived',
        truth: { finalFinding: 'Changed catalog truth must not replace the snapshot.' },
      },
      position: 0,
      version: { at: generatedAt + 1, deviceId: 'remote-device' },
      deleted: false,
    },
  },
};
const mergedCloudSnapshot = mergeCloudSnapshots(localSnapshot, remoteSnapshot);
const cloudMerged = materializeCloudSnapshot(mergedCloudSnapshot);
assert.equal(cloudMerged.generatedCases.length, 1);
assert.equal(cloudMerged.generatedCases[0].id, caseId);
assert.equal(cloudMerged.generatedCases[0].customerType, CUSTOMER_TYPES.BUSINESS);
assert.equal(cloudMerged.generatedCases[0].productType, PRODUCT_TYPES.BUSINESS_CREDIT_CARD);
assert.deepEqual(cloudMerged.generatedCases[0].toolResults.evidence, evidence);
assert.equal(
  Object.prototype.hasOwnProperty.call(cloudMerged.generatedCases[0], 'caseTruth'),
  false,
  'Materialized cloud generated cases must use the same public answer-free shape as the local repository.',
);
assert.equal(
  Object.prototype.hasOwnProperty.call(cloudMerged.generatedCases[0], 'correctDetermination'),
  false,
);
assert.equal(cloudMerged.generatedCaseTruthSnapshots.length, 1);
assert.equal(cloudMerged.generatedCaseTruthSnapshots[0].source, 'legacy-embedded');
assert.equal(cloudMerged.generatedCaseTruthSnapshots[0].truth.finalFinding, 'Fraud Confirmed');
assert.equal(cloudMerged.generatedCaseTruthSnapshots[0].truth.legacyFinalFinding, hiddenTruth.finalFinding);
const encryptedTruthSnapshot = await encryptCloudSnapshot(
  mergedCloudSnapshot,
  'fa-migration-truth-test-1234567890',
);
assert.ok(
  !JSON.stringify(encryptedTruthSnapshot).includes(hiddenTruth.finalFinding),
  'Private truth must only enter cloud persistence inside the encrypted envelope.',
);
const decryptedTruthSnapshot = materializeCloudSnapshot(await decryptCloudSnapshot(
  encryptedTruthSnapshot,
  'fa-migration-truth-test-1234567890',
));
assert.equal(
  decryptedTruthSnapshot.generatedCaseTruthSnapshots[0].truth.finalFinding,
  'Fraud Confirmed',
);
assert.equal(
  decryptedTruthSnapshot.generatedCaseTruthSnapshots[0].truth.legacyFinalFinding,
  hiddenTruth.finalFinding,
);

const unrelatedResources = {
  [keyNames.notes]: { [caseId]: ['Do not replace this array.'] },
  [keyNames.decisions]: { [caseId]: legacyDraft },
  [keyNames.packages]: { [caseId]: [legacyPackage] },
  [keyNames.debriefs]: { [caseId]: [legacyDebrief] },
};
const resourceMigration = migratePersistenceResources(unrelatedResources, [legacyGeneratedCase]);
assert.deepEqual(resourceMigration.rawByKey[keyNames.notes], unrelatedResources[keyNames.notes]);
assert.equal(resourceMigration.rawByKey[keyNames.decisions][caseId].operationalDecision, 'Deny');
assert.equal(resourceMigration.rawByKey[keyNames.packages][caseId][0].id, legacyPackage.id);
assert.equal(resourceMigration.rawByKey[keyNames.debriefs][caseId][0].completedAt, legacyDebrief.completedAt);

const prefixOnlyLegacyDecisions = {
  'FA-FCB-G0000101': { choice: 'Approve claim based on evidence' },
  'FA-NCB-G0000102': { choice: 'Deny claim based on merchant records' },
  'FA-PAY-G0000103': { choice: 'Hold pending verification' },
  'FA-BEC-G0000104': { choice: 'Release' },
  'FA-AVR-G0000105': { choice: 'Unable to verify with current records' },
  'FA-AWC-G0000106': { choice: 'More Information Needed' },
};
const prefixMigration = migratePersistenceResources({
  [keyNames.decisions]: prefixOnlyLegacyDecisions,
}, []);
const migratedPrefixDrafts = prefixMigration.rawByKey[keyNames.decisions];
assert.equal(migratedPrefixDrafts['FA-FCB-G0000101'].workflowType, WORKFLOW_TYPES.UNAUTHORIZED_CARD_TRANSACTION_CLAIM);
assert.equal(migratedPrefixDrafts['FA-FCB-G0000101'].operationalDecision, 'Support Customer Claim');
assert.equal(migratedPrefixDrafts['FA-NCB-G0000102'].workflowType, WORKFLOW_TYPES.MERCHANT_NON_FRAUD_DISPUTE);
assert.equal(migratedPrefixDrafts['FA-NCB-G0000102'].operationalDecision, 'Do Not Support Customer Claim');
assert.equal(migratedPrefixDrafts['FA-PAY-G0000103'].workflowType, WORKFLOW_TYPES.PAYROLL_CHANGE_ALERT);
assert.equal(migratedPrefixDrafts['FA-PAY-G0000103'].operationalDecision, 'Hold');
assert.equal(migratedPrefixDrafts['FA-BEC-G0000104'].workflowType, WORKFLOW_TYPES.BUSINESS_PAYMENT_INSTRUCTION_CHANGE_ALERT);
assert.equal(migratedPrefixDrafts['FA-BEC-G0000104'].operationalDecision, 'Release');
assert.equal(migratedPrefixDrafts['FA-AVR-G0000105'].workflowType, WORKFLOW_TYPES.CREDIT_APPLICATION_REVIEW);
assert.equal(migratedPrefixDrafts['FA-AVR-G0000105'].operationalDecision, 'Request More Information');
assert.equal(migratedPrefixDrafts['FA-AWC-G0000106'].workflowType, WORKFLOW_TYPES.WIRE_TRANSACTION_REVIEW);
assert.equal(migratedPrefixDrafts['FA-AWC-G0000106'].operationalDecision, 'More Information Needed');

console.log('Case migration smoke check passed.');
