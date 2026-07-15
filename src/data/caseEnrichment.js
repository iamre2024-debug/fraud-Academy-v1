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
    documentExtras: [
      { id: 'DOC-444', status: 'Available', name: 'Access history packet', detail: 'Login, device, session, and IP records grouped for review' },
    ],
    linkExtras: ['Session', 'Document'],
  },
  'FA-CB-24007': {
    claimId: 'CLM-CB-24007',
    transactionInfo: 'StreamBox Premium · recurring card billing · credit card ending 8841',
    shortSummary: 'Cardholder reports recurring billing after cancellation. Review merchant billing history, customer statement, session activity, and requested document status.',
    relationshipExtras: [
      { label: 'Relationship age', value: 'Customer since 2021' },
      { label: 'Known device pattern', value: 'Android phone primary, Desktop Chrome occasional' },
    ],
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
    documentExtras: [
      { id: 'DOC-512', status: 'Available', name: 'Merchant billing packet', detail: 'Current and prior billing records grouped for review' },
    ],
    linkExtras: ['Document', 'Device'],
  },
  'FA-CR-24003': {
    claimId: 'CLM-CR-24003',
    transactionInfo: 'Credit line usage request · payment setup packet · Destination ID token',
    shortSummary: 'New credit relationship has limited history. Review identity, payment setup, session activity, and early account behavior before any final package is submitted.',
    relationshipExtras: [
      { label: 'Relationship age', value: 'New profile created Jul 7, 2026' },
      { label: 'Known device pattern', value: 'Mobile Safari only so far' },
    ],
    profileExtras: [
      { id: 'PCH-3304', date: 'Jul 7, 2026', item: 'Email code verified', detail: 'Email code verification appears at profile creation; useful only as early-history context.', source: 'Identity setup' },
    ],
    identityExtras: [
      { id: 'IDR-3305', type: 'Device object', value: 'DEV-AVERY-SAF-001', lastSeen: 'Jul 8, 2026', history: 'Only observed device object in early account history.' },
    ],
    loginExtras: [
      { id: 'LOG-3298', time: 'Jul 7, 5:05 PM', method: 'Password setup', device: 'Mobile Safari', location: 'Arlington, TX', ip: '192.0.2.21', session: 'SES-9094', result: 'Successful' },
    ],
    eventExtras: [
      { id: 'EVT-3298', time: 'Jul 7, 5:05 PM', label: 'Password setup recorded', detail: 'Mobile Safari / new profile setup / early account history', chip: 'Identity', object: 'Profile' },
    ],
    documentExtras: [
      { id: 'DOC-622', status: 'Available', name: 'Account setup record', detail: 'Profile creation and early session records grouped for review' },
    ],
    linkExtras: ['Device', 'IP'],
  },
};

const claimContext = {
  'FA-ATO-24018': { claimTypeId: 'account-takeover', scenarioId: 'ato-phishing-wallet', subtype: 'CNP fraud', reportedDate: 'Jul 8, 2026', issueStartDate: 'Jul 8, 2026', statement: 'I did not authorize this card purchase and was home when the transaction occurred.' },
  'FA-CB-24007': { claimTypeId: 'non-fraud-chargeback', scenarioId: 'ncb-recurring-cancellation', subtype: 'canceled service billed', reportedDate: 'Jul 8, 2026', issueStartDate: 'May 8, 2026', statement: 'I canceled the subscription and continued to see the same charge on my card statement.' },
  'FA-CR-24003': { claimTypeId: 'credit-risk', scenarioId: 'cr-new-consumer', subtype: 'credit line increase', reportedDate: 'Jul 8, 2026', issueStartDate: 'Jul 7, 2026', statement: 'I recently opened the account and requested access to the available credit line.' },
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
  return rows.map((row) => ({ ...row, deviceId: row.deviceId ?? map[row.device] ?? `DEV-${String(row.device).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 18)}` }));
}

