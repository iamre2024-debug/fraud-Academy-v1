export const INVESTIGATOR_WORKFLOW = [
  'Record',
  'Expand',
  'Search',
  'History',
  'Link Analysis',
  'Generate Report',
  'Timeline',
  'Case Report',
];

export const INVESTIGATOR_LANES = [
  {
    key: 'identity',
    label: 'Identity',
    icon: '▣',
    question: 'Who is the customer and does the identity history support the relationship story?',
    tools: ['Customer 360', 'Identity Intelligence'],
  },
  {
    key: 'digital',
    label: 'Digital Activity',
    icon: '⌁',
    question: 'Do login, device, IP, session, and authentication events support or challenge the reported story?',
    tools: ['Login History', 'Session History', 'Device Intelligence', 'IP Intelligence'],
  },
  {
    key: 'financial',
    label: 'Financial',
    icon: '$',
    question: 'Does the money movement make sense against established behavior and the claim timeline?',
    tools: ['Transaction History', 'Financial Intelligence', 'Payment Verification'],
  },
  {
    key: 'business',
    label: 'Business',
    icon: '⌂',
    question: 'Does the business, ownership, employee, payroll, and operating activity make sense?',
    tools: ['Business 360', 'Business Intelligence', 'Employee Profile', 'Payroll History'],
  },
  {
    key: 'trusted-party',
    label: 'Insider / Vendor',
    icon: '♜',
    question: 'Could an employee, administrator, vendor, merchant, or other trusted party explain the activity?',
    tools: ['Insider Activity', 'Vendor Verification', 'Admin Change Log', 'Shared Access'],
  },
  {
    key: 'api-open-banking',
    label: 'API / Open Banking',
    icon: '⌬',
    question: 'Do API clients, tokens, consent records, aggregators, webhooks, and linked institutions make sense?',
    tools: ['API Activity', 'Token History', 'Consent Records', 'Aggregator Connections', 'Webhook Events', 'Open Banking Links'],
  },
  {
    key: 'evidence',
    label: 'Evidence',
    icon: '▰',
    question: 'What has been documented and what still needs verification?',
    tools: ['Evidence Center', 'Document Viewer'],
  },
  {
    key: 'connections',
    label: 'Connections',
    icon: '⌘',
    question: 'Which objects connect across this case and other fictional training records?',
    tools: ['Link Analysis'],
  },
  {
    key: 'investigation',
    label: 'Investigation',
    icon: '⌕',
    question: 'How should the evidence be organized into a defensible timeline and case report?',
    tools: ['Timeline', 'Case Report'],
  },
];

export const REQUIRED_CORE_LANES = ['trusted-party', 'api-open-banking'];

export function getInvestigatorLaneByTool(toolName) {
  return INVESTIGATOR_LANES.find((lane) => lane.tools.includes(toolName));
}

export function validateInvestigatorLanes(lanes = INVESTIGATOR_LANES) {
  const issues = [];
  const keys = new Set();
  const tools = new Set();

  for (const lane of lanes) {
    if (!lane.key) issues.push('Lane missing key');
    if (!lane.label) issues.push(`${lane.key || 'unknown'}: missing label`);
    if (!lane.question) issues.push(`${lane.key || 'unknown'}: missing investigator question`);
    if (!Array.isArray(lane.tools) || lane.tools.length === 0) issues.push(`${lane.key || 'unknown'}: missing tools`);
    if (keys.has(lane.key)) issues.push(`${lane.key}: duplicate lane key`);
    keys.add(lane.key);

    for (const tool of lane.tools || []) {
      if (tools.has(tool)) issues.push(`${tool}: assigned to more than one lane`);
      tools.add(tool);
    }
  }

  for (const requiredLane of REQUIRED_CORE_LANES) {
    if (!keys.has(requiredLane)) issues.push(`${requiredLane}: required core lane missing`);
  }

  if (tools.has('Bank Account Verification')) issues.push('Use Payment Verification training-safe wording');

  return issues;
}
