export const financialRecordsByCase = {
  'FA-ATO-24018': {
    transactions: [
      { id: 'TXN-1001', posted: 'Jul 8, 2026', time: '10:52 AM', merchant: 'Northstar Digital Market', amount: '$742.18', channel: 'Card not present', instrument: 'Debit card ending 4410', status: 'Posted', context: 'Disputed transaction tied to case allegation.' },
      { id: 'TXN-1002', posted: 'Jul 7, 2026', time: '6:18 PM', merchant: 'Metro Fuel', amount: '$38.62', channel: 'Card present', instrument: 'Debit card ending 4410', status: 'Posted', context: 'Recent customer card activity available for comparison.' },
      { id: 'TXN-1003', posted: 'Jul 5, 2026', time: '1:09 PM', merchant: 'Grocery Square', amount: '$84.29', channel: 'Card present', instrument: 'Debit card ending 4410', status: 'Posted', context: 'Prior spending pattern record.' },
    ],
    financialIntel: [
      { id: 'FIN-1001', type: 'Balance snapshot', value: '$1,842.60 before disputed transaction', observed: 'Jul 8, 2026', context: 'Balance state available before final case documentation.' },
      { id: 'FIN-1002', type: 'Account activity', value: 'Debit card + checking activity', observed: 'Jul 8, 2026', context: 'Money movement records can be compared with access history.' },
      { id: 'FIN-1003', type: 'Merchant context', value: 'Digital goods merchant category', observed: 'Jul 8, 2026', context: 'Merchant information should be reviewed with transaction and login records.' },
    ],
    paymentVerification: [
      { id: 'PAY-1001', type: 'Payment instrument', object: 'Debit card ending 4410', status: 'Active', lastSeen: 'Jul 8, 2026', context: 'Instrument used by current transaction record.' },
      { id: 'PAY-1002', type: 'Destination object', object: 'Merchant processor token MPT-7784', status: 'Recorded', lastSeen: 'Jul 8, 2026', context: 'Tokenized destination object for training review.' },
      { id: 'PAY-1003', type: 'Authorization trail', object: 'AUTH-74218-CNP', status: 'Available', lastSeen: 'Jul 8, 2026', context: 'Authorization record can be pinned for later timeline review.' },
    ],
  },
  'FA-CB-24007': {
    transactions: [
      { id: 'TXN-2201', posted: 'Jul 8, 2026', time: '8:03 AM', merchant: 'StreamBox Premium', amount: '$189.44', channel: 'Recurring card billing', instrument: 'Credit card ending 8841', status: 'Posted', context: 'Current disputed billing record.' },
      { id: 'TXN-2202', posted: 'Jun 8, 2026', time: '8:05 AM', merchant: 'StreamBox Premium', amount: '$189.44', channel: 'Recurring card billing', instrument: 'Credit card ending 8841', status: 'Posted', context: 'Prior cycle billing record for comparison.' },
      { id: 'TXN-2203', posted: 'May 8, 2026', time: '8:04 AM', merchant: 'StreamBox Premium', amount: '$179.44', channel: 'Recurring card billing', instrument: 'Credit card ending 8841', status: 'Posted', context: 'Earlier merchant billing record with a different amount.' },
    ],
    financialIntel: [
      { id: 'FIN-2201', type: 'Billing pattern', value: 'Monthly merchant billing located', observed: 'Jul 8, 2026', context: 'Recurring pattern can be reviewed against customer allegation.' },
      { id: 'FIN-2202', type: 'Statement context', value: 'Merchant appears across three statement periods', observed: 'Jul 8, 2026', context: 'Statement history is available for documentation.' },
      { id: 'FIN-2203', type: 'Amount comparison', value: '$179.44 to $189.44', observed: 'May-Jul 2026', context: 'Amount change is a record detail, not a final case outcome.' },
    ],
    paymentVerification: [
      { id: 'PAY-2201', type: 'Payment instrument', object: 'Credit card ending 8841', status: 'Active', lastSeen: 'Jul 8, 2026', context: 'Instrument used for current and prior merchant billing.' },
      { id: 'PAY-2202', type: 'Merchant billing object', object: 'Subscription billing token SBT-2207', status: 'Recorded', lastSeen: 'Jul 8, 2026', context: 'Tokenized merchant billing object available for review.' },
      { id: 'PAY-2203', type: 'Dispute packet', object: 'Billing dispute packet CB-24007', status: 'Open', lastSeen: 'Jul 8, 2026', context: 'Packet connects transaction records and requested documents.' },
    ],
  },
  'FA-CR-24003': {
    transactions: [
      { id: 'TXN-3301', posted: 'Jul 8, 2026', time: '7:36 AM', merchant: 'Credit line transfer request', amount: '$2,400.00', channel: 'Account request', instrument: 'Credit line', status: 'Requested', context: 'Requested usage record tied to system review.' },
      { id: 'TXN-3302', posted: 'Jul 8, 2026', time: '7:31 AM', merchant: 'External destination setup', amount: '$0.00', channel: 'Payment setup', instrument: 'Destination ID token', status: 'Recorded', context: 'Destination setup occurred before the usage request.' },
      { id: 'TXN-3303', posted: 'Jul 7, 2026', time: '5:18 PM', merchant: 'New account opening', amount: '$0.00', channel: 'Account setup', instrument: 'Credit line', status: 'Recorded', context: 'Account setup event available for early-history review.' },
    ],
    financialIntel: [
      { id: 'FIN-3301', type: 'Account age', value: 'New account history', observed: 'Jul 8, 2026', context: 'Early account activity is available for comparison.' },
      { id: 'FIN-3302', type: 'Usage request', value: '$2,400.00 requested', observed: 'Jul 8, 2026', context: 'Request should be reviewed with payment verification and identity records.' },
      { id: 'FIN-3303', type: 'Destination setup', value: 'New external destination token', observed: 'Jul 8, 2026', context: 'Destination object is available in payment verification.' },
    ],
    paymentVerification: [
      { id: 'PAY-3301', type: 'Bank Code', object: 'BC-204', status: 'Tokenized', lastSeen: 'Jul 8, 2026', context: 'Training-safe payment routing object.' },
      { id: 'PAY-3302', type: 'Destination ID', object: 'DST-7740', status: 'Tokenized', lastSeen: 'Jul 8, 2026', context: 'Training-safe destination object connected to the setup event.' },
      { id: 'PAY-3303', type: 'Verification packet', object: 'PV-24003', status: 'Pending review', lastSeen: 'Jul 8, 2026', context: 'Payment verification packet is ready for investigator review.' },
    ],
  },
};
