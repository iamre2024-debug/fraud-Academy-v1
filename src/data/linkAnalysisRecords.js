import { getBusinessRecords, getFinancialRecords } from './caseToolData.js';

export const linkIdentifierTypes = [
  { key: 'phone', label: 'Phone Number', icon: '☎' },
  { key: 'email', label: 'Email Address', icon: '✉' },
  { key: 'device', label: 'Device ID', icon: '▣' },
  { key: 'ip', label: 'IP Address', icon: '◎' },
  { key: 'training-id', label: 'Training ID', icon: '▤' },
  { key: 'bank-code', label: 'Bank Code', icon: '⌂' },
  { key: 'destination-id', label: 'Destination ID', icon: '▱' },
  { key: 'business-address', label: 'Business Address', icon: '▥' },
];

export const linkAccountFilters = [
  { key: 'all', label: 'All Linked Accounts' },
  { key: 'good-standing', label: 'Good Standing' },
  { key: 'on-hold', label: 'On Hold' },
  { key: 'closed', label: 'Closed' },
  { key: 'fraud-history', label: 'Fraud History' },
  { key: 'restricted', label: 'NSF / Credit Restriction' },
  { key: 'recent', label: 'Recent (Last 90 Days)' },
];

const trainingNames = [
  'Maya R.',
  'James D.',
  'Travis C.',
  'Sara L.',
  'Robert B.',
  'Amanda W.',
  'Marcus K.',
  'Danielle H.',
  'Nina P.',
  'Caleb T.',
  'Monique S.',
  'Darius F.',
  'Kayla V.',
  'Erin J.',
  'Omar N.',
  'Priya A.',
  'Noah G.',
  'Leah M.',
  'Andre W.',
  'Tessa B.',
  'Cedar Lane Studio',
  'Northwind Training LLC',
  'Blue Finch Services',
  'Summit Practice Group',
];

const accountTypes = [
  ['Checking', 'Personal'],
  ['Savings', 'Personal'],
  ['Credit Card', 'Personal'],
  ['Personal Loan', 'Personal'],
  ['Business Checking', 'Business'],
  ['Credit Line', 'Business'],
];

const holdReasons = [
  'Returned payment review',
  'Contact verification pending',
  'Payment source review',
  'Training restriction review',
];

const restrictionReasons = [
  'Returned payment (NSF)',
  '90-day payment restriction',
  'Credit-line payment review',
  'Repeated returned-transfer review',
];

const closureReasons = [
  'Customer-requested closure',
  'Relationship review completed',
  'Confirmed prior fraud case',
  'Account misuse review completed',
];

function text(value) {
  return String(value ?? '').trim();
}

