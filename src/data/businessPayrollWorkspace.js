import { getBusinessRecords, getFinancialRecords } from './caseToolData.js';
import { isPaymentProfileEvent } from './paymentVerification.js';

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

function toPaymentSource(record, activeCase) {
  if (!record) return null;
  const businessOwnerLane = ['email-bec', 'business-loan-bust-out', 'ach-wire-check'].includes(activeCase.claimTypeId);
  return {
    recordId: record.id,
    bankCode: record.bankCode,
    destinationId: record.destinationId,
    ownerToCompare: businessOwnerLane
      ? activeCase.profile?.business ?? activeCase.person
      : activeCase.person,
    previousDestination: record.oldDestination,
    newDestination: record.newDestination,
    changeComparison: record.changeComparison,
    callbackStatus: record.callbackStatus,
    relatedRecords: record.relatedRecords ?? [],
  };
}

function getPaymentSources(activeCase) {
  if (!activeCase.availableTools?.includes('Payment Verification')) return [];
  return getFinancialRecords(activeCase).paymentVerification.map((record) => toPaymentSource(record, activeCase));
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
  const paymentSources = getPaymentSources(activeCase);
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
    paymentSources,
    paymentSource: paymentSources[0] ?? null,
  };
}

export function getEmployeeProfiles(activeCase) {
  const records = getBusinessRecords(activeCase);
  const payroll = records.payrollHistory ?? [];
  const paymentSource = getPaymentSources(activeCase)[0] ?? null;
  return (records.employeeProfile ?? []).map((item, index) => ({
    ...item,
    department: /payroll/i.test(`${item.role} ${item.name}`) ? 'Payroll operations' : 'Operations / training record',
    hireDate: index === 0 && activeCase.id === 'FA-CR-24003' ? 'Training employment date on file' : 'Not supplied in current packet',
    employmentTimeline: item.lastSeen ? `Current record last observed ${item.lastSeen}` : 'No timeline supplied',
    officialContact: /payroll/i.test(`${item.role} ${item.name}`) ? 'Training payroll callback channel' : 'Official callback channel not supplied',
    directDeposit: paymentSource
      ? `Bank Code ${paymentSource.bankCode} · Destination ID ${paymentSource.destinationId}; ${paymentSource.previousDestination} → ${paymentSource.newDestination}`
      : payroll.length ? `${payroll.length} payroll record${payroll.length === 1 ? '' : 's'} available for comparison` : 'No payroll history supplied',
    linkedPayroll: payroll.map((record) => record.id),
    paymentSource,
  }));
}

export function getPayrollHistory(activeCase) {
  const records = getBusinessRecords(activeCase);
  const employees = records.employeeProfile ?? [];
  const paymentSources = getPaymentSources(activeCase);
  const paymentProfileEvent = (activeCase.customer?.profileChanges ?? []).find(isPaymentProfileEvent);
  return (records.payrollHistory ?? []).map((item, index) => {
    const paymentSource = paymentSources.find((source) => source.relatedRecords.includes(item.id))
      ?? paymentSources[0]
      ?? null;
    const hasDestinationContext = /direct deposit/i.test(item.channel)
      || activeCase.claimTypeId === 'payroll-direct-deposit';
    const exactDestination = paymentSource
      ? `Bank Code ${paymentSource.bankCode} · Destination ID ${paymentSource.destinationId}`
      : 'No payroll destination in current packet';
    return {
      ...item,
      employee: employees.find((employee) => employee.employer === item.employer)?.name ?? activeCase.person,
      bankCode: hasDestinationContext ? paymentSource?.bankCode ?? 'Not supplied' : 'Not applicable',
      destinationId: hasDestinationContext ? paymentSource?.destinationId ?? 'Not supplied' : 'Not applicable',
      destination: hasDestinationContext
        ? index === 0 ? exactDestination : paymentSource?.previousDestination ?? exactDestination
        : 'No payroll destination in current packet',
      priorDestination: hasDestinationContext ? paymentSource?.previousDestination ?? 'Not supplied' : 'Not applicable',
      oldDestination: hasDestinationContext ? paymentSource?.previousDestination ?? 'Not supplied' : 'Not applicable',
      newDestination: hasDestinationContext ? paymentSource?.newDestination ?? exactDestination : 'Not applicable',
      effectiveDate: item.period,
      changeRequest: hasDestinationContext
        ? paymentSource?.changeComparison ?? paymentProfileEvent?.detail ?? 'No change comparison supplied'
        : 'Not applicable',
      adminActivity: hasDestinationContext
        ? paymentProfileEvent
          ? `${paymentProfileEvent.id} · ${paymentProfileEvent.oldValue} → ${paymentProfileEvent.newValue}`
          : 'No linked payment-profile event supplied'
        : 'Not applicable',
      callback: hasDestinationContext ? paymentSource?.callbackStatus ?? 'Trusted callback status not recorded' : 'Not applicable',
      changeComparison: hasDestinationContext ? paymentSource?.changeComparison ?? 'Not supplied' : 'Not applicable',
      paymentRecordId: hasDestinationContext ? paymentSource?.recordId ?? null : null,
      paymentSource: hasDestinationContext ? paymentSource : null,
      runStatus: item.status,
      relatedRecords: [
        item.id,
        ...employees.filter((employee) => employee.employer === item.employer).map((employee) => employee.id),
        ...(paymentSource?.recordId ? [paymentSource.recordId] : []),
        ...(paymentProfileEvent?.id ? [paymentProfileEvent.id] : []),
      ],
    };
  });
}
