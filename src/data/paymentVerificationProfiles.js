import { financialRecordsByCase } from './financialRecords.js';
import { businessRecordsByCase } from './businessRecords.js';
import { evidenceRecordsByCase } from './evidenceRecords.js';

const builtInProfiles = {
  'FA-ATO-24018': {
    primaryObject: 'Debit card ending 4410',
    secondaryObject: 'Merchant processor token MPT-7784',
    objectLabels: ['Payment instrument', 'Processor destination'],
    ownershipName: 'Maya Sterling',
    ownershipComparison: 'Customer profile name is listed on the payment instrument record; merchant processor token belongs to Northstar Payments LLC.',
    accountType: 'Traditional bank debit card with merchant processor destination',
    verificationStatus: 'Instrument active · authorization trail available',
    verificationHistory: [
      { value: 'Jul 8, 2026 · AUTH-74218-CNP', detail: 'Authorization trail linked to TXN-1001 and processor token MPT-7784' },
      { value: 'Jul 7, 2026 · card-present comparison', detail: 'Recent card-present record available for neutral comparison' },
      { value: 'Jan 18, 2026 · card replacement', detail: 'Prior servicing record connected to the current card ending' },
    ],
    priorPayrollUse: [{ value: 'No payroll use tied to this card destination', detail: 'Payroll History contains no customer payroll destination for this consumer card case' }],
    sharedUse: [{ value: 'No separate shared-user record supplied', detail: 'Current payment record lists the customer profile holder and merchant processor relationship only' }],
  },
  'FA-CB-24007': {
    primaryObject: 'Credit card ending 8841',
    secondaryObject: 'Subscription billing token SBT-2207',
    objectLabels: ['Payment instrument', 'Merchant billing object'],
    ownershipName: 'Jordan Ellis',
    ownershipComparison: 'Customer profile name is listed on the card record; subscription billing token belongs to StreamBox Billing Services LLC.',
    accountType: 'Traditional credit card with recurring merchant billing token',
    verificationStatus: 'Instrument active · recurring billing packet open',
    verificationHistory: [
      { value: 'Jul 8, 2026 · TXN-2201', detail: 'Current recurring billing record linked to SBT-2207' },
      { value: 'Jun 8, 2026 · TXN-2202', detail: 'Prior billing cycle with the same card and merchant token' },
      { value: 'May 8, 2026 · TXN-2203', detail: 'Earlier billing cycle with a different amount' },
    ],
    priorPayrollUse: [{ value: 'No payroll use tied to this card destination', detail: 'Payroll History contains no customer payroll destination for this billing dispute' }],
    sharedUse: [{ value: 'No authorized-user record supplied in the current case packet', detail: 'Do not infer shared use without an attached account-user record' }],
  },
  'FA-CR-24003': {
    primaryObject: 'BC-204',
    secondaryObject: 'DST-7740',
    objectLabels: ['Bank Code', 'Destination ID'],
    ownershipName: 'Avery Brooks',
    ownershipComparison: 'Submitted customer name and destination-owner field both show Avery Brooks in the fictional verification packet.',
    accountType: 'Traditional bank checking destination',
    verificationStatus: 'Tokenized · pending investigator review',
    verificationHistory: [
      { value: 'Jul 8, 2026 · PV-24003', detail: 'Verification packet grouped BC-204, DST-7740, identity objects, and account activity' },
      { value: 'Jul 8, 2026 · destination setup', detail: 'Destination ID was added before the credit-line usage request' },
      { value: 'Jul 7, 2026 · profile opening', detail: 'Payment destination was not present at initial profile creation' },
    ],
    priorPayrollUse: [
      { value: 'Jul 2026 · Lakeside Office Supply LLC', detail: '$1,280.00 direct deposit to checking destination ending 1182' },
      { value: 'Jun 2026 · Lakeside Office Supply LLC', detail: '$1,280.00 direct deposit to checking destination ending 1182' },
      { value: 'May 2026 · Lakeside Office Supply LLC', detail: '$1,240.00 direct deposit to checking destination ending 1182' },
    ],
    sharedUse: [
      { value: 'Avery Brooks', detail: 'Employee and destination-owner record supplied in the verification packet' },
      { value: 'No second owner supplied', detail: 'The current fictional source set contains no joint-owner record' },
    ],
  },
};

