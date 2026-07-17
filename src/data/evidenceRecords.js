export const evidenceRecordsByCase = {
  'FA-ATO-24018': {
    evidence: [
      { id: 'EVD-1001', status: 'Received', type: 'Customer statement', name: 'Unauthorized purchase statement', source: 'Customer intake', received: 'Jul 8, 2026 10:58 AM', summary: 'Customer states the purchase was not authorized and says they were home at the time.', linkedObject: 'FA-ATO-24018' },
      { id: 'EVD-1002', status: 'Available', type: 'Access record', name: 'Login and session packet', source: 'Digital Activity', received: 'Jul 8, 2026 10:42 AM', summary: 'Successful login, session activity, and profile-view records are available for review.', linkedObject: 'SES-7781' },
      { id: 'EVD-1003', status: 'Available', type: 'Payment record', name: 'Authorization trail', source: 'Payment Verification', received: 'Jul 8, 2026 10:52 AM', summary: 'Authorization trail and payment object are available for the disputed transaction.', linkedObject: 'AUTH-74218-CNP' },
      { id: 'EVD-1004', status: 'Requested', type: 'Customer document', name: 'Affidavit request', source: 'Document Viewer', received: 'Pending', summary: 'Customer affidavit has been requested and can be tracked before final documentation.', linkedObject: 'DOC-442' },
    ],
    documents: [
      { id: 'DOC-441', title: 'Customer statement', category: 'Customer document', status: 'Received', updated: 'Jul 8, 2026', preview: 'Packet preview: customer reports they did not authorize the transaction, gives a personal timeline, and states their location for comparison with access records.', fields: 'Case ID, customer allegation, contact channel, stated location, stated device, disputed transaction reference' },
      { id: 'DOC-442', title: 'Affidavit request', category: 'Requested document', status: 'Requested', updated: 'Jul 8, 2026', preview: 'Packet preview: affidavit request is prepared for customer completion and remains a documentation item, not a pre-submission outcome signal.', fields: 'Customer attestation, transaction ID, date sent, completion status, signature placeholder' },
      { id: 'DOC-443', title: 'Police report tracker', category: 'Optional document', status: 'Missing', updated: 'Not received', preview: 'Packet preview: optional tracker records whether a supplemental police report is provided and where it would attach in Document Viewer.', fields: 'Report number, agency, received date, upload channel, linked case object' },
    ],
  },
  'FA-CB-24007': {
    evidence: [
      { id: 'EVD-2201', status: 'Received', type: 'Customer form', name: 'Billing dispute form', source: 'Mobile app', received: 'Jul 8, 2026 8:19 AM', summary: 'Customer selected a recurring billing issue and submitted a dispute form.', linkedObject: 'DOC-510' },
      { id: 'EVD-2202', status: 'Available', type: 'Merchant transaction evidence', name: 'Merchant recurring billing response', source: 'Merchant response packet', received: 'Jul 8, 2026 8:28 AM', summary: 'Merchant response includes subscription terms, billing dates, renewal notice reference, and recurring transaction references for comparison.', linkedObject: 'DOC-512' },
      { id: 'EVD-2203', status: 'Requested', type: 'Customer document', name: 'Cancellation confirmation', source: 'Document Viewer', received: 'Pending', summary: 'Cancellation evidence has been requested from the customer.', linkedObject: 'DOC-511' },
    ],
    documents: [
      { id: 'DOC-510', title: 'Customer dispute form', category: 'Customer document', status: 'Received', updated: 'Jul 8, 2026', preview: 'Packet preview: mobile app form captures the selected recurring billing issue, customer notes, merchant name, and submission time for neutral review.', fields: 'Claim type, merchant name, customer notes, submission time, requested evidence, linked transaction' },
      { id: 'DOC-511', title: 'Customer cancellation or merchant-contact proof', category: 'Customer supporting document', status: 'Requested', source: 'Customer upload or secure message', updated: 'Jul 8, 2026', preview: 'Packet preview: customer may upload cancellation confirmation, merchant chat, email, receipt, refund promise, or other support for the disputed recurring billing reason.', fields: 'Merchant message, cancellation date, customer upload, request date, disputed reason support, received status' },
      { id: 'DOC-512', title: 'Merchant recurring billing response packet', category: 'Merchant transaction evidence', status: 'Available', source: 'Merchant response packet', updated: 'Jul 8, 2026', preview: 'Packet preview: merchant response groups descriptor, billing token, subscription terms, renewal notice reference, statement periods, transaction IDs, and merchant response date for comparison with customer documents.', fields: 'Merchant descriptor, billing token, subscription terms, renewal notice, transaction IDs, amount history, merchant response date' },
      { id: 'DOC-513', title: 'Merchant service and policy document', category: 'Merchant transaction evidence', status: 'Available', source: 'Merchant response packet', updated: 'Jul 8, 2026', preview: 'Packet preview: merchant document lists cancellation policy, service access period, account status, refund policy, and usage indicators tied to the disputed billing cycle.', fields: 'Cancellation policy, service period, account status, refund policy, usage indicator, order or account reference' },
    ],
  },
  'FA-CR-24003': {
    evidence: [
      { id: 'EVD-3301', status: 'Received', type: 'System packet', name: 'Credit review alert packet', source: 'System alert', received: 'Jul 8, 2026 7:45 AM', summary: 'System-generated packet opened the review and grouped identity, account, and payment records.', linkedObject: 'DOC-620' },
      { id: 'EVD-3302', status: 'Available', type: 'Payment verification', name: 'Payment setup packet', source: 'Payment Verification', received: 'Jul 8, 2026 7:31 AM', summary: 'Bank Code and Destination ID tokenized records are available for training review.', linkedObject: 'PV-24003' },
      { id: 'EVD-3303', status: 'Available', type: 'Account activity', name: 'Usage request event', source: 'Financial Investigation', received: 'Jul 8, 2026 7:36 AM', summary: 'Credit line usage request and related account setup records are available.', linkedObject: 'TXN-3301' },
    ],
    documents: [
      { id: 'DOC-620', title: 'System alert packet', category: 'System record', status: 'Received', updated: 'Jul 8, 2026', preview: 'Packet preview: system packet contains queue reason, linked identity objects, payment objects, account activity references, and timeline anchors.', fields: 'Alert ID, customer profile, account activity, linked records, queue reason, opened time' },
      { id: 'DOC-621', title: 'Payment verification detail', category: 'Review packet', status: 'Requested', updated: 'Jul 8, 2026', preview: 'Packet preview: payment verification detail uses training-safe labels and is queued for investigator review before decision drafting.', fields: 'Bank Code, Destination ID, verification packet, setup event, review status' },
      { id: 'DOC-622', title: 'Account setup record', category: 'System record', status: 'Available', updated: 'Jul 7, 2026', preview: 'Packet preview: account setup record documents profile creation, initial session, payment setup reference, and early account activity.', fields: 'Profile created, session, payment setup reference, account event, linked Training ID' },
    ],
  },
};
