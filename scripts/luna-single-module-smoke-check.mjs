import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const lunaPanel = fs.readFileSync(path.join(rootDir, 'src/LunaPostSubmissionPanel.jsx'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Luna anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} still contains duplicate Luna workspace text: ${text}`);
}

mustNotContain('VisualWorkspace.jsx', workspace, '🌙 Luna Debrief');
mustNotContain('VisualWorkspace.jsx', workspace, 'className="ornate-card luna-visual-panel locked"');
mustContain('VisualWorkspace.jsx', workspace, "window.dispatchEvent(new CustomEvent('fraud-academy:package-saved'");

mustContain('LunaPostSubmissionPanel.jsx', lunaPanel, 'Luna Post-Submission Debrief');
mustContain('LunaPostSubmissionPanel.jsx', lunaPanel, 'Post-submission coaching stays locked');
mustContain('LunaPostSubmissionPanel.jsx', lunaPanel, 'Decision-quality breakdown');
mustContain('LunaPostSubmissionPanel.jsx', lunaPanel, "window.addEventListener('fraud-academy:package-saved'");

if (failures.length) {
  console.error('Luna single-module smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Luna single-module smoke check passed. VisualWorkspace no longer renders duplicate Luna UI, and the post-submission Luna module listens for saved packages.');
