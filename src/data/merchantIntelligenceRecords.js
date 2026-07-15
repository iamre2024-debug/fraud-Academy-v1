import { getEvidenceRecords, getFinancialRecords } from './caseToolData.js';

export const merchantIntelligenceTabs = [
  { id: 'overview', label: 'Merchant Profile', question: 'Who is the merchant, and how is the transaction categorized?' },
  { id: 'history', label: 'Customer History', question: 'What prior customer activity exists with this merchant?' },
  { id: 'authorization', label: 'Authorization', question: 'Which authorization and order-match fields are recorded?' },
  { id: 'fulfillment', label: 'Fulfillment', question: 'What delivery, service, activation, or usage records are available?' },
  { id: 'disputes', label: 'Disputes & Refunds', question: 'What dispute, refund, return, and customer-contact history is recorded?' },
  { id: 'marketplace', label: 'Subscription / Marketplace', question: 'Which subscription or marketplace-account records need comparison?' },
  { id: 'reason-code', label: 'Reason Code', question: 'Which evidence requirements and deadline apply to the recorded dispute reason?' },
];

function record({ id, section, title, status, observed, summary, fields, relatedRecords = [] }) {
  return { id, section, title, status, observed, summary, fields, relatedRecords };
}

function merchantCategory(name = '', channel = '') {
  if (/stream|subscription|recurring/i.test(`${name} ${channel}`)) return ['4899', 'Digital subscription services'];
  if (/digital|online|marketplace/i.test(`${name} ${channel}`)) return ['5734', 'Digital goods and online retail'];
  if (/restaurant|table/i.test(name)) return ['5812', 'Eating places and restaurants'];
  return ['5399', 'General merchandise'];
}

