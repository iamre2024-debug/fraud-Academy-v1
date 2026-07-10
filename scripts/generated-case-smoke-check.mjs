const storage = new Map();

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
  addGeneratedCase,
  appendGeneratedCases,
  readGeneratedCases,
} = await import('../src/data/generatedCases.js');

const failures = [];
const created = [];

for (let index = 0; index < 125; index += 1) {
  created.push(addGeneratedCase());
}

const saved = readGeneratedCases();
const ids = new Set(saved.map((item) => item.id));

if (saved.length !== 125) failures.push(`Expected 125 generated cases without an app-level cap, found ${saved.length}.`);
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
const appended = appendGeneratedCases(baseCases);
const appendedIds = appended.map((item) => item.id);

if (appendedIds.filter((id) => id === saved[0].id).length !== 1) failures.push('appendGeneratedCases duplicated an existing case ID.');
if (!appendedIds.includes('BUILT-IN-CASE')) failures.push('appendGeneratedCases removed a built-in case.');

if (failures.length) {
  console.error('Generated case smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Generated case smoke check passed. The local queue keeps more than 50 unique Evidence First cases without an app-level cap.');
