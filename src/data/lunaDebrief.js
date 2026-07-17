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
  const caseTruth = activeCase.caseTruth ?? null;
  const acceptedDeterminations = caseTruth?.acceptedDeterminations?.length
    ? caseTruth.acceptedDeterminations
    : caseTruth?.correctDetermination ? [caseTruth.correctDetermination] : [];
  const determinationMatched = caseTruth ? acceptedDeterminations.includes(reviewPackage.choice) : null;

  const haystack = [
    activeCase.type,
    activeCase.allegation,
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
  const followUps = focusCoverage.filter((area) => !area.covered).map((area) => area.label);
  if (caseTruth && !determinationMatched) followUps.unshift(`Compare the submitted determination with the scenario truth: ${caseTruth.correctDetermination}.`);
  if (notesQuality.points < 9) followUps.unshift(notesQuality.nextStep);

  return {
    theme: guide.theme,
    coachIntro: guide.coachIntro,
    score,
    scoreLabel: score >= 86 ? 'Strong package' : score >= 70 ? 'Solid package' : score >= 54 ? 'Developing package' : 'Needs more support',
    strengths: buildStrengths({ coveredRequired, pinnedEvidence, notesQuality, rationale, focusCoverage, decisionIndicators, determinationMatched }),
    followUps: followUps.length ? followUps : ['No required focus gaps detected in this saved package.'],
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

function buildStrengths({ coveredRequired, pinnedEvidence, notesQuality, rationale, focusCoverage, decisionIndicators, determinationMatched }) {
  const strengths = [];

  if (coveredRequired >= 6) strengths.push('The package covers most required investigation tools before debrief.');
  if (pinnedEvidence.length >= 2) strengths.push('Pinned evidence gives the rationale concrete records to stand on.');
  if (notesQuality.points >= 9) strengths.push(`Notebook quality is ${notesQuality.label.toLowerCase()} and connects evidence to investigator reasoning.`);
  if (wordCount(rationale) >= 20) strengths.push('The rationale has enough substance for coaching review.');
  if (focusCoverage.some((area) => area.covered)) strengths.push('At least one case-specific focus area is visible in the saved package.');
  if (decisionIndicators.some((item) => item.proof && item.explanation)) strengths.push('At least one selected case flag includes proof and an investigator explanation.');
  if (determinationMatched) strengths.push('The submitted determination matches the hidden scenario truth.');

  return strengths.length ? strengths : ['The package was saved, but Luna needs more documented support to coach from.'];
}

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
