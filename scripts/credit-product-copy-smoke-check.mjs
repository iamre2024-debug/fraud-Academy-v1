import assert from 'node:assert/strict';

import { coreClaimTypes } from '../src/data/claimRegistry.js';
import {
  CUSTOMER_TYPES,
  PRODUCT_TYPES,
  WORKFLOW_TYPES,
  caseDomainLabels,
} from '../src/data/caseDomain.js';
import { trainingCases } from '../src/data/cases.js';
import { migrateGeneratedCase } from '../src/data/caseMigration.js';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import { getPrimaryRelationshipAccount } from '../src/data/relationshipAccounts.js';
import { getSessionRecords } from '../src/data/sessionRecords.js';

const builtIn = trainingCases.find((item) => item.id === 'FA-CR-24003');
assert.ok(builtIn, 'The built-in early credit-line case must remain available.');
assert.equal(builtIn.productType, PRODUCT_TYPES.PERSONAL_LINE_OF_CREDIT);
assert.equal(caseDomainLabels(builtIn).productTypeLabel, 'Personal line of credit');
assert.equal(builtIn.alertReason, '$2,400 credit-line draw requested one day after account opening');
assert.match(builtIn.allegation, /\$2,400 draw.*newly opened personal credit line.*five minutes after.*external payment destination/i);

const builtInAccount = getPrimaryRelationshipAccount(builtIn);
assert.equal(builtInAccount.productType, PRODUCT_TYPES.PERSONAL_LINE_OF_CREDIT);
assert.equal(builtInAccount.productKind, 'revolving-credit-line');
assert.equal(builtInAccount.productLabel, 'Personal Line of Credit');

const builtInSession = getSessionRecords(builtIn).find((item) => item.session === 'SES-9302');
assert.ok(builtInSession, 'The built-in line-of-credit review session must remain available.');
assert.match(JSON.stringify(builtInSession.moneyMovement), /EVT-3308.*Credit-line draw requested/i);
assert.doesNotMatch(JSON.stringify(builtInSession), /PCH-3302.*(?:draw|limit usage|credit request)/i);

const migratedLineCase = migrateGeneratedCase({
  id: 'FA-CR-G-LEGACY-LINE',
  domainSchemaVersion: 2,
  customerType: CUSTOMER_TYPES.PERSONAL,
  productType: PRODUCT_TYPES.PERSONAL_LOAN,
  workflowType: WORKFLOW_TYPES.CREDIT_RISK_REVIEW,
  transactionInfo: 'Credit line usage review after a sudden draw',
  toolResults: {
    relationshipAccounts: [{
      isPrimary: true,
      productType: PRODUCT_TYPES.PERSONAL_LOAN,
      productKind: 'revolving-credit-line',
      productLabel: 'Personal Loan',
      preservedEvidence: 'Learner note must remain unchanged.',
    }],
  },
});
assert.equal(migratedLineCase.productType, PRODUCT_TYPES.PERSONAL_LINE_OF_CREDIT);
assert.equal(migratedLineCase.toolResults.relationshipAccounts[0].productType, PRODUCT_TYPES.PERSONAL_LINE_OF_CREDIT);
assert.equal(migratedLineCase.toolResults.relationshipAccounts[0].productLabel, 'Personal Line of Credit');
assert.equal(migratedLineCase.toolResults.relationshipAccounts[0].preservedEvidence, 'Learner note must remain unchanged.');

const creditClaims = coreClaimTypes.filter((claimType) => (
  [WORKFLOW_TYPES.CREDIT_APPLICATION_REVIEW, WORKFLOW_TYPES.CREDIT_RISK_REVIEW].includes(claimType.id)
));
let generatedCount = 0;

