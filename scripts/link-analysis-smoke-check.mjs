import fs from 'node:fs';
import { trainingCases as baseCases } from '../src/data/cases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import {
  getLinkIdentifiersForCase,
  getLinkMapContext,
  normalizeLinkIdentifier,
  searchLinkRelationships,
} from '../src/data/linkAnalysisRecords.js';

const failures = [];
const cases = enrichTrainingCases(baseCases);

function fail(message) {
  failures.push(message);
}

for (const activeCase of cases) {
  const identifiers = getLinkIdentifiersForCase(activeCase);
  const phone = identifiers.find((item) => item.type === 'phone');
  const trainingId = identifiers.find((item) => item.type === 'training-id');
  if (!phone) fail(`${activeCase.id}: Link Analysis is missing the customer phone suggestion.`);
  if (!trainingId) fail(`${activeCase.id}: Link Analysis is missing the Training ID suggestion.`);

  const result = searchLinkRelationships({
    query: phone?.value,
    identifierType: 'phone',
    cases,
    activeCase,
  });
  if (result.matches.length < 3) fail(`${activeCase.id}: expected at least three exact phone-linked training accounts.`);
  if (!result.matches.some((item) => item.currentCase)) fail(`${activeCase.id}: the current account is missing from its exact phone result.`);
  if (result.matches.some((item) => normalizeLinkIdentifier(item.exactSharedIdentifier) !== normalizeLinkIdentifier(phone?.value))) {
    fail(`${activeCase.id}: Link Analysis returned a non-exact phone match.`);
  }
  if (JSON.stringify(result).match(/\b(?:high risk|risk score|fraud score|confirmed current fraud)\b/i)) {
    fail(`${activeCase.id}: Link Analysis exposes an automatic risk conclusion.`);
  }

  const partial = searchLinkRelationships({
    query: String(phone?.value ?? '').slice(0, -2),
    identifierType: 'phone',
    cases,
    activeCase,
  });
  if (partial.matches.length) fail(`${activeCase.id}: partial identifier searches must not return account links.`);

  const map = getLinkMapContext(activeCase);
  if (!map.subject.name || !map.transaction.id || map.nodes.length !== 5) {
    fail(`${activeCase.id}: the relationship map is missing its subject, transaction, or five evidence nodes.`);
  }
}

const creditCase = cases.find((item) => item.id === 'FA-CR-24003');
const destination = getLinkIdentifiersForCase(creditCase).find((item) => item.type === 'destination-id' && item.value === 'DST-7740');
const destinationResult = searchLinkRelationships({
  query: destination?.value,
  identifierType: 'destination-id',
  cases,
  activeCase: creditCase,
});
if (!destinationResult.matches.some((item) => item.status === 'Closed · Prior confirmed fraud')) {
  fail('DST-7740 should expose the factual prior-account confirmed-fraud status.');
}
if (!destinationResult.matches.every((item) => /does not determine|still requires|current account is open/i.test(`${item.statusExplanation} ${item.investigativeNote}`))) {
  fail('Every linked-account status must preserve the current-case evidence boundary.');
}

const generatedCase = enrichTrainingCases([
  createGeneratedCase({
    index: 2026072701,
    claimTypeId: 'payroll-change',
    difficulty: 'standard',
    evidenceDepth: 'standard',
  }),
])[0];
const generatedPhone = getLinkIdentifiersForCase(generatedCase).find((item) => item.type === 'phone');
const generatedResult = searchLinkRelationships({
  query: generatedPhone?.value,
  identifierType: 'phone',
  cases: [...cases, generatedCase],
  activeCase: generatedCase,
});
if (generatedResult.matches.length < 3) fail('Generated cases must receive the same complete Link Analysis relationship contract.');

const component = fs.readFileSync('src/LinkAnalysisWorkspace.jsx', 'utf8');
const panel = fs.readFileSync('src/InvestigationToolPanel.jsx', 'utf8');
const mobileWorkspace = fs.readFileSync('src/MobileMissionWorkspace.jsx', 'utf8');
const styles = fs.readFileSync('src/linkAnalysisWorkspace.css', 'utf8');
for (const anchor of [
  'data-link-analysis-workspace',
  'Interactive relationship map',
  'Matched Accounts',
  'Verified Links Summary',
  'Open Account',
  'Open Related Case',
  'Luna · factual link summary',
]) {
  if (!component.includes(anchor)) fail(`Dedicated Link Analysis workspace is missing: ${anchor}.`);
}
if (!panel.includes("if (tool === 'Link Analysis')") || !panel.includes('<LinkAnalysisWorkspace')) {
  fail('InvestigationToolPanel is not routing Link Analysis into its dedicated component.');
}
if (!mobileWorkspace.includes('data-link-analysis-header') || !mobileWorkspace.includes('mission-link-analysis-case-select')) {
  fail('The mobile Link Analysis route is not using its dedicated compact header.');
}
for (const anchor of ['link-analysis-map-canvas', 'link-analysis-account-card', '@media (max-width: 700px)', 'prefers-reduced-motion']) {
  if (!styles.includes(anchor)) fail(`Link Analysis responsive styling is missing: ${anchor}.`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Link Analysis smoke check passed for exact-search matching, personal and generated cases, factual prior-account statuses, interactive graph structure, account actions, mobile routing, and Evidence First boundaries.');
