const documentFulfillmentStorageKey = 'fraud-academy-document-fulfillments-v1';

function readAllFulfillments() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(documentFulfillmentStorageKey) || '{}');
  } catch {
    return {};
  }
}

function writeAllFulfillments(value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(documentFulfillmentStorageKey, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('fraud-academy:documents-updated'));
}

function timestamp() {
  return new Date().toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function isRequestableDocument(document = {}) {
  return /bank statement|merchant|billing|response|cancellation|refund|return|receipt|delivery|service|affidavit|support/i.test([
    document.title,
    document.type,
    document.folder,
    document.source,
    document.summary,
  ].filter(Boolean).join(' '));
}

function requestedShell(document) {
  if (!isRequestableDocument(document)) return document;
  if (['Requested', 'Missing'].includes(document.status)) return document;

  return {
    ...document,
    status: 'Missing',
    requestStatus: 'Missing',
    reviewStatus: 'Not received',
    received: 'Not received',
    updated: 'Request not sent',
    extractionConfidence: 'Not available',
    authenticity: 'Document has not been received.',
    pages: [],
    summary: `Request needed before ${document.title} can be reviewed.`,
    investigatorNote: 'Send the request, then receive a generated fictional response before reviewing this document.',
  };
}

function receivedDocument(baseDocument, pages) {
  const receivedAt = timestamp();
  return {
    ...baseDocument,
    status: 'Received',
    requestStatus: 'Received',
    reviewStatus: 'Pending Review',
    received: receivedAt,
    updated: receivedAt,
    extractionConfidence: 'High',
    authenticity: 'Fictional response generated after the document request. Review source, completeness, and extracted fields before relying on it.',
    source: responseSource(baseDocument),
    summary: responseSummary(baseDocument),
    investigatorNote: 'This fictional response was generated after the learner requested the document.',
    trainingTip: 'Compare this generated response with the customer statement, transaction records, and merchant or payment evidence before deciding.',
    fields: responseFields(baseDocument),
    pages,
  };
}

function responseSource(document = {}) {
  if (/merchant/i.test(`${document.title} ${document.category} ${document.source}`)) return 'Merchant response packet';
  if (/bank statement/i.test(document.title)) return 'Customer bank upload';
  if (/cancellation|refund|return|receipt|support/i.test(document.title)) return 'Customer upload or secure message';
  return document.source || 'Requested document response';
}

function responseSummary(document = {}) {
  if (/bank statement/i.test(document.title)) return 'Generated bank statement response with account owner, statement period, balances, deposits, withdrawals, and selected activity.';
  if (/merchant/i.test(`${document.title} ${document.category} ${document.source}`)) return 'Generated merchant response packet with transaction, billing, policy, fulfillment, and response-date fields.';
  if (/cancellation|refund|return|receipt|support/i.test(document.title)) return 'Generated customer support document with merchant-contact details and disputed-reason support.';
  return `Generated response for ${document.title}.`;
}

function responseFields(document = {}) {
  if (/bank statement/i.test(document.title)) return [
    ['Statement period', 'Jun 1-Jun 30, 2026'],
    ['Account owner', document.customer],
    ['Account ID', document.accountId],
    ['Beginning balance', '$4,218.44'],
    ['Deposits', '$6,842.10'],
    ['Withdrawals', '$5,906.32'],
    ['Ending balance', '$5,154.22'],
    ['Pages received', '2 of 2'],
  ];

  if (/merchant/i.test(`${document.title} ${document.category} ${document.source}`)) return [
    ['Merchant response date', timestamp()],
    ['Merchant descriptor', 'TRAINING MERCHANT BILLING'],
    ['Transaction reference', document.reference],
    ['Billing terms', 'Recurring billing terms supplied in response packet'],
    ['Service period', 'Jun 1-Jul 1, 2026'],
    ['Cancellation policy', 'Cancellation effective at end of billing cycle unless same-day cancellation proof is supplied'],
    ['Refund status', 'No merchant refund issued in response packet'],
    ['Pages received', '3 of 3'],
  ];

  return [
    ['Customer', document.customer],
    ['Document type', document.title],
    ['Submitted through', 'Secure message upload'],
    ['Merchant contact date', 'Jul 2, 2026'],
    ['Disputed reason support', 'Customer-supplied support document attached after request'],
    ['Linked case', document.caseId],
    ['Pages received', '1 of 1'],
  ];
}

function generatedPages(document = {}) {
  const rows = responseFields(document);
  if (/bank statement/i.test(document.title)) {
    return [
      {
        title: 'Monthly Checking Statement',
        subtitle: 'FICTIONAL TRAINING RESPONSE - GENERATED AFTER REQUEST',
        kind: 'statement',
        sections: [
          { title: 'Account summary', rows: rows.slice(0, 8) },
          { title: 'Statement notice', paragraphs: ['This fictional statement was generated only for Fraud Academy training and cannot be used as a financial record.'] },
        ],
      },
      {
        title: 'Statement Activity',
        subtitle: 'FICTIONAL TRAINING RESPONSE - PAGE 2 OF 2',
        kind: 'statement',
        sections: [
          { title: 'Selected withdrawals', table: { columns: ['Date', 'Description', 'Amount'], rows: [['Jun 05', 'PAYROLL - TRAINING EMPLOYER', '$2,941.05'], ['Jun 14', 'TRANSFER FROM SAVINGS', '$960.00'], ['Jun 18', 'CARD PURCHASE - DISPUTED MERCHANT', '-$189.44'], ['Jun 25', 'UTILITY PAYMENT', '-$184.32']] } },
          { title: 'Activity context', paragraphs: ['Transaction descriptions are fictional training data. Compare the disputed entry with the case transaction record before making a determination.'] },
        ],
      },
    ];
  }

  if (/merchant/i.test(`${document.title} ${document.category} ${document.source}`)) {
    return [
      {
        title: 'Merchant Response Packet',
        subtitle: 'FICTIONAL TRAINING RESPONSE - PAGE 1 OF 3',
        kind: 'case',
        sections: [{ title: 'Merchant transaction response', rows: rows.slice(0, 4) }],
      },
      {
        title: 'Billing and Service Detail',
        subtitle: 'FICTIONAL TRAINING RESPONSE - PAGE 2 OF 3',
        kind: 'case',
        sections: [{ title: 'Terms and service period', rows: rows.slice(3, 7) }],
      },
      {
        title: 'Merchant Response Notes',
        subtitle: 'FICTIONAL TRAINING RESPONSE - PAGE 3 OF 3',
        kind: 'case',
        sections: [
          { title: 'Packet review context', paragraphs: ['Compare the merchant response against the customer dispute reason, customer uploads, transaction history, and reason-code requirements.', 'This generated packet is fictional training data and does not determine the outcome.'] },
        ],
      },
    ];
  }

  return [{
    title: document.title,
    subtitle: 'FICTIONAL TRAINING RESPONSE - GENERATED AFTER REQUEST',
    kind: 'case',
    sections: [
      { title: 'Submitted document fields', rows },
      { title: 'Review notes', paragraphs: ['Compare dates, merchant contact, transaction reference, and requested outcome before relying on this support document.'] },
    ],
  }];
}

export function readDocumentFulfillments(caseId) {
  return readAllFulfillments()[caseId] ?? {};
}

export function recordDocumentRequest(caseId, document) {
  if (!isRequestableDocument(document)) return document;
  const all = readAllFulfillments();
  const current = all[caseId] ?? {};
  const requestedAt = timestamp();
  current[document.id] = {
    ...requestedShell(document),
    requestStatus: 'Requested',
    status: 'Requested',
    updated: requestedAt,
    received: 'Not received',
    pages: [],
    summary: `Request sent for ${document.title} on ${requestedAt}. Response is not received yet.`,
  };
  writeAllFulfillments({ ...all, [caseId]: current });
  return current[document.id];
}

export function receiveGeneratedDocument(caseId, document) {
  const all = readAllFulfillments();
  const current = all[caseId] ?? {};
  const generated = receivedDocument(document, generatedPages(document));
  current[document.id] = generated;
  writeAllFulfillments({ ...all, [caseId]: current });
  return generated;
}

export function applyDocumentRequestWorkflow(activeCase = {}, sourceDocuments = []) {
  const baseDocuments = sourceDocuments.map(requestedShell);
  const fulfilled = readDocumentFulfillments(activeCase.id);
  return baseDocuments.map((document) => fulfilled[document.id] ?? document);
}