function fallbackWorkspace(activeCase) {
  const financial = getFinancialRecords(activeCase);
  const evidence = getEvidenceRecords(activeCase);
  const transactions = financial.transactions ?? [];
  const primary = transactions[0] ?? {};
  const merchantName = primary.merchant ?? activeCase.transactionInfo?.split(' - ')[0] ?? 'Training merchant';
  const [mcc, category] = merchantCategory(merchantName, primary.channel);
  const priorTransactions = transactions.slice(1);
  const merchantDocuments = (evidence.documents ?? []).filter((item) => /merchant|receipt|delivery|refund|cancel|reason|order/i.test(`${item.title} ${item.category} ${item.preview}`));
  const profile = {
    name: merchantName,
    legalName: `${merchantName} Training Commerce LLC`,
    descriptor: merchantName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18),
    mcc,
    category,
    location: primary.location ?? 'Location supplied in transaction detail',
    channel: primary.channel ?? 'Channel supplied in transaction detail',
    website: `https://${merchantName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.example.test`,
    firstUsed: priorTransactions.at(-1)?.posted ?? primary.posted ?? activeCase.reportedDate,
    priorTransactionCount: priorTransactions.length,
    priorDisputeCount: activeCase.customer?.priorClaims?.length ?? 0,
    refundCount: priorTransactions.filter((item) => /refund|credit/i.test(`${item.status} ${item.context}`)).length,
    attemptedTransactions: transactions.length,
    declinedTransactions: transactions.filter((item) => /declin/i.test(item.status)).length,
  };
  const reasonCode = activeCase.chargebackDecision?.reasonCode ?? 'Training dispute reason guide';
  const deadline = activeCase.chargebackDecision?.responseDeadline ?? 'Deadline recorded in the case packet';
  const authorization = {
    id: `${activeCase.id}-AUTH-1`,
    authorizedAt: `${primary.posted ?? activeCase.reportedDate} ${primary.time ?? ''}`.trim(),
    amount: primary.amount ?? activeCase.amount,
    entryMode: /recurring/i.test(primary.channel) ? 'Stored credential / recurring' : /card present/i.test(primary.channel) ? 'EMV chip or contactless' : 'Card not present',
    avs: 'Authorization response is recorded in the merchant packet when supplied',
    cvv: 'Authorization response is recorded in the merchant packet when supplied',
    threeDS: 'Not supplied in the current base packet',
    otp: 'Not supplied in the current base packet',
    walletToken: 'No wallet token in the current base packet',
    device: 'Merchant device record not supplied',
    ip: 'Merchant IP record not supplied',
    attempts: `${transactions.length} transaction record(s) available`,
  };

  const records = [
    record({ id: `${activeCase.id}-MER-PROFILE`, section: 'overview', title: 'Merchant identity and category', status: 'Record available', observed: primary.posted ?? activeCase.reportedDate, summary: `${merchantName} is recorded under MCC ${mcc}.`, fields: [['Merchant name', profile.name], ['Legal name', profile.legalName], ['Descriptor', profile.descriptor], ['MCC', mcc], ['Category', category], ['Location', profile.location], ['Channel', profile.channel], ['Website', profile.website]], relatedRecords: transactions.map((item) => item.id) }),
    record({ id: `${activeCase.id}-MER-HISTORY`, section: 'history', title: 'Customer and merchant history', status: 'History available', observed: activeCase.reportedDate, summary: `${priorTransactions.length} prior transaction(s) are included for comparison.`, fields: [['First used', profile.firstUsed], ['Prior transactions', priorTransactions.length], ['Prior disputes', profile.priorDisputeCount], ['Refunds', profile.refundCount], ['Historical descriptors', [...new Set(transactions.map((item) => item.merchant))].join(', ')]], relatedRecords: priorTransactions.map((item) => item.id) }),
    record({ id: `${activeCase.id}-MER-AUTH`, section: 'authorization', title: 'Authorization and order-match packet', status: 'Packet available', observed: authorization.authorizedAt, summary: `${authorization.entryMode}; ${authorization.attempts}.`, fields: [['Authorization ID', authorization.id], ['Amount', authorization.amount], ['Entry mode', authorization.entryMode], ['AVS', authorization.avs], ['CVV', authorization.cvv], ['3DS', authorization.threeDS], ['OTP', authorization.otp], ['Wallet token', authorization.walletToken], ['Device', authorization.device], ['IP record', authorization.ip], ['Attempts', authorization.attempts]], relatedRecords: [primary.id, ...financial.paymentVerification.map((item) => item.id)].filter(Boolean) }),
    record({ id: `${activeCase.id}-MER-FULFILLMENT`, section: 'fulfillment', title: 'Delivery, service, or usage record', status: merchantDocuments.length ? 'Documents available' : 'Document request available', observed: activeCase.reportedDate, summary: merchantDocuments.length ? `${merchantDocuments.length} merchant-related document(s) are available.` : 'No merchant fulfillment document is attached to the current base packet.', fields: [['Delivery / service record', merchantDocuments.map((item) => item.title).join(', ') || 'Not attached'], ['Address comparison', 'Compare the merchant packet with Customer 360'], ['Activation / usage', 'Review merchant response when supplied'], ['Response packet', activeCase.chargebackDecision?.merchantEvidence ?? 'Merchant packet may be requested']], relatedRecords: merchantDocuments.map((item) => item.id) }),
    record({ id: `${activeCase.id}-MER-DISPUTES`, section: 'disputes', title: 'Disputes, refunds, and customer contact', status: 'History available', observed: activeCase.reportedDate, summary: 'Current and prior merchant-contact fields are grouped without assigning an outcome.', fields: [['Prior disputes', profile.priorDisputeCount], ['Refund count', profile.refundCount], ['Customer contact', activeCase.statement?.source ?? activeCase.intake?.channel ?? 'Case intake'], ['Current merchant response', activeCase.chargebackDecision?.customerContact ?? 'Response record not supplied'], ['Related documents', merchantDocuments.map((item) => item.title).join(', ') || 'No related document attached']], relatedRecords: merchantDocuments.map((item) => item.id) }),
    record({ id: `${activeCase.id}-MER-MARKETPLACE`, section: 'marketplace', title: 'Subscription or marketplace context', status: 'Comparison available', observed: activeCase.reportedDate, summary: /recurring|subscription/i.test(primary.channel) ? 'Recurring billing context is present.' : 'No recurring billing record is central to this transaction.', fields: [['Subscription status', /recurring|subscription/i.test(primary.channel) ? 'Recurring merchant records available' : 'No subscription status supplied'], ['Marketplace account', /online|digital/i.test(`${primary.channel} ${category}`) ? 'Merchant account context may be compared with order records' : 'Not applicable'], ['Billing descriptor', profile.descriptor], ['Prior merchant count', profile.priorTransactionCount]], relatedRecords: transactions.map((item) => item.id) }),
    record({ id: `${activeCase.id}-MER-REASON`, section: 'reason-code', title: 'Reason-code evidence checklist', status: 'Training guide available', observed: activeCase.reportedDate, summary: `${reasonCode} is recorded for this training packet.`, fields: [['Reason-code guide', reasonCode], ['Response deadline', deadline], ['Authorization evidence', activeCase.chargebackDecision?.authorizationReview ?? 'Authorization record and entry mode'], ['Merchant evidence', activeCase.chargebackDecision?.merchantEvidence ?? 'Merchant response, order, and fulfillment records'], ['Fulfillment evidence', activeCase.chargebackDecision?.fulfillmentReview ?? 'Delivery, service, return, cancellation, or refund record'], ['Customer contact evidence', activeCase.chargebackDecision?.customerContact ?? 'Customer statement and merchant-contact history']], relatedRecords: merchantDocuments.map((item) => item.id) }),
  ];
  return { profile, authorization, reasonCode, responseDeadline: deadline, records };
}

export function getMerchantIntelligence(activeCase = {}) {
  const generated = activeCase.toolResults?.merchantIntelligence;
  if (generated?.profile && generated?.records?.length) return generated;
  return fallbackWorkspace(activeCase);
}

export function merchantRecordSearchText(item = {}) {
  return [item.id, item.section, item.title, item.status, item.observed, item.summary, ...(item.fields ?? []).flat(), ...(item.relatedRecords ?? [])].filter(Boolean).join(' ').toLowerCase();
}
