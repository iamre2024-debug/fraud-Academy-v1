import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const releasePackage = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_RELEASE_PACKAGE.md'), 'utf8');
const releaseReadiness = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_RELEASE_READINESS.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
const generatedRepository = fs.readFileSync(path.join(rootDir, 'src/data/generatedCaseRepository.js'), 'utf8');
const workspaceState = fs.readFileSync(path.join(rootDir, 'src/useVisualWorkspaceCaseState.js'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required release-package anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.toLowerCase().includes(text.toLowerCase())) failures.push(`${fileLabel} contains forbidden release claim or architecture drift: ${text}`);
}

for (const anchor of [
  'Runtime candidate: approved for internal user acceptance testing',
  'Commercial/public package: not yet complete',
  'Runtime architecture',
  'Data model and persistence',
  'Fictional-data and training-safety statement',
  'Accessibility and browser support',
  'Deployment status',
  'Known limitations',
  'Post-v1 backlog',
  'External handoff checklist',
  'src/data/generatedCaseRepository.js',
  'Connections contains one System Access Lane',
]) {
  mustContain('Release Package', releasePackage, anchor);
}

for (const safeLabel of [
  'Training ID',
  'Bank Code',
  'Destination ID',
  'Payment Verification',
  'Evidence First',
]) {
  mustContain('Release Package', releasePackage, safeLabel);
}

mustContain('Release Readiness', releaseReadiness, 'docs/FRAUD_ACADEMY_RELEASE_PACKAGE.md');
mustContain('Source of Truth', sourceOfTruth, 'docs/FRAUD_ACADEMY_RELEASE_PACKAGE.md');
mustContain('Source of Truth', sourceOfTruth, 'The focused display migration is complete.');
mustContain('README', readme, 'docs/FRAUD_ACADEMY_RELEASE_PACKAGE.md');
mustContain('package.json', packageJson, 'release-package-smoke-check');
mustContain('package.json', packageJson, 'npm run release-package-smoke-check');
mustContain('GitHub Actions', workflow, 'Release package documentation smoke check');
mustContain('GitHub Actions', workflow, 'npm run release-package-smoke-check');

for (const repositoryAnchor of [
  "kind: 'indexedDB'",
  "kind: 'localStorage'",
  'await migrateLegacyCases(repository);',
  'while (existingIds.has(nextCase.id))',
]) {
  mustContain('generatedCaseRepository.js', generatedRepository, repositoryAnchor);
}

for (const stateAnchor of [
  'storageKeys.tray',
  'storageKeys.notes',
  'storageKeys.completed',
  'storageKeys.decisions',
  'storageKeys.packages',
  'storageKeys.reportPackets',
]) {
  mustContain('useVisualWorkspaceCaseState.js', workspaceState, stateAnchor);
}

for (const forbidden of [
  'fully production ready',
  'commercially complete',
  'no remaining limitations',
  'wcag compliant',
  'supports every browser',
  'real customer data is allowed',
  'revive the ten-module System Access portal',
  'replace generatedCaseRepository',
]) {
  mustNotContain('Release Package', releasePackage, forbidden);
}

if (failures.length) {
  console.error('Release package documentation smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Release package documentation smoke check passed. Architecture, persistence, fictional-data safety, accessibility status, browser support, deployment status, limitations, and backlog remain honest and aligned with the protected runtime.');
