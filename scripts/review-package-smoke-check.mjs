import {
  buildReviewPackage,
  decisionCallGroups,
  getDecisionCallGroups,
  getRequiredReviewTools,
  getReviewChoices,
  getReviewPackageStatus,
  minimumRationaleWords,
  requiredReviewTools,
  reviewChoices,
} from '../src/data/reviewPackage.js';

const requiredToolSet = [...requiredReviewTools];
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function buildStatus(overrides = {}) {
  return getReviewPackageStatus({
    completedTools: requiredToolSet,
    tray: ['TRAINING-ID-001'],
    notes: ['Investigation note · Smoke test note tied to the active case.'],
    draft: {
      choice: reviewChoices[0],
      confidence: 'Medium',
      reason: 'The learner reviewed required tools and documented the evidence trail before saving this package.',
    },
    ...overrides,
  });
}

assert(reviewChoices.length >= 12, 'Decision call list should include realistic claim, route, escalation, and closure calls.');
assert(reviewChoices.includes('Escalate for insider / vendor / API / open banking review'), 'Decision calls should include insider/vendor/API/open banking escalation.');
assert(reviewChoices.includes('Route for credit risk underwriting review'), 'Decision calls should include credit risk review routing.');
assert(reviewChoices.includes('Route for chargeback representment review'), 'Decision calls should include chargeback representment routing.');
assert(decisionCallGroups.length >= 4, 'Decision call groups should organize outcome, information, routing, and closure calls.');

const invalidChoiceStatus = buildStatus({ draft: { choice: 'Unsupported decision value', confidence: 'Medium', reason: 'The learner reviewed required tools and documented the evidence trail before saving this package.' } });
assert(!invalidChoiceStatus.ready, 'Package should stay locked when the learner choice is not in the current decision list.');
assert(invalidChoiceStatus.blockers.some((blocker) => blocker.includes('valid learner choice')), 'Invalid learner choice should be named as a blocker.');

const missingToolStatus = buildStatus({ completedTools: requiredToolSet.filter((tool) => tool !== 'Evidence Center') });
assert(!missingToolStatus.ready, 'Package should stay locked when a required tool is missing.');
assert(missingToolStatus.missingTools.includes('Evidence Center'), 'Missing required tool should be named in the package status.');
assert(missingToolStatus.messages.some((message) => message.includes('Review package locked')), 'Locked package should explain neutral blockers.');

const shortRationaleStatus = buildStatus({ draft: { choice: reviewChoices[0], confidence: 'High', reason: 'Too short.' } });
assert(!shortRationaleStatus.ready, 'Package should stay locked when rationale is too short.');
assert(shortRationaleStatus.rationaleWordCount < minimumRationaleWords, 'Short rationale count should be tracked.');
assert(shortRationaleStatus.blockers.some((blocker) => blocker.includes(`${minimumRationaleWords}`)), 'Rationale blocker should include the minimum word count.');

const readyStatus = buildStatus();
assert(readyStatus.ready, 'Package should be ready when all required inputs are present.');
assert(readyStatus.packageInputSummary.includes('pinned object'), 'Input summary should describe pinned evidence.');

const chargebackCase = {
  claimTypeId: 'non-fraud-chargeback',
  requiredTools: ['Case Summary', 'Customer 360', 'Transaction History', 'Business 360', 'Evidence Center', 'Document Request'],
};
const chargebackChoices = getReviewChoices(chargebackCase);
assert(getRequiredReviewTools(chargebackCase).length === chargebackCase.requiredTools.length, 'Chargeback package should use its own required tools.');
assert(getDecisionCallGroups(chargebackCase).some((group) => group.label === 'Chargeback determination calls'), 'Chargeback package should use chargeback decision calls.');
assert(chargebackChoices.includes('Route for chargeback representment review'), 'Chargeback package should include the representment route.');
assert(!chargebackChoices.includes('Support Credit Request'), 'Chargeback package should not use credit-only decision calls.');

const creditCase = {
  claimTypeId: 'credit-risk',
  lane: 'Credit decision review',
  requiredTools: ['Case Summary', 'Customer 360', 'Identity Intel / People Search', 'Payment Verification', 'Financial Intelligence', 'Evidence Center'],
  creditDecision: {
    outcomes: ['Support Credit Request', 'Do Not Support Credit Request', 'More Information Needed', 'Escalate Senior Review'],
  },
};
const creditStatus = getReviewPackageStatus({
  activeCase: creditCase,
  completedTools: creditCase.requiredTools,
  tray: ['TRAINING-ID-002'],
  notes: ['Credit review note with income, employment, payment, and document context.'],
  draft: {
    choice: 'Support Credit Request',
    confidence: 'Medium',
    reason: 'The learner reviewed income, employment, payment, and document records before recording the credit package.',
  },
});
assert(creditStatus.ready, 'Credit package should validate against credit-specific tools and choices.');
assert(getDecisionCallGroups(creditCase).some((group) => group.label === 'Credit decision calls'), 'Credit package should use a credit decision rail.');
assert(!creditStatus.requiredTools.includes('Login History'), 'Credit package should not require an unrelated login-history review.');

const savedPackage = buildReviewPackage({
  caseId: 'FA-SMOKE-0001',
  agentId: 'AGT-SMOKE',
  activeCase: creditCase,
  draft: {
    choice: 'Support Credit Request',
    confidence: 'Medium',
    reason: 'The learner reviewed required tools and documented the evidence trail before saving this package.',
  },
  completedTools: creditCase.requiredTools,
  tray: ['TRAINING-ID-001'],
  notes: ['Investigation note · Smoke test note tied to the active case.'],
  packageStatus: creditStatus,
});

assert(savedPackage.reviewedRequired === creditCase.requiredTools.length, 'Saved package should snapshot required tool coverage.');
assert(savedPackage.lane === 'Credit decision review', 'Saved package should retain the case lane.');
assert(savedPackage.blockers.length === 0, 'Saved ready package should not retain blockers.');

console.log('Review package smoke check passed. Expanded decision calls, locked blockers, rationale depth, pinned evidence, notes, and saved package snapshots are working.');
