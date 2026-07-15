import {
  coreClaimTypes,
  getClaimType,
  getScenario,
} from './claimRegistry.js';
import { buildCaseBriefingPacket } from './caseBriefingDetails.js';
import {
  buildGeneratedPersona,
  buildGeneratedToolResults,
  buildScenarioDecisionData,
  buildScenarioEvents,
} from './generatedCasePackets.js';

const generatedCaseStorageKey = 'fraud-academy-generated-cases-v1';
const generatedCaseSequenceKey = 'fraud-academy-generated-case-sequence-v1';

const depthConfig = {
  light: { label: 'Light', records: 2 },
  standard: { label: 'Standard', records: 3 },
  deep: { label: 'Deep', records: 4 },
};

const difficultyConfig = {
  light: { label: 'Focused review', extraRecords: 0, extraTimelineEvents: 0 },
  standard: { label: 'Layered review', extraRecords: 1, extraTimelineEvents: 1 },
  deep: { label: 'Cross-record review', extraRecords: 2, extraTimelineEvents: 2 },
};

function safeIndex(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.abs(Math.floor(number)) : Date.now();
}

function padded(index, length = 6) {
  return String(safeIndex(index)).slice(-length).padStart(length, '0');
}

function dateFor(index, offset = 0) {
  const date = new Date(2026, 6, 14, 12, 0, 0);
  date.setDate(date.getDate() - (safeIndex(index) % 24) - (offset * 7));
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(date);
}

function generatorOptions(indexOrOptions, options) {
  if (typeof indexOrOptions === 'object' && indexOrOptions !== null) {
    return { index: Date.now(), ...indexOrOptions };
  }
  return { index: indexOrOptions ?? Date.now(), ...(options ?? {}) };
}

function selectClaimType(index, claimTypeId) {
  if (claimTypeId) return getClaimType(claimTypeId);
  return coreClaimTypes[safeIndex(index) % coreClaimTypes.length];
}

function makeLoginHistory({ id, index, city, recordCount, claimType, scenario, difficulty }) {
  if (!claimType.availableTools.includes('Login History')) return [];
  const suffix = padded(index);
  const residentialIp = `198.51.100.${20 + (safeIndex(index) % 120)}`;
  const secondaryIp = `203.0.113.${10 + (safeIndex(index) % 120)}`;
  const determination = scenario.caseTruth?.correctDetermination ?? '';
  const established = /do not support|release|complete application/i.test(determination);
  const mixed = /insufficient|more information|escalate|unable|hold pending/i.test(determination);
  const currentLocation = established ? city : mixed ? city : 'Phoenix, AZ';
  const currentDevice = established ? `DEV-GEN-${suffix}-M` : `DEV-GEN-${suffix}-N`;
  const records = [
    { id: `LOG-${suffix}-1`, time: `${dateFor(index)} · 9:18 AM`, eventType: 'Interactive login', method: established ? 'Biometric' : 'Password', mfaStatus: established ? 'Biometric completed' : mixed ? 'SMS code completed' : 'SMS code completed after recovery change', authChannel: 'Mobile web', device: established ? 'Established training mobile browser' : 'New training mobile browser', deviceId: currentDevice, operatingSystem: 'Training Mobile OS 18', browserSource: 'Chrome Mobile training browser', location: currentLocation, ip: established ? residentialIp : secondaryIp, session: `${id}-SES-1`, result: 'Successful', failedAttemptCount: established ? 0 : 2, accountLockout: 'No lockout recorded', logoutStatus: difficulty === 'deep' ? 'Session ended without an explicit logout event' : 'Normal logout recorded' },
    { id: `LOG-${suffix}-2`, time: `${dateFor(index, 1)} · 4:42 PM`, eventType: 'Interactive login', method: 'Biometric', mfaStatus: 'Biometric completed', authChannel: 'Mobile app', device: 'Established training mobile browser', deviceId: `DEV-GEN-${suffix}-M`, operatingSystem: 'Training Mobile OS 18', browserSource: 'Fraud Academy training app', location: city, ip: residentialIp, session: `${id}-SES-2`, result: 'Successful', failedAttemptCount: 0, accountLockout: 'No lockout recorded', logoutStatus: 'Session timeout recorded' },
    { id: `LOG-${suffix}-3`, time: `${dateFor(index, 2)} · 11:05 AM`, eventType: 'Failed authentication', method: 'Password', mfaStatus: 'MFA not reached', authChannel: 'Desktop web', device: 'Training desktop browser', deviceId: `DEV-GEN-${suffix}-D`, operatingSystem: 'Training Desktop OS 14', browserSource: 'Chrome desktop training browser', location: currentLocation, ip: secondaryIp, session: 'No session created', result: 'Failed', failedAttemptCount: 2, accountLockout: 'No lockout recorded', logoutStatus: 'No session created' },
    { id: `LOG-${suffix}-4`, time: `${dateFor(index, 2)} · 11:08 AM`, eventType: 'Account lockout', method: 'Password', mfaStatus: 'MFA not reached', authChannel: 'Desktop web', device: 'Training desktop browser', deviceId: `DEV-GEN-${suffix}-D`, operatingSystem: 'Training Desktop OS 14', browserSource: 'Chrome desktop training browser', location: currentLocation, ip: secondaryIp, session: 'No session created', result: 'Account locked', failedAttemptCount: 3, accountLockout: 'Temporary lockout recorded', logoutStatus: 'No session created' },
    { id: `LOG-${suffix}-5`, time: `${dateFor(index, 3)} · 2:16 PM`, eventType: 'Interactive login', method: 'Email code', mfaStatus: 'Email code completed', authChannel: 'Desktop web', device: 'Training desktop browser', deviceId: `DEV-GEN-${suffix}-D`, operatingSystem: 'Training Desktop OS 14', browserSource: 'Chrome desktop training browser', location: city, ip: secondaryIp, session: `${id}-SES-5`, result: 'Successful', failedAttemptCount: 0, accountLockout: 'Lockout cleared before this event', logoutStatus: 'Normal logout recorded' },
  ];
  return records.slice(0, recordCount);
}

