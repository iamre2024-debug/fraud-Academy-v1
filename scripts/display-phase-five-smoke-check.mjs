import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const releaseAudit = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_RELEASE_READINESS.md'), 'utf8');
const displayHandoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_DISPLAY_HANDOFF.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/browser-smoke.spec.mjs'), 'utf8');
const repository = fs.readFileSync(path.join(rootDir, 'src/data/generatedCaseRepository.js'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Phase 5 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden release claim or coupling: ${text}`);
}

for (const anchor of [
  'Runtime candidate: PASS for internal user acceptance testing.',
  'Commercial/public release package: NOT YET COMPLETE.',
  'Evidence First',
  'Luna pre-submission lock',
  'Generated-case persistence',
  'System Access boundary',
  'Release-package gaps',
  'Next safe item',
]) {
  mustContain('Release Readiness', releaseAudit, anchor);
}

mustContain('Display Handoff', displayHandoff, 'Completed in the final Bible and release-readiness audit:');
mustContain('Display Handoff', displayHandoff, 'docs/FRAUD_ACADEMY_RELEASE_READINESS.md');
mustContain('Source of Truth', sourceOfTruth, 'docs/FRAUD_ACADEMY_RELEASE_READINESS.md');
mustContain('README', readme, 'docs/FRAUD_ACADEMY_RELEASE_READINESS.md');
mustContain('package.json', packageJson, 'display-phase-five-smoke-check');
mustContain('package.json', packageJson, 'npm run display-phase-five-smoke-check');
mustContain('GitHub Actions', workflow, 'Display Phase 5 release-readiness smoke check');
mustContain('GitHub Actions', workflow, 'npm run display-phase-five-smoke-check');

mustContain('browser-smoke.spec.mjs', browser, 'generated cases persist through reload and remain Evidence First');
mustContain('browser-smoke.spec.mjs', browser, 'await page.reload();');
mustContain('browser-smoke.spec.mjs', browser, 'for (const generatedId of generatedIds)');
mustContain('browser-smoke.spec.mjs', browser, 'await assertEvidenceFirstLock(page, generatedIds[0]);');

mustContain('generatedCaseRepository.js', repository, "kind: 'indexedDB'");
mustContain('generatedCaseRepository.js', repository, "kind: 'localStorage'");
mustContain('generatedCaseRepository.js', repository, 'await migrateLegacyCases(repository);');
mustContain('generatedCaseRepository.js', repository, 'while (existingIds.has(nextCase.id))');

for (const forbidden of [
  'fully production ready',
  'commercially complete',
  'no remaining gaps',
  'revive System Access',
  'replace generatedCaseRepository',
]) {
  mustNotContain('Release Readiness', releaseAudit.toLowerCase(), forbidden.toLowerCase());
}

if (failures.length) {
  console.error('Display Phase 5 release-readiness smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Display Phase 5 release-readiness smoke check passed. The audited tree preserves Evidence First, Luna gating, generated-case persistence, the single System Access Lane, and honest release-package limitations.');
