import { getBusinessRecords, getFinancialRecords } from './caseToolData.js';

const businessProfiles = {
  'FA-ATO-24018': {
    entityType: 'Merchant and processor context',
    registration: 'Merchant registration record not requested for this consumer claim',
    ein: 'Not supplied',
    owner: 'Not supplied in current packet',
    officer: 'Not supplied in current packet',
    registeredAgent: 'Not supplied in current packet',
    address: 'Merchant location record available through transaction detail',
    filingDate: 'Not supplied',
    standing: 'Scope limited to merchant relationship',
    revenue: 'Not supplied in current packet',
    contact: 'Merchant response channel available through Document Viewer',
  },
  'FA-CB-24007': {
    entityType: 'Subscription merchant',
    registration: 'Merchant registration record not requested for billing review',
    ein: 'Not supplied',
    owner: 'Not supplied in current packet',
    officer: 'Not supplied in current packet',
    registeredAgent: 'Not supplied in current packet',
    address: 'Merchant service address not supplied',
    filingDate: 'Not supplied',
    standing: 'Merchant relationship available for review',
    revenue: 'Recurring billing records only',
    contact: 'Merchant support response requested',
  },
  'FA-CR-24003': {
    entityType: 'Training employer profile',
    registration: 'Fictional state registration record available',
    ein: '**-***4821',
    owner: 'Training owner record',
    officer: 'Training operations officer',
    registeredAgent: 'Training registered agent',
    address: 'Fictional employer business address',
    filingDate: 'Training filing date',
    standing: 'Active fictional business record',
    revenue: 'Payroll relationship amount available below',
    contact: 'Payroll office contact object recorded',
  },
};

function amountValue(value = '') {
  return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
}

function transactionCategory(item) {
  if (/recurring/i.test(item.channel)) return 'Recurring';
  if (/transfer|destination|account request|payment setup/i.test(`${item.merchant} ${item.channel}`)) return 'Account activity';
  if (/fuel/i.test(item.merchant)) return 'Fuel';
  if (/grocery/i.test(item.merchant)) return 'Grocery';
  return 'Digital goods';
}

function transactionLocation(item) {
  if (/card present/i.test(item.channel)) return 'Merchant location recorded in training packet';
  if (/recurring/i.test(item.channel)) return 'Merchant billing location not supplied';
  if (/account request|payment setup/i.test(item.channel)) return 'Internal account workspace';
  return 'Online merchant location not supplied';
}

function transactionEntryMode(item) {
  if (/card not present/i.test(item.channel)) return 'Card not present';
  if (/card present/i.test(item.channel)) return 'Chip / card present';
  if (/recurring/i.test(item.channel)) return 'Stored credential / recurring';
  if (/payment setup/i.test(item.channel)) return 'Profile setup';
  return 'Internal request';
}

export function getTransactionHistory(activeCase) {
  const financial = getFinancialRecords(activeCase);
  return financial.transactions.map((item) => ({
    ...item,
    amountValue: amountValue(item.amount),
    direction: amountValue(item.amount) > 0 ? 'Debit' : 'Non-monetary',
    category: transactionCategory(item),
    location: transactionLocation(item),
    entryMode: transactionEntryMode(item),
    relatedRecords: [item.id, ...((financial.paymentVerification ?? []).filter((record) => record.relatedRecords?.includes(item.id)).map((record) => record.id))],
    relatedDocuments: activeCase.documents?.slice(0, 2).map((document) => document.id ?? document.title ?? document.name) ?? [],
  }));
}

