import { useEffect, useMemo, useState } from 'react';
import AcademyProgress from './AcademyProgress.jsx';
import { trainingCases as baseTrainingCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import { financialRecordsByCase } from './data/financialRecords.js';
import { businessRecordsByCase } from './data/businessRecords.js';
import { evidenceRecordsByCase } from './data/evidenceRecords.js';
import { buildLunaDebrief } from './data/lunaDebrief.js';
import { buildReviewPackage, getReviewPackageStatus, reviewChoices } from './data/reviewPackage.js';

const trainingCases = enrichTrainingCases(baseTrainingCases);

const AGENT_ID = 'AGT-TRAIN-001';
const defaultDecisionDraft = { choice: '', confidence: 'Medium', reason: '' };
const workflowSteps = ['Record', 'Expand', 'Search', 'History', 'Link Analysis', 'Generate Report', 'Timeline', 'Case Report'];

const storageKeys = {
  tray: 'fraud-academy-visual-tray-v1',
  notes: 'fraud-academy-notes-v1',
  agentNotepad: 'fraud-academy-agent-notepad-v1',
  completed: 'fraud-academy-completed-tools-v1',
  decisions: 'fraud-academy-decision-drafts-v1',
  packages: 'fraud-academy-review-packages-v1',
  reportPackets: 'fraud-academy-case-report-packets-v1',
};

const categories = [
  { key: 'identity', label: 'Identity', icon: '▣', tools: ['Customer 360', 'Identity Intelligence'] },
  { key: 'digital', label: 'Digital Activity', icon: '⌁', tools: ['Login History', 'Session History', 'Device Intelligence', 'IP Intelligence'] },
  { key: 'financial', label: 'Financial', icon: '$', tools: ['Transaction History', 'Financial Intelligence', 'Payment Verification'] },
  { key: 'business', label: 'Business', icon: '⌂', tools: ['Business 360', 'Business Intelligence', 'Employee Profile', 'Payroll History'] },
  { key: 'evidence', label: 'Evidence', icon: '▰', tools: ['Evidence Center', 'Document Viewer'] },
  { key: 'connections', label: 'Connections', icon: '⌘', tools: ['Link Analysis'] },
  { key: 'investigation', label: 'Investigation', icon: '⌕', tools: ['Timeline', 'Case Report'] },
];

const packetPrimaryTools = new Set(['Customer 360', 'Payment Verification', 'Document Viewer']);

const toolQuestions = {
  'Customer 360': 'Who is the customer and what does the relationship snapshot show?',
  'Identity Intelligence': 'Which identity objects belong to this profile and case workspace?',
  'Login History': 'Which access records need to be compared with the case story?',
  'Session History': 'What happened inside the sessions connected to the case?',
  'Device Intelligence': 'Which devices appear in the access history and how are they connected?',
  'IP Intelligence': 'Which IP records and locations are tied to the case activity?',
  'Transaction History': 'What money movement or billing records are available for review?',
  'Financial Intelligence': 'What account, balance, merchant, or usage context supports documentation?',
  'Payment Verification': 'Which training-safe payment objects need review?',
  'Business 360': 'Which merchant, employer, or business relationship is in scope?',
  'Business Intelligence': 'What business context is available for the selected case?',
  'Employee Profile': 'Which employee or employer profile records are relevant to the case scope?',
  'Payroll History': 'What payroll records are available for relationship review?',
  'Evidence Center': 'What evidence exists, what was requested, and what can be pinned?',
  'Document Viewer': 'Which documents or packets can be previewed for final documentation?',
  'Link Analysis': 'How do the case objects connect without assigning an outcome?',
  Timeline: 'What sequence of case events has been documented?',
  'Case Report': 'What has been documented before the final learner decision?',
};
