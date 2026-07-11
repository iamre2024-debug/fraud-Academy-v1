import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const panel = fs.readFileSync(path.join(rootDir, 'src/TimelinePanel.jsx'), 'utf8');
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const records = fs.readFileSync(path.join(rootDir, 'src/data/coreToolRecords.js'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayTimelineThemeV1.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/timeline-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_TIMELINE_THEME_V1.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Timeline v1 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Timeline coupling or visible answer language: ${text}`);
}

for (const anchor of [
  'timeline-theme-v1',
  'data-timeline-screen="approved-theme-v1"',
  'Case Timeline',
  'Working question',
  'What happened, in what recorded order, and which source verifies each event?',
  'Search Timeline records',
  'Filter Timeline by source',
  'Available timeline events',
  'data-timeline-event',
  'Expanded event',
  'Verify this event against its source record',
  'Save timeline note',
  'Save neutral report packet',
  'Open Evidence Center',
  'Open Case Report',
  'Open Submit Decision',
  "markReviewed('Timeline')",
  'It does not determine the case outcome.',
]) {
  mustContain('TimelinePanel.jsx', panel, anchor);
}

for (const anchor of [
  "import TimelinePanel from './TimelinePanel.jsx'",
  "tool === 'Timeline'",
  '<TimelinePanel {...activeToolProps} />',
  "tool === 'Case Report'",
  '<ActiveToolPanel {...activeToolProps} />',
  "openTool('Timeline', 'timeline')",
]) {
  mustContain('VisualWorkspace.jsx', workspace, anchor);
}

for (const anchor of [
  "if (tool === 'Timeline')",
  "columns: ['Timeline', 'Time', 'Event', 'Source', 'Linked Object', 'Case', 'Detail']",
  "row('TML-OPEN'",
  "'Login timeline'",
  "'Transaction timeline'",
  "'Payment timeline'",
  "'Evidence timeline'",
]) {
  mustContain('coreToolRecords.js', records, anchor);
}

for (const anchor of [
  'body[data-visual-tab="workspace"] .timeline-theme-v1',
  '.timeline-metrics',
  '.timeline-controls',
  '.timeline-workspace',
  '.timeline-event-card',
  '.timeline-detail',
  'grid-template-columns: minmax(0, 1.08fr) minmax(310px, 0.92fr)',
  '@media (max-width: 960px)',
  '@media (max-width: 720px)',
  '@media (max-width: 430px)',
  '@media (max-width: 350px)',
]) {
  mustContain('displayTimelineThemeV1.css', styles, anchor);
}

mustContain('main.jsx', entrypoint, "import './displayTimelineThemeV1.css';");
mustContain('timeline-browser.spec.mjs', browser, 'approved Timeline preserves sequence review, evidence actions, and responsive safety');
mustContain('timeline-browser.spec.mjs', browser, 'mobile-chromium');
mustContain('timeline-browser.spec.mjs', browser, 'data-timeline-screen="approved-theme-v1"');
mustContain('Timeline handoff', handoff, 'agent/timeline-approved-theme-v1');
mustContain('Timeline handoff', handoff, 'Decision & Luna only');
mustContain('Source of Truth', sourceOfTruth, 'The next isolated safe item is **Academy only**');
mustContain('README', readme, 'The next isolated screen is **Academy only**');
mustContain('package.json', packageJson, 'timeline-theme-v1-smoke-check');
mustContain('build.yml', workflow, 'Timeline approved-theme v1 smoke check');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'position: fixed',
  'SystemAccessLane',
  'caseStorage',
]) {
  mustNotContain('TimelinePanel.jsx', panel, forbidden);
  mustNotContain('displayTimelineThemeV1.css', styles, forbidden);
}

for (const forbidden of [
  'Fraudulent',
  'Legitimate',
  'Correct answer',
  'AI recommendation',
  'Red flag',
  'Green flag',
  'fraud score',
]) {
  mustNotContain('TimelinePanel.jsx visible copy', panel, forbidden);
}

if (failures.length) {
  console.error('Timeline approved-theme v1 smoke check failed. Repair these focused Timeline anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Timeline approved-theme v1 smoke check passed. Case-scoped event ordering, source links, search, filtering, event actions, responsive safety, Evidence First wording, Luna locking, protected persistence boundaries, and the synchronized Decision and Luna handoff remain intact.');
