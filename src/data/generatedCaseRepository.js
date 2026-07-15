import { createGeneratedCase } from './generatedCases.js';

const databaseName = 'fraud-academy-os-v1';
const databaseVersion = 1;
const caseStoreName = 'generatedCases';
const metaStoreName = 'metadata';
const legacyCasesKey = 'fraud-academy-generated-cases-v1';
const legacySequenceKey = 'fraud-academy-generated-case-sequence-v1';
const migrationKey = 'generated-cases-localstorage-migrated-v1';
const sequenceKey = 'generated-case-sequence-v1';

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'));
  });
}

function openDatabase() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(caseStoreName)) {
        database.createObjectStore(caseStoreName, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(metaStoreName)) {
        database.createObjectStore(metaStoreName, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open generated-case database.'));
  });
}

function readLegacyCases() {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(legacyCasesKey);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeLegacyCases(cases) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(legacyCasesKey, JSON.stringify(cases));
}

function readLegacySequence() {
  if (typeof window === 'undefined') return 0;
  const value = Number(window.localStorage.getItem(legacySequenceKey));
  return Number.isFinite(value) ? value : 0;
}

function writeLegacySequence(value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(legacySequenceKey, String(value));
}

function createLocalStorageRepository() {
  return {
    kind: 'localStorage',
    async list() {
      return readLegacyCases();
    },
    async put(item) {
      const current = readLegacyCases();
      writeLegacyCases([item, ...current.filter((entry) => entry.id !== item.id)]);
      return item;
    },
    async getSequence() {
      return readLegacySequence();
    },
    async setSequence(value) {
      writeLegacySequence(value);
    },
  };
}

function createIndexedDbRepository(database) {
  return {
    kind: 'indexedDB',
    async list() {
      const transaction = database.transaction(caseStoreName, 'readonly');
      const records = await requestResult(transaction.objectStore(caseStoreName).getAll());
      await transactionDone(transaction);
      return records.sort((left, right) => (right.generatedAt ?? 0) - (left.generatedAt ?? 0));
    },
    async put(item) {
      const transaction = database.transaction(caseStoreName, 'readwrite');
      transaction.objectStore(caseStoreName).put(item);
      await transactionDone(transaction);
      return item;
    },
    async putMany(items) {
      if (!items.length) return;
      const transaction = database.transaction(caseStoreName, 'readwrite');
      const store = transaction.objectStore(caseStoreName);
      for (const item of items) store.put(item);
      await transactionDone(transaction);
    },
    async getMeta(key) {
      const transaction = database.transaction(metaStoreName, 'readonly');
      const record = await requestResult(transaction.objectStore(metaStoreName).get(key));
      await transactionDone(transaction);
      return record?.value;
    },
    async setMeta(key, value) {
      const transaction = database.transaction(metaStoreName, 'readwrite');
      transaction.objectStore(metaStoreName).put({ key, value });
      await transactionDone(transaction);
    },
    async getSequence() {
      return Number(await this.getMeta(sequenceKey)) || 0;
    },
    async setSequence(value) {
      await this.setMeta(sequenceKey, value);
    },
  };
}

async function migrateLegacyCases(repository) {
  if (repository.kind !== 'indexedDB') return;
  if (await repository.getMeta(migrationKey)) return;

  const legacyCases = readLegacyCases();
  if (legacyCases.length) await repository.putMany(legacyCases);
  const legacySequence = readLegacySequence();
  if (legacySequence) await repository.setSequence(legacySequence);
  await repository.setMeta(migrationKey, true);
}

let repositoryPromise;

export async function getGeneratedCaseRepository() {
  if (!repositoryPromise) {
    repositoryPromise = openDatabase()
      .then((database) => (database ? createIndexedDbRepository(database) : createLocalStorageRepository()))
      .catch(() => createLocalStorageRepository())
      .then(async (repository) => {
        await migrateLegacyCases(repository);
        return repository;
      });
  }
  return repositoryPromise;
}

export async function listGeneratedCases() {
  const repository = await getGeneratedCaseRepository();
  return repository.list();
}

function generatorConfig(config = {}) {
  return {
    claimTypeId: config.claimTypeId,
    scenarioId: config.scenarioId,
    difficulty: config.difficulty,
    evidenceDepth: config.evidenceDepth,
  };
}

export async function generateAndSaveCase(config = {}) {
  const repository = await getGeneratedCaseRepository();
  const now = Date.now();
  const savedSequence = await repository.getSequence();
  let seed = savedSequence >= now ? savedSequence + 1 : now;
  const existingIds = new Set((await repository.list()).map((item) => item.id));
  const options = generatorConfig(config);
  let nextCase = { ...createGeneratedCase(seed, options), generatedAt: seed };

  while (existingIds.has(nextCase.id)) {
    seed += 1;
    nextCase = { ...createGeneratedCase(seed, options), generatedAt: seed };
  }

  await repository.setSequence(seed);
  await repository.put(nextCase);
  return nextCase;
}

export async function generateAndSaveCases({ count = 1, ...config } = {}) {
  const normalizedCount = Math.min(25, Math.max(1, Number.parseInt(count, 10) || 1));
  const created = [];
  for (let index = 0; index < normalizedCount; index += 1) {
    created.push(await generateAndSaveCase(config));
  }
  return created;
}

export function combineCaseCatalog(baseCases = [], generatedCases = []) {
  const seen = new Set(baseCases.map((item) => item.id));
  return [...baseCases, ...generatedCases.filter((item) => !seen.has(item.id))];
}
