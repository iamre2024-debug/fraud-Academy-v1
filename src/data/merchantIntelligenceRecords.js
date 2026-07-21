// Scenario-aware merchant, network, and document packet builder.
import { getEvidenceRecords, getFinancialRecords } from './caseToolData.js';

export const merchantIntelligenceTabs = [
  { id: 'claim-details', label: 'Claim Details' },
  { id: 'network-submission', label: 'Network Submission' },
  { id: 'merchant-response', label: 'Merchant Response' },
  { id: 'customer-evidence', label: 'Customer Evidence' },
  { id: 'visa-requirements', label: 'Visa Requirements' },
  { id: 'case-status', label: 'Case Status' },
];

function stableNumber(value = '') {
  return [...String(value)].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) % 100000, 17);
}

function merchantCategory(name = '', channel = '') {
  if (/stream|subscription|recurring/i.test(`${name} ${channel}`)) return ['4899', 'Digital subscription services'];
  if (/air|flight|travel|hotel|lodging/i.test(`${name} ${channel}`)) return ['4722', 'Travel services'];
  if (/restaurant|food|table/i.test(name)) return ['5812', 'Eating places and restaurants'];
  if (/digital|online|marketplace/i.test(`${name} ${channel}`)) return ['5734', 'Digital goods and online retail'];
  return ['5399', 'General merchandise'];
}

function merchantNameFor(activeCase, transactions = [], generated = {}) {
  return generated.profile?.name ?? transactions[0]?.merchant ?? activeCase.transactionInfo?.split(/[·-]/)[0]?.trim() ?? 'Training merchant';
}

function scenarioFor(activeCase = {}, merchantName = '') {
  const source = [activeCase.claimTypeId, activeCase.subtype, activeCase.scenarioTitle, activeCase.scenarioFamily, activeCase.statement?.value, activeCase.chargebackDecision?.reasonCode, merchantName].filter(Boolean).join(' ');
  const subtype = String(activeCase.subtype ?? '');
  if (activeCase.claimTypeId === 'fraud-chargeback') return {
    id: 'unauthorized-transaction', label: 'Unauthorized transaction dispute',
    customerRequirements: ['Customer fraud statement', 'Card possession and recognition details', 'Recognized device or wallet information', 'Prior merchant relationship, if any', 'Relevant account-security documentation'],
    visaRequirements: ['Transaction authorization data is reviewed', 'Card-present, wallet, or card-not-present indicators are identified', 'Merchant order and fulfillment records are compared', 'Customer recognition and prior merchant history are documented', 'Filing and response deadlines remain open'],
  };
  if (/refund not|credit not|return credit|refund\/return abuse/i.test(source)) return {
    id: 'credit-not-processed', label: /abuse/i.test(subtype) ? 'Refund or return dispute' : 'Credit or refund not processed',
    customerRequirements: ['Return or cancellation receipt', 'Promised refund amount and date', 'Original purchase record', 'Merchant communication confirming the credit', 'Statement showing the credit is absent'],
    visaRequirements: ['Original transaction and expected credit are linked', 'Merchant promised or issued a credit', 'Expected credit processing time has passed', 'Account history is checked for a posted credit', 'Filing and response deadlines remain open'],
  };
  if (/digital goods used|dispute after usage/i.test(subtype)) return {
    id: 'usage-dispute', label: 'Digital goods or service usage dispute',
    customerRequirements: ['Customer statement describing the disputed purchase', 'Recognized account and device details', 'Any household-member access information', 'Merchant contact attempting resolution', 'Relevant cancellation or refund communication'],
    visaRequirements: ['Transaction authorization data is reviewed', 'Merchant account identity is compared with the customer', 'Download, login, playback, or service-usage records are reviewed', 'Prior merchant history is documented', 'Filing and response deadlines remain open'],
  };
  if (/cancel|recurring|subscription|renewal/i.test(source)) return {
    id: 'recurring-cancellation', label: 'Recurring billing dispute',
    customerRequirements: ['Cancellation confirmation or receipt', 'Date and method of cancellation', 'Email, chat, or call proof', 'Evidence cancellation occurred before renewal', 'Any merchant acknowledgement'],
    visaRequirements: ['Disputed transaction and cancellation date are identified', 'Customer attempted cancellation before the billed service period', 'Merchant cancellation or refund terms are documented', 'Customer and merchant communications are preserved', 'Filing and response deadlines remain open'],
  };
  if (/not received|non.?receipt|delivery|merchandise.*missing/i.test(source)) return {
    id: 'merchandise-not-received', label: 'Merchandise not received',
    customerRequirements: ['Order confirmation or receipt', 'Expected delivery date and address', 'Merchant contact attempting resolution', 'Statement that goods were not received', 'Any carrier or delivery communication'],
    visaRequirements: ['Transaction and purchased merchandise are identified', 'Expected delivery date has passed', 'Delivery evidence is compared with the customer address', 'Customer attempted merchant resolution when required', 'Response deadline remains open'],
  };
  if (/service.*not|not provided|quality|not as described/i.test(source)) return {
    id: 'service-dispute', label: /not as described|quality/i.test(source) ? 'Service not as described' : 'Service not provided',
    customerRequirements: ['Service agreement, booking, or receipt', 'Expected service date and location', 'Description of what was not provided', 'Merchant contact attempting resolution', 'Photos, messages, or supporting records when relevant'],
    visaRequirements: ['Purchased service and service date are identified', 'Merchant fulfillment evidence is reviewed', 'Customer description is specific to the disputed service', 'Cancellation or refund terms are documented', 'Filing and response deadlines remain open'],
  };
  if (/duplicate|incorrect amount|altered amount|amount difference/i.test(source)) return {
    id: /duplicate/i.test(source) ? 'duplicate-processing' : 'incorrect-amount', label: /duplicate/i.test(source) ? 'Duplicate processing dispute' : 'Incorrect amount dispute',
    customerRequirements: ['Customer receipt or agreed amount', 'Both transaction dates and amounts', 'Proof only one purchase was made', 'Merchant contact attempting correction', 'Any refund or reversal record'],
    visaRequirements: ['Transactions are matched by amount, date, and merchant', 'Separate purchases are ruled in or out using receipts', 'Authorization and settlement records are compared', 'Any refund or reversal is accounted for', 'Filing and response deadlines remain open'],
  };
  const fraudSource = source.replace(/non[- ]?fraud(?: chargeback)?/gi, '');
  if (/fraud|unauthor|card.?not.?present|lost|stolen|wallet/i.test(fraudSource)) return {
    id: 'unauthorized-transaction', label: 'Unauthorized transaction dispute',
    customerRequirements: ['Customer fraud statement', 'Card possession and recognition details', 'Recognized device or wallet information', 'Prior merchant relationship, if any', 'Relevant account-security documentation'],
    visaRequirements: ['Transaction authorization data is reviewed', 'Card-present, wallet, or card-not-present indicators are identified', 'Merchant order and fulfillment records are compared', 'Customer recognition and prior merchant history are documented', 'Filing and response deadlines remain open'],
  };
  return {
    id: 'general-chargeback', label: activeCase.subtype || 'Merchant dispute',
    customerRequirements: ['Transaction receipt or order confirmation', 'Clear description of the dispute', 'Merchant contact attempting resolution', 'Relevant cancellation, return, or service dates', 'Supporting customer communication'],
    visaRequirements: ['Disputed transaction is identified', 'Claim category matches the customer allegation', 'Merchant response and supporting documents are reviewed', 'Missing customer evidence is requested', 'Filing and response deadlines remain open'],
  };
}

