import { businessRecordsByCase } from './businessRecords.js';
import { evidenceRecordsByCase } from './evidenceRecords.js';
import { financialRecordsByCase } from './financialRecords.js';
import { normalizePaymentRecords } from './paymentVerification.js';

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
  if (staticRecords) {
    return {
      ...staticRecords,
      paymentVerification: normalizePaymentRecords(staticRecords.paymentVerification, activeCase),
    };
  }
  const generated = generatedResults(activeCase);
  return {
    transactions: generated.transactions?.length ? generated.transactions : [fallbackTransaction(activeCase)],
    financialIntel: generated.financialIntel?.length ? generated.financialIntel : [{ id: `${activeCase.id}-FIN-1`, type: 'Case context', value: activeCase.amount ?? 'Not supplied', observed: activeCase.reportedDate ?? activeCase.opened ?? 'Training date', context: 'Training context available for review.' }],
    paymentVerification: normalizePaymentRecords(
      generated.paymentVerification?.length ? generated.paymentVerification : [fallbackPayment(activeCase)],
      activeCase,
    ),
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
