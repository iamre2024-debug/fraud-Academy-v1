import { businessRecordsByCase } from './businessRecords.js';
import { evidenceRecordsByCase } from './evidenceRecords.js';
import { financialRecordsByCase } from './financialRecords.js';

function fallbackTransaction(activeCase) {
  return {
    id: `${activeCase.id}-TXN-1`,
    posted: activeCase.reportedDate ?? activeCase.opened ?? 'Training date',
    time: '9:00 AM',
    merchant: activeCase.transactionInfo?.split(' · ')[0] ?? `${activeCase.type ?? 'Case'} record`,
    amount: activeCase.amount ?? '$0.00',
    channel: activeCase.lane ?? 'Training case record',
    instrument: 'Training payment object',
    status: 'Record available',
  };
}

function fallbackPayment(activeCase) {
  return {
    id: `${activeCase.id}-PV-1`,
    type: 'Payment verification object',
    object: `Destination ID for ${activeCase.id}`,
    status: 'Record available',
    lastSeen: activeCase.reportedDate ?? activeCase.opened ?? 'Training date',
    context: 'Training-safe payment object available for case comparison.',
    bankName: 'Training Financial Network',
    accountType: 'Training account',
    accountHolder: activeCase.person,
    ownerMatch: 'Ownership field recorded',
    accountStatus: 'Open training record',
    standing: 'History available',
    priorUse: 'Prior-use context supplied in the packet',
    firstSeen: activeCase.issueStartDate ?? activeCase.opened ?? 'Training date',
    verificationMethod: 'Training record comparison',
    recoverability: 'Review path not determined',
    bankCode: `BC-${String(activeCase.id).slice(-4)}`,
    destinationId: `DST-${String(activeCase.id).slice(-6)}`,
    oldDestination: 'Prior destination not supplied',
    newDestination: `DST-${String(activeCase.id).slice(-6)}`,
    changeComparison: 'Payment object is available for comparison.',
    verificationOutcome: 'Verification record available for review',
    relatedRecords: [`${activeCase.id}-TXN-1`],
    actions: ['Compare linked records', 'Document the verification source'],
    verificationLog: [{ time: activeCase.reportedDate ?? 'Training date', method: 'Training lookup', result: 'Recorded', note: 'No case outcome is shown in the verification log.' }],
    notes: 'Payment object records should be compared with the related case packet.',
  };
}

function upgradeLegacyPayrollPayments(activeCase, records = []) {
  if (activeCase.claimTypeId !== 'payroll-direct-deposit' || !records.length) return records;
  const hasFunding = records.some((record) => /payroll funding/i.test(`${record.type} ${record.accountType}`));
  const payeeRecords = records.filter((record) => /payroll payee/i.test(record.type));
  if (hasFunding && payeeRecords.length >= 2) return records;

  const base = records[0];
  const digits = String(activeCase.id ?? '00000').replace(/\D/g, '').slice(-5).padStart(5, '0');
  const person = activeCase.person ?? 'Training employee';
  const employer = activeCase.profile?.employer ?? activeCase.profile?.business ?? 'Training employer';
  const payrollIds = (activeCase.toolResults?.payrollHistory ?? []).map((record) => record.id);
  const clone = (overrides) => ({ ...base, verificationLog: [...(base.verificationLog ?? [])], actions: [...(base.actions ?? [])], relatedRecords: payrollIds, ...overrides });
  const additions = [];

  if (!records.some((record) => /established payroll destination/i.test(record.type))) additions.push(clone({
    id: `${activeCase.id}-PV-PRIOR`, type: 'Established payroll destination', object: `Destination ID DST-PAY-${digits.slice(-4)}`, accountHolder: person, ownerMatch: `Exact match to ${person}`, accountStatus: 'Open', standing: 'Good standing', priorUse: 'Established payroll history returned', bankCode: `BC-PAY-${digits.slice(-3)}`, destinationId: `DST-PAY-${digits.slice(-4)}`, oldDestination: `DST-PAY-${digits.slice(-4)}`, newDestination: `DST-PAY-${digits.slice(-4)}`, changeComparison: 'Established destination used before the current request.', verificationOutcome: 'Established payroll ownership returned',
  }));
  const comparisonOwners = ['Morgan Reed', 'Taylor Grant'];
  comparisonOwners.forEach((owner, index) => {
    if (payeeRecords[index]) return;
    const suffix = String(Number(digits) + ((index + 1) * 137)).slice(-5).padStart(5, '0');
    additions.push(clone({ id: `${activeCase.id}-PV-PAYEE-${index + 2}`, type: 'Payroll payee destination', object: `Destination ID DST-PAYEE-${suffix}`, accountHolder: owner, ownerMatch: `Exact match to ${owner}`, accountStatus: 'Open', standing: 'Good standing', priorUse: 'Established payroll history returned', bankCode: `BC-${suffix.slice(-4)}`, destinationId: `DST-PAYEE-${suffix}`, oldDestination: `DST-PAYEE-${suffix}`, newDestination: `DST-PAYEE-${suffix}`, changeComparison: 'No destination change returned for this comparison payee.', verificationOutcome: 'Established payroll payee account returned' }));
  });
  if (!hasFunding) additions.push(clone({
    id: `${activeCase.id}-PV-FUNDING`, type: 'Business payroll funding account', object: `Destination ID DST-FUND-${digits}`, accountType: 'Business payroll funding account', accountHolder: employer, ownerMatch: `Exact match to ${employer}`, accountStatus: 'Open', standing: 'Good standing', priorUse: 'Established payroll funding history returned', bankCode: `BC-FUND-${digits.slice(-3)}`, destinationId: `DST-FUND-${digits}`, oldDestination: 'Established business funding account', newDestination: 'No funding-account change returned', changeComparison: 'Business funding account is established.', verificationOutcome: 'Business owner and funding-account history returned',
  }));

  return [...records, ...additions];
}