function documentBase({ id, title, source, kind, brand, department, date, reference, classification, mark, ...rest }) {
  return { id, title, source, kind, brand, department, date, reference, classification, mark, status: 'Available', icon: kind === 'email' ? 'MSG' : kind === 'log' ? 'LOG' : 'DOC', ...rest };
}

function transactionRows(transactions = [], merchantName, activeCase) {
  const source = transactions.length ? transactions : [{ posted: activeCase.reportedDate, merchant: merchantName, amount: activeCase.amount, status: 'Posted', channel: activeCase.lane }];
  return source.slice(0, 6).map((item) => [item.posted ?? 'Training date', item.merchant ?? merchantName, item.amount ?? activeCase.amount, item.status ?? 'Posted', item.channel ?? 'Card transaction']);
}

function buildMerchantDocuments({ activeCase, profile, scenario, transactions, responseDate, responseStatus, cancellationDate }) {
  const currentAmount = transactions[0]?.amount ?? activeCase.amount ?? '$0.00';
  const currentDate = transactions[0]?.posted ?? activeCase.reportedDate ?? 'Training date';
  const merchant = profile.name;
  const common = [documentBase({
    id: `${activeCase.id}-MER-RSP`, title: 'Merchant response letter', source: merchant, kind: 'letter', brand: merchant, department: 'Disputes & Account Services', mark: profile.mark, date: responseDate, reference: `MR-${String(stableNumber(activeCase.id)).padStart(5, '0')}`, classification: 'MERCHANT RESPONSE', subject: `${scenario.label} · ${currentAmount} · ${currentDate}`, to: 'Card issuer disputes team', salutation: 'To the reviewing disputes specialist:',
    paragraphs: responseStatus === 'Accepted'
      ? [`${merchant} reviewed the disputed transaction and accepted the chargeback through the card-network response channel.`, 'The account and transaction references used for the response appear below. Any credit timing should be confirmed in the issuer account record.']
      : responseStatus === 'Pending'
        ? ['A complete merchant response has not been received. This placeholder records the submission reference and response deadline only.']
        : [`${merchant} reviewed the disputed transaction and is challenging the chargeback. The enclosed records reflect the merchant account, transaction, and service information used for the response.`, 'This statement represents the merchant position. The issuer should compare the enclosed source records with the customer claim and applicable card-network requirements.'],
    facts: [['Merchant account', `SB-${String(stableNumber(activeCase.id + merchant)).padStart(7, '0')}`], ['Disputed amount', currentAmount], ['Transaction date', currentDate], ['Response', responseStatus]],
    signature: { name: 'Merchant Disputes Team', role: `${merchant} · Account Resolution` },
  })];

  if (scenario.id === 'recurring-cancellation') return [...common,
    documentBase({ id: `${activeCase.id}-SUB-ENROLL`, title: 'Subscription enrollment record', source: merchant, kind: 'form', brand: merchant, department: 'Subscriber Account Record', mark: profile.mark, date: 'Apr 8, 2026', reference: `SUB-${stableNumber(activeCase.id + 'sub')}`, classification: 'SUBSCRIPTION RECORD', subject: 'Premium plan enrollment and renewal settings', facts: [['Subscriber', activeCase.person ?? 'Training customer'], ['Plan', `${merchant} annual premium`], ['Enrollment date', 'Apr 8, 2026'], ['Renewal cadence', 'Recurring annual renewal'], ['Stored credential', 'Card ending 8841'], ['Account status', 'Active through current billing cycle']], paragraphs: ['This system-generated account record shows the subscription enrollment values stored by the merchant. Review the enrollment date, cadence, and account status against the customer statement.'], footer: 'Merchant subscriber system · Training record' }),
    documentBase({ id: `${activeCase.id}-BILL-HIST`, title: 'Billing history statement', source: merchant, kind: 'statement', brand: merchant, department: 'Subscriber Billing', mark: profile.mark, date: responseDate, reference: `BILL-${stableNumber(activeCase.id + 'bill')}`, classification: 'BILLING HISTORY', subject: 'Subscription billing activity', tables: [{ title: 'Account billing ledger', columns: ['Posted', 'Descriptor', 'Amount', 'Status', 'Type'], rows: transactionRows(transactions, merchant, activeCase) }], callout: { label: 'Ledger note', value: 'A posted refund or reversal would appear as a separate credit entry. Review the ledger rather than relying on the merchant statement alone.' } }),
    documentBase({ id: `${activeCase.id}-POLICY`, title: 'Terms and cancellation policy', source: merchant, kind: 'policy', brand: merchant, department: 'Terms of Service', mark: profile.mark, date: 'Effective Jan 1, 2026', reference: 'TOS-REC-2026.1', classification: 'POLICY EXCERPT', subject: 'Recurring subscription cancellation and renewal', paragraphs: ['Subscribers may cancel from Account Settings or through Subscriber Support. Cancellation stops the next renewal when the request is completed before the renewal date.', 'A cancellation request is complete when the account displays a confirmation number or Subscriber Support issues a written acknowledgement. Access may continue through the paid billing period.', 'Refund eligibility is reviewed under the plan terms and does not replace the requirement to retain cancellation confirmation.'], callout: { label: 'Investigator review', value: 'Compare the policy effective date, cancellation method, renewal date, and any confirmation supplied by either party.' } }),
    documentBase({ id: `${activeCase.id}-ACTIVITY`, title: 'Account activity log', source: merchant, kind: 'log', brand: merchant, department: 'Subscriber Activity', mark: profile.mark, date: responseDate, reference: `ACT-${stableNumber(activeCase.id + 'activity')}`, classification: 'SYSTEM ACTIVITY', subject: 'Account events around the claimed cancellation', tables: [{ title: 'Recorded account events', columns: ['Date / time', 'Event', 'Channel', 'Result'], rows: [[cancellationDate, 'Account settings accessed', 'Mobile web', 'Session recorded'], ['Jul 8, 2026 · 12:03 AM', 'Subscription renewed', 'Stored credential', 'Completed'], ['Jul 8, 2026 · 7:42 PM', 'Title playback event', 'Android app', '18 minutes'], [responseDate, 'Dispute response prepared', 'Merchant support', 'Completed']] }], footer: 'System event export · Times displayed in merchant account timezone' }),
  ];

  if (scenario.id === 'merchandise-not-received') return [...common,
    documentBase({ id: `${activeCase.id}-ORDER`, title: 'Order confirmation', source: merchant, kind: 'receipt', brand: merchant, department: 'Order Services', mark: profile.mark, date: currentDate, reference: `ORD-${stableNumber(activeCase.id + 'order')}`, classification: 'ORDER RECEIPT', facts: [['Customer', activeCase.person ?? 'Training customer'], ['Order total', currentAmount], ['Ship-to area', activeCase.intake?.customerLocation ?? 'Address on merchant order'], ['Order status', 'Fulfillment record attached']], tables: [{ title: 'Order items', columns: ['Item', 'Qty', 'Unit price', 'Total'], rows: [['Training merchandise item', '1', currentAmount, currentAmount]] }] }),
    documentBase({ id: `${activeCase.id}-TRACKING`, title: 'Carrier tracking record', source: 'Training Parcel Network', kind: 'log', brand: 'Training Parcel Network', department: 'Shipment Detail', mark: 'TP', date: responseDate, reference: `TRK-${stableNumber(activeCase.id + 'track')}`, classification: 'CARRIER RECORD', tables: [{ title: 'Shipment scans', columns: ['Date / time', 'Location', 'Scan'], rows: [['Jul 6, 2026 · 6:14 PM', 'Origin facility', 'Shipment accepted'], ['Jul 8, 2026 · 8:20 AM', 'Destination city', 'Out for delivery'], ['Jul 8, 2026 · 2:17 PM', 'Delivery address', 'Delivery scan recorded']] }], callout: { label: 'Delivery detail', value: 'Review the complete address, delivery image, recipient, and carrier correction history when supplied.' } }),
    documentBase({ id: `${activeCase.id}-FULFILL`, title: 'Merchant fulfillment record', source: merchant, kind: 'form', brand: merchant, department: 'Order Fulfillment', mark: profile.mark, date: responseDate, reference: `FUL-${stableNumber(activeCase.id + 'fulfill')}`, classification: 'FULFILLMENT RECORD', facts: [['Order', `ORD-${stableNumber(activeCase.id + 'order')}`], ['Shipment status', 'Carrier scan attached'], ['Delivery address', 'Matches merchant order record'], ['Replacement', 'No replacement recorded']] }),
  ];

  if (scenario.id === 'credit-not-processed') return [...common,
    documentBase({ id: `${activeCase.id}-RETURN`, title: 'Return receipt', source: merchant, kind: 'receipt', brand: merchant, department: 'Returns Desk', mark: profile.mark, date: activeCase.issueStartDate ?? currentDate, reference: `RET-${stableNumber(activeCase.id + 'return')}`, classification: 'RETURN RECEIPT', facts: [['Original transaction', currentAmount], ['Return status', 'Received for review'], ['Refund method', 'Original payment method'], ['Expected processing', '5–10 business days']] }),
    documentBase({ id: `${activeCase.id}-CREDIT-LOG`, title: 'Merchant credit ledger', source: merchant, kind: 'statement', brand: merchant, department: 'Refund Accounting', mark: profile.mark, date: responseDate, reference: `CR-${stableNumber(activeCase.id + 'credit')}`, classification: 'CREDIT LEDGER', tables: [{ title: 'Refund events', columns: ['Date', 'Event', 'Amount', 'Status'], rows: [[activeCase.issueStartDate ?? currentDate, 'Return received', currentAmount, 'Logged'], [responseDate, 'Refund review', currentAmount, 'Merchant status recorded']] }] }),
    documentBase({ id: `${activeCase.id}-REF-POLICY`, title: 'Return and refund policy', source: merchant, kind: 'policy', brand: merchant, department: 'Customer Terms', mark: profile.mark, date: 'Effective Jan 1, 2026', reference: 'RET-2026.1', classification: 'POLICY EXCERPT', paragraphs: ['Approved refunds are sent to the original payment method. Processing time begins after the returned item or cancellation is accepted.', 'Customers should retain the return receipt and any written refund acknowledgement until the credit appears.'] }),
  ];

  if (scenario.id === 'duplicate-processing' || scenario.id === 'incorrect-amount') return [...common,
    documentBase({ id: `${activeCase.id}-TXN-LEDGER`, title: 'Merchant transaction ledger', source: merchant, kind: 'statement', brand: merchant, department: 'Payment Operations', mark: profile.mark, date: responseDate, reference: `LED-${stableNumber(activeCase.id + 'ledger')}`, classification: 'TRANSACTION LEDGER', tables: [{ title: 'Payment events', columns: ['Date', 'Descriptor', 'Amount', 'Status', 'Channel'], rows: transactionRows(transactions, merchant, activeCase) }] }),
    documentBase({ id: `${activeCase.id}-RECEIPT`, title: 'Merchant sales receipt', source: merchant, kind: 'receipt', brand: merchant, department: 'Sales Record', mark: profile.mark, date: currentDate, reference: `RCPT-${stableNumber(activeCase.id + 'receipt')}`, classification: 'SALES RECEIPT', facts: [['Customer', activeCase.person ?? 'Training customer'], ['Merchant', merchant], ['Total authorized', currentAmount], ['Transaction date', currentDate]], tables: [{ title: 'Purchase detail', columns: ['Description', 'Qty', 'Amount'], rows: [['Training purchase', '1', currentAmount]] }] }),
    documentBase({ id: `${activeCase.id}-AUTH-SETTLE`, title: 'Authorization and settlement record', source: merchant, kind: 'log', brand: merchant, department: 'Payment Gateway Export', mark: profile.mark, date: responseDate, reference: `AUTH-${stableNumber(activeCase.id + 'auth')}`, classification: 'PAYMENT RECORD', tables: [{ title: 'Processing events', columns: ['Timestamp', 'Event', 'Amount', 'Result'], rows: [[`${currentDate} · 10:14 AM`, 'Authorization', currentAmount, 'Approved'], [`${currentDate} · 11:58 PM`, 'Settlement', currentAmount, 'Completed']] }] }),
  ];

  return [...common,
    documentBase({ id: `${activeCase.id}-ORDER-RECEIPT`, title: scenario.id === 'service-dispute' ? 'Service booking and receipt' : 'Merchant order receipt', source: merchant, kind: 'receipt', brand: merchant, department: scenario.id === 'service-dispute' ? 'Service Reservations' : 'Order Services', mark: profile.mark, date: currentDate, reference: `ORD-${stableNumber(activeCase.id + 'receipt')}`, classification: 'TRANSACTION RECORD', facts: [['Customer', activeCase.person ?? 'Training customer'], ['Amount', currentAmount], ['Transaction date', currentDate], ['Channel', transactions[0]?.channel ?? 'Merchant account']], tables: [{ title: 'Purchased item or service', columns: ['Description', 'Date', 'Amount'], rows: [[scenario.label, currentDate, currentAmount]] }] }),
    documentBase({ id: `${activeCase.id}-AUTH`, title: 'Authorization record', source: merchant, kind: 'log', brand: merchant, department: 'Payment Processing', mark: profile.mark, date: responseDate, reference: `AUTH-${stableNumber(activeCase.id + 'authorization')}`, classification: 'AUTHORIZATION DATA', facts: [['Entry mode', /wallet/i.test(activeCase.subtype ?? '') ? 'Tokenized wallet credential' : /card present/i.test(transactions[0]?.channel ?? '') ? 'Card present' : 'Card not present'], ['Authorization result', 'Approved'], ['Amount', currentAmount], ['Merchant descriptor', profile.descriptor]] }),
    documentBase({ id: `${activeCase.id}-FULFILLMENT`, title: scenario.id === 'service-dispute' ? 'Service fulfillment record' : 'Order fulfillment record', source: merchant, kind: 'form', brand: merchant, department: 'Fulfillment', mark: profile.mark, date: responseDate, reference: `FUL-${stableNumber(activeCase.id + 'fulfillment')}`, classification: 'FULFILLMENT RECORD', facts: [['Transaction', currentAmount], ['Service / order date', currentDate], ['Account reference', `ACCT-${stableNumber(activeCase.id + merchant)}`], ['Evidence source', 'Merchant system export']], paragraphs: ['This record reflects the merchant fulfillment entry associated with the disputed transaction. Compare it with the customer statement and any independent delivery, booking, usage, or service record.'] }),
  ];
}

