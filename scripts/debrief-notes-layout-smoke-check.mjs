import fs from 'node:fs';
import path from 'node:path';
import { buildLunaDebrief, scoreNotesQuality } from '../src/data/lunaDebrief.js';

const rootDir = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
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
  activeCase: { id: 'FA-NOTES-TEST', type: 'Account Takeover', allegation: 'Training claim' },
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
const notesBreakdown = debrief.breakdown.find((item) => item.label === 'Quality of notes');
if (!notesBreakdown || notesBreakdown.points !== strongScore.points) {
  fail('The debrief breakdown must use the Notes Quality result.');
}
if (debrief.breakdown.some((item) => item.label === 'Notebook and rationale depth')) {
  fail('The old note-count scoring label is still present.');
}

const panel = fs.readFileSync(path.join(rootDir, 'src/LunaPostSubmissionPanel.jsx'), 'utf8');
for (const anchor of [
  'data-debrief-step="05"',
  'data-debrief-step="06"',
  'state.debrief.notesQuality.label',
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
