import { financialRecordsByCase } from './data/financialRecords.js';
import { businessRecordsByCase } from './data/businessRecords.js';
import { evidenceRecordsByCase } from './data/evidenceRecords.js';
import { getSystemAccessRecords } from './data/systemAccessRecords.js';

export const AGENT_ID = 'AGT-TRAIN-001';

export const categories = [
  { key: 'identity', label: 'Identity', icon: '▣', tools: ['Customer 360', 'Identity Intelligence'] },
  { key: 'digital', label: 'Digital Activity', icon: '⌁', tools: ['Login History', 'Session History', 'Device Intelligence', 'IP Intelligence'] },
  { key: 'financial', label: 'Financial', icon: '$', tools: ['Transaction History', 'Financial Intelligence', 'Payment Verification'] },
  { key: 'business', label: 'Business', icon: '⌂', tools: ['Business 360', 'Business Intelligence', 'Employee Profile', 'Payroll History'] },
  { key: 'evidence', label: 'Evidence', icon: '▰', tools: ['Evidence Center', 'Document Viewer'] },
  { key: 'connections', label: 'Connections', icon: '⌘', tools: ['Link Analysis', 'System Access Lane'] },
  { key: 'investigation', label: 'Investigation', icon: '⌕', tools: ['Timeline'] },
];

export const workflows = ['Record', 'Expand', 'Search', 'History', 'Link Analysis', 'Save Evidence', 'Timeline'];

export const storageKeys = {
  tray: 'fraud-academy-visual-tray-v1',
  notes: 'fraud-academy-notes-v1',
  completed: 'fraud-academy-completed-tools-v1',
  decisions: 'fraud-academy-decision-drafts-v1',
  packages: 'fraud-academy-review-packages-v1',
  reportPackets: 'fraud-academy-case-report-packets-v1',
};

export const defaultDecisionDraft = { choice: '', confidence: 'Medium', reason: '' };

export function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function makeRow(id, values, pin = id, label = 'Record') {
  const normalized = values.map((value) => value ?? 'Not recorded');
  return { id, values: normalized, pin, label, detail: normalized.join(' ') };
}

