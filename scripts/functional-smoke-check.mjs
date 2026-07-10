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
      '<SystemAccessLane',
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
      "window.dispatchEvent(new CustomEvent('fraud-academy:navigate'",
      "document.querySelector('.visual-case-switcher select')",
    ],
  },
  {
    file: 'src/VisualWorkspace.jsx',
    label: 'visual shell case-scoped state and review flow',
    mustContain: [
      "tray: 'fraud-academy-visual-tray-v1'",
      "notes: 'fraud-academy-notes-v1'",
      "reportPackets: 'fraud-academy-case-report-packets-v1'",
      'category-progress-track',
      'getReviewPackageStatus({ completedTools: currentCompleted, tray, notes, draft: decisionDraft, reportPackets })',
      'buildReviewPackage({',
      "onNavigate('academy')",
      "openTool('Evidence Center')",
      'decision-route-mini',
      'Device IDs help separate repeated known devices from new devices',
    ],
    mustNotContain: [
      "window.dispatchEvent(new CustomEvent('fraud-academy:navigate'",
      'ensureCaseSummaryMeta',
      'repairDeviceIntelligenceTable',
    ],
  },
  {
    file: 'src/SystemAccessLane.jsx',
    label: 'insider vendor API open banking lane',
    mustContain: [
      'Insider / Vendor / API / Open Banking Lane',
      'getSystemAccessRecords(activeCaseId)',
      'createPortal',
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

console.log('Functional smoke check passed. Bible anchors, system-access lane, generated-case no-refresh callbacks, limited compact text controls, direct React callbacks, case-scoped persistence, locked review package flow, Luna post-submission module, and review package smoke wiring are present.');
