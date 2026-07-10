import fs from 'node:fs';
import { buildLunaDebrief } from '../src/data/lunaDebrief.js';

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

for (const text of ['Case Briefing', 'Claimed Transactions', 'Case Intake Documents', 'Customer 360', 'Customer Timeline']) {
  requireText('src/CoreOverviewPanels.jsx', overview, text);
}

for (const text of [
  'Identity Intelligence',
  'Login History',
  'Device Intelligence',
  'IP Intelligence',
  'Session History',
  'Financial Intelligence',
  'Payment Verification',
  'Business Intelligence',
  'Evidence Center',
  'Link Analysis',
  'Timeline',
  'Case Report',
]) {
  requireText('src/data/coreToolRecords.js', records, text);
}

for (const text of ['Bank Code', 'Destination ID', 'Linked Transactions', 'Linked Digital Objects', 'Evidence summary', 'Timeline summary']) {
  requireText('src/data/coreToolRecords.js', records, text);
}

for (const text of ['buildCoreToolRecords', "item !== 'System Access Lane'", "openTool('Case Briefing')"]) {
  requireText('src/ActiveToolPanel.jsx', panel, text);
}

for (const text of ['buildLunaDebrief', 'Post-submission coaching stays locked', 'fraud-academy:package-saved']) {
  requireText('src/LunaPostSubmissionPanel.jsx', luna, text);
}

for (const text of ['if (!reviewPackage) return null', 'Decision-quality breakdown', 'Structured report packets', 'Payment Verification objects']) {
  const targetPath = text === 'Decision-quality breakdown' ? 'src/LunaPostSubmissionPanel.jsx' : 'src/data/lunaDebrief.js';
  const targetContent = text === 'Decision-quality breakdown' ? luna : lunaModel;
  requireText(targetPath, targetContent, text);
}

const lunaLockedResult = buildLunaDebrief({
  activeCase: { id: 'FA-CR-24003', type: 'Credit Risk Review', allegation: 'System alert requires review.' },
  reviewPackage: null,
});

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

if (!process.exitCode) console.log('Core investigator wave smoke check passed.');
