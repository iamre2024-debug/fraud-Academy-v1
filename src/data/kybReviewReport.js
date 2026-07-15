import { getKybReview } from './kybReviewRecords.js';

const storageKey = 'fraud-academy-generated-kyb-reports-v1';

function page(title, subtitle, sections) {
  return { title, subtitle, kind: 'case', sections };
}

function section(title, rows = [], options = {}) {
  return { title, rows, ...options };
}

function generatedAt() {
  return new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export function buildKybReviewReport(activeCase = {}) {
  const workspace = getKybReview(activeCase);
  const { profile, recordsByTab } = workspace;
  const generated = generatedAt();
  const caseId = activeCase.id ?? 'FA-TRAIN-00000';
  const customer = activeCase.person ?? 'Training Customer';
  const claimType = activeCase.claimType ?? activeCase.type ?? 'Training Review';
  return {
    id: `${caseId}-RPT-KYB`,
    title: 'KYB Business Report',
    type: 'Business verification report',
    folder: 'System Reports',
    reference: `RPT-KYB-${caseId}`,
    status: 'Generated',
    reviewStatus: 'Ready for Review',
    extractionConfidence: 'System generated',
    source: 'Fraud Academy KYB Review',
    received: generated,
    updated: generated,
    customer: profile.legalName,
    caseId,
    claimType,
    requestStatus: 'Generated',
    authenticity: 'System-generated from fictional training records. Investigator source comparison remains required.',
    summary: `Business registration, ownership, online-presence, bank-ownership, revenue, payroll, document, and linked-record evidence organized for ${profile.legalName}.`,
    investigatorNote: 'Compare the report with Business 360, Identity Intel / People Search, Payment Verification, Financial Investigation, payroll records, and source documents.',
    trainingTip: 'This report organizes business evidence. It does not determine the case outcome or replace the decision checklist.',
    relatedTools: ['KYB Review', 'Business 360', 'Identity Intel / People Search', 'Payment Verification', 'Financial Investigation', 'Payroll History'],
    relatedEvidence: [caseId, profile.registrationId, profile.ein, ...profile.owners.map(([id]) => id)],
    fields: [
      ['Generated', generated],
      ['Training label', 'Fictional data - not valid for real-world use'],
      ['Legal business name', profile.legalName],
      ['DBA', profile.dba],
      ['Masked EIN', profile.ein],
      ['Registration ID', profile.registrationId],
      ['Jurisdiction', profile.jurisdiction],
      ['Registration standing', profile.standing],
      ['Business address', profile.address],
      ['Business phone', profile.phone],
      ['Website', profile.website],
      ['Owner / UBO records', String(profile.owners.length)],
    ],
    pages: [
      page('KYB Business Report', 'ENTITY AND REGISTRATION - FICTIONAL TRAINING REPORT', [
        section('Report context', [['Case', caseId], ['Customer', customer], ['Claim type', claimType], ['Generated', generated]]),
        section('Business identity', [['Legal name', profile.legalName], ['DBA', profile.dba], ['Entity type', profile.entityType], ['Industry', profile.industry], ['NAICS', profile.naics], ['Website', profile.website], ['Phone', profile.phone]]),
        section('Registration record', [['Registration ID', profile.registrationId], ['Jurisdiction', profile.jurisdiction], ['Formation date', profile.formationDate], ['Standing', profile.standing], ['Masked EIN', profile.ein], ['Address', profile.address], ['Source', profile.source]]),
      ]),
      page('Ownership and Business Operations', 'OWNERS, BANKING, REVENUE, AND PAYROLL - FICTIONAL TRAINING REPORT', [
        section('Owners and controlling parties', [], { table: { columns: ['Record', 'Name', 'Role', 'Ownership', 'Identity record', 'First recorded'], rows: profile.owners } }),
        section('Bank ownership', [], { table: { columns: ['Record', 'Account', 'Recorded owner', 'Bank', 'Name comparison', 'Opened', 'Linked object'], rows: profile.bank } }),
        section('Revenue and cash flow', [], { table: { columns: ['Record', 'Activity', 'Amount', 'Source', 'Observed'], rows: profile.revenue.map(([id, title, amount, source, observed]) => [id, title, `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, source, observed]) } }),
        section('Payroll records', [], { table: { columns: ['Record', 'Field', 'Value', 'Source', 'Observed'], rows: profile.payroll } }),
      ]),
      page('Source Links', 'DOCUMENT AND RECORD INVENTORY - FICTIONAL TRAINING REPORT', [
        section('Online presence', [], { table: { columns: ['Record', 'Type', 'Value', 'Observed', 'Comparison note'], rows: profile.online } }),
        section('Documents and linked records', [], { table: { columns: ['Record', 'Type', 'Value', 'Observed'], rows: recordsByTab.documents.map((record) => [record.id, record.category, record.value, record.observed]) } }),
        section('Review boundary', [['Case outcome', 'Not assigned in KYB Review'], ['Next step', 'Compare source records, save relevant evidence, and complete the decision checklist separately']]),
      ]),
    ],
  };
}

function readRegistry() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
  } catch {
    return [];
  }
}

export function hasGeneratedKybReport(caseId) {
  return readRegistry().includes(caseId);
}

export function generateKybReviewReport(activeCase) {
  if (typeof window !== 'undefined') {
    const registry = [...new Set([...readRegistry(), activeCase.id])];
    window.localStorage.setItem(storageKey, JSON.stringify(registry));
  }
  return buildKybReviewReport(activeCase);
}

export function getGeneratedKybReportDocuments(activeCase) {
  return hasGeneratedKybReport(activeCase.id) ? [buildKybReviewReport(activeCase)] : [];
}

export function kybReportExportText(report) {
  const lines = [report.title, `Reference: ${report.reference}`, `Case: ${report.caseId}`, `Business: ${report.customer}`, `Claim type: ${report.claimType}`, '', report.summary];
  for (const [label, value] of report.fields) lines.push(`${label}: ${value}`);
  for (const reportPage of report.pages) {
    lines.push('', reportPage.title, reportPage.subtitle);
    for (const reportSection of reportPage.sections) {
      lines.push('', reportSection.title);
      for (const [label, value] of reportSection.rows ?? []) lines.push(`${label}: ${value}`);
      if (reportSection.table) {
        lines.push(reportSection.table.columns.join(' | '));
        for (const row of reportSection.table.rows) lines.push(row.join(' | '));
      }
    }
  }
  lines.push('', `Investigator note: ${report.investigatorNote}`, `Training tip: ${report.trainingTip}`);
  return lines.join('\n');
}
