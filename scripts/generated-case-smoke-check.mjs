const storage = new Map();
const legacyCase = {
  id: 'FA-LEGACY-G0000001',
  type: 'Legacy Generated Case',
  person: 'Legacy Learner',
  trainingId: 'TRN-LEGACY-1',
  claimId: 'CLM-LEGACY-1',
  allegation: 'Legacy local case preserved for migration coverage.',
  queueReason: 'Migration smoke coverage.',
  facts: ['No final outcome shown', 'Evidence First lock active'],
  loginHistory: [{ id: 'LEGACY-LOG-1', deviceId: 'DEV-LEGACY-1' }],
  generatedAt: 1,
};

storage.set('fraud-academy-generated-cases-v1', JSON.stringify([legacyCase]));

global.window = {
  localStorage: {
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
  },
};

const {
  combineCaseCatalog,
  generateAndSaveCases,
  generateAndSaveCase,
  getGeneratedCaseRepository,
  listGeneratedCases,
} = await import('../src/data/generatedCaseRepository.js');
const { coreClaimTypes } = await import('../src/data/claimRegistry.js');
const { createGeneratedCase } = await import('../src/data/generatedCases.js');

const failures = [];
const repository = await getGeneratedCaseRepository();
const created = [];

if (repository.kind !== 'localStorage') failures.push(`Expected Node smoke fallback repository, found ${repository.kind}.`);

for (let index = 0; index < 124; index += 1) {
  created.push(await generateAndSaveCase());
}

const batch = await generateAndSaveCases({
  count: 5,
  claimTypeId: 'non-fraud-chargeback',
  scenarioId: 'ncb-recurring-cancellation',
  difficulty: 'deep',
  evidenceDepth: 'standard',
});

const saved = await listGeneratedCases();
const ids = new Set(saved.map((item) => item.id));

if (saved.length !== 130) failures.push(`Expected 130 generated cases after single and batch generation, found ${saved.length}.`);
if (!ids.has(legacyCase.id)) failures.push('Legacy localStorage case was not preserved.');
if (ids.size !== saved.length) failures.push('Generated case IDs are not unique.');
if (batch[batch.length - 1]?.id !== saved[0]?.id) failures.push('Newest generated batch case was not added to the front of the queue.');
if (batch.length !== 5) failures.push('Batch generation did not return every requested fictional case.');

for (const item of saved) {
  for (const field of ['id', 'type', 'person', 'trainingId', 'claimId', 'allegation', 'queueReason']) {
    if (!item[field]) failures.push(`${item.id ?? 'Generated case'} is missing ${field}.`);
  }

  if (!item.facts?.includes('No final outcome shown')) failures.push(`${item.id} is missing the Evidence First outcome guard.`);
  if (!item.facts?.includes('Evidence First lock active')) failures.push(`${item.id} is missing the Evidence First lock marker.`);
  if (!item.loginHistory?.every((entry) => entry.deviceId)) failures.push(`${item.id} has a login without a Device ID.`);
}

for (const [index, claimType] of coreClaimTypes.entries()) {
  const generated = createGeneratedCase({
    index: 950000 + index,
    claimTypeId: claimType.id,
    scenarioId: claimType.scenarios[0]?.id,
    difficulty: 'deep',
    evidenceDepth: 'standard',
  });
  if (generated.claimTypeId !== claimType.id) failures.push(`${claimType.label} did not preserve its claim type ID.`);
  if (generated.type !== claimType.label) failures.push(`${claimType.label} did not preserve its official display name.`);
  if (generated.lane !== claimType.lane) failures.push(`${claimType.label} did not preserve its lane.`);
  if (!generated.statement?.value || !generated.intakeAnswers?.length || !generated.caseBriefing?.summary) {
    failures.push(`${claimType.label} is missing its complete Case Briefing intake packet.`);
  }
  if (!generated.requiredTools?.length || !generated.availableTools?.length || !generated.documents?.length || !generated.toolResults?.evidence?.length) {
    failures.push(`${claimType.label} is missing required investigation packet data.`);
  }
  if (claimType.chargeback && !generated.chargebackDecision?.reasonCode) {
    failures.push(`${claimType.label} is missing chargeback reason-code packet details.`);
  }
  if (claimType.credit && !generated.creditDecision?.deadline) {
    failures.push(`${claimType.label} is missing credit decision rail details.`);
  }
}

const focusedCase = createGeneratedCase({
  index: 980001,
  claimTypeId: 'account-takeover',
  scenarioId: 'ato-phishing-wallet',
  difficulty: 'light',
  evidenceDepth: 'light',
});
const complexCase = createGeneratedCase({
  index: 980002,
  claimTypeId: 'account-takeover',
  scenarioId: 'ato-phishing-wallet',
  difficulty: 'deep',
  evidenceDepth: 'light',
});
if (complexCase.toolResults.transactions.length <= focusedCase.toolResults.transactions.length) {
  failures.push('Difficulty should increase cross-record investigation complexity without changing the claim lane.');
}

const baseCases = [{ id: saved[0].id }, { id: 'BUILT-IN-CASE' }];
const combined = combineCaseCatalog(baseCases, saved);
const combinedIds = combined.map((item) => item.id);

if (combinedIds.filter((id) => id === saved[0].id).length !== 1) failures.push('combineCaseCatalog duplicated an existing case ID.');
if (!combinedIds.includes('BUILT-IN-CASE')) failures.push('combineCaseCatalog removed a built-in case.');

if (failures.length) {
  console.error('Generated case smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Generated case smoke check passed. The repository adapter preserves legacy cases and keeps more than 50 unique Evidence First cases.');
