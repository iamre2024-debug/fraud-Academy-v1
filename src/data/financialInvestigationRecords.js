import { getFinancialRecords } from './caseToolData.js';

export const financialInvestigationTabs = [
  { id: 'overview', label: 'Account Overview', question: 'What is the account position and relationship context?' },
  { id: 'deposits', label: 'Deposit Analysis', question: 'Do incoming funds match the recorded baseline?' },
  { id: 'spending', label: 'Spending Analysis', question: 'How does current spending compare with prior activity?' },
  { id: 'cash', label: 'Cash Activity', question: 'What cash deposits, withdrawals, or advances are recorded?' },
  { id: 'digital', label: 'ACH, Wire & P2P History', question: 'Which ACH, wire, Zelle, or other P2P transfers and recipients appear?' },
  { id: 'linked', label: 'Linked Accounts', question: 'Which external payment objects are linked to this relationship?' },
  { id: 'merchant', label: 'Merchant Intelligence', question: 'What merchant history and fulfillment context are available?' },
  { id: 'trends', label: 'Behavior Trends', question: 'What changed when current behavior is compared with the baseline?' },
  { id: 'funds-flow', label: 'Funds Flow', question: 'How did funds move between the recorded sources and destinations?' },
  { id: 'cash-out', label: 'Mule / Cash-Out Pattern', question: 'What retained-balance and cash-out observations are recorded?' },
];

