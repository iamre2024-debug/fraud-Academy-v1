import fs from 'node:fs';
import path from 'node:path';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import {
  getDecisionCallGroups,
  getFinalFindingChoices,
  getReviewPackageStatus,
} from '../src/data/reviewPackage.js';
import { buildLunaDebrief } from '../src/data/lunaDebrief.js';

const rootDir = process.cwd();
const read = (file) => fs.readFileSync(path.join(rootDir, file), 'utf8');
const decision = read('src/SubmitDecisionPanel.jsx');
const luna = read('src/LunaPostSubmissionPanel.jsx');
const visuals = read('src/DecisionReviewVisuals.jsx');
const debriefSource = read('src/data/lunaDebrief.js');
const styles = read('src/displayDecisionLunaThemeV1.css');
const layoutSafety = read('src/displayDecisionLunaLayoutSafetyV1.css');
const entrypoint = read('src/main.jsx');
const browser = read('tests/decision-luna-browser.spec.mjs');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required review-screen anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} still contains removed legacy review UI: ${text}`);
}

for (const anchor of [
  'decision-final-review',
  'data-decision-screen="approved-theme-v1"',
  'data-decision-layout="reference-final-review"',
  'data-customer-type={activeCase.customerType}',
  'decision-case-card',
  '<LighthouseMedallion',
  'Selected Decision',
  'decision-editor',
  'getDecisionCallGroups(activeCase)',
  'getFinalFindingChoices(activeCase)',
  'getReviewDisplaySnapshot',
  'reviewPackage: latestPackage',
  'displaySnapshot.reviewedRequired',
  'displaySnapshot.pinnedEvidence',
  'displaySnapshot.noteSnapshot',
  'displayDecision.operationalDecision',
  'selectionGroups.map',
  'Operational decision',
  'Final finding',
  'Nothing is selected for you.',
  'Learner confidence',
  'Finding basis',
  'Pinned Evidence',
  'View all evidence',
  'Open notes',
  'Confirm &amp; Submit Decision',
  'Open Luna Debrief',
  'const reviewPackage = submitDecision(event)',
]) mustContain('SubmitDecisionPanel.jsx', decision, anchor);

for (const removed of [
  '<DecisionFlagChecklist',
  'decision-v1-workspace',
  'decision-status-grid',
  'Submission confirmation',
  'Decision readiness',
]) mustNotContain('SubmitDecisionPanel.jsx', decision, removed);

for (const anchor of [
  'luna-reference-debrief',
  'data-luna-screen="approved-theme-v1"',
  'data-luna-layout="reference-debrief"',
  "data-luna-state={locked ? 'locked' : 'unlocked'}",
  '<LunaMascot',
  'Evidence First lock is active',
  'What You Did Well',
  'Evidence You Might Have Missed',
  'Risk Tip from Luna',
  "Luna&apos;s Motivation",
  'Back to Workspace',
  'navigator.share',
  'navigator.clipboard?.writeText',
  "window.addEventListener('fraud-academy:package-saved'",
]) mustContain('LunaPostSubmissionPanel.jsx', luna, anchor);

for (const removed of [
  'luna-v1-score-banner',
  'luna-v1-debrief-grid',
  'Decision-quality breakdown',
  'What you submitted',
  'Finish and Return to Queue',
]) mustNotContain('LunaPostSubmissionPanel.jsx', luna, removed);

for (const anchor of [
  'export function LunaMascot',
  'export function LighthouseMedallion',
  'export function ReviewGlyph',
  '<svg',
  'luna-mascot-stars',
]) mustContain('DecisionReviewVisuals.jsx', visuals, anchor);

for (const anchor of [
  "'personal-account-takeover'",
  "'business-account-takeover'",
  "'business-payment-instruction-change-alert'",
  "'payroll-change-alert'",
  "'payroll-account-takeover'",
  "'credit-application-review'",
  'riskTip:',
  'missedEvidence',
  "activeCase.customerType === 'business'",
]) mustContain('lunaDebrief.js', debriefSource, anchor);

for (const anchor of [
  '.decision-final-review',
  '.decision-case-card',
  '.decision-selected-card',
  '.decision-editor',
  '.decision-evidence-strip',
  '.decision-confirm-button',
  '.luna-reference-debrief',
  '.luna-welcome',
  '.luna-speech-card',
  '.luna-feedback-card',
  '.luna-missed-list',
  '.luna-risk-tip',
  '.luna-motivation',
  '.luna-reference-actions',
  '.mission-review-bar',
  '@media (max-width: 760px)',
  '@media (max-width: 440px)',
  '@media (prefers-reduced-motion: reduce)',
]) mustContain('displayDecisionLunaThemeV1.css', styles, anchor);

for (const anchor of [
  '[data-workflow-stage="determination"]',
  '.luna-post-submission-host',
  'width: 100%',
  'max-width: 100%',
  'overflow-wrap: anywhere',
]) mustContain('displayDecisionLunaLayoutSafetyV1.css', layoutSafety, anchor);

for (const forbidden of ['position: fixed', 'position: static !important', 'width: 100% !important']) {
  mustNotContain('displayDecisionLunaThemeV1.css', styles, forbidden);
}

mustContain('main.jsx', entrypoint, "import './displayDecisionLunaThemeV1.css';");
mustContain('main.jsx', entrypoint, "import './displayDecisionLunaLayoutSafetyV1.css';");
mustContain('decision-luna-browser.spec.mjs', browser, 'personal and business decision reviews use the reference screens');
mustContain('decision-luna-browser.spec.mjs', browser, 'data-decision-layout="reference-final-review"');
mustContain('decision-luna-browser.spec.mjs', browser, 'data-luna-layout="reference-debrief"');
mustContain('decision-luna-browser.spec.mjs', browser, 'panelOverflow');

for (const config of [
  {
    index: 78001,
    customerType: 'personal',
    productType: 'deposit-account',
    workflowType: 'personal-account-takeover',
  },
  {
    index: 78002,
    customerType: 'business',
    productType: 'payroll-product',
    workflowType: 'payroll-change-alert',
  },
]) {
  const activeCase = createGeneratedCase({
    ...config,
    difficulty: 'standard',
    evidenceDepth: 'standard',
  });
  const operationalDecision = getDecisionCallGroups(activeCase)
    .flatMap((group) => group.options)
    .find((choice) => choice !== 'Deny');
  const finalFinding = getFinalFindingChoices(activeCase)
    .find((finding) => finding === 'Inconclusive')
    ?? getFinalFindingChoices(activeCase)[0];
  const draft = {
    operationalDecision,
    finalFinding,
    confidence: 'High',
    findingBasis: '',
  };
  const status = getReviewPackageStatus({
    activeCase,
    completedTools: [],
    tray: [],
    notes: [],
    draft,
  });
  if (!status.ready) {
    failures.push(`${config.customerType} review choices did not produce a valid submission package: ${status.blockers.join('; ')}`);
    continue;
  }
  const reviewPackage = {
    id: `${activeCase.id}-REFERENCE-SMOKE`,
    caseId: activeCase.id,
    ...config,
    ...draft,
    completedTools: [],
    pinnedEvidence: [],
    noteSnapshot: [],
    decisionIndicators: [],
  };
  const debrief = buildLunaDebrief({ activeCase, reviewPackage });
  if (!debrief?.riskTip || !debrief?.motivation || !Array.isArray(debrief.missedEvidence)) {
    failures.push(`${config.customerType} review package did not produce the reference Luna coaching model.`);
  }
  if (config.customerType === 'business' && !/business|payroll/i.test(`${debrief?.riskTip} ${debrief?.motivation}`)) {
    failures.push('Business Luna coaching is not grounded in the business/payroll workflow.');
  }
}

if (buildLunaDebrief({
  activeCase: createGeneratedCase({
    index: 78003,
    customerType: 'personal',
    productType: 'credit-card',
    workflowType: 'unauthorized-card-transaction-claim',
  }),
  reviewPackage: null,
}) !== null) {
  failures.push('Luna produced coaching without a submitted review package.');
}

if (failures.length) {
  console.error('Decision and Luna reference-screen smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Decision and Luna reference-screen smoke check passed for personal and business cases, separate operational/final choices, Evidence First locking, coded artwork, case-scoped coaching, responsive containment, and working review actions.');