function customerDocumentsFor({ activeCase, profile, scenario, cancellationDate }) {
  const customer = activeCase.person ?? 'Training customer';
  const currentAmount = activeCase.amount ?? '$0.00';
  const disputeForm = documentBase({ id: `${activeCase.id}-CUS-FORM`, title: 'Customer dispute form', source: 'Issuer claim intake', kind: 'form', brand: 'Fraud Academy Bank', department: 'Cardholder Disputes', mark: 'FA', date: activeCase.reportedDate ?? 'Training date', reference: activeCase.claimId ?? `CLM-${activeCase.id}`, classification: 'CUSTOMER SUBMISSION', subject: scenario.label, facts: [['Cardholder', customer], ['Merchant', profile.name], ['Disputed amount', currentAmount], ['Claim type', scenario.label], ['Date reported', activeCase.reportedDate ?? 'Training date']], paragraphs: [activeCase.statement?.value ?? activeCase.allegation ?? 'Customer statement recorded at claim intake.'], footer: 'Issuer claim intake · Customer-provided information' });
  const docs = [disputeForm];
  if (scenario.id === 'recurring-cancellation') docs.push({ id: `${activeCase.id}-CUS-CANCEL`, title: 'Cancellation confirmation', source: customer, kind: 'email', brand: profile.name, department: 'Cancellation acknowledgement', mark: profile.mark, date: cancellationDate, reference: `CAN-${stableNumber(activeCase.id + 'customer-cancel')}`, classification: 'CUSTOMER EVIDENCE', status: 'Requested', icon: 'MSG', subject: 'Subscription cancellation confirmation' });
  else if (scenario.id === 'merchandise-not-received') docs.push({ id: `${activeCase.id}-CUS-CONTACT`, title: 'Customer delivery correspondence', source: customer, kind: 'email', brand: 'Customer email record', department: 'Merchant correspondence', mark: '@', date: activeCase.issueStartDate ?? 'Training date', reference: `MSG-${stableNumber(activeCase.id)}`, classification: 'CUSTOMER EVIDENCE', status: 'Requested', icon: 'MSG' });
  else if (scenario.id === 'credit-not-processed') docs.push({ id: `${activeCase.id}-CUS-REFUND`, title: 'Merchant refund confirmation', source: customer, kind: 'email', brand: profile.name, department: 'Refund correspondence', mark: profile.mark, date: activeCase.issueStartDate ?? 'Training date', reference: `REF-${stableNumber(activeCase.id)}`, classification: 'CUSTOMER EVIDENCE', status: 'Requested', icon: 'MSG' });
  else docs.push({ id: `${activeCase.id}-CUS-SUPPORT`, title: 'Customer supporting document', source: customer, kind: 'form', brand: 'Customer evidence', department: scenario.label, mark: 'C', date: activeCase.issueStartDate ?? 'Training date', reference: `CUS-${stableNumber(activeCase.id)}`, classification: 'CUSTOMER EVIDENCE', status: 'Requested', icon: 'DOC' });
  return docs;
}