function generatedProfile(activeCase) {
  const business = activeCase.businessProfile ?? {};
  const bankCode = business.bankCode ?? `BC-${String(activeCase.id).slice(-3)}`;
  const destinationId = business.destinationId ?? `DST-${String(activeCase.id).slice(-8)}`;
  const isCredit = activeCase.type === 'Credit Risk Review';
  return {
    primaryObject: bankCode,
    secondaryObject: destinationId,
    objectLabels: ['Bank Code', 'Destination ID'],
    ownershipName: activeCase.person,
    ownershipComparison: `Submitted customer name and generated destination-owner field both show ${activeCase.person}.`,
    accountType: isCredit ? 'Traditional bank checking destination' : 'Generated bank or payment destination',
    verificationStatus: 'Generated verification packet available for review',
    verificationHistory: [
      { value: `${activeCase.opened} · PV-${String(activeCase.id).slice(-8)}`, detail: `Verification packet grouped ${bankCode}, ${destinationId}, identity, business, and transaction objects` },
      { value: 'Generated setup event', detail: 'Payment destination was created before the case-linked activity record' },
    ],
    priorPayrollUse: [
      { value: isCredit ? 'Generated current-period payroll record' : 'No payroll relationship required for this case type', detail: isCredit ? '$1,280.00 fictional direct deposit linked to the listed employer' : 'Merchant or payment relationship is documented without customer payroll activity' },
    ],
    sharedUse: [
      { value: activeCase.person, detail: 'Generated destination-owner or payment-profile holder' },
      { value: 'No second owner supplied', detail: 'No joint-owner record appears in the generated packet' },
    ],
  };
}

function mapRecords(records = [], mapper) {
  return records.map(mapper);
}

export function buildPaymentVerificationProfile(activeCase) {
  const base = builtInProfiles[activeCase.id] ?? generatedProfile(activeCase);
  const financial = financialRecordsByCase[activeCase.id] ?? null;
  const business = businessRecordsByCase[activeCase.id] ?? null;
  const evidence = evidenceRecordsByCase[activeCase.id] ?? null;
  const paymentRows = financial?.paymentVerification ?? [
    { id: `${activeCase.id}-PAY-1`, type: base.objectLabels[0], object: base.primaryObject, status: base.verificationStatus, lastSeen: activeCase.opened, context: base.ownershipComparison },
    { id: `${activeCase.id}-PAY-2`, type: base.objectLabels[1], object: base.secondaryObject, status: base.verificationStatus, lastSeen: activeCase.opened, context: base.accountType },
  ];
  const transactions = financial?.transactions ?? [
    { id: `${activeCase.id}-TXN-1`, posted: activeCase.opened, time: 'Generated case time', merchant: activeCase.transactionInfo, amount: activeCase.amount, channel: 'Generated activity', instrument: base.secondaryObject, status: 'Recorded' },
  ];
  const employees = business?.employeeProfile ?? [];
  const documents = evidence?.documents ?? (activeCase.documents ?? []).map((item) => ({ id: item.id, title: item.name ?? item.title, status: item.status, preview: item.preview ?? item.detail }));

  return {
    ...base,
    objectSummary: [
      { value: `${base.objectLabels[0]} · ${base.primaryObject}`, detail: base.verificationStatus },
      { value: `${base.objectLabels[1]} · ${base.secondaryObject}`, detail: base.accountType },
      { value: `Ownership name · ${base.ownershipName}`, detail: base.ownershipComparison },
    ],
    paymentRecords: mapRecords(paymentRows, (item) => ({ value: `${item.id} · ${item.type} · ${item.object}`, detail: `${item.status} · ${item.lastSeen} · ${item.context}` })),
    transactions: mapRecords(transactions, (item) => ({ value: `${item.id} · ${item.amount} · ${item.merchant}`, detail: `${item.posted} ${item.time} · ${item.channel} · ${item.instrument} · ${item.status}` })),
    peopleRelationships: [
      { value: `${activeCase.person} · customer profile`, detail: `${activeCase.trainingId} · ${activeCase.customer?.contact?.email ?? 'No email recorded'} · ${activeCase.customer?.contact?.phone ?? 'No phone recorded'}` },
      ...mapRecords(employees, (item) => ({ value: `${item.name} · ${item.role}`, detail: `${item.employer} · ${item.status} · ${item.context}` })),
    ],
    documents: mapRecords(documents, (item) => ({ value: `${item.id} · ${item.title}`, detail: `${item.status} · ${item.preview ?? 'Open Document Viewer for detail'}` })),
  };
}
