import fs from 'node:fs';
import path from 'node:path';
import { trainingCases as baseCases } from '../src/data/cases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { SYSTEM_ACCESS_TOOL_NAMES, systemAccessRecordsByCase } from '../src/data/systemAccessRecords.js';

const rootDir = process.cwd();
const failures = [];
const requiredWorkflow = ['Record', 'Expand', 'Search', 'History', 'Link Analysis', 'Generate Report', 'Timeline', 'Case Report'];
const requiredTools = [
  'Insider Activity',
  'Vendor Verification',
  'Admin Change Log',
  'Shared Access',
  'API Activity',
  'Token History',
  'Consent Records',
  'Aggregator Connections',
  'Webhook Events',
  'Open Banking Links',
];

function read(file) {
  return fs.readFileSync(path.join(rootDir, file), 'utf8');
}

function requireText(file, content, text, label) {
  if (!content.includes(text)) failures.push(`${file} is missing ${label}: ${text}`);
}

const workspace = read('src/VisualWorkspace.jsx');
const recordsFile = read('src/data/systemAccessRecords.js');
const sourceOfTruth = read('docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md');

requireText('src/VisualWorkspace.jsx', workspace, "tools: ['Link Analysis', 'System Access Lane', ...SYSTEM_ACCESS_TOOL_NAMES]", 'core Connections system-access tool list');
requireText('src/VisualWorkspace.jsx', workspace, 'SYSTEM_ACCESS_TOOL_NAMES.includes(tool)', 'individual system-access tool routing');
requireText('src/VisualWorkspace.jsx', workspace, 'getSystemAccessRecordsByTool(activeCase.id, tool)', 'case-specific filtered system-access records');
requireText('docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md', sourceOfTruth, 'Insider / Vendor / API / Open Banking records belong inside the core workspace tool switcher', 'Bible system-access placement');

for (const step of requiredWorkflow) {
  requireText('src/VisualWorkspace.jsx', workspace, step, 'Bible workflow chip');
}

for (const tool of requiredTools) {
  if (!SYSTEM_ACCESS_TOOL_NAMES.includes(tool)) failures.push(`SYSTEM_ACCESS_TOOL_NAMES is missing ${tool}.`);
  requireText('src/data/systemAccessRecords.js', recordsFile, `tool: '${tool}'`, 'system-access record tool classification');
}

for (const item of enrichTrainingCases(baseCases)) {
  const records = systemAccessRecordsByCase[item.id] ?? [];
  for (const tool of requiredTools) {
    if (!records.some((record) => record.tool === tool)) {
      failures.push(`${item.id} is missing a ${tool} system-access record.`);
    }
  }
}

if (recordsFile.includes('Bank Verification')) {
  failures.push('systemAccessRecords.js uses retired Bank Verification wording; use Payment Verification.');
}

if (failures.length) {
  console.error('Investigator lane smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Investigator lane smoke check passed. ${requiredTools.length} system-access tools are core workspace sub-tools with case records and workflow coverage.`);
