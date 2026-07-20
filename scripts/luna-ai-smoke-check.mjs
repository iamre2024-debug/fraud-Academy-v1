import fs from 'node:fs';
import path from 'node:path';
import { trainingCases } from '../src/data/cases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { buildLunaDebrief } from '../src/data/lunaDebrief.js';
import {
  buildLunaAiDebriefPayload,
  buildLunaAiSignature,
  mergeLunaAiDebrief,
} from '../src/data/lunaAiDebrief.js';

const rootDir = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

const mayaCase = enrichTrainingCases(trainingCases).find((item) => item.id === 'FA-ATO-24018');
const reviewPackage = {
  choice: 'Do Not Support Customer Claim',
  confidence: 'High',
  reason: 'The activity does not support the customer claim because LOG-1008, DEV-MAYA-IP16-001, and EVT-1014 stay within the known Dallas access pattern.',
  completedTools: ['Customer 360', 'Login History', 'Device Intelligence', 'Transaction History'],
  pinnedEvidence: ['LOG-1008', 'DEV-MAYA-IP16-001', 'EVT-1014'],
  noteSnapshot: [
    'Jul 15, 10:10 AM · Investigation note · LOG-1008 and EVT-1014 are in sequence and do not show a confirmed takeover because the activity stays in the known Dallas profile.',
  ],
  reviewedRequired: 4,
  totalRequired: 4,
  decisionIndicators: [],
};
const deterministicDebrief = buildLunaDebrief({ activeCase: mayaCase, reviewPackage });

if (deterministicDebrief.outcome !== 'correct') {
  fail('Maya ATO deterministic debrief must mark Do Not Support Customer Claim as correct.');
}
if (deterministicDebrief.truthReveal.correctDetermination !== 'Do Not Support Customer Claim') {
  fail('Maya ATO supported determination must not say Support Customer Claim.');
}

const payload = buildLunaAiDebriefPayload({ activeCase: mayaCase, reviewPackage, deterministicDebrief });
for (const requiredId of ['LOG-1008', 'EVT-1014', 'PCH-1001']) {
  if (!payload.allowedEvidenceIds.includes(requiredId)) fail(`Luna AI payload is missing evidence ID ${requiredId}.`);
}

const signature = buildLunaAiSignature(mayaCase, reviewPackage, deterministicDebrief);
if (!signature.includes('Do Not Support Customer Claim') || !signature.includes('FA-ATO-24018')) {
  fail('Luna AI signature must include the case and supported determination.');
}

const validAiDebrief = {
  outcome: 'correct',
  outcomeLabel: 'Correct decision',
  supportedDetermination: 'Do Not Support Customer Claim',
  managerHeading: 'Great job on this review.',
  managerMessage: 'You correctly found that the records do not support the customer claim. LOG-1008 and EVT-1014 stay within the known access pattern, so your next step is to write that clearly.',
  managerTip: 'Next time, name the strongest record and the conflicting customer statement in the same sentence.',
  strengths: ['You matched the decision to the available account records.'],
  improvements: ['Explain why the customer statement is not enough without confirming fraud evidence.'],
  citedEvidenceIds: ['LOG-1008', 'EVT-1014'],
};
const mergedDebrief = mergeLunaAiDebrief(deterministicDebrief, validAiDebrief);
if (!mergedDebrief.aiEnhanced || mergedDebrief.outcome !== deterministicDebrief.outcome) {
  fail('A validated AI debrief must enhance Luna without changing the deterministic outcome.');
}

const rejectedDebrief = mergeLunaAiDebrief(deterministicDebrief, { ...validAiDebrief, outcome: 'incorrect' });
if (rejectedDebrief.aiEnhanced) {
  fail('Luna must reject AI coaching that changes the deterministic grading outcome.');
}

const lunaPanel = fs.readFileSync(path.join(rootDir, 'src/LunaPostSubmissionPanel.jsx'), 'utf8');
const lunaHelper = fs.readFileSync(path.join(rootDir, 'src/data/lunaAiDebrief.js'), 'utf8');
const lunaFunction = fs.readFileSync(path.join(rootDir, 'netlify/functions/luna-debrief.mjs'), 'utf8');
const netlifyConfig = fs.readFileSync(path.join(rootDir, 'netlify.toml'), 'utf8');
for (const [label, content, anchor] of [
  ['LunaPostSubmissionPanel.jsx', lunaPanel, 'requestLunaAiDebrief'],
  ['LunaPostSubmissionPanel.jsx', lunaPanel, 'Built-in coaching active'],
  ['lunaAiDebrief.js', lunaHelper, "export const lunaAiEndpoint = '/api/luna-debrief';"],
  ['luna-debrief.mjs', lunaFunction, 'process.env.OPENAI_API_KEY'],
  ['luna-debrief.mjs', lunaFunction, "process.env.LUNA_OPENAI_MODEL || 'gpt-5.6-sol'"],
  ['luna-debrief.mjs', lunaFunction, 'https://api.openai.com/v1/responses'],
  ['luna-debrief.mjs', lunaFunction, 'strict: true'],
  ['netlify.toml', netlifyConfig, 'to = "/.netlify/functions/luna-debrief"'],
]) {
  if (!content.includes(anchor)) fail(`${label} is missing ${anchor}`);
}

if (failures.length) {
  console.error('Luna AI smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Luna AI smoke check passed. Maya is calibrated to the no-confirmed-fraud outcome, AI coaching is server-side, and invalid AI grading overrides are rejected.');
