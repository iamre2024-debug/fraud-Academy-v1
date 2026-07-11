import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const workspacePath = 'src/VisualWorkspace.jsx';
const controllerPath = 'src/useVisualWorkspaceActions.js';
const workspace = read(workspacePath);
const controller = read(controllerPath);
const failures = [];

function requireText(path, content, text) {
  if (!content.includes(text)) failures.push(`${path} is missing required action-controller anchor: ${text}`);
}

function forbidText(path, content, text) {
  if (content.includes(text)) failures.push(`${path} still contains extracted action orchestration: ${text}`);
}

for (const text of [
  "import useVisualWorkspaceActions from './useVisualWorkspaceActions.js'",
  'useVisualWorkspaceActions({',
  'packageStatus,',
  'saveCaseReportPacket,',
  'submitDecision,',
]) requireText(workspacePath, workspace, text);

for (const text of [
  'function pin(value)',
  "function saveNote(text, type = 'Investigation note')",
  'function markReviewed(toolName = tool)',
  'function saveCaseReportPacket(row = activeRow)',
  'function updateDecision(field, value)',
  'function submitNote(event)',
  'function submitDecision(event)',
  'buildReviewPackage({',
  "window.dispatchEvent(new CustomEvent('fraud-academy:package-saved'",
  'getReviewPackageStatus({',
]) requireText(controllerPath, controller, text);

for (const text of [
  'function pin(value)',
  'function saveNote(',
  'function markReviewed(',
  'function saveCaseReportPacket(',
  'function updateDecision(',
  'function submitNote(',
  'function submitDecision(',
  'buildReviewPackage',
  'getReviewPackageStatus',
  'AGENT_ID',
  'buildPacket',
  'defaultDecisionDraft',
]) forbidText(workspacePath, workspace, text);

for (const text of [
  "if (!status.ready)",
  "markReviewed('Submit Decision')",
  'Post-submission Luna debrief can now read the saved package state.',
  '[packet, ...deduped].slice(0, 30)',
]) requireText(controllerPath, controller, text);

if (failures.length) {
  console.error('Workspace action controller smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Workspace action controller smoke check passed. Case actions remain extracted, package-gated, and wired through the existing visual shell.');
