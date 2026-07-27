import {
  buildReviewPackage,
  getDecisionCallGroups,
  getFinalFindingChoices,
  getRequiredReviewTools,
  getReviewPackageStatus,
  isValidReviewPackage,
  minimumRationaleWords,
  normalizeDecisionDraft,
  normalizeReviewPackage,
} from '../src/data/reviewPackage.js';
import {
  flagColorMeanings,
  getDecisionChecklist,
  summarizeDecisionIndicators,
} from '../src/data/decisionChecklist.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredTools = ['Case Summary', 'Customer 360'];
const cardCase = {
  id: 'FA-SMOKE-CARD',
  customerType: 'personal',
  productType: 'credit-card',
  workflowType: 'unauthorized-card-transaction-claim',
  alertReason: 'Unrecognized card transaction',
  reportedAllegation: 'The customer reports an unauthorized card transaction.',
  requiredTools,
};
const payrollCase = {
  id: 'FA-SMOKE-PAYROLL',
  customerType: 'business',
  productType: 'payroll-product',
  workflowType: 'payroll-change-alert',
  requiredTools,
};
const payrollAtoCase = {
  ...payrollCase,
  id: 'FA-SMOKE-PAYROLL-ATO',
  workflowType: 'payroll-account-takeover',
};
const businessAtoCase = {
  id: 'FA-SMOKE-BUSINESS-ATO',
  customerType: 'business',
  productType: 'business-account',
  workflowType: 'business-account-takeover',
  requiredTools,
};
const businessApplicationCase = {
  id: 'FA-SMOKE-BUSINESS-APP',
  customerType: 'business',
  productType: 'business-loan',
  workflowType: 'credit-application-review',
  requiredTools,
};
const creditRiskCase = {
  id: 'FA-SMOKE-CREDIT-RISK',
  customerType: 'personal',
  productType: 'personal-loan',
  workflowType: 'credit-risk-review',
  requiredTools,
};
const linkedPersonalCase = {
  ...creditRiskCase,
  id: 'FA-SMOKE-LINKED-PERSONAL',
  productType: 'credit-card',
  requiredTools: [
    'Case Summary',
    'Customer 360',
    'Business 360',
    'KYB Review',
    'Employee Profile',
    'Payroll History',
  ],
  businessRelationships: [{
    businessId: 'BIZ-TRAINING-42',
    relationshipType: 'Control person',
  }],
};

const cardOptions = getDecisionCallGroups(cardCase)[0].options;
assert(cardOptions.includes('Support Customer Claim'), 'Card claim should offer Support Customer Claim.');
assert(cardOptions.includes('Do Not Support Customer Claim'), 'Card claim should offer Do Not Support Customer Claim.');
assert(!cardOptions.includes('Release'), 'Card claim should not receive a payroll release decision.');

const payrollOptions = getDecisionCallGroups(payrollCase)[0].options;
assert(payrollOptions.includes('Hold') && payrollOptions.includes('Release'), 'Payroll review should route to hold/release operational decisions.');

const applicationOptions = getDecisionCallGroups(businessApplicationCase)[0].options;
assert(applicationOptions.includes('Approve') && applicationOptions.includes('Deny'), 'Application review should route to application decisions.');

const creditRiskOptions = getDecisionCallGroups(creditRiskCase)[0].options;
assert(creditRiskOptions.includes('Maintain') && creditRiskOptions.includes('Restrict / Reduce'), 'Credit risk review should route to exposure decisions.');
assert(getFinalFindingChoices(creditRiskCase).includes('Credit Risk Concern'), 'Credit risk review should allow Credit Risk Concern.');
assert(
  JSON.stringify(getRequiredReviewTools(linkedPersonalCase))
    === JSON.stringify(['Case Summary', 'Customer 360', 'Business 360']),
  'An ownership-linked personal review should retain Business 360 while excluding KYB and payroll tools.',
);
const unsupportedBusinessApplication = {
  ...businessApplicationCase,
  productType: 'business-account',
};
assert(
  getDecisionCallGroups(unsupportedBusinessApplication)[0].options.length === 0,
  'Unsupported workflow and product combinations should not expose operational decisions.',
);
assert(
  getDecisionChecklist(unsupportedBusinessApplication).title === 'Case decision checklist',
  'Unsupported workflow and product combinations should not receive an inappropriate checklist.',
);

