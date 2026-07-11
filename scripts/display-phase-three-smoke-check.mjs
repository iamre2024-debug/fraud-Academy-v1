import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const styles = fs.readFileSync(path.join(rootDir, 'src/displayPhaseThree.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const displayHandoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_DISPLAY_HANDOFF.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Phase 3 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Phase 3 scope: ${text}`);
}

for (const token of [
  '--visual-surface-shadow',
  '--visual-selected-shadow',
  '--visual-focus-ring',
  '--visual-info-border',
  '--visual-warning-border',
  '--visual-danger-border',
  '--visual-disabled-opacity',
]) {
  mustContain('displayPhaseThree.css', styles, token);
}

for (const selector of [
  '.summary-actions .primary-action',
  '.visual-section-heading button',
  '.nav-context-card',
  '.visual-bottom-nav button.active',
  '.active-case-workflow-list button.locked',
  'button[data-visual-tone="destructive"]',
  'button:disabled',
  ':focus-visible',
]) {
  mustContain('displayPhaseThree.css', styles, selector);
}

mustContain('displayPhaseThree.css', styles, 'font-size: clamp(2.2rem, 6vw, 4.6rem);');
mustContain('displayPhaseThree.css', styles, 'box-shadow: var(--visual-surface-shadow);');
mustContain('main.jsx', entrypoint, "import './displayPhaseThree.css';");
mustContain('package.json', packageJson, '"display-phase-three-smoke-check": "node scripts/display-phase-three-smoke-check.mjs"');
mustContain('package.json verify', packageJson, 'npm run display-phase-three-smoke-check');
mustContain('build workflow', workflow, 'Display Phase 3 hierarchy-and-glow smoke check');
mustContain('build workflow', workflow, 'run: npm run display-phase-three-smoke-check');
mustContain('Source of Truth', sourceOfTruth, '`src/displayPhaseThree.css`');
mustContain('Display Handoff', displayHandoff, 'Completed in the focused hierarchy-and-glow change:');
mustContain('README', readme, 'Display Phase 3 calibrates hierarchy and glow');

for (const forbidden of [
  '.activity-row',
  'grid-template-columns',
  'overflow-x',
  'generatedCaseRepository',
  'indexedDB',
  'SystemAccessLane',
]) {
  mustNotContain('displayPhaseThree.css', styles, forbidden);
}

if (failures.length) {
  console.error('Display Phase 3 smoke check failed. Repair these hierarchy-and-glow anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Display Phase 3 smoke check passed. Decorative glow is calibrated, interaction states are formalized, keyboard focus remains visible, and mobile record presentation and persistence architecture stay outside this phase.');