export function getBusiness360Workspace(activeCase) {
  const records = getBusinessRecords(activeCase);
  const primary = records.business360?.[0] ?? { entity: 'No business entity recorded', id: 'BIZ-NONE', relationship: 'No relationship recorded', status: 'Not supplied', observed: 'Not supplied', context: 'No current business record.' };
  const profile = activeCase.businessProfile ?? businessProfiles[activeCase.id] ?? {
    entityType: activeCase.profile?.entityType ?? 'Generated training entity',
    registration: `Generated fictional registration for ${primary.entity}`,
    ein: `**-***${String(activeCase.id ?? '0000').replace(/\D/g, '').slice(-4).padStart(4, '0')}`,
    owner: activeCase.person ?? 'Training owner record',
    officer: activeCase.profile?.entityRole ?? 'Training controlling-party record',
    registeredAgent: 'Generated training registered-agent record',
    address: activeCase.customer?.contact?.address ?? `${activeCase.intake?.customerLocation ?? 'Training location'} business address`,
    filingDate: activeCase.opened ?? 'Training date',
    standing: 'Fictional business record available',
    revenue: `Case-specific activity available for ${activeCase.amount ?? 'the current review'}`,
    contact: activeCase.customer?.contact?.phone ?? 'Training business contact record',
  };
  return {
    profile: {
      entity: primary.entity,
      ...profile,
      relationship: primary.relationship,
      observed: primary.observed,
    },
    relationships: records.business360 ?? [],
    intelligence: records.businessIntel ?? [],
    documents: activeCase.documents ?? [],
  };
}

export function getEmployeeProfiles(activeCase) {
  const records = getBusinessRecords(activeCase);
  const payroll = records.payrollHistory ?? [];
  return (records.employeeProfile ?? []).map((item, index) => ({
    ...item,
    department: /payroll/i.test(`${item.role} ${item.name}`) ? 'Payroll operations' : 'Operations / training record',
    hireDate: index === 0 && activeCase.id === 'FA-CR-24003' ? 'Training employment date on file' : 'Not supplied in current packet',
    employmentTimeline: item.lastSeen ? `Current record last observed ${item.lastSeen}` : 'No timeline supplied',
    officialContact: /payroll/i.test(`${item.role} ${item.name}`) ? 'Training payroll callback channel' : 'Official callback channel not supplied',
    directDeposit: payroll.length ? `${payroll.length} payroll record${payroll.length === 1 ? '' : 's'} available for comparison` : 'No payroll history supplied',
    linkedPayroll: payroll.map((record) => record.id),
  }));
}

export function getPayrollHistory(activeCase) {
  const records = getBusinessRecords(activeCase);
  const financial = getFinancialRecords(activeCase);
  const employees = records.employeeProfile ?? [];
  const paymentRecords = financial.paymentVerification ?? [];
  const fundingAccount = paymentRecords.find((record) => /payroll funding/i.test(`${record.type} ${record.accountType}`));
  return (records.payrollHistory ?? []).map((item, index) => ({
    ...normalizePayrollRun({ item, index, activeCase, employees, paymentRecords, fundingAccount }),
  }));
}

