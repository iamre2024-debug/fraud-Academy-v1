import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/VisualApp.jsx');
const entrypoint = read('src/main.jsx');
const shell = read('src/MobileMissionDeckApp.jsx');
const workspace = read('src/MobileMissionWorkspace.jsx');
const briefing = read('src/MobileMissionCaseBriefing.jsx');
const styles = read('src/mobileMissionDeckV3.css');
const legacyStyles = read('src/mobileBlueMissionDeck.css');
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
]) requireAnchor('MobileMissionWorkspace.jsx', workspace, anchor);

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
if (styles.length >= legacyStyles.length * 1.4) failures.push('Mission Deck v3 has grown into another oversized legacy override layer.');

if (failures.length) {
  console.error('Mobile Blue Mission Deck structural smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mobile Blue Mission Deck v3 smoke check passed. Phones mount a dedicated page tree; desktop and shared case logic remain separate.');
