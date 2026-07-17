import fs from 'node:fs';
import path from 'node:path';
import { buildLunaDebrief, scoreNotesQuality } from '../src/data/lunaDebrief.js';
import { trainingCases } from '../src/data/cases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';

const rootDir = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

const expectedBuiltInOutcomes = {
  'FA-ATO-24018': 'Support Customer Claim',
  'FA-CB-24007': 'Insufficient Evidence',
  'FA-CR-24003': 'Refer to Fraud Review',
};
for (const activeCase of enrichTrainingCases(trainingCases)) {
  if (activeCase.caseTruth?.correctDetermination !== expectedBuiltInOutcomes[activeCase.id]) {
    fail(`${activeCase.id} must use its evidence-aligned built-in outcome instead of a loosely matched scenario answer.`);
  }
}

const automaticNotes = [
  'Jul 15, 10:00 AM \u00b7 Tool review \u00b7 Login History: reviewed.',
  'Jul 15, 10:01 AM \u00b7 Tool review \u00b7 Device Intelligence: reviewed.',
  'Jul 15, 10:02 AM \u00b7 Decision package \u00b7 Submit Decision package saved.',
];
const automaticScore = scoreNotesQuality(automaticNotes);
if (automaticScore.points !== 0 || automaticScore.substantiveCount !== 0) {
  fail('Automatic review notes must not earn Notes Quality points.');
}

const strongNotes = [
  'Jul 15, 10:10 AM \u00b7 Investigation note \u00b7 LOG-1008 occurred at 8:09 AM before TXN-742 and supports the access-change sequence because both records share SES-7781.',
  'Jul 15, 10:14 AM \u00b7 Timeline event \u00b7 EVT-1014 was compared with DEV-MAYA-IP16-001 and contradicts the reported device pattern after the profile change.',
  'Jul 15, 10:18 AM \u00b7 Document review \u00b7 DOC-442 remains unresolved because the customer statement does not explain the $4,900.00 transfer amount.',
];
const strongScore = scoreNotesQuality(strongNotes);
if (strongScore.points < 13 || strongScore.label !== 'Strong') {
  fail(`Evidence-linked notes should score Strong, received ${strongScore.points}/16 (${strongScore.label}).`);
}
if (strongScore.evidenceReferenceCount !== 3 || strongScore.reasoningCount !== 3 || strongScore.comparisonCount < 2) {
  fail('Notes Quality must preserve evidence, reasoning, and comparison counts.');
}

const debrief = buildLunaDebrief({
  activeCase: {
    id: 'FA-NOTES-TEST',
    type: 'Account Takeover',
    allegation: 'Training claim',
    caseTruth: {
      classification: 'The new device and transaction sequence support the customer claim.',
      correctDetermination: 'Support Customer Claim',
      acceptedDeterminations: ['Support Customer Claim'],
      rationale: 'The new device and transaction sequence support the customer claim.',
    },
  },
  reviewPackage: {
    choice: 'Insufficient Evidence',
    confidence: 'Medium',
    reason: 'The evidence package requires another review because the current timeline still contains an unresolved document gap.',
    completedTools: ['Case Summary', 'Login History'],
    pinnedEvidence: ['LOG-1008'],
    noteSnapshot: strongNotes,
    reviewedRequired: 2,
    totalRequired: 2,
    decisionIndicators: [],
  },
});
if (debrief.outcome !== 'incorrect' || debrief.outcomeLabel !== 'Not the right decision' || !debrief.managerMessage.includes('Support Customer Claim')) {
  fail('An incorrect decision must produce direct manager coaching and the supported outcome.');
}
const notesBreakdown = debrief.breakdown.find((item) => item.label === 'Quality of notes');
if (!notesBreakdown || notesBreakdown.points !== strongScore.points) {
  fail('The debrief breakdown must use the Notes Quality result.');
}

const correctDebrief = buildLunaDebrief({
  activeCase: {
    id: 'FA-NOTES-TEST',
    type: 'Account Takeover',
    allegation: 'Training claim',
    caseTruth: {
      classification: 'The new device and transaction sequence support the customer claim.',
      correctDetermination: 'Support Customer Claim',
      acceptedDeterminations: ['Support Customer Claim'],
    },
  },
  reviewPackage: {
    choice: 'Support Customer Claim',
    confidence: 'High',
    reason: 'The linked access and transaction records support the customer claim based on the documented sequence.',
    completedTools: ['Document Viewer', 'Login History', 'Transaction History'],
    pinnedEvidence: ['LOG-1008', 'EVT-1014'],
    noteSnapshot: strongNotes,
    reviewedRequired: 3,
    totalRequired: 3,
    decisionIndicators: [],
    documentRequests: [{ id: 'DOC-1', title: 'Customer affidavit', status: 'Received', reviewStatus: 'Pending Review', received: 'Jul 17, 2026' }],
  },
});
if (correctDebrief.outcome !== 'correct' || correctDebrief.outcomeLabel !== 'Correct decision' || !correctDebrief.managerHeading.includes('Great job')) {
  fail('A correct decision must produce supportive manager feedback.');
}
if (!correctDebrief.documentSummary.reviewed.includes('Customer affidavit')) {
  fail('Luna manager coaching must include received documents reviewed by the learner.');
}
if (debrief.breakdown.some((item) => item.label === 'Notebook and rationale depth')) {
  fail('The old note-count scoring label is still present.');
}

const panel = fs.readFileSync(path.join(rootDir, 'src/LunaPostSubmissionPanel.jsx'), 'utf8');
for (const anchor of [
  '<h2>Luna Briefing</h2>',
  'state.debrief.managerMessage',
  'What you did well',
  'What to improve',
  'Luna’s manager tip',
  'luna-v1-step-index',
]) {
  if (!panel.includes(anchor)) fail(`LunaPostSubmissionPanel.jsx is missing ${anchor}.`);
}

const layoutHook = fs.readFileSync(path.join(rootDir, 'src/useResponsiveLayoutMode.js'), 'utf8');
const layoutStyles = fs.readFileSync(path.join(rootDir, 'src/responsiveLayoutMode.css'), 'utf8');
const shellHeader = fs.readFileSync(path.join(rootDir, 'src/VisualShellHeader.jsx'), 'utf8');
for (const anchor of [
  "'(max-width: 720px)'",
  'dataset.layoutMode',
  'layoutPreference',
  'layoutDetected',
  "fraud-academy:layout-mode-changed",
]) {
  if (!layoutHook.includes(anchor)) fail(`Responsive layout hook is missing ${anchor}.`);
}
for (const anchor of ["['auto', 'mobile', 'desktop']", 'Detected {detectedLayout}', 'aria-pressed', 'setLayoutPreference(mode)']) {
  if (!shellHeader.includes(anchor)) fail(`VisualShellHeader.jsx is missing layout control anchor ${anchor}.`);
}
for (const anchor of ['body[data-layout-preference="mobile"]', '.layout-mode-control', 'grid-template-columns: minmax(0, 1fr) !important']) {
  if (!layoutStyles.includes(anchor)) fail(`responsiveLayoutMode.css is missing ${anchor}.`);
}

if (failures.length) {
  console.error('Debrief notes and layout mode smoke check failed:');
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log('Debrief notes and layout mode smoke check passed. Notes are quality-scored, debrief steps stay unique, and responsive mode is detected and switchable.');