for (const claimType of creditClaims) {
  for (const [scenarioIndex, scenario] of claimType.scenarios.entries()) {
    for (const customerType of scenario.customerTypes) {
      for (const productType of scenario.productTypes) {
        const generated = createGeneratedCase({
          index: 990000 + generatedCount + scenarioIndex,
          customerType,
          productType,
          workflowType: claimType.id,
          scenarioId: scenario.id,
          difficulty: 'deep',
          evidenceDepth: 'deep',
        });
        generatedCount += 1;

        assert.equal(generated.customerType, customerType);
        assert.equal(generated.productType, productType);
        assert.equal(generated.claimDetails, null, `${scenario.id} must not receive card-dispute claim details.`);

        const transactions = generated.toolResults?.transactions ?? [];
        if (claimType.id === WORKFLOW_TYPES.CREDIT_APPLICATION_REVIEW) {
          assert.equal(generated.availableTools.includes('Transaction History'), false, `${scenario.id} must hide Transaction History for an application-only review.`);
          assert.equal(transactions.length, 0, `${scenario.id} must not fabricate a posted transaction.`);
          assert.match(generated.events[0].label, /Application record opened/i);
          assert.match(generated.toolResults.paymentVerification[0].context, /No posted transaction is in scope/i);
        } else {
          assert.ok(transactions.length >= 2, `${scenario.id} must include existing-account history for Credit Risk Review.`);
        }

        const visibleTransactionCopy = transactions.map((item) => `${item.channel} ${item.instrument} ${item.merchant}`).join(' ');
        if ([PRODUCT_TYPES.PERSONAL_LOAN, PRODUCT_TYPES.BUSINESS_LOAN].includes(productType)) {
          assert.doesNotMatch(visibleTransactionCopy, /line of credit|credit-line|line utilization|business credit line/i, `${scenario.id} uses line-of-credit wording for an installment loan.`);
          if (claimType.id === WORKFLOW_TYPES.CREDIT_RISK_REVIEW) {
            assert.match(visibleTransactionCopy, /installment loan|installment-loan/i);
          }
        }
        if ([PRODUCT_TYPES.PERSONAL_LINE_OF_CREDIT, PRODUCT_TYPES.BUSINESS_LINE_OF_CREDIT].includes(productType)) {
          if (claimType.id === WORKFLOW_TYPES.CREDIT_RISK_REVIEW) {
            assert.match(visibleTransactionCopy || generated.transactionInfo, /line of credit|credit-line|line-of-credit/i);
            assert.equal(getPrimaryRelationshipAccount(generated).productKind, 'revolving-credit-line');
          }
        }
        if (productType === PRODUCT_TYPES.PAYROLL_PRODUCT) {
          assert.match(generated.transactionInfo, /Payroll-funding/i);
          if (claimType.id === WORKFLOW_TYPES.CREDIT_RISK_REVIEW) {
            assert.match(visibleTransactionCopy, /Payroll-funding/i);
            assert.doesNotMatch(visibleTransactionCopy, /Direct deposit destination|Prior payroll deposit/i);
          }
        }
        if (customerType === CUSTOMER_TYPES.PERSONAL) {
          assert.doesNotMatch(visibleTransactionCopy, /business (?:credit|installment|line)/i);
          assert.equal(generated.toolResults.paymentVerification[0].accountHolder.includes(generated.profile.business), false);
        }
      }
    }
  }
}

const emailApplication = createGeneratedCase({
  index: 999991,
  customerType: CUSTOMER_TYPES.PERSONAL,
  productType: PRODUCT_TYPES.CREDIT_CARD,
  workflowType: WORKFLOW_TYPES.CREDIT_APPLICATION_REVIEW,
  scenarioId: 'car-scenario-04',
});
assert.match(emailApplication.transactionInfo, /new email and device/i);
assert.doesNotMatch(emailApplication.transactionInfo, /instruction source pending verification/i);

assert.ok(generatedCount > 50, `Expected broad credit product coverage, generated only ${generatedCount} combinations.`);
console.log(`Credit product copy smoke check passed across ${generatedCount} product/scenario combinations.`);
