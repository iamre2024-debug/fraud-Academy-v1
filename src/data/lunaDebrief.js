const debriefGuides = {
  'FA-ATO-24018': {
    theme: 'Account access and purchase timeline',
    coachIntro: 'Luna is reviewing the Submitted Decision Record against the access story, transaction sequence, customer statement, and evidence trail.',
    focusAreas: [
      {
        label: 'Customer statement and disputed purchase timeline',
        keywords: ['customer', 'statement', 'purchase', 'transaction', 'card', 'EVT-1014', '742'],
      },
      {
        label: 'Login, session, device, and IP comparison',
        keywords: ['login', 'session', 'device', 'ip', 'Face ID', 'SES-7781', 'LOG-1008'],
      },
      {
        label: 'Profile and card-control activity',
        keywords: ['profile', 'card controls', 'PCH-1002', 'balance', 'card details'],
      },
      {
        label: 'Evidence request handling',
        keywords: ['affidavit', 'document', 'evidence', 'DOC-442', 'requested'],
      },
    ],
  },
  'FA-CB-24007': {
    theme: 'Recurring billing and cancellation evidence',
    coachIntro: 'Luna is reviewing the Submitted Decision Record against the billing sequence, merchant context, customer submission, and document trail.',
    focusAreas: [
      {
        label: 'Customer dispute form and cancellation story',
        keywords: ['customer', 'dispute form', 'cancellation', 'DOC-510', 'DOC-511'],
      },
      {
        label: 'Recurring merchant transaction history',
        keywords: ['merchant', 'recurring', 'billing', 'subscription', 'TXN-2201', 'prior'],
      },
      {
        label: 'Session and statement-review activity',
        keywords: ['session', 'statement', 'mobile app', 'SES-4412', 'LOG-2204'],
      },
      {
        label: 'Requested support document status',
        keywords: ['requested', 'document', 'cancellation confirmation', 'evidence'],
      },
    ],
  },
  'FA-CR-24003': {
    theme: 'Credit review package and payment verification',
    coachIntro: 'Luna is reviewing the Submitted Decision Record against the system alert, identity record, payment setup, and early account activity.',
    focusAreas: [
      {
        label: 'System alert and credit usage request',
        keywords: ['system alert', 'credit', 'limit', 'usage', 'EVT-3308', 'DOC-620'],
      },
      {
        label: 'Identity and profile setup timeline',
        keywords: ['identity', 'profile', 'Training ID', 'PCH-3303', 'IDR-3301'],
      },
      {
        label: 'Payment Verification objects',
        keywords: ['payment', 'Bank Code', 'Destination ID', 'verification', 'PV-24003'],
      },
      {
        label: 'Access/session support for the account activity',
        keywords: ['login', 'session', 'device', 'ip', 'LOG-3314', 'SES-9302'],
      },
    ],
  },
};

const defaultGuide = {
  theme: 'Case documentation quality',
  coachIntro: 'Luna is reviewing the Submitted Decision Record against the documented evidence trail.',
  focusAreas: [
    { label: 'Case reason', keywords: ['case', 'reason', 'allegation', 'system'] },
    { label: 'Customer and identity records', keywords: ['customer', 'identity', 'training id'] },
    { label: 'Evidence inventory', keywords: ['evidence', 'document', 'record'] },
    { label: 'Timeline and link analysis', keywords: ['timeline', 'link', 'session', 'transaction'] },
  ],
};

