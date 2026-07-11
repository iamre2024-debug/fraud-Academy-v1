import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const displayHandoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_DISPLAY_HANDOFF.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required display handoff anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains retired or unsafe display handoff copy: ${text}`);
}

[
  'Fraud Academy Bible v2.1',
  'Fraud Academy Display Bible v1.0 - New Design Exploration',
  'The current screenshot-driven visual shell remains the active runtime',
  'Dashboard',
  'Cases',
  'Workspace',
  'Academy',
  'Case Briefing',
  'Investigate',
  'Determination',
  'Debrief',
  'Compact phone',
  'Wide desktop',
  'No required horizontal page scrolling.',
  '`src/data/generatedCaseRepository.js` as the generated-case persistence boundary.',
  'Parked ten-module System Access portal modules remain retired.',
  'Phase 1 - Global navigation and header',
  'Phase 2 - Active-case workflow rail',
].forEach((anchor) => mustContain('FRAUD_ACADEMY_DISPLAY_HANDOFF.md', displayHandoff, anchor));

mustContain('FRAUD_ACADEMY_SOURCE_OF_TRUTH.md', sourceOfTruth, 'docs/FRAUD_ACADEMY_DISPLAY_HANDOFF.md');
mustContain('FRAUD_ACADEMY_SOURCE_OF_TRUTH.md', sourceOfTruth, 'The runtime global navigation now uses Dashboard, Cases, Workspace, and Academy.');
mustContain('README.md', readme, 'docs/FRAUD_ACADEMY_DISPLAY_HANDOFF.md');
mustContain('package.json', packageJson, '"display-handoff-smoke-check": "node scripts/display-handoff-smoke-check.mjs"');
mustContain('package.json', packageJson, 'npm run display-handoff-smoke-check');
mustContain('build.yml', workflow, 'Display handoff smoke check');
mustContain('build.yml', workflow, 'npm run display-handoff-smoke-check');

mustNotContain('FRAUD_ACADEMY_DISPLAY_HANDOFF.md', displayHandoff, 'restore a separate portal panel');
mustNotContain('FRAUD_ACADEMY_DISPLAY_HANDOFF.md', displayHandoff, 'replace generatedCaseRepository');

if (failures.length) {
  console.error('Display handoff smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Display handoff smoke check passed.');
