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
  generateAndSaveCase,
  getGeneratedCaseRepository,
  listGeneratedCases,
} = await import('../src/data/generatedCaseRepository.js');
const { enrichTrainingCases } = await import('../src/data/caseEnrichment.js');
const { rowsFor } = await import('../src/visualWorkspaceModel.js');

const failures = [];
const repository = await getGeneratedCaseRepository();
const created = [];

if (repository.kind !== 'localStorage') failures.push(`Expected Node smoke fallback repository, found ${repository.kind}.`);

for (let index = 0; index < 124; index += 1) {
  created.push(await generateAndSaveCase());
}

const saved = await listGeneratedCases();
const ids = new Set(saved.map((item) => item.id));

if (saved.length !== 125) failures.push(`Expected 125 generated cases without an app-level cap, found ${saved.length}.`);
if (!ids.has(legacyCase.id)) failures.push('Legacy localStorage case was not preserved.');
if (ids.size !== saved.length) failures.push('Generated case IDs are not unique.');
if (created[created.length - 1]?.id !== saved[0]?.id) failures.push('Newest generated case was not added to the front of the queue.');

for (const item of saved) {
  for (const field of ['id', 'type', 'person', 'trainingId', 'claimId', 'allegation', 'queueReason']) {
    if (!item[field]) failures.push(`${item.id ?? 'Generated case'} is missing ${field}.`);
  }

  if (!item.facts?.includes('No final outcome shown')) failures.push(`${item.id} is missing the Evidence First outcome guard.`);
  if (!item.facts?.includes('Evidence First lock active')) failures.push(`${item.id} is missing the Evidence First lock marker.`);
  if (!item.loginHistory?.every((entry) => entry.deviceId)) failures.push(`${item.id} has a login without a Device ID.`);
}

const baseCases = [{ id: saved[0].id }, { id: 'BUILT-IN-CASE' }];
const combined = combineCaseCatalog(baseCases, saved);
const combinedIds = combined.map((item) => item.id);

if (combinedIds.filter((id) => id === saved[0].id).length !== 1) failures.push('combineCaseCatalog duplicated an existing case ID.');
if (!combinedIds.includes('BUILT-IN-CASE')) failures.push('combineCaseCatalog removed a built-in case.');

const investigatorTools = [
  'Customer 360', 'Identity Intelligence', 'Login History', 'Session History', 'Device Intelligence', 'IP Intelligence',
  'Transaction History', 'Financial Intelligence', 'Payment Verification', 'Business 360', 'Business Intelligence',
  'Employee Profile', 'Payroll History', 'Evidence Center', 'Document Viewer', 'Link Analysis', 'System Access Lane', 'Timeline',
];

for (const generatedCase of enrichTrainingCases(created.slice(0, 3))) {
  for (const tool of investigatorTools) {
    if (!rowsFor(tool, generatedCase, []).rows?.length) failures.push(`${generatedCase.id} has no usable ${tool} records.`);
  }

  const profile = generatedCase.identityProfile;
  if (!profile?.dob || !profile?.age) failures.push(`${generatedCase.id} is missing DOB or age for Identity Intelligence search.`);
  if ((profile?.nameHistory?.length ?? 0) < 2) failures.push(`${generatedCase.id} has incomplete name history.`);
  if ((profile?.addresses?.length ?? 0) < 2) failures.push(`${generatedCase.id} has incomplete address history.`);
  if ((profile?.phones?.length ?? 0) < 2) failures.push(`${generatedCase.id} has incomplete phone history.`);
  if ((profile?.emails?.length ?? 0) < 2) failures.push(`${generatedCase.id} has incomplete email history.`);
  if (!(profile?.associates?.length)) failures.push(`${generatedCase.id} has no associate records.`);
  if (!(profile?.financialSummary?.length)) failures.push(`${generatedCase.id} has no financial relationship summary.`);
  if (!(profile?.additionalSources?.length)) failures.push(`${generatedCase.id} has no linked data-source summary.`);
  if (!generatedCase.customer?.relationship?.some((item) => item.label === 'Open products' && item.value)) failures.push(`${generatedCase.id} has no Open products relationship.`);
  if (!generatedCase.customer?.contact?.phone || !generatedCase.customer?.contact?.email || !generatedCase.customer?.contact?.address) failures.push(`${generatedCase.id} has incomplete Customer 360 contact data.`);
}

if (failures.length) {
  console.error('Generated case smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Generated case smoke check passed. The repository preserves unlimited unique Evidence First cases and enriches each case with usable tool records, Customer 360 data, and a complete Identity Intelligence lookup profile.');
