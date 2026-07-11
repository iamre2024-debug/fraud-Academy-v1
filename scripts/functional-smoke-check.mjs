import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

const checks = [
  {
    file: 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md',
    label: 'locked source-of-truth doctrine',
    mustContain: [
      '# Fraud Academy OS v1.0 Source of Truth',
      '### Evidence First',
      'Luna must not coach toward the answer until after case submission',
      'The screenshot-driven visual shell is the active app entrypoint',
      'src/data/generatedCaseRepository.js',
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
    ],
    mustNotContain: [
      '<SystemAccessLane',
      "window.dispatchEvent(new CustomEvent('fraud-academy:navigate'",
      "document.querySelector('.visual-case-switcher select')",
    ],
  },
  {
    file: 'src/VisualWorkspace.jsx',
    label: 'visual shell rendering coordinator',
    mustContain: [
      "import ActiveToolPanel from './ActiveToolPanel.jsx'",
      "import BottomInvestigationGrid from './BottomInvestigationGrid.jsx'",
      "import CaseSummaryCard from './CaseSummaryCard.jsx'",
      "import CategoryTileRail from './CategoryTileRail.jsx'",
      "import SubmitDecisionPanel from './SubmitDecisionPanel.jsx'",
      "import useVisualWorkspaceActions from './useVisualWorkspaceActions.js'",
      "import useVisualWorkspaceCaseState from './useVisualWorkspaceCaseState.js'",
      "import VisualShellHeader from './VisualShellHeader.jsx'",
      '} = useVisualWorkspaceCaseState(activeCase);',
      '} = useVisualWorkspaceActions({',
      'rowsFor(tool, activeCase, reportPackets)',
      'packageStatus={packageStatus}',
      'submitDecision={submitDecision}',
    ],
    mustNotContain: [
      'readStorage(',
      'writeStorage(',
      'useEffect(',
      'function pin(',
      'function saveNote(',
      'function markReviewed(',
      'function saveCaseReportPacket(',
      'function updateDecision(',
      'function submitDecision(',
      'buildReviewPackage({',
    ],
  },
  {
    file: 'src/useVisualWorkspaceCaseState.js',
    label: 'case-scoped visual workspace persistence hook',
    mustContain: [
      "import { useEffect, useState } from 'react'",
      'readStorage(storageKeys.tray',
      'readStorage(storageKeys.notes',
      'readStorage(storageKeys.completed',
      'readStorage(storageKeys.decisions',
      'readStorage(storageKeys.packages',
      'readStorage(storageKeys.reportPackets',
      'writeStorage(storageKeys.tray',
      'writeStorage(storageKeys.reportPackets',
      "currentCompleted: completedByCase[caseId] ?? ['Case Summary']",
      'decisionDraft: decisionByCase[caseId] ?? defaultDecisionDraft',
    ],
  },
  {
    file: 'src/useVisualWorkspaceActions.js',
    label: 'workspace action and review controller hook',
    mustContain: [
      "import { buildReviewPackage, getReviewPackageStatus } from './data/reviewPackage.js'",
      'const packageStatus = getReviewPackageStatus({',
      'const packet = buildPacket(row, tool, activeCase);',
      "const caseTools = current[activeCase.id] ?? ['Case Summary'];",
      "saveNote(`${toolName}: reviewed and neutral report generated.`, 'Tool review');",
      'if (!status.ready) {',
      'const reviewPackage = buildReviewPackage({',
      "window.dispatchEvent(new CustomEvent('fraud-academy:package-saved'",
      "markReviewed('Submit Decision');",
    ],
    mustNotContain: [
      'fraud score',
      'correct answer',
      'red flag',
      'green flag',
      'AI recommendation',
    ],
  },
  {
    file: 'src/VisualShellHeader.jsx',
    label: 'visual shell header module',
    mustContain: ['className="visual-hero"', 'className="visual-case-switcher"', 'cases.map', 'changeCase(event.target.value)'],
  },
  {
    file: 'src/CaseSummaryCard.jsx',
    label: 'neutral case summary module',
    mustContain: ['className="ornate-card case-summary-visual"', '<small>Claim ID</small>', '<small>Short summary</small>', 'pin(activeCase.id)'],
  },
  {
    file: 'src/CategoryTileRail.jsx',
    label: 'neutral category progress rail',
    mustContain: ['className="visual-categories"', 'category-progress-track', 'reviewedCount', 'progressPercent', "onNavigate('academy')"],
  },
  {
    file: 'src/ActiveToolPanel.jsx',
    label: 'active investigator tool panel',
    mustContain: ["import { workflows } from './visualWorkspaceModel.js'", 'className="ornate-card activity-panel"', 'Save neutral report packet'],
  },
  {
    file: 'src/BottomInvestigationGrid.jsx',
    label: 'investigation tray and notebook',
    mustContain: ['className="bottom-investigation-grid"', 'Pinned Evidence & Key Identifiers', 'className="notebook-compose"', 'case-report-packet-panel'],
  },
  {
    file: 'src/SubmitDecisionPanel.jsx',
    label: 'locked Submit Decision module',
    mustContain: [
      "import DirectCollapsibleText from './DirectCollapsibleText.jsx'",
      'No Luna scoring or answer reveal until a learner package is saved.',
      'packageStatus.messages.map',
      'Save / Check Review Package',
    ],
    mustNotContain: ['document.querySelector'],
  },
  {
    file: 'src/VisualTextCollapse.jsx',
    label: 'inert compact-text compatibility marker',
    mustContain: ['return null'],
    mustNotContain: ['querySelectorAll', 'createPortal', 'addEventListener', 'MutationObserver'],
  },
  {
    file: 'src/visualWorkspaceModel.js',
    label: 'visual workspace model',
    mustContain: [
      "reportPackets: 'fraud-academy-case-report-packets-v1'",
      'export const categories',
      'export function rowsFor(tool, activeCase, reportPackets = [])',
      'System Access Lane',
      'getSystemAccessRecords(activeCase.id)',
      'export function buildPacket(row, tool, activeCase)',
    ],
  },
  {
    file: 'src/data/generatedCaseRepository.js',
    label: 'IndexedDB-first generated-case repository',
    mustContain: [
      'createLocalStorageRepository',
      'createIndexedDbRepository',
      'migrateLegacyCases',
      'getGeneratedCaseRepository',
      'generateAndSaveCase',
      'combineCaseCatalog',
      "kind: 'indexedDB'",
    ],
  },
  {
    file: 'src/GeneratedCaseControls.jsx',
    label: 'async generated-case controls',
    mustContain: [
      "import { generateAndSaveCase, listGeneratedCases } from './data/generatedCaseRepository.js'",
      'async function generateCase()',
      'onCaseGenerated?.(nextCase)',
      'Generate + Open Case',
    ],
    mustNotContain: ['window.location.reload()', 'addGeneratedCase()'],
  },
  {
    file: 'src/LunaPostSubmissionPanel.jsx',
    label: 'post-submission Luna module',
    mustContain: ['buildLunaDebrief', 'Post-submission coaching stays locked', 'Decision-quality breakdown', 'fraud-academy:package-saved'],
  },
  {
    file: 'src/data/reviewPackage.js',
    label: 'review-package safety model',
    mustContain: ['minimumRationaleWords', 'buildPackageInputSummary', 'caseReportPacketFeed', 'ready:'],
  },
  {
    file: 'package.json',
    label: 'verify command wiring',
    mustContain: [
      '"workspace-case-state-hook-smoke-check": "node scripts/workspace-case-state-hook-smoke-check.mjs"',
      '"workspace-actions-hook-smoke-check": "node scripts/workspace-actions-hook-smoke-check.mjs"',
      'npm run generated-case-smoke-check',
      'npm run workspace-actions-hook-smoke-check',
      'npm run build',
    ],
  },
  {
    file: 'src/main.jsx',
    label: 'React + Vite entrypoint',
    mustContain: ["import VisualApp from './VisualApp.jsx'", '<VisualApp />', "import './visualWorkspace.css'", "import './systemAccessLane.css'"],
    mustNotContain: ["import './visualInvestigationRepair.js'", "import './visualNavPatch.js'", "import './visualTextCollapse.js'"],
  },
];

const retiredFiles = [
  'src/visualNavPatch.js',
  'src/visualTextCollapse.js',
  'src/visualInvestigationRepair.js',
  'src/SystemAccessLane.jsx',
  'src/data/caseStorage.js',
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
    if (content.toLowerCase().includes(forbiddenText.toLowerCase())) failures.push(`${check.file} still contains forbidden ${check.label} text: ${forbiddenText}`);
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

console.log('Functional smoke check passed. The visual shell, case persistence, action controller, IndexedDB generated cases, Evidence First locks, Luna package gating, and single System Access Lane remain intact.');
