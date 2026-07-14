import { financialRecordsByCase } from './financialRecords.js';
import { businessRecordsByCase } from './businessRecords.js';
import { evidenceRecordsByCase } from './evidenceRecords.js';

function row(id, values, pin = id, label = 'Record') {
  const normalized = values.map((value) => value ?? 'Not recorded');
  return { id, values: normalized, pin, label, detail: normalized.join(' ') };
}

function joinIds(items = []) {
  return items.length ? items.map((item) => item.id).join(' · ') : 'None recorded';
}

export function buildCoreToolRecords(tool, activeCase, fallbackData = { rows: [] }) {
  const logins = activeCase.loginHistory ?? [];
  const events = activeCase.events ?? [];
  const financial = financialRecordsByCase[activeCase.id] ?? { transactions: [], paymentVerification: [] };
  const business = businessRecordsByCase[activeCase.id] ?? { businessIntel: [], business360: [] };
  const evidence = evidenceRecordsByCase[activeCase.id] ?? { evidence: [], documents: [] };

  if (tool === 'Payment Verification') return {
    columns: ['Record', 'Payment Object / Bank Code / Destination ID', 'Status', 'Last Seen', 'Linked Transactions', 'Linked Digital Objects', 'Context'],
    rows: financial.paymentVerification.map((item) => row(
      item.id,
      [
        item.id,
        `${item.type} · ${item.object}`,
        item.status,
        item.lastSeen,
        joinIds(financial.transactions),
        logins.length ? logins.map((login) => `${login.deviceId ?? login.device} · ${login.session}`).join(' · ') : 'None recorded',
        item.context,
      ],
      item.object,
      'Payment verification',
    )),
  };

  if (tool === 'Business Intelligence') return {
    columns: ['Record', 'Type', 'Business / Value', 'Observed', 'Relationships', 'Related Activity', 'Context'],
    rows: [
      ...business.businessIntel.map((item) => row(
        item.id,
        [item.id, item.type, item.value, item.observed, business.business360.map((entry) => entry.entity).join(' · ') || 'None recorded', joinIds(financial.transactions), item.context],
        item.id,
        'Business intelligence',
      )),
      ...business.business360.map((item) => row(
        `REL-${item.id}`,
        [`REL-${item.id}`, 'Business relationship', item.entity, item.observed, item.relationship, item.status, item.context],
        item.entity,
        'Business relationship',
      )),
    ],
  };

  if (tool === 'Evidence Center') return {
    columns: ['Evidence', 'Category', 'Status', 'Source', 'Received / Updated', 'Linked Object', 'Summary / Preview'],
    rows: evidence.evidence.map((item) => row(
      item.id,
      [item.id, item.type ?? 'Evidence', item.status, item.source, item.received, item.linkedObject, item.summary],
      item.id,
      'Evidence',
    )),
  };

  if (tool === 'Link Analysis') return {
    columns: ['Link', 'Object', 'Type', 'Connected To', 'Source', 'Case', 'Detail'],
    rows: [
      ...(activeCase.identityRecords ?? []).map((item) => row(`LNK-${item.id}`, [`LNK-${item.id}`, item.value, item.type, activeCase.person, item.id, activeCase.id, item.history], item.value, 'Identity link')),
      ...logins.map((item) => row(`LNK-${item.session}`, [`LNK-${item.session}`, item.session, 'Session', `${item.deviceId ?? item.device} · ${item.ip}`, item.id, activeCase.id, `${item.location} · ${item.method}`], item.session, 'Digital link')),
      ...financial.transactions.map((item) => row(`LNK-${item.id}`, [`LNK-${item.id}`, item.id, 'Transaction', item.merchant, item.channel, activeCase.id, `${item.amount} · ${item.instrument}`], item.id, 'Transaction link')),
      ...financial.paymentVerification.map((item) => row(`LNK-${item.id}`, [`LNK-${item.id}`, item.object, `${item.type} / Bank Code / Destination ID`, joinIds(financial.transactions), item.id, activeCase.id, item.context], item.object, 'Payment link')),
      ...business.business360.map((item) => row(`LNK-${item.id}`, [`LNK-${item.id}`, item.entity, 'Business relationship', item.relationship, item.id, activeCase.id, item.context], item.entity, 'Business link')),
      ...evidence.evidence.map((item) => row(`LNK-${item.id}`, [`LNK-${item.id}`, item.id, 'Evidence', item.linkedObject, item.source, activeCase.id, item.summary], item.id, 'Evidence link')),
    ],
  };

  if (tool === 'Timeline') return {
    columns: ['Timeline', 'Time', 'Event', 'Source', 'Linked Object', 'Case', 'Detail'],
    rows: [
      row('TML-OPEN', ['TML-OPEN', activeCase.opened, 'Case opened', 'Case Summary', activeCase.id, activeCase.id, activeCase.queueReason], activeCase.id, 'Timeline event'),
      ...events.map((item) => row(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.label, item.chip, item.object, activeCase.id, item.detail], item.id, 'Timeline event')),
      ...logins.map((item) => row(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.result, 'Login History', item.session, activeCase.id, `${item.deviceId ?? item.device} · ${item.ip}`], item.session, 'Login timeline')),
      ...financial.transactions.map((item) => row(`TML-${item.id}`, [`TML-${item.id}`, `${item.posted} · ${item.time}`, item.merchant, 'Transaction History', item.id, activeCase.id, `${item.amount} · ${item.status}`], item.id, 'Transaction timeline')),
      ...financial.paymentVerification.map((item) => row(`TML-${item.id}`, [`TML-${item.id}`, item.lastSeen, item.type, 'Payment Verification', item.id, activeCase.id, `${item.object} · ${item.status}`], item.id, 'Payment timeline')),
      ...evidence.evidence.map((item) => row(`TML-${item.id}`, [`TML-${item.id}`, item.received, item.name, 'Evidence Center', item.id, activeCase.id, item.status], item.id, 'Evidence timeline')),
    ],
  };

  return fallbackData;
}
