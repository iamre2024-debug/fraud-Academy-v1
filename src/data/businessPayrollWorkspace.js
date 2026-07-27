import { getBusinessRecords, getFinancialRecords } from './caseToolData.js';
import { getBusinessResearch } from './kybReviewRecords.js';
import { payrollContractIssues, summarizeCompanyPayroll } from './payrollDataModel.js';

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
    relatedRecords: [
      item.id,
      ...((financial.paymentVerification ?? [])
        .filter((record) => record.relatedRecords?.includes(item.id))
        .map((record) => record.id)),
    ],
    relatedDocuments: activeCase.documents?.slice(0, 2).map((document) => document.id ?? document.title ?? document.name) ?? [],
  }));
}

export function getBusiness360Workspace(activeCase) {
  const research = getBusinessResearch(activeCase);
  const records = Object.values(research.recordsBySection).flat();
  return {
    ...research,
    records,
    research: research.profile.research,
    navigation: [
      'Identity Intel / People Search',
      'Financial Investigation',
      'Payment Verification',
      'Employee Profile',
      'Payroll History',
    ].filter((tool) => activeCase.availableTools?.includes(tool)),
  };
}

export function getEmployeeProfiles(activeCase) {
  const records = getBusinessRecords(activeCase);
  const payrollRuns = records.payrollRuns ?? [];
  return (records.employeeProfile ?? []).map((employee, employeeIndex) => {
    const paychecks = payrollRuns
      .flatMap((run) => run.employees ?? [])
      .filter((runEmployee) => runEmployee.employeeId === employee.id)
      .map((runEmployee) => runEmployee.paystub.id);
    const currentPaymentPlan = employee.paymentHistory?.at(-1);
    const employeeToken = String(employee.id ?? employee.employeeId ?? employeeIndex + 1)
      .replace(/[^A-Z0-9]/gi, '')
      .slice(-8)
      .toUpperCase();
    const filingStatus = employee.w4FilingStatus
      ?? employee.w4Setup?.split('·')[0]?.trim()
      ?? 'Single';
    const currentAddress = employee.currentResidentialAddress ?? employee.address ?? 'Not supplied';
    return {
      ...employee,
      legalName: employee.legalName ?? employee.name,
      dateOfBirth: employee.dateOfBirth ?? employee.dob ?? `Mar ${10 + (employeeIndex * 4)}, ${1988 + employeeIndex}`,
      trainingId: employee.trainingId ?? `TRN-EMP-${employeeToken || String(employeeIndex + 1).padStart(4, '0')}`,
      currentResidentialAddress: currentAddress,
      previousResidentialAddress: employee.previousResidentialAddress
        ?? `${220 + (employeeIndex * 117)} Previous Training Road, Dallas, TX 75201`,
      status: employee.employmentStatus ?? employee.status ?? 'Recorded',
      lastSeen: payrollRuns.at(-1)?.payDate ?? employee.lastSeen ?? 'Not supplied',
      employmentTimeline: `${employee.hireDate ?? 'Hire date not supplied'} – ${employee.employmentStatus ?? 'Status not supplied'}`,
      manager: employee.manager ?? ['Monica Patel', 'Renee Wallace', 'Jordan Lee'][employeeIndex % 3],
      workLocation: employee.workLocation ?? `${employee.department ?? 'Operations'} · primary training worksite`,
      terminationDate: employee.terminationDate ?? 'Not applicable — active employee',
      officialContact: employee.officialContact ?? 'Employer payroll office on file',
      directDeposit: currentPaymentPlan?.method === 'Paper check'
        ? 'Paper check · destination identifiers are not applicable'
        : `${currentPaymentPlan?.method ?? 'Payment method recorded'} · event-level destination identifiers are shown only on paystubs`,
      linkedPayroll: paychecks,
      employer: employee.employer ?? records.companyPayrollProfile?.legalName ?? 'Employer not supplied',
      role: employee.role ?? employee.position ?? 'Employee',
      department: employee.department ?? 'Not supplied',
      rateHistory: employee.rateHistory ?? [],
      w4FilingStatus: filingStatus,
      w4MultipleJobsSelection: employee.w4MultipleJobsSelection ?? 'Not selected',
      w4Dependents: employee.w4Dependents ?? '$0.00',
      w4OtherIncome: employee.w4OtherIncome ?? '$0.00',
      w4Deductions: employee.w4Deductions ?? '$0.00',
      w4ExtraWithholding: employee.w4ExtraWithholding ?? '$0.00',
      federalElection: employee.federalElection ?? `${filingStatus} · standard withholding tables`,
      stateElection: employee.stateElection ?? 'Texas · no state individual income-tax withholding',
      localElection: employee.localElection ?? 'No local income-tax election recorded',
      taxJurisdiction: employee.taxJurisdiction ?? 'United States · Texas',
      taxExemptionStatus: employee.taxExemptionStatus ?? 'Not exempt',
      taxEffectiveDate: employee.taxEffectiveDate ?? employee.hireDate ?? 'Not supplied',
    };
  });
}

export function getPayrollHistory(activeCase) {
  const records = getBusinessRecords(activeCase);
  const companyPayrollProfile = records.companyPayrollProfile ?? null;
  const payrollRuns = records.payrollRuns ?? [];
  const data = { companyPayrollProfile, payrollRuns };
  const normalizedRuns = payrollRuns.every((run) => Array.isArray(run.employees));
  return {
    ...data,
    summary: normalizedRuns ? summarizeCompanyPayroll(payrollRuns) : {},
    contractIssues: normalizedRuns ? payrollContractIssues(data) : [],
  };
}

export function employeePayrollHistory(payrollWorkspace, employeeId) {
  const company = payrollWorkspace.companyPayrollProfile;
  const paychecks = payrollWorkspace.payrollRuns
    .flatMap((run) => run.employees.map((employee) => ({
      ...employee,
      runId: run.id,
      payDate: run.payDate,
      payPeriod: run.payPeriod,
      payrollType: run.runType,
      company: company?.legalName,
    })))
    .filter((employee) => employee.employeeId === employeeId)
    .sort((left, right) => new Date(right.payDate).getTime() - new Date(left.payDate).getTime());
  return {
    employee: paychecks[0] ?? null,
    paychecks,
    selectedYear: paychecks[0]?.payDate?.match(/\d{4}/)?.[0] ?? 'Not supplied',
    paycheckCount: paychecks.length,
    ytdGross: paychecks[0]?.paystub?.ytdSnapshot?.grossPay ?? 0,
    ytdNet: paychecks[0]?.paystub?.ytdSnapshot?.netPay ?? 0,
  };
}

export function findPayrollRecord(payrollWorkspace, value = '') {
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  for (const run of payrollWorkspace.payrollRuns ?? []) {
    if (run.id.toLowerCase() === normalized) return { type: 'run', run };
    for (const employee of run.employees ?? []) {
      if (employee.employeeId.toLowerCase() === normalized) return { type: 'employee', run, employee };
      if (employee.paystub.id.toLowerCase() === normalized) return { type: 'paystub', run, employee, paystub: employee.paystub };
      const destination = employee.paystub.paymentDestinations.find((item) => (
        [item.bankCode, item.destinationId, item.paymentRecordId].some((candidate) => String(candidate ?? '').toLowerCase() === normalized)
      ));
      if (destination) return { type: 'paystub', run, employee, paystub: employee.paystub, destination };
    }
  }
  return null;
}
