import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const styles = fs.readFileSync(path.join(rootDir, 'src/displayPhaseThree.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const rail = fs.readFileSync(path.join(rootDir, 'src/ActiveCaseWorkflowRail.jsx'), 'utf8');
const failures = [];

function mustContain(label, content, text) {
  if (!content.includes(text)) failures.push(`${label} is missing required Phase 3 anchor: ${text}`);
}

function mustNotContain(label, content, text) {
  if (content.includes(text)) failures.push(`${label} contains forbidden Phase 3 text: ${text}`);
}

mustContain('main.jsx', entrypoint, "import './displayPhaseThree.css';");
mustContain('displayPhaseThree.css', styles, '--fa-shadow-card:');
mustContain('displayPhaseThree.css', styles, '--fa-shadow-selected:');
mustContain('displayPhaseThree.css', styles, '--fa-focus-ring:');
mustContain('displayPhaseThree.css', styles, '.visual-category-row button.active');
mustContain('displayPhaseThree.css', styles, '.active-case-workflow-list button.active');
mustContain('displayPhaseThree.css', styles, 'button:disabled');
mustContain('displayPhaseThree.css', styles, "[aria-disabled='true']");
mustContain('displayPhaseThree.css', styles, 'button:focus-visible');
mustContain('displayPhaseThree.css', styles, '.active-case-workflow-list button.locked');
mustContain('displayPhaseThree.css', styles, '@media (prefers-reduced-motion: reduce)');

for (const forbidden of [
  'display: none',
  'visibility: hidden',
  'pointer-events: none',
  'position: fixed',
  'indexedDB',
  'generatedCaseRepository',
  'localStorage',
]) {
  mustNotContain('displayPhaseThree.css', styles, forbidden);
}

mustContain('VisualWorkspace.jsx', workspace, '<ActiveCaseWorkflowRail');
mustContain('ActiveCaseWorkflowRail.jsx', rail, 'aria-label="Active case workflow"');
mustNotContain('VisualWorkspace.jsx', workspace, 'displayPhaseThree');
mustNotContain('ActiveCaseWorkflowRail.jsx', rail, 'displayPhaseThree');

if (failures.length) {
  console.error('Display Phase 3 smoke check failed. Repair these hierarchy and state anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Display Phase 3 smoke check passed. Hierarchy, glow, selected, focus, locked, and disabled states are presentation-only and the verified workflow remains intact.');
