import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const panel = fs.readFileSync(path.join(rootDir, 'src/AcademyThemeV1Panel.jsx'), 'utf8');
const navigation = fs.readFileSync(path.join(rootDir, 'src/VisualNavigation.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayAcademyThemeV1.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/academy-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_ACADEMY_THEME_V1.md'), 'utf8');
const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Academy v1 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Academy coupling or visible answer language: ${text}`);
}

for (const anchor of [
  'data-academy-screen="approved-theme-v1"',
  'Learning Center',
  'Build investigator judgment',
  'Evidence First foundation',
  'Record review practice',
  'Evidence connections',
  'Case quality and submission',
  'Fraud Library',
  'Achievements',
  'Academy status stays neutral until a learner package is saved for the case.',
  "onNavigate('workspace')",
  "onNavigate('cases')",
  "onNavigate('progress')",
  'Open Academy Progress',
  'Practice in Workspace',
]) mustContain('AcademyThemeV1Panel.jsx', panel, anchor);

for (const anchor of [
  "import AcademyThemeV1Panel from './AcademyThemeV1Panel.jsx';",
  "activeTab === 'academy'",
  '<AcademyThemeV1Panel',
  'snapshot={snapshot}',
  'onNavigate={onNavigate}',
]) mustContain('VisualNavigation.jsx', navigation, anchor);

for (const anchor of [
  'body[data-visual-tab="academy"]',
  '.academy-theme-v1',
  '.academy-hero',
  '.academy-stat-grid',
  '.academy-main-grid',
  '.academy-path-grid',
  '.academy-library-card',
  '.academy-achievement-card',
  '.academy-practice-banner',
  '@media (max-width: 960px)',
  '@media (max-width: 720px)',
  '@media (max-width: 430px)',
  '@media (max-width: 350px)',
]) mustContain('displayAcademyThemeV1.css', styles, anchor);

mustContain('main.jsx', entrypoint, "import './displayAcademyThemeV1.css';");
mustContain('academy-browser.spec.mjs', browser, 'approved Academy preserves neutral learning routes and responsive safety');
mustContain('academy-browser.spec.mjs', browser, 'mobile-chromium');
mustContain('Academy handoff', handoff, 'agent/academy-approved-theme-v1');
mustContain('Academy handoff', handoff, 'Profile only');
mustContain('package.json', packageJson, 'academy-theme-v1-smoke-check');
mustContain('build.yml', workflow, 'Academy approved-theme v1 smoke check');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'SystemAccessLane',
  'caseStorage',
  'position: fixed',
  'overflow-x: auto',
  'overflow-x: scroll',
]) {
  mustNotContain('AcademyThemeV1Panel.jsx', panel, forbidden);
  mustNotContain('displayAcademyThemeV1.css', styles, forbidden);
}

for (const forbidden of [
  'Fraudulent',
  'Legitimate',
  'Correct answer',
  'AI recommendation',
  'Red flag',
  'Green flag',
  'fraud score',
]) mustNotContain('AcademyThemeV1Panel.jsx visible copy', panel, forbidden);

if (failures.length) {
  console.error('Academy approved-theme v1 smoke check failed. Repair these focused Academy anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Academy approved-theme v1 smoke check passed. The Evidence First learning hub, contextual Progress route, functional case routes, responsive presentation, protected persistence boundaries, and Profile-only handoff remain intact.');