export function makeGeneratedProfileChanges({ id, index, person, city, claimType, scenario, reportedDate, issueStartDate, loginHistory }) {
  const currentLogin = loginHistory[0] ?? {};
  const priorLogin = loginHistory.find((item, itemIndex) => itemIndex > 0 && /successful/i.test(item.result)) ?? currentLogin;
  const hasAccessHistory = loginHistory.length > 0;
  const dateFromLogin = (value, fallback) => String(value ?? '').match(/^[A-Z][a-z]{2} \d{2}, \d{4}/)?.[0] ?? fallback;
  const claim = `${claimType.id} ${claimType.lane} ${scenario.subtype}`.toLowerCase();
  const email = `${person.toLowerCase().replace(/\s+/g, '.')}@training.example.test`;
  let scenarioEvent = {
    eventType: 'Contact preference change',
    item: 'Preferred contact channel updated',
    oldValue: 'Email',
    newValue: scenario.channel,
    notes: 'Compare the maintenance event with the active claim channel and recent contact history.',
  };

  if (claim.includes('account-takeover') || claim.includes('account takeover')) scenarioEvent = {
    eventType: 'Recovery email change',
    item: 'Recovery email updated',
    oldValue: email,
    newValue: `recovery.${String(index).slice(-4)}@training.example.test`,
    notes: 'Compare with Login History, Session History, alert delivery, and the active claim sequence.',
  };
  else if (claim.includes('payroll')) scenarioEvent = {
    eventType: 'Payroll bank-profile change',
    item: 'Direct deposit destination updated',
    oldValue: 'Destination ID ••••1042',
    newValue: `Destination ID ••••${padded(index, 4)}`,
    notes: 'Compare employee authorization, callback records, ownership, prior use, and payroll timing.',
  };
  else if (claim.includes('bec') || claim.includes('vendor') || claim.includes('wire')) scenarioEvent = {
    eventType: 'Beneficiary profile change',
    item: 'Payment beneficiary destination updated',
    oldValue: 'Destination ID ••••2204',
    newValue: `Destination ID ••••${padded(index, 4)}`,
    notes: 'Compare the instruction source, callback, ownership, prior use, and payment-release sequence.',
  };
  else if (claim.includes('credit') || claim.includes('application') || claim.includes('bust')) scenarioEvent = {
    eventType: 'Payment profile change',
    item: 'External payment account linked',
    oldValue: 'No external destination',
    newValue: `Destination ID ••••${padded(index, 4)}`,
    notes: 'Compare ownership, application data, documents, prior use, and account age.',
  };
  else if (claim.includes('chargeback') || claim.includes('card')) scenarioEvent = {
    eventType: 'Billing alert preference change',
    item: 'Card alert threshold updated',
    oldValue: '$250.00',
    newValue: '$100.00',
    notes: 'Compare alert delivery with the transaction and customer-contact timeline.',
  };

  return [
    {
      id: `${id}-PCH-1`,
      date: dateFromLogin(currentLogin.time, reportedDate),
      time: '9:21 AM',
      ...scenarioEvent,
      channel: 'Digital profile maintenance',
      source: 'Generated profile history',
      user: person,
      device: currentLogin.deviceId ?? currentLogin.device ?? 'Profile servicing record',
      ip: currentLogin.ip ?? 'No network record required for this lane',
      session: currentLogin.session ?? `${id}-PROFILE-1`,
      mfaMethod: currentLogin.method ?? 'Profile verification',
      detail: `${scenarioEvent.item} was recorded as a fictional maintenance event for ${scenario.subtype} review.`,
    },
    hasAccessHistory ? {
      id: `${id}-PCH-2`,
      date: dateFromLogin(priorLogin.time, issueStartDate),
      time: '4:47 PM',
      eventType: 'MFA preference change',
      item: 'Authentication route confirmed',
      oldValue: 'Password only',
      newValue: priorLogin.method ?? 'Email code',
      channel: 'Digital profile maintenance',
      source: 'Generated security profile',
      user: person,
      device: priorLogin.deviceId ?? priorLogin.device ?? 'Profile servicing record',
      ip: priorLogin.ip ?? 'No network record required for this lane',
      session: priorLogin.session ?? `${id}-SES-2`,
      mfaMethod: priorLogin.method ?? 'Email code',
      notes: 'Authentication enrollment is evidence only; compare it with the login and session records.',
      detail: 'The fictional profile recorded an authentication-route maintenance event.',
    } : {
      id: `${id}-PCH-2`,
      date: issueStartDate,
      time: '4:47 PM',
      eventType: 'Contact record confirmation',
      item: 'Primary contact route reviewed',
      oldValue: 'Fictional contact record on file',
      newValue: scenario.channel,
      channel: 'Customer profile',
      source: 'Generated profile history',
      user: person,
      device: 'Profile servicing record',
      ip: 'No network record required for this lane',
      session: `${id}-PROFILE-2`,
      mfaMethod: 'Profile verification',
      notes: 'This profile-maintenance record is customer context and does not create a Login History event.',
      detail: 'The fictional profile contact route was reviewed for the active case.',
    },
    {
      id: `${id}-PCH-3`,
      date: dateFor(index, 4),
      time: '11:08 AM',
      eventType: 'Address verification',
      item: 'Physical address confirmed',
      oldValue: `${city} training address`,
      newValue: `${city} training address`,
      channel: 'Customer profile',
      source: 'Generated profile history',
      user: person,
      device: priorLogin.deviceId ?? priorLogin.device ?? 'Profile servicing record',
      ip: priorLogin.ip ?? 'No network record required for this lane',
      session: `${id}-PCH-VERIFY`,
      mfaMethod: 'Profile verification',
      notes: 'The existing address was confirmed without a value change.',
      detail: 'Address verification retained the fictional profile address.',
    },
  ];
}

