import { financialRecordsByCase } from './financialRecords.js';

function row(id, values, pin = id, label = 'Record') {
  const normalized = values.map((value) => value ?? 'Not recorded');
  return { id, values: normalized, pin, label, detail: normalized.join(' ') };
}

export function buildCoreToolRecords(tool, activeCase) {
  const logins = activeCase.loginHistory ?? [];
  const events = activeCase.events ?? [];
  const financial = financialRecordsByCase[activeCase.id] ?? { transactions: [], financialIntel: [] };

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
      const current = seen.get(id) ?? { id, device: item.device, firstSeen: item.time, lastSeen: item.time, sessions: [], ips: [], locations: [], methods: [] };
      current.lastSeen = item.time;
      current.sessions.push(item.session);
      current.ips.push(item.ip);
      current.locations.push(item.location);
      current.methods.push(item.method);
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

  return null;
}
