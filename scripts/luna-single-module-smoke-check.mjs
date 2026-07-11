import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const workspaceActions = fs.readFileSync(path.join(rootDir, 'src/useVisualWorkspaceActions.js'), 'utf8');
const lunaPanel = fs.readFileSync(path.join(rootDir, 'src/LunaPostSubmissionPanel.jsx'), 'utf8');
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

mustContain('LunaPostSubmissionPanel.jsx', lunaPanel, 'Luna Case Debrief');
mustContain('LunaPostSubmissionPanel.jsx', lunaPanel, 'Post-submission coaching stays protected');
mustContain('LunaPostSubmissionPanel.jsx', lunaPanel, 'Evidence First lock is active');
mustContain('LunaPostSubmissionPanel.jsx', lunaPanel, 'Your submitted determination');
mustContain('LunaPostSubmissionPanel.jsx', lunaPanel, 'Decision-quality breakdown');
mustContain('LunaPostSubmissionPanel.jsx', lunaPanel, "window.addEventListener('fraud-academy:package-saved'");
mustContain('LunaPostSubmissionPanel.jsx', lunaPanel, "import DirectCollapsibleText from './DirectCollapsibleText.jsx';");

const directWrapperCount = (lunaPanel.match(/<DirectCollapsibleText/g) ?? []).length;
if (directWrapperCount < 4) {
  failures.push('LunaPostSubmissionPanel.jsx must render learner reasoning and both coaching lists through DirectCollapsibleText.');
}

mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, '.luna-list-card p');

if (failures.length) {
  console.error('Luna single-module smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Luna single-module smoke check passed. Luna remains one case-scoped post-submission module, listens for controller-saved packages, preserves Evidence First locking, and owns direct compact-text controls without legacy selector scanning.');
