import {
  coreClaimTypes,
  getClaimType,
  getScenario,
} from './claimRegistry.js';

const generatedCaseStorageKey = 'fraud-academy-generated-cases-v1';
const generatedCaseSequenceKey = 'fraud-academy-generated-case-sequence-v1';

const generatedNames = ['Riley Monroe', 'Sienna Vale', 'Drew Harper', 'Kai Bennett', 'Morgan Reese', 'Nova Lane', 'Avery Quinn', 'Cameron Blake', 'Jordan Reed', 'Taylor Morgan'];
const generatedCities = ['Dallas, TX', 'Fort Worth, TX', 'Arlington, TX', 'Irving, TX', 'DeSoto, TX', 'Cedar Hill, TX', 'Plano, TX', 'Grapevine, TX'];
const generatedEmployers = ['Lakeside Office Supply', 'Riverbend Services', 'Northline Operations', 'Cedar Square Logistics', 'Brightline Studio'];
const generatedBusinesses = ['Northline Services LLC', 'Cedar Square Market', 'Riverbend Operations', 'Brightline Supply Co.', 'Lakeside Trade Group'];

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
  const day = 8 - ((safeIndex(index) + offset) % 6);
  return `Jul ${String(Math.max(2, day)).padStart(2, '0')}, 2026`;
}

