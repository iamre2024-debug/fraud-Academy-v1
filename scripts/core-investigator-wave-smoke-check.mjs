import fs from 'node:fs';
import { buildLunaDebrief } from '../src/data/lunaDebrief.js';
import { trainingCases as baseCases } from '../src/data/cases.js';
import { createLocalCaseStorage, createRemoteCaseStorage } from '../src/data/caseStorage.js';
import { addGeneratedCase, appendGeneratedCases, createGeneratedCase, readGeneratedCases } from '../src/data/generatedCases.js';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function requireText(path, content, text) {
  if (!content.includes(text)) {
    console.error(`${path}: missing ${text}`);
    process.exitCode = 1;
  }
}

const overview = read('src/CoreOverviewPanels.jsx');
const records = read('src/data/coreToolRecords.js');
const panel = read('src/ActiveToolPanel.jsx');
const luna = read('src/LunaPostSubmissionPanel.jsx');
const lunaModel = read('src/data/lunaDebrief.js');
const main = read('src/main.jsx');
const generatedCasesModel = read('src/data/generatedCases.js');
const caseStorageModel = read('src/data/caseStorage.js');
const visualApp = read('src/VisualApp.jsx');

for (const text of ['Case Briefing', 'Claimed Transactions', 'Case Intake Documents', 'Customer 360', 'Customer Timeline']) requireText('src/CoreOverviewPanels.jsx', overview, text);
for (const text of ['Identity Intelligence', 'Login History', 'Device Intelligence', 'IP Intelligence', 'Session History', 'Financial Intelligence', 'Payment Verification', 'Business Intelligence', 'Evidence Center', 'Link Analysis', 'Timeline', 'Case Report']) requireText('src/data/coreToolRecords.js', records, text);
for (const text of ['Bank Code', 'Destination ID', 'Linked Transactions', 'Linked Digital Objects', 'Evidence summary', 'Timeline summary']) requireText('src/data/coreToolRecords.js', records, text);
for (const text of ['buildCoreToolRecords', "item !== 'System Access Lane'", "openTool('Case Briefing')"]) requireText('src/ActiveToolPanel.jsx', panel, text);
for (const text of ['buildLunaDebrief', 'Post-submission coaching stays locked', 'fraud-academy:package-saved']) requireText('src/LunaPostSubmissionPanel.jsx', luna, text);
for (const text of ['if (!reviewPackage) return null', 'Decision-quality breakdown', 'Structured report packets', 'Payment Verification objects']) {
  const targetPath = text === 'Decision-quality breakdown' ? 'src/LunaPostSubmissionPanel.jsx' : 'src/data/lunaDebrief.js';
  requireText(targetPath, text === 'Decision-quality breakdown' ? luna : lunaModel, text);
}

for (const text of ['createLocalCaseStorage', 'createRemoteCaseStorage', "kind: 'local'", "kind: 'remote'", "request('/cases')", 'encodeURIComponent(nextCase.id)']) requireText('src/data/caseStorage.js', caseStorageModel, text);
for (const text of ["import { localCaseStorage } from './caseStorage.js'", 'storage.readAll()', 'storage.writeAll(cases)', 'storage.upsert(nextCase)', 'while (existingIds.has(nextCase.id))']) requireText('src/data/generatedCases.js', generatedCasesModel, text);
if (generatedCasesModel.includes('.slice(0, 50)')) {
  console.error('src/data/generatedCases.js: generated case queue still has the retired 50-case limit.');
  process.exitCode = 1;
}
for (const text of ['setCaseCatalog((current)', 'filter((item) => item.id !== nextCase.id)', 'openCase(nextCase.id)']) requireText('src/VisualApp.jsx', visualApp, text);

const memory = new Map();
global.window = {
  localStorage: {
    getItem(key) { return memory.has(key) ? memory.get(key) : null; },
    setItem(key, value) { memory.set(key, value); },
  },
};

const localStorageAdapter = createLocalCaseStorage({ storageKey: 'fraud-academy-smoke-generated-cases' });
for (let index = 0; index < 75; index += 1) addGeneratedCase(localStorageAdapter);
const generatedCases = readGeneratedCases(localStorageAdapter);
const fullCatalog = appendGeneratedCases(baseCases, localStorageAdapter);
const generatedIds = new Set(generatedCases.map((item) => item.id));
const generatedTypes = new Set(Array.from({ length: 25 }, (_, index) => createGeneratedCase(index).type));