function generatedRecordFallbacks(activeCase) {
  const prefix = activeCase.id;
  const observed = activeCase.opened ?? 'Generated case day';
  const city = activeCase.intake?.customerLocation ?? activeCase.customer?.relationship?.find((item) => item.label === 'Normal login area')?.value ?? 'Training location';
  const contact = activeCase.customer?.contact ?? {};
  const businessProfile = activeCase.businessProfile ?? {
    name: `${activeCase.type} training entity`,
    businessId: `TBI-${prefix.slice(-8)}`,
    industry: 'Training business relationship',
    address: `${city} training business address`,
    phone: '(555) 020-0000',
    email: 'operations@business.training.test',
    contactName: 'Training business contact',
    relationship: 'Case-linked merchant, employer, or payment relationship',
    bankCode: `BC-${prefix.slice(-3)}`,
    destinationId: `DST-${prefix.slice(-8)}`,
  };
  const destinationId = businessProfile.destinationId ?? `DST-${prefix.slice(-8)}`;
  const bankCode = businessProfile.bankCode ?? `BC-${prefix.slice(-3)}`;
  const documentRows = (activeCase.documents ?? []).map((item, index) => ({
    id: item.id ?? `${prefix}-DOC-${index + 1}`,
    status: item.status ?? 'Available',
    title: item.name ?? item.title ?? 'Training case document',
    category: item.category ?? 'Evidence document',
    updated: item.updated ?? observed,
    fields: item.fields ?? item.detail ?? 'Training-safe document fields linked to the active case.',
    preview: item.preview ?? item.detail ?? 'Open document record for detail',
  }));

  return {
    financial: {
      transactions: [
        { id: `${prefix}-TXN-1`, posted: observed, time: '9:18 AM', merchant: activeCase.transactionInfo ?? businessProfile.name, amount: activeCase.amount ?? 'Not recorded', channel: 'Generated case activity', instrument: `Payment object ${destinationId}`, status: 'Recorded' },
        { id: `${prefix}-TXN-2`, posted: observed, time: '9:06 AM', merchant: businessProfile.name, amount: '$0.00 setup event', channel: 'Payment setup', instrument: `${bankCode} · ${destinationId}`, status: 'Recorded' },
      ],
      financialIntel: [
        { id: `${prefix}-FIN-1`, type: 'Account context', value: activeCase.customer?.relationship?.find((item) => item.label === 'Open products')?.value ?? 'Generated relationship record', observed, context: 'Product and relationship context available for neutral comparison.' },
        { id: `${prefix}-FIN-2`, type: 'Case amount', value: activeCase.amount ?? 'Not recorded', observed, context: `Linked to ${activeCase.claimId ?? activeCase.id}.` },
        { id: `${prefix}-FIN-3`, type: 'Payment relationship', value: `${bankCode} · ${destinationId}`, observed, context: `Connected to ${businessProfile.name} and the generated payment packet.` },
      ],
      paymentVerification: [
        { id: `${prefix}-PAY-1`, type: 'Bank Code', object: bankCode, status: 'Tokenized training record', lastSeen: observed, context: `Linked to ${destinationId}, ${businessProfile.name}, and the generated setup event.` },
        { id: `${prefix}-PAY-2`, type: 'Destination ID', object: destinationId, status: 'Verification record available', lastSeen: observed, context: `${businessProfile.address} · relationship and ownership fields available for review.` },
        { id: `${prefix}-PAY-3`, type: 'Verification packet', object: `PV-${prefix.slice(-8)}`, status: 'Pending investigator review', lastSeen: observed, context: `Groups ${bankCode}, ${destinationId}, transaction activity, business context, and identity objects.` },
      ],
    },
    business: {
      business360: [
        { id: `${prefix}-BUS-1`, entity: businessProfile.name, relationship: businessProfile.relationship, status: 'Active fictional business record', observed, context: `${businessProfile.businessId} · ${businessProfile.industry}.` },
        { id: `${prefix}-BUS-2`, entity: businessProfile.contactName, relationship: 'Business contact', status: 'Contact record available', observed, context: `${businessProfile.phone} · ${businessProfile.email}.` },
        { id: `${prefix}-BUS-3`, entity: destinationId, relationship: 'Payment destination connected to the business relationship', status: 'Payment object recorded', observed, context: `${bankCode} · ${businessProfile.address}.` },
      ],
      businessIntel: [
        { id: `${prefix}-BIZ-1`, type: 'Legal business name', value: businessProfile.name, observed, context: `Training Business ID ${businessProfile.businessId} · active fictional record.` },
        { id: `${prefix}-BIZ-2`, type: 'Industry', value: businessProfile.industry, observed, context: 'Training-safe industry and operating context.' },
        { id: `${prefix}-BIZ-3`, type: 'Business address', value: businessProfile.address, observed, context: `Registered and operating address in the ${city} training area.` },
        { id: `${prefix}-BIZ-4`, type: 'Business contact', value: `${businessProfile.phone} · ${businessProfile.email}`, observed, context: `${businessProfile.contactName} · case-linked contact record.` },
        { id: `${prefix}-BIZ-5`, type: 'Payment relationship', value: `${bankCode} · ${destinationId}`, observed, context: 'Related payment, transaction, and document objects are linked for review.' },
      ],
      employeeProfile: [
        { id: `${prefix}-EMP-1`, name: businessProfile.contactName, role: activeCase.type === 'Credit Risk Review' ? 'Employer or payroll contact' : 'Merchant or business contact', employer: businessProfile.name, status: 'Profile record available', lastSeen: observed, context: `${businessProfile.phone} · ${businessProfile.email} · ${businessProfile.businessId}.` },
        { id: `${prefix}-EMP-2`, name: activeCase.person, role: activeCase.type === 'Credit Risk Review' ? 'Listed employee or applicant' : 'Customer profile holder', employer: activeCase.type === 'Credit Risk Review' ? businessProfile.name : 'Customer relationship', status: 'Relationship record available', lastSeen: observed, context: `${contact.email ?? 'Training email'} · ${contact.phone ?? 'Training phone'}.` },
      ],
      payrollHistory: [
        { id: `${prefix}-PAYROLL-1`, period: 'Generated current period', employer: businessProfile.name, amount: activeCase.type === 'Credit Risk Review' ? '$1,280.00' : 'Not applicable to current case type', channel: activeCase.type === 'Credit Risk Review' ? 'Direct deposit training record' : 'Merchant or payment relationship', status: activeCase.type === 'Credit Risk Review' ? 'Posted' : 'No payroll records in scope', context: `${destinationId} · ${businessProfile.businessId} · relationship available for review.` },
        { id: `${prefix}-PAYROLL-2`, period: 'Generated prior period', employer: businessProfile.name, amount: activeCase.type === 'Credit Risk Review' ? '$1,240.00' : 'Not applicable to current case type', channel: activeCase.type === 'Credit Risk Review' ? 'Direct deposit training record' : 'Merchant or payment relationship', status: activeCase.type === 'Credit Risk Review' ? 'Posted' : 'No payroll records in scope', context: 'Prior-period context supplied without a case outcome label.' },
      ],
    },
    evidence: {
      evidence: [
        { id: `${prefix}-EVD-1`, type: 'Intake', status: 'Available', name: 'Generated intake record', source: 'Scenario Engine', received: observed, linkedObject: activeCase.claimId ?? prefix, summary: activeCase.allegation ?? activeCase.queueReason },
        { id: `${prefix}-EVD-2`, type: 'Digital access', status: 'Available', name: 'Login, session, and IP record set', source: 'Scenario Engine', received: observed, linkedObject: activeCase.loginHistory?.[0]?.deviceId ?? prefix, summary: `${activeCase.loginHistory?.length ?? 0} login records with session, device, location, method, result, and IP context.` },
        { id: `${prefix}-EVD-3`, type: 'Payment', status: 'Available', name: 'Payment verification record', source: 'Scenario Engine', received: observed, linkedObject: destinationId, summary: `${bankCode}, ${destinationId}, verification packet, and linked transaction context available for neutral review.` },
        { id: `${prefix}-EVD-4`, type: 'Business', status: 'Available', name: 'Business relationship record', source: 'Scenario Engine', received: observed, linkedObject: businessProfile.businessId, summary: `${businessProfile.name}, registration, contact, address, and relationship fields available.` },
      ],
      documents: documentRows.length ? documentRows : [
        { id: `${prefix}-DOC-1`, status: 'Available', title: 'Generated evidence packet', category: 'Evidence document', updated: observed, fields: `Claim ${activeCase.claimId ?? prefix} · ${activeCase.person} · ${activeCase.trainingId}`, preview: 'Intake, identity, access, payment, business, and document fields available.' },
      ],
    },
  };
}