function buildClaimFields(item, context = {}) {
  const claimType = getClaimTypeForCase({ ...item, claimTypeId: context.claimTypeId ?? item.claimTypeId });
  const scenario = getScenario(claimType.id, context.scenarioId ?? item.scenarioId);
  const reportedDate = item.reportedDate ?? context.reportedDate ?? item.opened;
  const issueStartDate = item.issueStartDate ?? context.issueStartDate ?? reportedDate;
  const statementValue = item.statement?.value ?? context.statement ?? item.allegation ?? scenario.statement;
  const statementLabel = item.statement?.label ?? (/credit|application/i.test(claimType.id) ? 'Applicant statement' : 'Customer statement');
  const intakeAnswers = item.intakeAnswers?.length
    ? item.intakeAnswers
    : claimType.intakePrompts.map((prompt, index) => ({
      id: `${item.id}-INT-${index + 1}`,
      prompt,
      answer: index === 0 ? statementValue : index === 1 ? `Intake channel: ${item.intake?.channel ?? 'Case queue'}.` : 'Review the related fictional case records and document what is available or missing.',
    }));

  return {
    claimTypeId: claimType.id,
    type: claimType.label,
    claimType: claimType.label,
    lane: item.lane ?? claimType.lane,
    subtype: item.subtype ?? context.subtype ?? scenario.subtype,
    scenarioId: item.scenarioId ?? scenario.id,
    scenarioTitle: item.scenarioTitle ?? scenario.title,
    scenarioFamily: item.scenarioFamily ?? scenario.family ?? claimType.lane,
    reportedDate,
    issueStartDate,
    amountExposure: item.amountExposure ?? item.amount,
    statement: { label: statementLabel, value: statementValue, source: item.statement?.source ?? item.intake?.channel ?? 'Case queue' },
    intakeAnswers,
    caseBriefing: {
      summary: item.caseBriefing?.summary ?? item.shortSummary ?? item.allegation ?? scenario.summary,
      focusAreas: item.caseBriefing?.focusAreas ?? item.briefingQuestions ?? claimType.intakePrompts,
      evidenceAreas: item.caseBriefing?.evidenceAreas ?? item.evidenceAreas ?? claimType.evidenceAreas,
      scenarioTitle: item.caseBriefing?.scenarioTitle ?? scenario.title,
    },
    keyFacts: item.keyFacts ?? [
      ['Lane', item.lane ?? claimType.lane], ['Subtype', item.subtype ?? context.subtype ?? scenario.subtype], ['Reported date', reportedDate], ['Issue start date', issueStartDate], ['Amount / exposure', item.amountExposure ?? item.amount], ['Scenario', item.scenarioTitle ?? scenario.title],
    ],
    productsAccounts: item.productsAccounts ?? [{ label: 'Product rail', value: claimType.taxonomy.productRail }, { label: 'Primary details', value: item.transactionInfo ?? scenario.transactionInfo }],
    availableTools: item.availableTools ?? claimType.availableTools,
    requiredTools: item.requiredTools ?? claimType.requiredTools,
    evidenceAreas: item.evidenceAreas ?? claimType.evidenceAreas,
    expectedEvidenceCategories: item.expectedEvidenceCategories ?? claimType.evidenceAreas,
    taxonomyTags: item.taxonomyTags ?? claimType.taxonomy,
    creditDecision: item.creditDecision ?? (claimType.credit ? { ...claimType.credit, family: item.scenarioFamily ?? scenario.family ?? 'Credit review' } : null),
    chargebackDecision: item.chargebackDecision ?? (claimType.chargeback ? { ...claimType.chargeback } : null),
    actionLog: item.actionLog ?? [{ id: `${item.id}-ACT-1`, time: `${reportedDate} · ${item.intake?.contactTime ?? 'Case opened'}`, action: 'Case packet available', detail: 'Case packet is ready for Evidence First investigation.', source: 'Case queue' }],
  };
}

function enrichOneCase(item) {
  const extra = caseIntake[item.id];
  const context = claimContext[item.id] ?? {};
  if (!extra) {
    return {
      ...item,
      ...buildClaimFields(item, context),
      loginHistory: addDeviceIds(item.id, item.loginHistory ?? []),
      links: dedupeStrings(item.links ?? []),
      facts: dedupeStrings(item.facts ?? []),
    };
  }

  return {
    ...item,
    ...buildClaimFields(item, context),
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
import { getClaimTypeForCase, getScenario } from './claimRegistry.js';
