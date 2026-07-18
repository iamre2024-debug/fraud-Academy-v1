import { expandClaimScenarios } from './claimScenarioCatalog.js';

const commonEvidenceAreas = ['Customer or entity statement', 'Case timeline', 'Related documents', 'Pinned evidence and notes'];

function scenario({ id, title, subtype, summary, statement, channel, amount, transactionInfo, priority = 'Medium', family, entityRole }) {
  return { id, title, subtype, summary, statement, channel, amount, transactionInfo, priority, family, entityRole };
}

const claimTypeDefinitions = [
  {
    id: 'account-takeover',
    label: 'Account Takeover Claim',
    shortLabel: 'Account Takeover',
    prefix: 'ATO',
    lane: 'Account access',
    subtypes: ['credential stuffing', 'phishing', 'OTP phishing', 'vishing', 'SIM swap', 'remote access malware', 'help desk reset abuse', 'session hijack', 'profile change before transfer', 'new payee/external account add', 'wallet enrollment after takeover'],
    intakePrompts: ['What account activity does the customer say they did not authorize?', 'Which alerts, reset messages, or contact attempts were noticed?', 'Which devices and locations does the customer recognize?'],
    evidenceAreas: ['Card possession and customer statement', 'Login, session, device, and IP history', 'Profile and payment activity', ...commonEvidenceAreas],
    availableTools: ['Customer 360', 'Identity Intel / People Search', 'Login History', 'Session History', 'Device Intelligence', 'IP Intelligence', 'Transaction History', 'Financial Investigation', 'Payment Verification', 'Document Viewer', 'Document Request', 'Link Analysis', 'Timeline'],
    requiredTools: ['Case Summary', 'Customer 360', 'Login History', 'Session History', 'Device Intelligence', 'IP Intelligence', 'Transaction History', 'Document Viewer', 'Link Analysis'],
    documents: ['Customer statement', 'Login and session packet', 'Authorization record', 'Requested supporting document'],
    taxonomy: { authorizationType: 'unauthorized', lifecycleStage: 'login', productRail: 'card', riskPattern: 'cyber compromise', customerRole: 'victim' },
    scenarios: [
      scenario({ id: 'ato-phishing-wallet', title: 'New wallet and account access review', subtype: 'phishing', summary: 'Customer reports unfamiliar account access and card activity after receiving a message that appeared to be from the bank.', statement: 'I received a message about my account, signed in, and later saw activity I do not recognize.', channel: 'Secure message + phone follow-up', amount: '$742.18', transactionInfo: 'Digital marketplace purchase · card not present · training card ending 2209', priority: 'High', entityRole: 'Consumer account holder' }),
      scenario({ id: 'ato-session-control', title: 'Session and profile access review', subtype: 'session hijack', summary: 'A system alert grouped account access, profile activity, and a disputed transaction for neutral review.', statement: 'I noticed a card transaction after checking my account from my regular phone.', channel: 'Mobile app claim form', amount: '$486.22', transactionInfo: 'Online retail purchase · card not present · training card ending 5106', priority: 'High', entityRole: 'Consumer account holder' }),
    ],
  },
  {
    id: 'fraud-chargeback',
    label: 'Fraud Chargeback Claim',
    shortLabel: 'Fraud Chargeback',
    prefix: 'FCB',
    lane: 'Card dispute',
    subtypes: ['lost card', 'stolen card', 'never received card', 'counterfeit/skimming', 'CNP fraud', 'digital wallet token fraud', 'ATM/POS fraud', 'unauthorized online purchase'],
    intakePrompts: ['When did the cardholder notice the charge and when might the issue have started?', 'Was the card lost or stolen, and was it still in the cardholder possession?', 'Did anyone else have access to the card or PIN?', 'Is a digital wallet in use, and what was the last valid transaction?', 'Did the cardholder contact the merchant or travel near the transaction date?'],
    evidenceAreas: ['Card possession timeline', 'Authorization and entry mode', 'Wallet token history', 'Merchant and cardholder records', 'Prior claims and last valid transaction', ...commonEvidenceAreas],
    availableTools: ['Customer 360', 'Transaction History', 'Merchant Intelligence', 'Financial Investigation', 'Payment Verification', 'Login History', 'Session History', 'Device Intelligence', 'Document Viewer', 'Document Request', 'Link Analysis', 'Timeline'],
    requiredTools: ['Case Summary', 'Customer 360', 'Transaction History', 'Merchant Intelligence', 'Payment Verification', 'Document Viewer', 'Link Analysis'],
    documents: ['Cardholder statement', 'Authorization record', 'Merchant packet', 'Card status record'],
    taxonomy: { authorizationType: 'unauthorized', lifecycleStage: 'transaction', productRail: 'card', riskPattern: 'identity', customerRole: 'victim' },
    chargeback: {
      reasonCode: 'Training card-not-present unauthorized transaction review',
      responseDeadline: 'Jul 15, 2026 · 3:00 PM',
      merchantEvidence: 'Merchant order, account-login, AVS/CVV, device, and IP records',
      authorizationReview: 'Authorization time, entry mode, wallet token, and authentication context',
      fulfillmentReview: 'Delivery or service records when they are present in the packet',
      customerContact: 'Cardholder statement, card possession timeline, and merchant-contact history',
    },
    scenarios: [
      scenario({ id: 'fcb-cnp-purchase', title: 'Unrecognized online card purchase', subtype: 'CNP fraud', summary: 'Cardholder reports an online card purchase they do not recognize. Card, authorization, and access records are available for review.', statement: 'I do not recognize this online purchase and still have my physical card.', channel: 'Phone claim intake', amount: '$328.64', transactionInfo: 'Online merchant purchase · card not present · training card ending 4410', priority: 'High', entityRole: 'Cardholder' }),
      scenario({ id: 'fcb-wallet-token', title: 'Digital wallet card activity review', subtype: 'digital wallet token fraud', summary: 'Cardholder reports unfamiliar card activity after a new wallet token event appeared in the training packet.', statement: 'I saw a card transaction after an alert about a wallet I did not add.', channel: 'Secure message', amount: '$512.09', transactionInfo: 'Digital wallet purchase · tokenized card payment · training card ending 7734', priority: 'High', entityRole: 'Cardholder' }),
    ],
  },
  {
    id: 'non-fraud-chargeback',
    label: 'Non-Fraud Chargeback Claim',
    shortLabel: 'Non-Fraud Chargeback',
    prefix: 'NCB',
    lane: 'Card dispute',
    subtypes: ['incorrect amount', 'duplicate billing', 'refund not received', 'canceled service billed', 'item not as described', 'services not rendered', 'return credit not posted', 'subscription terms dispute'],
    intakePrompts: ['What did the customer purchase, cancel, return, or ask the merchant to refund?', 'When did the customer first notice the billing issue?', 'What contact has already occurred with the merchant?', 'Which receipt, policy, delivery, return, or refund records are available?', 'Which dispute reason and required evidence should be documented?'],
    evidenceAreas: ['Receipt or invoice', 'Merchant response', 'Cancellation or refund policy', 'Return tracking or proof of delivery', 'Customer contact with merchant', 'Reason code guide', ...commonEvidenceAreas],
    availableTools: ['Customer 360', 'Transaction History', 'Merchant Intelligence', 'Financial Investigation', 'Business 360', 'KYB Review', 'Payment Verification', 'Document Viewer', 'Document Request', 'Link Analysis', 'Timeline'],
    requiredTools: ['Case Summary', 'Customer 360', 'Transaction History', 'Merchant Intelligence', 'Business 360', 'Document Viewer', 'Document Request'],
    documents: ['Customer dispute form', 'Merchant billing packet', 'Cancellation or refund evidence', 'Reason code guide'],
    taxonomy: { authorizationType: 'authorized', lifecycleStage: 'dispute', productRail: 'card', riskPattern: 'behavior', customerRole: 'victim' },
    chargeback: {
      reasonCode: 'Training canceled-service / recurring billing review',
      responseDeadline: 'Jul 15, 2026 · 3:00 PM',
      merchantEvidence: 'Merchant billing history, policy, response, and prior customer-contact records',
      authorizationReview: 'Authorization and recurring-billing setup records',
      fulfillmentReview: 'Cancellation, refund, return, shipping, or service-delivery records',
      customerContact: 'Customer statement, merchant-contact timeline, and requested outcome',
    },
    scenarios: [
      scenario({ id: 'ncb-recurring-cancellation', title: 'Recurring billing after cancellation', subtype: 'canceled service billed', summary: 'Cardholder reports recurring billing after cancellation. Merchant history, policy, and supporting documents are available for review.', statement: 'I canceled the service and continued to see the same charge on my statement.', channel: 'Mobile app dispute form', amount: '$189.44', transactionInfo: 'Subscription merchant billing · recurring card payment · training card ending 8841', priority: 'Medium', entityRole: 'Cardholder' }),
      scenario({ id: 'ncb-duplicate-billing', title: 'Duplicate merchant billing review', subtype: 'duplicate billing', summary: 'A customer reports two similar merchant charges and asks for the billing records to be reviewed.', statement: 'I believe I was billed twice for the same purchase.', channel: 'Secure message', amount: '$214.89', transactionInfo: 'Retail merchant billing · two posted card payments · training card ending 7712', priority: 'Medium', entityRole: 'Cardholder' }),
    ],
  },
  {
    id: 'first-party-fraud',
    label: 'First-Party Fraud Claim',
    shortLabel: 'First-Party Fraud',
    prefix: 'FPF',
    lane: 'Consumer claim review',
    subtypes: ['friendly fraud', 'household member use', 'digital goods used', 'delivery proof conflicts with claim', 'repeated non-receipt pattern', 'refund/return abuse', 'dispute after usage'],
    intakePrompts: ['What does the customer say occurred?', 'What purchase, delivery, or prior claim records are in scope?', 'Which records should be requested before documenting a conclusion?'],
    evidenceAreas: ['Customer statement', 'Order, authorization, and delivery records', 'Prior claims pattern', 'Merchant contact and refund history', ...commonEvidenceAreas],
    availableTools: ['Customer 360', 'Transaction History', 'Merchant Intelligence', 'Financial Investigation', 'Payment Verification', 'Business 360', 'KYB Review', 'Document Viewer', 'Document Request', 'Link Analysis', 'Timeline'],
    requiredTools: ['Case Summary', 'Customer 360', 'Transaction History', 'Merchant Intelligence', 'Document Viewer', 'Link Analysis'],
    documents: ['Customer statement', 'Order record', 'Delivery or service record', 'Prior claim summary'],
    taxonomy: { authorizationType: 'unclear', lifecycleStage: 'dispute', productRail: 'card', riskPattern: 'first-party', customerRole: 'both' },
    scenarios: [
      scenario({ id: 'fpf-delivery-review', title: 'Delivery and prior claim review', subtype: 'false dispute after delivery', summary: 'A card dispute packet contains customer, merchant, delivery, and prior activity records for neutral comparison.', statement: 'I did not receive the item and want the transaction reviewed.', channel: 'Card dispute intake', amount: '$638.40', transactionInfo: 'Retail purchase dispute · delivery record available · training card ending 9088', priority: 'Medium', entityRole: 'Cardholder' }),
    ],
  },
  {
    id: 'payroll-direct-deposit',
    label: 'Payroll / Direct Deposit Change Claim',
    shortLabel: 'Payroll / Direct Deposit',
    prefix: 'PAY',
    lane: 'Payroll and employer review',
    subtypes: ['spoofed employee email', 'compromised employee email', 'fake new-hire payroll setup', 'payroll admin portal compromise', 'existing employee destination changed', 'payroll card diversion', 'ghost employee payroll'],
    intakePrompts: ['Who requested the payroll or destination change?', 'Is the employee or vendor new or established?', 'Which trusted contact can verify the request?'],
    evidenceAreas: ['Employee and employer relationship', 'Payroll and destination history', 'Trusted callback record', 'Payment verification', 'Payroll change timing', ...commonEvidenceAreas],
    availableTools: ['Business 360', 'KYB Review', 'Employee Profile', 'Payroll History', 'Financial Investigation', 'Payment Verification', 'Identity Intel / People Search', 'Login History', 'Session History', 'Device Intelligence', 'IP Intelligence', 'Document Viewer', 'Document Request', 'Link Analysis', 'Timeline'],
    requiredTools: ['Case Summary', 'Business 360', 'Employee Profile', 'Payroll History', 'Payment Verification', 'Document Viewer'],
    documents: ['Payroll change request', 'Employee profile record', 'Trusted callback log', 'Direct deposit record'],
    taxonomy: { authorizationType: 'unclear', lifecycleStage: 'servicing/account management', productRail: 'payroll', riskPattern: 'vendor compromise', customerRole: 'unknown' },
    scenarios: [
      scenario({ id: 'pay-direct-deposit-change', title: 'Employee direct deposit change review', subtype: 'employee direct deposit change', summary: 'An employer inquiry and payroll packet show a direct deposit change before the next payroll run.', statement: 'I received a notice that my pay destination changed, but I did not submit a new form.', channel: 'Employer inquiry', amount: '$2,860.00', transactionInfo: 'Payroll destination update · employee direct deposit · training destination ending 0042', priority: 'High', entityRole: 'Employee' }),
    ],
  },
  {
    id: 'email-bec',
    label: 'Email Fraud / BEC Claim',
    shortLabel: 'Email Fraud / BEC',
    prefix: 'BEC',
    lane: 'Email and payment instruction review',
    subtypes: ['vendor bank change', 'look-alike domain', 'mailbox compromise', 'CEO urgent payment', 'invoice diversion', 'reply-to mismatch', 'mailbox rule forwarding', 'beneficiary change before payment'],
    intakePrompts: ['Who sent or approved the payment instruction?', 'Which trusted contact details were used for verification?', 'What email, domain, beneficiary, and payment records are available?'],
    evidenceAreas: ['Email and domain records', 'Sender and callback details', 'Beneficiary and payment timeline', 'Vendor or employee relationship', ...commonEvidenceAreas],
    availableTools: ['Identity Intel / People Search', 'Payment Verification', 'Business 360', 'KYB Review', 'Login History', 'Session History', 'Device Intelligence', 'IP Intelligence', 'Transaction History', 'Financial Investigation', 'Document Viewer', 'Document Request', 'Link Analysis', 'Timeline'],
    requiredTools: ['Case Summary', 'Identity Intel / People Search', 'Payment Verification', 'Business 360', 'Document Viewer', 'Link Analysis'],
    documents: ['Email message packet', 'Vendor master record', 'Trusted callback log', 'Payment instruction record'],
    taxonomy: { authorizationType: 'unclear', lifecycleStage: 'transaction', productRail: 'wire', riskPattern: 'vendor compromise', customerRole: 'victim' },
    scenarios: [
      scenario({ id: 'bec-vendor-change', title: 'Vendor payment instruction review', subtype: 'vendor payment change', summary: 'A business reports an email-based request to change a vendor payment destination before a scheduled payment.', statement: 'The payment instruction looked like it came from our vendor, but the destination details were different.', channel: 'Business operations inquiry', amount: '$8,450.00', transactionInfo: 'Vendor payment instruction · external destination update · training destination ending 8412', priority: 'High', entityRole: 'Business contact' }),
    ],
  },
  {
    id: 'credit-risk',
    label: 'Credit Risk Review',
    shortLabel: 'Credit Risk',
    prefix: 'CR',
    lane: 'Credit decision review',
    subtypes: ['credit line increase', 'income inflation', 'first-payment default concern', 'repayment stress', 'bust-out concern', 'synthetic identity concern', 'fake application', 'loan stacking', 'business revenue mismatch', 'first-party credit abuse'],
    intakePrompts: ['What type of credit request or account review opened this case?', 'What employer, income source, gross/net income, or business revenue was stated?', 'What payment, utilization, NSF, late-payment, or cash-flow history is available?', 'Are bank statements, paystubs, credit-file, or business documents available?', 'What debt obligations, bankruptcy/public-record, or business changes should be documented?', 'Which documents and verification records are still needed?'],
    evidenceAreas: ['Identity and application records', 'Income and employment verification', 'DTI and credit report summary', 'Cash flow, bank statements, payment history, utilization, and inquiries', 'Document request status', ...commonEvidenceAreas],
    availableTools: ['Customer 360', 'Identity Intel / People Search', 'Payment Verification', 'Financial Investigation', 'Transaction History', 'Business 360', 'KYB Review', 'Employee Profile', 'Payroll History', 'Document Viewer', 'Document Request', 'Link Analysis', 'Timeline'],
    requiredTools: ['Case Summary', 'Customer 360', 'Identity Intel / People Search', 'Payment Verification', 'Financial Investigation', 'Document Viewer'],
    documents: ['Credit review alert', 'Income or revenue support', 'Bank statement', 'Credit file summary', 'Document request tracker'],
    taxonomy: { authorizationType: 'unclear', lifecycleStage: 'onboarding', productRail: 'credit', riskPattern: 'credit stress', customerRole: 'unknown' },
    credit: { deadline: 'Jul 15, 2026 · 4:00 PM', reasonCode: 'Training credit review documentation', adverseActionStatus: 'Not started', escalationPath: 'Senior credit review', outcomes: ['Support Credit Request', 'Do Not Support Credit Request', 'More Information Needed', 'Maintain Account', 'Reduce Exposure', 'Refer to Collections or Hardship', 'Refer to Fraud Review', 'Escalate Senior Review'] },
    scenarios: [
      scenario({ id: 'cr-new-consumer', title: 'New consumer credit request review', subtype: 'credit line increase', family: 'New consumer application', summary: 'A new consumer credit profile requested rapid line usage. Identity, payment, income, and early account records are available for review.', statement: 'I recently opened the account and requested access to the available credit line.', channel: 'System alert', amount: '$2,400.00', transactionInfo: 'Credit line usage request · payment setup packet · training Destination ID token', priority: 'Medium', entityRole: 'Credit applicant' }),
      scenario({ id: 'cr-existing-consumer', title: 'Existing consumer account review', subtype: 'repayment stress', family: 'Existing consumer account review', summary: 'An existing account review groups payment history, cash-flow context, utilization, and documents for a neutral credit decision review.', statement: 'I am asking to keep the account available while my recent payment situation changes.', channel: 'Account monitoring queue', amount: '$4,800.00', transactionInfo: 'Existing credit account review · utilization and payment history · training account ending 3011', priority: 'Medium', entityRole: 'Existing account holder' }),
      scenario({ id: 'cr-new-business', title: 'New business credit application review', subtype: 'business revenue mismatch', family: 'New business application', summary: 'A new business credit application includes entity, owner, revenue, bank, and document records for review.', statement: 'Our business is applying for a credit line to support operating expenses.', channel: 'Business credit application', amount: '$18,000.00', transactionInfo: 'Business credit request · stated revenue packet · training business account ending 7280', priority: 'High', entityRole: 'Business applicant' }),
      scenario({ id: 'cr-existing-business', title: 'Existing business exposure review', subtype: 'bust-out concern', family: 'Existing business account review', summary: 'An existing business account review includes deposits, payment performance, entity changes, and exposure records.', statement: 'The business requests continued access while revenue and payment activity are reviewed.', channel: 'Portfolio monitoring queue', amount: '$22,500.00', transactionInfo: 'Business credit exposure review · payment and revenue packet · training line ending 8840', priority: 'High', entityRole: 'Business account owner' }),
    ],
  },
  {
    id: 'business-loan-bust-out',
    label: 'Business Loan / Bust-Out Review',
    shortLabel: 'Business Loan / Bust-Out',
    prefix: 'BLO',
    lane: 'Business credit review',
    subtypes: ['sleeper LLC sudden draw', 'rapid credit line stacking', 'synthetic owner identity', 'tradeline piggyback business application', 'revenue mismatch', 'large draws after limit increase', 'business legitimacy mismatch'],
    intakePrompts: ['What business credit event opened this review?', 'Which owner, revenue, entity, and account records are in scope?', 'Which documents are complete and which remain requested?'],
    evidenceAreas: ['Business registration and owner identity', 'Revenue, cash flow, and bank statements', 'Credit report and invoices/contracts', 'Beneficial ownership and business address', ...commonEvidenceAreas],
    availableTools: ['Business 360', 'KYB Review', 'Identity Intel / People Search', 'Financial Investigation', 'Transaction History', 'Payment Verification', 'Document Viewer', 'Document Request', 'Link Analysis', 'Timeline'],
    requiredTools: ['Case Summary', 'Business 360', 'KYB Review', 'Financial Investigation', 'Document Viewer', 'Document Request'],
    documents: ['Business registration packet', 'Owner identity record', 'Revenue support', 'Bank statement and invoice packet'],
    taxonomy: { authorizationType: 'unclear', lifecycleStage: 'onboarding', productRail: 'loan', riskPattern: 'credit stress', customerRole: 'unknown' },
    credit: { deadline: 'Jul 16, 2026 · 12:00 PM', reasonCode: 'Training business-credit documentation', adverseActionStatus: 'Not started', escalationPath: 'Business credit review', outcomes: ['Approve Application', 'Deny Application', 'Approve With Restrictions', 'Request Documents', 'Hold Pending Verification', 'Escalate to Credit Risk', 'Refer to Fraud Review'] },
    scenarios: [
      scenario({ id: 'blo-sudden-draw', title: 'Business credit draw and revenue review', subtype: 'large draw after limit increase', summary: 'A business credit packet contains entity, owner, revenue, bank, and line-usage records following a recent draw.', statement: 'The business needs access to its approved line for a seasonal operating expense.', channel: 'Business credit monitoring', amount: '$31,200.00', transactionInfo: 'Business credit draw · line increase history · training business line ending 6180', priority: 'High', entityRole: 'Business owner' }),
    ],
  },
  {
    id: 'application-verification',
    label: 'Application Verification Review',
    shortLabel: 'Application Verification',
    prefix: 'AVR',
    lane: 'Identity and application review',
    subtypes: ['ID mismatch', 'address cannot be verified', 'thin identity profile', 'new email and new device', 'selfie/liveness mismatch', 'phone ownership mismatch', 'synthetic identity concern', 'stolen identity application'],
    intakePrompts: ['What application field or document needs verification?', 'Which identity, address, phone, email, or device records are available?', 'What document or verification step remains open?'],
    evidenceAreas: ['Profile and application fields', 'Identity document and selfie/liveness records', 'Address, phone, and email verification', 'Device and IP context', ...commonEvidenceAreas],
    availableTools: ['Customer 360', 'Identity Intel / People Search', 'Device Intelligence', 'IP Intelligence', 'Login History', 'Payment Verification', 'Document Viewer', 'Document Request', 'Link Analysis', 'Timeline'],
    requiredTools: ['Case Summary', 'Customer 360', 'Identity Intel / People Search', 'Device Intelligence', 'IP Intelligence', 'Document Viewer'],
    documents: ['Application record', 'Identity document review', 'Address verification record', 'Phone and email verification'],
    taxonomy: { authorizationType: 'unclear', lifecycleStage: 'onboarding', productRail: 'credit', riskPattern: 'document risk', customerRole: 'unknown' },
    scenarios: [
      scenario({ id: 'avr-address-device', title: 'Application identity and address review', subtype: 'address cannot be verified', summary: 'An application packet contains identity, address, contact, device, and document records requiring verification.', statement: 'I submitted the application using my current contact information and address.', channel: 'Application verification queue', amount: '$0.00', transactionInfo: 'New application profile · identity and address packet · no transaction in scope', priority: 'Medium', entityRole: 'Applicant' }),
    ],
  },
  {
    id: 'ach-wire-check',
    label: 'ACH / Wire / Check Review',
    shortLabel: 'ACH / Wire / Check',
    prefix: 'AWC',
    lane: 'Payment rail review',
    subtypes: ['ACH unauthorized return', 'wire beneficiary change', 'check alteration', 'check endorsement concern', 'payment recovery review'],
    intakePrompts: ['Which payment rail and transaction is in scope?', 'Who requested, approved, or released the payment?', 'Which beneficiary, callback, or payment records need verification?'],
    evidenceAreas: ['Payment request and approval timeline', 'Beneficiary or originator details', 'Callback and trusted contact record', 'ACH/wire/check transaction history', ...commonEvidenceAreas],
    availableTools: ['Transaction History', 'Financial Investigation', 'Payment Verification', 'Identity Intel / People Search', 'Business 360', 'KYB Review', 'Document Viewer', 'Document Request', 'Link Analysis', 'Timeline'],
    requiredTools: ['Case Summary', 'Transaction History', 'Payment Verification', 'Document Viewer', 'Document Request', 'Link Analysis'],
    documents: ['Payment instruction', 'Beneficiary or originator record', 'Callback verification log', 'Payment rail record'],
    taxonomy: { authorizationType: 'unclear', lifecycleStage: 'transaction', productRail: 'wire', riskPattern: 'vendor compromise', customerRole: 'unknown' },
    scenarios: [
      scenario({ id: 'awc-wire-beneficiary', title: 'Wire beneficiary change review', subtype: 'wire beneficiary change', summary: 'A payment queue contains an updated beneficiary instruction, payment timeline, and verification records.', statement: 'Our team received a request to send the payment to a different beneficiary account.', channel: 'Payments operations queue', amount: '$12,750.00', transactionInfo: 'Wire payment instruction · beneficiary destination update · training destination ending 0917', priority: 'High', entityRole: 'Business payment contact' }),
    ],
  },
];

