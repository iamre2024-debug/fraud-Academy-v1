import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const styles = fs.readFileSync(path.join(root, 'src/mobileNeonCardStack.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
const failures = [];

function requireAnchor(label, content, anchor) {
  if (!content.includes(anchor)) failures.push(`${label} is missing: ${anchor}`);
}

requireAnchor('main.jsx', entrypoint, "import './mobileNeonCardStack.css';");

for (const anchor of [
  'body[data-layout-mode="mobile"]',
  '--neon-canvas: #07060d',
  '.visual-react-bottom-nav',
  '.dashboard-quick-grid',
  'grid-auto-flow: column',
  'scroll-snap-type: inline mandatory',
  '.visual-category-row',
  '.case-queue-layout',
  '.mobile-workspace-page-header',
  '.case-summary-visual',
  '.customer-360-header',
  '.document-request-inbox[data-mobile-pane="inbox"]',
  '.document-viewer-layout[data-mobile-pane="reader"]',
  '.decision-v1-workspace',
  '.luna-v1-debrief-grid',
  '@media (max-width: 370px)',
  'word-break: normal !important',
]) requireAnchor('mobileNeonCardStack.css', styles, anchor);

if (/body\s*\{/.test(styles)) failures.push('Neon Card Stack contains an unscoped body rule that could alter desktop.');
if (/body\[data-layout-mode="desktop"\]/.test(styles)) failures.push('Neon Card Stack changes the desktop theme.');

if (failures.length) {
  console.error('Mobile Neon Card Stack smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mobile Neon Card Stack smoke check passed. The approved card-stack system is mobile-scoped across every app stage.');
