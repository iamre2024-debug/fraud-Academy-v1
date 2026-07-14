const generatedCaseStorageKey = 'fraud-academy-generated-cases-v1';
const generatedCaseSequenceKey = 'fraud-academy-generated-case-sequence-v1';

const typeTemplates = [
  {
    type: 'Account Takeover',
    prefix: 'ATO',
    allegation: 'Customer reports account access or card activity they do not recognize. Access, device, IP, transaction, and evidence records need review.',
    amount: '$486.22',
    transactionInfo: 'Digital marketplace purchase · card not present · debit card ending 2209',
    product: 'Checking · Debit card · Savings',
  },
  {
    type: 'Chargeback Claim',
    prefix: 'CB',
    allegation: 'Customer states a merchant billing issue needs review. Merchant history, transaction pattern, and document status need comparison.',
    amount: '$214.89',
    transactionInfo: 'Subscription merchant billing · recurring card payment · credit card ending 7712',
    product: 'Credit card',
  },
  {
    type: 'First Party Fraud',
    prefix: 'FPF',
    allegation: 'System queue opened a claim review where customer statement, transaction behavior, and prior activity need neutral comparison.',
    amount: '$638.40',
    transactionInfo: 'Retail purchase dispute · card present and wallet-token comparison available',
    product: 'Checking · Debit card',
  },
  {
    type: 'Email Fraud',
    prefix: 'EMAIL',
    allegation: 'Customer reports a payment or profile activity after email-related contact. Email, device, payment, and destination records need review.',
    amount: '$920.00',
    transactionInfo: 'External payment request · Destination ID token · email contact history',
    product: 'Checking · External payment profile',
  },
  {
    type: 'Credit Risk Review',
    prefix: 'CR',
    allegation: 'System alert opened a credit review after new or changed account activity. Identity, payment, and usage records need review.',
    amount: '$1,850.00',
    transactionInfo: 'Credit line usage request · payment setup packet · Bank Code token',
    product: 'Credit line',
  },
];

const generatedNames = ['Riley Monroe', 'Sienna Vale', 'Drew Harper', 'Kai Bennett', 'Morgan Reese', 'Nova Lane'];
const generatedCities = ['Dallas, TX', 'Fort Worth, TX', 'Arlington, TX', 'Irving, TX', 'DeSoto, TX', 'Cedar Hill, TX'];
const generatedBusinesses = ['Juniper Commerce LLC', 'Harborline Services LLC', 'Cobalt Supply Group', 'Orchid Media Works', 'Summit Payroll Systems', 'Moonstone Retail LLC'];
const generatedIndustries = ['Online retail', 'Business services', 'Office supply distribution', 'Digital media', 'Payroll technology', 'Consumer goods'];

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