const businessApplicationChecklist = getDecisionChecklist(businessApplicationCase);
assert(businessApplicationChecklist.title === 'Business Credit Application Review checklist', 'Business applications should receive the entity-and-party checklist.');
const businessApplicationPrompts = businessApplicationChecklist.flags.map((item) => item.prompt).join(' ');
for (const role of ['beneficial owner', 'control person', 'guarantor', 'submitter', 'administrator']) {
  assert(businessApplicationPrompts.toLowerCase().includes(role), `Business application checklist should include the ${role} role.`);
}

assert(
  getDecisionChecklist(businessAtoCase).title === 'Business Account Takeover checklist',
  'General Business Account Takeover should have its own routed checklist.',
);
assert(
  getDecisionChecklist(payrollAtoCase).title === 'Payroll Account Takeover checklist',
  'Payroll Account Takeover should remain separate from general Business Account Takeover.',
);

assert(
  flagColorMeanings.red === 'Risk, exception, mismatch, or unresolved adverse evidence',
  'Red must consistently mean risk, exception, mismatch, or unresolved adverse evidence.',
);
assert(
  flagColorMeanings.green === 'Verified, consistent, established, or legitimate evidence',
  'Green must consistently mean verified, consistent, established, or legitimate evidence.',
);

function statusFor(activeCase, draft) {
  return getReviewPackageStatus({
    activeCase,
    completedTools: requiredTools,
    tray: [],
    notes: [],
    draft,
  });
}

const missingFindingStatus = statusFor(cardCase, {
  operationalDecision: 'Support Customer Claim',
  finalFinding: '',
  findingBasis: '',
});
assert(!missingFindingStatus.ready, 'Operational decision alone must not be submittable.');
assert(missingFindingStatus.blockers.includes('select a final finding'), 'Missing final finding should be reported as a blocker.');

const confirmedWithoutBasis = statusFor(cardCase, {
  operationalDecision: 'Support Customer Claim',
  finalFinding: 'Fraud Confirmed',
  findingBasis: '',
});
assert(!confirmedWithoutBasis.ready, 'Fraud Confirmed must require a written basis.');

const confirmedWithoutEvidenceTie = statusFor(cardCase, {
  operationalDecision: 'Support Customer Claim',
  finalFinding: 'Fraud Confirmed',
  findingBasis: 'The available information across the case supports this result after a complete investigation review.',
});
assert(!confirmedWithoutEvidenceTie.ready, 'Fraud Confirmed must require an evidence tie, not just enough words.');

const confirmedWithEvidence = statusFor(cardCase, {
  operationalDecision: 'Support Customer Claim',
  finalFinding: 'Fraud Confirmed',
  findingBasis: `Transaction TXN-SMOKE-001 and device DEV-SMOKE-002 establish unauthorized use after the profile control changed during the disputed activity window.`,
});
assert(confirmedWithEvidence.rationaleWordCount >= minimumRationaleWords, 'Confirmed-fraud test basis should meet the minimum word count.');
assert(confirmedWithEvidence.hasEvidenceTie, 'Exact record IDs should satisfy the evidence-tie requirement.');
assert(confirmedWithEvidence.ready, 'Evidence-supported Fraud Confirmed package should be ready.');

const denialWithoutReason = statusFor(businessApplicationCase, {
  operationalDecision: 'Deny',
  finalFinding: 'Verification Incomplete',
  findingBasis: '',
});
assert(!denialWithoutReason.ready, 'An application denial must require a factual reason.');
const denialWithReason = statusFor(businessApplicationCase, {
  operationalDecision: 'Deny',
  finalFinding: 'Verification Incomplete',
  findingBasis: 'The required entity registration document remains unavailable after the documented verification request.',
});
assert(denialWithReason.ready, 'A factual denial reason should not be converted into a fraud finding.');

const redIndicatorId = getDecisionChecklist(cardCase).flags.find((item) => item.type === 'red').id;
const advisorySummary = summarizeDecisionIndicators(cardCase, {
  [redIndicatorId]: {
    selected: true,
    proof: 'TXN-SMOKE-RED-001',
    explanation: 'The transaction record contains an unresolved authentication mismatch.',
  },
});
assert(advisorySummary.redPoints > 0 && advisorySummary.advisoryOnly, 'Weighted checklist results should be coaching-only.');
const nonFraudWithRedEvidence = statusFor(cardCase, {
  operationalDecision: 'Do Not Support Customer Claim',
  finalFinding: 'Fraud Not Found',
  findingBasis: '',
  indicators: {
    [redIndicatorId]: {
      selected: true,
      proof: 'TXN-SMOKE-RED-001',
      explanation: 'The transaction record contains an unresolved authentication mismatch.',
    },
  },
});
assert(nonFraudWithRedEvidence.ready, 'Checklist points must not automatically determine fraud.');

