import { makeGeneratedProfileChanges } from './generatedCases.js';
import { buildCaseBriefingPacket } from './caseBriefingDetails.js';
import { systemAccessRecordsByCase } from './systemAccessRecords.js';

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
    parties: [
      { id: 'FA-ATO-24018-PTY-1', role: 'Account holder', name: 'Maya Sterling', relationship: 'Customer who submitted the active claim', source: 'Case intake' },
      { id: 'FA-ATO-24018-PTY-2', role: 'Merchant / payee', name: 'Northstar Digital Market', relationship: 'Merchant tied to the disputed card activity', source: 'Transaction record' },
    ],
    relationshipExtras: [
      { label: 'Relationship age', value: 'Customer since 2018' },
      { label: 'Known device pattern', value: 'Repeated iPhone 16 and occasional Chrome Mobile access' },
      { label: 'Recent contact pattern', value: 'Secure message and phone follow-up' },
    ],
    profileExtras: [
      { id: 'PCH-1004', date: 'Jun 14, 2026', time: '7:26 PM', eventType: 'Statement preference change', item: 'Statement delivery updated', oldValue: 'Paper statement', newValue: 'Electronic statement', channel: 'Mobile app', source: 'Customer profile', user: 'Maya Sterling', device: 'DEV-MAYA-IP16-001', ip: '198.51.100.40', session: 'SES-7421', mfaMethod: 'Face ID', notes: 'Routine historical maintenance outside the active claim window.', detail: 'Statement delivery changed from paper to electronic delivery.' },
      { id: 'PCH-1005', date: 'May 22, 2026', time: '12:18 PM', eventType: 'Transfer preference change', item: 'Standing transfer nickname updated', oldValue: 'Savings transfer', newValue: 'Monthly reserve', channel: 'Mobile web', source: 'Financial profile', user: 'Maya Sterling', device: 'DEV-MAYA-CHRM-002', ip: '198.51.100.13', session: 'SES-7014', mfaMethod: 'Password', notes: 'Nickname-only maintenance; destination and transfer amount did not change.', detail: 'The nickname on an existing internal savings transfer was updated.' },
      { id: 'PCH-1006', date: 'Apr 9, 2026', time: '9:51 AM', eventType: 'Address verification', item: 'Physical address confirmed', oldValue: '1842 Cedar Avenue, Dallas, TX', newValue: '1842 Cedar Avenue, Dallas, TX', channel: 'Mobile app', source: 'Customer profile', user: 'Maya Sterling', device: 'DEV-MAYA-IP16-001', ip: '198.51.100.38', session: 'SES-6602', mfaMethod: 'Face ID', notes: 'Verification retained the existing address.', detail: 'The physical address was confirmed without a value change.' },
      { id: 'PCH-1007', date: 'Jan 18, 2026', time: '2:42 PM', eventType: 'Card maintenance', item: 'Debit card replaced', oldValue: 'Debit card ••••1180', newValue: 'Debit card ••••4410', channel: 'Phone servicing', source: 'Card servicing', user: 'Servicing agent AGT-TRN-14', device: 'Agent workstation', ip: 'Internal training network', session: 'SRV-1007', mfaMethod: 'Customer verification questions', notes: 'Historical replacement predates the active claim window.', detail: 'A replacement debit card was issued through a documented servicing interaction.' },
    ],
    identityExtras: [
      { id: 'IDR-1005', type: 'Known device object', value: 'DEV-MAYA-IP16-001', lastSeen: 'Jul 8, 2026', history: 'Same iPhone device appears across multiple successful logins.' },
      { id: 'IDR-1006', type: 'Secondary device object', value: 'DEV-MAYA-CHRM-002', lastSeen: 'Jul 8, 2026', history: 'Chrome Mobile appears as an occasional known access object.' },
    ],
    loginExtras: [
      { id: 'LOG-1007', time: 'Jul 8, 7:58 AM', eventType: 'Failed authentication', method: 'Password', mfaStatus: 'MFA not reached', authChannel: 'Mobile web', operatingSystem: 'Android 15', browserSource: 'Chrome Mobile', device: 'Chrome Mobile', location: 'Dallas, TX', ip: '198.51.100.11', session: 'No session created', result: 'Failed', failedAttemptCount: 1, accountLockout: 'No lockout recorded', logoutStatus: 'No session created' },
      { id: 'LOG-1006', time: 'Jul 8, 8:00 AM', eventType: 'Failed authentication', method: 'Password', mfaStatus: 'MFA not reached', authChannel: 'Mobile web', operatingSystem: 'Android 15', browserSource: 'Chrome Mobile', device: 'Chrome Mobile', location: 'Dallas, TX', ip: '198.51.100.11', session: 'No session created', result: 'Failed', failedAttemptCount: 2, accountLockout: 'No lockout recorded', logoutStatus: 'No session created' },
      { id: 'LOG-0981', time: 'Jun 14, 7:24 PM', method: 'Face ID', device: 'iPhone 16', location: 'Dallas, TX', ip: '198.51.100.40', session: 'SES-7421', result: 'Successful' },
      { id: 'LOG-0980', time: 'Jun 14, 7:20 PM', eventType: 'Account lockout', method: 'Password', mfaStatus: 'MFA not reached', authChannel: 'Mobile app', operatingSystem: 'iOS 18', browserSource: 'Bank app / Mobile Safari webview', device: 'iPhone 16', location: 'Dallas, TX', ip: '198.51.100.40', session: 'No session created', result: 'Account locked', failedAttemptCount: 3, accountLockout: 'Temporary lockout recorded', logoutStatus: 'No session created' },
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
    parties: [
      { id: 'FA-CB-24007-PTY-1', role: 'Cardholder', name: 'Jordan Ellis', relationship: 'Customer who submitted the billing dispute', source: 'Dispute intake' },
      { id: 'FA-CB-24007-PTY-2', role: 'Subscription merchant', name: 'StreamBox Premium', relationship: 'Merchant tied to the recurring billing records', source: 'Merchant billing packet' },
    ],
    relationshipExtras: [
      { label: 'Relationship age', value: 'Customer since 2021' },
      { label: 'Known device pattern', value: 'Android phone primary, Desktop Chrome occasional' },
    ],
    profileExtras: [
      { id: 'PCH-2204', date: 'Jun 8, 2026', time: '8:41 AM', eventType: 'Autopay preference change', item: 'Autopay notice timing updated', oldValue: '3 days before payment', newValue: '5 days before payment', channel: 'Mobile app', source: 'Card profile maintenance', user: 'Jordan Ellis', device: 'DEV-JORDAN-AND-001', ip: '203.0.113.16', session: 'SES-4018', mfaMethod: 'Biometric', notes: 'Notification timing changed; the payment destination did not change.', detail: 'Autopay reminder timing was updated in card-profile settings.' },
      { id: 'PCH-2205', date: 'May 8, 2026', time: '9:15 AM', eventType: 'Contact preference change', item: 'Preferred contact changed', oldValue: 'Email', newValue: 'Mobile app', channel: 'Mobile app', source: 'Customer profile', user: 'Jordan Ellis', device: 'DEV-JORDAN-AND-001', ip: '203.0.113.14', session: 'SES-3880', mfaMethod: 'Biometric', notes: 'Historical communication preference change.', detail: 'The preferred service-contact channel changed from email to mobile app.' },
    ],
    identityExtras: [
      { id: 'IDR-2205', type: 'Known device object', value: 'DEV-JORDAN-AND-001', lastSeen: 'Jul 8, 2026', history: 'Android phone appears across mobile app dispute and statement review activity.' },
      { id: 'IDR-2206', type: 'Secondary device object', value: 'DEV-JORDAN-DSK-002', lastSeen: 'Jun 21, 2026', history: 'Desktop Chrome appears in older profile activity.' },
    ],
    loginExtras: [
      { id: 'LOG-2205', time: 'Jul 8, 8:17 AM', eventType: 'Failed authentication', method: 'Password', mfaStatus: 'MFA not reached', authChannel: 'Mobile app', operatingSystem: 'Android 15', browserSource: 'Mobile app / Chrome WebView', device: 'Android phone', location: 'Fort Worth, TX', ip: '203.0.113.24', session: 'No session created', result: 'Failed', failedAttemptCount: 1, accountLockout: 'No lockout recorded', logoutStatus: 'No session created' },
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
    profile: { employer: 'Lakeside Office Supply', entityRole: 'Credit applicant' },
    parties: [
      { id: 'FA-CR-24003-PTY-1', role: 'Credit applicant', name: 'Avery Brooks', relationship: 'Applicant tied to the new credit relationship', source: 'Credit profile' },
      { id: 'FA-CR-24003-PTY-2', role: 'Employer', name: 'Lakeside Office Supply', relationship: 'Employer listed during profile setup', source: 'Relationship record' },
    ],
    relationshipExtras: [
      { label: 'Relationship age', value: 'New profile created Jul 7, 2026' },
      { label: 'Known device pattern', value: 'Mobile Safari only so far' },
    ],
    profileExtras: [
      { id: 'PCH-3304', date: 'Jul 7, 2026', time: '5:12 PM', eventType: 'MFA enrollment', item: 'Email code MFA enrolled', oldValue: 'No MFA route', newValue: 'avery.training@example.test', channel: 'Mobile web', source: 'Identity setup', user: 'Avery Brooks', device: 'DEV-AVERY-SAF-001', ip: '192.0.2.21', session: 'SES-9094', mfaMethod: 'Initial email code', notes: 'Initial enrollment event; compare with later login methods and recovery-contact setup.', detail: 'Email-code authentication was enrolled during profile creation.' },
    ],
    identityExtras: [
      { id: 'IDR-3305', type: 'Device object', value: 'DEV-AVERY-SAF-001', lastSeen: 'Jul 8, 2026', history: 'Only observed device object in early account history.' },
    ],
    loginExtras: [
      { id: 'LOG-3315', time: 'Jul 8, 7:41 AM', eventType: 'Failed authentication', method: 'Password', mfaStatus: 'MFA not reached', authChannel: 'Mobile web', operatingSystem: 'iOS 18', browserSource: 'Mobile Safari', device: 'Mobile Safari', location: 'Arlington, TX', ip: '192.0.2.44', session: 'No session created', result: 'Failed', failedAttemptCount: 1, accountLockout: 'No lockout recorded', logoutStatus: 'No session created' },
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
  const briefingPacket = buildCaseBriefingPacket({ item, claimType, scenario, reportedDate });
  const availableTools = item.availableTools ?? claimType.availableTools;
  const caseAvailableTools = systemAccessRecordsByCase[item.id]?.length
    ? dedupeStrings([...availableTools, 'System Access Lane'])
    : availableTools;

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
    assignedInvestigator: briefingPacket.assignedInvestigator,
    assignedDate: briefingPacket.assignedDate,
    assignmentTeam: briefingPacket.assignmentTeam,
    dueDate: briefingPacket.dueDate,
    parties: briefingPacket.parties,
    briefingDetails: briefingPacket.details,
    caseBriefing: {
      ...item.caseBriefing,
      summary: item.caseBriefing?.summary ?? item.shortSummary ?? item.allegation ?? scenario.summary,
      focusAreas: item.caseBriefing?.focusAreas ?? item.briefingQuestions ?? claimType.intakePrompts,
      evidenceAreas: item.caseBriefing?.evidenceAreas ?? item.evidenceAreas ?? claimType.evidenceAreas,
      scenarioTitle: item.caseBriefing?.scenarioTitle ?? scenario.title,
      assignedInvestigator: briefingPacket.assignedInvestigator,
      assignedDate: briefingPacket.assignedDate,
      assignmentTeam: briefingPacket.assignmentTeam,
      dueDate: briefingPacket.dueDate,
      parties: briefingPacket.parties,
      details: briefingPacket.details,
    },
    keyFacts: item.keyFacts ?? [
      ['Lane', item.lane ?? claimType.lane], ['Subtype', item.subtype ?? context.subtype ?? scenario.subtype], ['Reported date', reportedDate], ['Issue start date', issueStartDate], ['Amount / exposure', item.amountExposure ?? item.amount], ['Scenario', item.scenarioTitle ?? scenario.title],
    ],
    productsAccounts: item.productsAccounts ?? [{ label: 'Product rail', value: claimType.taxonomy.productRail }, { label: 'Primary details', value: item.transactionInfo ?? scenario.transactionInfo }],
    availableTools: caseAvailableTools,
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
    const builtFields = buildClaimFields(item, context);
    const loginHistory = addDeviceIds(item.id, item.loginHistory ?? []);
    const existingChanges = item.customer?.profileChanges ?? [];
    const needsProfileUpgrade = item.id.includes('-G') && (existingChanges.length < 3 || existingChanges.some((event) => !event.eventType || !event.oldValue || !event.newValue));
    const claimType = getClaimTypeForCase({ ...item, ...builtFields });
    const scenario = getScenario(claimType.id, item.scenarioId);
    const index = item.generatedAt ?? Number(String(item.id).replace(/\D/g, '').slice(-8)) ?? Date.now();
    return {
      ...item,
      ...builtFields,
      customer: {
        ...item.customer,
        profileChanges: needsProfileUpgrade ? makeGeneratedProfileChanges({
          id: item.id,
          index,
          person: item.person,
          city: item.intake?.customerLocation ?? item.profile?.city ?? 'Training city',
          claimType,
          scenario,
          reportedDate: item.reportedDate ?? item.opened,
          issueStartDate: item.issueStartDate ?? item.reportedDate ?? item.opened,
          loginHistory,
        }) : existingChanges,
      },
      loginHistory,
      links: dedupeStrings(item.links ?? []),
      facts: dedupeStrings(item.facts ?? []),
    };
  }

  const mergedItem = {
    ...item,
    claimId: item.claimId ?? extra.claimId,
    transactionInfo: item.transactionInfo ?? extra.transactionInfo,
    shortSummary: item.shortSummary ?? extra.shortSummary,
    profile: { ...extra.profile, ...item.profile },
    parties: item.parties ?? extra.parties,
  };

  return {
    ...mergedItem,
    ...buildClaimFields(mergedItem, context),
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
