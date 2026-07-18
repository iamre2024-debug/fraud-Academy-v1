import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const hook = fs.readFileSync(path.join(rootDir, 'src/useVisualWorkspaceCaseState.js'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required workspace state anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} still contains retired inline workspace persistence: ${text}`);
}

mustContain('VisualWorkspace.jsx', workspace, "import useVisualWorkspaceCaseState from './useVisualWorkspaceCaseState.js';");
mustContain('VisualWorkspace.jsx', workspace, '} = useVisualWorkspaceCaseState(activeCase);');
mustNotContain('VisualWorkspace.jsx', workspace, 'readStorage(');
mustNotContain('VisualWorkspace.jsx', workspace, 'writeStorage(');
mustNotContain('VisualWorkspace.jsx', workspace, 'storageKeys.');

mustContain('useVisualWorkspaceCaseState.js', hook, "import { useEffect, useState } from 'react';");
mustContain('useVisualWorkspaceCaseState.js', hook, 'tray: trayByCase[caseId] ?? []');
mustContain('useVisualWorkspaceCaseState.js', hook, "currentCompleted: completedByCase[caseId] ?? ['Case Summary']");
mustContain('useVisualWorkspaceCaseState.js', hook, 'decisionDraft: decisionByCase[caseId] ?? defaultDecisionDraft');
mustContain('useVisualWorkspaceCaseState.js', hook, 'reviewPackages: packagesByCase[caseId] ?? []');

for (const key of ['tray', 'notes', 'completed', 'decisions', 'packages']) {
  mustContain('useVisualWorkspaceCaseState.js', hook, `storageKeys.${key}`);
}

if (failures.length) {
  console.error('Workspace case-state hook smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Workspace case-state hook smoke check passed. Case-scoped persistence is isolated from VisualWorkspace rendering and action orchestration.');
