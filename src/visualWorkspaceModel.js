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
  const destination = contact.address ?? 'Training destination record';
  const documentRows = (activeCase.documents ?? []).map((item, index) => ({
    id: item.id ?? `${prefix}-DOC-${index + 1}`,
    status: item.status ?? 'Available',
    title: item.name ?? item.title ?? 'Training case document',
    category: item.category ?? 'Evidence document',
    updated: item.updated ?? observed,
    fields: item.detail ?? 'Training-safe document fields linked to the active case.',
    preview: item.preview ?? 'Open document record for detail',
  }));

  return {
    financial: {
      transactions: [
        { id: `${prefix}-TXN-1`, posted: observed, time: '9:18 AM', merchant: activeCase.transactionInfo ?? 'Training merchant', amount: activeCase.amount ?? 'Not recorded', channel: 'Scenario record', instrument: `Payment object ${prefix.slice(-6)}`, status: 'Posted record available' },
      ],
      financialIntel: [
        { id: `${prefix}-FIN-1`, type: 'Account context', value: activeCase.customer?.relationship?.[0]?.value ?? 'Generated relationship record', observed, context: 'Relationship and activity context available for neutral comparison.' },
        { id: `${prefix}-FIN-2`, type: 'Claim amount', value: activeCase.amount ?? 'Not recorded', observed, context: `Linked to ${activeCase.claimId ?? activeCase.id}.` },
      ],
      paymentVerification: [
        { id: `${prefix}-PAY-1`, type: 'Destination ID', object: `DST-${prefix.slice(-8)}`, status: 'Verification record available', lastSeen: observed, context: `${destination} · Bank Code BKC-${prefix.slice(-4)} · ownership fields available for review.` },
      ],
    },
    business: {
      business360: [{ id: `${prefix}-BUS-1`, entity: `${activeCase.type} training entity`, relationship: 'Linked through the active transaction or payment object', status: 'Entity record available', observed, context: `Fictional business profile associated with ${activeCase.claimId ?? prefix}.` }],
      businessIntel: [
        { id: `${prefix}-BIZ-1`, type: 'Business registration', value: `${activeCase.type} training entity`, observed, context: `Training-safe registration, contact, and relationship details for ${city}.` },
        { id: `${prefix}-BIZ-2`, type: 'Activity context', value: activeCase.transactionInfo ?? 'Generated business activity', observed, context: 'Related payment, transaction, and document objects are linked for review.' },
      ],
      employeeProfile: [{ id: `${prefix}-EMP-1`, name: activeCase.person, role: 'Training profile contact', employer: `${activeCase.type} training entity`, status: 'Profile record available', lastSeen: observed, context: `${contact.email ?? 'Training email'} · ${contact.phone ?? 'Training phone'}.` }],
      payrollHistory: [{ id: `${prefix}-PAYROLL-1`, period: 'Generated review period', employer: `${activeCase.type} training entity`, amount: activeCase.amount ?? 'Not recorded', channel: 'Scenario record', status: 'Payroll context available', context: `Destination ID DST-${prefix.slice(-8)} and employee relationship available for review.` }],
    },
    evidence: {
      evidence: [
        { id: `${prefix}-EVD-1`, type: 'Intake', status: 'Available', name: 'Generated intake record', source: 'Scenario Engine', received: observed, linkedObject: activeCase.claimId ?? prefix, summary: activeCase.allegation ?? activeCase.queueReason },
        { id: `${prefix}-EVD-2`, type: 'Digital access', status: 'Available', name: 'Login, session, and IP record set', source: 'Scenario Engine', received: observed, linkedObject: activeCase.loginHistory?.[0]?.deviceId ?? prefix, summary: `${activeCase.loginHistory?.length ?? 0} login records with session, device, location, and IP context.` },
        { id: `${prefix}-EVD-3`, type: 'Payment', status: 'Available', name: 'Payment verification record', source: 'Scenario Engine', received: observed, linkedObject: `DST-${prefix.slice(-8)}`, summary: 'Destination ID, Bank Code, and linked transaction context available for neutral review.' },
      ],
      documents: documentRows.length ? documentRows : [{ id: `${prefix}-DOC-1`, status: 'Available', title: 'Generated evidence packet', category: 'Evidence document', updated: observed, fields: `Claim ${activeCase.claimId ?? prefix} · ${activeCase.person} · ${activeCase.trainingId}`, preview: 'Intake, identity, access, payment, and business fields available.' }],
    },
  };
}

export function rowsFor(tool, activeCase) {
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
    const contact = activeCase.customer?.contact ?? {};
    const primaryDocument = evidence.documents?.[0];
    const primaryLogin = logins[0];
    const backgroundDetail = [
      `Training ID ${activeCase.trainingId}`,
      `${activeCase.person} · ${contact.phone ?? 'No phone recorded'} · ${contact.email ?? 'No email recorded'} · ${contact.address ?? 'No address recorded'}`,
      `Relationship since ${activeCase.customer?.relationshipSince ?? 'not recorded'} · ${activeCase.customer?.segment ?? 'segment not recorded'}`,
      `Document ${primaryDocument?.id ?? activeCase.documents?.[0]?.id ?? 'none'} · ${primaryDocument?.status ?? activeCase.documents?.[0]?.status ?? 'not recorded'}`,
      `Login ${primaryLogin?.id ?? 'none'} · Session ${primaryLogin?.session ?? 'none'} · IP ${primaryLogin?.ip ?? 'none'} · ${primaryLogin?.location ?? 'location not recorded'}`,
    ].join(' | ');
    return {
      columns: ['Record', 'Type', 'Value', 'Last Seen', 'History', 'Object', 'Action'],
      rows: [
        makeRow(`${activeCase.id}-BACKGROUND`, ['Background detail report', 'Background detail report', backgroundDetail, activeCase.opened, 'Identity, contact, relationship, document, login, session, and IP context gathered without outcome scoring.', activeCase.trainingId, 'Pin'], activeCase.trainingId, 'Background detail report'),
        ...identityRecords.map((item) => makeRow(item.id, [item.id, item.type, item.value, item.lastSeen, item.history, activeCase.trainingId, 'Pin'], item.value, item.type)),
      ],
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
    const generatedRecords = records.length ? records : [{ id: `${activeCase.id}-SYS-001`, lane: 'Generated system-access record', actor: 'Training scenario service', event: 'Case object access recorded for neutral review', object: activeCase.claimId ?? activeCase.id, observed: activeCase.openedAt ?? 'Recorded in training packet', status: 'Available for review', context: 'Fictional access context linked to the generated evidence packet.' }];
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
