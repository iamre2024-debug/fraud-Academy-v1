import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const workspaceActions = fs.readFileSync(path.join(rootDir, 'src/useVisualWorkspaceActions.js'), 'utf8');
const lunaPanel = fs.readFileSync(path.join(rootDir, 'src/LunaPostSubmissionPanel.jsx'), 'utf8');
const lunaApi = fs.readFileSync(path.join(rootDir, 'api/luna-debrief.js'), 'utf8');
const visualTextCollapse = fs.readFileSync(path.join(rootDir, 'src/VisualTextCollapse.jsx'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Luna anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} still contains duplicate or legacy Luna text: ${text}`);
}

mustNotContain('VisualWorkspace.jsx', workspace, '🌙 Luna Debrief');
mustNotContain('VisualWorkspace.jsx', workspace, 'className="ornate-card luna-visual-panel locked"');
mustNotContain('VisualWorkspace.jsx', workspace, "window.dispatchEvent(new CustomEvent('fraud-academy:package-saved'");
mustContain('useVisualWorkspaceActions.js', workspaceActions, "window.dispatchEvent(new CustomEvent('fraud-academy:package-saved'");
mustContain('useVisualWorkspaceActions.js', workspaceActions, "markReviewed('Submit Decision')");

for (const anchor of [
  'Luna Manager Debrief',
  'Post-decision review · Fraud manager',
  'data-luna-screen="approved-theme-v1"',
  "data-luna-state={locked ? 'locked' : 'unlocked'}",
  'Post-submission coaching stays locked',
  'Evidence First lock is active',
  'What your answer actually says',
  'What was actually happening',
  'Why the decision was right or wrong',
  "window.addEventListener('fraud-academy:package-saved'",
  "import DirectCollapsibleText from './DirectCollapsibleText.jsx';",
]) {
  mustContain('LunaPostSubmissionPanel.jsx', lunaPanel, anchor);
}

for (const anchor of [
  'fraud manager conducting a post-decision case review',
  'Do Not Support means the available evidence does not support the customer fraud claim',
  'Separate the quality of the investigator decision at the time from what became known later',
  'managerVerdict',
  'actualCaseOutcome',
  'managerExplanation',
]) {
  mustContain('api/luna-debrief.js', lunaApi, anchor);
}

const directWrapperCount = (lunaPanel.match(/<DirectCollapsibleText/g) ?? []).length;
if (directWrapperCount < 6) {
  failures.push(`LunaPostSubmissionPanel.jsx must render manager reasoning, outcome, and coaching lists through DirectCollapsibleText; found ${directWrapperCount}.`);
}

mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, '.luna-list-card p');

if (failures.length) {
  console.error('Luna fraud-manager smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Luna fraud-manager smoke check passed. Luna remains post-submission only, preserves deterministic truth, explains the investigator decision, reveals the actual scenario outcome, and provides manager coaching.');
