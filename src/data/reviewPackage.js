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
  'Identity Intel / People Search',
  'Login History',
  'Transaction History',
  'Evidence Center',
  'Link Analysis',
];

export const minimumRationaleWords = 12;

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueGroups(groups = []) {
  const seen = new Set();
  return groups.map((group) => ({
    ...group,
    options: group.options.filter((option) => {
      if (seen.has(option)) return false;
      seen.add(option);
      return true;
    }),
  })).filter((group) => group.options.length);
}

export function getRequiredReviewTools(activeCase = {}) {
  const caseTools = Array.isArray(activeCase?.requiredTools) ? activeCase.requiredTools : [];
  return unique(caseTools.length ? caseTools : requiredReviewTools);
}

export function getDecisionCallGroups(activeCase = {}) {
  if (activeCase?.creditDecision) {
    return uniqueGroups([
      {
        label: 'Credit decision calls',
        options: activeCase.creditDecision.outcomes ?? [
          'Support Credit Request',
          'Do Not Support Credit Request',
          'More Information Needed',
          'Escalate Senior Review',
        ],
      },
      {
        label: 'Credit documentation and routing',
        options: [
          'Request income, employment, or cash-flow documentation',
          'Hold pending verification',
          'Route for identity verification review',
          'Route for payment verification review',
          'No action yet / continue investigation',
        ],
      },
    ]);
  }

  if (['fraud-chargeback', 'non-fraud-chargeback'].includes(activeCase?.claimTypeId)) {
    return uniqueGroups([
      {
        label: 'Chargeback determination calls',
        options: [
          'Approve claim / customer claim supported',
          'Deny claim / customer claim not supported',
          'Partial approval / split liability review',
        ],
      },
      {
        label: 'Chargeback evidence and routing',
        options: [
          'Request more information from customer',
          'Request merchant or payee documentation',
          'Hold pending additional records',
          'Route for chargeback representment review',
          'No action yet / continue investigation',
        ],
      },
    ]);
  }

  if (activeCase?.claimTypeId === 'application-verification') {
    return uniqueGroups([
      {
        label: 'Verification disposition calls',
        options: [
          'Complete application verification review',
          'Unable to verify with current records',
          'Request additional identity or address documentation',
          'Hold pending verification',
        ],
      },
      {
        label: 'Verification routing',
        options: [
          'Route for identity verification review',
          'Route for payment verification review',
          'Route for secondary fraud review',
          'No action yet / continue investigation',
        ],
      },
    ]);
  }

  if (['payroll-direct-deposit', 'email-bec', 'ach-wire-check'].includes(activeCase?.claimTypeId)) {
    return uniqueGroups([
      {
        label: 'Payment and instruction handling',
        options: [
          'Hold pending additional records',
          'Request merchant or payee documentation',
          'Route for payment verification review',
          'No action yet / continue investigation',
        ],
      },
      {
        label: 'Escalation calls',
        options: [
          'Route for secondary fraud review',
          'Escalate for insider / vendor / API / open banking review',
          'Escalate for fraud ring / link analysis review',
        ],
      },
    ]);
  }

  return decisionCallGroups;
}

export function getReviewChoices(activeCase = {}) {
  return unique(getDecisionCallGroups(activeCase).flatMap((group) => group.options));
}

export function getReviewPackageStatus({ activeCase, completedTools = [], tray = [], notes = [], draft = {} }) {
  const requiredTools = getRequiredReviewTools(activeCase);
  const validChoices = getReviewChoices(activeCase);
  const missingTools = requiredTools.filter((tool) => !completedTools.includes(tool));
  const blockers = [];
  const messages = [];
  const rationaleWordCount = wordCount(draft.reason);
  const hasRationale = Boolean(draft.reason?.trim());
  const packageInputSummary = buildPackageInputSummary({ completedTools, tray, notes });

  if (missingTools.length) blockers.push(`review required tools: ${missingTools.join(', ')}`);
  if (!tray.length) blockers.push('pin at least one object');
  if (!notes.length) blockers.push('add at least one rationale note');
  if (!draft.choice) blockers.push('select a learner choice');
  if (draft.choice && !validChoices.includes(draft.choice)) blockers.push('select a valid learner choice from the current decision call list');
  if (!hasRationale) blockers.push('write the learner rationale');
  if (hasRationale && rationaleWordCount < minimumRationaleWords) blockers.push(`expand learner rationale to at least ${minimumRationaleWords} words`);

  if (blockers.length) {
    messages.push(`Review package locked: ${blockers.join('; ')}.`);
    if (missingTools.length) messages.push(`Required tools still open: ${missingTools.join(', ')}.`);
    if (!tray.length) messages.push('Pin at least one case object into the Investigation Tray.');
    if (!notes.length) messages.push('Save at least one case rationale or investigation note.');
    if (!draft.choice) messages.push('Select the learner decision choice.');
    if (draft.choice && !validChoices.includes(draft.choice)) messages.push('The selected learner choice is no longer in the current decision call list.');
    if (!hasRationale) messages.push('Write the evidence-based learner rationale.');
    if (hasRationale && rationaleWordCount < minimumRationaleWords) messages.push(`Add more evidence detail to the learner rationale (${rationaleWordCount}/${minimumRationaleWords} words).`);
  } else {
    messages.push('Review package checklist is complete. Evidence First unlocks Luna only after saving this package.');
  }

  messages.push(packageInputSummary);

  return {
    reviewedRequired: requiredTools.length - missingTools.length,
    totalRequired: requiredTools.length,
    requiredTools,
    validChoices,
    missingTools,
    blockers,
    messages,
    rationaleWordCount,
    minimumRationaleWords,
    packageInputSummary,
    ready: missingTools.length === 0 && tray.length > 0 && notes.length > 0 && Boolean(draft.choice) && validChoices.includes(draft.choice) && hasRationale && rationaleWordCount >= minimumRationaleWords,
  };
}

export function buildReviewPackage({ caseId, agentId, activeCase, draft, completedTools = [], tray = [], notes = [], packageStatus }) {
  const requiredTools = packageStatus?.requiredTools ?? getRequiredReviewTools(activeCase);
  return {
    id: `${caseId}-${Date.now()}`,
    caseId,
    agentId,
    claimTypeId: activeCase?.claimTypeId ?? null,
    claimType: activeCase?.claimType ?? activeCase?.type ?? null,
    lane: activeCase?.lane ?? null,
    choice: draft.choice,
    confidence: draft.confidence || 'Medium',
    reason: draft.reason,
    rationaleWordCount: packageStatus?.rationaleWordCount ?? wordCount(draft.reason),
    completedTools: [...completedTools],
    pinnedEvidence: [...tray],
    noteSnapshot: notes.slice(0, 8),
    packageInputSummary: packageStatus?.packageInputSummary ?? buildPackageInputSummary({ completedTools, tray, notes }),
    reviewedRequired: packageStatus?.reviewedRequired ?? 0,
    totalRequired: packageStatus?.totalRequired ?? requiredTools.length,
    missingTools: packageStatus?.missingTools ?? [],
    blockers: packageStatus?.blockers ?? [],
    savedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };
}

function buildPackageInputSummary({ completedTools = [], tray = [], notes = [] }) {
  return `Package input preview: ${completedTools.length} reviewed tool(s), ${tray.length} pinned object(s), and ${notes.length} note(s) will snapshot into Submit Decision.`;
}

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
