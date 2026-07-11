import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const decision = fs.readFileSync(path.join(rootDir, 'src/SubmitDecisionPanel.jsx'), 'utf8');
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
  'Luna debrief stays locked until this case has a saved learner package.',
  'Package readiness',
  'packageStatus.messages.map',
  'Rationale progress',
  'decisionCallGroups.map',
  'Learner decision choice',
  'Learner confidence',
  'Learner rationale',
  'Save learner package',
  'Check package readiness',
  'Submission confirmation',
  'Luna debrief unlocked',
]) {
  mustContain('SubmitDecisionPanel.jsx', decision, anchor);
}

for (const anchor of [
  'luna-theme-v1',
  'data-luna-screen="approved-theme-v1"',
  "data-luna-state={locked ? 'locked' : 'unlocked'}",
  'Evidence First lock is active',
  'Finish and save your own reasoning before Luna reviews the case.',
  'No score, strengths, evidence coaching, or decision-quality feedback appears before submission.',
  'Your submitted determination',
  'How Luna read the package',
  'What your package did well',
  'Next coaching focus',
  'Decision-quality breakdown',
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
  'if (!status.ready)',
  'const reviewPackage = buildReviewPackage({',
  "window.dispatchEvent(new CustomEvent('fraud-academy:package-saved'",
  "markReviewed('Submit Decision')",
]) {
  mustContain('useVisualWorkspaceActions.js', actions, anchor);
}

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
  'export function getReviewPackageStatus',
  'export function buildReviewPackage',
  'Review package checklist is complete. Evidence First unlocks Luna only after saving this package.',
]) {
  mustContain('reviewPackage.js', reviewPackage, anchor);
}

for (const anchor of [
  'export function buildLunaDebrief',
  'if (!reviewPackage) return null',
  'scoreLabel:',
  'strengths:',
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
  '.luna-v1-unlock-grid',
  '.luna-v1-debrief-grid',
  'position: static !important',
  'grid-template-columns: minmax(0, 0.95fr) minmax(340px, 1.05fr)',
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
mustContain('decision-luna-browser.spec.mjs', browser, 'approved Decision and Luna preserve Evidence First, package submission, debrief routes, and responsive safety');
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
mustContain('Source of Truth', sourceOfTruth, 'The next isolated safe item is **Academy only**');
mustContain('README', readme, 'The approved Decision and Luna handoff lives in');
mustContain('README', readme, 'The next isolated screen is **Academy only**');
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

console.log('Decision and Luna approved-theme v1 smoke check passed. Evidence First locking, lane-organized learner choices, rationale readiness, case-scoped package saving, post-submission coaching, viewport-bound layout safety, existing persistence boundaries, and the synchronized Academy-only handoff remain intact.');