function makeDocuments({ id, claimType, scenario, recordCount, difficulty }) {
  const documentCount = Math.min(claimType.documents.length, Math.max(4, recordCount));
  return claimType.documents.slice(0, documentCount).map((name, itemIndex) => ({
    id: `${id}-DOC-${itemIndex + 1}`,
    status: itemIndex === 2 || (difficulty === 'deep' && itemIndex === documentCount - 1) ? 'Requested' : itemIndex === 0 ? 'Received' : 'Available',
    name,
    detail: itemIndex === 2 || (difficulty === 'deep' && itemIndex === documentCount - 1)
      ? `${name} has been requested for the fictional case packet.`
      : `${name} is available for ${scenario.subtype} review in this fictional training packet.`,
  }));
}

function intakeAnswer({ prompt, itemIndex, scenario, person, city, reportedDate, issueStartDate, toolResults }) {
  const normalized = prompt.toLowerCase();
  const merchant = toolResults.merchantIntelligence?.profile;
  const credit = toolResults.creditProfile;
  const payment = toolResults.paymentVerification?.[0];

  if (itemIndex === 0) return scenario.statement;
  if (/when|date|notice|started/.test(normalized)) return `The activity window begins ${issueStartDate}; the case was reported ${reportedDate}.`;
  if (/device|location|recognize/.test(normalized)) return `The stated customer location is ${city}; device and network records are available when that tool is in the claim lane.`;
  if (/merchant|purchase|cancel|return|refund/.test(normalized) && merchant) return `${merchant.name} is recorded under MCC ${merchant.mcc}; ${merchant.priorTransactionCount} prior transaction(s) and ${merchant.refundCount} refund(s) are available.`;
  if (/income|revenue|employer|debt|bankruptcy|cash.flow|utilization|payment/.test(normalized) && credit) return `Stated support is ${credit.statedAnnualIncome}, verified support is ${credit.verifiedAnnualIncome}, utilization is ${credit.utilization}, and ${credit.missingDocuments.length} required document(s) remain missing.`;
  if (/bank|destination|owner|beneficiary|payroll/.test(normalized) && payment) return `${payment.object} is recorded with ${payment.ownerMatch.toLowerCase()} and ${payment.priorUse.toLowerCase()}.`;
  if (/document|evidence|record|available|missing/.test(normalized)) return `${toolResults.documents.filter((item) => item.status !== 'Requested').length} document(s) are available and ${toolResults.documents.filter((item) => item.status === 'Requested').length} remain requested.`;
  if (/who|customer|employee|vendor|applicant/.test(normalized)) return `${person} is the fictional subject recorded through ${scenario.channel}.`;
  return `${scenario.subtype} records from ${scenario.channel} are available for comparison across the required tools.`;
}