const builtInProfiles = {
  'FA-ATO-24018': {
    account: 'Everyday Checking ending 4410',
    accountType: 'Consumer checking',
    currentBalance: 1100.42,
    availableBalance: 1050.42,
    averageBalance: 2534.11,
    monthlyDeposits: 5882.10,
    monthlyOutflow: 4781.68,
    accountAge: '6 years, 2 months',
    accountStatus: 'Open',
    relationshipLength: '6 years, 2 months',
    creditLimit: 'Not applicable',
    overdraft: 'No active overdraft recorded',
    alert: 'Card-not-present transaction alert recorded Jul 8, 2026',
    deposits: [
      ['DEP-1001', 'Payroll deposit', 2941.05, 'Jul 5, 2026', 'ACH credit', 'Training employer payroll deposit consistent with the prior monthly cadence.'],
      ['DEP-1002', 'Payroll deposit', 2941.05, 'Jun 20, 2026', 'ACH credit', 'Prior payroll deposit available for amount and timing comparison.'],
      ['DEP-1003', 'Savings transfer', 960, 'Jun 14, 2026', 'Internal transfer', 'Transfer from a linked savings relationship.'],
    ],
    cash: [
      ['CASH-1001', 'ATM withdrawal', 120, 'Jul 2, 2026', 'ATM ending 1842', 'Withdrawal occurred at a previously recorded customer location.'],
      ['CASH-1002', 'ATM withdrawal', 80, 'Jun 24, 2026', 'ATM ending 1842', 'Prior cash withdrawal available for baseline comparison.'],
    ],
    digital: [
      ['DIG-1001', 'P2P payment', 65, 'Jul 3, 2026', 'Established recipient', 'Recipient appears in three prior monthly records.'],
      ['DIG-1002', 'Wallet activity', 0, 'Jul 8, 2026', 'No new token recorded', 'No wallet provisioning event is included in the active case packet.'],
    ],
    trends: [
      ['Average debit purchase', 72, 148, 'Current review window includes one $742.18 digital-goods purchase.'],
      ['Weekly debit count', 18, 17, 'Transaction count remains close to the four-week baseline.'],
      ['Cash withdrawals', 200, 200, 'Recorded cash activity is unchanged from the prior comparison window.'],
      ['Digital-goods spend', 34, 742.18, 'Current category total is higher because of TXN-1001.'],
    ],
    fundsFlow: [
      ['FLOW-1001', 'Training employer payroll', 'Checking ending 4410', 2941.05, 'Jul 5, 2026', 'Incoming ACH credit'],
      ['FLOW-1002', 'Checking ending 4410', 'Northstar Digital Market', 742.18, 'Jul 8, 2026', 'Card-not-present purchase'],
      ['FLOW-1003', 'Checking ending 4410', 'Available balance', 1050.42, 'Jul 8, 2026', 'Balance retained after posted activity'],
    ],
    cashOut: [
      ['PAT-1001', 'Retained balance after reviewed activity', '$1,050.42 available', 'Balance remained in the account after the disputed purchase.'],
      ['PAT-1002', 'Rapid cash withdrawal after incoming credit', 'No same-day ATM withdrawal recorded', 'The reviewed payroll deposit was not followed by same-day cash activity.'],
      ['PAT-1003', 'Unrelated incoming parties', 'No unrelated incoming-party cluster recorded', 'Incoming funds in the current packet are payroll and an internal transfer.'],
    ],
  },
  'FA-CB-24007': {
    account: 'Credit card ending 8841',
    accountType: 'Consumer credit card',
    currentBalance: 1468.32,
    availableBalance: 5531.68,
    averageBalance: 1284.09,
    monthlyDeposits: 650,
    monthlyOutflow: 838.76,
    accountAge: '4 years, 8 months',
    accountStatus: 'Open',
    relationshipLength: '4 years, 8 months',
    creditLimit: '$7,000.00',
    overdraft: 'Not applicable',
    alert: 'Recurring billing dispute opened Jul 8, 2026',
    deposits: [
      ['DEP-2201', 'Card payment', 650, 'Jul 2, 2026', 'ACH payment', 'Payment posted from the established checking destination.'],
      ['DEP-2202', 'Card payment', 650, 'Jun 2, 2026', 'ACH payment', 'Prior monthly payment is available for cadence comparison.'],
    ],
    cash: [
      ['CASH-2201', 'Cash advance review', 0, 'Jul 8, 2026', 'No cash advance recorded', 'No ATM or cash-advance activity appears in the current card review window.'],
    ],
    digital: [
      ['DIG-2201', 'Recurring digital service', 189.44, 'Jul 8, 2026', 'Stored credential', 'StreamBox billing token SBT-2207 appears across three cycles.'],
      ['DIG-2202', 'Wallet activity', 0, 'Jul 8, 2026', 'No wallet token in scope', 'The active dispute packet concerns recurring billing rather than wallet provisioning.'],
    ],
    trends: [
      ['Recurring merchant amount', 179.44, 189.44, 'The merchant amount increased by $10.00 after the May cycle.'],
      ['Monthly card payment', 650, 650, 'The two recorded payment amounts match.'],
      ['Monthly recurring charges', 6, 6, 'Recurring-merchant count matches the prior statement window.'],
      ['Cash advances', 0, 0, 'No cash advance appears in either comparison window.'],
    ],
    fundsFlow: [
      ['FLOW-2201', 'Established checking destination', 'Credit card ending 8841', 650, 'Jul 2, 2026', 'Card payment'],
      ['FLOW-2202', 'Credit card ending 8841', 'StreamBox Premium', 189.44, 'Jul 8, 2026', 'Recurring merchant billing'],
      ['FLOW-2203', 'Credit card relationship', 'Current balance', 1468.32, 'Jul 8, 2026', 'Statement balance context'],
    ],
    cashOut: [
      ['PAT-2201', 'Cash-out rail', 'No cash-out rail recorded', 'The reviewed activity is a recurring card charge.'],
      ['PAT-2202', 'Rapid movement after payment', 'No same-day transfer recorded', 'The card payment and disputed merchant charge are separated by six days.'],
      ['PAT-2203', 'Retained credit availability', '$5,531.68 available', 'Available credit remains after the reviewed billing activity.'],
    ],
  },
  'FA-CR-24003': {
    account: 'Training credit line ending 6180',
    accountType: 'New revolving credit line',
    currentBalance: 0,
    availableBalance: 8000,
    averageBalance: 0,
    monthlyDeposits: 3800,
    monthlyOutflow: 2240,
    accountAge: '1 day',
    accountStatus: 'Open - review pending',
    relationshipLength: 'New relationship',
    creditLimit: '$8,000.00',
    overdraft: 'Not applicable',
    alert: '$2,400.00 usage request recorded Jul 8, 2026',
    deposits: [
      ['DEP-3301', 'Payroll deposit', 1280, 'Jul 1, 2026', 'ACH credit', 'Deposit is recorded in the linked checking relationship used for income context.'],
      ['DEP-3302', 'Payroll deposit', 1280, 'Jun 17, 2026', 'ACH credit', 'Prior payroll amount is available for comparison.'],
      ['DEP-3303', 'Mobile check deposit', 1240, 'Jun 8, 2026', 'Mobile deposit', 'Deposit source is identified in the fictional statement packet.'],
    ],
    cash: [
      ['CASH-3301', 'ATM withdrawal', 300, 'Jul 6, 2026', 'ATM withdrawal', 'Withdrawal appears in the linked checking relationship.'],
      ['CASH-3302', 'Cash advance', 0, 'Jul 8, 2026', 'No advance posted', 'The $2,400.00 event is a request and has not posted as a cash advance.'],
    ],
    digital: [
      ['DIG-3301', 'External destination setup', 0, 'Jul 8, 2026', 'Destination ID DST-7740', 'A new external destination was added before the credit usage request.'],
      ['DIG-3302', 'Credit usage request', 2400, 'Jul 8, 2026', 'Request pending', 'Funds have not been released in the current case packet.'],
    ],
    trends: [
      ['Credit utilization', 0, 30, 'The current request equals 30% of the recorded $8,000.00 limit.'],
      ['Monthly payroll deposits', 2520, 2560, 'Current payroll total is close to the prior comparison period.'],
      ['External destinations', 0, 1, 'DST-7740 is the first external destination in the new-account packet.'],
      ['Returned items', 0, 1, 'One returned item is recorded in the supporting bank statement.'],
    ],
    fundsFlow: [
      ['FLOW-3301', 'Linked checking relationship', 'Training credit account', 0, 'Jul 7, 2026', 'Payment relationship established'],
      ['FLOW-3302', 'Training credit line', 'Destination ID DST-7740', 2400, 'Jul 8, 2026', 'Usage request pending'],
      ['FLOW-3303', 'Training credit line', 'Unreleased amount', 2400, 'Jul 8, 2026', 'No posted transfer in current packet'],
    ],
    cashOut: [
      ['PAT-3301', 'New destination timing', 'Added 5 minutes before usage request', 'The destination and request timestamps are recorded for comparison.'],
      ['PAT-3302', 'Posted cash-out', 'No posted cash-out recorded', 'The usage request remains pending in the current packet.'],
      ['PAT-3303', 'Retained available credit', '$8,000.00 before release', 'The account has no posted credit-line balance.'],
    ],
  },
};

