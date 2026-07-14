export const businessRecordsByCase = {
  'FA-ATO-24018': {
    business360: [
      { id: 'BIZ-1001', entity: 'Northstar Digital Market', relationship: 'Merchant descriptor on the disputed card record', status: 'Active merchant record', observed: 'Jul 8, 2026', context: 'Digital-goods marketplace profile linked to transaction TXN-1001 and processor token MPT-7784.' },
      { id: 'BIZ-1002', entity: 'Northstar Payments LLC', relationship: 'Payment processor for Northstar Digital Market', status: 'Processor record available', observed: 'Jul 8, 2026', context: 'Processor relationship is tied to the authorization trail and merchant token without assigning a case outcome.' },
      { id: 'BIZ-1003', entity: 'Northstar Customer Support', relationship: 'Merchant service contact channel', status: 'Contact record available', observed: 'Jul 8, 2026', context: 'Support contact may be used for merchant-document follow-up if required.' },
    ],
    businessIntel: [
      { id: 'BIN-1001', type: 'Legal business name', value: 'Northstar Digital Market LLC', observed: 'Jul 8, 2026', context: 'Training Business ID TBI-NDM-7784 · active fictional registration.' },
      { id: 'BIN-1002', type: 'Industry and channel', value: 'Digital goods marketplace · online card-not-present', observed: 'Jul 8, 2026', context: 'Merchant category and channel can be compared with the transaction and authorization records.' },
      { id: 'BIN-1003', type: 'Business address', value: 'Austin, TX training business address', observed: 'Jul 8, 2026', context: 'Registered and operating address supplied by the fictional business source.' },
      { id: 'BIN-1004', type: 'Business contact', value: '(512) 555-0138 · support@northstar.training.test', observed: 'Jul 8, 2026', context: 'Merchant support phone and email for training documentation.' },
      { id: 'BIN-1005', type: 'Merchant relationship', value: 'Processor token MPT-7784 · authorization AUTH-74218-CNP', observed: 'Jul 8, 2026', context: 'Links the business profile to Payment Verification and Transaction History.' },
    ],
    employeeProfile: [
      { id: 'EMP-1001', name: 'Nora Kim', role: 'Merchant support specialist', employer: 'Northstar Digital Market LLC', status: 'Contact record available', lastSeen: 'Jul 8, 2026', context: 'Training-only service contact for document or transaction questions.' },
      { id: 'EMP-1002', name: 'Eli Warren', role: 'Payment operations contact', employer: 'Northstar Payments LLC', status: 'Contact record available', lastSeen: 'Jul 8, 2026', context: 'Training-only processor contact linked to MPT-7784.' },
    ],
    payrollHistory: [
      { id: 'PAYR-1001', period: 'Current case packet', employer: 'No customer payroll relationship supplied', amount: 'Not applicable', channel: 'Consumer card claim', status: 'No payroll records in scope', context: 'The active case contains merchant and payment records, not customer payroll history.' },
    ],
  },
  'FA-CB-24007': {
    business360: [
      { id: 'BIZ-2201', entity: 'StreamBox Premium', relationship: 'Subscription merchant on current and prior billing records', status: 'Active merchant record', observed: 'Jul 8, 2026', context: 'Subscription profile is linked to billing token SBT-2207 and three transaction periods.' },
      { id: 'BIZ-2202', entity: 'StreamBox Billing Services LLC', relationship: 'Billing entity for StreamBox Premium', status: 'Billing record available', observed: 'Jul 8, 2026', context: 'Billing entity supplies descriptor, recurring interval, and support contact details.' },
      { id: 'BIZ-2203', entity: 'StreamBox Customer Care', relationship: 'Merchant cancellation and service channel', status: 'Contact record available', observed: 'Jul 8, 2026', context: 'Merchant contact may be used to document cancellation evidence or response status.' },
    ],
    businessIntel: [
      { id: 'BIN-2201', type: 'Legal business name', value: 'StreamBox Billing Services LLC', observed: 'Jul 8, 2026', context: 'Training Business ID TBI-SBX-2207 · active fictional registration.' },
      { id: 'BIN-2202', type: 'Service relationship', value: 'Monthly streaming subscription', observed: 'May–Jul 2026', context: 'Recurring interval and amount history are available in Transaction History.' },
      { id: 'BIN-2203', type: 'Business address', value: 'Denver, CO training business address', observed: 'Jul 8, 2026', context: 'Registered billing address supplied by the fictional business source.' },
      { id: 'BIN-2204', type: 'Business contact', value: '(303) 555-0187 · billing@streambox.training.test', observed: 'Jul 8, 2026', context: 'Billing-support phone and email for training documentation.' },
      { id: 'BIN-2205', type: 'Document relationship', value: 'Cancellation confirmation requested', observed: 'Jul 8, 2026', context: 'Requested document remains in Evidence Center and does not decide the claim.' },
    ],
    employeeProfile: [
      { id: 'EMP-2201', name: 'Samira Cole', role: 'Billing support specialist', employer: 'StreamBox Billing Services LLC', status: 'Contact record available', lastSeen: 'Jul 8, 2026', context: 'Training-only billing contact linked to the recurring merchant record.' },
      { id: 'EMP-2202', name: 'Devon Price', role: 'Cancellation services contact', employer: 'StreamBox Customer Care', status: 'Contact record available', lastSeen: 'Jul 8, 2026', context: 'Training-only service contact for cancellation-document follow-up.' },
    ],
    payrollHistory: [
      { id: 'PAYR-2201', period: 'Current case packet', employer: 'No customer payroll relationship supplied', amount: 'Not applicable', channel: 'Consumer billing dispute', status: 'No payroll records in scope', context: 'The active case contains merchant billing history, not customer payroll activity.' },
    ],
  },
  'FA-CR-24003': {
    business360: [
      { id: 'BIZ-3301', entity: 'Lakeside Office Supply LLC', relationship: 'Employer submitted during customer profile setup', status: 'Active business record', observed: 'Jul 7, 2026', context: 'Employer relationship is linked to employee profile and posted payroll history.' },
      { id: 'BIZ-3302', entity: 'Lakeside Payroll Operations', relationship: 'Payroll department for the listed employer', status: 'Contact record available', observed: 'Jul 7, 2026', context: 'Payroll contact and deposit records are available for relationship review.' },
      { id: 'BIZ-3303', entity: 'Destination ID DST-7740', relationship: 'External payment destination connected to the account setup', status: 'Payment object recorded', observed: 'Jul 8, 2026', context: 'Destination object remains in Payment Verification and is separate from payroll deposits.' },
    ],
    businessIntel: [
      { id: 'BIN-3301', type: 'Legal business name', value: 'Lakeside Office Supply LLC', observed: 'Jul 7, 2026', context: 'Training Business ID TBI-LOS-3301 · active fictional Texas registration.' },
      { id: 'BIN-3302', type: 'Industry', value: 'Office supply distribution', observed: 'Jul 7, 2026', context: 'Fictional industry and operating profile supplied by the business source.' },
      { id: 'BIN-3303', type: 'Business address', value: 'Arlington, TX training business address', observed: 'Jul 7, 2026', context: 'Registered and operating address supplied by the fictional business source.' },
      { id: 'BIN-3304', type: 'Business contact', value: '(817) 555-0126 · payroll@lakeside.training.test', observed: 'Jul 7, 2026', context: 'Payroll-office phone and email for training documentation.' },
      { id: 'BIN-3305', type: 'Employer relationship', value: 'Avery Brooks · operations assistant · listed since 2024', observed: 'Jul 7, 2026', context: 'Employee relationship can be compared with Employee Profile and Payroll History.' },
    ],
    employeeProfile: [
      { id: 'EMP-3301', name: 'Avery Brooks', role: 'Operations assistant', employer: 'Lakeside Office Supply LLC', status: 'Employee record available', lastSeen: 'Jul 7, 2026', context: 'Hire date May 6, 2024 · employee reference EMP-LOS-2044 · training-only profile.' },
      { id: 'EMP-3302', name: 'Marisol Green', role: 'Payroll coordinator', employer: 'Lakeside Office Supply LLC', status: 'Employer contact available', lastSeen: 'Jul 7, 2026', context: 'Training-only payroll contact tied to posted deposit records.' },
      { id: 'EMP-3303', name: 'Darius Chen', role: 'Operations manager', employer: 'Lakeside Office Supply LLC', status: 'Supervisor record available', lastSeen: 'Jul 7, 2026', context: 'Training-only supervisor relationship attached to the employee profile.' },
    ],
    payrollHistory: [
      { id: 'PAYR-3301', period: 'Jul 2026', employer: 'Lakeside Office Supply LLC', amount: '$1,280.00', channel: 'Direct deposit', status: 'Posted', context: 'Pay date Jul 3, 2026 · employee reference EMP-LOS-2044 · checking destination ending 1182.' },
      { id: 'PAYR-3302', period: 'Jun 2026', employer: 'Lakeside Office Supply LLC', amount: '$1,280.00', channel: 'Direct deposit', status: 'Posted', context: 'Pay date Jun 19, 2026 · employee reference EMP-LOS-2044 · checking destination ending 1182.' },
      { id: 'PAYR-3303', period: 'May 2026', employer: 'Lakeside Office Supply LLC', amount: '$1,240.00', channel: 'Direct deposit', status: 'Posted', context: 'Pay date May 22, 2026 · employee reference EMP-LOS-2044 · checking destination ending 1182.' },
    ],
  },
};
