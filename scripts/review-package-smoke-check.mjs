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
import { getDecisionChecklist } from '../src/data/decisionChecklist.js';

const requiredToolSet = [...requiredReviewTools];
const accountTakeoverCase = { claimTypeId: 'account-takeover', requiredTools: requiredToolSet };
const accountTakeoverChoice = 'Insufficient Evidence';
const accountTakeoverIndicators = {
  'ato-new-device': {
    selected: true,
    proof: 'LOG-SMOKE-001 and DEV-SMOKE-001',
    explanation: 'The first-seen device record is tied to the reported fraud period.',
  },
};
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function buildStatus(overrides = {}) {
  return getReviewPackageStatus({
    activeCase: accountTakeoverCase,
    completedTools: requiredToolSet,
    tray: ['TRAINING-ID-001'],
    notes: ['Investigation note · Smoke test note tied to the active case.'],
    draft: {
      choice: accountTakeoverChoice,
      confidence: 'Medium',
      reason: 'The learner reviewed required tools and documented the evidence trail before saving this package.',
      indicators: accountTakeoverIndicators,
    },
    ...overrides,
  });
}

assert(reviewChoices.length >= 12, 'Decision call list should include realistic claim, route, escalation, and closure calls.');
assert(reviewChoices.includes('Escalate for insider / vendor / API / open banking review'), 'Decision calls should include insider/vendor/API/open banking escalation.');
assert(reviewChoices.includes('Route for credit risk underwriting review'), 'Decision calls should include credit risk review routing.');
assert(reviewChoices.includes('Route for chargeback representment review'), 'Decision calls should include chargeback representment routing.');
assert(decisionCallGroups.length >= 4, 'Decision call groups should organize outcome, information, routing, and closure calls.');

const invalidChoiceStatus = buildStatus({ draft: { choice: 'Unsupported decision value', confidence: 'Medium', reason: 'The learner reviewed required tools and documented the evidence trail before saving this package.', indicators: accountTakeoverIndicators } });
assert(!invalidChoiceStatus.ready, 'Package should stay locked when the learner choice is not in the current decision list.');
assert(invalidChoiceStatus.blockers.some((blocker) => blocker.includes('valid learner choice')), 'Invalid learner choice should be named as a blocker.');

const missingToolStatus = buildStatus({ completedTools: requiredToolSet.filter((tool) => tool !== 'Document Viewer') });
assert(missingToolStatus.ready, 'A decision should be submittable when an optional tool was not reviewed.');
assert(missingToolStatus.missingTools.includes('Document Viewer'), 'Unreviewed optional tools should remain visible in the package status.');
assert(missingToolStatus.messages.some((message) => message.includes('Optional tools not reviewed')), 'Optional tool coverage should be explained without blocking submission.');

const directDecisionStatus = buildStatus({ completedTools: [], tray: [], notes: [] });
assert(directDecisionStatus.ready, 'A learner should be able to submit directly without tool reviews, pins, or notebook notes.');
assert(directDecisionStatus.messages.some((message) => message.includes('without reviewing every tool')), 'Direct-decision readiness should be explicit.');

const shortRationaleStatus = buildStatus({ draft: { choice: accountTakeoverChoice, confidence: 'High', reason: 'Too short.', indicators: accountTakeoverIndicators } });
assert(!shortRationaleStatus.ready, 'Package should stay locked when rationale is too short.');
assert(shortRationaleStatus.rationaleWordCount < minimumRationaleWords, 'Short rationale count should be tracked.');
assert(shortRationaleStatus.blockers.some((blocker) => blocker.includes(`${minimumRationaleWords}`)), 'Rationale blocker should include the minimum word count.');

const readyStatus = buildStatus();
assert(readyStatus.ready, 'Package should be ready when all required inputs are present.');
assert(readyStatus.packageInputSummary.includes('pinned object'), 'Input summary should describe pinned evidence.');
assert(readyStatus.indicatorSummary.selectedCount === 1, 'Package readiness should count selected case flags.');
assert(readyStatus.indicatorSummary.incompleteIndicators.length === 0, 'Selected flags with proof and explanation should be complete.');

const missingProofStatus = buildStatus({
  draft: {
    choice: accountTakeoverChoice,
    confidence: 'Medium',
    reason: 'The learner reviewed required tools and documented the evidence trail before saving this package.',
    indicators: { 'ato-new-device': { selected: true, proof: '', explanation: '' } },
  },
});
assert(!missingProofStatus.ready, 'A selected flag should block submission until proof and explanation are entered.');
assert(missingProofStatus.blockers.some((blocker) => blocker.includes('proof and explanation')), 'Missing flag proof should be named as a blocker.');

