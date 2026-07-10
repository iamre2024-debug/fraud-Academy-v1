import { financialRecordsByCase } from './financialRecords.js';
import { businessRecordsByCase } from './businessRecords.js';
import { evidenceRecordsByCase } from './evidenceRecords.js';

function row(id, values, pin = id, label = 'Record') {
  const normalized = values.map((value) => value ?? 'Not recorded');
  return { id, values: normalized, pin, label, detail: normalized.join(' ') };
}

export function buildCoreToolRecords(tool, activeCase) {
  const logins = activeCase.loginHistory ?? [];
  const events = activeCase.events ?? [];
  const financial = financialRecordsByCase[activeCase.id] ?? { transactions: [], financialIntel: [], paymentVerification: [] };
  const business = businessRecordsByCase[activeCase.id] ?? { businessIntel: [], business360: [] };
  const evidence = evidenceRecordsByCase[activeCase.id] ?? { evidence: [], documents: [] };

  if (tool === 'Identity Intelligence') return {
    columns: ['Record', 'Type', 'Value', 'First / Last Seen', 'History', 'Linked Object', 'Case'],
    rows: (activeCase.identityRecords ?? []).map((item, index) => row(item.id, [item.id, item.type, item.value, index === 0 ? `Profile start · ${item.lastSeen}` : item.lastSeen, item.history, activeCase.trainingId, activeCase.id], item.value, item.type)),
  };

  if (tool === 'Login History') return {
    columns: ['Login', 'Time', 'Result', 'Authentication', 'Device', 'IP', 'Location'],
    rows: logins.map((item) => row(item.id, [item.id, item.time, item.result, item.method, `${item.deviceId ?? 'Device ID unavailable'} · ${item.device}`, item.ip, item.location], item.session, 'Login event')),
  };

  if (tool === 'Device Intelligence') {
    const seen = new Map();
    for (const item of logins) {
      const id = item.deviceId ?? `DEV-${item.id}`;
      const current = seen.get(id) ?? { id, device: item.device, firstSeen: item.time, lastSeen: item.time, sessions: [], ips: [], locations: [] };
      current.lastSeen = item.time;
      current.sessions.push(item.session);
      current.ips.push(item.ip);
      current.locations.push(item.location);
      seen.set(id, current);
    }
    return {
      columns: ['Device ID', 'Device / Browser', 'First Seen', 'Last Seen', 'Sessions', 'IPs', 'Locations'],
      rows: [...seen.values()].map((item) => row(item.id, [item.id, item.device, item.firstSeen, item.lastSeen, [...new Set(item.sessions)].join(' · '), [...new Set(item.ips)].join(' · '), [...new Set(item.locations)].join(' · ')], item.id, 'Device')),
    };
  }

  if (tool === 'IP Intelligence') return {
    columns: ['IP Record', 'IP Address', 'Location', 'Device', 'Session', 'First / Last Seen', 'Usage'],
    rows: logins.map((item) => row(`IP-${item.id}`, [`IP-${item.id}`, item.ip, item.location, `${item.deviceId ?? ''} ${item.device}`.trim(), item.session, item.time, `${item.result} · ${item.method}`], item.ip, 'IP address')),
  };

  if (tool === 'Session History') return {
    columns: ['Session / Event', 'Time', 'Activity', 'Device / Object', 'IP / Group', 'Status', 'Detail'],
    rows: [
      ...logins.map((item) => row(item.session, [item.session, item.time, 'Login session', item.deviceId ?? item.device, item.ip, item.result, `${item.method} · ${item.location}`], item.session, 'Session')),
      ...events.map((item) => row(item.id, [item.id, item.time, item.label, item.object, item.chip, 'Recorded', item.detail], item.id, 'Session event')),
    ],
  };

  if (tool === 'Financial Intelligence') return {
    columns: ['Record', 'Analysis Type', 'Value', 'Observed', 'Related Activity', 'Context', 'Case'],
    rows: [
      ...financial.financialIntel.map((item) => row(item.id, [item.id, item.type, item.value, item.observed, financial.transactions.map((txn) => txn.id).join(' · '), item.context, activeCase.id], item.id, 'Financial intelligence')),
      ...financial.transactions.map((item) => row(`FIN-${item.id}`, [`FIN-${item.id}`, 'Transaction behavior', `${item.merchant} · ${item.amount}`, `${item.posted} · ${item.time}`, `${item.channel} · ${item.instrument}`, item.context, activeCase.id], item.id, 'Financial activity')),
    ],
  };

  if (tool === 'Payment Verification') return {
    columns: ['Record', 'Payment Object', 'Status', 'First / Last Seen', 'Linked Transactions', 'Linked Digital Objects', 'Context'],
    rows: financial.paymentVerification.map((item) => row(item.id, [item.id, `${item.type} · ${item.object}`, item.status, item.lastSeen, financial.transactions.map((txn) => txn.id).join(' · '), logins.map((login) => `${login.deviceId ?? login.device} · ${login.session}`).join(' · '), item.context], item.object, 'Payment verification')),
  };

  if (tool === 'Business Intelligence') return {
    columns: ['Record', 'Type', 'Business / Value', 'Observed', 'Relationships', 'Related Activity', 'Context'],
    rows: [
      ...business.businessIntel.map((item) => row(item.id, [item.id, item.type, item.value, item.observed, business.business360.map((entry) => entry.entity).join(' · '), financial.transactions.map((txn) => txn.id).join(' · '), item.context], item.id, 'Business intelligence')),
      ...business.business360.map((item) => row(`REL-${item.id}`, [`REL-${item.id}`, 'Business relationship', item.entity, item.observed, item.relationship, item.status, item.context], item.entity, 'Business relationship')),
    ],
  };

  if (tool === 'Evidence Center') return {
    columns: ['Evidence', 'Category', 'Status', 'Source', 'Received', 'Linked Object', 'Summary'],
    rows: evidence.evidence.map((item) => row(item.id, [item.id, item.type, item.status, item.source, item.received, item.linkedObject, item.summary], item.id, 'Evidence')),
  };

  if (tool === 'Link Analysis') return {
    columns: ['Link', 'Object', 'Type', 'Connected To', 'Source', 'Case', 'Detail'],
    rows: [
      ...(activeCase.identityRecords ?? []).map((item) => row(`LNK-${item.id}`, [`LNK-${item.id}`, item.value, item.type, activeCase.person, item.id, activeCase.id, item.history], item.value, 'Identity link')),
      ...logins.map((item) => row(`LNK-${item.session}`, [`LNK-${item.session}`, item.session, 'Session', `${item.deviceId ?? item.device} · ${item.ip}`, item.id, activeCase.id, `${item.location} · ${item.method}`], item.session, 'Digital link')),
      ...financial.transactions.map((item) => row(`LNK-${item.id}`, [`LNK-${item.id}`, item.id, 'Transaction', item.merchant, item.channel, activeCase.id, `${item.amount} · ${item.instrument}`], item.id, 'Transaction link')),
      ...financial.paymentVerification.map((item) => row(`LNK-${item.id}`, [`LNK-${item.id}`, item.object, item.type, financial.transactions.map((txn) => txn.id).join(' · '), item.id, activeCase.id, item.context], item.object, 'Payment link')),
      ...evidence.evidence.map((item) => row(`LNK-${item.id}`, [`LNK-${item.id}`, item.id, 'Evidence', item.linkedObject, item.source, activeCase.id, item.summary], item.id, 'Evidence link')),
    ],
  };

  if (tool === 'Timeline') return {
    columns: ['Timeline', 'Time', 'Event', 'Source', 'Linked Object', 'Case', 'Detail'],
    rows: [
      row('TML-OPEN', ['TML-OPEN', activeCase.opened, 'Case opened', 'Case Briefing', activeCase.id, activeCase.id, activeCase.queueReason], activeCase.id, 'Timeline event'),
      ...events.map((item) => row(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.label, item.chip, item.object, activeCase.id, item.detail], item.id, 'Timeline event')),
      ...logins.map((item) => row(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.result, 'Login History', item.session, activeCase.id, `${item.deviceId ?? item.device} · ${item.ip}`], item.session, 'Login timeline')),
      ...financial.transactions.map((item) => row(`TML-${item.id}`, [`TML-${item.id}`, `${item.posted} · ${item.time}`, item.merchant, 'Transaction History', item.id, activeCase.id, `${item.amount} · ${item.status}`], item.id, 'Transaction timeline')),
      ...evidence.evidence.map((item) => row(`TML-${item.id}`, [`TML-${item.id}`, item.received, item.name, 'Evidence Center', item.id, activeCase.id, item.status], item.id, 'Evidence timeline')),
    ],
  };

  if (tool === 'Case Report') return {
    columns: ['Report Section', 'Title', 'Source', 'State', 'Linked Object', 'Case', 'Summary'],
    rows: [
      row('REP-OVERVIEW', ['REP-OVERVIEW', 'Case overview', 'Case Briefing', 'Draft available', activeCase.id, activeCase.id, activeCase.queueReason], activeCase.id, 'Case report section'),
      row('REP-CUSTOMER', ['REP-CUSTOMER', 'Customer summary', 'Customer 360', 'Draft available', activeCase.trainingId, activeCase.id, `${activeCase.person} · ${activeCase.trainingId}`], activeCase.trainingId, 'Case report section'),
      row('REP-PAYMENT', ['REP-PAYMENT', 'Payment verification', 'Payment Verification', 'Draft available', financial.paymentVerification.map((item) => item.id).join(' · '), activeCase.id, `${financial.paymentVerification.length} payment records available`], activeCase.id, 'Case report section'),
      row('REP-BUSINESS', ['REP-BUSINESS', 'Business intelligence', 'Business Intelligence', 'Draft available', business.businessIntel.map((item) => item.id).join(' · '), activeCase.id, `${business.businessIntel.length} business records available`], activeCase.id, 'Case report section'),
      row('REP-EVIDENCE', ['REP-EVIDENCE', 'Evidence summary', 'Evidence Center', 'Draft available', evidence.evidence.map((item) => item.id).join(' · '), activeCase.id, `${evidence.evidence.length} evidence records available`], activeCase.id, 'Case report section'),
      row('REP-TIMELINE', ['REP-TIMELINE', 'Timeline summary', 'Timeline', 'Draft available', events.map((item) => item.id).join(' · '), activeCase.id, `${events.length + logins.length + financial.transactions.length} timeline records available`], activeCase.id, 'Case report section'),
    ],
  };

  return null;
}
