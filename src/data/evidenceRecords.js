export const evidenceRecordsByCase = {
  'FA-ATO-24018': {
    evidence: [
      { id: 'EVD-1001', status: 'Received', type: 'Customer statement', name: 'Unauthorized purchase statement', source: 'Customer intake', received: 'Jul 8, 2026 10:58 AM', summary: 'Customer states the purchase was not authorized and says they were home at the time.', linkedObject: 'FA-ATO-24018' },
      { id: 'EVD-1002', status: 'Available', type: 'Access record', name: 'Login and session packet', source: 'Digital Activity', received: 'Jul 8, 2026 10:42 AM', summary: 'Successful login, session activity, and profile-view records are available for review.', linkedObject: 'SES-7781' },
      { id: 'EVD-1003', status: 'Available', type: 'Payment record', name: 'Authorization trail', source: 'Payment Verification', received: 'Jul 8, 2026 10:52 AM', summary: 'Authorization trail and payment object are available for the disputed transaction.', linkedObject: 'AUTH-74218-CNP' },
      { id: 'EVD-1004', status: 'Requested', type: 'Customer document', name: 'Affidavit request', source: 'Evidence Center', received: 'Pending', summary: 'Customer affidavit has been requested and can be tracked before final documentation.', linkedObject: 'DOC-442' },
    ],
    documents: [
      { id: 'DOC-441', title: 'Customer statement', category: 'Customer document', status: 'Received', updated: 'Jul 8, 2026', preview: 'Customer reports they did not authorize the transaction and provides a timeline from their perspective.', fields: 'Case ID, customer allegation, contact channel, stated location' },
      { id: 'DOC-442', title: 'Affidavit request', category: 'Requested document', status: 'Requested', updated: 'Jul 8, 2026', preview: 'Document request prepared for customer completion. Not required to reveal an outcome before submission.', fields: 'Customer attestation, transaction ID, signature placeholder' },
      { id: 'DOC-443', title: 'Police report tracker', category: 'Optional document', status: 'Missing', updated: 'Not received', preview: 'Optional evidence tracker. This item records whether a supplemental police report is provided.', fields: 'Report number, agency, received date' },
    ],
  },
  'FA-CB-24007': {
    evidence: [
      { id: 'EVD-2201', status: 'Received', type: 'Customer form', name: 'Billing dispute form', source: 'Mobile app', received: 'Jul 8, 2026 8:19 AM', summary: 'Customer selected a recurring billing issue and submitted a dispute form.', linkedObject: 'DOC-510' },
      { id: 'EVD-2202', status: 'Available', type: 'Transaction history', name: 'Recurring billing records', source: 'Transaction History', received: 'Jul 8, 2026 8:28 AM', summary: 'Merchant billing records across multiple cycles are available for comparison.', linkedObject: 'TXN-2201' },
      { id: 'EVD-2203', status: 'Requested', type: 'Customer document', name: 'Cancellation confirmation', source: 'Evidence Center', received: 'Pending', summary: 'Cancellation evidence has been requested from the customer.', linkedObject: 'DOC-511' },
    ],
    documents: [
      { id: 'DOC-510', title: 'Customer dispute form', category: 'Customer document', status: 'Received', updated: 'Jul 8, 2026', preview: 'Mobile app dispute form shows the customer selected recurring billing issue and described cancellation timing.', fields: 'Claim type, merchant name, customer notes, submission time' },
      { id: 'DOC-511', title: 'Cancellation confirmation', category: 'Requested document', status: 'Requested', updated: 'Jul 8, 2026', preview: 'Customer may upload cancellation confirmation or merchant communication for review.', fields: 'Merchant message, cancellation date, customer upload' },
      { id: 'DOC-512', title: 'Merchant billing packet', category: 'System record', status: 'Available', updated: 'Jul 8, 2026', preview: 'Training packet groups merchant descriptor, billing token, and recurring transaction records.', fields: 'Merchant descriptor, billing token, statement dates' },
    ],
  },
  'FA-CR-24003': {
    evidence: [
      { id: 'EVD-3301', status: 'Received', type: 'System packet', name: 'Credit review alert packet', source: 'System alert', received: 'Jul 8, 2026 7:45 AM', summary: 'System-generated packet opened the review and grouped identity, account, and payment records.', linkedObject: 'DOC-620' },
      { id: 'EVD-3302', status: 'Available', type: 'Payment verification', name: 'Payment setup packet', source: 'Payment Verification', received: 'Jul 8, 2026 7:31 AM', summary: 'Bank Code and Destination ID tokenized records are available for training review.', linkedObject: 'PV-24003' },
      { id: 'EVD-3303', status: 'Available', type: 'Account activity', name: 'Usage request event', source: 'Financial Intelligence', received: 'Jul 8, 2026 7:36 AM', summary: 'Credit line usage request and related account setup records are available.', linkedObject: 'TXN-3301' },
    ],
    documents: [
      { id: 'DOC-620', title: 'System alert packet', category: 'System record', status: 'Received', updated: 'Jul 8, 2026', preview: 'System packet contains review reason, linked identity objects, payment objects, and account activity references.', fields: 'Alert ID, customer profile, account activity, linked records' },
      { id: 'DOC-621', title: 'Payment verification detail', category: 'Review packet', status: 'Requested', updated: 'Jul 8, 2026', preview: 'Payment verification detail is queued for investigator review using training-safe payment labels.', fields: 'Bank Code, Destination ID, verification packet' },
      { id: 'DOC-622', title: 'Account setup record', category: 'System record', status: 'Available', updated: 'Jul 7, 2026', preview: 'Account setup record documents the creation event and early account activity.', fields: 'Profile created, session, payment setup reference' },
    ],
  },
};
