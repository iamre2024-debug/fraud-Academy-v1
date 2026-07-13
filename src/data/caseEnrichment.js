const deviceIds = {
  'FA-ATO-24018': { 'iPhone 16': 'DEV-MAYA-IP16-001', 'Chrome Mobile': 'DEV-MAYA-CHRM-002' },
  'FA-CB-24007': { 'Android phone': 'DEV-JORDAN-AND-001', 'Desktop Chrome': 'DEV-JORDAN-DSK-002' },
  'FA-CR-24003': { 'Mobile Safari': 'DEV-AVERY-SAF-001' },
};

const caseIntake = {
  'FA-ATO-24018': {
    claimId: 'CLM-ATO-24018',
    transactionInfo: 'Northstar Digital Market · card not present · debit card ending 4410',
    shortSummary: 'Long-tenured customer disputed a card-not-present purchase. Access, device, IP, session, transaction, and document records are available for neutral review.',
    relationshipExtras: [
      { label: 'Relationship age', value: 'Customer since 2018' },
      { label: 'Known device pattern', value: 'Repeated iPhone 16 and occasional Chrome Mobile access' },
      { label: 'Recent contact pattern', value: 'Secure message and phone follow-up' },
    ],
    profileExtras: [
      { id: 'PCH-1004', date: 'Jun 14, 2026', item: 'Statement delivery viewed', detail: 'Customer viewed e-statement delivery settings from the known iPhone 16 device.', source: 'Customer profile' },
      { id: 'PCH-1005', date: 'May 22, 2026', item: 'Savings transfer setup viewed', detail: 'Standing transfer setup was viewed but not changed; available as long-term relationship context.', source: 'Financial profile' },
      { id: 'PCH-1006', date: 'Apr 9, 2026', item: 'Address confirmed', detail: 'Address confirmation appears in profile maintenance history with no update recorded.', source: 'Customer profile' },
      { id: 'PCH-1007', date: 'Jan 18, 2026', item: 'Debit card replaced', detail: 'Card replacement was issued before this claim window; compare card ending and transaction instrument before citing.', source: 'Card servicing' },
    ],
    identityExtras: [
      { id: 'IDR-1005', type: 'Known device object', value: 'DEV-MAYA-IP16-001', lastSeen: 'Jul 8, 2026', history: 'Same iPhone device appears across multiple successful logins.' },
      { id: 'IDR-1006', type: 'Secondary device object', value: 'DEV-MAYA-CHRM-002', lastSeen: 'Jul 8, 2026', history: 'Chrome Mobile appears as an occasional known access object.' },
    ],
    loginExtras: [
      { id: 'LOG-0981', time: 'Jun 14, 7:24 PM', method: 'Face ID', device: 'iPhone 16', location: 'Dallas, TX', ip: '198.51.100.40', session: 'SES-7421', result: 'Successful' },
      { id: 'LOG-0954', time: 'May 22, 12:13 PM', method: 'Password', device: 'Chrome Mobile', location: 'Dallas, TX', ip: '198.51.100.13', session: 'SES-7014', result: 'Successful' },
      { id: 'LOG-0928', time: 'Apr 9, 9:48 AM', method: 'Face ID', device: 'iPhone 16', location: 'Dallas, TX', ip: '198.51.100.38', session: 'SES-6602', result: 'Successful' },
    ],
    eventExtras: [
      { id: 'EVT-1002', time: 'Jun 14, 7:25 PM', label: 'Statement settings viewed', detail: 'Known iPhone 16 / Dallas area / no change recorded', chip: 'History', object: 'Profile' },
      { id: 'EVT-1018', time: 'Jul 8, 10:58 AM', label: 'Customer statement received', detail: 'Secure message and phone follow-up opened the case packet', chip: 'Intake', object: 'Document' },
    ],
    documentExtras: [{ id: 'DOC-444', status: 'Available', name: 'Access history packet', detail: 'Login, device, session, and IP records grouped for review' }],
    linkExtras: ['Session', 'Document'],
  },
  'FA-CB-24007': {
    claimId: 'CLM-CB-24007',
    transactionInfo: 'StreamBox Premium · recurring card billing · credit card ending 8841',
    shortSummary: 'Cardholder reports recurring billing after cancellation. Review merchant billing history, customer statement, session activity, and requested document status.',
    relationshipExtras: [{ label: 'Relationship age', value: 'Customer since 2021' }, { label: 'Known device pattern', value: 'Android phone primary, Desktop Chrome occasional' }],
    profileExtras: [
      { id: 'PCH-2204', date: 'Jun 8, 2026', item: 'Merchant transaction viewed', detail: 'Prior StreamBox billing line was viewed in statement activity.', source: 'Statement event' },
      { id: 'PCH-2205', date: 'May 8, 2026', item: 'Merchant transaction posted', detail: 'Earlier recurring billing record is visible for comparison but does not determine the final case outcome.', source: 'Transaction history' },
    ],
    identityExtras: [
      { id: 'IDR-2205', type: 'Known device object', value: 'DEV-JORDAN-AND-001', lastSeen: 'Jul 8, 2026', history: 'Android phone appears across mobile app dispute and statement review activity.' },
      { id: 'IDR-2206', type: 'Secondary device object', value: 'DEV-JORDAN-DSK-002', lastSeen: 'Jun 21, 2026', history: 'Desktop Chrome appears in older profile activity.' },
    ],
    loginExtras: [
      { id: 'LOG-2178', time: 'Jun 8, 8:36 AM', method: 'Biometric', device: 'Android phone', location: 'Fort Worth, TX', ip: '203.0.113.16', session: 'SES-4018', result: 'Successful' },
      { id: 'LOG-2142', time: 'May 8, 9:11 AM', method: 'Biometric', device: 'Android phone', location: 'Fort Worth, TX', ip: '203.0.113.14', session: 'SES-3880', result: 'Successful' },
    ],
    eventExtras: [
      { id: 'EVT-2142', time: 'May 8, 9:12 AM', label: 'Earlier merchant charge located', detail: '$179.44 / subscription merchant / prior cycle', chip: 'History', object: 'Transaction' },
      { id: 'EVT-2178', time: 'Jun 8, 8:36 AM', label: 'Prior merchant charge viewed', detail: '$189.44 / subscription merchant / statement activity', chip: 'History', object: 'Transaction' },
    ],
    documentExtras: [{ id: 'DOC-512', status: 'Available', name: 'Merchant billing packet', detail: 'Current and prior billing records grouped for review' }],
    linkExtras: ['Document', 'Device'],
  },
  'FA-CR-24003': {
    claimId: 'CLM-CR-24003',
    transactionInfo: 'Credit line usage request · payment setup packet · Destination ID token',
    shortSummary: 'New credit relationship has limited history. Review identity, payment setup, session activity, and early account behavior before any final package is submitted.',
    relationshipExtras: [{ label: 'Relationship age', value: 'New profile created Jul 7, 2026' }, { label: 'Known device pattern', value: 'Mobile Safari only so far' }],
    profileExtras: [{ id: 'PCH-3304', date: 'Jul 7, 2026', item: 'Email code verified', detail: 'Email code verification appears at profile creation; useful only as early-history context.', source: 'Identity setup' }],
    identityExtras: [{ id: 'IDR-3305', type: 'Device object', value: 'DEV-AVERY-SAF-001', lastSeen: 'Jul 8, 2026', history: 'Only observed device object in early account history.' }],
    loginExtras: [{ id: 'LOG-3298', time: 'Jul 7, 5:05 PM', method: 'Password setup', device: 'Mobile Safari', location: 'Arlington, TX', ip: '192.0.2.21', session: 'SES-9094', result: 'Successful' }],
    eventExtras: [{ id: 'EVT-3298', time: 'Jul 7, 5:05 PM', label: 'Password setup recorded', detail: 'Mobile Safari / new profile setup / early account history', chip: 'Identity', object: 'Profile' }],
    documentExtras: [{ id: 'DOC-622', status: 'Available', name: 'Account setup record', detail: 'Profile creation and early session records grouped for review' }],
    linkExtras: ['Device', 'IP'],
  },
};

