import {
  CASE_DOMAIN_VERSION,
  FINAL_FINDINGS,
  filterToolsForCaseDomain,
  getWorkflowType,
  isWorkflowEnabled,
  normalizeToolName,
  normalizeToolNames,
  operationalDecisionsForWorkflow,
} from './caseDomain.js';
import { normalizeLegacyOperationalDecision } from './caseMigration.js';
import { resolveDecisionDomain, summarizeDecisionIndicators } from './decisionChecklist.js';

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export const reviewChoices = unique([
  'Support Customer Claim',
  'Do Not Support Customer Claim',
  'Partial Credit',
  'Insufficient Evidence',
  'Maintain',
  'Restrict',
  'Restrict / Reduce',
  'Hold',
  'Release',
  'Approve',
  'Deny',
  'More Information Needed',
  'Request More Information',
  'Escalate',
]);

export const finalFindingChoices = Object.freeze(Object.values(FINAL_FINDINGS));

export const decisionCallGroups = [
  {
    label: 'Operational decision',
    options: reviewChoices,
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

function normalizeNoteSnapshotEntry(note) {
  if (typeof note === 'string') return note;
  if (!note || typeof note !== 'object' || Array.isArray(note)) return note;
  return Object.fromEntries(Object.entries(note).map(([key, value]) => {
    if (['source', 'sourceTool', 'tool', 'toolName', 'type'].includes(key)) {
      return [key, normalizeToolName(value)];
    }
    return [key, value];
  }));
}

function decisionGroupLabel(workflowType) {
  if (workflowType === 'credit-application-review') return 'Application operational decision';
  if (workflowType === 'credit-risk-review') return 'Credit risk operational decision';
  if (workflowType === 'payroll-change-alert' || workflowType === 'payroll-account-takeover') {
    return 'Payroll operational decision';
  }
  if (workflowType === 'merchant-non-fraud-dispute') return 'Dispute operational decision';
  if (workflowType.includes('transaction') || workflowType.includes('payment')) return 'Claim or payment operational decision';
  if (workflowType.includes('account-takeover')) return 'Account operational decision';
  return 'Operational decision';
}

export function getRequiredReviewTools(activeCase = {}) {
  const caseTools = Array.isArray(activeCase?.requiredTools) ? activeCase.requiredTools : [];
  const routingDomain = {
    ...activeCase,
    ...resolveDecisionDomain(activeCase),
  };
  return filterToolsForCaseDomain(
    unique(caseTools.length ? caseTools : requiredReviewTools),
    routingDomain,
  );
}

export function getDecisionCallGroups(activeCase = {}) {
  const { customerType, productType, workflowType } = resolveDecisionDomain(activeCase);
  if (!isWorkflowEnabled(customerType, productType, workflowType)) {
    return [{ label: 'Operational decision unavailable', options: [] }];
  }
  const options = operationalDecisionsForWorkflow(workflowType);
  if (!options.length) return decisionCallGroups;
  return [{
    label: decisionGroupLabel(workflowType),
    options,
  }];
}

export function getReviewChoices(activeCase = {}) {
  return unique(getDecisionCallGroups(activeCase).flatMap((group) => group.options));
}

export function getFinalFindingChoices(activeCase = {}) {
  const { customerType, productType, workflowType } = resolveDecisionDomain(activeCase);
  if (!isWorkflowEnabled(customerType, productType, workflowType)) return [];
  const common = [
    FINAL_FINDINGS.FRAUD_CONFIRMED,
    FINAL_FINDINGS.FRAUD_NOT_FOUND,
    FINAL_FINDINGS.INCONCLUSIVE,
    FINAL_FINDINGS.VERIFICATION_INCOMPLETE,
  ];

  if (workflowType === 'merchant-non-fraud-dispute') {
    return unique([
      FINAL_FINDINGS.NON_FRAUD_DISPUTE,
      ...common,
    ]);
  }

  if (workflowType === 'credit-risk-review') {
    return unique([
      FINAL_FINDINGS.CREDIT_RISK_CONCERN,
      ...common,
    ]);
  }

  return common;
}

export function normalizeDecisionDraft(draft = {}, activeCase = {}) {
  const source = draft && typeof draft === 'object' && !Array.isArray(draft) ? draft : {};
  const domain = resolveDecisionDomain({ ...source, ...activeCase });
  const legacyChoice = cleanText(source.choice);
  const legacyDecisionFormat = Boolean(
    source.legacyDecisionFormat
    || (legacyChoice && source.legacyMetadata?.choice && !cleanText(source.finalFinding))
  );
  const operationalDecision = legacyDecisionFormat
    ? normalizeLegacyOperationalDecision(legacyChoice, domain.workflowType)
    : cleanText(source.operationalDecision)
      || normalizeLegacyOperationalDecision(legacyChoice, domain.workflowType);
  const findingBasis = cleanText(source.findingBasis)
    || cleanText(source.evidenceRationale)
    || cleanText(source.reason);

  return {
    ...source,
    schemaVersion: source.schemaVersion ?? CASE_DOMAIN_VERSION,
    ...domain,
    operationalDecision,
    finalFinding: cleanText(source.finalFinding),
    findingBasis,
    evidenceRationale: cleanText(source.evidenceRationale) || findingBasis,
    confidence: cleanText(source.confidence) || 'Medium',
    indicators: source.indicators && typeof source.indicators === 'object' ? source.indicators : {},
    choice: legacyChoice || operationalDecision,
    reason: cleanText(source.reason) || findingBasis,
    legacyDecisionFormat,
  };
}

export function normalizeReviewPackage(reviewPackage = {}, activeCase = {}) {
  const source = reviewPackage && typeof reviewPackage === 'object' && !Array.isArray(reviewPackage)
    ? reviewPackage
    : {};
  const hadExplicitFinalFinding = Boolean(cleanText(source.finalFinding));
  const normalizedDraft = normalizeDecisionDraft(source, activeCase);

  return {
    ...source,
    ...normalizedDraft,
    caseId: source.caseId ?? activeCase.id ?? null,
    legacyDecisionFormat: Boolean(
      source.legacyDecisionFormat
      || (cleanText(source.choice) && !hadExplicitFinalFinding)
    ),
    ...(Array.isArray(source.completedTools) ? {
      completedTools: normalizeToolNames(source.completedTools),
    } : {}),
    ...(Array.isArray(source.requiredTools) ? {
      requiredTools: normalizeToolNames(source.requiredTools),
    } : {}),
    ...(Array.isArray(source.missingTools) ? {
      missingTools: normalizeToolNames(source.missingTools),
    } : {}),
    ...(Array.isArray(source.noteSnapshot) ? {
      noteSnapshot: source.noteSnapshot.map(normalizeNoteSnapshotEntry),
    } : {}),
  };
}

export function getReviewDisplaySnapshot({
  activeCase = {},
  reviewPackage = null,
  decisionDraft = {},
  tray = [],
  notes = [],
  packageStatus = {},
} = {}) {
  const locked = Boolean(reviewPackage);
  const decision = locked
    ? normalizeDecisionDraft(reviewPackage, activeCase)
    : normalizeDecisionDraft(decisionDraft, activeCase);
  const pinnedEvidence = locked && Array.isArray(reviewPackage.pinnedEvidence)
    ? reviewPackage.pinnedEvidence
    : tray;
  const noteSnapshot = locked && Array.isArray(reviewPackage.noteSnapshot)
    ? reviewPackage.noteSnapshot
    : notes;
  const reviewedRequired = locked && Number.isFinite(reviewPackage.reviewedRequired)
    ? reviewPackage.reviewedRequired
    : packageStatus.reviewedRequired ?? 0;
  const totalRequired = locked && Number.isFinite(reviewPackage.totalRequired)
    ? reviewPackage.totalRequired
    : packageStatus.totalRequired ?? 0;
  const indicatorCount = locked && Array.isArray(reviewPackage.decisionIndicators)
    ? reviewPackage.decisionIndicators.length
    : locked && Number.isFinite(reviewPackage.indicatorSummary?.selectedCount)
      ? reviewPackage.indicatorSummary.selectedCount
      : packageStatus.indicatorSummary?.selectedCount ?? 0;

  return {
    locked,
    decision,
    pinnedEvidence,
    noteSnapshot,
    reviewedRequired,
    totalRequired,
    indicatorCount,
  };
}

export function isValidReviewPackage(activeCase = {}, reviewPackage = {}) {
  const normalized = normalizeReviewPackage(reviewPackage, activeCase);
  if (normalized.legacyDecisionFormat) return Boolean(cleanText(normalized.choice));
  return getReviewChoices(activeCase).includes(normalized.operationalDecision)
    && getFinalFindingChoices(activeCase).includes(normalized.finalFinding);
}

export function getReviewPackageStatus({
  activeCase,
  completedTools = [],
  tray = [],
  notes = [],
  draft = {},
}) {
  const normalizedDraft = normalizeDecisionDraft(draft, activeCase);
  const { workflowType } = resolveDecisionDomain(activeCase);
  const routingDomain = {
    ...activeCase,
    ...resolveDecisionDomain(activeCase),
  };
  const requiredTools = getRequiredReviewTools(activeCase);
  const normalizedCompletedTools = filterToolsForCaseDomain(
    completedTools,
    routingDomain,
  );
  const validOperationalDecisions = getReviewChoices(activeCase);
  const validFinalFindings = getFinalFindingChoices(activeCase);
  const missingTools = requiredTools.filter((tool) => !normalizedCompletedTools.includes(tool));
  const blockers = [];
  const coachingGaps = [];
  const messages = [];
  const rationaleWordCount = wordCount(normalizedDraft.findingBasis);
  const hasRationale = Boolean(normalizedDraft.findingBasis);
  const indicatorSummary = summarizeDecisionIndicators(activeCase, normalizedDraft.indicators);
  const packageInputSummary = buildPackageInputSummary({
    completedTools: normalizedCompletedTools,
    tray,
    notes,
    indicatorSummary,
  });
  const confirmedFraud = normalizedDraft.finalFinding === FINAL_FINDINGS.FRAUD_CONFIRMED;
  const deniedApplication = workflowType === 'credit-application-review'
    && normalizedDraft.operationalDecision === 'Deny';
  const hasEvidenceTie = hasRationale
    && (
      indicatorSummary.selectedIndicators.some((item) => item.proof && item.explanation)
      || hasEvidenceReference(normalizedDraft.findingBasis)
    );

  if (!normalizedDraft.operationalDecision) {
    blockers.push('select an operational decision');
  } else if (!validOperationalDecisions.includes(normalizedDraft.operationalDecision)) {
    blockers.push('select a valid operational decision for the current workflow');
  }

  if (!normalizedDraft.finalFinding) {
    blockers.push('select a final finding');
  } else if (!validFinalFindings.includes(normalizedDraft.finalFinding)) {
    blockers.push('select a valid final finding for the current workflow');
  }

  if (confirmedFraud && !hasRationale) {
    blockers.push('write an evidence-based rationale for a confirmed-fraud finding');
  } else if (confirmedFraud && rationaleWordCount < minimumRationaleWords) {
    blockers.push(`write at least ${minimumRationaleWords} words for a confirmed-fraud finding`);
  }
  if (confirmedFraud && hasRationale && !hasEvidenceTie) {
    blockers.push('tie the confirmed-fraud rationale to an exact record or a documented checklist item');
  }
  if (deniedApplication && !hasRationale) {
    blockers.push('write a factual reason for the application denial');
  } else if (deniedApplication && rationaleWordCount < 6) {
    blockers.push('write a specific factual reason for the application denial');
  }

  if (!indicatorSummary.selectedCount) coachingGaps.push('no case flags selected');
  if (indicatorSummary.incompleteIndicators.length) {
    coachingGaps.push(`proof or explanation missing for: ${indicatorSummary.incompleteIndicators.map((item) => item.prompt).join(' | ')}`);
  }
  if (!hasRationale && !confirmedFraud) coachingGaps.push('no finding basis supplied');
  if (hasRationale && rationaleWordCount < minimumRationaleWords && !confirmedFraud) {
    coachingGaps.push(`finding basis is shorter than ${minimumRationaleWords} words`);
  }

  if (blockers.length) {
    messages.push(`Submission requirement: ${blockers.join('; ')}.`);
  } else {
    messages.push('A valid operational decision and separate final finding are selected. You may submit without reviewing every tool.');
  }

  if (coachingGaps.length) messages.push(`Optional coaching details: ${coachingGaps.join('; ')}.`);
  if (missingTools.length) {
    messages.push(`Optional tools not reviewed: ${missingTools.join(', ')}. Open only the records needed for this case.`);
  }
  if (!tray.length && !notes.length) {
    messages.push('Pinned objects and investigation notes are optional supporting context for this decision.');
  }
  messages.push('Checklist weights support coaching only and never determine the operational decision or final finding.');
  messages.push(packageInputSummary);

  return {
    reviewedRequired: requiredTools.length - missingTools.length,
    totalRequired: requiredTools.length,
    requiredTools,
    validChoices: validOperationalDecisions,
    validOperationalDecisions,
    validFinalFindings,
    missingTools,
    blockers,
    coachingGaps,
    messages,
    rationaleWordCount,
    minimumRationaleWords,
    packageInputSummary,
    indicatorSummary,
    operationalDecision: normalizedDraft.operationalDecision,
    finalFinding: normalizedDraft.finalFinding,
    findingBasis: normalizedDraft.findingBasis,
    confirmedFraud,
    deniedApplication,
    hasEvidenceTie,
    ready: blockers.length === 0,
  };
}

export function buildReviewPackage({
  caseId,
  agentId,
  activeCase,
  draft,
  completedTools = [],
  tray = [],
  notes = [],
  packageStatus,
}) {
  const normalizedDraft = normalizeDecisionDraft(draft, activeCase);
  const domain = resolveDecisionDomain(activeCase);
  const routingDomain = {
    ...activeCase,
    ...domain,
  };
  const requiredTools = filterToolsForCaseDomain(
    packageStatus?.requiredTools ?? getRequiredReviewTools(activeCase),
    routingDomain,
  );
  const normalizedCompletedTools = filterToolsForCaseDomain(completedTools, routingDomain);
  const missingTools = requiredTools.filter((tool) => !normalizedCompletedTools.includes(tool));
  const findingBasis = normalizedDraft.findingBasis;
  const savedAtIso = new Date().toISOString();

  return {
    id: `${caseId}-${Date.now()}`,
    schemaVersion: CASE_DOMAIN_VERSION,
    caseId,
    agentId,
    ...domain,
    customerTypeLabel: activeCase?.customerTypeLabel ?? null,
    productTypeLabel: activeCase?.productTypeLabel ?? null,
    workflowTypeLabel: activeCase?.workflowTypeLabel ?? getWorkflowType(domain.workflowType)?.label ?? null,
    alertReason: activeCase?.alertReason ?? activeCase?.queueReason ?? null,
    reportedAllegation: activeCase?.reportedAllegation ?? activeCase?.allegation ?? null,
    suspectedPatterns: [...(activeCase?.suspectedPatterns ?? [])],
    operationalDecision: normalizedDraft.operationalDecision,
    finalFinding: normalizedDraft.finalFinding,
    findingBasis,
    evidenceRationale: findingBasis,
    // Legacy aliases remain readable so prior persistence and progress consumers continue to work.
    choice: normalizedDraft.operationalDecision,
    reason: findingBasis,
    claimTypeId: activeCase?.claimTypeId ?? null,
    claimType: activeCase?.claimType ?? activeCase?.type ?? null,
    lane: activeCase?.lane ?? null,
    confidence: normalizedDraft.confidence,
    rationaleWordCount: packageStatus?.rationaleWordCount ?? wordCount(findingBasis),
    completedTools: normalizedCompletedTools,
    requiredTools,
    pinnedEvidence: [...tray],
    noteSnapshot: notes.slice(0, 8),
    packageInputSummary: packageStatus?.packageInputSummary ?? buildPackageInputSummary({
      completedTools: normalizedCompletedTools,
      tray,
      notes,
    }),
    reviewedRequired: requiredTools.length - missingTools.length,
    totalRequired: requiredTools.length,
    missingTools,
    blockers: packageStatus?.blockers ?? [],
    coachingGaps: packageStatus?.coachingGaps ?? [],
    decisionIndicators: packageStatus?.indicatorSummary?.selectedIndicators ?? [],
    indicatorSummary: packageStatus?.indicatorSummary ? {
      selectedCount: packageStatus.indicatorSummary.selectedCount,
      redCount: packageStatus.indicatorSummary.redCount,
      greenCount: packageStatus.indicatorSummary.greenCount,
      redPoints: packageStatus.indicatorSummary.redPoints,
      greenPoints: packageStatus.indicatorSummary.greenPoints,
      criticalRedCount: packageStatus.indicatorSummary.criticalRedIndicators.length,
      advisoryOnly: true,
    } : null,
    savedAtIso,
    savedAt: new Date(savedAtIso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function buildPackageInputSummary({
  completedTools = [],
  tray = [],
  notes = [],
  indicatorSummary,
}) {
  return `Decision package preview: ${completedTools.length} reviewed tool(s), ${tray.length} optional pinned object(s), ${notes.length} optional note(s), and ${indicatorSummary?.selectedCount ?? 0} selected flag(s) will be saved.`;
}

function hasEvidenceReference(text = '') {
  return /\b[A-Z]{2,}(?:-[A-Z0-9]+)+\b/.test(text)
    || /\b(?:transaction|document|device|session|destination|account|training|payment|payroll|event|record)\s+(?:id\s*)?[#: -]?[A-Z0-9-]{3,}\b/i.test(text)
    || /\$\s?\d[\d,]*(?:\.\d{2})?/.test(text)
    || /\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i.test(text);
}

function cleanText(value) {
  return String(value ?? '').trim();
}

function wordCount(text = '') {
  return cleanText(text).split(/\s+/).filter(Boolean).length;
}
