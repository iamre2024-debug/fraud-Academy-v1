export const reviewChoices = [
  'Customer claim supported by documented evidence',
  'Customer claim not supported by documented evidence',
  'Route for secondary review',
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

export const minimumRationaleWords = 12;

export function getReviewPackageStatus({ completedTools = [], tray = [], notes = [], draft = {}, reportPackets = [] }) {
  const missingTools = requiredReviewTools.filter((tool) => !completedTools.includes(tool));
  const blockers = [];
  const messages = [];
  const reportPacketCount = reportPackets.length;
  const rationaleWordCount = wordCount(draft.reason);
  const hasRationale = Boolean(draft.reason?.trim());

  if (missingTools.length) blockers.push(`review required tools: ${missingTools.join(', ')}`);
  if (!tray.length) blockers.push('pin at least one object');
  if (!notes.length) blockers.push('add at least one rationale note');
  if (!draft.choice) blockers.push('select a learner choice');
  if (!hasRationale) blockers.push('write the learner rationale');
  if (hasRationale && rationaleWordCount < minimumRationaleWords) blockers.push(`expand learner rationale to at least ${minimumRationaleWords} words`);

  if (blockers.length) {
    messages.push(`Review package locked: ${blockers.join('; ')}.`);
    if (missingTools.length) messages.push(`Required tools still open: ${missingTools.join(', ')}.`);
    if (!tray.length) messages.push('Pin at least one case object into the Investigation Tray.');
    if (!notes.length) messages.push('Save at least one case rationale or investigation note.');
    if (!draft.choice) messages.push('Select the learner decision choice.');
    if (!hasRationale) messages.push('Write the evidence-based learner rationale.');
    if (hasRationale && rationaleWordCount < minimumRationaleWords) messages.push(`Add more evidence detail to the learner rationale (${rationaleWordCount}/${minimumRationaleWords} words).`);
  } else {
    messages.push('Review package checklist is complete. Evidence First unlocks Luna only after saving this package.');
  }

  messages.push(reportPacketCount ? `${reportPacketCount} structured Case Report packet(s) saved into the draft.` : 'Structured Case Report packets are optional, but expanded records can now be saved into the draft.');

  return {
    reviewedRequired: requiredReviewTools.length - missingTools.length,
    totalRequired: requiredReviewTools.length,
    missingTools,
    blockers,
    messages,
    reportPacketCount,
    rationaleWordCount,
    minimumRationaleWords,
    ready: missingTools.length === 0 && tray.length > 0 && notes.length > 0 && Boolean(draft.choice) && hasRationale && rationaleWordCount >= minimumRationaleWords,
  };
}

export function buildReviewPackage({ caseId, agentId, draft, completedTools = [], tray = [], notes = [], reportPackets = [], packageStatus }) {
  return {
    id: `${caseId}-${Date.now()}`,
    caseId,
    agentId,
    choice: draft.choice,
    confidence: draft.confidence || 'Medium',
    reason: draft.reason,
    rationaleWordCount: packageStatus?.rationaleWordCount ?? wordCount(draft.reason),
    completedTools: [...completedTools],
    pinnedEvidence: [...tray],
    noteSnapshot: notes.slice(0, 8),
    caseReportPackets: reportPackets.slice(0, 12),
    reviewedRequired: packageStatus?.reviewedRequired ?? 0,
    totalRequired: packageStatus?.totalRequired ?? requiredReviewTools.length,
    missingTools: packageStatus?.missingTools ?? [],
    blockers: packageStatus?.blockers ?? [],
    reportPacketCount: packageStatus?.reportPacketCount ?? reportPackets.length,
    savedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };
}

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
