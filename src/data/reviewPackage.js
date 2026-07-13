export const reviewChoices = [
  'Approve claim / customer claim supported',
  'Deny claim / customer claim not supported',
  'Partial approval / split liability review',
  'Request more information from customer',
  'Request merchant or payee documentation',
  'Hold pending additional records',
  'Route for secondary fraud review',
  'Route for chargeback representment review',
  'Route for identity verification review',
  'Route for payment verification review',
  'Route for credit risk underwriting review',
  'Escalate for insider / vendor / API / open banking review',
  'Escalate for fraud ring / link analysis review',
  'Close as duplicate or already worked claim',
  'Close as customer withdrew or no response',
  'No action yet / continue investigation',
];

export const decisionCallGroups = [
  {
    label: 'Claim outcome calls',
    options: [
      'Approve claim / customer claim supported',
      'Deny claim / customer claim not supported',
      'Partial approval / split liability review',
    ],
  },
  {
    label: 'More information calls',
    options: [
      'Request more information from customer',
      'Request merchant or payee documentation',
      'Hold pending additional records',
      'No action yet / continue investigation',
    ],
  },
  {
    label: 'Review route calls',
    options: [
      'Route for secondary fraud review',
      'Route for chargeback representment review',
      'Route for identity verification review',
      'Route for payment verification review',
      'Route for credit risk underwriting review',
      'Escalate for insider / vendor / API / open banking review',
      'Escalate for fraud ring / link analysis review',
    ],
  },
  {
    label: 'Administrative closure calls',
    options: [
      'Close as duplicate or already worked claim',
      'Close as customer withdrew or no response',
    ],
  },
];

export const requiredReviewTools = [
  'Case Summary',
  'Customer 360',
  'Identity Intelligence',
  'Login History',
  'Transaction History',
  'Evidence Center',
  'Link Analysis',
];

export const minimumRationaleWords = 12;

export function getReviewPackageStatus({ completedTools = [], tray = [], notes = [], draft = {}, reportPackets = [] }) {
  const missingTools = requiredReviewTools.filter((tool) => !completedTools.includes(tool));
  const blockers = [];
  const messages = [];
  const reportPacketCount = reportPackets.length;
  const rationaleWordCount = wordCount(draft.reason);
  const hasRationale = Boolean(draft.reason?.trim());
  const packageInputSummary = buildPackageInputSummary({ completedTools, tray, notes, reportPackets });
  const packetFeed = buildPacketFeed(reportPackets);

  if (missingTools.length) blockers.push(`review required tools: ${missingTools.join(', ')}`);
  if (!tray.length) blockers.push('pin at least one object');
  if (!notes.length) blockers.push('add at least one rationale note');
  if (!draft.choice) blockers.push('select a learner choice');
  if (draft.choice && !reviewChoices.includes(draft.choice)) blockers.push('select a valid learner choice from the current decision call list');
  if (!hasRationale) blockers.push('write the learner rationale');
  if (hasRationale && rationaleWordCount < minimumRationaleWords) blockers.push(`expand learner rationale to at least ${minimumRationaleWords} words`);

  if (blockers.length) {
    messages.push(`Review package locked: ${blockers.join('; ')}.`);
    if (missingTools.length) messages.push(`Required tools still open: ${missingTools.join(', ')}.`);
    if (!tray.length) messages.push('Pin at least one case object into the Investigation Tray.');
    if (!notes.length) messages.push('Save at least one case rationale or investigation note.');
    if (!draft.choice) messages.push('Select the learner decision choice.');
    if (draft.choice && !reviewChoices.includes(draft.choice)) messages.push('The selected learner choice is no longer in the current decision call list.');
    if (!hasRationale) messages.push('Write the evidence-based learner rationale.');
    if (hasRationale && rationaleWordCount < minimumRationaleWords) messages.push(`Add more evidence detail to the learner rationale (${rationaleWordCount}/${minimumRationaleWords} words).`);
  } else {
    messages.push('Review package checklist is complete. Evidence First unlocks Luna only after saving this package.');
  }

  messages.push(packageInputSummary);
  messages.push(reportPacketCount ? `${reportPacketCount} evidence packet(s) saved into the draft.` : 'Evidence packets are optional, but expanded records can be saved into the draft.');
  messages.push(packetFeed.message);

  return {
    reviewedRequired: requiredReviewTools.length - missingTools.length,
    totalRequired: requiredReviewTools.length,
    missingTools,
    blockers,
    messages,
    reportPacketCount,
    rationaleWordCount,
    minimumRationaleWords,
    packageInputSummary,
    caseReportPacketFeed: packetFeed.items,
    ready: missingTools.length === 0 && tray.length > 0 && notes.length > 0 && Boolean(draft.choice) && reviewChoices.includes(draft.choice) && hasRationale && rationaleWordCount >= minimumRationaleWords,
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
    caseReportPacketFeed: packageStatus?.caseReportPacketFeed ?? buildPacketFeed(reportPackets).items,
    packageInputSummary: packageStatus?.packageInputSummary ?? buildPackageInputSummary({ completedTools, tray, notes, reportPackets }),
    reviewedRequired: packageStatus?.reviewedRequired ?? 0,
    totalRequired: packageStatus?.totalRequired ?? requiredReviewTools.length,
    missingTools: packageStatus?.missingTools ?? [],
    blockers: packageStatus?.blockers ?? [],
    reportPacketCount: packageStatus?.reportPacketCount ?? reportPackets.length,
    savedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };
}

function buildPackageInputSummary({ completedTools = [], tray = [], notes = [], reportPackets = [] }) {
  return `Package input preview: ${completedTools.length} reviewed tool(s), ${tray.length} pinned object(s), ${notes.length} note(s), and ${reportPackets.length} evidence packet(s) will snapshot into Submit Decision.`;
}

function buildPacketFeed(reportPackets = []) {
  if (!reportPackets.length) {
    return {
      items: [],
      message: 'Evidence packet feed: no structured packets are attached yet.',
    };
  }

  const items = reportPackets.slice(0, 12).map((packet) => ({
    id: packet.id,
    section: packet.section,
    sourceTool: packet.sourceTool,
    recordId: packet.recordId,
    title: packet.title,
  }));
  const visibleItems = items.slice(0, 4).map((packet) => `${packet.section} from ${packet.sourceTool} (${packet.recordId})`);
  const extraCount = Math.max(0, reportPackets.length - visibleItems.length);
  const suffix = extraCount ? ` · +${extraCount} more` : '';

  return {
    items,
    message: `Evidence packet feed: ${visibleItems.join(' · ')}${suffix}.`,
  };
}

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
