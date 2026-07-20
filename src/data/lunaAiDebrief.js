export const lunaAiStorageKey = 'fraud-academy-luna-ai-debriefs-v1';
export const lunaAiEndpoint = '/api/luna-debrief';

export function buildLunaAiDebriefPayload({ activeCase, reviewPackage, deterministicDebrief }) {
  const evidenceRecords = collectCaseEvidence(activeCase, reviewPackage);

  return {
    version: 1,
    case: {
      id: activeCase.id,
      type: activeCase.type,
      priority: activeCase.priority,
      person: activeCase.person,
      amount: activeCase.amount,
      allegation: activeCase.allegation,
      queueReason: activeCase.queueReason,
    },
    learnerSubmission: {
      choice: reviewPackage.choice,
      confidence: reviewPackage.confidence,
      reason: reviewPackage.reason,
      completedTools: reviewPackage.completedTools ?? [],
      pinnedEvidence: reviewPackage.pinnedEvidence ?? [],
      noteSnapshot: reviewPackage.noteSnapshot ?? [],
      decisionIndicators: reviewPackage.decisionIndicators ?? [],
      documentRequests: reviewPackage.documentRequests ?? [],
    },
    deterministicDebrief: {
      outcome: deterministicDebrief.outcome,
      outcomeLabel: deterministicDebrief.outcomeLabel,
      managerHeading: deterministicDebrief.managerHeading,
      managerMessage: deterministicDebrief.managerMessage,
      managerTip: deterministicDebrief.managerTip,
      strengths: deterministicDebrief.strengths ?? [],
      improvements: deterministicDebrief.improvements ?? [],
      truthReveal: deterministicDebrief.truthReveal,
      determinationMatched: deterministicDebrief.determinationMatched,
    },
    evidenceRecords,
    allowedEvidenceIds: evidenceRecords.map((record) => record.id).filter(Boolean),
  };
}

export async function requestLunaAiDebrief(payload, { fetcher = globalThis.fetch, signal } = {}) {
  if (typeof fetcher !== 'function') {
    throw new Error('Luna AI fetch is unavailable.');
  }

  const response = await fetcher(lunaAiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.debrief) {
    throw new Error(body.error || 'Luna AI coaching is unavailable.');
  }

  return body.debrief;
}

export function mergeLunaAiDebrief(deterministicDebrief, aiDebrief) {
  const normalized = normalizeLunaAiDebrief(aiDebrief, deterministicDebrief);
  if (!normalized) return deterministicDebrief;

  return {
    ...deterministicDebrief,
    outcome: deterministicDebrief.outcome,
    outcomeLabel: deterministicDebrief.outcomeLabel,
    managerHeading: normalized.managerHeading,
    managerMessage: normalized.managerMessage,
    managerTip: normalized.managerTip,
    strengths: normalized.strengths.length ? normalized.strengths : deterministicDebrief.strengths,
    improvements: normalized.improvements.length ? normalized.improvements : deterministicDebrief.improvements,
    followUps: normalized.improvements.length ? normalized.improvements : deterministicDebrief.followUps,
    aiEnhanced: true,
    citedEvidenceIds: normalized.citedEvidenceIds,
  };
}

export function normalizeLunaAiDebrief(aiDebrief, deterministicDebrief) {
  if (!aiDebrief || typeof aiDebrief !== 'object') return null;
  if (aiDebrief.outcome !== deterministicDebrief.outcome) return null;

  const expectedDetermination = deterministicDebrief.truthReveal?.correctDetermination ?? '';
  if (expectedDetermination && aiDebrief.supportedDetermination !== expectedDetermination) return null;

  const managerHeading = cleanText(aiDebrief.managerHeading, deterministicDebrief.managerHeading);
  const managerMessage = cleanText(aiDebrief.managerMessage, deterministicDebrief.managerMessage);
  const managerTip = cleanText(aiDebrief.managerTip, deterministicDebrief.managerTip);
  const strengths = cleanList(aiDebrief.strengths).slice(0, 3);
  const improvements = cleanList(aiDebrief.improvements).slice(0, 3);
  const citedEvidenceIds = cleanList(aiDebrief.citedEvidenceIds).slice(0, 8);

  if (!managerHeading || !managerMessage || !managerTip) return null;

  return {
    managerHeading,
    managerMessage,
    managerTip,
    strengths,
    improvements,
    citedEvidenceIds,
  };
}

export function buildLunaAiSignature(activeCase, reviewPackage, deterministicDebrief) {
  if (!reviewPackage || !deterministicDebrief) return '';
  return JSON.stringify({
    caseId: activeCase.id,
    choice: reviewPackage.choice,
    confidence: reviewPackage.confidence,
    reason: reviewPackage.reason,
    pins: reviewPackage.pinnedEvidence ?? [],
    notes: reviewPackage.noteSnapshot ?? [],
    indicators: reviewPackage.decisionIndicators ?? [],
    outcome: deterministicDebrief.outcome,
    supported: deterministicDebrief.truthReveal?.correctDetermination ?? '',
  });
}

function collectCaseEvidence(activeCase, reviewPackage) {
  const records = [
    ...summarizeRows('timeline', activeCase.events),
    ...summarizeRows('document', activeCase.documents),
    ...summarizeRows('login', activeCase.loginHistory),
    ...summarizeRows('profile', activeCase.customer?.profileChanges),
    ...summarizeRows('identity', activeCase.identityRecords),
    ...summarizeRows('decision-flag', reviewPackage.decisionIndicators),
  ];
  const seen = new Set();
  return records.filter((record) => {
    if (!record.id || seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  }).slice(0, 80);
}

function summarizeRows(source, rows = []) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => ({
    id: row.id || `${source}-${index + 1}`,
    source,
    label: row.label || row.name || row.item || row.type || row.eventType || row.proof || source,
    detail: [
      row.time,
      row.date,
      row.detail,
      row.notes,
      row.summary,
      row.result,
      row.location,
      row.device,
      row.ip,
      row.explanation,
    ].filter(Boolean).join(' | '),
  }));
}

function cleanText(value, fallback = '') {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text || fallback || '';
}

function cleanList(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => cleanText(value)).filter(Boolean);
}
