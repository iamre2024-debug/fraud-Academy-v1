import fs from 'node:fs';
import path from 'node:path';
import { trainingCases as baseCases } from '../src/data/cases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { businessRecordsByCase } from '../src/data/businessRecords.js';
import { evidenceRecordsByCase } from '../src/data/evidenceRecords.js';
import { financialRecordsByCase } from '../src/data/financialRecords.js';
import { reviewChoices, decisionCallGroups } from '../src/data/reviewPackage.js';

const rootDir = process.cwd();
const cases = enrichTrainingCases(baseCases);
const failures = [];

function read(file) {
  return fs.readFileSync(path.join(rootDir, file), 'utf8');
}

function requireText(file, content, text, label) {
  if (!content.includes(text)) failures.push(`${file} is missing ${label}: ${text}`);
}

function requireAbsent(file, content, text, label) {
  if (content.includes(text)) failures.push(`${file} still contains retired ${label}: ${text}`);
}

function requireCount(label, actual, minimum) {
  if (actual < minimum) failures.push(`${label} expected at least ${minimum}, found ${actual}.`);
}

if (cases.length < 3) failures.push(`Expected at least 3 built-in cases, found ${cases.length}.`);

for (const item of cases) {
  const prefix = `${item.id} visual case coverage`;
  for (const field of ['id', 'type', 'priority', 'status', 'person', 'trainingId', 'amount', 'opened', 'allegation', 'queueReason', 'claimId', 'transactionInfo', 'shortSummary']) {
    if (!item[field]) failures.push(`${prefix} is missing ${field}.`);
  }

  if (!item.intake?.channel || !item.intake?.contactTime || !item.intake?.customerLocation || !item.intake?.statedDevice) {
    failures.push(`${prefix} is missing full intake metadata.`);
  }

  requireCount(`${prefix} identity records`, item.identityRecords?.length ?? 0, 4);
  requireCount(`${prefix} login history records`, item.loginHistory?.length ?? 0, 4);
  requireCount(`${prefix} timeline events`, item.events?.length ?? 0, 4);
  requireCount(`${prefix} documents`, item.documents?.length ?? 0, 3);

  const deviceIdsByDevice = new Map();
  for (const login of item.loginHistory ?? []) {
    if (!login.deviceId) failures.push(`${prefix} login ${login.id} is missing a Device ID.`);
    const existingId = deviceIdsByDevice.get(login.device);
    if (existingId && existingId !== login.deviceId) {
      failures.push(`${prefix} device ${login.device} changed Device ID from ${existingId} to ${login.deviceId}.`);
    }
    deviceIdsByDevice.set(login.device, login.deviceId);
  }

  const financial = financialRecordsByCase[item.id] ?? {};
  const business = businessRecordsByCase[item.id] ?? {};
  const evidence = evidenceRecordsByCase[item.id] ?? {};
  requireCount(`${prefix} transaction records`, financial.transactions?.length ?? 0, 2);
  requireCount(`${prefix} financial intelligence records`, financial.financialIntel?.length ?? 0, 2);
  requireCount(`${prefix} payment verification records`, financial.paymentVerification?.length ?? 0, 2);
  requireCount(`${prefix} business relationship records`, business.business360?.length ?? 0, 1);
  requireCount(`${prefix} business intelligence records`, business.businessIntel?.length ?? 0, 1);
  requireCount(`${prefix} evidence center records`, evidence.evidence?.length ?? 0, 2);
  requireCount(`${prefix} document viewer records`, evidence.documents?.length ?? 0, 2);
}

const visualApp = read('src/VisualApp.jsx');
const visualWorkspace = read('src/VisualWorkspace.jsx');
const visualNavigation = read('src/VisualNavigation.jsx');
const main = read('src/main.jsx');

for (const required of [
  "const [activeCaseId, setActiveCaseId]",
  "const [activeTab, setActiveTab] = useState('workspace')",
  'function openCase(caseId)',
  'onCaseChange={openCase}',
  'onOpenCase={openCase}',
]) {
  requireText('src/VisualApp.jsx', visualApp, required, 'active case/navigation coordinator anchor');
}

for (const required of [
  "onNavigate('academy')",
  "openTool('Evidence Center')",
  'function jumpDecision()',
  'submitRef.current?.scrollIntoView',
  '<small>Claim ID</small>',
  '<small>Transaction / payee info</small>',
  '<small>Short summary</small>',
  "columns: ['Device ID'",
  'item.deviceId ?? `DEV-${item.id}`',
  'reviewChoices.map',
  'packageStatus.messages.map',
  'category-progress-track',
]) {
  requireText('src/VisualWorkspace.jsx', visualWorkspace, required, 'three-case visual workflow anchor');
}

for (const required of [
  'trainingCases.map',
  'onOpenCase(item.id)',
  "onNavigate('workspace')",
  "onNavigate('progress')",
  "{ key: 'academy'",
]) {
  requireText('src/VisualNavigation.jsx', visualNavigation, required, 'direct navigation callback anchor');
}

for (const forbidden of [
  "import './visualInvestigationRepair.js'",
  "import './visualQaPatch.js'",
  "import './visualNavPatch.js'",
  "import './visualTextCollapse.js'",
]) {
  requireAbsent('src/main.jsx', main, forbidden, 'DOM patch import');
}

requireCount('Submit Decision learner choices', reviewChoices.length, 12);
requireCount('Submit Decision call groups', decisionCallGroups.length, 4);

for (const choice of [
  'Route for chargeback representment review',
  'Route for credit risk underwriting review',
  'Escalate for insider / vendor / API / open banking review',
  'No action yet / continue investigation',
]) {
  if (!reviewChoices.includes(choice)) failures.push(`Submit Decision is missing learner choice: ${choice}`);
}

if (failures.length) {
  console.error('Visual three-case smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Visual three-case smoke check passed. All built-in cases have enriched intake metadata, stable Device IDs, record depth, direct React routing anchors, and expanded Submit Decision choices.');
