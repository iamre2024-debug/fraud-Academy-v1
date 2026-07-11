import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const hook = fs.readFileSync(path.join(rootDir, 'src/useVisualWorkspaceActions.js'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required workspace action anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} still contains retired inline workspace action orchestration: ${text}`);
}

mustContain('VisualWorkspace.jsx', workspace, "import useVisualWorkspaceActions from './useVisualWorkspaceActions.js';");
mustContain('VisualWorkspace.jsx', workspace, '} = useVisualWorkspaceActions({');
mustContain('VisualWorkspace.jsx', workspace, 'packageStatus={packageStatus}');
mustContain('VisualWorkspace.jsx', workspace, 'submitDecision={submitDecision}');

for (const retiredInlineAction of [
  'function pin(',
  'function saveNote(',
  'function markReviewed(',
  'function saveCaseReportPacket(',
  'function updateDecision(',
  'function submitNote(',
  'function submitDecision(',
  'buildReviewPackage({',
  'buildPacket(',
]) {
  mustNotContain('VisualWorkspace.jsx', workspace, retiredInlineAction);
}

mustContain('useVisualWorkspaceActions.js', hook, "import { buildReviewPackage, getReviewPackageStatus } from './data/reviewPackage.js';");
mustContain('useVisualWorkspaceActions.js', hook, 'const packageStatus = getReviewPackageStatus({');
mustContain('useVisualWorkspaceActions.js', hook, 'const packet = buildPacket(row, tool, activeCase);');
mustContain('useVisualWorkspaceActions.js', hook, "const caseTools = current[activeCase.id] ?? ['Case Summary'];");
mustContain('useVisualWorkspaceActions.js', hook, "saveNote(`${toolName}: reviewed and neutral report generated.`, 'Tool review');");
mustContain('useVisualWorkspaceActions.js', hook, 'if (!status.ready) {');
mustContain('useVisualWorkspaceActions.js', hook, 'const reviewPackage = buildReviewPackage({');
mustContain('useVisualWorkspaceActions.js', hook, "window.dispatchEvent(new CustomEvent('fraud-academy:package-saved'");
mustContain('useVisualWorkspaceActions.js', hook, "markReviewed('Submit Decision');");
mustContain('useVisualWorkspaceActions.js', hook, 'packageStatus,');

for (const forbiddenSafetyRegression of [
  'fraud score',
  'correct answer',
  'red flag',
  'green flag',
  'AI recommendation',
]) {
  mustNotContain('useVisualWorkspaceActions.js', hook.toLowerCase(), forbiddenSafetyRegression.toLowerCase());
}

if (failures.length) {
  console.error('Workspace actions hook smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Workspace actions hook smoke check passed. Pinning, notes, review progress, report packets, and learner-package submission are isolated while Evidence First and Luna gating remain intact.');
