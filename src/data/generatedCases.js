import { localCaseStorage } from './caseStorage.js';

const typeTemplates = [
  {
    type: 'Account Takeover',
    prefix: 'ATO',
    allegation: 'Customer reports account access or card activity they do not recognize. Access, device, IP, transaction, and evidence records need review.',
    amount: '$486.22',
    transactionInfo: 'Digital marketplace purchase · card not present · debit card ending 2209',
  },
  {
    type: 'Chargeback Claim',
    prefix: 'CB',
    allegation: 'Customer states a merchant billing issue needs review. Merchant history, transaction pattern, and document status need comparison.',
    amount: '$214.89',
    transactionInfo: 'Subscription merchant billing · recurring card payment · credit card ending 7712',
  },
  {
    type: 'First Party Fraud',
    prefix: 'FPF',
    allegation: 'System queue opened a claim review where customer statement, transaction behavior, and prior activity need neutral comparison.',
    amount: '$638.40',
    transactionInfo: 'Retail purchase dispute · card present / wallet token comparison available',
  },
  {
    type: 'Email Fraud',
    prefix: 'EMAIL',
    allegation: 'Customer reports a payment or profile activity after email-related contact. Email, device, payment, and destination records need review.',
    amount: '$920.00',
    transactionInfo: 'External payment request · Destination ID token · email contact history',
  },
  {
    type: 'Credit Risk Review',
    prefix: 'CR',
    allegation: 'System alert opened a credit review after new or changed account activity. Identity, payment, and usage records need review.',
    amount: '$1,850.00',
    transactionInfo: 'Credit line usage request · payment setup packet · Bank Code token',
  },
];

const generatedNames = ['Riley Monroe', 'Sienna Vale', 'Drew Harper', 'Kai Bennett', 'Morgan Reese', 'Nova Lane'];
const generatedCities = ['Dallas, TX', 'Fort Worth, TX', 'Arlington, TX', 'Irving, TX', 'DeSoto, TX', 'Cedar Hill, TX'];

export function readGeneratedCases(storage = localCaseStorage) {
  return storage.readAll();
}

export function writeGeneratedCases(cases = [], storage = localCaseStorage) {
  return storage.writeAll(cases);
}

export function createGeneratedCase(index = Date.now()) {
  const template = typeTemplates[index % typeTemplates.length];
  const person = generatedNames[index % generatedNames.length];
  const city = generatedCities[index % generatedCities.length];
  const id = `FA-${template.prefix}-G${String(index).slice(-5)}`;
  const trainingId = `TRN-GEN-${String(index).slice(-4)}`;
  const deviceId = `DEV-GEN-${template.prefix}-${String(index).slice(-4)}`;

  return {
    id,
    type: template.type,
    priority: index % 2 ? 'Medium' : 'High',
    status: 'Generated',
    person,
    trainingId,
    amount: template.amount,
    opened: 'Generated training case',
    claimId: `CLM-${template.prefix}-G${String(index).slice(-5)}`,
    transactionInfo: template.transactionInfo,
    shortSummary: template.allegation,
    allegation: template.allegation,
    queueReason: 'Generated case for Evidence First investigation practice.',
    briefingQuestions: ['Why is this case in queue?', 'Which records should be opened first?', 'What evidence should be documented before Submit Decision?'],
    intake: { channel: 'Generated scenario', contactTime: 'Training mode', customerLocation: city, statedDevice: 'Generated device profile' },
    customer: {
      relationshipSince: index % 2 ? '2023' : '2026',
      segment: template.type === 'Credit Risk Review' ? 'Generated credit profile' : 'Generated consumer profile',
      contact: { phone: '(555) 010-0000', email: `${person.toLowerCase().replace(/\s+/g, '.')}@training.example.test`, address: `${city} training address`, preferredChannel: 'Training workspace' },
      relationship: [
        { label: 'Generated relationship', value: index % 2 ? 'Established profile with repeat digital history' : 'Newer profile with limited history' },
        { label: 'Normal login area', value: city },
        { label: 'Payment profile', value: 'Training-safe payment objects only' },
      ],
      profileChanges: [
        { id: `${id}-PCH-1`, date: 'Generated case day', item: 'Profile snapshot generated', detail: 'Generated customer profile created for practice review.', source: 'Scenario Engine' },
        { id: `${id}-PCH-2`, date: 'Generated case day', item: 'Evidence package initialized', detail: 'Generated event, login, payment, and document records are ready for neutral review.', source: 'Scenario Engine' },
      ],
    },
    identityRecords: [
      { id: `${id}-IDR-1`, type: 'Training ID', value: trainingId, lastSeen: 'Generated case day', history: 'Generated Training ID tied to the active case workspace.' },
      { id: `${id}-IDR-2`, type: 'Device object', value: deviceId, lastSeen: 'Generated case day', history: 'Generated device object available for repeated-device comparison.' },
    ],
    loginHistory: [
      { id: `${id}-LOG-1`, time: 'Generated case day · 8:42 AM', method: 'Password', device: 'Generated mobile browser', deviceId, location: city, ip: '198.51.100.210', session: `${id}-SES-1`, result: 'Successful' },
      { id: `${id}-LOG-2`, time: 'Generated case day · 9:03 AM', method: 'Biometric', device: 'Generated mobile browser', deviceId, location: city, ip: '198.51.100.210', session: `${id}-SES-2`, result: 'Successful' },
    ],
    facts: ['Generated training case', 'No final outcome shown', 'Evidence First lock active'],
    progress: ['Case Summary'],
    events: [
      { id: `${id}-EVT-1`, time: 'Generated case day · 9:10 AM', label: 'Generated case event', detail: 'System created neutral scenario records for investigation practice.', chip: 'Generated', object: 'Scenario' },
    ],
    documents: [
      { id: `${id}-DOC-1`, status: 'Available', name: 'Generated case packet', detail: 'Scenario-generated packet for training review.' },
    ],
    links: ['Customer', 'Device', 'IP', 'Payment', 'Document'],
  };
}

export function addGeneratedCase(storage = localCaseStorage) {
  const current = readGeneratedCases(storage);
  const existingIds = new Set(current.map((item) => item.id));
  let seed = Date.now() + current.length;
  let nextCase = createGeneratedCase(seed);

  while (existingIds.has(nextCase.id)) {
    seed += 1;
    nextCase = createGeneratedCase(seed);
  }

  storage.upsert(nextCase);
  return nextCase;
}

export function appendGeneratedCases(baseCases = [], storage = localCaseStorage) {
  const generated = readGeneratedCases(storage);
  const existingIds = new Set(baseCases.map((item) => item.id));
  return [...baseCases, ...generated.filter((item) => !existingIds.has(item.id))];
}
