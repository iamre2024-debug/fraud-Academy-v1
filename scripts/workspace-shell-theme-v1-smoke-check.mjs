import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const header = fs.readFileSync(path.join(rootDir, 'src/VisualShellHeader.jsx'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, 'src/ActiveCaseWorkflowRail.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayWorkspaceShellThemeV1.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/workspace-shell-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_WORKSPACE_SHELL_THEME_V1.md'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Workspace shell v1 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Workspace shell v1 coupling: ${text}`);
}

for (const anchor of [
  'workspace-shell-heading',
  'workspace-shell-mark',
  'Investigation Workspace',
  'Fraud Academy OS',
  'Evidence First · Active case',
  'visual-header-controls',
  'visual-case-switcher',
]) {
  mustContain('VisualShellHeader.jsx', header, anchor);
}

for (const stage of [
  'Case Briefing',
  'Investigate',
  'Timeline',
  'Summary',
  'Indicators',
  'Determination',
  'Debrief',
]) {
  mustContain('ActiveCaseWorkflowRail.jsx', workflow, stage);
}

for (const anchor of [
  'body[data-visual-tab="workspace"]',
  '.workspace-shell-heading',
  '.visual-hero',
  '.visual-header-controls',
  '.visual-case-strip',
  '.active-case-workflow',
  '.active-case-workflow-list',
  '.visual-react-bottom-nav',
  '@media (max-width: 620px)',
  '@media (max-width: 380px)',
]) {
  mustContain('displayWorkspaceShellThemeV1.css', styles, anchor);
}

mustContain('main.jsx', entrypoint, "import './displayWorkspaceShellThemeV1.css';");
mustContain('workspace-shell-browser.spec.mjs', browser, 'approved Workspace shell is compact, functional, and responsive');
mustContain('workspace-shell-browser.spec.mjs', browser, '.workspace-shell-heading');
mustContain('Workspace shell handoff', handoff, 'agent/workspace-shell-approved-theme-v1');
mustContain('Workspace shell handoff', handoff, 'Case Briefing');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'position: fixed',
  'overflow-x: auto',
  'overflow-x: scroll',
  'SystemAccessLane',
]) {
  mustNotContain('displayWorkspaceShellThemeV1.css', styles, forbidden);
}

for (const forbidden of ['Fraudulent', 'Legitimate', 'Correct answer', 'AI recommendation', 'Red flag', 'Green flag']) {
  mustNotContain('VisualShellHeader.jsx visible copy', header, forbidden);
}

if (failures.length) {
  console.error('Workspace shell approved-theme v1 smoke check failed. Repair these focused shell anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Workspace shell approved-theme v1 smoke check passed. The compact header, active-case strip, workflow rail, responsive layout, navigation shell, Evidence First wording, and protected persistence boundaries remain intact.');
