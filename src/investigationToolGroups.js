export const investigationToolGroups = [
  {
    key: 'identity',
    label: 'Identity & Customer',
    icon: 'ID',
    question: 'Who is the customer, and which identity records are available for review?',
    tools: ['Customer 360', 'Identity Intelligence'],
  },
  {
    key: 'digital',
    label: 'Login, Device & IP',
    icon: '⌁',
    question: 'What access activity, devices, sessions, and network locations are recorded?',
    tools: ['Login History', 'Session History', 'Device Intelligence', 'IP Intelligence'],
  },
  {
    key: 'financial',
    label: 'Transactions & Financial',
    icon: '$',
    question: 'What transaction and financial records are in scope for this case?',
    tools: ['Transaction History', 'Financial Intelligence'],
  },
  {
    key: 'business',
    label: 'Business & Payment Verification',
    icon: '⌂',
    question: 'What business, employee, payroll, and payment-verification facts are available?',
    tools: ['Payment Verification', 'Business 360', 'Business Intelligence', 'Employee Profile', 'Payroll History'],
  },
  {
    key: 'evidence',
    label: 'Evidence & Documents',
    icon: 'DOC',
    question: 'Which documents and evidence records are available, pending, or linked?',
    tools: ['Evidence Center', 'Document Viewer'],
  },
  {
    key: 'connections',
    label: 'Links & Related Cases',
    icon: '⌘',
    question: 'Which case objects, access records, and related identifiers connect?',
    tools: ['Link Analysis', 'System Access Lane'],
  },
];

export const workflowReviewGroup = {
  key: 'workflow',
  label: 'Workflow Review',
  icon: 'FLOW',
  question: 'How should reviewed records move into the timeline and case report?',
  tools: ['Timeline', 'Case Report'],
};

export const workspaceTools = [
  ...investigationToolGroups.flatMap((group) => group.tools),
  ...workflowReviewGroup.tools,
];

export function groupForTool(toolName) {
  return investigationToolGroups.find((group) => group.tools.includes(toolName))
    ?? (workflowReviewGroup.tools.includes(toolName) ? workflowReviewGroup : null);
}
