import { INVESTIGATOR_LANES, INVESTIGATOR_WORKFLOW, validateInvestigatorLanes } from '../src/data/investigatorLanes.js';

const issues = validateInvestigatorLanes();
const requiredWorkflow = ['Record', 'Expand', 'Search', 'History', 'Link Analysis', 'Generate Report', 'Timeline', 'Case Report'];

for (const step of requiredWorkflow) {
  if (!INVESTIGATOR_WORKFLOW.includes(step)) issues.push(`Workflow step missing: ${step}`);
}

const requiredTools = [
  'Insider Activity',
  'Vendor Verification',
  'API Activity',
  'Token History',
  'Consent Records',
  'Aggregator Connections',
  'Webhook Events',
  'Open Banking Links',
];

const toolSet = new Set(INVESTIGATOR_LANES.flatMap((lane) => lane.tools));
for (const tool of requiredTools) {
  if (!toolSet.has(tool)) issues.push(`Required investigator tool missing: ${tool}`);
}

if (issues.length) {
  console.error('Investigator lane contract failed:');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Investigator lane contract passed: ${INVESTIGATOR_LANES.length} lanes, ${toolSet.size} tools, ${INVESTIGATOR_WORKFLOW.length} workflow steps.`);
