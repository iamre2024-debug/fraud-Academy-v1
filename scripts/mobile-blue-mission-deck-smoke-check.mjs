import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const styles = fs.readFileSync(path.join(root, 'src/mobileBlueMissionDeck.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
const navigation = fs.readFileSync(path.join(root, 'src/VisualNavigation.jsx'), 'utf8');
const workspace = fs.readFileSync(path.join(root, 'src/VisualWorkspace.jsx'), 'utf8');
const categories = fs.readFileSync(path.join(root, 'src/CategoryTileRail.jsx'), 'utf8');
const documents = fs.readFileSync(path.join(root, 'src/DocumentViewerWorkspace.jsx'), 'utf8');
const decision = fs.readFileSync(path.join(root, 'src/SubmitDecisionPanel.jsx'), 'utf8');
const shellHeader = fs.readFileSync(path.join(root, 'src/VisualShellHeader.jsx'), 'utf8');
const failures = [];

function requireAnchor(label, content, anchor) {
  if (!content.includes(anchor)) failures.push(`${label} is missing: ${anchor}`);
}

requireAnchor('main.jsx', entrypoint, "import './mobileBlueMissionDeck.css';");
if (entrypoint.includes("import './mobileNeonCardStack.css';")) failures.push('The retired Neon Card Stack must not load under Blue Mission Deck v2.');

for (const anchor of [
  'Blue Mission Deck v2',
  'mobile information-architecture layer',
  'body[data-layout-mode="mobile"]',
  '--mission-navy: #02152b',
  '--mission-cyan: #42ddff',
  'width: min(100%, 430px) !important',
  '.mission-deck-atmosphere',
  '.mission-route-dock',
  ':not([data-visual-tab="workspace"]) .mission-route-dock',
  '.dashboard-mission-stack',
  '.dashboard-lighthouse-art',
  '.dashboard-mission-drawers',
  '.visual-header-control-panel .header-setting-row',
  '.generated-case-controls',
  '.mobile-workspace-page-header',
  'Only one mobile mission page is present at a time.',
  '.mission-evidence-map',
  '.mission-map-node.node-transaction',
  '.visual-category-row',
  '.visual-category-row > button > em',
  '.investigation-category-copy',
  '.document-request-statuses',
  '.mission-document-progress',
  '.document-folder-nav',
  '.document-preview-workspace',
  '.document-toolbar-actions',
  '.mission-decision-progress',
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
  'dashboard-mission-drawers',
  'mission-route-dock',
  'data-mission-route={item.key}',
]) requireAnchor('VisualNavigation.jsx', navigation, anchor);

for (const anchor of [
  'data-active-tool={activeTool}',
  'mission-deck-frame',
  'mission-deck-atmosphere',
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

for (const anchor of [
  'mission-document-progress',
  'folderIcon',
  'buildCustomerResponseDocuments',
  'documentRequests = {}',
]) requireAnchor('DocumentViewerWorkspace.jsx', documents, anchor);

for (const anchor of [
  'mission-decision-progress',
  'Submit Decision',
  'latestPackage',
]) requireAnchor('SubmitDecisionPanel.jsx', decision, anchor);

for (const anchor of [
  'className="workspace-shell-mark"',
  'aria-label="Return to Dashboard"',
  "navigate('dashboard')",
]) requireAnchor('VisualShellHeader.jsx', shellHeader, anchor);

if (/body\s*\{/.test(styles)) failures.push('Blue Mission Deck contains an unscoped body rule that could alter desktop.');
if (/body\[data-layout-mode="desktop"\]/.test(styles)) failures.push('Blue Mission Deck changes desktop styling.');
if (/FA-(?:ATO|CB|CR)-\d+/i.test(styles)) failures.push('Blue Mission Deck contains case-specific styling instead of shared generated-case-safe selectors.');
if (/#ff4fd8|#d76bff|#ff9be9/i.test(styles)) failures.push('Blue Mission Deck still contains the retired pink/purple mobile palette.');

if (failures.length) {
  console.error('Mobile Blue Mission Deck smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mobile Blue Mission Deck v2 smoke check passed. Top-level pages, shared workspace routes, current cases, and generated cases use the structural mission deck instead of recolored legacy phone cards.');
