export const reviewChoices = [
  'Choice A',
  'Choice B',
  'Route for more review',
  'Needs more records first',
];

export const requiredReviewTools = [
  'Case Summary',
  'Customer 360',
  'Identity Intelligence',
  'Login History',
  'Transaction History',
  'Evidence Center',
  'Link Analysis',
  'Case Report',
];

export function getReviewPackageStatus({ completedTools = [], tray = [], notes = [], draft = {} }) {
  const missingTools = requiredReviewTools.filter((tool) => !completedTools.includes(tool));
  const messages = [];

  if (missingTools.length) messages.push(`Review required tools: ${missingTools.join(', ')}`);
  if (!tray.length) messages.push('Pin at least one object.');
  if (!notes.length) messages.push('Add at least one rationale note.');
  if (!draft.choice) messages.push('Select a learner choice.');
  if (!draft.reason?.trim()) messages.push('Write the learner rationale.');
  if (!messages.length) messages.push('Review package checklist is complete.');

  return {
    reviewedRequired: requiredReviewTools.length - missingTools.length,
    totalRequired: requiredReviewTools.length,
    missingTools,
    messages,
    ready: missingTools.length === 0 && tray.length > 0 && notes.length > 0 && Boolean(draft.choice) && Boolean(draft.reason?.trim()),
  };
}

export function buildReviewPackage({ caseId, agentId, draft, completedTools = [], tray = [], notes = [], packageStatus }) {
  return {
    id: `${caseId}-${Date.now()}`,
    caseId,
    agentId,
    choice: draft.choice,
    confidence: draft.confidence || 'Medium',
    reason: draft.reason,
    completedTools: [...completedTools],
    pinnedEvidence: [...tray],
    noteSnapshot: notes.slice(0, 8),
    reviewedRequired: packageStatus?.reviewedRequired ?? 0,
    totalRequired: packageStatus?.totalRequired ?? requiredReviewTools.length,
    missingTools: packageStatus?.missingTools ?? [],
    savedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };
}