function stableNumber(value = '') {
  return [...String(value)].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) % 100000, 17);
}

function amountNumber(value = '') {
  return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
}

function money(value = 0) {
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generatedCreditProfile(activeCase, source, credit, seed) {
  const requested = amountNumber(credit.requestedExposure);
  const deposits = amountNumber(credit.averageMonthlyDeposits);
  const outflow = amountNumber(credit.averageMonthlyOutflow);
  const balance = amountNumber(credit.averageBalance);
  const limit = amountNumber(credit.existingLimit) || amountNumber(credit.requestedLimit) || requested;
  const utilization = Number.parseInt(credit.utilization, 10) || 0;
  const dti = Number.parseInt(credit.dti, 10) || 0;
  const account = `${credit.customerType} credit review ending ${String(seed).slice(-4).padStart(4, '0')}`;
  return {
    account,
    accountType: `${credit.customerType} credit relationship`,
    currentBalance: requested,
    availableBalance: Math.max(0, limit - requested),
    averageBalance: balance,
    monthlyDeposits: deposits,
    monthlyOutflow: outflow,
    accountAge: /new/i.test(credit.relationshipStage) ? 'New application' : 'Existing relationship history available',
    accountStatus: credit.applicationStatus,
    relationshipLength: credit.relationshipStage,
    creditLimit: money(limit),
    overdraft: `${credit.overdrafts} overdraft and ${credit.nsfReturns} NSF / return event(s)`,
    alert: `${activeCase.subtype} review recorded`,
    deposits: [
      [`${activeCase.id}-DEP-1`, 'Verified monthly deposits', deposits, activeCase.reportedDate ?? 'Training date', credit.incomeFrequency, `Verified annual support: ${credit.verifiedAnnualIncome}.`],
      [`${activeCase.id}-DEP-2`, 'Stated monthly income or revenue', Math.round(amountNumber(credit.statedAnnualIncome) / 12), 'Application or review record', credit.incomeSource, `Stated annual amount: ${credit.statedAnnualIncome}.`],
    ],
    cash: [
      [`${activeCase.id}-CASH-1`, 'NSF / returned-payment events', credit.nsfReturns, activeCase.reportedDate ?? 'Training date', credit.paymentHistory, `${credit.nsfReturns} event(s) are recorded for cash-flow comparison.`],
    ],
    digital: [
      [`${activeCase.id}-DIG-1`, 'Requested exposure', requested, activeCase.reportedDate ?? 'Training date', credit.relationshipStage, credit.requestedExposure],
      [`${activeCase.id}-DIG-2`, 'Existing utilization', Math.round((limit * utilization) / 100), 'Current review period', credit.utilization, `${credit.utilization} utilization is recorded.`],
    ],
    trends: [
      ['Stated vs verified annual support', amountNumber(credit.statedAnnualIncome), amountNumber(credit.verifiedAnnualIncome), `${credit.incomeSource}.`],
      ['Utilization percentage', 35, utilization, `${credit.utilization} current utilization.`],
      ['Debt-to-income percentage', 36, dti, `Recorded DTI: ${credit.dti}.`],
      ['Recent inquiries', 1, credit.inquiries, `${credit.inquiries} recent inquiry record(s).`],
      ['NSF / returned payments', 0, credit.nsfReturns, credit.paymentHistory],
    ],
    fundsFlow: [
      [`${activeCase.id}-FLOW-1`, credit.incomeSource, account, deposits, 'Current review period', 'Verified incoming-funds context'],
      [`${activeCase.id}-FLOW-2`, account, 'Monthly obligations and outflow', outflow, 'Current review period', credit.paymentHistory],
      [`${activeCase.id}-FLOW-3`, account, 'Requested exposure', requested, activeCase.reportedDate ?? 'Training date', credit.requestedExposure],
    ],
    cashOut: [
      [`${activeCase.id}-PAT-1`, 'Payment performance', credit.paymentHistory, 'Payment behavior is shown separately from fraud intent.'],
      [`${activeCase.id}-PAT-2`, 'Missing documentation', credit.missingDocuments.join(', ') || 'No required document missing', credit.complexityNote],
      [`${activeCase.id}-PAT-3`, 'Bankruptcy / public record', credit.bankruptcyPublicRecord, 'Public-record status is one input and not a complete decision.'],
    ],
    creditProfile: credit,
    source,
  };
}

function generatedProfile(activeCase, source) {
  const seed = stableNumber(activeCase.id);
  const credit = activeCase.toolResults?.creditProfile;
  if (credit) return generatedCreditProfile(activeCase, source, credit, seed);
  const caseAmount = Math.max(250, amountNumber(activeCase.amount));
  const currentBalance = Math.round((caseAmount * 2.65 + (seed % 900)) * 100) / 100;
  const availableBalance = Math.max(0, Math.round((currentBalance - (caseAmount * 0.35)) * 100) / 100);
  const monthlyDeposits = Math.round((caseAmount * 2.2 + (seed % 1200)) * 100) / 100;
  const monthlyOutflow = Math.round((monthlyDeposits * 0.72) * 100) / 100;
  const productRail = activeCase.taxonomyTags?.productRail ?? activeCase.taxonomy?.productRail ?? activeCase.claimTypeRecord?.taxonomy?.productRail ?? 'account';
  const creditLike = /credit|loan/.test(productRail);
  const primaryTransaction = source.transactions?.[0];
  const account = creditLike ? `Training credit relationship ending ${String(seed).slice(-4).padStart(4, '0')}` : `Training account ending ${String(seed).slice(-4).padStart(4, '0')}`;
  const records = {
    account,
    accountType: creditLike ? 'Training credit relationship' : 'Training deposit relationship',
    currentBalance: creditLike ? Math.round(caseAmount * 0.42 * 100) / 100 : currentBalance,
    availableBalance: creditLike ? Math.round(caseAmount * 2.1 * 100) / 100 : availableBalance,
    averageBalance: Math.round(currentBalance * 0.88 * 100) / 100,
    monthlyDeposits,
    monthlyOutflow,
    accountAge: `${1 + (seed % 8)} year${seed % 8 ? 's' : ''}, ${seed % 12} months`,
    accountStatus: 'Open training record',
    relationshipLength: `${1 + (seed % 8)} years`,
    creditLimit: creditLike ? money(caseAmount * 2.5) : 'Not applicable',
    overdraft: creditLike ? 'Not applicable' : 'No active overdraft recorded',
    alert: `${activeCase.claimType ?? activeCase.type ?? 'Training'} review activity recorded`,
    deposits: [
      [`${activeCase.id}-DEP-1`, productRail === 'payroll' ? 'Payroll deposit' : 'ACH credit', Math.round(monthlyDeposits * 0.48 * 100) / 100, activeCase.reportedDate ?? activeCase.opened ?? 'Training date', 'Incoming credit', 'Primary incoming-funds record for the generated case.'],
      [`${activeCase.id}-DEP-2`, 'Prior incoming credit', Math.round(monthlyDeposits * 0.45 * 100) / 100, 'Prior comparison period', 'Historical credit', 'Prior incoming-funds record available for baseline comparison.'],
    ],
    cash: [
      [`${activeCase.id}-CASH-1`, 'ATM / cash review', Math.round(caseAmount * 0.08 * 100) / 100, activeCase.reportedDate ?? activeCase.opened ?? 'Training date', 'Recorded cash activity', 'Cash activity is included as a separate comparison record.'],
    ],
    digital: [
      [`${activeCase.id}-DIG-1`, productRail === 'wire' ? 'Beneficiary payment' : 'Digital payment review', caseAmount, activeCase.reportedDate ?? activeCase.opened ?? 'Training date', 'Current case object', primaryTransaction?.merchant ?? 'Training payment object'],
      [`${activeCase.id}-DIG-2`, 'Prior digital activity', Math.round(caseAmount * 0.22 * 100) / 100, 'Prior comparison period', 'Historical object', 'Prior digital activity is available for baseline comparison.'],
    ],
    trends: [
      ['Average transaction amount', Math.round(caseAmount * 0.18), Math.round(caseAmount * 0.42), 'Current and baseline amounts are generated from the case packet.'],
      ['Monthly incoming funds', Math.round(monthlyDeposits * 0.9), Math.round(monthlyDeposits), 'Two comparison periods are available.'],
      ['Monthly outgoing funds', Math.round(monthlyOutflow * 0.84), Math.round(monthlyOutflow), 'Outgoing activity is shown without a case conclusion.'],
      ['Linked destinations', 1, Math.max(1, source.paymentVerification?.length ?? 1), 'Destination count is derived from the generated payment packet.'],
    ],
    fundsFlow: [
      [`${activeCase.id}-FLOW-1`, 'Recorded incoming source', account, Math.round(monthlyDeposits * 0.48 * 100) / 100, 'Current review period', 'Incoming credit'],
      [`${activeCase.id}-FLOW-2`, account, primaryTransaction?.merchant ?? 'Training destination', caseAmount, activeCase.reportedDate ?? activeCase.opened ?? 'Training date', 'Current case activity'],
      [`${activeCase.id}-FLOW-3`, account, 'Retained balance', availableBalance, 'Current review period', 'Balance remaining in relationship'],
    ],
    cashOut: [
      [`${activeCase.id}-PAT-1`, 'Retained balance', money(availableBalance), 'Current retained-balance amount is available for comparison.'],
      [`${activeCase.id}-PAT-2`, 'Rapid cash movement', 'Review timestamps in Funds Flow', 'The pattern workspace shows timing and destination records without assigning a risk label.'],
      [`${activeCase.id}-PAT-3`, 'Incoming-party count', '1 recorded source', 'The generated packet contains one primary incoming source.'],
    ],
  };

  return records;
}

function createRecord({ id, title, category, value, observed, status, detail, fields = [], relatedRecords = [], period = 'Current review', rail = '' }) {
  return { id, title, category, value, observed, status, detail, fields, relatedRecords, period, rail };
}

function isPersonalFinancialCase(activeCase) {
  const descriptor = [activeCase.claimTypeId, activeCase.type, activeCase.scenarioFamily, activeCase.profile?.entityRole, activeCase.customer?.segment].filter(Boolean).join(' ').toLowerCase();
  return !/(business|vendor|employer|payroll administrator|business payment contact)/.test(descriptor);
}

function transferRail(value = '') {
  if (/zelle|p2p|peer.to.peer|mobile transfer/i.test(value)) return 'Zelle / P2P';
  if (/wire|beneficiary|swift/i.test(value)) return 'Wire';
  if (/ach|direct deposit|external transfer|payroll deposit/i.test(value)) return 'ACH';
  return '';
}

function preferredPaymentRecord(source) {
  return [...(source.paymentVerification ?? [])].sort((left, right) => {
    const rank = (record) => (/verification packet/i.test(record.type) ? 0 : /payment instrument/i.test(record.type) ? 1 : /destination id/i.test(record.type) ? 2 : 3);
    return rank(left) - rank(right);
  })[0];
}

function personalTransferRecords(activeCase, profile, source) {
  if (!isPersonalFinancialCase(activeCase)) return [];
  const payment = preferredPaymentRecord(source) ?? {};
  const currentAccess = activeCase.loginHistory?.[0] ?? {};
  const transactionIds = (source.transactions ?? []).map((item) => item.id);
  const records = [];

  profile.deposits.forEach(([id, title, amount, observed, status, detail], index) => {
    const rail = transferRail(`${title} ${status}`);
    if (rail !== 'ACH') return;
    records.push(createRecord({
      id: `${id}-ACH`, title: `${title} to ${profile.account}`, category: 'Incoming transfer history', value: money(amount), observed, status, detail,
      rail, period: index === 0 ? 'Current review' : 'Prior comparison', relatedRecords: transactionIds,
      fields: [['Rail', rail], ['Direction', 'Incoming'], ['Originator / sender', title], ['Recipient account', profile.account], ['Receiving institution', payment.bankName ?? 'Training institution record'], ['Bank Code', payment.bankCode ?? 'Not supplied'], ['Destination ID', payment.destinationId ?? 'Not supplied'], ['ACH trace ID', `ACH-${id.replace(/[^A-Z0-9]/gi, '')}`], ['Amount', money(amount)], ['Status', status], ['Observed', observed], ['Prior-use context', detail]],
    }));
  });

  profile.digital.forEach(([id, title, amount, observed, status, detail], index) => {
    const rail = transferRail(`${title} ${status} ${detail}`);
    if (!rail) return;
    const recipient = /current case object|request pending|recorded/i.test(status) && detail ? detail : status;
    records.push(createRecord({
      id: `${id}-${rail === 'Wire' ? 'WIRE' : rail === 'ACH' ? 'ACH' : 'P2P'}`, title: `${title} · ${recipient}`, category: 'Outgoing transfer history', value: money(amount), observed, status, detail,
      rail, period: index === 0 ? 'Current review' : 'Prior comparison', relatedRecords: [...transactionIds, ...(payment.relatedRecords ?? [])],
      fields: [['Rail', rail], ['Direction', 'Outgoing'], ['Sender account', profile.account], ['Recipient / beneficiary', recipient || 'Recipient profile'], ['Receiving institution', payment.bankName ?? 'Training receiving institution'], ['Bank Code', payment.bankCode ?? 'Not supplied'], ['Destination ID', payment.destinationId ?? 'Not supplied'], ['Network trace ID', `${rail === 'Wire' ? 'WIRE' : rail === 'ACH' ? 'ACH' : 'P2P'}-${id.replace(/[^A-Z0-9]/gi, '')}`], ['Amount', money(amount)], ['Transfer status', amount ? 'Recorded transfer' : status], ['Observed', observed], ['Prior-use context', detail], ['Related device / session', `${currentAccess.deviceId ?? currentAccess.device ?? 'No device listed'} · ${currentAccess.session ?? 'No session listed'}`]],
    }));
  });

  const currentTransaction = source.transactions?.[0];
  const currentDescriptor = `${activeCase.subtype ?? ''} ${activeCase.transactionInfo ?? ''} ${currentTransaction?.channel ?? ''} ${currentTransaction?.merchant ?? ''}`;
  const currentRail = transferRail(currentDescriptor);
  if (currentTransaction && currentRail && !records.some((record) => record.relatedRecords.includes(currentTransaction.id) && record.rail === currentRail)) {
    const amount = amountNumber(currentTransaction.amount);
    records.unshift(createRecord({
      id: `${currentTransaction.id}-${currentRail === 'Wire' ? 'WIRE' : currentRail === 'ACH' ? 'ACH' : 'P2P'}`, title: `${profile.account} to ${currentTransaction.merchant}`, category: 'Case transfer', value: currentTransaction.amount, observed: `${currentTransaction.posted} ${currentTransaction.time ?? ''}`.trim(), status: currentTransaction.status,
      detail: currentTransaction.context ?? `${currentRail} transfer connected to the current case.`, rail: currentRail, period: 'Current review', relatedRecords: [currentTransaction.id, ...(payment.relatedRecords ?? [])],
      fields: [['Rail', currentRail], ['Direction', 'Outgoing'], ['Sender account', profile.account], ['Recipient / beneficiary', currentTransaction.merchant], ['Receiving institution', payment.bankName ?? 'Training receiving institution'], ['Bank Code', payment.bankCode ?? 'Not supplied'], ['Destination ID', payment.destinationId ?? 'Not supplied'], ['Network trace ID', `${currentRail === 'Wire' ? 'WIRE' : currentRail === 'ACH' ? 'ACH' : 'P2P'}-${currentTransaction.id.replace(/[^A-Z0-9]/gi, '')}`], ['Amount', money(amount)], ['Transfer status', currentTransaction.status], ['Observed', `${currentTransaction.posted} ${currentTransaction.time ?? ''}`.trim()], ['Prior-use context', payment.priorUse ?? 'No prior-use information supplied'], ['Related device / session', `${currentAccess.deviceId ?? currentAccess.device ?? 'No device listed'} · ${currentAccess.session ?? 'No session listed'}`]],
    }));
  }

  return records;
}

function profileRecords(activeCase, profile, source) {
  const transactionIds = (source.transactions ?? []).map((item) => item.id);
  const paymentIds = (source.paymentVerification ?? []).map((item) => item.id);
  const date = activeCase.reportedDate ?? activeCase.opened ?? 'Current review';
  const spendingRecords = (source.transactions ?? []).map((item) => createRecord({
    id: item.id,
    title: item.merchant,
    category: item.channel,
    value: item.amount,
    observed: `${item.posted} ${item.time ?? ''}`.trim(),
    status: item.status,
    detail: item.context ?? 'Transaction record available for financial comparison.',
    fields: [['Instrument', item.instrument], ['Channel', item.channel], ['Amount', item.amount], ['Status', item.status], ['Observed', `${item.posted} ${item.time ?? ''}`.trim()]],
    relatedRecords: [item.id, ...paymentIds.filter((id) => source.paymentVerification.find((record) => record.id === id)?.relatedRecords?.includes(item.id))],
    period: /historical|prior/i.test(item.status) ? 'Prior comparison' : 'Current review',
  }));

  const merchantLane = ['fraud-chargeback', 'non-fraud-chargeback', 'first-party-fraud'].includes(activeCase.claimTypeId)
    || Boolean(activeCase.toolResults?.merchantIntelligence)
    || activeCase.id === 'FA-CB-24007';
  const merchantRecords = (merchantLane ? source.transactions ?? [] : []).map((item, index) => createRecord({
    id: `MER-${item.id}`,
    title: item.merchant,
    category: 'Merchant record',
    value: item.amount,
    observed: item.posted,
    status: index === 0 ? 'Current activity' : 'Prior activity',
    detail: item.context ?? 'Merchant record available for comparison.',
    fields: [['Merchant', item.merchant], ['Channel', item.channel], ['Instrument', item.instrument], ['Transaction amount', item.amount], ['Prior record position', index === 0 ? 'Current item' : `Historical item ${index}`], ['Fulfillment / delivery', /card not present|digital/i.test(item.channel) ? 'Review merchant response or fulfillment document' : 'Not supplied in current packet']],
    relatedRecords: [item.id],
    period: index === 0 ? 'Current review' : 'Prior comparison',
  }));
  const transferRecords = personalTransferRecords(activeCase, profile, source);

  const records = {
    overview: [createRecord({
      id: `${activeCase.id}-FIN-OVERVIEW`,
      title: profile.account,
      category: profile.accountType,
      value: money(profile.currentBalance),
      observed: date,
      status: profile.accountStatus,
      detail: 'Account position, age, status, relationship, and balance values from the fictional case packet.',
      fields: [['Current balance', money(profile.currentBalance)], ['Available balance', money(profile.availableBalance)], ['Average balance', money(profile.averageBalance)], ['Account age', profile.accountAge], ['Relationship length', profile.relationshipLength], ['Credit limit', profile.creditLimit], ['Overdraft status', profile.overdraft], ['Recent alert', profile.alert]],
      relatedRecords: transactionIds,
    })],
    deposits: profile.deposits.map(([id, title, amount, observed, status, detail], index) => createRecord({ id, title, category: 'Incoming funds', value: money(amount), observed, status, detail, fields: [['Amount', money(amount)], ['Deposit type', title], ['Channel', status], ['Observed', observed], ['Baseline position', index === 0 ? 'Current review' : 'Prior comparison']], relatedRecords: transactionIds, period: index === 0 ? 'Current review' : 'Prior comparison' })),
    spending: spendingRecords,
    cash: profile.cash.map(([id, title, amount, observed, status, detail], index) => {
      const isEventCount = /event|NSF|returned-payment/i.test(title);
      const displayValue = isEventCount ? `${amount} event(s)` : money(amount);
      return createRecord({ id, title, category: 'Cash activity', value: displayValue, observed, status, detail, fields: [[isEventCount ? 'Event count' : 'Amount', displayValue], ['Cash activity type', title], ['Channel / location', status], ['Observed', observed], ['Daily limit context', isEventCount ? 'Count shown for cash-flow comparison' : amount ? 'Within the fictional daily limit' : 'No cash amount posted']], relatedRecords: transactionIds, period: index === 0 ? 'Current review' : 'Prior comparison' });
    }),
    digital: transferRecords.length ? transferRecords : profile.digital.map(([id, title, amount, observed, status, detail], index) => createRecord({ id, title, category: 'Digital payment', value: money(amount), observed, status, detail, fields: [['Amount', money(amount)], ['Rail / object', title], ['Recipient / token status', status], ['Observed', observed], ['Prior-use context', detail]], relatedRecords: [...transactionIds, ...paymentIds], period: index === 0 ? 'Current review' : 'Prior comparison', rail: transferRail(`${title} ${status} ${detail}`) || 'Other' })),
    linked: (source.paymentVerification ?? []).map((item, index) => createRecord({
      id: `LNK-${item.id}`,
      title: item.object,
      category: item.type,
      value: item.ownerMatch ?? item.status,
      observed: item.firstSeen ?? item.lastSeen,
      status: item.accountStatus ?? item.status,
      detail: item.changeComparison ?? item.context,
      fields: [['Destination type', item.type ?? 'Payment object'], ['Bank Code', item.bankCode ?? 'Not supplied'], ['Destination ID', item.destinationId ?? 'Not supplied'], ['Recipient / account holder', item.accountHolder ?? 'Not supplied'], ['Receiving institution', item.bankName ?? 'Not supplied'], ['Owner match', item.ownerMatch ?? 'Not supplied'], ['Account status', item.accountStatus ?? item.status], ['First seen', item.firstSeen ?? 'Not supplied'], ['Last seen', item.lastSeen ?? 'Not supplied'], ['Prior use', item.priorUse ?? 'Not supplied'], ['Related transfer count', String(item.relatedRecords?.filter((id) => /TXN|DIG|FLOW/i.test(id)).length ?? 0)], ['Verification method', item.verificationMethod ?? 'Not supplied'], ['Added / observed from', `${activeCase.loginHistory?.[0]?.deviceId ?? activeCase.loginHistory?.[0]?.device ?? 'Device not listed'} · ${activeCase.loginHistory?.[0]?.session ?? 'Session not listed'}`], ['Failed verification attempts', (item.verificationLog ?? []).filter((entry) => /unable|no answer|failed/i.test(entry.result)).length.toString()]],
      relatedRecords: item.relatedRecords ?? [],
      period: index === 0 ? 'Current review' : 'Related object',
    })),
    merchant: merchantRecords,
    trends: profile.trends.map(([label, baseline, current, context], index) => createRecord({ id: `${activeCase.id}-TREND-${index + 1}`, title: label, category: 'Baseline comparison', value: `${baseline} -> ${current}`, observed: date, status: 'Comparison available', detail: context, fields: [['Baseline', String(baseline)], ['Current', String(current)], ['Change', String(current - baseline)], ['Comparison note', context]], relatedRecords: transactionIds, period: 'Baseline comparison' })),
    'funds-flow': profile.fundsFlow.map(([id, sourceName, destination, amount, observed, status], index) => createRecord({ id, title: `${sourceName} to ${destination}`, category: 'Funds-flow step', value: money(amount), observed, status, detail: `${status}. Follow the sequence and compare the timestamp with the active case timeline.`, fields: [['Source', sourceName], ['Destination', destination], ['Amount', money(amount)], ['Observed', observed], ['Sequence', String(index + 1)], ['Recorded movement', status]], relatedRecords: [...transactionIds, ...paymentIds], period: 'Current review' })),
    'cash-out': profile.cashOut.map(([id, title, value, detail]) => createRecord({ id, title, category: 'Pattern observation', value, observed: date, status: 'Evidence only', detail, fields: [['Observation', title], ['Recorded value', value], ['Evidence note', detail], ['Conclusion', 'No conclusion is assigned inside Financial Investigation']], relatedRecords: [...transactionIds, ...paymentIds], period: 'Current review' })),
  };

  if (profile.creditProfile) {
    const credit = profile.creditProfile;
    records.overview.push(createRecord({
      id: `${activeCase.id}-CREDIT-PROFILE`, title: `${credit.family} evidence profile`, category: 'Structured credit review', value: credit.requestedExposure, observed: date, status: credit.applicationStatus, detail: credit.sourceNote,
      fields: [['Family', credit.family], ['Customer type', credit.customerType], ['Relationship stage', credit.relationshipStage], ['Subject', credit.subject], ['Requested exposure', credit.requestedExposure], ['Stated annual income / revenue', credit.statedAnnualIncome], ['Verified annual income / revenue', credit.verifiedAnnualIncome], ['DTI', credit.dti], ['Credit score band', credit.creditScoreBand], ['Utilization', credit.utilization], ['Payment history', credit.paymentHistory], ['Deadline', credit.deadline], ['Reason code', credit.reasonCode]], relatedRecords: [...transactionIds, ...paymentIds],
    }));
    records.deposits.push(createRecord({
      id: `${activeCase.id}-INCOME-VERIFY`, title: 'Income and revenue reconciliation', category: 'Income verification', value: `${credit.statedAnnualIncome} stated / ${credit.verifiedAnnualIncome} verified`, observed: date, status: 'Source comparison available', detail: credit.incomeSource,
      fields: [['Stated annual amount', credit.statedAnnualIncome], ['Verified annual amount', credit.verifiedAnnualIncome], ['Frequency', credit.incomeFrequency], ['Employer / business', credit.employerOrBusiness], ['Average monthly deposits', credit.averageMonthlyDeposits]], relatedRecords: transactionIds,
    }));
    records.trends.push(createRecord({
      id: `${activeCase.id}-CREDIT-FILE`, title: 'Credit-file and obligation summary', category: 'Credit report', value: credit.creditScoreBand, observed: date, status: 'Training bureau summary available', detail: `${credit.tradelines} tradelines and ${credit.inquiries} recent inquiries are recorded.`,
      fields: [['Training bureau', credit.bureau], ['Score band', credit.creditScoreBand], ['Tradelines', credit.tradelines], ['Utilization', credit.utilization], ['Delinquencies', credit.delinquencies], ['Inquiries', credit.inquiries], ['Collections', credit.collections], ['Bankruptcy / public record', credit.bankruptcyPublicRecord]], relatedRecords: transactionIds,
    }));
    records.cash.push(createRecord({
      id: `${activeCase.id}-CASH-FLOW`, title: 'Cash-flow and bank-statement summary', category: 'Cash flow', value: `${credit.averageMonthlyDeposits} in / ${credit.averageMonthlyOutflow} out`, observed: date, status: 'Statement comparison available', detail: `${credit.nsfReturns} NSF / returned-payment event(s); average balance ${credit.averageBalance}.`,
      fields: [['Average monthly deposits', credit.averageMonthlyDeposits], ['Average monthly outflow', credit.averageMonthlyOutflow], ['Average balance', credit.averageBalance], ['Overdrafts', credit.overdrafts], ['NSF / returns', credit.nsfReturns], ['Payment history', credit.paymentHistory]], relatedRecords: transactionIds,
    }));
    records.linked.push(createRecord({
      id: `${activeCase.id}-CREDIT-DOCS`, title: 'Credit document inventory', category: 'Document status', value: `${credit.completedDocuments.length} complete / ${credit.missingDocuments.length} missing`, observed: date, status: credit.missingDocuments.length ? 'Documents pending' : 'Required documents available', detail: credit.complexityNote,
      fields: [['Complete documents', credit.completedDocuments.join(', ')], ['Missing documents', credit.missingDocuments.join(', ') || 'None'], ['Source note', credit.sourceNote]], relatedRecords: activeCase.documents?.map((item) => item.id) ?? [],
    }));
  }

  return records;
}

export function getFinancialInvestigation(activeCase = {}) {
  const source = getFinancialRecords(activeCase);
  const profile = builtInProfiles[activeCase.id] ?? generatedProfile(activeCase, source);
  const recordsByTab = profileRecords(activeCase, profile, source);
  const totalTransactions = source.transactions?.length ?? 0;
  const availableTransferRails = [...new Set((recordsByTab.digital ?? []).map((record) => record.rail).filter(Boolean))];
  return {
    profile,
    recordsByTab,
    availableTransferRails,
    personalTransferView: isPersonalFinancialCase(activeCase),
    kpis: [
      { label: 'Current balance', value: money(profile.currentBalance), context: profile.account },
      { label: 'Available balance', value: money(profile.availableBalance), context: profile.accountStatus },
      { label: 'Monthly deposits', value: money(profile.monthlyDeposits), context: 'Current comparison period' },
      { label: 'Monthly outflow', value: money(profile.monthlyOutflow), context: `${totalTransactions} transaction record${totalTransactions === 1 ? '' : 's'} in scope` },
    ],
    comparison: profile.trends.map(([label, baseline, current, context]) => ({ label, baseline, current, context })),
    depositTrend: profile.deposits.map(([, title, amount, observed]) => ({ label: observed, value: amount, title })),
    reviewedFacts: [
      `${profile.account} is ${profile.accountStatus.toLowerCase()} with ${money(profile.availableBalance)} available.`,
      `${money(profile.monthlyDeposits)} in recorded incoming funds and ${money(profile.monthlyOutflow)} in outgoing activity are available for comparison.`,
      `${source.paymentVerification?.length ?? 0} linked payment object${source.paymentVerification?.length === 1 ? '' : 's'} and ${totalTransactions} transaction record${totalTransactions === 1 ? '' : 's'} connect to this workspace.`,
    ],
    relatedRecordIds: [...(source.transactions ?? []).map((item) => item.id), ...(source.paymentVerification ?? []).map((item) => item.id)],
  };
}

export function financialRecordSearchText(record = {}) {
  return [
    record.id,
    record.title,
    record.category,
    record.value,
    record.observed,
    record.status,
    record.detail,
    record.period,
    ...(record.fields ?? []).flat(),
    ...(record.relatedRecords ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
}