function legacyRecords({ activeCase, profile, scenario, authorization, merchantDocuments, responseDeadline }) {
  const observed = activeCase.reportedDate ?? 'Training date';
  const base = (section, title, summary, fields = []) => ({ id: `${activeCase.id}-${section.toUpperCase()}`, section, title, status: 'Available', observed, summary, fields, relatedRecords: merchantDocuments.map((item) => item.id) });
  return [
    base('overview', 'Merchant identity and category', `${profile.name} is recorded under MCC ${profile.mcc}.`, [['Merchant', profile.name], ['MCC', profile.mcc], ['Category', profile.category], ['Descriptor', profile.descriptor]]),
    base('history', 'Customer and merchant history', `${profile.priorTransactionCount} prior transaction(s) are available for comparison.`, [['Prior transactions', profile.priorTransactionCount], ['Prior disputes', profile.priorDisputeCount], ['Refunds', profile.refundCount]]),
    base('authorization', 'Authorization and billing record', `${authorization.entryMode}; ${authorization.attempts}.`, [['Entry mode', authorization.entryMode], ['AVS', authorization.avs], ['CVV', authorization.cvv], ['3DS', authorization.threeDS], ['Wallet token', authorization.walletToken]]),
    base('fulfillment', 'Fulfillment evidence packet', `${merchantDocuments.length} scenario-specific merchant document(s) are available.`, [['Scenario', scenario.label], ['Documents', merchantDocuments.length]]),
    base('disputes', 'Dispute, response, and refund history', 'Customer claim and merchant response are grouped for comparison.', [['Prior disputes', profile.priorDisputeCount], ['Refunds', profile.refundCount]]),
    base('marketplace', 'Subscription or marketplace context', scenario.label, [['Claim scenario', scenario.label]]),
    base('reason-code', 'Reason-code documentation guide', 'Guidance remains neutral and does not select an outcome.', [['Response deadline', responseDeadline], ['Scenario', scenario.label]]),
  ];
}

