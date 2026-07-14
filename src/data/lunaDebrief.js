import { requiredReviewTools } from './reviewPackage.js';

const debriefGuides = {
  'FA-ATO-24018': {
    theme: 'Account access and purchase timeline',
    coachIntro: 'Luna is reviewing the saved package against the access story, transaction sequence, customer statement, and evidence trail.',
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
    coachIntro: 'Luna is reviewing the saved package against the billing sequence, merchant context, customer submission, and document trail.',
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
    coachIntro: 'Luna is reviewing the saved package against the system alert, identity record, payment setup, and early account activity.',
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
  coachIntro: 'Luna is reviewing the saved package against the documented evidence trail.',
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

  const haystack = [
    activeCase.type,
    activeCase.allegation,
    ...packageTools,
    ...pinnedEvidence,
    ...noteSnapshot,
    rationale,
  ].join(' ').toLowerCase();

  const coveredRequired = requiredReviewTools.filter((tool) => packageTools.includes(tool)).length;
  const focusCoverage = guide.focusAreas.map((area) => ({
    ...area,
    covered: area.keywords.some((keyword) => haystack.includes(keyword.toLowerCase())),
  }));

  const toolScore = Math.round((coveredRequired / requiredReviewTools.length) * 34);
  const pinScore = Math.min(20, pinnedEvidence.length * 5);
  const noteScore = Math.min(22, noteSnapshot.length * 4 + (wordCount(rationale) >= 20 ? 6 : 0));
  const focusScore = Math.round((focusCoverage.filter((area) => area.covered).length / focusCoverage.length) * 18);
  const confidenceScore = reviewPackage.confidence === 'High' ? 6 : reviewPackage.confidence === 'Medium' ? 4 : 2;
  const score = Math.min(100, toolScore + pinScore + noteScore + focusScore + confidenceScore);
  const followUps = focusCoverage.filter((area) => !area.covered).map((area) => area.label);

  return {
    theme: guide.theme,
    coachIntro: guide.coachIntro,
    score,
    scoreLabel: score >= 86 ? 'Strong package' : score >= 70 ? 'Solid package' : score >= 54 ? 'Developing package' : 'Needs more support',
    strengths: buildStrengths({ coveredRequired, pinnedEvidence, noteSnapshot, rationale, focusCoverage }),
    followUps: followUps.length ? followUps : ['No required focus gaps detected in this saved package.'],
    breakdown: [
      { label: 'Required tool coverage', value: `${coveredRequired}/${requiredReviewTools.length}`, points: toolScore },
      { label: 'Pinned evidence support', value: `${pinnedEvidence.length} object(s)`, points: pinScore },
      { label: 'Notebook and rationale depth', value: `${noteSnapshot.length} note(s)`, points: noteScore },
      { label: 'Case focus coverage', value: `${focusCoverage.filter((area) => area.covered).length}/${focusCoverage.length}`, points: focusScore },
      { label: 'Confidence calibration', value: reviewPackage.confidence, points: confidenceScore },
    ],
  };
}

function buildStrengths({ coveredRequired, pinnedEvidence, noteSnapshot, rationale, focusCoverage }) {
  const strengths = [];

  if (coveredRequired >= 6) strengths.push('The package covers most required investigation tools before debrief.');
  if (pinnedEvidence.length >= 2) strengths.push('Pinned evidence gives the rationale concrete records to stand on.');
  if (noteSnapshot.length >= 2) strengths.push('Notebook activity shows the learner documented work instead of relying on memory.');
  if (wordCount(rationale) >= 20) strengths.push('The rationale has enough substance for coaching review.');
  if (focusCoverage.some((area) => area.covered)) strengths.push('At least one case-specific focus area is visible in the saved package.');

  return strengths.length ? strengths : ['The package was saved, but Luna needs more documented support to coach from.'];
}

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
