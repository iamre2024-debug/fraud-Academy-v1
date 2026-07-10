export const SYSTEM_ACCESS_TOOLS = [
  'Insider Activity',
  'Vendor Verification',
  'Admin Change Log',
  'Shared Access',
  'API Activity',
  'Token History',
  'Consent Records',
  'Aggregator Connections',
  'Webhook Events',
  'Open Banking Links',
];

const caseProfiles = {
  'FA-ATO-24018': {
    subject: 'Maya Johnson',
    object: 'Northstar Digital Market authorization packet',
    device: 'DEV-MAYA-IP16-001',
    destination: 'Destination ID 7719',
    vendor: 'Device fingerprint vendor',
    aggregator: 'TrainingConnect',
  },
  'FA-CB-24007': {
    subject: 'Jordan Ellis',
    object: 'StreamBox Premium recurring billing packet',
    device: 'DEV-JORDAN-PX7-002',
    destination: 'Destination ID 4412',
    vendor: 'Document intake vendor',
    aggregator: 'MerchantLink Training',
  },
  'FA-CR-24003': {
    subject: 'Avery Brooks',
    object: 'Credit line usage request',
    device: 'DEV-AVERY-W11-003',
    destination: 'Destination ID 8831',
    vendor: 'Payment verification vendor',
    aggregator: 'OpenLedger Training',
  },
};

const toolTemplates = {
  'Insider Activity': ['Internal user session reviewed', 'Claims operations user', 'Privileged access history', 'Does the internal-user activity explain any case changes?'],
  'Vendor Verification': ['Third-party verification packet received', 'vendor', 'Vendor relationship and ownership history', 'Does the vendor relationship and returned packet make sense?'],
  'Admin Change Log': ['Administrative change recorded', 'Platform administrator', 'Before-and-after configuration history', 'Who changed the setting, when, and from which session?'],
  'Shared Access': ['Shared object relationship observed', 'Shared-access service', 'Repeated device, IP, email, phone, or destination history', 'Which case objects are reused across fictional training records?'],
  'API Activity': ['API request processed', 'Training API client', 'Endpoint, response, IP, and request history', 'Does the API activity match the expected integration behavior?'],
  'Token History': ['Token lifecycle event recorded', 'Token service', 'Creation, refresh, scope, and revocation history', 'Was the token active and properly scoped at the event time?'],
  'Consent Records': ['Permission record reviewed', 'Consent service', 'Consent creation, scope, expiry, and revocation history', 'Was valid permission present for the requested data?'],
  'Aggregator Connections': ['Aggregator connection checked', 'aggregator', 'Institution link and refresh history', 'Does the aggregator connection belong to the expected relationship?'],
  'Webhook Events': ['Webhook delivery logged', 'Webhook service', 'Delivery attempts, response codes, and payload references', 'Was the event delivered and acknowledged as expected?'],
  'Open Banking Links': ['Permissioned institution link reviewed', 'Open banking provider', 'Linked institution, consent, token, and account-link history', 'Does the permissioned link make sense for this customer and destination?'],
};

function profileFor(caseId) {
  return caseProfiles[caseId] ?? {
    subject: 'Training customer',
    object: caseId,
    device: 'DEV-TRAIN-001',
    destination: 'Destination ID TRAIN',
    vendor: 'Training verification vendor',
    aggregator: 'Training Aggregator',
  };
}

function buildRecord(caseId, tool, index) {
  const profile = profileFor(caseId);
  const [event, actorType, history, question] = toolTemplates[tool];
  const actor = actorType === 'vendor' ? profile.vendor : actorType === 'aggregator' ? profile.aggregator : actorType;
  const objectByTool = {
    'Insider Activity': caseId,
    'Vendor Verification': profile.object,
    'Admin Change Log': profile.subject,
    'Shared Access': `${profile.device} · ${profile.destination}`,
    'API Activity': profile.object,
    'Token History': `TKN-${caseId.replace(/[^A-Z0-9]/g, '').slice(-8)}`,
    'Consent Records': `CNS-${caseId.replace(/[^A-Z0-9]/g, '').slice(-8)}`,
    'Aggregator Connections': profile.aggregator,
    'Webhook Events': `WHK-${caseId.replace(/[^A-Z0-9]/g, '').slice(-8)}`,
    'Open Banking Links': `${profile.aggregator} · ${profile.destination}`,
  };

  return {
    id: `${tool.split(' ').map((part) => part[0]).join('')}-${caseId}-${String(index + 1).padStart(2, '0')}`,
    tool,
    lane: ['Insider Activity', 'Vendor Verification', 'Admin Change Log', 'Shared Access'].includes(tool) ? 'Insider / Vendor' : 'API / Open Banking',
    actor,
    event,
    object: objectByTool[tool],
    observed: `Jul ${8 + (index % 2)}, 2026 · ${String(8 + index).padStart(2, '0')}:${index % 2 ? '42' : '18'} AM`,
    status: index % 3 === 0 ? 'Available for review' : index % 3 === 1 ? 'Logged' : 'Active at event time',
    history,
    linkContext: `${objectByTool[tool]} connects to ${caseId} and ${profile.subject} for neutral investigator review.`,
    context: `${event} for ${profile.object}. This is fictional evidence context, not a fraud or non-fraud conclusion.`,
    investigatorQuestion: question,
  };
}

export const systemAccessRecordsByCase = Object.fromEntries(
  Object.keys(caseProfiles).map((caseId) => [caseId, SYSTEM_ACCESS_TOOLS.flatMap((tool, index) => [buildRecord(caseId, tool, index), buildRecord(caseId, tool, index + 10)])]),
);

export function getSystemAccessRecords(caseId, tool = '') {
  const records = systemAccessRecordsByCase[caseId] ?? SYSTEM_ACCESS_TOOLS.flatMap((name, index) => [buildRecord(caseId, name, index)]);
  return tool ? records.filter((record) => record.tool === tool) : records;
}

export function getSystemAccessToolSummary(caseId) {
  return Object.fromEntries(SYSTEM_ACCESS_TOOLS.map((tool) => [tool, getSystemAccessRecords(caseId, tool).length]));
}
