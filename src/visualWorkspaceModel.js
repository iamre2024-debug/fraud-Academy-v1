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
  const destination = activeCase.customer?.contact?.address ?? 'Training destination record';
  const documentRows = (activeCase.documents ?? []).map((item, index) => ({
    id: item.id ?? `${prefix}-DOC-${index + 1}`,
    status: item.status ?? 'Available',
    title: item.name ?? item.title ?? 'Training case document',
    category: 'Case packet',
    updated: observed,
    fields: item.detail ?? 'Training-safe document fields',
    preview: 'Open record for detail',
  }));

  return {
    financial: {
      transactions: [
        {
          id: `${prefix}-TXN-1`, posted: observed, time: 'Recorded in training packet', merchant: activeCase.transactionInfo ?? 'Training merchant', amount: activeCase.amount ?? 'Not recorded', channel: 'Scenario record', instrument: 'Fictional payment object', status: 'Recorded',
        },
      ],
      financialIntel: [
        { id: `${prefix}-FIN-1`, type: 'Account context', value: activeCase.customer?.relationship?.[0]?.value ?? 'Generated relationship record', observed, context: 'Available for evidence review' },
        { id: `${prefix}-FIN-2`, type: 'Claim amount', value: activeCase.amount ?? 'Not recorded', observed, context: 'Linked to active training case' },
      ],
      paymentVerification: [
        { id: `${prefix}-PAY-1`, type: 'Destination ID', object: `DST-${prefix.slice(-8)}`, status: 'Available for review', lastSeen: observed, context: destination },
      ],
    },
    business: {
      business360: [{ id: `${prefix}-BUS-1`, entity: 'Generated training entity', relationship: 'Case packet relationship', status: 'Available for review', observed, context: activeCase.type }],
      businessIntel: [{ id: `${prefix}-BIZ-1`, type: 'Business context', value: 'Generated business record', observed, context: 'Training-safe fictional data' }],
      employeeProfile: [{ id: `${prefix}-EMP-1`, name: activeCase.person, role: 'Training profile', employer: 'Generated training entity', status: 'Available for review', lastSeen: observed, context: 'Fictional employee context' }],
      payrollHistory: [{ id: `${prefix}-PAYROLL-1`, period: 'Generated review period', employer: 'Generated training entity', amount: activeCase.amount ?? 'Not recorded', channel: 'Scenario record', status: 'Available for review', context: 'Fictional payroll context' }],
    },
    evidence: {
      evidence: [
        { id: `${prefix}-EVD-1`, status: 'Available', name: 'Generated intake record', source: 'Scenario Engine', received: observed, linkedObject: activeCase.claimId ?? prefix, summary: activeCase.allegation ?? activeCase.queueReason },
        { id: `${prefix}-EVD-2`, status: 'Available', name: 'Generated access record', source: 'Scenario Engine', received: observed, linkedObject: activeCase.loginHistory?.[0]?.deviceId ?? prefix, summary: 'Training-safe access and device context for neutral review.' },
      ],
      documents: documentRows.length ? documentRows : [{ id: `${prefix}-DOC-1`, status: 'Available', title: 'Generated case packet', category: 'Case packet', updated: observed, fields: 'Training-safe intake and record fields', preview: 'Open record for detail' }],
    },
  };
}

