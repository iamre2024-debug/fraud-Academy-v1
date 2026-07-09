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
    file: 'src/VisualWorkspace.jsx',
    label: 'visual shell case-scoped state and review flow',
    mustContain: [
      "tray: 'fraud-academy-visual-tray-v1'",
      "notes: 'fraud-academy-notes-v1'",
      "reportPackets: 'fraud-academy-case-report-packets-v1'",
      'category-progress-track',
      'getReviewPackageStatus({ completedTools: currentCompleted, tray, notes, draft: decisionDraft, reportPackets: caseReportPackets })',
      'buildReviewPackage({',
      'PostSubmissionInsightPanel',
      'BottomInvestigationGrid',
    ],
  },
  {
    file: 'src/VisualNavigation.jsx',
    label: 'React-managed screenshot navigation',
    mustContain: [
      "useState('workspace')",
      'createPortal',
      "window.addEventListener('fraud-academy:navigate'",
      'data-react-navigation="true"',
      'trainingCases.map',
      "setActiveTab('workspace')",
    ],
  },
  {
    file: 'src/VisualTextCollapse.jsx',
    label: 'React-managed compact text controls',
    mustContain: [
      'COLLAPSE_SELECTOR',
      'MutationObserver',
      'createPortal',
      'CollapsibleTextControl',
      'collapsible-text-target',
      'text-more-button',
      'data-react-text-collapse="true"',
    ],
  },
  {
    file: 'src/data/reviewPackage.js',
    label: 'locked Submit Decision package model',
    mustContain: [
      'minimumRationaleWords',
      'buildPackageInputSummary',
      'caseReportPacketFeed',
      'reportPacketCount',
      'ready:',
    ],
  },
  {
    file: 'scripts/review-package-smoke-check.mjs',
    label: 'review package behavior smoke test',
    mustContain: [
      'missingToolStatus',
      'shortRationaleStatus',
      'noPacketStatus',
      'buildReviewPackage({',
      'caseReportPacketFeed',
    ],
  },
  {
    file: 'package.json',
    label: 'verify command wiring',
    mustContain: [
      '"review-package-smoke-check": "node scripts/review-package-smoke-check.mjs"',
      'npm run review-package-smoke-check',
    ],
  },
  {
    file: 'src/main.jsx',
    label: 'React + Vite visual shell entrypoint',
    mustContain: [
      "import VisualWorkspace from './VisualWorkspace.jsx'",
      "import VisualNavigation from './VisualNavigation.jsx'",
      "import VisualTextCollapse from './VisualTextCollapse.jsx'",
      '<VisualWorkspace />',
      '<VisualNavigation />',
      '<VisualTextCollapse />',
      "import './visualWorkspace.css'",
    ],
    mustNotContain: [
      "import './visualNavPatch.js'",
      "import './visualTextCollapse.js'",
    ],
  },
];

const retiredFiles = [
  'src/visualNavPatch.js',
  'src/visualTextCollapse.js',
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

console.log('Functional smoke check passed. Visual shell anchors, React-managed navigation and compact text controls, case-scoped persistence, progress indicators, locked review package flow, and review package smoke wiring are present.');