function dedupeById(records = []) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record?.id || seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}

function dedupeStrings(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function addDeviceIds(caseId, rows = []) {
  const map = deviceIds[caseId] ?? {};
  return rows.map((row) => ({ ...row, deviceId: row.deviceId ?? map[row.device] ?? `DEV-${String(row.device ?? 'UNKNOWN').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 18)}` }));
}

function generatedFallback(item) {
  const isGenerated = String(item.id ?? '').includes('-G') || item.status === 'Generated';
  if (!isGenerated) return item;
  const city = item.intake?.customerLocation ?? 'Dallas, TX';
  const deviceId = `DEV-${String(item.id).replace(/[^A-Z0-9]+/gi, '-').slice(-18)}`;
  const claimId = item.claimId ?? `CLM-${String(item.id).replace(/^FA-/, '')}`;
  const summary = item.shortSummary ?? item.allegation ?? 'Generated training case with customer, access, transaction, evidence, and timeline records available for neutral review.';
  return {
    ...item,
    claimId,
    amount: item.amount ?? '$486.22',
    opened: item.opened ?? 'Generated training case',
    transactionInfo: item.transactionInfo ?? 'Generated transaction record · training-safe payment object',
    shortSummary: summary,
    allegation: item.allegation ?? summary,
    queueReason: item.queueReason ?? 'Generated case for Evidence First investigation practice.',
    intake: {
      channel: 'Generated scenario',
      contactTime: 'Training mode',
      customerLocation: city,
      statedDevice: 'Generated mobile browser',
      ...(item.intake ?? {}),
    },
    customer: {
      relationshipSince: item.customer?.relationshipSince ?? '2024',
      segment: item.customer?.segment ?? 'Generated consumer profile',
      contact: {
        phone: '(555) 010-0000',
        email: `${String(item.person ?? 'generated.customer').toLowerCase().replace(/\s+/g, '.')}@training.example.test`,
        address: `${city} training address`,
        preferredChannel: 'Training workspace',
        ...(item.customer?.contact ?? {}),
      },
      relationship: item.customer?.relationship?.length ? item.customer.relationship : [
        { label: 'Generated relationship', value: 'Training profile with reviewable account history' },
        { label: 'Normal login area', value: city },
        { label: 'Payment profile', value: 'Training-safe payment objects only' },
      ],
      profileChanges: item.customer?.profileChanges?.length ? item.customer.profileChanges : [
        { id: `${item.id}-PCH-1`, date: 'Generated case day', item: 'Profile snapshot generated', detail: 'Generated customer profile created for practice review.', source: 'Scenario Engine' },
        { id: `${item.id}-PCH-2`, date: 'Generated case day', item: 'Evidence package initialized', detail: 'Access, transaction, evidence, and timeline records are ready for review.', source: 'Scenario Engine' },
      ],
    },
    identityRecords: item.identityRecords?.length ? item.identityRecords : [
      { id: `${item.id}-IDR-1`, type: 'Training ID', value: item.trainingId ?? 'Generated Training ID', lastSeen: 'Generated case day', history: 'Generated identity record tied to this case.' },
      { id: `${item.id}-IDR-2`, type: 'Device object', value: deviceId, lastSeen: 'Generated case day', history: 'Generated device object available for comparison.' },
    ],
    loginHistory: item.loginHistory?.length ? item.loginHistory : [
      { id: `${item.id}-LOG-1`, time: 'Generated case day · 8:42 AM', method: 'Password', device: 'Generated mobile browser', deviceId, location: city, ip: '198.51.100.210', session: `${item.id}-SES-1`, result: 'Successful' },
      { id: `${item.id}-LOG-2`, time: 'Generated case day · 9:03 AM', method: 'Biometric', device: 'Generated mobile browser', deviceId, location: city, ip: '198.51.100.211', session: `${item.id}-SES-2`, result: 'Successful' },
    ],
    events: item.events?.length ? item.events : [
      { id: `${item.id}-EVT-1`, time: 'Generated case day · 9:10 AM', label: 'Generated case event', detail: 'System created neutral scenario records for investigation practice.', chip: 'Generated', object: 'Scenario' },
      { id: `${item.id}-EVT-2`, time: 'Generated case day · 9:14 AM', label: 'Transaction record added', detail: item.transactionInfo ?? 'Generated transaction available for review.', chip: 'Transaction', object: 'Transaction' },
    ],
    documents: item.documents?.length ? item.documents : [
      { id: `${item.id}-DOC-1`, status: 'Available', name: 'Generated case packet', detail: 'Scenario-generated packet for training review.' },
      { id: `${item.id}-DOC-2`, status: 'Available', name: 'Access activity record', detail: 'Generated login, device, and IP details.' },
    ],
    links: dedupeStrings(item.links?.length ? item.links : ['Customer', 'Device', 'IP', 'Payment', 'Document']),
    facts: dedupeStrings([...(item.facts ?? []), 'Generated training case', 'Evidence First lock active']),
  };
}

function enrichOneCase(input) {
  const item = generatedFallback(input);
  const extra = caseIntake[item.id];
  if (!extra) {
    return {
      ...item,
      loginHistory: addDeviceIds(item.id, item.loginHistory ?? []),
      links: dedupeStrings(item.links ?? []),
      facts: dedupeStrings(item.facts ?? []),
    };
  }

  return {
    ...item,
    claimId: item.claimId ?? extra.claimId,
    transactionInfo: item.transactionInfo ?? extra.transactionInfo,
    shortSummary: item.shortSummary ?? extra.shortSummary,
    customer: {
      ...item.customer,
      relationship: [...(item.customer?.relationship ?? []), ...(extra.relationshipExtras ?? [])],
      profileChanges: dedupeById([...(item.customer?.profileChanges ?? []), ...(extra.profileExtras ?? [])]),
    },
    identityRecords: dedupeById([...(item.identityRecords ?? []), ...(extra.identityExtras ?? [])]),
    loginHistory: addDeviceIds(item.id, dedupeById([...(item.loginHistory ?? []), ...(extra.loginExtras ?? [])])),
    events: dedupeById([...(extra.eventExtras ?? []), ...(item.events ?? [])]),
    documents: dedupeById([...(item.documents ?? []), ...(extra.documentExtras ?? [])]),
    links: dedupeStrings([...(item.links ?? []), ...(extra.linkExtras ?? [])]),
    facts: dedupeStrings([...(item.facts ?? []), item.id === 'FA-CR-24003' ? 'Only early history available' : 'Expanded relationship history available']),
  };
}

export function enrichTrainingCases(cases = []) {
  return cases.map(enrichOneCase);
}