export function buildLunaDebrief({ activeCase, reviewPackage, completedTools = [], tray = [], notes = [] }) {
  if (!reviewPackage) return null;

  const guide = debriefGuides[activeCase.id] ?? defaultGuide;
  const packageTools = reviewPackage.completedTools?.length ? reviewPackage.completedTools : completedTools;
  const pinnedEvidence = reviewPackage.pinnedEvidence?.length ? reviewPackage.pinnedEvidence : tray;
  const noteSnapshot = reviewPackage.noteSnapshot?.length ? reviewPackage.noteSnapshot : notes;
  const rationale = reviewPackage.reason ?? '';
  const decisionIndicators = reviewPackage.decisionIndicators ?? [];
  const documentRequests = reviewPackage.documentRequests ?? [];
  const caseTruth = activeCase.caseTruth ?? null;
  const acceptedDeterminations = caseTruth?.acceptedDeterminations?.length
    ? caseTruth.acceptedDeterminations
    : caseTruth?.correctDetermination ? [caseTruth.correctDetermination] : [];
  const determinationMatched = caseTruth ? acceptedDeterminations.includes(reviewPackage.choice) : null;

  const haystack = [
    ...packageTools,
    ...pinnedEvidence,
    ...noteSnapshot,
    ...decisionIndicators.flatMap((item) => [item.proof, item.explanation]),
    rationale,
  ].join(' ').toLowerCase();

  const coveredRequired = reviewPackage.reviewedRequired ?? packageTools.length;
  const totalRequired = reviewPackage.totalRequired ?? Math.max(coveredRequired, 1);
  const notesQuality = scoreNotesQuality(noteSnapshot);
  const focusCoverage = guide.focusAreas.map((area) => ({
    ...area,
    covered: area.keywords.some((keyword) => haystack.includes(keyword.toLowerCase())),
  }));

  const toolScore = Math.round((coveredRequired / totalRequired) * 24);
  const pinScore = Math.min(12, pinnedEvidence.length * 3);
  const noteScore = notesQuality.points;
  const focusScore = Math.round((focusCoverage.filter((area) => area.covered).length / focusCoverage.length) * 14);
  const confidenceScore = reviewPackage.confidence === 'High' ? 4 : reviewPackage.confidence === 'Medium' ? 3 : 2;
  const completedDecisionIndicators = decisionIndicators.filter((item) => item.proof && item.explanation);
  const indicatorScore = Math.min(10, completedDecisionIndicators.length * 3);
  const determinationScore = caseTruth ? (determinationMatched ? 20 : 0) : 10;
  const score = Math.min(100, toolScore + pinScore + noteScore + focusScore + confidenceScore + indicatorScore + determinationScore);
  const followUps = focusCoverage
    .filter((area) => !area.covered)
    .map((area) => `Review ${area.label.toLowerCase()} and explain how it supports or conflicts with your decision.`);
  const documentSummary = summarizeDocumentRequests(documentRequests, packageTools);
  if (caseTruth && !determinationMatched) followUps.unshift(`Revisit the records that support ${caseTruth.correctDetermination}.`);
  if (documentSummary.pending.length) followUps.unshift(`Follow up on the requested ${formatList(documentSummary.pending)} before relying on an evidence gap.`);
  if (documentSummary.receivedNotReviewed.length) followUps.unshift(`Review the received ${formatList(documentSummary.receivedNotReviewed)} before making the final decision.`);
  if (notesQuality.points < 9) followUps.unshift(notesQuality.nextStep);

  const strengths = buildStrengths({
    coveredRequired,
    totalRequired,
    pinnedEvidence,
    notesQuality,
    rationale,
    focusCoverage,
    decisionIndicators,
    determinationMatched,
    documentSummary,
  });
  const coaching = buildManagerCoaching({
    reviewPackage,
    caseTruth,
    determinationMatched,
    strengths,
    followUps,
    notesQuality,
    focusCoverage,
    documentSummary,
  });

  return {
    theme: guide.theme,
    coachIntro: guide.coachIntro,
    score,
    scoreLabel: score >= 86 ? 'Strong package' : score >= 70 ? 'Solid package' : score >= 54 ? 'Developing package' : 'Needs more support',
    outcome: coaching.outcome,
    outcomeLabel: coaching.outcomeLabel,
    managerHeading: coaching.heading,
    managerMessage: coaching.message,
    managerTip: coaching.tip,
    strengths,
    improvements: followUps.length ? followUps : ['Keep using the same evidence-first approach on the next case.'],
    followUps: followUps.length ? followUps : ['No required focus gaps detected in this saved package.'],
    documentSummary,
    notesQuality,
    determinationMatched,
    truthReveal: caseTruth ? {
      classification: caseTruth.classification,
      correctDetermination: caseTruth.correctDetermination,
      acceptedDeterminations,
      rationale: caseTruth.rationale,
    } : null,
    breakdown: [
      { label: 'Required tool coverage', value: `${coveredRequired}/${totalRequired}`, points: toolScore },
      { label: 'Pinned evidence support', value: `${pinnedEvidence.length} object(s)`, points: pinScore },
      { label: 'Quality of notes', value: notesQuality.summary, points: noteScore },
      { label: 'Case focus coverage', value: `${focusCoverage.filter((area) => area.covered).length}/${focusCoverage.length}`, points: focusScore },
      { label: 'Weighted flag documentation', value: `${completedDecisionIndicators.length}/${decisionIndicators.length} completed flag(s)`, points: indicatorScore },
      { label: 'Scenario determination', value: caseTruth ? (determinationMatched ? 'Matched' : 'Did not match') : 'Base-case calibration', points: determinationScore },
      { label: 'Confidence calibration', value: reviewPackage.confidence, points: confidenceScore },
    ],
  };
}