function fallbackBusiness(activeCase) {
  const entity = activeCase.profile?.business ?? activeCase.customer?.relationship?.[0]?.value ?? `${activeCase.type ?? 'Case'} entity`;
  return {
    business360: [{ id: `${activeCase.id}-BIZ-1`, entity, relationship: `${activeCase.lane ?? 'Case'} relationship record`, status: 'Record available', observed: activeCase.reportedDate ?? activeCase.opened ?? 'Training date', context: 'Fictional entity context is available for review.' }],
    businessIntel: [{ id: `${activeCase.id}-BIN-1`, type: 'Case relationship', value: entity, observed: activeCase.reportedDate ?? activeCase.opened ?? 'Training date', context: 'Training record available for comparison with case evidence.' }],
    employeeProfile: [{ id: `${activeCase.id}-EMP-1`, name: activeCase.person, role: activeCase.profile?.entityRole ?? 'Training case record', employer: activeCase.profile?.employer ?? 'Training entity', status: 'Record available', lastSeen: activeCase.reportedDate ?? activeCase.opened ?? 'Training date', context: 'Fictional relationship record.' }],
    payrollHistory: [{ id: `${activeCase.id}-PAYR-1`, period: 'Training period', employer: activeCase.profile?.employer ?? 'Training entity', amount: activeCase.amount ?? '$0.00', channel: 'Training relationship record', status: 'Recorded', context: 'Available for cross-tool comparison.' }],
  };
}

function fallbackEvidence(activeCase) {
  const documents = activeCase.documentRequests ?? (activeCase.documents ?? []).map((item) => ({
    id: item.id,
    title: item.title ?? item.name,
    category: 'Case document',
    status: item.status ?? 'Available',
    updated: activeCase.reportedDate ?? activeCase.opened ?? 'Training date',
    preview: item.detail ?? 'Training case document available for review.',
    fields: 'Case ID, training packet status',
  }));
  return {
    evidence: documents.map((document) => ({
      id: `${document.id}-EVD`,
      status: document.status,
      type: document.category ?? 'Case document',
      name: document.title ?? document.name,
      source: 'Generated training packet',
      received: document.status === 'Requested' ? 'Pending' : document.updated ?? activeCase.reportedDate ?? activeCase.opened ?? 'Training date',
      summary: document.preview ?? document.detail ?? 'Training case document available for review.',
      linkedObject: activeCase.id,
    })),
    documents,
  };
}

function generatedResults(activeCase) {
  return activeCase.toolResults ?? {};
}

export function getFinancialRecords(activeCase = {}) {
  const staticRecords = financialRecordsByCase[activeCase.id];
  if (staticRecords) return staticRecords;
  const generated = generatedResults(activeCase);
  const paymentVerification = generated.paymentVerification?.length ? generated.paymentVerification : [fallbackPayment(activeCase)];
  return {
    transactions: generated.transactions?.length ? generated.transactions : [fallbackTransaction(activeCase)],
    financialIntel: generated.financialIntel?.length ? generated.financialIntel : [{ id: `${activeCase.id}-FIN-1`, type: 'Case context', value: activeCase.amount ?? 'Not supplied', observed: activeCase.reportedDate ?? activeCase.opened ?? 'Training date', context: 'Training context available for review.' }],
    paymentVerification: upgradeLegacyPayrollPayments(activeCase, paymentVerification),
  };
}

export function getBusinessRecords(activeCase = {}) {
  const staticRecords = businessRecordsByCase[activeCase.id];
  if (staticRecords) return staticRecords;
  const generated = generatedResults(activeCase);
  const fallback = fallbackBusiness(activeCase);
  return {
    business360: generated.business360?.length ? generated.business360 : fallback.business360,
    businessIntel: generated.businessIntel?.length ? generated.businessIntel : fallback.businessIntel,
    employeeProfile: generated.employeeProfile?.length ? generated.employeeProfile : fallback.employeeProfile,
    payrollHistory: generated.payrollHistory?.length ? generated.payrollHistory : fallback.payrollHistory,
  };
}

export function getEvidenceRecords(activeCase = {}) {
  const staticRecords = evidenceRecordsByCase[activeCase.id];
  if (staticRecords) return staticRecords;
  const generated = generatedResults(activeCase);
  const fallback = fallbackEvidence(activeCase);
  return {
    evidence: generated.evidence?.length ? generated.evidence : fallback.evidence,
    documents: generated.documents?.length ? generated.documents : fallback.documents,
  };
}
