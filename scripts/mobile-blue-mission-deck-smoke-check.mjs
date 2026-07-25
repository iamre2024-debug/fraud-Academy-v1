import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/VisualApp.jsx');
const entrypoint = read('src/main.jsx');
const shell = read('src/MobileMissionDeckApp.jsx');
const workspace = read('src/MobileMissionWorkspace.jsx');
const workspaceController = read('src/VisualWorkspace.jsx');
const briefing = read('src/MobileMissionCaseBriefing.jsx');
const styles = read('src/mobileMissionDeckV3.css');
const legacyStyles = read('src/mobileBlueMissionDeck.css');
const playwrightConfig = read('playwright.config.mjs');
const failures = [];

function requireAnchor(label, content, anchor) {
  if (!content.includes(anchor)) failures.push(`${label} is missing: ${anchor}`);
}

for (const anchor of [
  "import './mobileMissionDeckV3.css';",
]) requireAnchor('main.jsx', entrypoint, anchor);

if (entrypoint.includes("import './mobileBlueMissionDeck.css';")) failures.push('The legacy Blue Mission Deck override file must not load.');
if (entrypoint.includes("import './mobileNeonCardStack.css';")) failures.push('The retired Neon Card Stack must not load.');

for (const anchor of [
  'useResponsiveLayoutMode',
  "layoutController.resolvedLayout === 'mobile'",
  '<MobileMissionDeckApp',
  'layoutMode="mobile"',
  'quickGenerator={<GeneratedCaseControls inline',
]) requireAnchor('VisualApp.jsx', app, anchor);

for (const anchor of [
  'mission-mobile-root',
  'mission-mobile-dock',
  'mission-case-deck',
  'mission-active-file',
  'MissionLighthouse',
  'CasesThemeV1Panel',
  'inline',
  'AcademyThemeV1Panel',
  'ProfileThemeV1Panel',
  'mission-mobile-workspace-page',
]) requireAnchor('MobileMissionDeckApp.jsx', shell, anchor);

for (const anchor of [
  'mission-workspace-v3',
  'mission-workspace-surface',
  '<MobileMissionCaseBriefing',
  '<MissionPath',
  '<CategoryTileRail',
  '<Customer360Panel',
  '<InvestigationToolPanel',
  'mission-document-request-page',
  'MissionDocumentRequestHeading',
  'mission-login-history-page',
  'MissionLoginHistoryHeading',
  '<BottomInvestigationGrid',
  '<SubmitDecisionPanel',
  'decision-luna-portal-anchor',
  'Source record unavailable',
  'data-document-request-step',
  'disabled={stageStatus[key]?.state === \'locked\'}',
]) requireAnchor('MobileMissionWorkspace.jsx', workspace, anchor);

for (const anchor of [
  'currentWorkspaceSnapshot',
  'forceHistory',
  'removeUnavailablePinnedEvidence',
  "nextStage === 'debrief' && !hasReviewPackage",
]) requireAnchor('VisualWorkspace.jsx', workspaceController, anchor);

for (const anchor of [
  'mission-briefing-file',
  'mission-briefing-tabs',
  'Statement & facts',
  'Paperwork deck',
  'Investigation launchpad',
  "activeCase.availableTools",
]) requireAnchor('MobileMissionCaseBriefing.jsx', briefing, anchor);

for (const anchor of [
  'A dedicated mobile component system',
  '.mission-mobile-root',
  '.mission-mobile-dock',
  '.mission-case-deck',
  '.mission-briefing-file',
  '.mission-evidence-page .mission-evidence-map',
  '.mission-document-request-heading',
  '.mission-document-request-page .mission-tool-content .document-request-inbox',
  '.mission-login-history-heading',
  '.mission-login-history-page .login-history-workspace',
  '.mission-tool-content .document-preview-workspace',
  '.mission-decision-page .mission-decision-progress',
  '@media (max-width: 370px)',
]) requireAnchor('mobileMissionDeckV3.css', styles, anchor);

const importantCount = (styles.match(/!important/g) ?? []).length;
if (importantCount > 12) failures.push(`Mission Deck v3 has ${importantCount} !important overrides; it must remain structurally scoped.`);
if (/body\[data-layout-mode="desktop"\]/.test(styles)) failures.push('Mission Deck v3 must not alter the desktop layout.');
if (/#ff4fd8|#d76bff|#ff9be9/i.test(styles)) failures.push('Mission Deck v3 contains the retired pink/purple palette.');
if (/width:\s*min\(100%,\s*430px\)/.test(styles)) failures.push('Mission Deck v3 must fill the phone viewport instead of using the retired 430px shell cap.');
if (!styles.includes('--md-shell-width: 94vw;')) failures.push('Mission Deck v3 must preserve a proportional phone shell across browser zoom levels.');
if (/calc\(50vw\s*-\s*(?:205|209)px\)/.test(styles)) failures.push('Mission Deck v3 must not position controls against the retired 430px shell.');
if (!/\.mission-evidence-page .*\.visual-category-row\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s.test(styles)) {
  failures.push('Mission evidence category cards must use two readable mobile columns.');
}
if (!/\.mission-mobile-dock\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/s.test(styles)) {
  failures.push('Mission Deck v3 must keep primary navigation in a five-column bottom dock.');
}
if (styles.length >= legacyStyles.length * 1.4) failures.push('Mission Deck v3 has grown into another oversized legacy override layer.');
const undersizedMobileRemValues = [...styles.matchAll(/font-size:\s*(0\.\d+)rem/g)]
  .map((match) => Number(match[1]))
  .filter((value) => value < 0.75);
if (undersizedMobileRemValues.length) {
  failures.push(`Mission Deck v3 contains ${undersizedMobileRemValues.length} rem font sizes below the 12px mobile floor.`);
}

for (const browserSpec of [
  'mobile-workspace-pages-browser',
  'document-request-browser',
  'decision-luna-browser',
  'final-responsive-browser',
]) requireAnchor('playwright.config.mjs mobile project', playwrightConfig, browserSpec);

if (failures.length) {
  console.error('Mobile Blue Mission Deck structural smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mobile Blue Mission Deck v3 smoke check passed. Phones mount a dedicated page tree; desktop and shared case logic remain separate.');