export function scoreNotesQuality(notes = []) {
  const analyzedNotes = notes.map(analyzeNote);
  const substantiveNotes = analyzedNotes.filter((note) => note.substantive);
  const evidenceReferences = substantiveNotes.filter((note) => note.hasEvidenceReference).length;
  const reasonedNotes = substantiveNotes.filter((note) => note.hasReasoning).length;
  const comparisonNotes = substantiveNotes.filter((note) => note.hasComparison).length;
  const sourceTypes = new Set(substantiveNotes.map((note) => note.type.toLowerCase()).filter(Boolean));

  const substancePoints = Math.min(4, substantiveNotes.length * 2);
  const evidencePoints = Math.min(4, evidenceReferences * 2);
  const reasoningPoints = Math.min(4, reasonedNotes * 2);
  const comparisonPoints = Math.min(2, comparisonNotes * 2);
  const sourcePoints = Math.min(2, Math.max(0, sourceTypes.size - 1));
  const points = substancePoints + evidencePoints + reasoningPoints + comparisonPoints + sourcePoints;
  const label = points >= 13 ? 'Strong' : points >= 9 ? 'Supported' : points >= 5 ? 'Developing' : 'Needs evidence';

  let nextStep = 'Improve note quality by citing an exact record and explaining how it supports or contradicts the case theory.';
  if (!substantiveNotes.length) nextStep = 'Add a substantive investigation note; automatic tool-review entries do not count as evidence analysis.';
  else if (!evidenceReferences) nextStep = 'Add exact record IDs, amounts, or timestamps to the investigation notes.';
  else if (!reasonedNotes) nextStep = 'Explain what the cited evidence supports, contradicts, or leaves unresolved.';
  else if (!comparisonNotes) nextStep = 'Compare evidence across tools or place the cited records into timeline order.';

  return {
    points,
    maxPoints: 16,
    label,
    summary: `${label} - ${substantiveNotes.length}/${notes.length} substantive`,
    totalNotes: notes.length,
    substantiveCount: substantiveNotes.length,
    evidenceReferenceCount: evidenceReferences,
    reasoningCount: reasonedNotes,
    comparisonCount: comparisonNotes,
    nextStep,
  };
}

function analyzeNote(note = '') {
  const parts = String(note).split(/\s+\u00b7\s+/);
  const type = parts.length >= 3 ? parts[1].trim() : 'Investigation note';
  const body = (parts.length >= 3 ? parts.slice(2).join(' ') : String(note)).trim();
  const words = wordCount(body);
  const automaticType = /^(?:tool review|decision checklist|decision package|submitted decision record)$/i.test(type);
  const genericReview = /^(?:[\w /&-]+:\s*)?reviewed\.?$/i.test(body);
  const hasEvidenceReference = /\b[A-Z]{2,}(?:-[A-Z0-9]+)+\b/.test(body)
    || /\$\s?\d[\d,]*(?:\.\d{2})?/.test(body)
    || /\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i.test(body);
  const hasReasoning = /\b(?:because|based on|supports?|contradicts?|consistent|inconsistent|indicates?|therefore|explains?|unresolved|does not match|matches?)\b/i.test(body);
  const hasComparison = /\b(?:compare|compared|versus|before|after|prior|sequence|timeline|across|linked?|same (?:device|ip|session|account))\b/i.test(body);

  return {
    type,
    body,
    substantive: !automaticType && !genericReview && words >= 8,
    hasEvidenceReference,
    hasReasoning,
    hasComparison,
  };
}

