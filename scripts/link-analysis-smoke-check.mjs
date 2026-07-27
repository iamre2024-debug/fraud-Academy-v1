import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  linkAccountStatuses,
  searchLinkedAccounts,
  suggestedLinkSearches,
} from '../src/data/linkAnalysis.js';

const expectedStatuses = [
  'Open — Good Standing',
  'Closed — Fraud',
  'Closed — Fraud Concerns',
  'On Hold — NSF',
  'On Hold — Paperwork Required',
  'Closed or Restricted — Other',
];
assert.deepEqual(linkAccountStatuses, expectedStatuses);

const activeCase = {
  id: 'FA-LINK-CURRENT',
  accountId: 'ACCT-TRN-LINK-CURRENT',
  person: 'Harbor Point Training Services LLC',
  trainingId: 'TRN-CUSTOMER-9021',
  customerType: 'business',
  productType: 'business-account',
  workflowType: 'business-account-takeover',
  businessId: 'BIZ-TRN-LINK-9021',
  fictionalEin: '**-***9021',
  customer: {
    relationshipSince: '2024',
    contact: {
      phone: '(214) 555-0184',
      email: 'trusted.contact@training.example.test',
      address: '9021 Training Harbor Rd, Dallas, TX 75201',
    },
    profileChanges: [
      {
        bankCode: 'BC-9021',
        destinationId: 'DST-9021',
        device: 'DEV-TRN-9021',
        ip: '203.0.113.92',
      },
    ],
  },
  parties: [
    {
      id: 'FA-LINK-CURRENT-ENTITY',
      partyType: 'entity',
      role: 'Business account holder',
      name: 'Harbor Point Training Services LLC',
      businessId: 'BIZ-TRN-LINK-9021',
      fictionalEin: '**-***9021',
    },
    {
      id: 'FA-LINK-CURRENT-OWNER',
      partyType: 'person',
      role: 'Beneficial owner',
      name: 'Morgan Hale',
      trainingId: 'TRN-OWNER-9021',
    },
  ],
  loginHistory: [
    {
      deviceId: 'DEV-TRN-9021',
      ip: '203.0.113.92',
    },
  ],
  reportedDate: 'Jul 11, 2026',
};
const cases = [activeCase];

const sharedPhone = searchLinkedAccounts({
  query: '(214) 555-0184',
  cases,
  activeCase,
});
assert.equal(sharedPhone.searchedIdentifier, '(214) 555-0184');
assert.equal(sharedPhone.identifierType, 'Phone');
assert.equal(sharedPhone.message, '2 matched accounts');
assert.equal(sharedPhone.matches.length, 2, 'The search must return current and cross-account exact matches');
assert.ok(sharedPhone.matches.some((match) => match.currentCase));
assert.ok(sharedPhone.matches.some((match) => !match.currentCase));

const requiredMatchFields = [
  'customerName',
  'accountId',
  'customerType',
  'productType',
  'relationshipToCurrentCase',
  'exactSharedIdentifier',
  'identifierType',
  'firstUse',
  'lastUse',
  'linkSource',
  'confidence',
  'status',
  'statusExplanation',
  'investigativeNote',
];
for (const match of sharedPhone.matches) {
  for (const field of requiredMatchFields) {
    assert.notEqual(match[field], undefined, `Link match ${match.accountId} is missing ${field}`);
    assert.notEqual(match[field], '', `Link match ${match.accountId} has an empty ${field}`);
  }
  assert.equal(match.exactSharedIdentifier, '(214) 555-0184');
  assert.match(match.investigativeNote, /does not determine the current case finding/i);
  assert.equal(Object.hasOwn(match, 'finalFinding'), false);
}

const supportedSearches = [
  ['Training ID', 'TRN-CUSTOMER-9021'],
  ['Owner Training ID', 'TRN-OWNER-9021'],
  ['Business ID', 'BIZ-TRN-LINK-9021'],
  ['Fictional EIN', '**-***9021'],
  ['Phone', '(214) 555-0184'],
  ['Email', 'trusted.contact@training.example.test'],
  ['Address', '9021 Training Harbor Rd, Dallas, TX 75201'],
  ['Bank Code', 'BC-9021'],
  ['Destination ID', 'DST-9021'],
  ['Device ID', 'DEV-TRN-9021'],
  ['IP address', '203.0.113.92'],
];
for (const [expectedType, query] of supportedSearches) {
  const result = searchLinkedAccounts({ query, cases, activeCase });
  assert.ok(result.matches.length >= 1, `${expectedType} search did not find an account`);
  const currentMatch = result.matches.find((match) => match.accountId === activeCase.accountId);
  assert.ok(currentMatch, `${expectedType} search did not return the current training account`);
  assert.equal(currentMatch.identifierType, expectedType);
  assert.equal(currentMatch.exactSharedIdentifier, query);
}

const suggestedTypes = new Set(suggestedLinkSearches(activeCase).map((identifier) => identifier.type));
for (const type of ['Business ID', 'Fictional EIN', 'Phone', 'Email', 'Address']) {
  assert.ok(suggestedTypes.has(type), `Suggested searches are missing ${type}`);
}

const statusSearches = [
  ['Open — Good Standing', 'TRN-5510-06', /open with no recorded servicing restriction/i],
  ['Closed — Fraud', 'DST-7740', /prior investigation confirmed fraud.*current relationship still requires separate investigation/i],
  ['Closed — Fraud Concerns', 'TRN-8842-19', /concerns.*fraud was not confirmed/i],
  ['On Hold — NSF', 'TRN-2044-77', /credit or repayment issue.*not evidence of fraud/i],
  ['On Hold — Paperwork Required', 'DEV-MAYA-CHRM-002', /verification is incomplete.*not evidence of fraud/i],
  ['Closed or Restricted — Other', '5510 Magnolia Way, Fort Worth, TX 76102 (training)', /another operational closure or restriction reason/i],
];
for (const [status, query, explanation] of statusSearches) {
  const result = searchLinkedAccounts({ query, activeCase });
  assert.equal(result.matches.length, 1, `${status} fixture search must return one exact account`);
  assert.equal(result.matches[0].status, status);
  assert.match(result.matches[0].statusExplanation, explanation);
  assert.match(result.matches[0].investigativeNote, /does not determine the current case finding/i);
}

const priorFraudLink = searchLinkedAccounts({ query: 'DST-7740', activeCase }).matches[0];
assert.ok(priorFraudLink.relatedCaseId, 'A prior account with a related case must expose the Open Related Case target');
assert.match(priorFraudLink.statusExplanation, /current relationship still requires separate investigation/i);

const linkWorkspaceSource = await readFile(new URL('../src/LinkAnalysisWorkspace.jsx', import.meta.url), 'utf8');
assert.match(linkWorkspaceSource, /setOpenedAccountId\(match\.accountId\)/);
assert.match(linkWorkspaceSource, /data-link-account-dossier=\{openedAccount\.accountId\}/);
assert.match(linkWorkspaceSource, /Current-case boundary/);
assert.match(linkWorkspaceSource, /Status meaning/);

console.log('Link Analysis smoke check passed: exact cross-account searches return required context and status never determines the current finding.');
