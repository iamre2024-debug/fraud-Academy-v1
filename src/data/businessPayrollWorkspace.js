import { getBusinessRecords, getFinancialRecords } from './caseToolData.js';
import { isPaymentProfileEvent } from './paymentVerification.js';
import { WORKFLOW_TYPES } from './caseDomain.js';
import { buildCaseParties } from './caseParties.js';
import { UNKNOWN_REQUEST_METHOD } from './payrollInvestigation.js';

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

function payrollSeed(value = '') {
  return [...String(value)].reduce(
    (total, character) => ((total * 31) + character.charCodeAt(0)) % 10000,
    29,
  );
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function parsedPayrollDate(value, fallbackIndex = 0, allowFallback = true) {
  const text = String(value ?? '').replace(/\s+·.*$/, '').trim();
  const range = text.match(
    /^([A-Za-z]{3,9})\s+\d{1,2}\s*[–—-]\s*(?:([A-Za-z]{3,9})\s+)?(\d{1,2}),?\s+((?:19|20)\d{2})\b/,
  );
  if (range) {
    const parsedRangeEnd = new Date(`${range[2] ?? range[1]} ${range[3]}, ${range[4]} 12:00:00 UTC`);
    if (!Number.isNaN(parsedRangeEnd.getTime())) return parsedRangeEnd;
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  if (!allowFallback) return null;
  return new Date(2026, 6, Math.max(1, 28 - (fallbackIndex * 14)), 12, 0, 0);
}

function displayDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

function displayMonth(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function payrollPeriodFor(value, index, allowFallback = true) {
  const processed = parsedPayrollDate(value, index, allowFallback);
  if (!processed) {
    const supplied = String(value ?? '').trim() || 'Date not supplied in preserved payroll record';
    return {
      processedDate: supplied,
      month: supplied,
      payPeriodStart: 'Not supplied in preserved payroll record',
      payPeriodEnd: 'Not supplied in preserved payroll record',
      payPeriodLabel: supplied,
      nextScheduledPayroll: 'Not supplied in preserved payroll record',
    };
  }
  const year = processed.getFullYear();
  const month = processed.getMonth();
  const firstHalf = processed.getDate() <= 15;
  const start = new Date(year, month, firstHalf ? 1 : 16, 12, 0, 0);
  const end = new Date(year, month + (firstHalf ? 0 : 1), firstHalf ? 15 : 0, 12, 0, 0);
  const next = new Date(year, month + (firstHalf ? 0 : 1), firstHalf ? 16 : 1, 12, 0, 0);
  return {
    processedDate: displayDate(processed),
    month: displayMonth(processed),
    payPeriodStart: displayDate(start),
    payPeriodEnd: displayDate(end),
    payPeriodLabel: `${displayDate(start)} – ${displayDate(end)}`,
    nextScheduledPayroll: displayDate(next),
  };
}

function payrollAmounts(item, activeCase, index) {
  const recordedAmount = amountValue(
    item.totalCompanyDebit
      ?? item.fundingAmount
      ?? item.amount,
  );
  const seed = payrollSeed(`${activeCase.id}-${item.id}-${index}`);
  const legacyCoverage = activeCase.legacyDerivedEvidence === true;
  const suppliedEmployeeCount = item.employeeCount === undefined || item.employeeCount === null
    ? null
    : Number(item.employeeCount);
  const employeeCount = Number.isFinite(suppliedEmployeeCount)
    ? suppliedEmployeeCount
    : legacyCoverage ? null : 22 + (seed % 8);
  const suppliedCompanyTotal = item.totalCompanyDebit !== undefined
    || item.fundingAmount !== undefined;
  const generatedCompanyFloor = activeCase.customerType === 'business'
    && !legacyCoverage
    ? employeeCount * (2100 + (seed % 501))
    : recordedAmount;
  const totalCompanyDebit = legacyCoverage && !suppliedCompanyTotal
    ? null
    : roundMoney(suppliedCompanyTotal ? recordedAmount : Math.max(recordedAmount, generatedCompanyFloor));
  const grossWages = item.grossWages === undefined
    ? legacyCoverage || totalCompanyDebit === null ? null : roundMoney(totalCompanyDebit / 1.095)
    : roundMoney(amountValue(item.grossWages));
  const employeeTaxes = item.employeeTaxes === undefined
    ? legacyCoverage || grossWages === null ? null : roundMoney(grossWages * 0.164)
    : roundMoney(amountValue(item.employeeTaxes));
  const deductions = item.deductions === undefined
    ? legacyCoverage || grossWages === null ? null : roundMoney(grossWages * 0.042)
    : roundMoney(amountValue(item.deductions));
  const employerTaxes = item.employerTaxes === undefined
    ? legacyCoverage || grossWages === null ? null : roundMoney(grossWages * 0.0765)
    : roundMoney(amountValue(item.employerTaxes));
  const employerContributions = item.employerContributions === undefined
    ? legacyCoverage || totalCompanyDebit === null || grossWages === null || employerTaxes === null
      ? null
      : roundMoney(totalCompanyDebit - grossWages - employerTaxes)
    : roundMoney(amountValue(item.employerContributions));
  const netPayroll = item.netPayroll === undefined
    ? legacyCoverage || grossWages === null || employeeTaxes === null || deductions === null
      ? null
      : roundMoney(grossWages - employeeTaxes - deductions)
    : roundMoney(amountValue(item.netPayroll));
  const fundingAmount = item.fundingAmount !== undefined
    ? roundMoney(amountValue(item.fundingAmount))
    : totalCompanyDebit;

  return {
    employeeCount,
    paycheckAmount: roundMoney(amountValue(item.paycheckAmount ?? item.amount)),
    grossWages,
    employeeTaxes,
    employerTaxes,
    employerContributions,
    deductions,
    netPayroll,
    totalCompanyDebit,
    fundingAmount,
  };
}

function toPaymentSource(record, activeCase) {
  if (!record) return null;
  const businessOwnerLane = activeCase.customerType === 'business';
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
  const parties = buildCaseParties(activeCase);
  const paymentSources = getPaymentSources(activeCase);
  const primary = records.business360?.[0] ?? { entity: 'No business entity recorded', id: 'BIZ-NONE', relationship: 'No relationship recorded', status: 'Not supplied', observed: 'Not supplied', context: 'No current business record.' };
  const ownerParties = parties.filter((party) => /beneficial owner|owner/i.test(party.role ?? ''));
  const controlParty = parties.find((party) => /control person/i.test(party.role ?? ''));
  const administratorParties = parties.filter((party) => /administrator/i.test(party.role ?? ''));
  const profile = activeCase.businessProfile ?? businessProfiles[activeCase.id] ?? {
    entityType: activeCase.profile?.entityType ?? 'Generated training entity',
    registration: `Generated fictional registration for ${primary.entity}`,
    ein: `**-***${String(activeCase.id ?? '0000').replace(/\D/g, '').slice(-4).padStart(4, '0')}`,
    owner: ownerParties.map((party) => party.name).join(' · ') || 'Training owner record',
    officer: controlParty?.name ?? activeCase.profile?.entityRole ?? 'Training controlling-party record',
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
    relationships: [
      ...(records.business360 ?? []),
      ...parties.map((party) => ({
        id: party.id,
        entity: party.name,
        relationship: party.role,
        status: party.verificationStatus ?? 'Verification record available',
        observed: activeCase.reportedDate ?? activeCase.opened,
        context: party.relationship,
      })),
    ].filter((record, index, all) => all.findIndex((candidate) => candidate.id === record.id) === index),
    intelligence: records.businessIntel ?? [],
    documents: activeCase.documents ?? [],
    parties,
    administrators: administratorParties,
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
      || [WORKFLOW_TYPES.PAYROLL_CHANGE_ALERT, WORKFLOW_TYPES.PAYROLL_ACCOUNT_TAKEOVER].includes(activeCase.workflowType);
    const exactDestination = paymentSource
      ? `Bank Code ${paymentSource.bankCode} · Destination ID ${paymentSource.destinationId}`
      : 'No payroll destination in current packet';
    const period = payrollPeriodFor(
      item.processedDate ?? item.period,
      index,
      activeCase.legacyDerivedEvidence !== true,
    );
    const amounts = payrollAmounts(item, activeCase, index);
    return {
      ...item,
      ...period,
      ...amounts,
      paySchedule: item.paySchedule ?? 'Twice monthly',
      runType: item.runType ?? 'Regular payroll',
      fundingStatus: item.fundingStatus ?? (
        /posted|complete|funded|settled/i.test(item.status ?? '')
          ? 'Funding completed'
          : /current|pending|scheduled|processing/i.test(item.status ?? '')
            ? `Funding record ${String(item.status).toLowerCase()}`
            : `Funding status: ${item.status ?? 'recorded'}`
      ),
      employee: employees.find((employee) => employee.employer === item.employer)?.name ?? activeCase.person,
      bankCode: hasDestinationContext ? paymentSource?.bankCode ?? 'Not supplied' : 'Not applicable',
      destinationId: hasDestinationContext ? paymentSource?.destinationId ?? 'Not supplied' : 'Not applicable',
      destination: hasDestinationContext
        ? index === 0 ? exactDestination : paymentSource?.previousDestination ?? exactDestination
        : 'No payroll destination in current packet',
      priorDestination: hasDestinationContext ? paymentSource?.previousDestination ?? 'Not supplied' : 'Not applicable',
      oldDestination: hasDestinationContext ? paymentSource?.previousDestination ?? 'Not supplied' : 'Not applicable',
      newDestination: hasDestinationContext ? paymentSource?.newDestination ?? exactDestination : 'Not applicable',
      effectiveDate: item.effectiveDate ?? period.processedDate,
      changeRequest: hasDestinationContext
        ? activeCase.workflowType === WORKFLOW_TYPES.PAYROLL_CHANGE_ALERT
          ? `Platform-observed change: ${paymentSource?.changeComparison ?? paymentProfileEvent?.detail ?? 'change comparison not supplied'}. Request method: ${UNKNOWN_REQUEST_METHOD}.`
          : paymentSource?.changeComparison ?? paymentProfileEvent?.detail ?? 'No change comparison supplied'
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

export function getPayrollAccessContext(activeCase) {
  if (activeCase.workflowType !== WORKFLOW_TYPES.PAYROLL_ACCOUNT_TAKEOVER) return null;
  const parties = buildCaseParties(activeCase);
  const login = activeCase.loginHistory?.[0] ?? {};
  const businessRecords = getBusinessRecords(activeCase);
  const financialRecords = getFinancialRecords(activeCase);
  const payrollRecords = businessRecords.payrollHistory ?? [];
  const destinationRecords = financialRecords.paymentVerification ?? [];
  const initiator = parties.find((party) => /initiator/i.test(party.role ?? ''));
  const approver = parties.find((party) => /approver/i.test(party.role ?? ''));
  const administrator = parties.find((party) => /administrator/i.test(party.role ?? ''));
  const recoveryDocument = (activeCase.documents ?? []).find((document) => /recover|recall|return/i.test(`${document.name ?? document.title} ${document.detail ?? ''}`));
  const abnormalSamePerson = Boolean(initiator?.name && approver?.name && initiator.name === approver.name);

  return {
    initiator: initiator?.name ?? 'Initiator record not supplied',
    approver: approver?.name ?? 'Approver record not supplied',
    administrator: administrator?.name ?? 'Administrator record not supplied',
    approvalSeparation: abnormalSamePerson
      ? 'The same person initiated and approved; compare this with the business baseline.'
      : 'Separate initiator and approver records are available.',
    deviceId: login.deviceId ?? login.device ?? 'Device record not supplied',
    ipAddress: login.ip ?? 'IP record not supplied',
    sessionId: login.session ?? login.sessionReference ?? 'Session record not supplied',
    payrollHistory: `${payrollRecords.length} payroll record${payrollRecords.length === 1 ? '' : 's'} available`,
    destinationChanges: `${destinationRecords.length} payment or destination record${destinationRecords.length === 1 ? '' : 's'} available`,
    fundsStatus: financialRecords.transactions?.[0]?.status ?? 'Funds status not supplied',
    recoveryInformation: recoveryDocument?.detail ?? 'No recovery or recall result is recorded yet.',
  };
}
