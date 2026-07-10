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
      'function openCase(caseId)',
    ],
    mustNotContain: [
      '<SystemAccessLane',
      "window.dispatchEvent(new CustomEvent('fraud-academy:navigate'",
      "document.querySelector('.visual-case-switcher select')",
    ],
  },
  {
    file: 'src/VisualWorkspace.jsx',
    label: 'visual shell case-scoped state and review flow',
    mustContain: [
      "import ActiveToolPanel from './ActiveToolPanel.jsx'",
      "import BottomInvestigationGrid from './BottomInvestigationGrid.jsx'",
      "import CategoryTileRail from './CategoryTileRail.jsx'",
      "import SubmitDecisionPanel from './SubmitDecisionPanel.jsx'",
      "from './visualWorkspaceModel.js'",
      'readStorage(storageKeys.tray',
      'writeStorage(storageKeys.reportPackets',
      'rowsFor(tool, activeCase, reportPackets)',
      '<ActiveToolPanel',
      '<BottomInvestigationGrid',
      '<CategoryTileRail',
      '<SubmitDecisionPanel',
      'getReviewPackageStatus({ completedTools: currentCompleted, tray, notes, draft: decisionDraft, reportPackets })',
      'buildReviewPackage({',
    ],
    mustNotContain: [
      "window.dispatchEvent(new CustomEvent('fraud-academy:navigate'",
      'ensureCaseSummaryMeta',
      'repairDeviceIntelligenceTable',
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
    file: 'src/ActiveToolPanel.jsx',
    label: 'active category tool panel module',
    mustContain: [
      "import { workflows } from './visualWorkspaceModel.js'",
      'className="ornate-card activity-panel"',
      'className="tool-select"',
      'Device IDs help separate repeated known devices from new devices',
      'Review neutral internal, vendor, API, and permissioned third-party access records tied to the case objects.',
      'decision-route-mini',
      'workspace-search-row',
      'record-detail-panel',
      'Save neutral report packet',
      'Generate Another Neutral Tool Report',
    ],
  },
  {
    file: 'src/BottomInvestigationGrid.jsx',
    label: 'bottom investigation grid module',
    mustContain: [
      'className="bottom-investigation-grid"',
      'className="ornate-card tray-card"',
      'Pinned Evidence & Key Identifiers',
      "openTool('Evidence Center')",
      'className="ornate-card notebook-card"',
      'className="notebook-compose"',
      'case-report-packet-panel',
      'No structured packets saved yet. Use an expanded record to save one.',
      'No manual note saved yet.',
    ],
  },
  {
    file: 'src/SubmitDecisionPanel.jsx',
    label: 'locked Submit Decision visual module',
    mustContain: [
      "import { reviewChoices } from './data/reviewPackage.js'",
      'className="ornate-card submit-decision-panel"',
      'No Luna scoring or answer reveal until a learner package is saved.',
      'packageStatus.messages.map',
      'reviewChoices.map',
      'Save / Check Review Package',
      'placeholder={`Write the evidence-based rationale for ${activeCase.id}.`}',
    ],
  },
  {
    file: 'src/visualWorkspaceModel.js',
    label: 'visual workspace model split',
    mustContain: [
      "tray: 'fraud-academy-visual-tray-v1'",
      "notes: 'fraud-academy-notes-v1'",
      "reportPackets: 'fraud-academy-case-report-packets-v1'",
      'export const categories',
      'export function rowsFor(tool, activeCase, reportPackets = [])',
      'System Access Lane',
      'getSystemAccessRecords(activeCase.id)',
      'export function buildPacket(row, tool, activeCase)',
    ],
  },
  {
    file: 'src/data/systemAccessRecords.js',
    label: 'system access records',
    mustContain: [
      'Open banking consent',
      'Vendor event',
      'API event',
      'Internal access',
      'getSystemAccessRecords',
    ],
  },
  {
    file: 'src/LunaPostSubmissionPanel.jsx',
    label: 'post submission Luna module',
    mustContain: [
      'buildLunaDebrief',
      'Post-submission coaching stays locked',
      'Decision-quality breakdown',
      'fraud-academy:package-saved',
    ],
  },
  {
    file: 'src/data/generatedCases.js',
    label: 'generated case helpers',
    mustContain: [
      'createGeneratedCase',
      'addGeneratedCase',
      'appendGeneratedCases',
      'fraud-academy-generated-cases-v1',
    ],
  },
  {
    file: 'src/GeneratedCaseControls.jsx',
    label: 'generated case controls',
    mustContain: [
      'Generate + Open Case',
      'const nextCase = addGeneratedCase()',
      'onCaseGenerated?.(nextCase)',
    ],
    mustNotContain: [
      'window.location.reload()',
    ],
  },
  {
    file: 'src/VisualNavigation.jsx',
    label: 'React-managed screenshot navigation with direct callbacks',
    mustContain: [
      'createPortal',
      'data-react-navigation="true"',
      'cases.map',
      'onNavigate',
      'onOpenCase',
    ],
    mustNotContain: [
      "window.addEventListener('fraud-academy:navigate'",
      'setNativeSelectValue',
      "document.querySelector('.visual-case-switcher select')",
    ],
  },
  {
    file: 'src/VisualTextCollapse.jsx',
    label: 'limited React compact text controls',
    mustContain: [
      'data-react-text-collapse="limited"',
      'aria-expanded',
      'text-more-button',
      'slice(0, 80)',
    ],
    mustNotContain: [
      'new MutationObserver',
      "observer.observe(document.body",
      '.system-access-grid p',
    ],
  },
  {
    file: 'src/systemAccessLane.css',
    label: 'retired system access portal styles',
    mustContain: [
      'body:not([data-visual-tab="workspace"]) .generated-case-controls',
      'body:not([data-visual-tab="workspace"]) .luna-post-submission-host',
    ],
    mustNotContain: [
      '.system-access-lane-host',
      '.system-access-lane',
      '.system-access-grid',
    ],
  },
  {
    file: 'src/data/reviewPackage.js',
    label: 'locked Submit Decision package model',
    mustContain: [
      'minimumRationaleWords',
      'buildPackageInputSummary',
      'caseReportPacketFeed',
      'Escalate for insider / vendor / API / open banking review',
      'Route for credit risk underwriting review',
      'ready:',
    ],
  },
  {
    file: 'scripts/review-package-smoke-check.mjs',
    label: 'review package behavior smoke test',
    mustContain: [
      'invalidChoiceStatus',
      'missingToolStatus',
      'shortRationaleStatus',
      'noPacketStatus',
      'buildReviewPackage({',
      'Escalate for insider / vendor / API / open banking review',
      'caseReportPacketFeed',
    ],
  },
  {
    file: 'scripts/visual-three-case-smoke-check.mjs',
    label: 'visual three-case smoke test',
    mustContain: [
      'enrichTrainingCases(baseCases)',
      'stable Device IDs',
      'reviewChoices.length',
      "onNavigate('academy')",
      "openTool('Evidence Center')",
    ],
  },
  {
    file: 'package.json',
    label: 'verify command wiring',
    mustContain: [
      '"visual-three-case-smoke-check": "node scripts/visual-three-case-smoke-check.mjs"',
      'npm run visual-three-case-smoke-check',
      '"review-package-smoke-check": "node scripts/review-package-smoke-check.mjs"',
      'npm run review-package-smoke-check',
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
      "import VisualNavigation from './VisualNavigation.jsx'",
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
    if (!content.includes(requiredText)) {
      failures.push(`${check.file} is missing required ${check.label} anchor: ${requiredText}`);
    }
  }

  for (const forbiddenText of check.mustNotContain ?? []) {
    if (content.includes(forbiddenText)) {
      failures.push(`${check.file} still contains retired ${check.label} text: ${forbiddenText}`);
    }
  }
}

for (const retiredFile of retiredFiles) {
  if (fs.existsSync(path.join(rootDir, retiredFile))) {
    failures.push(`${retiredFile} is retired and must not be restored.`);
  }
}

if (failures.length) {
  console.error('Functional smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Functional smoke check passed. Bible anchors, system-access workspace tool, generated-case no-refresh callbacks, limited compact text controls, direct React callbacks, case-scoped persistence, locked review package flow, Luna post-submission module, and review package smoke wiring are present.');
