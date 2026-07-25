import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  applyRawResourceChange,
  buildCloudSnapshot,
  materializeCloudSnapshot,
  mergeCloudSnapshots,
  metadataFromCloudSnapshot,
  seedMetadata,
} from '../src/data/persistenceMerge.js';
import { storageKeys } from '../src/data/persistenceKeys.js';
import { decryptCloudSnapshot, encryptCloudSnapshot } from '../src/data/cloudSyncClient.js';
import cloudSyncHandler from '../api/cloud-sync.js';

const caseId = 'FA-ATO-24018';

function rawState(overrides = {}) {
  return {
    [storageKeys.tray]: { [caseId]: ['TRN-8842-19'] },
    [storageKeys.notes]: { [caseId]: [] },
    [storageKeys.noteDrafts]: {},
    [storageKeys.completed]: { [caseId]: ['Case Summary'] },
    [storageKeys.decisions]: {},
    [storageKeys.packages]: {},
    [storageKeys.actions]: {},
    [storageKeys.documentRequests]: {},
    [storageKeys.quickPad]: {},
    [storageKeys.debriefs]: {},
    ...overrides,
  };
}

function snapshotFor(rawByKey, deviceId, timestamp, generatedCases = []) {
  const metadata = seedMetadata(rawByKey, {}, deviceId, timestamp);
  return buildCloudSnapshot({ rawByKey, metadata, generatedCases, deviceId });
}

const deviceARaw = rawState({
  [storageKeys.notes]: { [caseId]: ['Jul 25 · Investigation note · Added while desktop was offline.'] },
  [storageKeys.completed]: { [caseId]: ['Case Summary', 'Login History'] },
  [storageKeys.debriefs]: {
    [caseId]: [{
      id: 'PKG-1:debrief',
      packageId: 'PKG-1',
      managerReview: { managerVerdict: 'Saved debrief' },
    }],
  },
});
const deviceBRaw = rawState({
  [storageKeys.notes]: { [caseId]: ['Jul 25 · Investigation note · Added while mobile was offline.'] },
  [storageKeys.tray]: { [caseId]: ['TRN-8842-19', 'EVT-MOBILE'] },
  [storageKeys.packages]: { [caseId]: [{ id: 'PKG-1', caseId }] },
});

const generatedA = [{ id: 'FA-ATO-G00000001', generatedAt: 1001, person: 'Generated A' }];
const generatedB = [{ id: 'FA-CB-G00000002', generatedAt: 1002, person: 'Generated B' }];
const snapshotA = snapshotFor(deviceARaw, 'desktop-device', 1000, generatedA);
const snapshotB = snapshotFor(deviceBRaw, 'mobile-device', 1000, generatedB);
const merged = mergeCloudSnapshots(snapshotA, snapshotB);
const materialized = materializeCloudSnapshot(merged);

assert.deepEqual(
  new Set(materialized.rawByKey[storageKeys.notes][caseId]),
  new Set([
    'Jul 25 · Investigation note · Added while desktop was offline.',
    'Jul 25 · Investigation note · Added while mobile was offline.',
  ]),
  'Concurrent offline notes should merge without dropping either device.',
);
assert.deepEqual(
  new Set(materialized.rawByKey[storageKeys.tray][caseId]),
  new Set(['TRN-8842-19', 'EVT-MOBILE']),
  'Pinned evidence should merge as item-level records.',
);
assert.equal(materialized.rawByKey[storageKeys.debriefs][caseId][0].id, 'PKG-1:debrief');
assert.equal(materialized.rawByKey[storageKeys.packages][caseId][0].id, 'PKG-1');
assert.deepEqual(new Set(materialized.generatedCases.map((item) => item.id)), new Set([
  'FA-ATO-G00000001',
  'FA-CB-G00000002',
]));

const mergedMetadata = metadataFromCloudSnapshot(merged);
const trayBeforeRemoval = materialized.rawByKey[storageKeys.tray];
const trayAfterRemoval = { [caseId]: ['TRN-8842-19'] };
const removalMetadata = applyRawResourceChange(
  mergedMetadata,
  storageKeys.tray,
  trayBeforeRemoval,
  trayAfterRemoval,
  'desktop-device',
  5000,
);
const removalSnapshot = buildCloudSnapshot({
  rawByKey: {
    ...materialized.rawByKey,
    [storageKeys.tray]: trayAfterRemoval,
  },
  metadata: removalMetadata,
  generatedCases: materialized.generatedCases,
  deviceId: 'desktop-device',
});
const mergedAfterRemoval = materializeCloudSnapshot(mergeCloudSnapshots(merged, removalSnapshot));
assert.deepEqual(
  mergedAfterRemoval.rawByKey[storageKeys.tray][caseId],
  ['TRN-8842-19'],
  'A newer pin removal should win over a stale device snapshot.',
);

