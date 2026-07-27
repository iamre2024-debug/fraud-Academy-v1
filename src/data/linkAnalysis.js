import { caseDomainLabels } from './caseDomain.js';

const LINK_STATUS_EXPLANATIONS = {
  'Open — Good Standing': 'The linked account is open with no recorded servicing restriction.',
  'Closed — Fraud': 'A prior investigation confirmed fraud on that prior account. The current relationship still requires separate investigation.',
  'Closed — Fraud Concerns': 'The prior account closed with unresolved concerns, but fraud was not confirmed.',
  'On Hold — NSF': 'The prior account has a credit or repayment issue. NSF status is not evidence of fraud.',
  'On Hold — Paperwork Required': 'Verification is incomplete. Missing paperwork is not evidence of fraud.',
  'Closed or Restricted — Other': 'The linked account has another operational closure or restriction reason.',
};

export const linkAccountStatuses = Object.freeze(Object.keys(LINK_STATUS_EXPLANATIONS));

const fixtureAccounts = [
  {
    accountId: 'ACCT-TRN-1842-OLD',
    customerName: 'Maya Sterling',
    customerType: 'Personal',
    productType: 'Deposit account',
    status: 'Closed — Fraud Concerns',
    firstUse: 'Mar 12, 2016',
    lastUse: 'Jul 2, 2018',
    identifiers: [
      ['Training ID', 'TRN-8842-19', 'Archived customer identity record', 'High'],
      ['Phone', '(214) 555-0184', 'Archived customer contact record', 'High'],
    ],
  },
  {
    accountId: 'ACCT-TRN-4410-LINK',
    customerName: 'Juniper Field Services LLC',
    customerType: 'Business',
    productType: 'Business account',
    status: 'On Hold — Paperwork Required',
    firstUse: 'Jun 18, 2026',
    lastUse: 'Jul 8, 2026',
    identifiers: [
      ['Device ID', 'DEV-MAYA-CHRM-002', 'Recorded administrator session', 'Medium'],
      ['IP address', '198.51.100.11', 'Recorded authentication event', 'Medium'],
    ],
  },
  {
    accountId: 'ACCT-TRN-7740-PRIOR',
    customerName: 'Pine Trail Commerce (Training)',
    customerType: 'Business',
    productType: 'Business account',
    status: 'Closed — Fraud',
    firstUse: 'Apr 3, 2026',
    lastUse: 'Jun 29, 2026',
    relatedCaseId: 'FA-REL-7740',
    identifiers: [
      ['Destination ID', 'DST-7740', 'Prior payment-destination record', 'High'],
      ['Bank Code', 'BC-204', 'Prior payment-routing record', 'High'],
    ],
  },
  {
    accountId: 'ACCT-TRN-2044-HIST',
    customerName: 'Avery Brooks',
    customerType: 'Personal',
    productType: 'Personal loan',
    status: 'On Hold — NSF',
    firstUse: 'Feb 14, 2025',
    lastUse: 'Jun 30, 2026',
    identifiers: [
      ['Training ID', 'TRN-2044-77', 'Customer identity record', 'High'],
      ['Email', 'avery.training@example.test', 'Customer contact record', 'High'],
    ],
  },
  {
    accountId: 'ACCT-TRN-5510-HIST',
    customerName: 'Jordan Ellis',
    customerType: 'Personal',
    productType: 'Deposit account',
    status: 'Open — Good Standing',
    firstUse: 'Sep 9, 2021',
    lastUse: 'Jul 8, 2026',
    identifiers: [
      ['Training ID', 'TRN-5510-06', 'Customer identity record', 'High'],
      ['Phone', '(817) 555-0149', 'Customer contact record', 'High'],
    ],
  },
  {
    accountId: 'ACCT-TRN-ADDR-5510',
    customerName: 'Magnolia Household Profile (Training)',
    customerType: 'Personal',
    productType: 'Credit card',
    status: 'Closed or Restricted — Other',
    firstUse: 'Jan 11, 2020',
    lastUse: 'Oct 4, 2024',
    identifiers: [
      ['Address', '5510 Magnolia Way, Fort Worth, TX 76102 (training)', 'Historical mailing-address record', 'Medium'],
    ],
  },
];

