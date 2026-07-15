export const flagWeightPoints = {
  Critical: 8,
  High: 5,
  Medium: 3,
  Low: 1,
};

function flag(id, type, weight, prompt, evidenceHint, options = {}) {
  return { id, type, weight, prompt, evidenceHint, ...options };
}

const checklistByClaimType = {
  'account-takeover': {
    title: 'Account Takeover decision checklist',
    description: 'Document the access, authentication, profile-control, and transaction evidence that supports or contradicts the customer claim.',
    flags: [
      flag('ato-known-access', 'red', 'High', 'Did the disputed activity use a trusted device, familiar location, and normal customer access pattern?', 'Cite the login, device, IP, and session records that establish the normal pattern.'),
      flag('ato-customer-mfa', 'red', 'High', 'Did the customer approve the MFA, wallet enrollment, or authentication event tied to the activity?', 'Cite the MFA event, destination, timestamp, and customer statement.'),
      flag('ato-no-control-change', 'red', 'Medium', 'Was there no password, contact, MFA, payee, or profile-control change before the disputed activity?', 'Cite the profile and session records covering the reported fraud period.'),
      flag('ato-new-device', 'green', 'High', 'Did a first-seen or unrecognized device access the account during the reported fraud period?', 'Cite the device ID, first-seen date, login, and customer recognition response.'),
      flag('ato-unusual-network', 'green', 'High', 'Did the access come from an unusual IP, location, network, or impossible-travel sequence?', 'Cite the IP record, location history, timestamps, and normal-location comparison.'),
      flag('ato-control-change', 'green', 'High', 'Did a password, contact method, MFA route, payee, or wallet control change occur before the loss?', 'Cite the exact change event and the related transaction or session timeline.'),
    ],
  },
  'fraud-chargeback': {
    title: 'Fraud Chargeback decision checklist',
    description: 'Compare card possession, entry mode, wallet-token, authentication, merchant, and customer evidence.',
    flags: [
      flag('fcb-customer-authentication', 'red', 'High', 'Did authentication and device evidence connect the disputed purchase to the customer?', 'Cite the authorization, 3DS, MFA, wallet token, device, and IP records.'),
      flag('fcb-known-merchant', 'red', 'Medium', 'Was the merchant or purchase pattern established in the customer history?', 'Cite prior transactions, merchant relationship, refunds, or saved account activity.'),
      flag('fcb-fulfillment', 'red', 'High', 'Do delivery, activation, usage, or service records connect the customer to the purchase?', 'Cite the merchant record, delivery or usage record, date, and matching customer field.'),
      flag('fcb-new-token-device', 'green', 'High', 'Was a new wallet token, device, or payment credential used for the disputed activity?', 'Cite the token or device ID, enrollment time, first use, and customer statement.'),
      flag('fcb-card-possession', 'green', 'Medium', 'Did the customer retain the physical card while an unfamiliar digital transaction occurred?', 'Cite the customer statement, card status, entry mode, and transaction record.'),
      flag('fcb-merchant-gap', 'green', 'High', 'Is required merchant authorization or fulfillment evidence missing or inconsistent?', 'Cite the missing requirement, reason code, merchant response, or contradictory record.'),
    ],
  },
  'non-fraud-chargeback': {
    title: 'Non-Fraud Chargeback decision checklist',
    description: 'Apply the dispute reason to the merchant, cancellation, refund, delivery, and customer-contact evidence.',
    flags: [
      flag('ncb-merchant-fulfilled', 'red', 'High', 'Does the merchant packet show the agreed product or service was correctly provided?', 'Cite the receipt, policy, delivery, usage, service, or merchant response record.'),
      flag('ncb-late-cancellation', 'red', 'Medium', 'Was cancellation or refund requested after the charge or outside the applicable terms?', 'Cite the billing date, cancellation date, policy, and customer contact.'),
      flag('ncb-recurring-history', 'red', 'Medium', 'Was the same recurring billing pattern previously accepted without dispute?', 'Cite prior charges, statements, account usage, or customer contacts.'),
      flag('ncb-cancellation-proof', 'green', 'High', 'Is there proof that cancellation or return occurred before the disputed billing?', 'Cite the confirmation, return tracking, merchant message, date, and applicable transaction.'),
      flag('ncb-billing-error', 'green', 'High', 'Do the records show a duplicate, incorrect amount, missing refund, or billing error?', 'Cite both transactions, expected amount, refund record, or merchant acknowledgment.'),
      flag('ncb-required-evidence-gap', 'green', 'Medium', 'Is the merchant missing evidence required for the selected dispute reason?', 'Cite the reason-code requirement and the missing or incomplete merchant document.'),
    ],
  },
  'first-party-fraud': {
    title: 'First-Party Fraud decision checklist',
    description: 'Compare the customer story with authorization, fulfillment, benefit, prior claims, and merchant records.',
    flags: [
      flag('fpf-benefit-delivery', 'red', 'High', 'Do delivery, activation, usage, or benefit records connect the customer to the disputed activity?', 'Cite the matching delivery, device, usage, account, or beneficiary evidence.'),
      flag('fpf-repeat-pattern', 'red', 'High', 'Is there a repeated pattern of similar recent claims, merchants, amounts, or stories?', 'Cite the prior claim IDs, dates, outcomes, and matching pattern.'),
      flag('fpf-story-conflict', 'red', 'High', 'Does the customer statement materially conflict with system, merchant, or contact records?', 'Cite the statement language and each contradictory record.'),
      flag('fpf-isolated-event', 'green', 'Medium', 'Is this an isolated event with no meaningful prior-claim pattern?', 'Cite the prior claims review and the time period searched.'),
      flag('fpf-merchant-gap', 'green', 'High', 'Is merchant authorization, fulfillment, or customer-match evidence missing?', 'Cite the merchant packet requirement and the missing or inconsistent evidence.'),
      flag('fpf-consistent-support', 'green', 'High', 'Is the customer account consistent and supported by independent records?', 'Cite the statement, transaction, contact, delivery, and timeline records that agree.'),
    ],
  },
  'payroll-direct-deposit': {
    title: 'Business Payroll ATO decision checklist',
    description: 'Use the request, employee, destination, callback, mailbox, and payroll timing evidence to decide whether to Hold or Release.',
    flags: [
      flag('payroll-new-destination', 'red', 'Critical', 'Was a new or changed payroll destination requested without trusted employee verification?', 'Cite the destination ID, change request, request time, callback result, and payroll deadline.', { override: true }),
      flag('payroll-requester-mismatch', 'red', 'High', 'Do the requester, email, device, IP, or employee details fail to match trusted records?', 'Cite the mismatched fields and the system-of-record comparison.'),
      flag('payroll-compromised-access', 'red', 'High', 'Is there evidence of mailbox, account, or administrator access compromise before the change?', 'Cite the email, login, session, device, IP, or profile-control events.'),
      flag('payroll-trusted-callback', 'green', 'High', 'Was the change confirmed with the employee or authorized payroll contact using trusted contact data?', 'Cite the callback number source, caller, approver, time, and result.'),
      flag('payroll-known-destination', 'green', 'High', 'Does the destination match established employee ownership and payroll history?', 'Cite account ownership, prior deposits, employee profile, and destination history.'),
      flag('payroll-complete-request', 'green', 'Medium', 'Is the request complete, consistent, and approved through the normal payroll process?', 'Cite the signed request, approval, timing, and required control records.'),
    ],
  },
  'email-bec': {
    title: 'Email Fraud / BEC decision checklist',
    description: 'Use sender, domain, beneficiary, callback, and payment-control evidence to decide whether to Hold or Release.',
    flags: [
      flag('bec-new-beneficiary', 'red', 'Critical', 'Was a new beneficiary or payment destination introduced without trusted callback verification?', 'Cite the beneficiary record, instruction, destination, callback status, and scheduled payment.', { override: true }),
      flag('bec-sender-mismatch', 'red', 'High', 'Do the sender, reply-to, domain, authentication, or message history fail to match the trusted vendor?', 'Cite the email header, domain record, vendor master record, and mismatch.'),
      flag('bec-urgent-control-bypass', 'red', 'High', 'Did urgency or unusual instructions cause the normal payment-change controls to be bypassed?', 'Cite the message language, approval path, callback record, and payment timeline.'),
      flag('bec-trusted-callback', 'green', 'High', 'Was the instruction confirmed through a trusted system-of-record callback?', 'Cite the callback number source, verified contact, time, and result.'),
      flag('bec-known-beneficiary', 'green', 'High', 'Does the beneficiary match an established vendor destination and prior payment history?', 'Cite prior payments, beneficiary ownership, vendor record, and matching account details.'),
      flag('bec-authenticated-message', 'green', 'Medium', 'Do email authentication, sender history, and vendor communication patterns consistently match?', 'Cite SPF/DKIM/DMARC results, domain age, sender history, and message comparison.'),
    ],
  },
  'credit-risk': {
    title: 'Credit Risk decision checklist',
    description: 'Document income, employment, debt, credit, cash-flow, identity, and payment evidence before selecting a credit determination.',
    flags: [
      flag('credit-income-mismatch', 'red', 'High', 'Is stated income unsupported or inconsistent with payroll, deposits, or employer records?', 'Cite the stated amount, verified amount, paystub, deposits, and employer record.'),
      flag('credit-high-dti', 'red', 'High', 'Is debt-to-income, utilization, repayment stress, or payment history outside the applicable standard?', 'Cite the calculation, obligations, utilization, delinquencies, or payment events.'),
      flag('credit-cashflow-risk', 'red', 'High', 'Do overdrafts, returns, volatility, or unexplained deposits weaken repayment support?', 'Cite the statement period, transaction IDs, balances, returns, and cash-flow calculation.'),
      flag('credit-stable-income', 'green', 'High', 'Are income and employment stable and independently supported?', 'Cite payroll deposits, pay frequency, tenure, employer verification, and documents.'),
      flag('credit-manageable-obligations', 'green', 'High', 'Are DTI, utilization, obligations, and payment history within the applicable standard?', 'Cite the DTI calculation, credit summary, and payment history.'),
      flag('credit-complete-documents', 'green', 'Medium', 'Are the required identity, income, bank, and credit documents complete and consistent?', 'Cite each required document and the fields that match.'),
    ],
  },
  'business-loan-bust-out': {
    title: 'Business Loan / Bust-Out decision checklist',
    description: 'Compare entity, owner, revenue, banking, credit, and line-usage evidence before determining the application or exposure action.',
    flags: [
      flag('business-owner-mismatch', 'red', 'High', 'Do business registration, beneficial owner, identity, or bank ownership records conflict?', 'Cite the entity filing, owner KYC, bank ownership, and mismatched fields.'),
      flag('business-revenue-mismatch', 'red', 'High', 'Is stated revenue unsupported by deposits, invoices, contracts, payroll, or tax records?', 'Cite the stated revenue and the records used to verify or contradict it.'),
      flag('business-rapid-exposure', 'red', 'Critical', 'Did the business rapidly increase or draw exposure without matching operating activity?', 'Cite the limit history, draw, transaction timing, revenue, and cash-flow records.', { override: true }),
      flag('business-verified-entity', 'green', 'High', 'Are the entity, owners, address, website, and bank ownership independently verified?', 'Cite registration, owner KYC, address, domain, and bank records.'),
      flag('business-supported-revenue', 'green', 'High', 'Do deposits, invoices, contracts, payroll, and statements support stated business activity?', 'Cite the matching amounts, dates, customers, payroll, and bank records.'),
      flag('business-stable-performance', 'green', 'Medium', 'Does established payment and account history support the requested exposure?', 'Cite account age, payment history, utilization, balances, and prior performance.'),
    ],
  },
  'application-verification': {
    title: 'Application Verification decision checklist',
    description: 'Compare identity, document, selfie, address, phone, email, device, and application records.',
    flags: [
      flag('application-identity-mismatch', 'red', 'Critical', 'Do core identity fields materially conflict across the application and verification records?', 'Cite the name, DOB, identity token, address, phone, email, and source records.', { override: true }),
      flag('application-document-risk', 'red', 'High', 'Is an identity document expired, altered, unreadable, or inconsistent with the application?', 'Cite the document ID, quality result, expiration, and mismatched field.'),
      flag('application-new-identity-cluster', 'red', 'High', 'Are the address, phone, email, or device newly established or linked to unrelated profiles?', 'Cite first-seen dates, ownership results, linked profiles, and application history.'),
      flag('application-full-match', 'green', 'High', 'Do identity fields consistently match across independent sources?', 'Cite the application, identity report, document, address, phone, and email matches.'),
      flag('application-liveness', 'green', 'High', 'Did selfie, document, and liveness verification pass with usable quality?', 'Cite match confidence, liveness result, capture date, and document comparison.'),
      flag('application-stable-contact', 'green', 'Medium', 'Are the address, phone, email, and device established and owned by the applicant?', 'Cite age, ownership, prior history, OTP use, and linked-profile results.'),
    ],
  },
  'ach-wire-check': {
    title: 'ACH / Wire / Check decision checklist',
    description: 'Apply the payment-rail evidence for authorization, ownership, beneficiary, callback, image, and recovery timing.',
    flags: [
      flag('payment-new-destination', 'red', 'Critical', 'Was a new beneficiary, originator, endorsement, or destination used without trusted verification?', 'Cite the payment ID, destination, ownership, callback, endorsement, and approval record.', { override: true }),
      flag('payment-authorization-gap', 'red', 'High', 'Is authorization, account ownership, callback, endorsement, or approval evidence missing or inconsistent?', 'Cite the required control and the missing or contradictory record.'),
      flag('payment-unusual-pattern', 'red', 'High', 'Is the amount, timing, return activity, channel, or payment pattern materially unusual?', 'Cite prior payment history, current transaction, return code, amount, and timing.'),
      flag('payment-trusted-verification', 'green', 'High', 'Was the payment or change verified through trusted contact and approval controls?', 'Cite the system-of-record contact, approver, callback, and release time.'),
      flag('payment-known-destination', 'green', 'High', 'Does the beneficiary, originator, payee, or account match established ownership and history?', 'Cite ownership records, prior payments, templates, and matching names.'),
      flag('payment-clean-record', 'green', 'Medium', 'Do the payment record, return history, or check images show no mismatch or alteration?', 'Cite authorization, return, front/back image, serial, endorsement, and channel records.'),
    ],
  },
};