export function rowsFor(tool, activeCase, reportPackets = []) {
  const generated = generatedRecordFallbacks(activeCase);
  const financial = financialRecordsByCase[activeCase.id] ?? generated.financial;
  const business = businessRecordsByCase[activeCase.id] ?? generated.business;
  const evidence = evidenceRecordsByCase[activeCase.id] ?? generated.evidence;

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
      rows: activeCase.identityRecords.map((item) => makeRow(item.id, [item.id, item.type, item.value, item.lastSeen, item.history, activeCase.trainingId, 'Pin'], item.value, item.type)),
    };
  }

  if (tool === 'Device Intelligence') {
    return {
      columns: ['Device ID', 'Device / Browser', 'Session', 'Method', 'Location', 'IP Address', 'Context'],
      rows: activeCase.loginHistory.map((item) => makeRow(item.deviceId ?? `DEV-${item.id}`, [item.deviceId ?? `DEV-${item.id}`, item.device, item.session, item.method, item.location, item.ip, `Observed in ${activeCase.id} access history`], item.deviceId ?? item.device, 'Device')),
    };
  }

  if (tool === 'Session History') {
    return {
      columns: ['Session/Event', 'Time', 'Activity', 'Object', 'Group', 'Case', 'Detail'],
      rows: [
        ...activeCase.loginHistory.map((item) => makeRow(item.session, [item.session, item.time, item.result, item.device, item.ip, activeCase.id, item.method], item.session, 'Session')),
        ...activeCase.events.map((item) => makeRow(item.id, [item.id, item.time, item.label, item.object, item.chip, activeCase.id, item.detail], item.id, 'Session event')),
      ],
    };
  }

  if (tool === 'IP Intelligence') {
    return {
      columns: ['Record', 'IP', 'Location', 'Session', 'Method', 'Time', 'Context'],
      rows: activeCase.loginHistory.map((item) => makeRow(`IP-${item.id}`, [`IP-${item.id}`, item.ip, item.location, item.session, item.method, item.time, `Tied to ${item.deviceId ?? item.device}`], item.ip, 'IP')),
    };
  }

  if (tool === 'Transaction History') {
    return {
      columns: ['Record', 'Date/Time', 'Merchant', 'Amount', 'Channel', 'Instrument', 'Status'],
      rows: financial.transactions.map((item) => makeRow(item.id, [item.id, `${item.posted}\n${item.time}`, item.merchant, item.amount, item.channel, item.instrument, item.status], item.id, 'Transaction')),
    };
  }

  if (tool === 'Financial Intelligence') {
    return {
      columns: ['Record', 'Type', 'Value', 'Observed', 'Context', 'Case', 'Action'],
      rows: financial.financialIntel.map((item) => makeRow(item.id, [item.id, item.type, item.value, item.observed, item.context, activeCase.id, 'Pin'], item.id, 'Financial intelligence')),
    };
  }

  if (tool === 'Payment Verification') {
    return {
      columns: ['Record', 'Type', 'Object', 'Status', 'Last Seen', 'Context', 'Action'],
      rows: financial.paymentVerification.map((item) => makeRow(item.id, [item.id, item.type, item.object, item.status, item.lastSeen, item.context, 'Pin'], item.object, 'Payment')),
    };
  }

  if (tool === 'Business 360') {
    return {
      columns: ['Record', 'Entity', 'Relationship', 'Status', 'Observed', 'Context', 'Action'],
      rows: business.business360.map((item) => makeRow(item.id, [item.id, item.entity, item.relationship, item.status, item.observed, item.context, 'Pin'], item.entity, 'Business')),
    };
  }

  if (tool === 'Business Intelligence') {
    return {
      columns: ['Record', 'Type', 'Value', 'Observed', 'Context', 'Case', 'Action'],
      rows: business.businessIntel.map((item) => makeRow(item.id, [item.id, item.type, item.value, item.observed, item.context, activeCase.id, 'Pin'], item.id, 'Business intelligence')),
    };
  }

  if (tool === 'Employee Profile') {
    return {
      columns: ['Record', 'Name', 'Role', 'Employer', 'Status', 'Last Seen', 'Context'],
      rows: business.employeeProfile.map((item) => makeRow(item.id, [item.id, item.name, item.role, item.employer, item.status, item.lastSeen, item.context], item.name, 'Employee profile')),
    };
  }

  if (tool === 'Payroll History') {
    return {
      columns: ['Record', 'Period', 'Employer', 'Amount', 'Channel', 'Status', 'Context'],
      rows: business.payrollHistory.map((item) => makeRow(item.id, [item.id, item.period, item.employer, item.amount, item.channel, item.status, item.context], item.id, 'Payroll record')),
    };
  }

  if (tool === 'Evidence Center') {
    return {
      columns: ['Record', 'Status', 'Evidence', 'Source', 'Received', 'Linked Object', 'Summary'],
      rows: evidence.evidence.map((item) => makeRow(item.id, [item.id, item.status, item.name, item.source, item.received, item.linkedObject, item.summary], item.id, 'Evidence')),
    };
  }

  if (tool === 'Document Viewer') {
    return {
      columns: ['Document', 'Status', 'Title', 'Category', 'Updated', 'Fields', 'Preview'],
      rows: evidence.documents.map((item) => makeRow(item.id, [item.id, item.status, item.title, item.category, item.updated, item.fields, item.preview], item.id, 'Document')),
    };
  }

  if (tool === 'Link Analysis') {
    return {
      columns: ['Link', 'Object', 'Source', 'Linked To', 'Detail', 'Case', 'Action'],
      rows: [
        ...activeCase.identityRecords.map((item) => makeRow(`LNK-${item.id}`, [`LNK-${item.id}`, item.value, item.id, activeCase.person, item.history, activeCase.id, 'Pin'], item.value, 'Connection')),
        ...activeCase.loginHistory.map((item) => makeRow(`LNK-${item.id}`, [`LNK-${item.id}`, item.ip, item.session, item.deviceId ?? item.device, item.location, activeCase.id, 'Pin'], item.ip, 'Connection')),
      ],
    };
  }

  if (tool === 'System Access Lane') {
    const records = getSystemAccessRecords(activeCase.id);
    return {
      columns: ['Record', 'Lane', 'Actor', 'Object', 'Observed', 'Status', 'Context'],
      rows: records.map((item) => makeRow(
        item.id,
        [item.id, item.lane, item.actor, item.object, item.observed, item.status, `${item.event} · ${item.context}`],
        item.id,
        'System access',
      )),
    };
  }

  if (tool === 'Timeline') {
    return {
      columns: ['Timeline', 'Time', 'Event', 'Detail', 'Case', 'Source', 'Action'],
      rows: [
        makeRow('TML-OPEN', ['TML-OPEN', activeCase.opened, 'Case opened', activeCase.queueReason, activeCase.id, 'Case Summary', 'Pin'], activeCase.id, 'Timeline event'),
        ...activeCase.events.map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.label, item.detail, activeCase.id, item.chip, 'Pin'], item.id, 'Timeline event')),
        ...activeCase.loginHistory.map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.result, `${item.deviceId ?? item.device} · ${item.ip}`, activeCase.id, 'Login History', 'Pin'], item.session, 'Login timeline')),
      ],
    };
  }

  if (tool === 'Case Report') {
    return {
      columns: ['Report', 'Section', 'Value', 'State', 'Case', 'Source', 'Action'],
      rows: [
        makeRow('REP-CASE', ['REP-CASE', 'Case reason', activeCase.allegation, 'Draft available', activeCase.id, 'Case Summary', 'Pin'], activeCase.id, 'Report section'),
        makeRow('REP-CLAIM', ['REP-CLAIM', 'Claim intake', `${activeCase.claimId ?? activeCase.id} · ${activeCase.amount} · ${activeCase.transactionInfo ?? activeCase.type}`, 'Draft available', activeCase.id, 'Case Summary', 'Pin'], activeCase.id, 'Report section'),
        makeRow('REP-CUSTOMER', ['REP-CUSTOMER', 'Customer', `${activeCase.person} · ${activeCase.trainingId}`, 'Snapshot available', activeCase.id, 'Customer 360', 'Pin'], activeCase.trainingId, 'Report section'),
        makeRow('REP-DIGITAL', ['REP-DIGITAL', 'Digital activity', `${activeCase.loginHistory.length} login records and ${activeCase.events.length} events`, 'Review available', activeCase.id, 'Digital Activity', 'Pin'], activeCase.id, 'Report section'),
        ...reportPackets.map((packet) => makeRow(packet.id, [packet.id, packet.section, `${packet.title} · ${packet.summary}`, packet.state, activeCase.id, packet.sourceTool, 'Pin'], packet.id, 'Report packet')),
        makeRow('REP-LOCK', ['REP-LOCK', 'Submit Decision', 'Luna debrief and scoring stay locked until learner package submission.', 'Locked', activeCase.id, 'Submit Decision', 'Pin'], activeCase.id, 'Report section'),
      ],
    };
  }

  return {
    columns: ['Event', 'Time', 'Result', 'Device', 'IP', 'Location', 'Method'],
    rows: activeCase.loginHistory.map((item) => makeRow(item.id, [item.id, item.time, item.result, item.device, item.ip, item.location, item.method], item.ip, 'IP')),
  };
}

export function buildPacket(row, tool, activeCase) {
  const savedAt = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return {
    id: `PKT-${Date.now()}`,
    key: `${tool}:${row.id}`,
    caseId: activeCase.id,
    recordId: row.id,
    sourceTool: tool,
    section: `${tool} packet`,
    title: String(row.values[2] ?? row.values[1] ?? row.id).replace(/\n/g, ' · '),
    summary: row.detail,
    state: 'Saved to evidence packet',
    savedAt,
  };
}
