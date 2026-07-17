import { getEvidenceRecords } from './caseToolData.js';
import {
  getMerchantIntelligence as getBaseMerchantIntelligence,
  merchantRecordSearchText,
} from './merchantIntelligenceRecords.js';

export { merchantRecordSearchText };

export const merchantIntelligenceTabs = [
  { id: 'overview', label: 'Merchant Profile', question: 'Who is the merchant, and how is the transaction categorized?' },
  { id: 'history', label: 'Customer-Merchant History', question: 'What prior customer activity exists with this merchant?' },
  { id: 'authorization', label: 'Authorization', question: 'Which authorization and order-match fields are recorded?' },
  { id: 'fulfillment', label: 'Merchant Transaction Docs', question: 'Which merchant-supplied transaction, service, delivery, refund, or billing documents are in the packet?' },
  { id: 'disputes', label: 'Customer Dispute Docs', question: 'Which customer-supplied documents support the disputed reason?' },
  { id: 'marketplace', label: 'Subscription / Marketplace', question: 'Which subscription or marketplace-account records need comparison?' },
  { id: 'reason-code', label: 'Reason Code', question: 'Which evidence requirements and deadline apply to the recorded dispute reason?' },
];

function documentText(item = {}) {
  return [item.title, item.category, item.source, item.preview, item.summary, item.fields].filter(Boolean).join(' ');
}

function titles(items = [], fallback) {
  return items.map((item) => item.title).filter(Boolean).join(', ') || fallback;
}

function relatedIds(items = []) {
  return items.map((item) => item.id).filter(Boolean);
}

function chargebackDocumentGroups(activeCase = {}) {
  const documents = getEvidenceRecords(activeCase).documents ?? [];
  const merchantDocuments = documents.filter((item) => /merchant|order|authorization|billing|delivery|service|fulfillment|refund|response/i.test(documentText(item)));
  const customerDocuments = documents.filter((item) => /customer|dispute|receipt|cancel|refund|return|delivery|service|support/i.test(documentText(item)));

  return {
    merchantDocuments,
    customerDocuments,
    merchantTitles: titles(merchantDocuments, 'No merchant-supplied transaction document is attached'),
    customerTitles: titles(customerDocuments, 'No customer-supplied dispute document is attached'),
  };
}

function alignChargebackRecord(record, activeCase, groups) {
  if (record.section === 'fulfillment') {
    return {
      ...record,
      title: 'Merchant transaction document packet',
      status: groups.merchantDocuments.length ? 'Documents available' : record.status,
      summary: groups.merchantDocuments.length
        ? `${groups.merchantDocuments.length} merchant-supplied transaction document(s) are available for comparison.`
        : 'Review whether a merchant response packet, transaction document, service record, delivery record, refund record, or billing policy is attached.',
      fields: [
        ['Merchant documents', groups.merchantTitles],
        ['Merchant response focus', activeCase.chargebackDecision?.merchantEvidence ?? 'Merchant response, transaction, billing, service, delivery, refund, or policy documents'],
        ['Transaction comparison', 'Compare amount, date, descriptor, order ID, authorization, and service or fulfillment facts'],
        ['Document location', 'Open Document Viewer for the merchant packet copy'],
      ],
      relatedRecords: relatedIds(groups.merchantDocuments),
    };
  }

  if (record.section === 'disputes') {
    return {
      ...record,
      title: 'Customer dispute support packet',
      status: groups.customerDocuments.length ? 'Documents available' : 'Customer document request available',
      summary: 'Customer-supplied dispute documents are grouped for comparison with the merchant response.',
      fields: [
        ['Customer documents', groups.customerTitles],
        ['Customer dispute focus', activeCase.chargebackDecision?.customerContact ?? 'Customer statement, customer support documents, merchant-contact timeline, and requested outcome'],
        ['Disputed reason support', activeCase.chargebackDecision?.fulfillmentReview ?? 'Cancellation, refund, return, receipt, delivery, service, or not-as-described evidence'],
        ['Document location', 'Open Document Viewer or Document Request to review received and requested customer evidence'],
      ],
      relatedRecords: relatedIds(groups.customerDocuments),
    };
  }

  if (record.section === 'reason-code') {
    return {
      ...record,
      fields: [
        ['Reason-code guide', activeCase.chargebackDecision?.reasonCode ?? record.fields?.[0]?.[1] ?? 'Training card-dispute review'],
        ['Response deadline', activeCase.chargebackDecision?.responseDeadline ?? record.fields?.[1]?.[1] ?? 'Deadline recorded in the case packet'],
        ['Merchant evidence', activeCase.chargebackDecision?.merchantEvidence ?? 'Merchant response, order, transaction, billing, and fulfillment records'],
        ['Customer evidence', activeCase.chargebackDecision?.customerContact ?? 'Customer statement, customer-uploaded support, and merchant-contact history'],
        ['Dispute reason support', activeCase.chargebackDecision?.fulfillmentReview ?? 'Delivery, service, return, cancellation, refund, or receipt record'],
      ],
      relatedRecords: [...relatedIds(groups.merchantDocuments), ...relatedIds(groups.customerDocuments)],
    };
  }

  return record;
}

export function getMerchantIntelligence(activeCase = {}) {
  const base = getBaseMerchantIntelligence(activeCase);
  if (!['fraud-chargeback', 'non-fraud-chargeback', 'first-party-fraud'].includes(activeCase.claimTypeId)) return base;

  const groups = chargebackDocumentGroups(activeCase);
  return {
    ...base,
    records: base.records.map((record) => alignChargebackRecord(record, activeCase, groups)),
  };
}
