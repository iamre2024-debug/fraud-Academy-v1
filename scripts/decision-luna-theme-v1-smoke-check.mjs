import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const decision = fs.readFileSync(path.join(rootDir, 'src/SubmitDecisionPanel.jsx'), 'utf8');
const decisionEvidence = fs.readFileSync(path.join(rootDir, 'src/DecisionEvidenceNotepad.jsx'), 'utf8');
const decisionFlags = fs.readFileSync(path.join(rootDir, 'src/DecisionFlagChecklist.jsx'), 'utf8');
const decisionFlagData = fs.readFileSync(path.join(rootDir, 'src/data/decisionChecklist.js'), 'utf8');
const luna = fs.readFileSync(path.join(rootDir, 'src/LunaPostSubmissionPanel.jsx'), 'utf8');
const app = fs.readFileSync(path.join(rootDir, 'src/VisualApp.jsx'), 'utf8');
const actions = fs.readFileSync(path.join(rootDir, 'src/useVisualWorkspaceActions.js'), 'utf8');
const state = fs.readFileSync(path.join(rootDir, 'src/useVisualWorkspaceCaseState.js'), 'utf8');
const reviewPackage = fs.readFileSync(path.join(rootDir, 'src/data/reviewPackage.js'), 'utf8');
const debrief = fs.readFileSync(path.join(rootDir, 'src/data/lunaDebrief.js'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayDecisionLunaThemeV1.css'), 'utf8');
const layoutSafety = fs.readFileSync(path.join(rootDir, 'src/displayDecisionLunaLayoutSafetyV1.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/decision-luna-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_DECISION_LUNA_THEME_V1.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Decision and Luna v1 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Decision and Luna coupling or pre-submission answer language: ${text}`);
}

for (const anchor of [
  'decision-theme-v1',
  'data-decision-screen="approved-theme-v1"',
  'Determination · Evidence First',
  'Submit Decision',
  'Evidence First protection',
  'You can submit a decision without reviewing every tool.',
  'Luna Briefing stays locked until this case has a Submitted Decision Record.',
  'Unfinished checklist details are saved for coaching',
  'getDecisionCallGroups(activeCase)',
  'selectionGroups.map',
  'Determination choice',
  'Learner confidence',
  'Learner rationale',
  'Submit Decision',
  'Submission confirmation',
  'Open Luna Briefing',
  '<DecisionEvidenceNotepad',
  'removePin={removePin}',
  'toolNames={toolNames}',
]) {
  mustContain('SubmitDecisionPanel.jsx', decision, anchor);
}

for (const anchor of [
  'Evidence Notepad',
  'Pinned Proof',
  'Case Notes',
  'Everything you pin stays with this case',
  'resolvePinnedEvidence',
  'rowsFor',
  'Add to rationale',
  'Add a case note',
  'Save Note',
  "saveNote(cleanNote, 'Decision note')",
  'removePin(record.value)',
]) {
  mustContain('DecisionEvidenceNotepad.jsx', decisionEvidence, anchor);
}

for (const removed of ['Decision readiness', 'Decision needs attention', 'Check decision readiness', 'packageStatus.messages.map']) {
  mustNotContain('SubmitDecisionPanel.jsx', decision, removed);
}

for (const anchor of [
  'Case-specific checklist',
  'Matched to this case:',
  'Red flags',
  'Green flags',
  'Proof or record reference',
  'Why this evidence proves the flag',
  'Critical red flag documented.',
  'updateDecisionIndicator',
]) {
  mustContain('DecisionFlagChecklist.jsx', decisionFlags, anchor);
}

for (const anchor of [
  'export const flagWeightPoints',
  'wallet-chip-during-fraud-window',
  'scenarioFlagsByClaimType',
  'physical chip card',
  'Business Payroll ATO decision checklist',
  'Email Fraud / BEC decision checklist',
  'export function getDecisionChecklist',
  'export function summarizeDecisionIndicators',
]) {
  mustContain('decisionChecklist.js', decisionFlagData, anchor);
}

for (const anchor of [
  'luna-theme-v1',
  'data-luna-screen="approved-theme-v1"',
  "data-luna-state={locked ? 'locked' : 'unlocked'}",
  'Evidence First lock is active',
  'Submit your decision when you are ready.',
  'Submission unlocks your case-specific Luna Briefing.',
  'Luna will not reveal the case outcome or manager feedback before submission.',
  '<h2>Luna Briefing</h2>',
  'state.debrief.managerMessage',
  'Your decision',
  'What you did well',
  'What to improve',
  'Luna’s manager tip',
  'Back to Workspace',
  'View Case Summary',
  'Finish and Return to Queue',
  "window.addEventListener('fraud-academy:package-saved'",
]) {
  mustContain('LunaPostSubmissionPanel.jsx', luna, anchor);
}

for (const anchor of [
  'function returnToQueue()',
  'function returnToWorkspace()',
  'function viewCaseSummary()',
  'onBackToWorkspace={returnToWorkspace}',
  'onViewCaseSummary={viewCaseSummary}',
  'onReturnToQueue={returnToQueue}',
]) {
  mustContain('VisualApp.jsx', app, anchor);
}

for (const anchor of [
  'function submitDecision(event)',
  'const reviewPackage = buildReviewPackage({',
  "window.dispatchEvent(new CustomEvent('fraud-academy:package-saved'",
  "markReviewed('Submit Decision')",
]) {
  mustContain('useVisualWorkspaceActions.js', actions, anchor);
}
mustNotContain('useVisualWorkspaceActions.js', actions, 'if (!status.ready)');

for (const anchor of [
  'readStorage(storageKeys.decisions',
  'readStorage(storageKeys.packages',
  'writeStorage(storageKeys.decisions',
  'writeStorage(storageKeys.packages',
]) {
  mustContain('useVisualWorkspaceCaseState.js', state, anchor);
}

for (const anchor of [
  'export const decisionCallGroups',
  'export const minimumRationaleWords',
  'export function getRequiredReviewTools',
  'export function getDecisionCallGroups',
  'export function getReviewChoices',
  'export function getReviewPackageStatus',
  'export function buildReviewPackage',
  'You may submit without reviewing every tool.',
]) {
  mustContain('reviewPackage.js', reviewPackage, anchor);
}

for (const anchor of [
  'export function buildLunaDebrief',
  'if (!reviewPackage) return null',
  'outcomeLabel:',
  'managerMessage:',
  'managerTip:',
  'scoreLabel:',
  'strengths,',
  'followUps:',
  'breakdown:',
]) {
  mustContain('lunaDebrief.js', debrief, anchor);
}

for (const anchor of [
  'body[data-visual-tab="workspace"] .decision-theme-v1',
  'body[data-visual-tab="workspace"] .luna-theme-v1',
  '.decision-v1-workspace',
  '.decision-status-grid',
  '.decision-evidence-notepad',
  '.decision-evidence-tabs',
  '.decision-pinned-proof-card',
  '.luna-v1-unlock-grid',
  '.luna-v1-debrief-grid',
  'position: static !important',
  'grid-template-columns: minmax(0, 1fr)',
  '@media (max-width: 960px)',
  '@media (max-width: 720px)',
  '@media (max-width: 520px)',
  '@media (max-width: 350px)',
]) {
  mustContain('displayDecisionLunaThemeV1.css', styles, anchor);
}

for (const anchor of [
  '[data-workflow-stage="determination"]',
  'width: 100% !important',
  'max-width: 100% !important',
  'margin-inline: 0 !important',
  'transform: none !important',
  'width: calc(100% - 18px) !important',
]) {
  mustContain('displayDecisionLunaLayoutSafetyV1.css', layoutSafety, anchor);
}

mustContain('main.jsx', entrypoint, "import './displayDecisionLunaThemeV1.css';");
mustContain('main.jsx', entrypoint, "import './displayDecisionLunaLayoutSafetyV1.css';");
mustContain('decision-luna-browser.spec.mjs', browser, 'an incomplete decision saves and unlocks Luna on desktop and mobile');
mustContain('decision-luna-browser.spec.mjs', browser, 'mobile-chromium');
mustContain('decision-luna-browser.spec.mjs', browser, 'data-decision-screen="approved-theme-v1"');
mustContain('decision-luna-browser.spec.mjs', browser, 'data-luna-state="locked"');
mustContain('decision-luna-browser.spec.mjs', browser, 'data-luna-state="unlocked"');
mustContain('decision-luna-browser.spec.mjs', browser, 'panelOverflow');
mustContain('decision-luna-browser.spec.mjs', browser, 'toBeLessThanOrEqual(4)');
mustContain('Decision and Luna handoff', handoff, 'agent/decision-luna-approved-theme-v1');
mustContain('Decision and Luna handoff', handoff, 'Academy only');
mustContain('Source of Truth', sourceOfTruth, '`docs/FRAUD_ACADEMY_DECISION_LUNA_THEME_V1.md`');
mustContain('Source of Truth', sourceOfTruth, '`src/SubmitDecisionPanel.jsx` owns the approved Decision workspace');
mustContain('Source of Truth', sourceOfTruth, '`src/LunaPostSubmissionPanel.jsx` owns the approved locked and post-submission Luna states');
mustContain('Source of Truth', sourceOfTruth, 'The next isolated safe item is **final responsive/mobile polish only**');
mustContain('README', readme, 'The approved Decision and Luna handoff lives in');
mustContain('README', readme, 'The next isolated step is **final responsive/mobile polish only**');
mustContain('package.json', packageJson, 'decision-luna-theme-v1-smoke-check');
mustContain('build.yml', workflow, 'Decision and Luna approved-theme v1 smoke check');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'position: fixed',
  'SystemAccessLane',
  'caseStorage',
]) {
  mustNotContain('SubmitDecisionPanel.jsx', decision, forbidden);
  mustNotContain('LunaPostSubmissionPanel.jsx', luna, forbidden);
  mustNotContain('displayDecisionLunaThemeV1.css', styles, forbidden);
  mustNotContain('displayDecisionLunaLayoutSafetyV1.css', layoutSafety, forbidden);
}

for (const forbidden of [
  'Correct answer',
  'AI recommendation',
  'Red flag',
  'Green flag',
  'Fraudulent',
  'Legitimate',
]) {
  mustNotContain('SubmitDecisionPanel.jsx visible copy', decision, forbidden);
  mustNotContain('LunaPostSubmissionPanel.jsx visible copy', luna, forbidden);
}

if (failures.length) {
  console.error('Decision and Luna approved-theme v1 smoke check failed. Repair these focused Decision and Luna anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Decision and Luna approved-theme v1 smoke check passed. Evidence First locking, lane-organized learner choices, rationale readiness, case-scoped package saving, post-submission coaching, viewport-bound layout safety, existing persistence boundaries, and the synchronized final-polish-only handoff remain intact.');
