export const businessRecordsByCase = {
  'FA-ATO-24018': {
    business360: [
      { id: 'BIZ-1001', entity: 'Northstar Digital Market', relationship: 'Merchant descriptor on current card record', status: 'Record available', observed: 'Jul 8, 2026', context: 'Merchant profile can be reviewed with transaction and session records.' },
      { id: 'BIZ-1002', entity: 'Maya Sterling customer profile', relationship: 'Consumer banking relationship', status: 'Profile available', observed: 'Jul 8, 2026', context: 'No business enrollment object is selected in this workspace.' },
      { id: 'BIZ-1003', entity: 'Merchant processor token MPT-7784', relationship: 'Processor object tied to posted card activity', status: 'Recorded', observed: 'Jul 8, 2026', context: 'Processor object is also available in Payment Verification.' },
    ],
    businessIntel: [
      { id: 'BIN-1001', type: 'Merchant descriptor', value: 'Northstar Digital Market', observed: 'Jul 8, 2026', context: 'Descriptor record supports merchant review without assigning a final outcome.' },
      { id: 'BIN-1002', type: 'Merchant category', value: 'Digital goods marketplace', observed: 'Jul 8, 2026', context: 'Category context can be compared with transaction history.' },
      { id: 'BIN-1003', type: 'Relationship scope', value: 'Consumer claim with merchant record', observed: 'Jul 8, 2026', context: 'Business panel keeps merchant context separate from identity and access records.' },
    ],
    employeeProfile: [
      { id: 'EMP-1001', name: 'Maya Sterling', role: 'Customer profile holder', employer: 'No employer object selected', status: 'Scope note', lastSeen: 'Jul 8, 2026', context: 'Employee review is not the primary object for this consumer claim.' },
      { id: 'EMP-1002', name: 'Case intake agent', role: 'Support intake record', employer: 'Training bank queue', status: 'Logged', lastSeen: 'Jul 8, 2026', context: 'Intake record identifies the channel where the statement was received.' },
    ],
    payrollHistory: [
      { id: 'PAYR-1001', period: 'Jul 2026', employer: 'No payroll source selected', amount: '$0.00', channel: 'Not part of current claim packet', status: 'Scope note', context: 'Payroll history remains searchable for cross-tool consistency.' },
      { id: 'PAYR-1002', period: 'Jun 2026', employer: 'Customer relationship snapshot', amount: 'Available balance context only', channel: 'Account history', status: 'Reference', context: 'Use Financial Investigation for balance and transaction details.' },
    ],
  },
  'FA-CB-24007': {
    business360: [
      { id: 'BIZ-2201', entity: 'StreamBox Premium', relationship: 'Subscription merchant on disputed billing record', status: 'Record available', observed: 'Jul 8, 2026', context: 'Merchant relationship can be compared with billing and document records.' },
      { id: 'BIZ-2202', entity: 'Subscription billing token SBT-2207', relationship: 'Merchant billing object', status: 'Recorded', observed: 'Jul 8, 2026', context: 'Billing object is visible in Payment Verification.' },
      { id: 'BIZ-2203', entity: 'Jordan Ellis customer profile', relationship: 'Consumer cardholder relationship', status: 'Profile available', observed: 'Jul 8, 2026', context: 'Customer relationship is available for timeline documentation.' },
    ],
    businessIntel: [
      { id: 'BIN-2201', type: 'Merchant descriptor', value: 'StreamBox Premium', observed: 'Jul 8, 2026', context: 'Descriptor appears on current and prior billing records.' },
      { id: 'BIN-2202', type: 'Service relationship', value: 'Monthly subscription billing', observed: 'May-Jul 2026', context: 'Pattern context should be reviewed with customer documents.' },
      { id: 'BIN-2203', type: 'Document dependency', value: 'Cancellation confirmation requested', observed: 'Jul 8, 2026', context: 'Document status belongs in Document Viewer before final case documentation.' },
    ],
    employeeProfile: [
      { id: 'EMP-2201', name: 'Jordan Ellis', role: 'Customer profile holder', employer: 'No employer object selected', status: 'Scope note', lastSeen: 'Jul 8, 2026', context: 'Employee profile review is not the primary object for this billing dispute.' },
      { id: 'EMP-2202', name: 'Merchant support contact', role: 'Merchant service channel placeholder', employer: 'StreamBox Premium', status: 'Requested', lastSeen: 'Jul 8, 2026', context: 'Support contact can be documented if merchant evidence is added later.' },
    ],
    payrollHistory: [
      { id: 'PAYR-2201', period: 'Jul 2026', employer: 'No payroll source selected', amount: '$0.00', channel: 'Not part of current billing dispute packet', status: 'Scope note', context: 'Payroll history remains available but is not a current evidence driver.' },
      { id: 'PAYR-2202', period: 'May-Jul 2026', employer: 'StreamBox Premium billing history', amount: '$179.44-$189.44', channel: 'Merchant billing', status: 'Reference', context: 'Recurring charge history is handled in Transaction History.' },
    ],
  },
  'FA-CR-24003': {
    business360: [
      { id: 'BIZ-3301', entity: 'Lakeside Office Supply', relationship: 'Employer object submitted during profile setup', status: 'Record available', observed: 'Jul 7, 2026', context: 'Employer relationship can be reviewed with employee and payroll records.' },
      { id: 'BIZ-3302', entity: 'Avery Brooks customer profile', relationship: 'New credit account applicant', status: 'Profile available', observed: 'Jul 8, 2026', context: 'Profile can be compared with identity and payment records.' },
      { id: 'BIZ-3303', entity: 'Destination ID token DST-7740', relationship: 'External destination setup object', status: 'Recorded', observed: 'Jul 8, 2026', context: 'Destination object is connected to Payment Verification.' },
    ],
    businessIntel: [
      { id: 'BIN-3301', type: 'Employer profile', value: 'Lakeside Office Supply', observed: 'Jul 7, 2026', context: 'Employer record provides business relationship context for the review.' },
      { id: 'BIN-3302', type: 'Business contact', value: 'Payroll office contact placeholder', observed: 'Jul 7, 2026', context: 'Contact object can be used for training documentation if verification is requested.' },
      { id: 'BIN-3303', type: 'Relationship age', value: 'Newly added employer object', observed: 'Jul 7, 2026', context: 'Relationship timing can be reviewed with account opening history.' },
    ],
    employeeProfile: [
      { id: 'EMP-3301', name: 'Avery Brooks', role: 'Listed operations assistant', employer: 'Lakeside Office Supply', status: 'Record available', lastSeen: 'Jul 7, 2026', context: 'Employee profile supports review of stated business relationship.' },
      { id: 'EMP-3302', name: 'Payroll office contact', role: 'Employer contact object', employer: 'Lakeside Office Supply', status: 'Recorded', lastSeen: 'Jul 7, 2026', context: 'Contact object can be pinned for timeline review.' },
      { id: 'EMP-3303', name: 'Avery Brooks', role: 'New credit account applicant', employer: 'Customer profile', status: 'Profile available', lastSeen: 'Jul 8, 2026', context: 'Customer profile remains separate from employer record.' },
    ],
    payrollHistory: [
      { id: 'PAYR-3301', period: 'Jul 2026', employer: 'Lakeside Office Supply', amount: '$4,760.00', channel: 'Direct deposit payroll run', status: 'Posted', context: 'Recent payroll activity can be compared with new account activity.', fundingOwner: 'Lakeside Office Supply', fundingBankCode: 'BC-BIZ-482', fundingDestinationId: 'DST-BIZ-LSO-4821', fundingPaymentRecordId: 'PAY-3305', changeRequest: 'No employee destination change was requested for this posted run.', adminActivity: 'Payroll run approved through the recorded employer workflow.', callback: 'No callback required for an unchanged posted run.', payees: [{ id: 'EMP-3301', employee: 'Avery Brooks', employeeId: 'EMP-4412', amount: '$1,280.00', status: 'Paid', ownerName: 'Avery Brooks', bankCode: 'BC-PAY-128', destinationId: 'DST-PAY-4412', priorDestinationId: 'DST-PAY-4412', paymentRecordId: 'PAY-3304' }, { id: 'EMP-3304', employee: 'Morgan Reed', employeeId: 'EMP-4477', amount: '$1,640.00', status: 'Paid', ownerName: 'Morgan Reed', bankCode: 'BC-PAY-164', destinationId: 'DST-PAY-4477', priorDestinationId: 'DST-PAY-4477', paymentRecordId: 'PAY-3306' }, { id: 'EMP-3305', employee: 'Taylor Grant', employeeId: 'EMP-4521', amount: '$1,840.00', status: 'Paid', ownerName: 'Taylor Grant', bankCode: 'BC-PAY-184', destinationId: 'DST-PAY-4521', priorDestinationId: 'DST-PAY-4521', paymentRecordId: 'PAY-3307' }] },
      { id: 'PAYR-3302', period: 'Jun 2026', employer: 'Lakeside Office Supply', amount: '$4,760.00', channel: 'Direct deposit payroll run', status: 'Posted', context: 'Prior payroll activity is available for history review.', fundingOwner: 'Lakeside Office Supply', fundingBankCode: 'BC-BIZ-482', fundingDestinationId: 'DST-BIZ-LSO-4821', fundingPaymentRecordId: 'PAY-3305', changeRequest: 'No destination change attached to this prior run.', adminActivity: 'Payroll run approved through the recorded employer workflow.', callback: 'Not required for the unchanged prior run.', payees: [{ id: 'EMP-3301', employee: 'Avery Brooks', employeeId: 'EMP-4412', amount: '$1,280.00', status: 'Paid', ownerName: 'Avery Brooks', bankCode: 'BC-PAY-128', destinationId: 'DST-PAY-4412', priorDestinationId: 'DST-PAY-4412', paymentRecordId: 'PAY-3304' }, { id: 'EMP-3304', employee: 'Morgan Reed', employeeId: 'EMP-4477', amount: '$1,640.00', status: 'Paid', ownerName: 'Morgan Reed', bankCode: 'BC-PAY-164', destinationId: 'DST-PAY-4477', priorDestinationId: 'DST-PAY-4477', paymentRecordId: 'PAY-3306' }, { id: 'EMP-3305', employee: 'Taylor Grant', employeeId: 'EMP-4521', amount: '$1,840.00', status: 'Paid', ownerName: 'Taylor Grant', bankCode: 'BC-PAY-184', destinationId: 'DST-PAY-4521', priorDestinationId: 'DST-PAY-4521', paymentRecordId: 'PAY-3307' }] },
      { id: 'PAYR-3303', period: 'May 2026', employer: 'Lakeside Office Supply', amount: '$4,680.00', channel: 'Direct deposit payroll run', status: 'Posted', context: 'Earlier payroll record is available for comparison.', fundingOwner: 'Lakeside Office Supply', fundingBankCode: 'BC-BIZ-482', fundingDestinationId: 'DST-BIZ-LSO-4821', fundingPaymentRecordId: 'PAY-3305', changeRequest: 'No destination change attached to this prior run.', adminActivity: 'Payroll run approved through the recorded employer workflow.', callback: 'Not required for the unchanged prior run.', payees: [{ id: 'EMP-3301', employee: 'Avery Brooks', employeeId: 'EMP-4412', amount: '$1,240.00', status: 'Paid', ownerName: 'Avery Brooks', bankCode: 'BC-PAY-128', destinationId: 'DST-PAY-4412', priorDestinationId: 'DST-PAY-4412', paymentRecordId: 'PAY-3304' }, { id: 'EMP-3304', employee: 'Morgan Reed', employeeId: 'EMP-4477', amount: '$1,620.00', status: 'Paid', ownerName: 'Morgan Reed', bankCode: 'BC-PAY-164', destinationId: 'DST-PAY-4477', priorDestinationId: 'DST-PAY-4477', paymentRecordId: 'PAY-3306' }, { id: 'EMP-3305', employee: 'Taylor Grant', employeeId: 'EMP-4521', amount: '$1,820.00', status: 'Paid', ownerName: 'Taylor Grant', bankCode: 'BC-PAY-184', destinationId: 'DST-PAY-4521', priorDestinationId: 'DST-PAY-4521', paymentRecordId: 'PAY-3307' }] },
    ],
  },
};
