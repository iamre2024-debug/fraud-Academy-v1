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

export const workflows = ['Record', 'Expand', 'Search', 'History', 'Link Analysis', 'Pin Evidence', 'Timeline', 'Submit Decision'];

export const storageKeys = {
  tray: 'fraud-academy-visual-tray-v1',
  notes: 'fraud-academy-notes-v1',
  completed: 'fraud-academy-completed-tools-v1',
  decisions: 'fraud-academy-decision-drafts-v1',
  packages: 'fraud-academy-review-packages-v1',
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

export function rowsFor(tool, activeCase) {
  const financial = financialRecordsByCase[activeCase.id] ?? { transactions: [], financialIntel: [], paymentVerification: [] };
  const business = businessRecordsByCase[activeCase.id] ?? { business360: [], businessIntel: [], employeeProfile: [], payrollHistory: [] };
  const evidence = evidenceRecordsByCase[activeCase.id] ?? { evidence: [], documents: [] };

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

  return {
    columns: ['Event', 'Time', 'Result', 'Device', 'IP', 'Location', 'Method'],
    rows: activeCase.loginHistory.map((item) => makeRow(item.id, [item.id, item.time, item.result, item.device, item.ip, item.location, item.method], item.ip, 'IP')),
  };
}