export const coreClaimTypes = claimTypeDefinitions.map(expandClaimScenarios);

export const coreClaimTypeIds = coreClaimTypes.map((claimType) => claimType.id);

const legacyClaimTypeIds = {
  'account takeover': 'account-takeover',
  'account takeover claim': 'account-takeover',
  'chargeback claim': 'non-fraud-chargeback',
  'fraud chargeback claim': 'fraud-chargeback',
  'non-fraud chargeback claim': 'non-fraud-chargeback',
  'first party fraud': 'first-party-fraud',
  'first-party fraud claim': 'first-party-fraud',
  'email fraud': 'email-bec',
  'email fraud / bec claim': 'email-bec',
  'payroll risk review': 'payroll-direct-deposit',
  'payroll / direct deposit change claim': 'payroll-direct-deposit',
  'credit risk review': 'credit-risk',
  'business loan / bust-out review': 'business-loan-bust-out',
  'application verification review': 'application-verification',
  'ach / wire / check review': 'ach-wire-check',
};

export function getClaimType(claimTypeId) {
  return coreClaimTypes.find((item) => item.id === claimTypeId) ?? coreClaimTypes[0];
}

export function claimTypeIdForCase(item = {}) {
  if (item.claimTypeId && coreClaimTypeIds.includes(item.claimTypeId)) return item.claimTypeId;
  return legacyClaimTypeIds[String(item.type ?? item.claimType ?? '').trim().toLowerCase()] ?? 'account-takeover';
}

export function getClaimTypeForCase(item = {}) {
  return getClaimType(claimTypeIdForCase(item));
}

export function getScenario(claimTypeId, scenarioId) {
  const claimType = getClaimType(claimTypeId);
  return claimType.scenarios.find((item) => item.id === scenarioId) ?? claimType.scenarios[0];
}

export function claimGeneratorChoices() {
  return coreClaimTypes.map((claimType) => ({
    id: claimType.id,
    label: claimType.label,
    lane: claimType.lane,
    hideScenarioAnswer: ['payroll-direct-deposit', 'email-bec'].includes(claimType.id),
    scenarios: claimType.scenarios.map((item) => ({ id: item.id, title: item.title, subtype: item.subtype })),
  }));
}