export function getMerchantIntelligence(activeCase = {}) {
  const financial = getFinancialRecords(activeCase);
  const evidence = getEvidenceRecords(activeCase);
  const transactions = financial.transactions ?? [];
  const generated = activeCase.toolResults?.merchantIntelligence ?? {};
  const merchantName = merchantNameFor(activeCase, transactions, generated);
  const primary = transactions[0] ?? {};
  const scenario = scenarioFor(activeCase, merchantName);
  const [fallbackMcc, fallbackCategory] = merchantCategory(merchantName, primary.channel);
  const profile = {
    name: merchantName,
    legalName: generated.profile?.legalName ?? `${merchantName} Training Commerce LLC`,
    descriptor: generated.profile?.descriptor ?? merchantName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18),
    mcc: generated.profile?.mcc ?? fallbackMcc,
    category: generated.profile?.category ?? fallbackCategory,
    location: generated.profile?.location ?? primary.location ?? 'Online merchant',
    channel: generated.profile?.channel ?? primary.channel ?? 'Card-not-present',
    firstUsed: generated.profile?.firstUsed ?? transactions.at(-1)?.posted ?? primary.posted ?? activeCase.reportedDate,
    priorTransactionCount: generated.profile?.priorTransactionCount ?? Math.max(0, transactions.length - 1),
    priorDisputeCount: generated.profile?.priorDisputeCount ?? activeCase.customer?.priorClaims?.length ?? 0,
    refundCount: generated.profile?.refundCount ?? transactions.filter((item) => /refund|credit|reversal/i.test(`${item.status} ${item.context}`)).length,
    mark: merchantName.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase(),
  };
  const cancellationDate = activeCase.id === 'FA-CB-24007' ? 'Jul 2, 2026' : activeCase.issueStartDate ?? activeCase.reportedDate ?? 'Date supplied at intake';
  const responseDeadline = activeCase.chargebackDecision?.responseDeadline ?? 'Jul 28, 2026';
  const seed = stableNumber(activeCase.id);
  const explicitResponse = generated.response?.status ?? activeCase.merchantResponse?.status;
  const responseStatus = explicitResponse ?? (activeCase.id === 'FA-CB-24007' ? 'Challenged' : seed % 5 === 0 ? 'Accepted' : seed % 4 === 0 ? 'Pending' : 'Challenged');
  const responseDate = activeCase.id === 'FA-CB-24007' ? 'Jul 9, 2026 · 2:14 PM' : activeCase.reportedDate ?? 'Training response date';
  const merchantDocuments = buildMerchantDocuments({ activeCase, profile, scenario, transactions, responseDate, responseStatus, cancellationDate });
  const customerDocuments = customerDocumentsFor({ activeCase, profile, scenario, cancellationDate, evidence });
  const currentAmount = primary.amount ?? activeCase.amount ?? '$0.00';
  const currentDate = primary.posted ?? activeCase.reportedDate ?? 'Training date';
  const reasonCode = activeCase.chargebackDecision?.reasonCode ?? generated.reasonCode ?? `${scenario.label} documentation lane`;
  const authorization = {
    id: `${activeCase.id}-AUTH-1`, authorizedAt: `${currentDate} ${primary.time ?? ''}`.trim(), amount: currentAmount,
    entryMode: generated.authorization?.entryMode ?? (/recurring/i.test(`${primary.channel} ${scenario.label}`) ? 'Stored credential / recurring' : /card present/i.test(primary.channel ?? '') ? 'EMV chip or contactless' : 'Card not present'),
    avs: generated.authorization?.avs ?? 'Merchant authorization response supplied when available',
    cvv: generated.authorization?.cvv ?? 'Merchant authorization response supplied when available',
    threeDS: generated.authorization?.threeDS ?? 'Not supplied in the base packet',
    otp: generated.authorization?.otp ?? 'Not supplied in the base packet',
    walletToken: generated.authorization?.walletToken ?? 'No wallet token supplied',
    device: generated.authorization?.device ?? 'Merchant device record not supplied',
    ip: generated.authorization?.ip ?? 'Merchant IP record not supplied',
    attempts: generated.authorization?.attempts ?? `${transactions.length || 1} transaction record(s) available`,
  };
  const merchantStatement = responseStatus === 'Accepted'
    ? `${profile.name} accepted the chargeback through the card-network response channel. Review the merchant response letter and issuer account history for the credit record.`
    : responseStatus === 'Pending'
      ? `The chargeback was submitted to ${profile.name}. A merchant response has not yet been received; the response deadline is ${responseDeadline}.`
      : scenario.id === 'recurring-cancellation'
        ? `${profile.name} reports that no completed cancellation request was located before the renewal. The merchant challenges the chargeback and supplied the subscription record, billing history, account activity, and cancellation policy for review.`
        : `${profile.name} challenges the chargeback and supplied a response letter plus ${scenario.label.toLowerCase()} records. Review each source document against the customer statement and card-network requirements.`;
  const responseFields = scenario.id === 'recurring-cancellation'
    ? [['Response status', responseStatus], ['Response received', responseDate], ['Chargeback accepted', responseStatus === 'Accepted' ? 'Yes' : 'No'], ['Cancellation request found', responseStatus === 'Accepted' ? 'Not contested' : 'No completed request located'], ['Refund issued', profile.refundCount ? 'Refund entry recorded' : 'No'], ['Merchant policy', 'Cancellation required before renewal date']]
    : [['Response status', responseStatus], ['Response received', responseDate], ['Chargeback accepted', responseStatus === 'Accepted' ? 'Yes' : 'No'], ['Merchant evidence', `${merchantDocuments.length} document(s)`], ['Refund / reversal', profile.refundCount ? 'Entry recorded' : 'None recorded'], ['Response deadline', responseDeadline]];
  const networkDocument = documentBase({ id: `${activeCase.id}-NET-SUB`, title: 'Card-network submission record', source: 'Issuer dispute system', kind: 'form', brand: 'Fraud Academy Bank', department: 'Chargeback Operations', mark: 'FA', date: activeCase.reportedDate ?? 'Training date', reference: `NET-${stableNumber(activeCase.id + 'network')}`, classification: 'NETWORK SUBMISSION', subject: scenario.label, facts: [['Case ID', activeCase.id], ['Merchant', profile.name], ['Disputed amount', currentAmount], ['Transaction date', currentDate], ['Reason-code lane', reasonCode], ['Response deadline', responseDeadline]], paragraphs: ['This internal training record represents the claim information transmitted through the card-network process. It is not a replica of the network platform interface.'], footer: 'Issuer dispute system · Training-safe network record' });
  const records = generated.records?.length ? generated.records : legacyRecords({ activeCase, profile, scenario, authorization, merchantDocuments, responseDeadline });

  return {
    profile, scenario, authorization, records, reasonCode, responseDeadline, merchantDocuments, customerDocuments,
    claimLane: /fraud/i.test(activeCase.claimTypeId ?? activeCase.type ?? '') && !/non.?fraud/i.test(activeCase.claimTypeId ?? activeCase.type ?? '') ? 'Fraud chargeback' : 'Non-fraud dispute',
    summaryFields: [['Disputed amount', currentAmount], [scenario.id === 'recurring-cancellation' ? 'Cancellation date' : 'Issue date', cancellationDate], ['Case ID', activeCase.id]],
    claimDetails: [['Customer', activeCase.person ?? 'Training customer'], ['Merchant', profile.name], ['Disputed transaction', `${currentDate} · ${currentAmount}`], ['Claim scenario', scenario.label], ['Date reported', activeCase.reportedDate ?? 'Training date'], ['Intake channel', activeCase.intake?.channel ?? activeCase.statement?.source ?? 'Claim intake']],
    customerStatement: activeCase.statement?.value ?? activeCase.allegation ?? 'Customer statement recorded at intake.',
    customerStatementSource: activeCase.statement?.source ?? activeCase.intake?.channel ?? 'Claim intake',
    network: { status: responseStatus === 'Pending' ? 'Awaiting merchant response' : 'Merchant response received', fields: [['Submission reference', networkDocument.reference], ['Submitted', activeCase.reportedDate ?? 'Training date'], ['Reason-code lane', reasonCode], ['Disputed amount', currentAmount], ['Merchant response deadline', responseDeadline], ['Response source', 'Card-network exchange']], documents: [networkDocument, customerDocuments[0]] },
    response: { status: responseStatus, statement: merchantStatement, fields: responseFields, documents: responseStatus === 'Pending' ? merchantDocuments.map((item) => ({ ...item, status: 'Pending' })) : merchantDocuments },
    customerRequirements: scenario.customerRequirements,
    visa: { fields: [['Possible dispute lane', reasonCode], ['Merchant response', responseStatus], ['Filing / response deadline', responseDeadline], ['Guidance status', 'Investigator review required']], requirements: scenario.visaRequirements },
    caseStatus: responseStatus === 'Pending' ? 'Awaiting merchant response' : responseStatus === 'Accepted' ? 'Merchant accepted' : 'Customer evidence review',
    timeline: [
      { date: activeCase.reportedDate ?? 'Training date', label: 'Claim received', detail: `${scenario.label} opened for ${profile.name}.`, state: 'complete' },
      { date: activeCase.reportedDate ?? 'Training date', label: 'Network submission recorded', detail: `Disputed transaction and customer claim details sent through the card-network process.`, state: 'complete' },
      { date: responseDate, label: responseStatus === 'Pending' ? 'Merchant response pending' : `Merchant response: ${responseStatus}`, detail: responseStatus === 'Pending' ? `Response due ${responseDeadline}.` : `${merchantDocuments.length} merchant document(s) returned for review.`, state: responseStatus === 'Pending' ? 'current' : 'complete' },
      { date: responseStatus === 'Challenged' ? 'Open' : 'Not required', label: 'Customer evidence review', detail: responseStatus === 'Challenged' ? `${customerDocuments.filter((item) => item.status !== 'Available').length} customer document request(s) remain open.` : 'Follow the current case status and account-credit record.', state: responseStatus === 'Challenged' ? 'current' : 'future' },
      { date: responseDeadline, label: 'Response deadline', detail: 'Confirm eligibility and required evidence before continuing the dispute lane.', state: 'future' },
    ],
  };
}

export function merchantRecordSearchText(item = {}) {
  return [item.id, item.section, item.title, item.status, item.observed, item.summary, ...(item.fields ?? []).flat(), ...(item.relatedRecords ?? [])].filter(Boolean).join(' ').toLowerCase();
}