if (generatedCases.length !== 75) {
  console.error(`src/data/generatedCases.js: expected 75 saved generated cases, found ${generatedCases.length}.`);
  process.exitCode = 1;
}
if (generatedIds.size !== generatedCases.length) {
  console.error('src/data/generatedCases.js: generated case IDs must remain unique during rapid generation.');
  process.exitCode = 1;
}
if (fullCatalog.length !== baseCases.length + generatedCases.length) {
  console.error('src/data/generatedCases.js: built-in and generated cases must coexist in one catalog.');
  process.exitCode = 1;
}
if (generatedTypes.size !== 5) {
  console.error(`src/data/generatedCases.js: expected all 5 generated case templates, found ${generatedTypes.size}.`);
  process.exitCode = 1;
}
for (const generatedCase of generatedCases) {
  if (!generatedCase.id || !generatedCase.trainingId || !generatedCase.customer || !generatedCase.loginHistory?.length || !generatedCase.documents?.length) {
    console.error(`src/data/generatedCases.js: generated case ${generatedCase.id ?? 'unknown'} is missing required investigation records.`);
    process.exitCode = 1;
    break;
  }
}

const remoteCalls = [];
const remoteStorage = createRemoteCaseStorage({
  baseUrl: 'https://training.example.test/api',
  fetchImpl: async (url, options = {}) => {
    remoteCalls.push({ url, options });
    return { ok: true, status: 200, async json() { return options.body ? JSON.parse(options.body) : []; } };
  },
});
await remoteStorage.readAll();
await remoteStorage.upsert(createGeneratedCase(7));
if (remoteCalls[0]?.url !== 'https://training.example.test/api/cases' || remoteCalls[1]?.options?.method !== 'PUT') {
  console.error('src/data/caseStorage.js: remote adapter contract is not preserving list and upsert routes.');
  process.exitCode = 1;
}

const lunaLockedResult = buildLunaDebrief({ activeCase: { id: 'FA-CR-24003', type: 'Credit Risk Review', allegation: 'System alert requires review.' }, reviewPackage: null });
if (lunaLockedResult !== null) {
  console.error('src/data/lunaDebrief.js: Luna debrief must return null before a learner package is saved.');
  process.exitCode = 1;
}
const lunaUnlockedResult = buildLunaDebrief({
  activeCase: { id: 'FA-CR-24003', type: 'Credit Risk Review', allegation: 'System alert requires review.' },
  reviewPackage: {
    id: 'PKG-SMOKE',
    completedTools: ['Customer 360', 'Identity Intelligence', 'Login History', 'Transaction History', 'Payment Verification', 'Evidence Center'],
    pinnedEvidence: ['PAY-3301', 'PAY-3302'],
    noteSnapshot: ['Reviewed Training ID, payment setup, and system alert packet.'],
    caseReportPackets: [{ section: 'Payment Verification', recordId: 'PAY-3301', title: 'Bank Code object', summary: 'Payment packet includes Bank Code and Destination ID verification objects.' }],
    reason: 'The saved learner package documents the system alert, identity setup, Payment Verification object, and access/session support for post-submission coaching.',
    confidence: 'Medium',
  },
});
if (!lunaUnlockedResult || typeof lunaUnlockedResult.score !== 'number') {
  console.error('src/data/lunaDebrief.js: Luna debrief must produce a post-submission score for a saved learner package.');
  process.exitCode = 1;
}
if (!lunaUnlockedResult?.breakdown?.some((item) => item.label === 'Structured report packets')) {
  console.error('src/data/lunaDebrief.js: Luna debrief must include structured report packet scoring after submission.');
  process.exitCode = 1;
}

requireText('src/main.jsx', main, './coreInvestigatorPanels.css');
for (const forbidden of ['Why am I here?', 'Who am I investigating?', 'Briefing questions', 'Suggested First Tool', 'Investigation Objective']) {
  if (overview.includes(forbidden) || panel.includes(forbidden)) {
    console.error(`Visible coaching copy remains: ${forbidden}`);
    process.exitCode = 1;
  }
}
if (!process.exitCode) console.log('Core investigator wave smoke check passed, including backend-ready storage adapters, all built-in cases, 75 generated cases, all 5 generated templates, and Luna lock behavior.');
