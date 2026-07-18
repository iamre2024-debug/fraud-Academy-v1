import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

const checks = [
  {
    file: 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md',
    label: 'locked source-of-truth doctrine',
    mustContain: [
      '# Fraud Academy OS v1.0 Source of Truth',
      '## Investigation doctrine',
      '### Evidence First',
      'Luna must not coach toward the answer until after case submission',
      'The screenshot-driven visual shell is the active app entrypoint',
    ],
  },
  {
    file: 'src/VisualApp.jsx',
    label: 'React visual app coordinator',
    mustContain: [
      '<VisualWorkspace',
      '<VisualNavigation',
      '<VisualTextCollapse',
      '<LunaPostSubmissionPanel',
      '<GeneratedCaseControls',
      'const [caseCatalog, setCaseCatalog]',
      'function handleGeneratedCase(nextCase)',
      'cases={caseCatalog}',
      'onCaseGenerated={handleGeneratedCase}',
      "const [activeTab, setActiveTab] = useState('workspace')",
      "function openCase(caseId, nextWorkspaceScreen = 'briefing')",
    ],
    mustNotContain: [
      '<SystemAccessLane',
      "window.dispatchEvent(new CustomEvent('fraud-academy:navigate'",
      "document.querySelector('.visual-case-switcher select')",
    ],
  },
  {
    file: 'src/VisualWorkspace.jsx',
    label: 'visual shell composition coordinator',
    mustContain: [
      "import BottomInvestigationGrid from './BottomInvestigationGrid.jsx'",
      "import CaseSummaryCard from './CaseSummaryCard.jsx'",
      "import CategoryTileRail from './CategoryTileRail.jsx'",
      "import SubmitDecisionPanel from './SubmitDecisionPanel.jsx'",
      "import useVisualWorkspaceActions from './useVisualWorkspaceActions.js'",
      "import useVisualWorkspaceCaseState from './useVisualWorkspaceCaseState.js'",
      "import VisualShellHeader from './VisualShellHeader.jsx'",
      "from './visualWorkspaceModel.js'",
      '} = useVisualWorkspaceCaseState(activeCase);',
      '} = useVisualWorkspaceActions({',
      'rowsFor(activeTool, activeCase)',
      '<BottomInvestigationGrid',
      '<CaseSummaryCard',
      '<CategoryTileRail',
      '<SubmitDecisionPanel',
      '<VisualShellHeader',
      'jumpDecision={jumpDecision}',
      'data-workspace-screen={workspaceScreen}',
      'function openPinnedEvidence(item)',
      'onOpenPinned={openPinnedEvidence}',
    ],
    mustNotContain: [
      "window.dispatchEvent(new CustomEvent('fraud-academy:navigate'",
      'ensureCaseSummaryMeta',
      'repairDeviceIntelligenceTable',
      'readStorage(',
      'writeStorage(',
      'getReviewPackageStatus(',
      'buildReviewPackage(',
      'function pin(',
      'function saveNote(',
      'function markReviewed(',
      'function saveCaseReportPacket(',
      'function updateDecision(',
      'function submitNote(',
      'function submitDecision(',
      "openTool('Document Viewer', 'indicators')",
    ],
  },
  {
    file: 'src/useVisualWorkspaceCaseState.js',
    label: 'case-scoped visual workspace persistence hook',
    mustContain: [
      "import { useEffect, useState } from 'react'",
      "from './visualWorkspaceModel.js'",
      'readStorage(storageKeys.tray',
      'readStorage(storageKeys.notes',
      'readStorage(storageKeys.completed',
      'readStorage(storageKeys.decisions',
      'readStorage(storageKeys.packages',
      'writeStorage(storageKeys.tray',
      "currentCompleted: completedByCase[caseId] ?? ['Case Summary']",
      'decisionDraft: decisionByCase[caseId] ?? defaultDecisionDraft',
    ],
  },
  {
    file: 'src/useVisualWorkspaceActions.js',
    label: 'case action and review package controller hook',
    mustContain: [
      "import { buildReviewPackage, getReviewPackageStatus } from './data/reviewPackage.js'",
      "from './visualWorkspaceModel.js'",
      'const packageStatus = getReviewPackageStatus({',
      'function pin(value)',
      "function saveNote(text, type = 'Investigation note')",
      'function markReviewed(toolName = tool)',
      'function updateDecision(field, value)',
      'function submitNote(event)',
      'function submitDecision(event)',
      'const reviewPackage = buildReviewPackage({',
      "window.dispatchEvent(new CustomEvent('fraud-academy:package-saved'",
      "markReviewed('Submit Decision')",
    ],
  },
  {
    file: 'src/VisualShellHeader.jsx',
    label: 'visual shell header module',
    mustContain: [
      'className="visual-hero"',
      'className="case-info-bar visual-case-strip"',
      'className="visual-case-switcher"',
      '<strong>Case</strong>',
      '<strong>Claim Type:</strong>',
      '<strong>Status:</strong>',
      'cases.map',
      'changeCase(event.target.value)',
    ],
  },
  {
    file: 'src/CaseSummaryCard.jsx',
    label: 'approved Case Briefing module',
    mustContain: [
      'data-case-briefing-container="approved-theme-v1"',
      'data-case-briefing-screen="approved-theme-v1"',
      'className="case-summary-meta-grid"',
      '<small>Claim ID</small>',
      '<small>Transaction / payee info</small>',
      '<small>Short summary</small>',
      'pin(activeCase.id)',
      'const firstInvestigationTool =',
      'const quickRoutes = [...new Set(',
      'openTool(firstInvestigationTool',
      'quickRoutes.map((toolName)',
      'openRoute(toolName)',
      'case-briefing-chargeback-card',
      'decision-jump-button',
      'Case briefing quick routes',
    ],
    mustNotContain: [
      "openRoute('Document Viewer'",
    ],
  },
  {
    file: 'src/CategoryTileRail.jsx',
    label: 'category tile rail module',
    mustContain: [
      'className="visual-categories"',
      'className="visual-category-row"',
      'category-progress-track',
      'reviewedCount',
      'progressPercent',
      "onNavigate('academy')",
      "setExpandedId('')",
    ],
  },
  {
    file: 'src/BottomInvestigationGrid.jsx',
    label: 'bottom investigation grid module',
    mustContain: [
      'className="bottom-investigation-grid"',
      'className="ornate-card tray-card"',
      'Pinned Evidence & Key Identifiers',
      'className="ornate-card notebook-card"',
      'className="notebook-compose"',
      'No manual note saved yet.',
    ],
    mustNotContain: [
      'Document Viewer',
    ],
  },
  {
    file: 'src/SubmitDecisionPanel.jsx',
    label: 'direct Submit Decision visual module',
    mustContain: [
      "import DecisionFlagChecklist from './DecisionFlagChecklist.jsx'",
      "import DecisionEvidenceNotepad from './DecisionEvidenceNotepad.jsx'",
      "import { getDecisionCallGroups, reviewChoices } from './data/reviewPackage.js'",
      'className="ornate-card submit-decision-panel decision-theme-v1"',
      'Unfinished checklist details are saved for coaching',
      'data-decision-submission-state',
      'const decisionGroups = getDecisionCallGroups(activeCase);',
      'selectionGroups.map',
      'Submit Decision',
      '<DecisionEvidenceNotepad',
      'placeholder={`Write the evidence-based rationale for ${activeCase.id}.`}',
    ],
    mustNotContain: [
      'document.querySelector',
      'legacy text selector',
      'Decision readiness',
      'Decision needs attention',
      'Check decision readiness',
    ],
  },
  {
    file: 'src/DecisionEvidenceNotepad.jsx',
    label: 'decision evidence notepad module',
    mustContain: [
      'Evidence Notepad',
      'Pinned Proof',
      'Case Notes',
      'resolvePinnedEvidence',
      'Add to rationale',
      'Add a case note',
      'Save Note',
      'removePin(record.value)',
    ],
  },
  {
    file: 'src/DirectCollapsibleText.jsx',
    label: 'direct compact text component',
    mustContain: [
      'aria-expanded',
      'text-more-button',
      'More',
      'Less',
    ],
  },
  {
    file: 'src/visualWorkspaceModel.js',
    label: 'visual workspace model split',
    mustContain: [
      "tray: 'fraud-academy-visual-tray-v1'",
      "notes: 'fraud-academy-notes-v1'",
      'export const categories',
      'export function rowsFor(tool, activeCase)',
      'System Access Lane',
      'getSystemAccessRecords(activeCase.id)',
    ],
  },
  {
    file: 'src/data/generatedCaseRepository.js',
    label: 'generated case repository adapter',
    mustContain: [
      'createGeneratedCase',
      'createLocalStorageRepository',
      'createIndexedDbRepository',
      'migrateLegacyCases',
      'getGeneratedCaseRepository',
      'listGeneratedCases',
      'generateAndSaveCase',
      'combineCaseCatalog',
      "kind: 'localStorage'",
      "kind: 'indexedDB'",
      'generated-case-sequence-v1',
    ],
  },
  {
    file: 'src/GeneratedCaseControls.jsx',
    label: 'async generated case controls',
    mustContain: [
      "import { generateAndSaveCase, listGeneratedCases } from './data/generatedCaseRepository.js'",
      'async function generateCase()',
      'const nextCase = await generateAndSaveCase()',
      'const savedCases = await listGeneratedCases()',
      'onCaseGenerated?.(nextCase)',
      'isGenerating',
      'Generate + Open Case',
    ],
    mustNotContain: [
      'window.location.reload()',
      'addGeneratedCase()',
    ],
  },
  {
    file: 'scripts/generated-case-smoke-check.mjs',
    label: 'generated case repository behavior test',
    mustContain: [
      'getGeneratedCaseRepository',
      'generateAndSaveCase',
      'generateAndSaveCases',
      'listGeneratedCases',
      'Expected 138 generated cases after single and batch generation',
      'Hidden payroll evidence patterns were not randomized across the generated batch',
      'Legacy localStorage case was not preserved',
      'combineCaseCatalog',
    ],
  },
  {
    file: 'src/LunaPostSubmissionPanel.jsx',
    label: 'post submission Luna module',
    mustContain: [
      'buildLunaDebrief',
      'Luna Briefing stays locked',
      'state.debrief.managerMessage',
      'What you did well',
      'What to improve',
      'fraud-academy:package-saved',
    ],
  },
  {
    file: 'src/data/reviewPackage.js',
    label: 'locked Submit Decision package model',
    mustContain: [
      'minimumRationaleWords',
      'buildPackageInputSummary',
      'getRequiredReviewTools',
      'getDecisionCallGroups',
      'getReviewChoices',
      'Escalate for insider / vendor / API / open banking review',
      'Route for credit risk underwriting review',
      'ready:',
    ],
  },
  {
    file: 'package.json',
    label: 'verify command wiring',
    mustContain: [
      '"generated-case-smoke-check": "node scripts/generated-case-smoke-check.mjs"',
      '"workspace-case-state-hook-smoke-check": "node scripts/workspace-case-state-hook-smoke-check.mjs"',
      '"workspace-actions-controller-smoke-check": "node scripts/workspace-actions-controller-smoke-check.mjs"',
      'npm run generated-case-smoke-check',
      'npm run functional-smoke-check',
      'npm run review-package-smoke-check',
      'npm run workspace-case-state-hook-smoke-check',
      'npm run workspace-actions-controller-smoke-check',
      'npm run build',
    ],
  },
  {
    file: 'src/main.jsx',
    label: 'React + Vite visual shell entrypoint',
    mustContain: [
      "import VisualApp from './VisualApp.jsx'",
      '<VisualApp />',
      "import './visualWorkspace.css'",
      "import './systemAccessLane.css'",
      "import './generatedCaseControls.css'",
    ],
    mustNotContain: [
      "import VisualWorkspace from './VisualWorkspace.jsx'",
      "import './visualInvestigationRepair.js'",
      "import './visualNavPatch.js'",
      "import './visualTextCollapse.js'",
      "import './visualQaPatch.js'",
    ],
  },
];

const retiredFiles = [
  'src/visualNavPatch.js',
  'src/visualTextCollapse.js',
  'src/visualInvestigationRepair.js',
  'src/SystemAccessLane.jsx',
];

const failures = [];

for (const check of checks) {
  const absolutePath = path.join(rootDir, check.file);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${check.file} is missing for ${check.label}.`);
    continue;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const requiredText of check.mustContain ?? []) {
    if (!content.includes(requiredText)) failures.push(`${check.file} is missing required ${check.label} anchor: ${requiredText}`);
  }
  for (const forbiddenText of check.mustNotContain ?? []) {
    if (content.includes(forbiddenText)) failures.push(`${check.file} still contains retired ${check.label} text: ${forbiddenText}`);
  }
}

for (const retiredFile of retiredFiles) {
  if (fs.existsSync(path.join(rootDir, retiredFile))) failures.push(`${retiredFile} is retired and must not be restored.`);
}

if (failures.length) {
  console.error('Functional smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Functional smoke check passed. Workspace state and action boundaries, repository-backed generated cases, IndexedDB fallback, approved Case Briefing quick routes, direct Submit Decision compact text, Evidence First locks, React navigation, and the full verify wiring are present.');