export function normalizeLinkIdentifier(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function unique(values = []) {
  return [...new Set(values.map(text).filter(Boolean))];
}

function hashText(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick(values, seed, offset = 0) {
  return values[(seed + offset) % values.length];
}

function padded(value, length = 5) {
  return String(Math.abs(Number(value)) || 0).slice(-length).padStart(length, '0');
}

function displayDate(seed, monthOffset = 0) {
  const date = new Date(Date.UTC(2026, 6, 15));
  date.setUTCMonth(date.getUTCMonth() - monthOffset);
  date.setUTCDate(Math.max(1, 3 + (seed % 24)));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function accountTypeForCase(activeCase) {
  const description = `${activeCase.type} ${activeCase.lane} ${activeCase.customer?.segment}`.toLowerCase();
  if (/chargeback|card/.test(description)) return ['Credit Card', 'Personal'];
  if (/business|vendor|kyb/.test(description)) return ['Business Checking', 'Business'];
  if (/credit|loan/.test(description)) return ['Credit Line', 'Personal'];
  if (/payroll/.test(description)) return ['Checking', 'Personal'];
  return ['Checking', 'Personal'];
}

function initials(value) {
  return text(value)
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z]/gi, '')[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'FA';
}

function accountStatus(index, total) {
  if (index === 0) return 'good-standing';
  if (total >= 8 && index >= total - 2) return 'closed';
  if (total >= 6 && index === total - 3) return 'restricted';
  if (total >= 5 && index >= total - 5) return 'on-hold';
  if (index === total - 1) return 'closed';
  if (index === total - 2) return 'on-hold';
  return 'good-standing';
}

function statusLabel(status) {
  return {
    'good-standing': 'Good Standing',
    'on-hold': 'On Hold',
    restricted: 'NSF / Restricted',
    closed: 'Closed',
  }[status] ?? 'Recorded';
}

function totalForIdentifier(type, seed) {
  const base = {
    phone: 20,
    email: 12,
    device: 8,
    ip: 7,
    'training-id': 3,
    'bank-code': 6,
    'destination-id': 5,
    'business-address': 9,
  }[type] ?? 6;
  if (type === 'phone') return base;
  return Math.max(3, base + ((seed % 3) - 1));
}

function identifierRelationship(type, index) {
  const current = index === 0;
  const labels = {
    phone: current ? 'Primary Phone' : index % 3 ? 'Added Phone' : 'Historical Phone',
    email: current ? 'Primary Email' : index % 3 ? 'Added Email' : 'Historical Email',
    device: current ? 'Known Device' : index % 3 ? 'Observed Device' : 'Historical Device',
    ip: current ? 'Current Network' : index % 3 ? 'Observed Network' : 'Historical Network',
    'training-id': current ? 'Primary Training ID' : 'Historical Identity Link',
    'bank-code': current ? 'Current Bank Code' : 'Observed Bank Code',
    'destination-id': current ? 'Current Destination' : 'Prior Destination',
    'business-address': current ? 'Primary Address' : index % 2 ? 'Shared Business Address' : 'Historical Address',
  };
  return labels[type] ?? 'Recorded Relationship';
}

function useCountFor(type, index, seed) {
  const unit = ['device', 'ip'].includes(type) ? 'sessions' : ['bank-code', 'destination-id'].includes(type) ? 'payments' : 'uses';
  const count = 1 + ((seed + (index * 7)) % 18);
  return `${count} recorded ${unit}`;
}

function contextFor(status, type, index) {
  if (status === 'good-standing') {
    const routine = [
      'Established identifier use with no recorded restriction on this account.',
      'The relationship is recorded over multiple review periods.',
      type === 'business-address'
        ? 'The address is recorded as a shared business location.'
        : 'The identifier is recorded as an established contact or access object.',
    ];
    return routine[index % routine.length];
  }
  if (status === 'on-hold') return 'The account has an active hold. Open the record to verify the hold reason and timing.';
  if (status === 'restricted') return 'A payment or credit restriction is recorded. Compare it with the identifier-use dates.';
  return 'The account is closed. Review the closure reason and historical case record before drawing a conclusion.';
}

function buildLinkedCase(activeCase, account, index, seed) {
  if (index === 0) {
    return {
      id: activeCase.id,
      type: activeCase.type,
      status: activeCase.status,
      opened: activeCase.opened ?? activeCase.reportedDate ?? 'Training date',
      summary: activeCase.queueReason ?? activeCase.caseBriefing?.summary ?? 'Current training case.',
      relationship: 'Current case',
      availableInCatalog: true,
    };
  }
  return {
    id: `LKC-${padded(seed, 4)}-${String(index).padStart(2, '0')}`,
    type: account.status === 'closed' ? 'Historical relationship review' : 'Linked identifier review',
    status: account.statusLabel,
    opened: displayDate(seed + index, 7 + (index % 20)),
    summary: `This fictional training case records the same exact identifier on ${account.accountId}. It does not establish the outcome of the current case.`,
    relationship: account.relationship,
    availableInCatalog: false,
  };
}

function buildAccount({
  activeCase,
  type,
  value,
  sourceRecordId,
  index,
  total,
  seed,
}) {
  const status = accountStatus(index, total);
  const [caseAccountType, caseAccountGroup] = accountTypeForCase(activeCase);
  const [generatedType, generatedGroup] = pick(accountTypes, seed, index);
  const accountType = index === 0 ? caseAccountType : generatedType;
  const accountGroup = index === 0 ? caseAccountGroup : generatedGroup;
  const customer = index === 0 ? activeCase.person : pick(trainingNames, seed, index * 3);
  const accountId = index === 0
    ? activeCase.accountId
    : `ACCT-${padded(seed + (index * 7919), 5)}`;
  const firstMonthOffset = index === 0 ? 14 + (seed % 40) : 3 + ((seed + (index * 5)) % 40);
  const lastMonthOffset = index === 0 ? 0 : index % 14;
  const holdReason = status === 'on-hold' ? pick(holdReasons, seed, index) : '';
  const restrictionReason = status === 'restricted' ? pick(restrictionReasons, seed, index) : '';
  const closureReason = status === 'closed' ? pick(closureReasons, seed, index) : '';
  const fraudHistory = status === 'closed' && /fraud|misuse/i.test(closureReason);
  const opened = displayDate(seed + index, firstMonthOffset + 20);
  const firstSeen = displayDate(seed + index, firstMonthOffset);
  const lastSeen = displayDate(seed + index + 9, lastMonthOffset);
  const relationship = identifierRelationship(type, index);
  const balance = ((seed % 280000) + 19000 + (index * 8371)) / 100;
  const account = {
    id: `LNK-ACC-${padded(seed, 4)}-${String(index + 1).padStart(2, '0')}`,
    accountId,
    customer,
    initials: initials(customer),
    accountType,
    accountGroup,
    status,
    statusLabel: statusLabel(status),
    statusDetail: holdReason || restrictionReason || closureReason || 'Open with no recorded restriction',
    holdReason,
    restrictionReason,
    closureReason,
    fraudHistory,
    relationship,
    relationshipState: index % 4 === 0 && index !== 0 ? 'Historical' : 'Current',
    firstSeen,
    lastSeen,
    opened,
    useCount: useCountFor(type, index, seed),
    identifierType: type,
    identifierValue: value,
    sourceRecordId,
    context: contextFor(status, type, index),
    balance: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balance),
    nextReview: status === 'good-standing' || status === 'closed' ? 'None scheduled' : displayDate(seed + index + 2, 0),
    recent: lastMonthOffset <= 3,
    priorFraudCases: fraudHistory ? 1 + ((seed + index) % 2) : 0,
    returnedPaymentHistory: status === 'restricted' || /returned payment|nsf/i.test(holdReason)
      ? `${1 + ((seed + index) % 3)} returned payment${(seed + index) % 3 ? 's' : ''}`
      : 'None recorded',
    activityVelocity: `${1 + ((seed + index) % 4)} sign-in${(seed + index) % 4 ? 's' : ''} in the last 30 days`,
    watchlistStatus: 'None recorded',
    isCurrentAccount: index === 0,
  };
  return {
    ...account,
    linkedCase: buildLinkedCase(activeCase, account, index, seed),
  };
}

function identifierValues(activeCase) {
  const financial = getFinancialRecords(activeCase);
  const business = getBusinessRecords(activeCase);
  const loginHistory = activeCase.loginHistory ?? [];
  const paymentRecords = financial.paymentVerification ?? [];
  const contact = activeCase.customer?.contact ?? {};
  const businessAddresses = [
    contact.address,
    ...(business.businessIntel ?? [])
      .filter((record) => /address/i.test(`${record.type} ${record.value}`))
      .map((record) => record.value),
  ];

  return {
    phone: unique([
      contact.phone,
      ...(activeCase.identityRecords ?? [])
        .filter((record) => /phone/i.test(record.type))
        .map((record) => record.value),
    ]),
    email: unique([
      contact.email,
      ...(activeCase.identityRecords ?? [])
        .filter((record) => /email/i.test(record.type))
        .map((record) => record.value),
    ]),
    device: unique(loginHistory.map((record) => record.deviceId ?? record.device)),
    ip: unique(loginHistory.map((record) => record.ip)),
    'training-id': unique([activeCase.trainingId]),
    'bank-code': unique(paymentRecords.map((record) => record.bankCode)),
    'destination-id': unique(paymentRecords.map((record) => record.destinationId)),
    'business-address': unique(businessAddresses),
  };
}

function sourceRecordFor(type, value, activeCase) {
  if (type === 'phone' || type === 'email' || type === 'training-id') {
    return (activeCase.identityRecords ?? []).find((record) => normalizeLinkIdentifier(record.value) === normalizeLinkIdentifier(value))?.id
      ?? activeCase.trainingId;
  }
  if (type === 'device' || type === 'ip') {
    return (activeCase.loginHistory ?? []).find((record) => [record.deviceId, record.device, record.ip]
      .some((candidate) => normalizeLinkIdentifier(candidate) === normalizeLinkIdentifier(value)))?.id
      ?? activeCase.id;
  }
  const payment = getFinancialRecords(activeCase).paymentVerification
    .find((record) => [record.bankCode, record.destinationId]
      .some((candidate) => normalizeLinkIdentifier(candidate) === normalizeLinkIdentifier(value)));
  return payment?.id ?? activeCase.id;
}

function countsFor(accounts) {
  const count = (predicate) => accounts.filter(predicate).length;
  return {
    total: accounts.length,
    goodStanding: count((account) => account.status === 'good-standing'),
    onHold: count((account) => account.status === 'on-hold'),
    restricted: count((account) => account.status === 'restricted'),
    closed: count((account) => account.status === 'closed'),
    fraudHistory: count((account) => account.fraudHistory),
    recent: count((account) => account.recent),
  };
}

function percentage(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function buildResult(activeCase, type, value) {
  const seed = hashText(`${activeCase.id}:${type}:${normalizeLinkIdentifier(value)}`);
  const total = totalForIdentifier(type, seed);
  const sourceRecordId = sourceRecordFor(type, value, activeCase);
  const accounts = Array.from({ length: total }, (_, index) => buildAccount({
    activeCase,
    type,
    value,
    sourceRecordId,
    index,
    total,
    seed,
  }));
  const counts = countsFor(accounts);
  const label = linkIdentifierTypes.find((item) => item.key === type)?.label ?? 'Identifier';
  const normalAccounts = accounts.filter((account) => account.status === 'good-standing');
  const reviewAccounts = accounts.filter((account) => account.status !== 'good-standing');

  return {
    id: `${type}:${normalizeLinkIdentifier(value)}`,
    type,
    label,
    value,
    sourceRecordId,
    accounts,
    counts,
    percentages: {
      goodStanding: percentage(counts.goodStanding, counts.total),
      onHold: percentage(counts.onHold, counts.total),
      restricted: percentage(counts.restricted, counts.total),
      closed: percentage(counts.closed, counts.total),
      total: counts.total ? 100 : 0,
    },
    lunaSummary: [
      `This exact ${label.toLowerCase()} is recorded on ${counts.total} linked account${counts.total === 1 ? '' : 's'}.`,
      `${counts.goodStanding} are in good standing, ${counts.onHold} are on hold, ${counts.restricted} have an NSF or credit restriction, and ${counts.closed} are closed.`,
      'A match count alone does not establish misuse. Open the account and case records to verify the relationship, timing, and status context.',
    ],
    normalContext: [
      `${normalAccounts.length} account${normalAccounts.length === 1 ? '' : 's'} show established use with no recorded restriction.`,
      type === 'business-address'
        ? 'A shared business address can connect multiple valid owners, employees, or registered entities.'
        : 'Household, authorized-user, employer, and long-standing contact relationships can create expected reuse.',
    ],
    reviewContext: [
      `${reviewAccounts.length} account${reviewAccounts.length === 1 ? '' : 's'} have a hold, restriction, or closure that needs record-level review.`,
      'Compare names, addresses, dates added, account history, and any linked case before documenting what the reuse means.',
    ],
  };
}

export function buildLinkAnalysisWorkspace(activeCase, cases = []) {
  if (!activeCase) {
    return {
      activeCase: null,
      identifiers: [],
      resultSets: {},
      catalogCaseIds: [],
    };
  }
  const valuesByType = identifierValues(activeCase);
  const identifiers = linkIdentifierTypes
    .map((definition) => ({
      ...definition,
      values: valuesByType[definition.key] ?? [],
    }))
    .filter((definition) => definition.values.length);
  const resultSets = {};

  identifiers.forEach((identifier) => {
    identifier.values.forEach((value) => {
      const result = buildResult(activeCase, identifier.key, value);
      resultSets[result.id] = result;
    });
  });

  return {
    activeCase: {
      id: activeCase.id,
      person: activeCase.person,
      accountId: activeCase.accountId,
      type: activeCase.type,
    },
    identifiers,
    resultSets,
    catalogCaseIds: unique(cases.map((item) => item.id)),
  };
}

export function findLinkAnalysisResult(workspace, type, value) {
  if (!workspace || !type || !text(value)) return null;
  return workspace.resultSets?.[`${type}:${normalizeLinkIdentifier(value)}`] ?? null;
}

export function matchesLinkAccountFilter(account, filterKey) {
  if (!account) return false;
  if (filterKey === 'all') return true;
  if (filterKey === 'fraud-history') return account.fraudHistory;
  if (filterKey === 'recent') return account.recent;
  return account.status === filterKey;
}

export function filterAndSortLinkedAccounts(accounts, filters = ['all'], sort = 'most-recent') {
  const activeFilters = filters.length ? filters : ['all'];
  const filtered = activeFilters.includes('all')
    ? [...accounts]
    : accounts.filter((account) => activeFilters.some((filter) => matchesLinkAccountFilter(account, filter)));
  const sorted = [...filtered];

  sorted.sort((left, right) => {
    if (sort === 'oldest') return Date.parse(left.lastSeen) - Date.parse(right.lastSeen);
    if (sort === 'name') return left.customer.localeCompare(right.customer);
    if (sort === 'status') return left.statusLabel.localeCompare(right.statusLabel) || left.customer.localeCompare(right.customer);
    return Date.parse(right.lastSeen) - Date.parse(left.lastSeen);
  });

  return sorted;
}