const chargebackCase = {
  claimTypeId: 'non-fraud-chargeback',
  requiredTools: ['Case Summary', 'Customer 360', 'Transaction History', 'Business 360', 'Document Viewer', 'Document Request'],
};
const chargebackChoices = getReviewChoices(chargebackCase);
assert(getRequiredReviewTools(chargebackCase).length === chargebackCase.requiredTools.length, 'Chargeback package should use its own required tools.');
assert(getDecisionCallGroups(chargebackCase).some((group) => group.label === 'Chargeback determination calls'), 'Chargeback package should use chargeback decision calls.');
assert(chargebackChoices.includes('Route for chargeback representment review'), 'Chargeback package should include the representment route.');
assert(!chargebackChoices.includes('Support Credit Request'), 'Chargeback package should not use credit-only decision calls.');

const creditCase = {
  claimTypeId: 'credit-risk',
  lane: 'Credit decision review',
  requiredTools: ['Case Summary', 'Customer 360', 'Identity Intel / People Search', 'Payment Verification', 'Financial Investigation', 'Document Viewer'],
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
    indicators: {
      'credit-stable-income': {
        selected: true,
        proof: 'PAYROLL-SMOKE-001 and PAYSTUB-SMOKE-001',
        explanation: 'Recurring payroll and the paystub consistently support the stated income.',
      },
    },
  },
});
assert(creditStatus.ready, 'Credit package should validate against credit-specific tools and choices.');
assert(getDecisionCallGroups(creditCase).some((group) => group.label === 'Credit decision calls'), 'Credit package should use a credit decision rail.');
assert(!creditStatus.requiredTools.includes('Login History'), 'Credit package should not require an unrelated login-history review.');

const payrollGroups = getDecisionCallGroups({ claimTypeId: 'payroll-direct-deposit' });
const emailGroups = getDecisionCallGroups({ claimTypeId: 'email-bec' });
assert(payrollGroups[0].options.includes('Hold') && payrollGroups[0].options.includes('Release'), 'Business Payroll ATO should use Hold and Release as primary determinations.');
assert(emailGroups[0].options.includes('Hold') && emailGroups[0].options.includes('Release'), 'Email Fraud / BEC should use Hold and Release as primary determinations.');

const duplicateChecklist = getDecisionChecklist({ claimTypeId: 'non-fraud-chargeback', subtype: 'duplicate billing' });
assert(duplicateChecklist.flags.some((item) => item.id === 'ncb-same-order-duplicate'), 'Duplicate billing should receive its scenario-specific same-order check.');
assert(!duplicateChecklist.flags.some((item) => item.id === 'ncb-cancellation-proof'), 'Duplicate billing should not receive cancellation-only checks.');

const checkChecklist = getDecisionChecklist({ claimTypeId: 'ach-wire-check', subtype: 'check alteration' });
assert(checkChecklist.flags.some((item) => item.id === 'payment-check-image-mismatch'), 'Check alteration should receive front/back image checks.');
assert(!checkChecklist.flags.some((item) => item.id === 'payment-wire-beneficiary-change'), 'Check alteration should not receive wire-beneficiary checks.');

const walletChecklist = getDecisionChecklist({ claimTypeId: 'fraud-chargeback', subtype: 'digital wallet token fraud' });
assert(walletChecklist.flags.some((item) => item.id === 'wallet-chip-during-fraud-window'), 'Digital-wallet fraud should retain the critical chip-during-fraud-window check.');
assert(walletChecklist.scopeLabel === 'digital wallet token fraud', 'The checklist should expose the exact matched case scope.');

const savedPackage = buildReviewPackage({
  caseId: 'FA-SMOKE-0001',
  agentId: 'AGT-SMOKE',
  activeCase: creditCase,
  draft: {
    choice: 'Support Credit Request',
    confidence: 'Medium',
    reason: 'The learner reviewed required tools and documented the evidence trail before saving this package.',
    indicators: {
      'credit-stable-income': {
        selected: true,
        proof: 'PAYROLL-SMOKE-001',
        explanation: 'The payroll record supports the documented income source.',
      },
    },
  },
  completedTools: creditCase.requiredTools,
  tray: ['TRAINING-ID-001'],
  notes: ['Investigation note · Smoke test note tied to the active case.'],
  packageStatus: creditStatus,
});

assert(savedPackage.reviewedRequired === creditCase.requiredTools.length, 'Saved package should snapshot required tool coverage.');
assert(savedPackage.lane === 'Credit decision review', 'Saved package should retain the case lane.');
assert(savedPackage.blockers.length === 0, 'Saved ready package should not retain blockers.');
assert(savedPackage.decisionIndicators.length === 1, 'Saved package should snapshot proven weighted flags.');

console.log('Review package smoke check passed. Direct submission, claim and subtype-specific flags, rationale depth, optional investigation context, and saved package snapshots are working.');