function amountNumber(value = '$0.00') {
  return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
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

function makeLoginHistory({ id, index, city, recordCount }) {
  const suffix = padded(index);
  const records = [
    { id: `LOG-${suffix}-1`, time: `${dateFor(index)} · 9:18 AM`, method: 'Password', device: 'Training mobile browser', deviceId: `DEV-GEN-${suffix}-M`, location: city, ip: `198.51.100.${20 + (safeIndex(index) % 120)}`, session: `${id}-SES-1`, result: 'Successful' },
    { id: `LOG-${suffix}-2`, time: `${dateFor(index, 1)} · 4:42 PM`, method: 'Biometric', device: 'Training mobile browser', deviceId: `DEV-GEN-${suffix}-M`, location: city, ip: `198.51.100.${20 + (safeIndex(index) % 120)}`, session: `${id}-SES-2`, result: 'Successful' },
    { id: `LOG-${suffix}-3`, time: `${dateFor(index, 2)} · 11:05 AM`, method: 'Password', device: 'Training desktop browser', deviceId: `DEV-GEN-${suffix}-D`, location: city, ip: `203.0.113.${10 + (safeIndex(index) % 120)}`, session: `${id}-SES-3`, result: 'Successful' },
    { id: `LOG-${suffix}-4`, time: `${dateFor(index, 3)} · 2:16 PM`, method: 'Email code', device: 'Training desktop browser', deviceId: `DEV-GEN-${suffix}-D`, location: city, ip: `203.0.113.${10 + (safeIndex(index) % 120)}`, session: `${id}-SES-4`, result: 'Successful' },
  ];
  return records.slice(0, recordCount);
}

function makeDocuments({ id, claimType, scenario, index, recordCount }) {
  const statuses = ['Received', 'Available', 'Requested', 'Available'];
  return claimType.documents.slice(0, recordCount).map((name, itemIndex) => ({
    id: `${id}-DOC-${itemIndex + 1}`,
    status: statuses[itemIndex] ?? 'Available',
    name,
    detail: itemIndex === 2
      ? `${name} has been requested for the fictional case packet.`
      : `${name} is available for ${scenario.subtype} review in this fictional training packet.`,
  }));
}

function makeToolResults({ id, person, city, employer, business, claimType, scenario, documents, index, recordCount, trainingId }) {
  const suffix = padded(index);
  const amount = amountNumber(scenario.amount);
  const financialCount = Math.max(2, recordCount);
  const transactions = Array.from({ length: financialCount }, (_, itemIndex) => ({
    id: `${id}-TXN-${itemIndex + 1}`,
    posted: dateFor(index, itemIndex),
    time: `${String(9 + itemIndex).padStart(2, '0')}:${itemIndex ? '42' : '18'} AM`,
    merchant: itemIndex === 0 ? scenario.transactionInfo.split(' · ')[0] : `${claimType.shortLabel} reference ${itemIndex + 1}`,
    amount: `$${Math.max(0, amount - (itemIndex * Math.max(10, Math.round(amount * 0.12)))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    channel: claimType.taxonomy.productRail === 'payroll' ? 'Direct deposit training record' : claimType.taxonomy.productRail === 'wire' ? 'Wire instruction record' : claimType.taxonomy.productRail === 'credit' || claimType.taxonomy.productRail === 'loan' ? 'Account and credit activity' : 'Card or account activity',
    instrument: claimType.taxonomy.productRail === 'credit' || claimType.taxonomy.productRail === 'loan' ? 'Training credit account' : 'Training payment object',
    status: itemIndex === 0 ? 'Posted record' : 'Historical record',
  }));
  const financialIntel = claimType.evidenceAreas.slice(0, recordCount).map((area, itemIndex) => ({
    id: `${id}-FIN-${itemIndex + 1}`,
    type: area,
    value: itemIndex === 0 ? scenario.amount : `${claimType.shortLabel} record available`,
    observed: dateFor(index, itemIndex),
    context: `Fictional ${scenario.subtype} packet item for neutral review.`,
  }));
  const paymentVerification = [{
    id: `${id}-PV-1`,
    type: claimType.taxonomy.productRail === 'payroll' ? 'Payroll destination' : claimType.taxonomy.productRail === 'wire' ? 'Beneficiary destination' : 'Payment verification object',
    object: `Destination ID DST-${suffix}`,
    status: 'Record available',
    lastSeen: `${dateFor(index)} · 9:18 AM`,
    context: `Training-safe ${claimType.shortLabel.toLowerCase()} payment object for comparison.`,
    bankName: 'Training Financial Network',
    accountType: claimType.taxonomy.productRail === 'payroll' ? 'Payroll destination' : 'External training account',
    accountHolder: person,
    ownerMatch: 'Ownership field recorded',
    accountStatus: 'Open training record',
    standing: 'History available',
    priorUse: 'Prior-use context supplied in the packet',
    firstSeen: dateFor(index, 2),
    verificationMethod: 'Training record comparison',
    recoverability: 'Review path not determined',
    bankCode: `BC-${suffix.slice(-4)}`,
    destinationId: `DST-${suffix}`,
    oldDestination: 'Prior destination not supplied',
    newDestination: `Destination ID DST-${suffix}`,
    changeComparison: `${claimType.shortLabel} payment object available for comparison.`,
    verificationOutcome: 'Verification record available for review',
    relatedRecords: transactions.map((item) => item.id),
    actions: ['Compare linked records', 'Document the verification source'],
    verificationLog: [{ time: `${dateFor(index)} · 9:30 AM`, method: 'Training lookup', result: 'Recorded', note: 'No case outcome is shown in the verification log.' }],
    notes: 'Payment object records should be compared with the related case packet.',
  }];
  const business360 = [{
    id: `${id}-BIZ-1`,
    entity: claimType.taxonomy.productRail === 'payroll' || claimType.taxonomy.productRail === 'loan' ? business : `${scenario.transactionInfo.split(' · ')[0]} training entity`,
    relationship: `${claimType.shortLabel} relationship record`,
    status: 'Record available',
    observed: dateFor(index),
    context: `Fictional entity context for ${scenario.subtype} review.`,
  }];
  const businessIntel = claimType.evidenceAreas.slice(0, 2).map((area, itemIndex) => ({
    id: `${id}-BIN-${itemIndex + 1}`,
    type: area,
    value: itemIndex === 0 ? business : `${claimType.shortLabel} packet context`,
    observed: dateFor(index, itemIndex),
    context: 'Training record available for comparison with case evidence.',
  }));
  const employeeProfile = [{
    id: `${id}-EMP-1`,
    name: person,
    role: claimType.taxonomy.productRail === 'payroll' ? 'Employee payroll record' : scenario.entityRole,
    employer,
    status: 'Record available',
    lastSeen: dateFor(index),
    context: `Fictional ${claimType.shortLabel.toLowerCase()} relationship record.`,
  }];
  const payrollHistory = Array.from({ length: Math.min(3, recordCount) }, (_, itemIndex) => ({
    id: `${id}-PAYR-${itemIndex + 1}`,
    period: `Training period ${itemIndex + 1}`,
    employer,
    amount: `$${(Math.max(900, Math.round(amount / Math.max(1, recordCount)) + (itemIndex * 40))).toLocaleString('en-US')}.00`,
    channel: claimType.taxonomy.productRail === 'payroll' ? 'Direct deposit training record' : 'Relationship context record',
    status: 'Recorded',
    context: `Available for ${claimType.shortLabel.toLowerCase()} comparison.`,
  }));
  const evidence = documents.map((document, itemIndex) => ({
    id: `${id}-EVD-${itemIndex + 1}`,
    status: document.status,
    type: itemIndex === 0 ? 'Case packet' : 'Supporting document',
    name: document.name,
    source: itemIndex === 0 ? scenario.channel : 'Generated training packet',
    received: document.status === 'Requested' ? 'Pending' : dateFor(index, itemIndex),
    summary: document.detail,
    linkedObject: itemIndex === 0 ? id : transactions[itemIndex % transactions.length].id,
  }));
  const documentRequests = documents.map((document, itemIndex) => ({
    id: document.id,
    title: document.name,
    category: itemIndex === 2 ? 'Requested document' : 'Case document',
    status: document.status,
    updated: document.status === 'Requested' ? 'Pending' : dateFor(index, itemIndex),
    preview: document.detail,
    fields: `Case ID, ${claimType.label}, ${scenario.subtype}, training packet status`,
  }));
  return {
    transactions,
    financialIntel,
    paymentVerification,
    business360,
    businessIntel,
    employeeProfile,
    payrollHistory,
    evidence,
    documents: documentRequests,
    identityReport: [{ id: `${id}-IDR-1`, label: 'Training identity', value: trainingId }],
  };
}

export function createGeneratedCase(indexOrOptions = Date.now(), options = {}) {
  const config = generatorOptions(indexOrOptions, options);
  const index = safeIndex(config.index);
  const claimType = selectClaimType(index, config.claimTypeId);
  const scenario = getScenario(claimType.id, config.scenarioId);
  const difficulty = ['light', 'standard', 'deep'].includes(config.difficulty) ? config.difficulty : 'standard';
  const depth = depthConfig[config.evidenceDepth] ?? depthConfig.standard;
  const difficultyProfile = difficultyConfig[difficulty];
  const recordCount = Math.min(5, depth.records + difficultyProfile.extraRecords);
  const suffix = padded(index);
  const person = generatedNames[index % generatedNames.length];
  const city = generatedCities[index % generatedCities.length];
  const employer = generatedEmployers[index % generatedEmployers.length];
  const business = generatedBusinesses[index % generatedBusinesses.length];
  const id = `FA-${claimType.prefix}-G${String(index).slice(-8)}`;
  const trainingId = `TRN-GEN-${suffix}`;
  const reportedDate = dateFor(index);
  const issueStartDate = dateFor(index, 2);
  const documents = makeDocuments({ id, claimType, scenario, index, recordCount });
  const toolResults = makeToolResults({ id, person, city, employer, business, claimType, scenario, documents, index, recordCount, trainingId });
  const statementLabel = /business|vendor|payment contact/i.test(scenario.entityRole) ? 'Business statement' : /employee/i.test(scenario.entityRole) ? 'Employee statement' : /applicant/i.test(scenario.entityRole) ? 'Applicant statement' : 'Customer statement';
  const intakeAnswers = claimType.intakePrompts.map((prompt, itemIndex) => ({
    id: `${id}-INT-${itemIndex + 1}`,
    prompt,
    answer: itemIndex === 0 ? scenario.statement : itemIndex === 1 ? `Intake channel: ${scenario.channel}.` : `Training packet lists ${claimType.evidenceAreas[itemIndex] ?? 'related case records'} for review.`,
  }));
  const events = [
    { id: `${id}-EVT-1`, time: `${issueStartDate} · 10:10 AM`, label: 'Case activity recorded', detail: `${claimType.shortLabel} case activity entered in the fictional packet.`, chip: 'Case event', object: 'Case' },
    { id: `${id}-EVT-2`, time: `${reportedDate} · 9:05 AM`, label: 'Intake or alert received', detail: `${scenario.channel} opened the case for neutral review.`, chip: 'Intake', object: 'Statement' },
    { id: `${id}-EVT-3`, time: `${reportedDate} · 9:18 AM`, label: 'Evidence packet initialized', detail: `${depth.label} evidence depth selected for this generated training case.`, chip: 'Packet', object: 'Document' },
    ...Array.from({ length: difficultyProfile.extraTimelineEvents }, (_, itemIndex) => ({
      id: `${id}-EVT-C${itemIndex + 1}`,
      time: `${reportedDate} · ${String(10 + itemIndex).padStart(2, '0')}:2${itemIndex} AM`,
      label: 'Related packet record available',
      detail: `${difficultyProfile.label} adds a related fictional record for comparison.`,
      chip: 'Packet',
      object: 'Record',
    })),
  ];

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
    caseBriefing: { summary: scenario.summary, focusAreas: claimType.intakePrompts, evidenceAreas: claimType.evidenceAreas, scenarioTitle: scenario.title, complexity: difficultyProfile.label },
    intake: { channel: scenario.channel, contactTime: `${reportedDate} · 9:05 AM`, customerLocation: city, statedDevice: 'Training device profile' },
    intakeAnswers,
    briefingQuestions: claimType.intakePrompts,
    keyFacts: [
      ['Lane', claimType.lane], ['Subtype', scenario.subtype], ['Reported date', reportedDate], ['Issue start date', issueStartDate], ['Amount / exposure', scenario.amount], ['Scenario', scenario.title], ['Difficulty', difficultyProfile.label], ['Evidence depth', depth.label],
    ],
    productsAccounts: [{ label: 'Product rail', value: claimType.taxonomy.productRail }, { label: 'Entity role', value: scenario.entityRole }, { label: 'Primary account context', value: scenario.transactionInfo }],
    availableTools: claimType.availableTools,
    requiredTools: claimType.requiredTools,
    evidenceAreas: claimType.evidenceAreas,
    expectedEvidenceCategories: claimType.evidenceAreas,
    taxonomyTags: claimType.taxonomy,
    profile: { person, trainingId, city, employer, business, entityRole: scenario.entityRole },
    customer: {
      relationshipSince: index % 2 ? '2023' : '2026',
      segment: `${claimType.shortLabel} training profile`,
      contact: { phone: '(555) 010-0000', email: `${person.toLowerCase().replace(/\s+/g, '.')}@training.example.test`, address: `${city} training address`, preferredChannel: scenario.channel },
      relationship: [
        { label: 'Open products', value: claimType.taxonomy.productRail },
        { label: 'Relationship context', value: claimType.taxonomy.lifecycleStage },
        { label: 'Primary entity', value: claimType.taxonomy.productRail === 'payroll' || claimType.taxonomy.productRail === 'loan' ? business : person },
      ],
      profileChanges: [{ id: `${id}-PCH-1`, date: reportedDate, item: 'Generated profile packet created', detail: `${claimType.shortLabel} profile context initialized for training review.`, source: 'Scenario generator' }],
    },
    identityRecords: [
      { id: `${id}-IDR-1`, type: 'Training ID', value: trainingId, lastSeen: reportedDate, history: 'Generated Training ID tied to the active fictional case.' },
      { id: `${id}-IDR-2`, type: 'Contact record', value: `${person.toLowerCase().replace(/\s+/g, '.')}@training.example.test`, lastSeen: reportedDate, history: 'Fictional contact record is available for case comparison.' },
      { id: `${id}-IDR-3`, type: 'Address record', value: `${city} training address`, lastSeen: issueStartDate, history: 'Fictional address record is available for review.' },
    ],
    loginHistory: makeLoginHistory({ id, index, city, recordCount }),
    events,
    documents,
    documentRequests: toolResults.documents,
    toolResults,
    facts: ['Generated training case', 'No final outcome shown', 'Evidence First lock active', `${difficultyProfile.label} / ${depth.label} packet depth`],
    progress: ['Case Summary'],
    links: ['Customer or entity', 'Case event', 'Document', 'Payment object'],
    actionLog: [{ id: `${id}-ACT-1`, time: `${reportedDate} · 9:05 AM`, action: 'Generated case created', detail: `${claimType.label} scenario ${scenario.title} added to the training queue.`, source: 'Scenario generator' }],
    creditDecision: claimType.credit ? { ...claimType.credit, family: scenario.family ?? 'Credit review' } : null,
    chargebackDecision: claimType.chargeback ? { ...claimType.chargeback } : null,
    scoringRules: { difficulty, difficultyProfile: difficultyProfile.label, evidenceDepth: depth.label, debriefLockedUntilSubmission: true },
    debriefLogic: 'Post-submission coaching compares the saved learner package with the generated evidence categories.',
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