const legacyDraft = normalizeDecisionDraft({
  choice: 'Deny claim / customer claim not supported',
  reason: 'Legacy learner rationale remains available.',
  confidence: 'High',
}, cardCase);
assert(legacyDraft.operationalDecision === 'Do Not Support Customer Claim', 'Legacy choice should map to the nearest canonical operational decision.');
assert(legacyDraft.finalFinding === '', 'Legacy decision must not silently invent a final fraud finding.');
assert(legacyDraft.findingBasis === 'Legacy learner rationale remains available.', 'Legacy rationale should survive normalization.');

const legacyPackage = normalizeReviewPackage({
  id: 'FA-SMOKE-CARD-LEGACY',
  caseId: cardCase.id,
  choice: 'Deny claim / customer claim not supported',
  reason: 'Legacy learner rationale remains available.',
  completedTools: ['Evidence Center', 'Financial Intelligence'],
  requiredTools: ['Case Summary', 'Evidence Center', 'Business Intelligence'],
  missingTools: ['Business Intelligence'],
  noteSnapshot: ['Jul 8, 2026 · Financial Intelligence · Saved note.'],
  savedAt: 'Jul 8, 2026, 10:00 AM',
}, cardCase);
assert(legacyPackage.legacyDecisionFormat, 'Legacy package should remain marked as a compatibility record.');
assert(isValidReviewPackage(cardCase, legacyPackage), 'Legacy package should continue to unlock existing learner progress.');
assert(legacyPackage.savedAt === 'Jul 8, 2026, 10:00 AM', 'Legacy saved timestamp should be preserved.');
assert(
  JSON.stringify(legacyPackage.completedTools) === JSON.stringify(['Document Viewer', 'Financial Investigation']),
  'Legacy completed-tool aliases should normalize without losing progress.',
);
assert(
  JSON.stringify(legacyPackage.requiredTools) === JSON.stringify(['Case Summary', 'Document Viewer', 'KYB Review'])
  && JSON.stringify(legacyPackage.missingTools) === JSON.stringify(['KYB Review']),
  'Legacy review-package coverage arrays should normalize consistently.',
);
assert(
  legacyPackage.noteSnapshot[0] === 'Jul 8, 2026 · Financial Intelligence · Saved note.',
  'Legacy package note snapshots should retain learner-authored text byte for byte.',
);
const versionedLegacyPackage = normalizeReviewPackage({
  ...legacyPackage,
  operationalDecision: 'Do Not Support Customer Claim',
  finalFinding: '',
  legacyDecisionFormat: undefined,
}, cardCase);
assert(isValidReviewPackage(cardCase, versionedLegacyPackage), 'A migrated legacy package with an operational decision but no historical final finding should remain valid.');

const builtPackage = buildReviewPackage({
  caseId: cardCase.id,
  agentId: 'AGT-SMOKE',
  activeCase: cardCase,
  draft: {
    operationalDecision: 'Support Customer Claim',
    finalFinding: 'Fraud Confirmed',
    findingBasis: 'Transaction TXN-SMOKE-001 and device DEV-SMOKE-002 establish unauthorized activity in the reviewed case timeline and access records.',
    confidence: 'High',
    indicators: {},
  },
  completedTools: requiredTools,
  tray: [],
  notes: [],
  packageStatus: confirmedWithEvidence,
});
assert(builtPackage.operationalDecision === 'Support Customer Claim', 'Saved package should store the operational decision explicitly.');
assert(builtPackage.finalFinding === 'Fraud Confirmed', 'Saved package should store the final finding explicitly.');
assert(builtPackage.findingBasis.includes('TXN-SMOKE-001'), 'Saved package should store the evidence-based finding rationale.');
assert(builtPackage.choice === builtPackage.operationalDecision, 'Compatibility choice alias should mirror the operational decision.');
assert(
  JSON.stringify(builtPackage.requiredTools) === JSON.stringify(requiredTools),
  'New packages should persist the routed required-tool contract explicitly.',
);
assert(isValidReviewPackage(cardCase, builtPackage), 'New package should validate against both workflow fields.');

console.log('Review package smoke check passed. Operational decisions and final findings are separate, confirmed fraud requires evidence, checklist weights are coaching-only, and legacy packages remain readable.');
