import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pages = read('src/MobileCaseReviewPages.jsx');
const reviewPackage = read('src/data/reviewPackage.js');
const styles = read('src/mobileCaseReviewPages.css');
const workspace = read('src/MobileMissionWorkspace.jsx');
const controller = read('src/VisualWorkspace.jsx');
const entrypoint = read('src/main.jsx');
const browser = read('tests/mobile-case-review-browser.spec.mjs');
const playwrightConfig = read('playwright.config.mjs');
const failures = [];

function requireAnchor(label, content, anchor) {
  if (!content.includes(anchor)) failures.push(`${label} is missing: ${anchor}`);
}

for (const anchor of [
  'export function MobileCaseIndicatorsReview',
  'export function MobileDeterminationPage',
  'Case Indicators Review',
  'Indicator Checklist',
  'Claim Type Cues',
  'Evidence Notes',
  'Record or proof',
  'Your explanation',
  'Continue to Determination',
  'Evidence Summary',
  'Operational Decision',
  'Investigation Finding',
  'Decision Support',
  'Next Steps',
  'getDecisionCallGroups(activeCase)',
  'getFinalFindingChoices(activeCase)',
  "updateDecisionIndicator(item.id, 'selected'",
  "updateDecision('operationalDecision'",
  "updateDecision('finalFinding'",
  "updateDecision('confidence'",
  "updateDecision('findingBasis'",
  'aria-label="Finding basis"',
  'openSubmit',
  'Continue to Submit Decision',
  'disabled={!isLocked && !packageStatus.ready}',
  'This submitted decision is locked.',
  'Nothing is saved until you confirm on the next screen.',
  'No customer notification or real account action is sent.',
  'getReviewDisplaySnapshot',
  'reviewPackage: latestPackage',
  'displaySnapshot.pinnedEvidence.length',
  'displayDecision.operationalDecision',
]) requireAnchor('MobileCaseReviewPages.jsx', pages, anchor);

for (const anchor of [
  "import {",
  'MobileCaseIndicatorsReview',
  'MobileDeterminationPage',
  "workspaceScreen === 'indicators'",
  "workspaceScreen === 'submit'",
  '<MobileCaseIndicatorsReview',
  '<MobileDeterminationPage',
  'locked={reviewPackages.length > 0}',
  'latestPackage={reviewPackages[0] ?? null}',
  '<SubmitDecisionPanel',
  "openPinnedPage={() => showWorkspaceScreen('evidence')}",
  "openNotesPage={() => showWorkspaceScreen('notes')}",
  "openIndicators={() => showWorkspaceScreen('indicators')}",
  "openSubmit={() => showWorkspaceScreen('submit')}",
  'submitDecision={submitDecision}',
]) requireAnchor('MobileMissionWorkspace.jsx', workspace, anchor);

requireAnchor('reviewPackage.js', reviewPackage, 'export function getReviewDisplaySnapshot');

for (const anchor of [
  "screen === 'indicators'",
  "screen === 'determination' || screen === 'submit'",
  "showWorkspaceScreen(isMobileLayout() ? 'indicators' : 'evidence')",
  "indicators: 'Case Indicators Review'",
  "determination: 'Determination'",
  "submit: 'Submit Decision'",
]) requireAnchor('VisualWorkspace.jsx', controller, anchor);

for (const anchor of [
  'Case Indicators Review + Determination mobile reference rebuild',
  '.mobile-case-review-page',
  '.mobile-indicator-list',
  '.mobile-cue-grid',
  '.mobile-evidence-notes',
  '.mobile-evidence-summary',
  '.mobile-choice-grid',
  '.mobile-next-steps',
  '@media (max-width: 350px)',
]) requireAnchor('mobileCaseReviewPages.css', styles, anchor);

requireAnchor('main.jsx', entrypoint, "import './mobileCaseReviewPages.css';");
requireAnchor('playwright.config.mjs', playwrightConfig, 'mobile-case-review-browser');

for (const anchor of [
  'data-workspace-screen\', \'indicators',
  'Select indicator:',
  'LOG-1005',
  'More Information Needed',
  'Inconclusive',
  'fraud-academy-review-packages-v1',
  'decisionIndicators',
  'data-luna-state="unlocked"',
]) requireAnchor('mobile-case-review-browser.spec.mjs', browser, anchor);

if (/High Risk|Low Risk|risk score|AI recommendation|caseTruth|correctDetermination|accepted determination/i.test(pages)) {
  failures.push('Mobile case-review pages contain answer-bearing mockup wording.');
}
if (/\bsubmitDecision\s*\(/.test(pages)) {
  failures.push('Mobile Determination must hand off to the separate Submit Decision screen instead of saving directly.');
}
if (/KYB Review|Customer Profile|Merchant Profile|System Access Lane/i.test(pages)) {
  failures.push('Mobile case-review pages restore a retired standalone surface.');
}
if (/body\[data-layout-mode="desktop"\]/.test(styles)) {
  failures.push('Mobile case-review styles must not alter the desktop layout.');
}
if (/!important/.test(styles)) {
  failures.push('Mobile case-review styles must remain structurally scoped without important overrides.');
}
const undersizedRemValues = [...styles.matchAll(/font-size:\s*(0\.\d+)rem/g)]
  .map((match) => Number(match[1]))
  .filter((value) => value < 0.75);
if (undersizedRemValues.length) {
  failures.push(`Mobile case-review styles contain ${undersizedRemValues.length} rem font sizes below the 12px floor.`);
}
if (!/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(styles)) {
  failures.push('Determination options must keep the two-column reference card layout on standard phone widths.');
}
if (!/\.mobile-choice-grid\s*\{[^}]*grid-template-columns:\s*1fr/s.test(styles)) {
  failures.push('Determination options must collapse safely on narrow phone widths.');
}

if (failures.length) {
  console.error('Mobile case-review structural smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mobile case-review smoke check passed. Manual indicators feed a separate Determination and final Submit Decision flow without restoring retired or answer-bearing surfaces.');
