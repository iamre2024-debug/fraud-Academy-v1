import { summarizeDecisionIndicators } from './decisionChecklist.js';

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
  'Document Viewer',
  'Link Analysis',
];

export const minimumRationaleWords = 12;

const fraudDeterminationGroups = [
  {
    label: 'Claim determination',
    options: [
      'Support Customer Claim',
      'Do Not Support Customer Claim',
      'Insufficient Evidence',
      'Escalate Investigation',
    ],
  },
  {
    label: 'Referral route',
    options: [
      'Refer to AML',
      'Refer to Credit Risk',
      'Refer to Cyber Security',
      'Refer to Disputes',
      'Refer to Internal Review',
    ],
  },
];

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

  if (usesHoldReleaseDetermination(activeCase)) {
    return uniqueGroups([
      {
        label: 'Operational determination',
        options: ['Hold', 'Release'],
      },
      {
        label: 'Verification and escalation',
        options: [
          'More Information Needed',
          'Escalate Investigation',
          'Refer to Cyber / ATO Review',
          'Refer to Internal Review',
        ],
      },
    ]);
  }

  if (['fraud-chargeback', 'non-fraud-chargeback'].includes(activeCase?.claimTypeId)) {
    return uniqueGroups([
      {
        label: 'Chargeback determination calls',
        options: [
          'Support Customer Claim',
          'Do Not Support Customer Claim',
          'Partial Credit',
          'Insufficient Evidence',
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
    return fraudDeterminationGroups;
  }

  if (['account-takeover', 'first-party-fraud'].includes(activeCase?.claimTypeId)) {
    return fraudDeterminationGroups;
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
  const indicatorSummary = summarizeDecisionIndicators(activeCase, draft.indicators);
  const packageInputSummary = buildPackageInputSummary({ completedTools, tray, notes, indicatorSummary });
  const conflictsWithCriticalRed = indicatorSummary.overrideIndicators.length > 0 && isSupportiveDecision(draft.choice);

  if (!indicatorSummary.selectedCount) blockers.push('select at least one case flag');
  if (indicatorSummary.incompleteIndicators.length) blockers.push(`add proof and explanation for: ${indicatorSummary.incompleteIndicators.map((item) => item.prompt).join(' | ')}`);
  if (!draft.choice) blockers.push('select a learner choice');
  if (draft.choice && !validChoices.includes(draft.choice)) blockers.push('select a valid learner choice from the current decision call list');
  if (conflictsWithCriticalRed) blockers.push('resolve the determination conflict with the documented critical red flag');
  if (!hasRationale) blockers.push('write the learner rationale');
  if (hasRationale && rationaleWordCount < minimumRationaleWords) blockers.push(`expand learner rationale to at least ${minimumRationaleWords} words`);

  if (blockers.length) {
    messages.push(`Unfinished submission details: ${blockers.join('; ')}.`);
    if (!indicatorSummary.selectedCount) messages.push('Select the case flags that apply based on the reviewed evidence.');
    if (indicatorSummary.incompleteIndicators.length) messages.push('Every selected flag requires an exact proof reference and a short explanation.');
    if (!draft.choice) messages.push('Select the learner decision choice.');
    if (draft.choice && !validChoices.includes(draft.choice)) messages.push('The selected learner choice is no longer in the current decision call list.');
    if (!hasRationale) messages.push('Write the evidence-based learner rationale.');
    if (hasRationale && rationaleWordCount < minimumRationaleWords) messages.push(`Add more evidence detail to the learner rationale (${rationaleWordCount}/${minimumRationaleWords} words).`);
    if (conflictsWithCriticalRed) messages.push('A critical red flag carries override weight. Select a non-supporting, hold, information, or escalation determination, or unmark the flag if the evidence does not prove it.');
  } else {
    messages.push('The case-specific checklist and determination are complete. You may submit without reviewing every tool.');
  }

  if (missingTools.length) messages.push(`Optional tools not reviewed: ${missingTools.join(', ')}. Open only the records needed for this case.`);
  if (!tray.length && !notes.length) messages.push('Pinned objects and investigation notes are optional supporting context for this decision.');

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
    indicatorSummary,
    ready: indicatorSummary.selectedCount > 0
      && indicatorSummary.incompleteIndicators.length === 0
      && Boolean(draft.choice)
      && validChoices.includes(draft.choice)
      && !conflictsWithCriticalRed
      && hasRationale
      && rationaleWordCount >= minimumRationaleWords,
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
    decisionIndicators: packageStatus?.indicatorSummary?.selectedIndicators ?? [],
    indicatorSummary: packageStatus?.indicatorSummary ? {
      selectedCount: packageStatus.indicatorSummary.selectedCount,
      redCount: packageStatus.indicatorSummary.redCount,
      greenCount: packageStatus.indicatorSummary.greenCount,
      redPoints: packageStatus.indicatorSummary.redPoints,
      greenPoints: packageStatus.indicatorSummary.greenPoints,
      criticalRedCount: packageStatus.indicatorSummary.criticalRedIndicators.length,
    } : null,
    savedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };
}

function buildPackageInputSummary({ completedTools = [], tray = [], notes = [], indicatorSummary }) {
  return `Decision package preview: ${completedTools.length} reviewed tool(s), ${tray.length} optional pinned object(s), ${notes.length} optional note(s), and ${indicatorSummary?.selectedCount ?? 0} proven flag(s) will be saved.`;
}

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function usesHoldReleaseDetermination(activeCase = {}) {
  if (['email-bec', 'payroll-direct-deposit'].includes(activeCase.claimTypeId)) return true;
  const context = [activeCase.lane, activeCase.subtype, activeCase.scenarioTitle, activeCase.type].filter(Boolean).join(' ');
  return activeCase.claimTypeId === 'account-takeover' && /business.*payroll|payroll.*business/i.test(context);
}

function isSupportiveDecision(choice = '') {
  return [
    'Support Customer Claim',
    'Support Credit Request',
    'Approve Application',
    'Release',
  ].includes(choice);
}