export function createGeneratedCase(index = Date.now()) {
  const template = typeTemplates[index % typeTemplates.length];
  const person = generatedNames[index % generatedNames.length];
  const city = generatedCities[index % generatedCities.length];
  const businessName = generatedBusinesses[index % generatedBusinesses.length];
  const industry = generatedIndustries[index % generatedIndustries.length];
  const idSuffix = String(index).slice(-8);
  const shortSuffix = String(index).slice(-6);
  const contactSuffix = String(index).slice(-4).padStart(4, '0');
  const id = `FA-${template.prefix}-G${idSuffix}`;
  const trainingId = `TRN-GEN-${shortSuffix}`;
  const deviceId = `DEV-GEN-${template.prefix}-${shortSuffix}`;
  const email = `${person.toLowerCase().replace(/\s+/g, '.')}@training.example.test`;
  const phone = `(555) 01${String(index % 10)}-${contactSuffix}`;
  const businessId = `TBI-${template.prefix}-${shortSuffix}`;
  const bankCode = `BC-${String(index).slice(-3)}`;
  const destinationId = `DST-${idSuffix}`;

  return {
    id,
    type: template.type,
    priority: index % 2 ? 'Medium' : 'High',
    status: 'Generated',
    person,
    trainingId,
    amount: template.amount,
    opened: 'Generated training case',
    claimId: `CLM-${template.prefix}-G${idSuffix}`,
    transactionInfo: template.transactionInfo,
    shortSummary: template.allegation,
    allegation: template.allegation,
    queueReason: 'Generated case for Evidence First investigation practice.',
    briefingQuestions: ['Why is this case in queue?', 'Which records should be opened first?', 'What evidence should be documented before Submit Decision?'],
    intake: { channel: 'Generated scenario', contactTime: 'Training mode · 9:24 AM', customerLocation: city, statedDevice: 'Generated mobile device' },
    customer: {
      relationshipSince: index % 2 ? '2023' : '2026',
      segment: template.type === 'Credit Risk Review' ? 'Generated credit profile' : 'Generated consumer profile',
      contact: { phone, email, address: `${city} training address ${contactSuffix}`, preferredChannel: 'Secure message' },
      relationship: [
        { label: 'Open products', value: template.product },
        { label: 'Last statement', value: 'Generated review period statement' },
        { label: 'Normal login area', value: city },
        { label: 'Payment profile', value: `Bank Code ${bankCode} · Destination ID ${destinationId}` },
        { label: 'Known device pattern', value: 'Generated mobile device with repeat session history' },
      ],
      profileChanges: [
        { id: `${id}-PCH-1`, date: 'Generated case day · 8:58 AM', item: 'Profile contact viewed', detail: `Profile phone ${phone} and email ${email} were opened during a generated session.`, source: 'Session event' },
        { id: `${id}-PCH-2`, date: 'Generated case day · 9:06 AM', item: 'Payment profile viewed', detail: `Bank Code ${bankCode} and Destination ID ${destinationId} were visible in the generated payment setup record.`, source: 'Payment Verification' },
        { id: `${id}-PCH-3`, date: 'Generated case day · 9:24 AM', item: 'Case intake recorded', detail: 'The customer statement or system alert was attached to the generated case.', source: 'Scenario Engine' },
      ],
    },
    identityRecords: [
      { id: `${id}-IDR-1`, type: 'Training ID', value: trainingId, lastSeen: 'Generated case day', history: 'Generated Training ID tied to the active case workspace.' },
      { id: `${id}-IDR-2`, type: 'Phone', value: phone, lastSeen: 'Generated case day', history: 'Primary generated customer contact.' },
      { id: `${id}-IDR-3`, type: 'Email', value: email, lastSeen: 'Generated case day', history: 'Primary generated customer-profile email.' },
      { id: `${id}-IDR-4`, type: 'Address', value: `${city} training address ${contactSuffix}`, lastSeen: 'Generated case day', history: 'Current generated residential and mailing address.' },
      { id: `${id}-IDR-5`, type: 'Device object', value: deviceId, lastSeen: 'Generated case day', history: 'Generated device object available for repeated-device comparison.' },
    ],
    loginHistory: [
      { id: `${id}-LOG-1`, time: 'Generated case day · 8:42 AM', method: 'Password', device: 'Generated mobile browser', deviceId, location: city, ip: '198.51.100.210', session: `${id}-SES-1`, result: 'Successful' },
      { id: `${id}-LOG-2`, time: 'Generated case day · 9:03 AM', method: 'Biometric', device: 'Generated mobile browser', deviceId, location: city, ip: '198.51.100.211', session: `${id}-SES-2`, result: 'Successful' },
      { id: `${id}-LOG-3`, time: 'Generated prior activity · 4:18 PM', method: 'Password', device: 'Generated desktop browser', deviceId: `${deviceId}-DESK`, location: city, ip: '203.0.113.90', session: `${id}-SES-3`, result: 'Successful' },
    ],
    businessProfile: {
      name: businessName,
      businessId,
      industry,
      address: `${city} training business address ${contactSuffix}`,
      phone: `(555) 020-${contactSuffix}`,
      email: `operations.${shortSuffix}@business.training.test`,
      contactName: `Case Contact ${contactSuffix}`,
      relationship: template.type === 'Credit Risk Review' ? 'Listed employer and payment relationship' : 'Merchant or payment relationship',
      bankCode,
      destinationId,
    },
    facts: ['Generated training case', 'No final outcome shown', 'Evidence First lock active', 'Complete fictional source packet available'],
    progress: ['Case Summary'],
    events: [
      { id: `${id}-EVT-1`, time: 'Generated case day · 8:42 AM', label: 'Successful login recorded', detail: `${deviceId} · ${city} · 198.51.100.210`, chip: 'Login', object: 'Session' },
      { id: `${id}-EVT-2`, time: 'Generated case day · 9:06 AM', label: 'Payment object viewed', detail: `${bankCode} · ${destinationId} · ${businessName}`, chip: 'Payment', object: 'Payment' },
      { id: `${id}-EVT-3`, time: 'Generated case day · 9:18 AM', label: 'Transaction or usage record added', detail: `${template.transactionInfo} · ${template.amount}`, chip: 'Transaction', object: 'Transaction' },
      { id: `${id}-EVT-4`, time: 'Generated case day · 9:24 AM', label: 'Case intake recorded', detail: 'Neutral generated allegation or system-alert packet added for review.', chip: 'Intake', object: 'Document' },
    ],
    documents: [
      { id: `${id}-DOC-1`, status: 'Received', name: 'Generated customer or alert statement', category: 'Intake document', updated: 'Generated case day', detail: 'Allegation or system-alert wording, contact channel, stated location, and case reference.', preview: 'Open document to review the full generated intake fields.' },
      { id: `${id}-DOC-2`, status: 'Available', name: 'Generated access history packet', category: 'System record', updated: 'Generated case day', detail: 'Login IDs, device IDs, session IDs, IP addresses, locations, methods, and results.', preview: 'Open document to review access and session fields.' },
      { id: `${id}-DOC-3`, status: 'Available', name: 'Generated payment and business packet', category: 'Verification record', updated: 'Generated case day', detail: `${businessName} · ${businessId} · ${bankCode} · ${destinationId}.`, preview: 'Open document to review payment and business-verification fields.' },
    ],
    links: ['Customer', 'Training ID', 'Device', 'Session', 'IP', 'Payment', 'Business', 'Document'],
  };
}

export function addGeneratedCase() {
  const current = readGeneratedCases();
  let seed = nextGeneratedCaseIndex();
  let nextCase = createGeneratedCase(seed);
  const existingIds = new Set(current.map((item) => item.id));

  while (existingIds.has(nextCase.id)) {
    seed += 1;
    nextCase = createGeneratedCase(seed);
  }

  writeGeneratedCases([nextCase, ...current]);
  return nextCase;
}

export function appendGeneratedCases(baseCases = []) {
  const generated = readGeneratedCases();
  const existingIds = new Set(baseCases.map((item) => item.id));
  return [...baseCases, ...generated.filter((item) => !existingIds.has(item.id))];
}