const defaultChecklist = checklistByClaimType['account-takeover'];

function isDigitalWalletCase(activeCase = {}) {
  return /wallet|token/i.test([
    activeCase.scenarioId,
    activeCase.scenarioTitle,
    activeCase.subtype,
    activeCase.transactionInfo,
    activeCase.allegation,
  ].filter(Boolean).join(' '));
}

export function getDecisionChecklist(activeCase = {}) {
  const base = checklistByClaimType[activeCase.claimTypeId] ?? defaultChecklist;
  const flags = [...base.flags];

  if (['account-takeover', 'fraud-chargeback'].includes(activeCase.claimTypeId) && isDigitalWalletCase(activeCase)) {
    flags.unshift(flag(
      'wallet-chip-during-fraud-window',
      'red',
      'Critical',
      'During the reported fraud period, were any transactions completed using the physical chip card?',
      'Cite the transaction ID, date and time, amount, merchant, EMV chip entry mode, and card-possession evidence.',
      { override: true },
    ));
  }

  return { ...base, flags };
}

export function summarizeDecisionIndicators(activeCase = {}, indicatorAnswers = {}) {
  const checklist = getDecisionChecklist(activeCase);
  const selectedIndicators = checklist.flags
    .filter((item) => indicatorAnswers[item.id]?.selected)
    .map((item) => {
      const answer = indicatorAnswers[item.id] ?? {};
      return {
        ...item,
        points: flagWeightPoints[item.weight] ?? 0,
        proof: String(answer.proof ?? '').trim(),
        explanation: String(answer.explanation ?? '').trim(),
      };
    });
  const incompleteIndicators = selectedIndicators.filter((item) => !item.proof || !item.explanation);
  const red = selectedIndicators.filter((item) => item.type === 'red');
  const green = selectedIndicators.filter((item) => item.type === 'green');

  return {
    checklist,
    selectedIndicators,
    incompleteIndicators,
    selectedCount: selectedIndicators.length,
    redCount: red.length,
    greenCount: green.length,
    redPoints: red.reduce((sum, item) => sum + item.points, 0),
    greenPoints: green.reduce((sum, item) => sum + item.points, 0),
    criticalRedIndicators: red.filter((item) => item.weight === 'Critical'),
    overrideIndicators: red.filter((item) => item.override),
  };
}
