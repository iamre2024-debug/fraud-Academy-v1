import { coreClaimTypes } from '../src/data/claimRegistry.js';
import { createGeneratedCase } from '../src/data/generatedCases.js';

const failures = [];
const allAutoCases = [];

for (const [claimIndex, claimType] of coreClaimTypes.entries()) {
  const start = 2_000_000 + (claimIndex * 10_000);
  const generated = Array.from({ length: claimType.scenarios.length }, (_, offset) => createGeneratedCase({
    index: start + offset,
    claimTypeId: claimType.id,
    scenarioId: 'auto',
    difficulty: 'standard',
    evidenceDepth: 'standard',
  }));
  allAutoCases.push(...generated);

  const scenarioIds = new Set(generated.map((item) => item.scenarioId));
  if (scenarioIds.size !== claimType.scenarios.length) {
    failures.push(`${claimType.label} auto mix returned ${scenarioIds.size} of ${claimType.scenarios.length} scenarios.`);
  }
}

const repeatedSubtypeCases = Array.from({ length: 16 }, (_, offset) => createGeneratedCase({
  index: 3_000_000 + offset,
  claimTypeId: 'account-takeover',
  scenarioId: 'ato-phishing-wallet',
  difficulty: 'deep',
  evidenceDepth: 'deep',
}));
const storyFingerprints = new Set(repeatedSubtypeCases.map((item) => [
  item.scenarioVariantId,
  item.amount,
  item.transactionInfo,
  item.intake.channel,
  item.documents.map((document) => `${document.name}:${document.status}`).join('|'),
].join('::')));
const amountValues = new Set(repeatedSubtypeCases.map((item) => item.amount));
const intakeRoutes = new Set(repeatedSubtypeCases.map((item) => item.intake.channel));
const documentPatterns = new Set(repeatedSubtypeCases.map((item) => item.documents.map((document) => document.status).join('|')));

if (storyFingerprints.size !== repeatedSubtypeCases.length) failures.push('Repeated generation of one subtype produced duplicate full story fingerprints.');
if (amountValues.size < 6) failures.push(`Repeated subtype generation produced only ${amountValues.size} amount variants.`);
if (intakeRoutes.size < 4) failures.push(`Repeated subtype generation produced only ${intakeRoutes.size} intake routes.`);
if (documentPatterns.size < 3) failures.push(`Repeated subtype generation produced only ${documentPatterns.size} document-availability patterns.`);
if (repeatedSubtypeCases.some((item) => item.generatedPacketVersion !== 6 || !item.scenarioVariantId || !item.scenarioVariant)) {
  failures.push('Generated cases are missing version 6 scenario-variation metadata.');
}

const determinations = new Set(allAutoCases.map((item) => item.correctDetermination).filter(Boolean));
if (determinations.size < 10) failures.push(`Auto mix produced only ${determinations.size} hidden determination paths across the full catalog.`);

for (const item of allAutoCases) {
  const preDecisionText = [
    item.shortSummary,
    item.queueReason,
    item.statement?.value,
    ...(item.events ?? []).map((event) => `${event.label} ${event.detail}`),
  ].join(' ');
  const hiddenTruth = item.caseTruth?.classification;
  if (hiddenTruth && preDecisionText.includes(hiddenTruth)) {
    failures.push(`${item.scenarioId} exposed its hidden truth in pre-decision case copy.`);
    break;
  }
}

if (failures.length) {
  console.error('Generated scenario diversity smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Generated scenario diversity smoke check passed for ${allAutoCases.length} catalog scenarios and ${repeatedSubtypeCases.length} repeated-subtype variants.`);