export function createGeneratedCase(indexOrOptions = Date.now(), options = {}) {
  const config = generatorOptions(indexOrOptions, options);
  const index = safeIndex(config.index);
  const claimType = selectClaimType(index, config.claimTypeId);
  const scenario = getScenario(claimType.id, config.scenarioId);
  const caseClaimType = { ...claimType, availableTools: scenario.toolkitTools ?? claimType.availableTools };
  const difficulty = ['light', 'standard', 'deep'].includes(config.difficulty) ? config.difficulty : 'standard';
  const depth = depthConfig[config.evidenceDepth] ?? depthConfig.standard;
  const difficultyProfile = difficultyConfig[difficulty];
  const recordCount = Math.min(5, depth.records + difficultyProfile.extraRecords);
  const suffix = padded(index);
  const persona = buildGeneratedPersona(index, scenario);
  const { person, city, employer, business, phone, email, address } = persona;
  const id = `FA-${claimType.prefix}-G${String(index).slice(-8)}`;
  const trainingId = `TRN-GEN-${suffix}`;
  const reportedDate = dateFor(index);
  const issueStartDate = dateFor(index, 2);
  const documents = makeDocuments({ id, claimType, scenario, recordCount, difficulty });
  const toolResults = buildGeneratedToolResults({ id, index, person, city, employer, business, claimType: caseClaimType, scenario, documents, recordCount, trainingId, reportedDate, issueStartDate, difficulty });
  const loginHistory = makeLoginHistory({ id, index, city, recordCount, claimType: caseClaimType, scenario, difficulty });
  const profileChanges = makeGeneratedProfileChanges({ id, index, person, city, claimType, scenario, reportedDate, issueStartDate, loginHistory });
  const statementLabel = /business|vendor|payment contact/i.test(scenario.entityRole) ? 'Business statement' : /employee/i.test(scenario.entityRole) ? 'Employee statement' : /applicant/i.test(scenario.entityRole) ? 'Applicant statement' : 'Customer statement';
  const intakeAnswers = claimType.intakePrompts.map((prompt, itemIndex) => ({
    id: `${id}-INT-${itemIndex + 1}`,
    prompt,
    answer: intakeAnswer({ prompt, itemIndex, scenario, person, city, reportedDate, issueStartDate, toolResults }),
  }));
  const events = buildScenarioEvents({ id, scenario, claimType, reportedDate, issueStartDate, difficulty, evidenceDepth: depth.label });
  const intake = { channel: scenario.channel, contactTime: `${reportedDate} - 9:05 AM`, customerLocation: city, statedDevice: loginHistory[0]?.device ?? 'No device statement required for this lane' };
  const profile = { person, trainingId, city, employer, business, entityRole: scenario.entityRole };
  const taxonomyTags = scenario.taxonomyTags ?? claimType.taxonomy;
  const customer = {
    relationshipSince: /existing|history/i.test(`${scenario.family} ${scenario.caseTruth?.classification}`) ? '2021' : index % 2 ? '2023' : '2026',
    segment: `${claimType.shortLabel} training profile`,
    contact: { phone, email, address, preferredChannel: scenario.channel },
    relationship: [
      { label: 'Open products', value: taxonomyTags.productRail },
      { label: 'Relationship context', value: taxonomyTags.lifecycleStage },
      { label: 'Primary entity', value: taxonomyTags.productRail === 'payroll' || taxonomyTags.productRail === 'loan' ? business : person },
    ],
    profileChanges,
  };
  const decisionData = buildScenarioDecisionData({ claimType, scenario, reportedDate, toolResults });
  const briefingPacket = buildCaseBriefingPacket({
    item: {
      id,
      person,
      amount: scenario.amount,
      amountExposure: scenario.amount,
      priority: scenario.priority,
      subtype: scenario.subtype,
      scenarioFamily: scenario.family ?? claimType.lane,
      transactionInfo: scenario.transactionInfo,
      intake,
      profile,
      customer,
      toolResults,
      events,
      loginHistory,
    },
    claimType,
    scenario,
    reportedDate,
  });

  return {
    id,
    caseId: id,
    claimId: `CLM-${claimType.prefix}-G${String(index).slice(-8)}`,
    claimTypeId: claimType.id,
    type: claimType.label,
    claimType: claimType.label,
    lane: claimType.lane,
    subtype: scenario.subtype,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    scenarioFamily: scenario.family ?? claimType.lane,
    plainEnglishMeaning: scenario.plainEnglishMeaning,
    howItHappens: scenario.howItHappens,
    timelinePattern: scenario.timelinePattern,
    commonMistake: scenario.commonMistake,
    miniExample: scenario.miniExample,
    difficulty,
    evidenceDepth: depth.label,
    priority: scenario.priority,
    status: 'Generated',
    person,
    trainingId,
    amount: scenario.amount,
    amountExposure: scenario.amount,
    opened: 'Generated training case',
    reportedDate,
    issueStartDate,
    title: scenario.title,
    transactionInfo: scenario.transactionInfo,
    shortSummary: scenario.summary,
    allegation: scenario.summary,
    queueReason: `${claimType.label} · ${scenario.subtype} · generated training case.`,
    statement: { label: statementLabel, value: scenario.statement, source: scenario.channel },
    assignedInvestigator: briefingPacket.assignedInvestigator,
    assignedDate: briefingPacket.assignedDate,
    assignmentTeam: briefingPacket.assignmentTeam,
    dueDate: briefingPacket.dueDate,
    parties: briefingPacket.parties,
    briefingDetails: briefingPacket.details,
    caseBriefing: {
      summary: scenario.summary,
      focusAreas: claimType.intakePrompts,
      evidenceAreas: claimType.evidenceAreas,
      scenarioTitle: scenario.title,
      complexity: difficultyProfile.label,
      assignedInvestigator: briefingPacket.assignedInvestigator,
      assignedDate: briefingPacket.assignedDate,
      assignmentTeam: briefingPacket.assignmentTeam,
      dueDate: briefingPacket.dueDate,
      parties: briefingPacket.parties,
      details: briefingPacket.details,
    },
    intake,
    intakeAnswers,
    briefingQuestions: claimType.intakePrompts,
    keyFacts: [
      ['Lane', claimType.lane], ['Subtype', scenario.subtype], ['Reported date', reportedDate], ['Issue start date', issueStartDate], ['Amount / exposure', scenario.amount], ['Scenario', scenario.title], ['Difficulty', difficultyProfile.label], ['Evidence depth', depth.label],
    ],
    productsAccounts: [{ label: 'Product rail', value: taxonomyTags.productRail }, { label: 'Entity role', value: scenario.entityRole }, { label: 'Primary account context', value: scenario.transactionInfo }],
    availableTools: scenario.toolkitTools ?? claimType.availableTools,
    requiredTools: claimType.requiredTools,
    evidenceAreas: claimType.evidenceAreas,
    expectedEvidenceCategories: scenario.expectedEvidence ?? claimType.evidenceAreas,
    taxonomyTags,
    profile,
    customer,
    identityRecords: [
      { id: `${id}-IDR-1`, type: 'Training ID', value: trainingId, lastSeen: reportedDate, history: 'Generated Training ID tied to the active fictional case.' },
      { id: `${id}-IDR-2`, type: 'Contact record', value: `${email} | ${phone}`, lastSeen: reportedDate, history: 'Fictional contact record is available for case comparison.' },
      { id: `${id}-IDR-3`, type: 'Address record', value: address, lastSeen: issueStartDate, history: 'Fictional address record is available for review.' },
    ],
    loginHistory,
    events,
    timelineEvents: events,
    documents,
    evidenceDocuments: documents,
    documentRequests: toolResults.documents,
    toolResults,
    facts: ['Generated training case', 'No final outcome shown', 'No outcome is displayed during active investigation', 'Evidence First lock active', `${difficultyProfile.label} / ${depth.label} packet depth`, difficulty === 'deep' ? 'Two cross-source dependencies require reconciliation' : difficulty === 'standard' ? 'One cross-source comparison requires reconciliation' : 'Focused evidence path'],
    progress: ['Case Summary'],
    links: ['Customer or entity', 'Case event', 'Document', ...(toolResults.paymentVerification?.length ? ['Payment object'] : []), ...(toolResults.merchantIntelligence ? ['Merchant and order objects'] : [])],
    actionLog: [{ id: `${id}-ACT-1`, time: `${reportedDate} - 9:05 AM`, action: 'Generated case created', detail: `${claimType.label} scenario ${scenario.title} added to the training queue.`, source: 'Scenario generator' }],
    creditDecision: decisionData.creditDecision,
    chargebackDecision: decisionData.chargebackDecision,
    caseTruth: scenario.caseTruth,
    correctDetermination: scenario.caseTruth?.correctDetermination,
    scoringRules: {
      difficulty,
      difficultyProfile: difficultyProfile.label,
      evidenceDepth: depth.label,
      debriefLockedUntilSubmission: true,
      acceptedDeterminations: scenario.caseTruth?.acceptedDeterminations ?? [],
      complexityDependencies: difficulty === 'deep' ? 2 : difficulty === 'standard' ? 1 : 0,
      missingDocumentCount: documents.filter((document) => document.status === 'Requested').length,
    },
    debriefLogic: scenario.debriefLogic,
  };
}

export function readGeneratedCases() {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(generatedCaseStorageKey);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function writeGeneratedCases(cases = []) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(generatedCaseStorageKey, JSON.stringify(cases));
}

function nextGeneratedCaseIndex() {
  const fallback = Date.now();
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = Number(window.localStorage.getItem(generatedCaseSequenceKey));
    const next = Number.isFinite(saved) && saved >= fallback ? saved + 1 : fallback;
    window.localStorage.setItem(generatedCaseSequenceKey, String(next));
    return next;
  } catch {
    return fallback;
  }
}

export function addGeneratedCase(options = {}) {
  const current = readGeneratedCases();
  let seed = nextGeneratedCaseIndex();
  let nextCase = createGeneratedCase(seed, options);
  const existingIds = new Set(current.map((item) => item.id));
  while (existingIds.has(nextCase.id)) {
    seed += 1;
    nextCase = createGeneratedCase(seed, options);
  }
  writeGeneratedCases([nextCase, ...current]);
  return nextCase;
}
