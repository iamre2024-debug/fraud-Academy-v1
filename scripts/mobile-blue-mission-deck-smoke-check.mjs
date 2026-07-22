import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const styles = fs.readFileSync(path.join(root, 'src/mobileBlueMissionDeck.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
const navigation = fs.readFileSync(path.join(root, 'src/VisualNavigation.jsx'), 'utf8');
const workspace = fs.readFileSync(path.join(root, 'src/VisualWorkspace.jsx'), 'utf8');
const categories = fs.readFileSync(path.join(root, 'src/CategoryTileRail.jsx'), 'utf8');
const failures = [];

function requireAnchor(label, content, anchor) {
  if (!content.includes(anchor)) failures.push(`${label} is missing: ${anchor}`);
}

requireAnchor('main.jsx', entrypoint, "import './mobileBlueMissionDeck.css';");
if (entrypoint.indexOf("import './mobileBlueMissionDeck.css';") < entrypoint.indexOf("import './mobileNeonCardStack.css';")) {
  failures.push('Blue Mission Deck must load after the retired Neon Card Stack override.');
}

for (const anchor of [
  'body[data-layout-mode="mobile"]',
  '--mission-navy: #031225',
  '--mission-cyan: #3ad8ff',
  'width: min(100%, 460px) !important',
  '.dashboard-mission-stack',
  '.dashboard-lighthouse-art',
  '.visual-react-bottom-nav',
  '.visual-header-control-panel .header-setting-row',
  ':not([data-visual-tab="workspace"])',
  '.generated-case-controls',
  '.mobile-workspace-page-header',
  '.mission-evidence-map',
  '.mission-map-node.node-transaction',
  '.visual-category-row',
  '.visual-category-row > button > em',
  '.investigation-category-copy',
  '.document-request-statuses',
  '.document-preview-workspace',
  '.document-toolbar-actions',
  '.decision-v1-workspace',
  '.luna-v1-header::before',
  '@media (max-width: 370px)',
  'word-break: normal !important',
]) requireAnchor('mobileBlueMissionDeck.css', styles, anchor);

for (const anchor of [
  'dashboard-mission-header',
  'dashboard-mission-stack',
  'dashboard-stack-case',
  'dashboard-lighthouse-art',
  'dashboard-investigation-ribbon',
]) requireAnchor('VisualNavigation.jsx', navigation, anchor);

for (const anchor of [
  'data-active-tool={activeTool}',
  'mobile-mission-case-picker',
  'aria-label="Choose active mission case"',
]) requireAnchor('VisualWorkspace.jsx', workspace, anchor);

for (const anchor of [
  'mission-evidence-map',
  'node-customer',
  'node-device',
  'node-context',
  'node-transaction',
  'mission-map-pin',
]) requireAnchor('CategoryTileRail.jsx', categories, anchor);

if (/body\s*\{/.test(styles)) failures.push('Blue Mission Deck contains an unscoped body rule that could alter desktop.');
if (/body\[data-layout-mode="desktop"\]/.test(styles)) failures.push('Blue Mission Deck changes desktop styling.');

if (failures.length) {
  console.error('Mobile Blue Mission Deck smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mobile Blue Mission Deck smoke check passed. The shared mobile shell, case deck, evidence map, paperwork reader, decision, and Luna screens use the blue mission system.');