function clean(value) {
  return String(value ?? '').trim();
}

function normalized(value) {
  return clean(value).toLowerCase().replace(/[()\s-]+/g, '');
}

function addIdentifier(target, type, value, source = 'Case record', confidence = 'High') {
  const exactValue = clean(value);
  if (!exactValue || /not supplied|not available|not applicable/i.test(exactValue)) return;
  const key = `${type}:${normalized(exactValue)}`;
  if (target.some((item) => `${item.type}:${normalized(item.value)}` === key)) return;
  target.push({ type, value: exactValue, source, confidence });
}

function identifierType(type = '', value = '') {
  const joined = `${type} ${value}`.toLowerCase();
  if (/owner.*training|beneficial.*training/.test(joined)) return 'Owner Training ID';
  if (/training id/.test(joined) || /^trn-/i.test(value)) return 'Training ID';
  if (/business id|registration/.test(joined)) return 'Business ID';
  if (/\bein\b/.test(joined)) return 'Fictional EIN';
  if (/phone|mobile/.test(joined)) return 'Phone';
  if (/email/.test(joined) || /@/.test(value)) return 'Email';
  if (/\bip\b|network/.test(joined) || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) return 'IP address';
  if (/address/.test(joined)) return 'Address';
  if (/bank code/.test(joined) || /^bc-/i.test(value)) return 'Bank Code';
  if (/destination/.test(joined) || /^dst-/i.test(value)) return 'Destination ID';
  if (/device/.test(joined) || /^dev-/i.test(value)) return 'Device ID';
  return '';
}

function caseIdentifiers(item = {}) {
  const identifiers = [];
  addIdentifier(identifiers, 'Training ID', item.trainingId, 'Case identity record');
  addIdentifier(identifiers, 'Business ID', item.businessId ?? item.businessProfile?.registration, 'Business registration record');
  addIdentifier(identifiers, 'Fictional EIN', item.fictionalEin ?? item.businessProfile?.ein, 'Business registration record');

  const contact = item.customer?.contact ?? {};
  addIdentifier(identifiers, 'Phone', contact.phone, 'Customer contact record');
  addIdentifier(identifiers, 'Email', contact.email, 'Customer contact record');
  addIdentifier(identifiers, 'Address', contact.address, 'Customer contact record');

  for (const record of item.identityRecords ?? []) {
    const values = String(record.value ?? '').split('|').map((value) => value.trim()).filter(Boolean);
    for (const value of values) {
      const type = identifierType(values.length > 1 ? '' : record.type, value);
      if (type) addIdentifier(identifiers, type, value, record.type ?? 'Identity record');
    }
  }

  for (const party of item.parties ?? []) {
    addIdentifier(identifiers, /owner|control|guarantor/i.test(party.role ?? '') ? 'Owner Training ID' : 'Training ID', party.trainingId, `${party.role} record`);
    addIdentifier(identifiers, 'Business ID', party.businessId, `${party.role} record`);
    addIdentifier(identifiers, 'Fictional EIN', party.fictionalEin, `${party.role} record`);
    addIdentifier(identifiers, 'Phone', party.phone, `${party.role} record`);
    addIdentifier(identifiers, 'Email', party.email, `${party.role} record`);
    addIdentifier(identifiers, 'Address', party.address, `${party.role} record`);
  }

  for (const login of item.loginHistory ?? []) {
    addIdentifier(identifiers, 'Device ID', login.deviceId, 'Authentication record', 'High');
    addIdentifier(identifiers, 'IP address', login.ip, 'Authentication record', 'High');
  }

  for (const change of item.customer?.profileChanges ?? []) {
    const fields = [
      ['Bank Code', change.bankCode],
      ['Destination ID', change.destinationId],
      ['Device ID', change.device],
      ['IP address', change.ip],
    ];
    for (const [type, value] of fields) addIdentifier(identifiers, type, value, 'Profile-change record', 'High');

    const text = `${change.oldValue ?? ''} ${change.newValue ?? ''} ${change.detail ?? ''}`;
    for (const match of text.matchAll(/\bBC-\d+\b/gi)) addIdentifier(identifiers, 'Bank Code', match[0], 'Profile-change record');
    for (const match of text.matchAll(/\bDST-\d+\b/gi)) addIdentifier(identifiers, 'Destination ID', match[0], 'Profile-change record');
  }

  return identifiers;
}