function normalizePayrollRun({ item, index, activeCase, employees, paymentRecords, fundingAccount }) {
  const employee = employees.find((record) => record.employer === item.employer)?.name ?? activeCase.person;
  const currentPayment = paymentRecords.find((record) => /payroll destination/i.test(`${record.type} ${record.accountType}`) && !/established payroll destination/i.test(record.type));
  const priorPayment = paymentRecords.find((record) => /established payroll destination/i.test(record.type));
  const linkedPayment = paymentRecords.find((record) => record.relatedRecords?.includes(item.id) && !/funding|payee/i.test(`${record.type} ${record.accountType}`))
    ?? (index === 0 ? currentPayment : priorPayment)
    ?? paymentRecords.find((record) => /payroll destination/i.test(`${record.type} ${record.accountType}`) && normalizeName(record.accountHolder) === normalizeName(employee));
  const defaultPayee = {
    id: employees.find((record) => normalizeName(record.name) === normalizeName(employee))?.id ?? `${item.id}-EMP-1`,
    employee,
    employeeId: employees.find((record) => normalizeName(record.name) === normalizeName(employee))?.id ?? `EMP-${String(index + 1).padStart(4, '0')}`,
    amount: item.amount,
    status: item.status,
    ownerName: employee,
    bankCode: item.bankCode ?? linkedPayment?.bankCode ?? 'No Bank Code returned',
    destinationId: item.destinationId ?? linkedPayment?.destinationId ?? 'No Destination ID returned',
    priorDestinationId: item.priorDestinationId ?? linkedPayment?.oldDestination ?? 'No prior destination returned',
    paymentRecordId: linkedPayment?.id ?? '',
  };
  const comparisonPayees = paymentRecords.filter((record) => /payroll payee destination/i.test(record.type)).slice(0, 2).map((record, comparisonIndex) => ({
    id: `${item.id}-EMP-${comparisonIndex + 2}`,
    employee: record.accountHolder,
    employeeId: `EMP-${String(index + 1)}${String(comparisonIndex + 2).padStart(3, '0')}`,
    amount: item.amount,
    status: item.status,
    ownerName: record.accountHolder,
    bankCode: record.bankCode,
    destinationId: record.destinationId,
    priorDestinationId: record.destinationId,
    paymentRecordId: record.id,
  }));
  const payees = (item.payees?.length ? item.payees : [defaultPayee, ...comparisonPayees]).map((payee, payeeIndex) => ({
    id: payee.id ?? `${item.id}-EMP-${payeeIndex + 1}`,
    employee: payee.employee ?? payee.name ?? employee,
    employeeId: payee.employeeId ?? payee.id ?? `EMP-${String(payeeIndex + 1).padStart(4, '0')}`,
    amount: payee.amount ?? item.amount,
    status: payee.status ?? item.status,
    ownerName: payee.ownerName ?? payee.employee ?? payee.name ?? employee,
    bankCode: payee.bankCode ?? 'No Bank Code returned',
    destinationId: payee.destinationId ?? 'No Destination ID returned',
    priorDestinationId: payee.priorDestinationId ?? 'No prior destination returned',
    paymentRecordId: payee.paymentRecordId ?? '',
  }));

  return {
    ...item,
    employee: payees[0]?.employee ?? employee,
    destination: payees[0]?.destinationId ?? 'No payroll destination in current packet',
    bankCode: payees[0]?.bankCode ?? 'No Bank Code returned',
    destinationId: payees[0]?.destinationId ?? 'No Destination ID returned',
    priorDestination: payees[0]?.priorDestinationId ?? 'No prior destination returned',
    effectiveDate: item.effectiveDate ?? item.period,
    changeRequest: item.changeRequest ?? (/direct deposit/i.test(item.channel) ? 'No payroll change request is included in this training packet' : 'Not applicable'),
    adminActivity: item.adminActivity ?? (/direct deposit/i.test(item.channel) ? 'No payroll admin change activity recorded in this packet' : 'Not applicable'),
    callback: item.callback ?? (/direct deposit/i.test(item.channel) ? 'Trusted callback status not recorded' : 'Not applicable'),
    fundingOwner: item.fundingOwner ?? fundingAccount?.accountHolder ?? item.employer,
    fundingBankCode: item.fundingBankCode ?? fundingAccount?.bankCode ?? 'No funding Bank Code returned',
    fundingDestinationId: item.fundingDestinationId ?? fundingAccount?.destinationId ?? 'No funding Destination ID returned',
    fundingPaymentRecordId: item.fundingPaymentRecordId ?? fundingAccount?.id ?? '',
    runStatus: item.status,
    payees,
    relatedRecords: [...new Set([item.id, ...employees.filter((record) => record.employer === item.employer).map((record) => record.id), ...payees.map((payee) => payee.paymentRecordId).filter(Boolean), item.fundingPaymentRecordId ?? fundingAccount?.id].filter(Boolean))],
  };
}

function normalizeName(value = '') {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}