const recoveryCode = 'fa-test-recovery-code-1234567890';
const encrypted = await encryptCloudSnapshot(merged, recoveryCode);
assert.equal(encrypted.algorithm, 'AES-GCM');
assert.ok(!JSON.stringify(encrypted).includes('Added while desktop was offline'));
assert.deepEqual(await decryptCloudSnapshot(encrypted, recoveryCode), merged);

const [
  apiSource,
  clientSource,
  keySource,
  generatedRepositorySource,
  lunaSource,
] = await Promise.all([
  readFile(new URL('../api/cloud-sync.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/data/cloudSyncClient.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/data/persistenceKeys.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/data/generatedCaseRepository.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/LunaPostSubmissionPanel.jsx', import.meta.url), 'utf8'),
]);

for (const environmentKey of [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'CLOUD_SYNC_HMAC_SECRET',
  'CLOUD_SYNC_ALLOWED_ORIGIN',
]) {
  assert.match(apiSource, new RegExp(`process\\.env\\.${environmentKey}`));
}
assert.doesNotMatch(apiSource, /https:\/\/[^'"]+\.upstash\.io/);
assert.match(clientSource, /AES-GCM/);
assert.match(clientSource, /PBKDF2/);
assert.match(clientSource, /X-Fraud-Academy-Sync-Id/);
assert.doesNotMatch(clientSource, /X-Fraud-Academy-Sync-Key/);
assert.match(clientSource, /response\.status === 409/);
assert.match(clientSource, /window\.addEventListener\('online'/);
assert.match(keySource, /completed-debriefs-v1/);
assert.match(generatedRepositorySource, /mergeGeneratedCases/);
assert.match(lunaSource, /fraud-academy:debrief-completed/);

function mockResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(value = '') {
      this.body = value;
    },
  };
}

async function callApi(method, body) {
  const req = {
    method,
    body,
    headers: {
      host: 'fraud-academy.test',
      origin: 'https://fraud-academy.test',
      'x-forwarded-host': 'fraud-academy.test',
      'x-forwarded-proto': 'https',
      'x-forwarded-for': `127.0.0.${method === 'GET' ? '1' : '2'}`,
      'x-fraud-academy-sync-id': createHash('sha256').update(recoveryCode).digest('hex'),
    },
    socket: { remoteAddress: '127.0.0.1' },
  };
  const res = mockResponse();
  await cloudSyncHandler(req, res);
  return { status: res.statusCode, body: JSON.parse(res.body || '{}') };
}

const originalFetch = globalThis.fetch;
const originalEnvironment = {
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  CLOUD_SYNC_HMAC_SECRET: process.env.CLOUD_SYNC_HMAC_SECRET,
  CLOUD_SYNC_ALLOWED_ORIGIN: process.env.CLOUD_SYNC_ALLOWED_ORIGIN,
};
process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.CLOUD_SYNC_HMAC_SECRET = '1234567890abcdef1234567890abcdef';
process.env.CLOUD_SYNC_ALLOWED_ORIGIN = 'https://fraud-academy.test';

let redisMode = 'empty';
let lastRedisCommand = [];
globalThis.fetch = async (_url, options) => {
  lastRedisCommand = JSON.parse(options.body);
  if (redisMode === 'empty') return new Response(JSON.stringify({ result: [] }), { status: 200 });
  if (redisMode === 'saved') return new Response(JSON.stringify({ result: [1, '1'] }), { status: 200 });
  return new Response(JSON.stringify({ result: [0, '3', JSON.stringify(encrypted)] }), { status: 200 });
};

const emptyCloud = await callApi('GET');
assert.equal(emptyCloud.status, 200);
assert.equal(emptyCloud.body.revision, 0);
assert.equal(lastRedisCommand[0], 'HGETALL');
assert.ok(!lastRedisCommand.join(' ').includes(recoveryCode), 'The Redis key must not expose the recovery code.');

redisMode = 'saved';
const savedCloud = await callApi('PUT', { baseRevision: 0, payload: encrypted });
assert.equal(savedCloud.status, 200);
assert.equal(savedCloud.body.revision, 1);
assert.equal(lastRedisCommand[0], 'EVAL');

redisMode = 'conflict';
const conflictedCloud = await callApi('PUT', { baseRevision: 1, payload: encrypted });
assert.equal(conflictedCloud.status, 409);
assert.equal(conflictedCloud.body.revision, 3);
assert.deepEqual(conflictedCloud.body.payload, encrypted);

globalThis.fetch = originalFetch;
for (const [key, value] of Object.entries(originalEnvironment)) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

console.log('Cloud persistence smoke check passed.');
