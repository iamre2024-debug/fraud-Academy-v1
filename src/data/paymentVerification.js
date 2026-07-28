export const PAYMENT_NAME_RESULTS = Object.freeze([
  'Match',
  'Partial Match',
  'No Match',
  'Unable to Verify',
  'Destination Not Found',
]);

const holderCorrections = new Map([
  ['FA-ATO-24018:Maya Thompson', 'Maya Sterling'],
  ['FA-CR-24003:Riley Carter', 'Avery Brooks'],
  ['FA-CR-24003:R. Carter', 'A. Brooks'],
  ['FA-CR-24003:Riley Carter / R. Carter comparison', 'A. Brooks'],
]);

function text(value, fallback = 'Not supplied') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function normalizedName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameTokens(value) {
  return normalizedName(value).split(' ').filter(Boolean);
}

function canonicalStoredResult(value) {
  const normalized = String(value ?? '').toLowerCase();
  if (/(no info|unable|not returned|unknown|recorded)/.test(normalized)) return 'Unable to Verify';
  if (/(partial)/.test(normalized)) return 'Partial Match';
  if (/(no match|mismatch)/.test(normalized)) return 'No Match';
  if (/(name match|exact match|\bmatch\b)/.test(normalized)) return 'Match';
  return 'Unable to Verify';
}

export function comparePaymentOwner(inputName, recordedName) {
  const input = nameTokens(inputName);
  const recorded = nameTokens(recordedName);
  if (!input.length || !recorded.length) return 'Unable to Verify';
  if (input.join(' ') === recorded.join(' ')) return 'Match';

  const lastInput = input.at(-1);
  const lastRecorded = recorded.at(-1);
  const firstInput = input[0];
  const firstRecorded = recorded[0];
  const sameLast = lastInput === lastRecorded;
  const compatibleFirst = firstInput === firstRecorded
    || firstInput.startsWith(firstRecorded)
    || firstRecorded.startsWith(firstInput)
    || firstInput[0] === firstRecorded[0];

  if ((sameLast && compatibleFirst) || input.some((token) => recorded.includes(token))) {
    return 'Partial Match';
  }
  return 'No Match';
}

function operationalStatus(value) {
  const normalized = String(value ?? '').toLowerCase();
  if (/closed/.test(normalized)) return 'Closed';
  if (/frozen|restricted|blocked/.test(normalized)) return 'Restricted';
  if (/pending/.test(normalized)) return 'Pending';
  if (/open|active/.test(normalized)) return 'Open';
  return 'Status unavailable';
}

function laneVariant(activeCase = {}, record = {}) {
  const context = `${activeCase.claimType} ${activeCase.type} ${activeCase.lane} ${record.type} ${record.accountType}`.toLowerCase();
  if (/payroll|employee|direct deposit/.test(context)) return 'Payroll';
  if (/business|vendor|commercial|credit risk/.test(context)) return 'Business';
  return 'Personal';
}

function neutralOutcome(value) {
  const outcome = text(value, 'Verification evidence recorded');
  if (/^(hold|pause|release|approve|deny|remove|close)\b/i.test(outcome)) {
    return 'Additional evidence review is required before an operational decision';
  }
  return outcome;
}

function neutralAction(value) {
  const action = text(value, 'Document the verification source');
  if (/^(hold|pause|release|approve|deny|remove|close)\b/i.test(action)) {
    return 'Document the available account control for senior review';
  }
  return action;
}

function correctedHolder(activeCase, record) {
  return holderCorrections.get(`${activeCase.id}:${record.accountHolder}`)
    ?? text(record.accountHolder, activeCase.person);
}

function exactDestinationLabel(bankCode, destinationId) {
  return `Bank Code ${bankCode} · Destination ID ${destinationId}`;
}

function normalizedNewDestination(value, bankCode, destinationId) {
  const supplied = String(value ?? '').trim();
  return supplied || exactDestinationLabel(bankCode, destinationId);
}

