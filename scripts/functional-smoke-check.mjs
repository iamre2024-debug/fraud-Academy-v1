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
    file: 'src/main.jsx',
    label: 'React + Vite visual shell entrypoint',
    mustContain: [
      "import VisualWorkspace from './VisualWorkspace.jsx'",
      '<VisualWorkspace />',
      "import './visualWorkspace.css'",
    ],
  },
];

const failures = [];

for (const check of checks) {
  const absolutePath = path.join(rootDir, check.file);

  if (!fs.existsSync(absolutePath)) {
    failures.push(`${check.file} is missing for ${check.label}.`);
    continue;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const requiredText of check.mustContain) {
    if (!content.includes(requiredText)) {
      failures.push(`${check.file} is missing required ${check.label} anchor: ${requiredText}`);
    }
  }
}

if (failures.length) {
  console.error('Functional smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Functional smoke check passed. Visual shell anchors, case-scoped persistence, progress indicators, and locked review package flow are present.');
