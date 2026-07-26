import fs from 'node:fs';
import path from 'node:path';
import { buildLunaDebrief, scoreNotesQuality } from '../src/data/lunaDebrief.js';
import { coreClaimTypes } from '../src/data/claimRegistry.js';

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

function decisionPackage(choice, documentAssessment) {
  return {
    choice,
    confidence: 'Medium',
    reason: 'The learner compared the available document fields with the claim and explained the resulting evidence state.',
    completedTools: [],
    pinnedEvidence: [],
    noteSnapshot: [],
    reviewedRequired: 0,
    totalRequired: 1,
    decisionIndicators: [],
    documentAssessment,
  };
}

const completeNonSupportingAssessment = {
  received: 'Received',
  readability: 'Readable',
  completeness: 'Complete',
  identityMatch: 'Matches',
  claimEffect: 'Does not support claim',
  additionalEvidenceNeeded: 'No',
  reasoning: 'Every requested page and date is present, but the records do not establish the reported claim.',
};
const incompleteAssessment = {
  received: 'Received',
  readability: 'Readable',
  completeness: 'Incomplete',
  identityMatch: 'Matches',
  claimEffect: '',
  additionalEvidenceNeeded: 'Yes',
  reasoning: 'The disputed date range and the second statement page are missing from the received upload.',
};

const nonSupportingCreditDebrief = buildLunaDebrief({
  activeCase: {
    id: 'FA-DOC-NON-SUPPORT',
    claimTypeId: 'credit-risk',
    caseTruth: {
      classification: 'The requested document review was expected to remain open.',
      correctDetermination: 'More Information Needed',
      acceptedDeterminations: ['More Information Needed'],
      rationale: 'The original calibration expected another document request.',
    },
  },
  reviewPackage: decisionPackage('Do Not Support Credit Request', completeNonSupportingAssessment),
});
if (nonSupportingCreditDebrief.determinationMatched !== true
  || nonSupportingCreditDebrief.decisionEvaluation.basis !== 'document-context') {
  fail('Complete, readable, non-supportive documents should make the supported final adverse decision defensible instead of forcing More Information Needed.');
}
if (nonSupportingCreditDebrief.truthReveal.primaryDetermination !== 'More Information Needed'
  || !nonSupportingCreditDebrief.truthReveal.acceptedDeterminations.includes('Do Not Support Credit Request')) {
  fail('A defensible document-based alternative should preserve the primary calibration and disclose the accepted submitted outcome.');
}

const prematureCreditDebrief = buildLunaDebrief({
  activeCase: {
    id: 'FA-DOC-PREMATURE',
    claimTypeId: 'credit-risk',
    caseTruth: {
      classification: 'The document packet remains incomplete.',
      correctDetermination: 'More Information Needed',
      acceptedDeterminations: ['More Information Needed'],
      rationale: 'A required statement page is missing.',
    },
  },
  reviewPackage: decisionPackage('Do Not Support Credit Request', incompleteAssessment),
});
if (prematureCreditDebrief.determinationMatched !== false) {
  fail('An incomplete packet that explicitly needs more evidence must not support a final adverse decision.');
}

const evidenceGapDebrief = buildLunaDebrief({
  activeCase: {
    id: 'FA-DOC-GAP',
    claimTypeId: 'fraud-chargeback',
    caseTruth: {
      classification: 'The calibrated downstream outcome supports the customer.',
      correctDetermination: 'Support Customer Claim',
      acceptedDeterminations: ['Support Customer Claim'],
      rationale: 'The complete scenario packet supports the claim.',
    },
  },
  reviewPackage: decisionPackage('Insufficient Evidence', incompleteAssessment),
});
if (evidenceGapDebrief.determinationMatched !== true
  || evidenceGapDebrief.decisionEvaluation.basis !== 'document-context') {
  fail('A specific missing-document gap should make a provisional decision defensible at the time of submission.');
}

const exactButPrematureDebrief = buildLunaDebrief({
  activeCase: {
    id: 'FA-DOC-EXACT',
    claimTypeId: 'credit-risk',
    caseTruth: {
      classification: 'The document packet remains incomplete.',
      correctDetermination: 'More Information Needed',
      acceptedDeterminations: ['More Information Needed'],
      rationale: 'A required statement page is missing.',
    },
  },
  reviewPackage: decisionPackage('More Information Needed', completeNonSupportingAssessment),
});
if (exactButPrematureDebrief.determinationMatched !== false
  || exactButPrematureDebrief.decisionEvaluation.basis !== 'context-conflict') {
  fail('Luna should not accept the calibrated button alone when the saved complete document assessment directly supports a different outcome.');
}

const semanticAliasDebrief = buildLunaDebrief({
  activeCase: {
    id: 'FA-DOC-SEMANTIC',
    claimTypeId: 'fraud-chargeback',
    caseTruth: {
      classification: 'The evidence supports the customer claim.',
      correctDetermination: 'Support Customer Claim',
      acceptedDeterminations: ['Support Customer Claim'],
      rationale: 'The evidence supports the claim.',
    },
  },
  reviewPackage: decisionPackage('Approve claim / customer claim supported'),
});
if (semanticAliasDebrief.determinationMatched !== true
  || semanticAliasDebrief.decisionEvaluation.basis !== 'semantic') {
  fail('Equivalent lane wording should be accepted without requiring exact answer-key text.');
}

const holdReleaseAlternative = buildLunaDebrief({
  activeCase: {
    id: 'FA-DOC-BEC',
    claimTypeId: 'email-bec',
    caseTruth: {
      classification: 'The callback record was expected to remain pending.',
      correctDetermination: 'More Information Needed',
      acceptedDeterminations: ['More Information Needed'],
      rationale: 'The original calibration expected another callback.',
    },
  },
  reviewPackage: decisionPackage('Release', completeNonSupportingAssessment),
});
if (holdReleaseAlternative.determinationMatched !== true
  || holdReleaseAlternative.decisionEvaluation.basis !== 'document-context') {
  fail('Operational hold/release lanes should interpret complete non-supportive documents as a defensible Release outcome.');
}

for (const claimType of coreClaimTypes) {
  for (const scenario of claimType.scenarios) {
    const exactDebrief = buildLunaDebrief({
      activeCase: {
        id: `FA-GENERATED-${claimType.id}-${scenario.id}`,
        claimTypeId: claimType.id,
        lane: claimType.lane,
        caseTruth: scenario.caseTruth,
      },
      reviewPackage: decisionPackage(scenario.caseTruth.correctDetermination),
    });
    if (exactDebrief.determinationMatched !== true || exactDebrief.decisionEvaluation.basis !== 'exact') {
      fail(`Generated scenario ${claimType.id}/${scenario.id} no longer accepts its calibrated determination.`);
    }
  }
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
const visualWorkspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
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
for (const anchor of [
  'function stageForWorkspaceScreen(screen, toolName)',
  "if (screen === 'debrief') return 'debrief';",
  "const initialWorkspaceScreen = requestedWorkspaceScreen || 'briefing';",
  'useState(() => stageForWorkspaceScreen(initialWorkspaceScreen',
  'useState(() => initialWorkspaceScreen)',
]) {
  if (!visualWorkspace.includes(anchor)) fail(`VisualWorkspace.jsx is missing route-preserving layout anchor ${anchor}.`);
}

if (failures.length) {
  console.error('Debrief notes and layout mode smoke check failed:');
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log('Debrief notes and layout mode smoke check passed. Notes are quality-scored, debrief steps stay unique, and responsive mode switches preserve the active workspace route.');