export function normalizePaymentRecord(record = {}, activeCase = {}) {
  const accountHolder = correctedHolder(activeCase, record);
  const storedNameResult = canonicalStoredResult(record.nameMatchResult ?? record.ownerMatch);
  const lane = laneVariant(activeCase, record);
  const attempts = (record.verificationAttempts ?? record.verificationLog ?? []).map((entry, index) => ({
    id: entry.id ?? `${record.id ?? 'PV'}-ATTEMPT-${index + 1}`,
    time: text(entry.time, activeCase.reportedDate ?? 'Training date'),
    method: text(entry.method, 'Recorded lookup'),
    result: text(entry.result, 'Recorded'),
    note: text(entry.note, 'No additional attempt detail supplied'),
  }));
  const callback = attempts.find((entry) => /callback|phone|contact/i.test(`${entry.method} ${entry.result} ${entry.note}`));
  const firstSeen = text(record.firstSeen, record.lastSeen ?? activeCase.opened);
  const priorUseHistory = text(record.priorUse, 'Prior-use history unavailable');
  const standingStatus = text(record.standing, 'Standing unavailable');
  const bankCode = text(record.bankCode);
  const destinationId = text(record.destinationId);
  const oldDestination = text(record.oldDestination, 'No prior account / destination supplied');
  const newDestination = normalizedNewDestination(record.newDestination, bankCode, destinationId);
  const changeComparison = text(
    record.changeComparison,
    `${oldDestination} changed to ${newDestination}.`,
  );
  const returnHistory = /no nsf|no return/i.test(standingStatus)
    ? 'No NSF or returned-payment record found'
    : /nsf|return/i.test(`${standingStatus} ${record.notes ?? ''}`)
      ? text(standingStatus)
      : 'No separate NSF or returned-payment history supplied';

  return {
    ...record,
    id: text(record.id, `${activeCase.id ?? 'CASE'}-PV-1`),
    bankCode,
    destinationId,
    oldDestination,
    newDestination,
    changeComparison,
    accountHolder,
    ownerMatch: storedNameResult,
    nameMatchResult: storedNameResult,
    ownershipStatus: text(record.ownershipStatus, {
      Match: 'Recorded source identifies the named owner',
      'Partial Match': 'Recorded source returns a partial owner-name relationship',
      'No Match': 'Recorded source returns a different owner name',
      'Unable to Verify': 'The available source does not confirm ownership',
    }[storedNameResult]),
    operationalStatus: operationalStatus(record.operationalStatus ?? record.accountStatus),
    standingStatus,
    paymentType: text(record.paymentType, record.accountType ?? record.type),
    paymentStatus: text(record.paymentStatus, record.status),
    laneVariant: lane,
    priorUseHistory,
    ownershipHistory: text(
      record.ownershipHistory,
      `${accountHolder} is the recorded holder in the supplied source; first seen ${firstSeen}.`,
    ),
    returnHistory,
    verificationAttempts: attempts,
    callbackStatus: text(record.callbackStatus, callback
      ? `${callback.result}: ${callback.note}`
      : 'No callback requirement is recorded in this packet'),
    trustedContactSource: text(
      record.trustedContactSource,
      lane === 'Payroll' ? 'Employee Profile and employer contact record'
        : lane === 'Business' ? 'Business 360 contact and source record'
          : 'Customer 360 contact record',
    ),
    customerLink: text(record.customerLink, `${activeCase.id ?? 'Case'} · ${activeCase.person ?? accountHolder}`),
    reviewContext: text(record.reviewContext, changeComparison || record.context),
    evidenceSummary: text(
      record.evidenceSummary,
      `${storedNameResult}; ${operationalStatus(record.accountStatus)} operational status; ${priorUseHistory}.`,
    ),
    verificationOutcome: neutralOutcome(record.verificationOutcome),
    actions: (record.actions ?? []).map(neutralAction),
    firstSeen,
  };
}

export function normalizePaymentRecords(records = [], activeCase = {}) {
  return records.map((record) => normalizePaymentRecord(record, activeCase));
}

export function isPaymentProfileEvent(event = {}) {
  return /\b(?:bank|destination|beneficiary|payee|direct deposit|external (?:payment )?account|payment (?:profile|method|account))\b/i.test(
    `${event.eventType ?? ''} ${event.item ?? ''}`,
  );
}

export function findPaymentRecordForProfileEvent(event = {}, records = []) {
  if (!isPaymentProfileEvent(event) || !records.length) return null;
  if (event.paymentRecordId) {
    const linked = records.find((record) => record.id === event.paymentRecordId);
    if (linked) return linked;
  }

  const eventText = [
    event.oldValue,
    event.newValue,
    event.detail,
    event.notes,
  ].filter(Boolean).join(' ').toLowerCase();
  const exact = records.find((record) => [record.bankCode, record.destinationId]
    .filter(Boolean)
    .some((value) => eventText.includes(String(value).toLowerCase())));
  if (exact) return exact;

  const compared = records.find((record) => [record.oldDestination, record.newDestination]
    .filter(Boolean)
    .some((value) => eventText.includes(String(value).toLowerCase())));
  if (compared) return compared;
  return records.length === 1 ? records[0] : null;
}

export function paymentChangeMetadata(event = {}, records = []) {
  if (!isPaymentProfileEvent(event)) return [];
  const record = findPaymentRecordForProfileEvent(event, records);
  const bankCode = text(record?.bankCode ?? event.bankCode);
  const destinationId = text(record?.destinationId ?? event.destinationId);
  const previousDestination = text(
    record?.oldDestination ?? event.oldDestination ?? event.oldValue,
    'No prior account / destination supplied',
  );
  const newDestination = record
    ? normalizedNewDestination(record.newDestination, bankCode, destinationId)
    : text(event.newDestination ?? event.newValue);
  const changeComparison = text(
    record?.changeComparison ?? event.changeComparison ?? event.detail,
    `${previousDestination} changed to ${newDestination}.`,
  );
  return [
    ['Bank Code', bankCode],
    ['Destination ID', destinationId],
    ['Previous account / destination', previousDestination],
    ['New account / destination', newDestination],
    ['Change comparison', changeComparison],
  ];
}

export function findPaymentDestination(records = [], bankCode, destinationId) {
  const bank = String(bankCode ?? '').trim().toLowerCase();
  const destination = String(destinationId ?? '').trim().toLowerCase();
  if (!bank || !destination) return null;
  return records.find((record) => (
    String(record.bankCode).trim().toLowerCase() === bank
    && String(record.destinationId).trim().toLowerCase() === destination
  )) ?? null;
}

export function resolvePaymentLookup(records, lookup) {
  const record = findPaymentDestination(records, lookup.bankCode, lookup.destinationId);
  if (!record) {
    return { state: 'not-found', record: null, nameMatchResult: 'Destination Not Found' };
  }
  return {
    state: 'found',
    record,
    nameMatchResult: comparePaymentOwner(lookup.ownerName, record.accountHolder),
  };
}

export function buildPaymentLookupHint({ bankCode = '', destinationId = '', ownerName = '' } = {}) {
  return `PVLOOKUP|${[bankCode, destinationId, ownerName].map((value) => encodeURIComponent(String(value))).join('|')}`;
}

export function parsePaymentLookupHint(value = '') {
  if (!String(value).startsWith('PVLOOKUP|')) return null;
  const [bankCode = '', destinationId = '', ownerName = ''] = String(value)
    .slice('PVLOOKUP|'.length)
    .split('|')
    .map((item) => decodeURIComponent(item));
  return { bankCode, destinationId, ownerName };
}