function caseAccount(item = {}) {
  const labels = caseDomainLabels(item);
  const product = labels.productTypeLabel || item.productType || item.type || 'Training product';
  const customerName = labels.customerTypeLabel === 'Business'
    ? item.profile?.business ?? item.businessProfile?.legalName ?? item.person
    : item.person;
  return {
    accountId: item.accountId ?? item.id,
    customerName: customerName ?? 'Fictional training customer',
    customerType: labels.customerTypeLabel || item.customerType || 'Personal',
    productType: product,
    status: item.accountStatus ?? 'Open — Good Standing',
    firstUse: item.customer?.relationshipSince ?? item.issueStartDate ?? item.opened ?? 'Not recorded',
    lastUse: item.reportedDate ?? item.opened ?? 'Not recorded',
    caseId: item.id,
    relatedCaseId: item.id,
    identifiers: caseIdentifiers(item).map(({ type, value, source, confidence }) => [type, value, source, confidence]),
  };
}

function relationshipLabel(identifier, currentAccountId, matchedAccountId, searchedIdentifierIsOnCurrentCase) {
  if (currentAccountId === matchedAccountId) return 'Current case account';
  if (searchedIdentifierIsOnCurrentCase) return `Shared ${identifier.type.toLowerCase()} with the current case`;
  return `Matched ${identifier.type.toLowerCase()} search; relationship to the current case is not yet established`;
}

export function buildLinkAccountIndex(cases = []) {
  return [
    ...cases.map(caseAccount),
    ...fixtureAccounts,
  ];
}

export function searchLinkedAccounts({ query, cases = [], activeCase = {} } = {}) {
  const searchedIdentifier = clean(query);
  if (!searchedIdentifier) {
    return {
      searchedIdentifier: '',
      identifierType: '',
      matches: [],
      message: 'Enter a fictional training identifier to search across accounts.',
    };
  }

  const queryKey = normalized(searchedIdentifier);
  const currentAccountId = activeCase.accountId ?? activeCase.id;
  const searchedIdentifierIsOnCurrentCase = caseIdentifiers(activeCase)
    .some((identifier) => normalized(identifier.value) === queryKey);
  const matches = [];

  for (const account of buildLinkAccountIndex(cases)) {
    for (const [rawType, rawValue, source = 'Account record', confidence = 'High'] of account.identifiers ?? []) {
      if (normalized(rawValue) !== queryKey) continue;
      const type = identifierType(rawType, rawValue) || rawType;
      matches.push({
        customerName: account.customerName,
        accountId: account.accountId,
        customerType: account.customerType,
        productType: account.productType,
        relationshipToCurrentCase: relationshipLabel(
          { type },
          currentAccountId,
          account.accountId,
          searchedIdentifierIsOnCurrentCase,
        ),
        exactSharedIdentifier: clean(rawValue),
        identifierType: type,
        firstUse: account.firstUse,
        lastUse: account.lastUse,
        linkSource: source,
        confidence,
        status: account.status,
        statusExplanation: LINK_STATUS_EXPLANATIONS[account.status] ?? LINK_STATUS_EXPLANATIONS['Closed or Restricted — Other'],
        caseId: account.caseId,
        relatedCaseId: account.relatedCaseId,
        currentCase: currentAccountId === account.accountId,
        investigativeNote: 'This link is evidence for review and does not determine the current case finding.',
      });
    }
  }

  return {
    searchedIdentifier,
    identifierType: matches[0]?.identifierType ?? 'Unrecognized identifier',
    matches,
    message: matches.length
      ? `${matches.length} matched account${matches.length === 1 ? '' : 's'}`
      : '0 matched accounts',
  };
}

export function suggestedLinkSearches(activeCase = {}) {
  return caseIdentifiers(activeCase)
    .filter((item) => ['Training ID', 'Business ID', 'Fictional EIN', 'Owner Training ID', 'Phone', 'Email', 'Address', 'Bank Code', 'Destination ID', 'Device ID', 'IP address'].includes(item.type));
}
