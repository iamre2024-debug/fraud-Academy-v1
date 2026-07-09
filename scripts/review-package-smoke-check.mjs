import { buildReviewPackage, getReviewPackageStatus, minimumRationaleWords, requiredReviewTools, reviewChoices } from '../src/data/reviewPackage.js';

const requiredToolSet = [...requiredReviewTools];
const samplePacket = {
  id: 'PKT-SMOKE-001',
  section: 'Customer/profile packet',
  sourceTool: 'Customer 360',
  recordId: 'C360-REL',
  title: 'Relationship snapshot',
  summary: 'Neutral relationship snapshot saved for review package smoke testing.',
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function buildStatus(overrides = {}) {
  return getReviewPackageStatus({
    completedTools: requiredToolSet,
    tray: ['TRAINING-ID-001'],
    notes: ['Investigation note · Smoke test note tied to the active case.'],
    draft: {
      choice: reviewChoices[0],
      confidence: 'Medium',
      reason: 'The learner reviewed required tools and documented the evidence trail before saving this package.',
    },
    reportPackets: [samplePacket],
    ...overrides,
  });
}

const missingToolStatus = buildStatus({ completedTools: requiredToolSet.filter((tool) => tool !== 'Case Report') });
assert(!missingToolStatus.ready, 'Package should stay locked when a required tool is missing.');
assert(missingToolStatus.missingTools.includes('Case Report'), 'Missing required tool should be named in the package status.');
assert(missingToolStatus.messages.some((message) => message.includes('Review package locked')), 'Locked package should explain neutral blockers.');

const shortRationaleStatus = buildStatus({ draft: { choice: reviewChoices[0], confidence: 'High', reason: 'Too short.' } });
assert(!shortRationaleStatus.ready, 'Package should stay locked when rationale is too short.');
assert(shortRationaleStatus.rationaleWordCount < minimumRationaleWords, 'Short rationale count should be tracked.');
assert(shortRationaleStatus.blockers.some((blocker) => blocker.includes(`${minimumRationaleWords}`)), 'Rationale blocker should include the minimum word count.');

const noPacketStatus = buildStatus({ reportPackets: [] });
assert(noPacketStatus.ready, 'Structured Case Report packets should remain optional for package readiness.');
assert(noPacketStatus.caseReportPacketFeed.length === 0, 'Empty packet feed should stay empty.');
assert(noPacketStatus.messages.some((message) => message.includes('optional')), 'Empty packet state should explain packets are optional.');

const readyStatus = buildStatus();
assert(readyStatus.ready, 'Package should be ready when all required inputs are present.');
assert(readyStatus.reportPacketCount === 1, 'Ready status should count attached report packets.');
assert(readyStatus.caseReportPacketFeed[0].recordId === samplePacket.recordId, 'Ready status should expose packet feed metadata.');
assert(readyStatus.packageInputSummary.includes('Case Report packet'), 'Input summary should include the Case Report packet count.');

const savedPackage = buildReviewPackage({
  caseId: 'FA-SMOKE-0001',
  agentId: 'AGT-SMOKE',
  draft: {
    choice: reviewChoices[0],
    confidence: 'Medium',
    reason: 'The learner reviewed required tools and documented the evidence trail before saving this package.',
  },
  completedTools: requiredToolSet,
  tray: ['TRAINING-ID-001'],
  notes: ['Investigation note · Smoke test note tied to the active case.'],
  reportPackets: [samplePacket],
  packageStatus: readyStatus,
});

assert(savedPackage.reviewedRequired === requiredReviewTools.length, 'Saved package should snapshot required tool coverage.');
assert(savedPackage.caseReportPackets.length === 1, 'Saved package should snapshot attached Case Report packets.');
assert(savedPackage.caseReportPacketFeed[0].recordId === samplePacket.recordId, 'Saved package should preserve packet feed metadata.');
assert(savedPackage.blockers.length === 0, 'Saved ready package should not retain blockers.');

console.log('Review package smoke check passed. Locked blockers, rationale depth, optional packet feed, and saved package snapshots are working.');