function buildStrengths({ coveredRequired, totalRequired, pinnedEvidence, notesQuality, rationale, focusCoverage, decisionIndicators, determinationMatched, documentSummary }) {
  const strengths = [];

  if (determinationMatched) strengths.push('You reached the correct decision for this case.');
  if (coveredRequired >= Math.max(2, Math.ceil(totalRequired * 0.6))) strengths.push('You reviewed a useful range of case records before submitting.');
  if (pinnedEvidence.length >= 2) strengths.push('You saved specific evidence that supports your reasoning.');
  if (notesQuality.points >= 9) strengths.push('Your notes connect case evidence to your reasoning.');
  if (wordCount(rationale) >= 20) strengths.push('You gave enough detail for a manager to follow your decision.');
  if (focusCoverage.filter((area) => area.covered).length >= 2) strengths.push('You considered more than one part of the case instead of relying on a single clue.');
  if (decisionIndicators.some((item) => item.proof && item.explanation)) strengths.push('You explained why a selected case flag mattered.');
  if (documentSummary.reviewed.length) strengths.push(`You included the received ${formatList(documentSummary.reviewed)} in your review.`);

  return strengths.length ? strengths.slice(0, 3) : ['You completed the case and created a clear decision for manager review.'];
}

function summarizeDocumentRequests(documentRequests = [], completedTools = []) {
  const requested = documentRequests.filter((document) => /requested/i.test(document.status));
  const received = documentRequests.filter((document) => /received|approved|pending review/i.test(`${document.status} ${document.reviewStatus}`));
  const documentViewerReviewed = completedTools.includes('Document Viewer');
  const title = (document) => document.title || document.id || 'document';

  return {
    requested: requested.map(title),
    pending: requested.filter((document) => !/received/i.test(document.received)).map(title),
    received: received.map(title),
    reviewed: documentViewerReviewed ? received.map(title) : [],
    receivedNotReviewed: documentViewerReviewed ? [] : received.map(title),
  };
}

function buildManagerCoaching({ reviewPackage, caseTruth, determinationMatched, strengths, followUps, notesQuality, focusCoverage, documentSummary }) {
  const selectedDecision = reviewPackage.choice || 'no final decision';
  const expectedDecision = caseTruth?.correctDetermination;
  const nextFocus = followUps[0] ?? notesQuality.nextStep;
  const firstUncoveredArea = focusCoverage.find((area) => !area.covered)?.label;

  if (determinationMatched) {
    const supportNeedsWork = notesQuality.points < 9 || (!reviewPackage.pinnedEvidence?.length && !documentSummary.reviewed.length);
    const strongestWork = strengths.find((item) => !/correct decision/i.test(item)) ?? 'You reached the correct case decision.';
    return {
      outcome: 'correct',
      outcomeLabel: 'Correct decision',
      heading: 'Great job on this case.',
      message: supportNeedsWork
        ? `You chose ${selectedDecision}, which is the right outcome. You identified the case correctly; now strengthen the file so another investigator can clearly follow how the evidence led you there.`
        : `You chose ${selectedDecision}, which is the right outcome. ${strongestWork} Your work shows a clear evidence-first review.`,
      tip: supportNeedsWork
        ? nextFocus
        : `Keep this habit: connect the final decision to the strongest record, then note what conflicting evidence you ruled out.`,
    };
  }

  if (caseTruth) {
    const evidenceExplanation = caseTruth.rationale || caseTruth.classification;
    return {
      outcome: 'incorrect',
      outcomeLabel: 'Not the right decision',
      heading: 'Let’s build on this one.',
      message: `You chose ${selectedDecision}, but the supported outcome is ${expectedDecision}. ${evidenceExplanation}`,
      tip: documentSummary.pending.length
        ? `Next time, follow up on ${formatList(documentSummary.pending)} before treating missing information as proof.`
        : firstUncoveredArea
          ? `Next time, compare ${firstUncoveredArea.toLowerCase()} with the customer or merchant story before submitting.`
          : nextFocus,
    };
  }

  return {
    outcome: 'review',
    outcomeLabel: 'Manager review',
    heading: 'Thanks for working through the case.',
    message: `You submitted ${selectedDecision}. This case does not have a calibrated answer yet, so Luna is focusing on how clearly the evidence supports your decision.`,
    tip: nextFocus,
  };
}

function formatList(values = []) {
  const uniqueValues = [...new Set(values.filter(Boolean))];
  if (!uniqueValues.length) return 'requested documents';
  if (uniqueValues.length === 1) return uniqueValues[0];
  if (uniqueValues.length === 2) return `${uniqueValues[0]} and ${uniqueValues[1]}`;
  return `${uniqueValues.slice(0, -1).join(', ')}, and ${uniqueValues.at(-1)}`;
}

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