export function rowsFor(tool, activeCase, reportPackets = []) {
  void reportPackets;
  const generated = generatedRecordFallbacks(activeCase);
  const financial = financialRecordsByCase[activeCase.id] ?? generated.financial;
  const business = businessRecordsByCase[activeCase.id] ?? generated.business;
  const evidence = evidenceRecordsByCase[activeCase.id] ?? generated.evidence;
  const identityRecords = activeCase.identityRecords ?? [];
  const logins = activeCase.loginHistory ?? [];
  const events = activeCase.events ?? [];

  if (tool === 'Customer 360') {
    const relationship = activeCase.customer?.relationship ?? [];
    const profileChanges = activeCase.customer?.profileChanges ?? [];
    return {
      columns: ['Record', 'Type', 'Value', 'Observed', 'History', 'Object', 'Action'],
      rows: [
        makeRow('C360-REL', ['C360-REL', 'Relationship since', activeCase.customer?.relationshipSince, activeCase.opened, 'Customer relationship snapshot', activeCase.trainingId, 'Pin'], activeCase.trainingId, 'Customer profile'),
        makeRow('C360-SEG', ['C360-SEG', 'Segment', activeCase.customer?.segment, activeCase.opened, 'Product relationship context', activeCase.id, 'Pin'], activeCase.customer?.segment, 'Customer segment'),
        ...relationship.map((item, index) => makeRow(`C360-REL-${index + 1}`, [`C360-REL-${index + 1}`, item.label, item.value, activeCase.opened, 'Relationship detail', activeCase.id, 'Pin'], item.value, item.label)),
        ...profileChanges.map((item) => makeRow(item.id, [item.id, item.item, item.detail, item.date, item.source, activeCase.id, 'Pin'], item.id, 'Profile change')),
      ],
    };
  }

  if (tool === 'Identity Intelligence') {
    return {
      columns: ['Record', 'Type', 'Value', 'Last Seen', 'History', 'Object', 'Action'],
      rows: identityRecords.map((item) => makeRow(item.id, [item.id, item.type, item.value, item.lastSeen, item.history, activeCase.trainingId, 'Pin'], item.value, item.type)),
    };
  }

  if (tool === 'Device Intelligence') return { columns: ['Device ID', 'Device / Browser', 'Session', 'Method', 'Location', 'IP Address', 'Context'], rows: logins.map((item) => makeRow(item.deviceId ?? `DEV-${item.id}`, [item.deviceId ?? `DEV-${item.id}`, item.device, item.session, item.method, item.location, item.ip, `Observed in ${activeCase.id} access history`], item.deviceId ?? item.device, 'Device')) };
  if (tool === 'Session History') return { columns: ['Session/Event', 'Time', 'Activity', 'Object', 'Group', 'Case', 'Detail'], rows: [...logins.map((item) => makeRow(item.session, [item.session, item.time, item.result, item.device, item.ip, activeCase.id, `${item.method} · ${item.location}`], item.session, 'Session')), ...events.map((item) => makeRow(item.id, [item.id, item.time, item.label, item.object, item.chip, activeCase.id, item.detail], item.id, 'Session event'))] };
  if (tool === 'IP Intelligence') return { columns: ['Record', 'IP', 'Location', 'Session', 'Method', 'Time', 'Context'], rows: logins.map((item) => makeRow(`IP-${item.id}`, [`IP-${item.id}`, item.ip, item.location, item.session, item.method, item.time, `Tied to ${item.deviceId ?? item.device} and ${activeCase.trainingId}`], item.ip, 'IP')) };
  if (tool === 'Transaction History') return { columns: ['Record', 'Date/Time', 'Merchant', 'Amount', 'Channel', 'Instrument', 'Status'], rows: financial.transactions.map((item) => makeRow(item.id, [item.id, `${item.posted}\n${item.time}`, item.merchant, item.amount, item.channel, item.instrument, item.status], item.id, 'Transaction')) };
  if (tool === 'Financial Intelligence') return { columns: ['Record', 'Type', 'Value', 'Observed', 'Context', 'Case', 'Action'], rows: financial.financialIntel.map((item) => makeRow(item.id, [item.id, item.type, item.value, item.observed, item.context, activeCase.id, 'Pin'], item.id, 'Financial intelligence')) };
  if (tool === 'Payment Verification') return { columns: ['Record', 'Type', 'Object', 'Status', 'Last Seen', 'Context', 'Action'], rows: financial.paymentVerification.map((item) => makeRow(item.id, [item.id, item.type, item.object, item.status, item.lastSeen, item.context, 'Pin'], item.object, 'Payment')) };
  if (tool === 'Business 360') return { columns: ['Record', 'Entity', 'Relationship', 'Status', 'Observed', 'Context', 'Action'], rows: business.business360.map((item) => makeRow(item.id, [item.id, item.entity, item.relationship, item.status, item.observed, item.context, 'Pin'], item.entity, 'Business')) };
  if (tool === 'Business Intelligence') return { columns: ['Record', 'Type', 'Value', 'Observed', 'Context', 'Case', 'Action'], rows: business.businessIntel.map((item) => makeRow(item.id, [item.id, item.type, item.value, item.observed, item.context, activeCase.id, 'Pin'], item.id, 'Business intelligence')) };
  if (tool === 'Employee Profile') return { columns: ['Record', 'Name', 'Role', 'Employer', 'Status', 'Last Seen', 'Context'], rows: business.employeeProfile.map((item) => makeRow(item.id, [item.id, item.name, item.role, item.employer, item.status, item.lastSeen, item.context], item.name, 'Employee profile')) };
  if (tool === 'Payroll History') return { columns: ['Record', 'Period', 'Employer', 'Amount', 'Channel', 'Status', 'Context'], rows: business.payrollHistory.map((item) => makeRow(item.id, [item.id, item.period, item.employer, item.amount, item.channel, item.status, item.context], item.id, 'Payroll record')) };
  if (tool === 'Evidence Center') return { columns: ['Record', 'Status', 'Evidence', 'Source', 'Received', 'Linked Object', 'Summary'], rows: evidence.evidence.map((item) => makeRow(item.id, [item.id, item.status, item.name, item.source, item.received, item.linkedObject, item.summary], item.id, 'Evidence')) };
  if (tool === 'Document Viewer') return { columns: ['Document', 'Status', 'Title', 'Category', 'Updated', 'Fields', 'Preview'], rows: evidence.documents.map((item) => makeRow(item.id, [item.id, item.status, item.title, item.category, item.updated, item.fields, item.preview], item.id, 'Document')) };
  if (tool === 'Link Analysis') return { columns: ['Link', 'Object', 'Source', 'Linked To', 'Detail', 'Case', 'Action'], rows: [...identityRecords.map((item) => makeRow(`LNK-${item.id}`, [`LNK-${item.id}`, item.value, item.id, activeCase.person, item.history, activeCase.id, 'Pin'], item.value, 'Connection')), ...logins.map((item) => makeRow(`LNK-${item.id}`, [`LNK-${item.id}`, item.ip, item.session, item.deviceId ?? item.device, item.location, activeCase.id, 'Pin'], item.ip, 'Connection'))] };

  if (tool === 'System Access Lane') {
    const records = getSystemAccessRecords(activeCase.id);
    const generatedRecords = records.length ? records : [
      { id: `${activeCase.id}-SYS-001`, lane: 'Generated system-access record', actor: 'Training scenario service', event: 'Case object access recorded for neutral review', object: activeCase.claimId ?? activeCase.id, observed: activeCase.openedAt ?? 'Recorded in training packet', status: 'Available for review', context: 'Fictional access context linked to the generated evidence packet.' },
    ];
    return { columns: ['Record', 'Lane', 'Actor', 'Object', 'Observed', 'Status', 'Context'], rows: generatedRecords.map((item) => makeRow(item.id, [item.id, item.lane, item.actor, item.object, item.observed, item.status, `${item.event} · ${item.context}`], item.id, 'System access')) };
  }

  if (tool === 'Timeline') return { columns: ['Timeline', 'Time', 'Event', 'Detail', 'Case', 'Source', 'Action'], rows: [makeRow('TML-OPEN', ['TML-OPEN', activeCase.opened, 'Case opened', activeCase.queueReason, activeCase.id, 'Case Summary', 'Pin'], activeCase.id, 'Timeline event'), ...events.map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.label, item.detail, activeCase.id, item.chip, 'Pin'], item.id, 'Timeline event')), ...logins.map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.result, `${item.deviceId ?? item.device} · ${item.ip}`, activeCase.id, 'Login History', 'Pin'], item.session, 'Login timeline'))] };

  return { columns: ['Event', 'Time', 'Result', 'Device', 'IP', 'Location', 'Method'], rows: logins.map((item) => makeRow(item.id, [item.id, item.time, item.result, item.device, item.ip, item.location, item.method], item.ip, 'IP')) };
}

export function buildPacket(row, tool, activeCase) {
  const savedAt = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return {
    id: `PKT-${Date.now()}`,
    key: `${tool}:${row.id}`,
    caseId: activeCase.id,
    recordId: row.id,
    sourceTool: tool,
    section: `${tool} evidence`,
    title: String(row.values[2] ?? row.values[1] ?? row.id).replace(/\n/g, ' · '),
    summary: row.detail,
    state: 'Saved to evidence packet',
    savedAt,
  };
}
