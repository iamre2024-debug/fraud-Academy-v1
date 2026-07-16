import { rowsFor } from './visualWorkspaceModel.js';

function text(value) {
  return String(value ?? '').trim();
}

function normalized(value) {
  return text(value).toLowerCase().replace(/\s+/g, ' ');
}

function firstIdentifier(value) {
  return text(value).split(/\s+(?:\||·)\s+/)[0].trim();
}

const pinPrefixRoutes = [
  [/^LOG-/i, 'Login History'],
  [/^SES-/i, 'Session History'],
  [/^(?:DEV|DFP)-/i, 'Device Intelligence'],
  [/^IP-/i, 'IP Intelligence'],
  [/^(?:TXN|TRX|AUTH|ACH|WIRE)-/i, 'Transaction History'],
  [/^(?:FIN|FI|DEP|CASH)-/i, 'Financial Investigation'],
  [/^(?:PAY|PV|BNK|DST)-/i, 'Payment Verification'],
  [/^(?:MER|MRC|MCC|ORD|FUL|CBK)-/i, 'Merchant Intelligence'],
  [/^(?:BIZ|REL)-/i, 'Business 360'],
  [/^(?:KYB|REG|SOS|EIN)-/i, 'KYB Review'],
  [/^EMP-/i, 'Employee Profile'],
  [/^(?:PAYR|PR)-/i, 'Payroll History'],
  [/^DOC-/i, 'Document Viewer'],
  [/^(?:REQ|DRQ)-/i, 'Document Request'],
  [/^(?:IDR|PID|PEP)-/i, 'Identity Intel / People Search'],
  [/^(?:C360|PCH|TRN)-/i, 'Customer 360'],
  [/^LNK-/i, 'Link Analysis'],
  [/^(?:SYS|ACC)-/i, 'System Access Lane'],
  [/^(?:TML|EVT)-/i, 'Timeline'],
];

function scoreRow(pinValue, identifier, row) {
  const pin = normalized(pinValue);
  const id = normalized(row.id);
  const rowPin = normalized(row.pin);
  const primary = normalized(identifier);
  const detail = normalized([row.detail, ...(row.values ?? [])].join(' '));

  if (pin === id) return 120;
  if (pin === rowPin) return 115;
  if (primary && primary === id) return 110;
  if (primary && primary === rowPin) return 105;
  if (id.length >= 4 && pin.includes(id)) return 95;
  if (rowPin.length >= 4 && pin.includes(rowPin)) return 90;
  if (pin.length >= 4 && detail.includes(pin)) return 70;
  if (primary.length >= 4 && detail.includes(primary)) return 60;
  return 0;
}

export function resolvePinnedEvidence(pinValue, activeCase, toolNames) {
  const value = text(pinValue);
  if (!value || !activeCase) return null;

  const identifier = firstIdentifier(value);
  const preferredTool = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)
    ? 'IP Intelligence'
    : pinPrefixRoutes.find(([pattern, tool]) => pattern.test(identifier) && toolNames.includes(tool))?.[1];
  let bestMatch = null;

  toolNames.forEach((tool) => {
    const data = rowsFor(tool, activeCase);
    data.rows.forEach((row) => {
      const baseScore = scoreRow(value, identifier, row);
      if (!baseScore) return;
      const score = baseScore + (tool === preferredTool ? 25 : 0);
      if (bestMatch && bestMatch.score >= score) return;
      bestMatch = { score, tool, row };
    });
  });

  if (bestMatch) {
    const query = bestMatch.tool === 'IP Intelligence' && /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)
      ? value
      : bestMatch.row.id;
    return {
      value,
      tool: bestMatch.tool,
      row: bestMatch.row,
      query,
      recordId: bestMatch.row.id,
    };
  }

  const fallbackTool = preferredTool;
  if (!fallbackTool) return null;

  return {
    value,
    tool: fallbackTool,
    row: null,
    query: identifier,
    recordId: identifier,
  };
}
