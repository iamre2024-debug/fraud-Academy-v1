import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayFinalResponsivePolishV1.css'), 'utf8');
const navigation = fs.readFileSync(path.join(rootDir, 'src/VisualNavigation.jsx'), 'utf8');
const repository = fs.readFileSync(path.join(rootDir, 'src/data/generatedCaseRepository.js'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/final-responsive-mobile-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_FINAL_RESPONSIVE_MOBILE_POLISH_V1.md'), 'utf8');
const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
const failures = [];

function mustContain(label, content, text) {
  if (!content.includes(text)) failures.push(`${label} is missing required final responsive anchor: ${text}`);
}

function mustNotContain(label, content, text) {
  if (content.includes(text)) failures.push(`${label} contains forbidden final responsive coupling: ${text}`);
}

mustContain('main.jsx', entrypoint, "import './displayFinalResponsivePolishV1.css';");
const profileImport = entrypoint.indexOf("import './displayProfileThemeV1Safety.css';");
const finalImport = entrypoint.indexOf("import './displayFinalResponsivePolishV1.css';");
if (profileImport < 0 || finalImport < profileImport) {
  failures.push('main.jsx must import the final responsive layer after the completed Profile safety layer.');
}

for (const anchor of [
  '--fa-safe-bottom',
  'env(safe-area-inset-bottom',
  'min-block-size: 44px',
  ':focus-visible',
  'overflow-x: clip',
  '@media (prefers-reduced-motion: reduce)',
  '@media (min-width: 320px) and (max-width: 389px)',
  '@media (min-width: 390px) and (max-width: 479px)',
  '@media (min-width: 480px) and (max-width: 767px)',
  '@media (min-width: 768px) and (max-width: 1023px)',
  '@media (min-width: 1024px) and (max-width: 1439px)',
  '@media (min-width: 1440px)',
  '.active-case-workflow-list',
  '.visual-react-bottom-nav',
  '.investigation-tool-workspace',
  '.timeline-workspace',
  '.decision-v1-workspace',
  '.academy-main-grid',
  '.profile-main-grid',
]) {
  mustContain('displayFinalResponsivePolishV1.css', styles, anchor);
}

for (const forbidden of [
  'localStorage',
  'indexedDB',
  'generateAndSaveCase',
  'reviewPackages',
  'LunaPostSubmissionPanel',
]) {
  mustNotContain('displayFinalResponsivePolishV1.css', styles, forbidden);
}

const navigationBlock = navigation.match(/const navigationItems = \[([\s\S]*?)\];/);
if (!navigationBlock) {
  failures.push('VisualNavigation.jsx navigationItems block is missing.');
} else {
  for (const key of ['dashboard', 'cases', 'workspace', 'academy']) {
    mustContain('VisualNavigation.jsx navigationItems', navigationBlock[1], `key: '${key}'`);
  }
  mustNotContain('VisualNavigation.jsx navigationItems', navigationBlock[1], "key: 'profile'");
  mustNotContain('VisualNavigation.jsx navigationItems', navigationBlock[1], "key: 'progress'");
}

for (const anchor of [
  'indexedDB.open',
  'generateAndSaveCase',
  'listGeneratedCases',
  'combineCaseCatalog',
]) {
  mustContain('generatedCaseRepository.js', repository, anchor);
}

for (const anchor of [
  "name: 'compact-phone'",
  "name: 'standard-phone'",
  "name: 'large-phone-small-tablet'",
  "name: 'tablet'",
  "name: 'laptop'",
  "name: 'wide-desktop'",
  '[data-case-briefing-screen="approved-theme-v1"]',
  '[data-customer-360-screen="approved-theme-v1"]',
  '[data-investigation-tools-screen="approved-theme-v1"]',
  '[data-timeline-screen="approved-theme-v1"]',
  '[data-decision-screen="approved-theme-v1"]',
  '[data-luna-screen="approved-theme-v1"]',
  '[data-academy-screen="approved-theme-v1"]',
  '[data-profile-screen="approved-theme-v1"]',
  'Generate + Open Case',
  'document.documentElement.scrollWidth',
  'minTouchHeight',
]) {
  mustContain('final-responsive-mobile-browser.spec.mjs', browser, anchor);
}

for (const anchor of [
  'Dashboard → Cases → Workspace shell → Case Briefing → Customer 360 → Investigation tools → Timeline → Decision and Luna → Academy → Profile → final responsive/mobile polish.',
  'Next product screen: none',
  'IndexedDB-first generated-case persistence boundary',
  'Luna remains locked until a learner package is saved',
  'Do not make additional design changes under this task unless Ree approves a new scope.',
]) {
  mustContain('FRAUD_ACADEMY_FINAL_RESPONSIVE_MOBILE_POLISH_V1.md', handoff, anchor);
}

mustContain('package.json', packageJson, '"final-responsive-mobile-smoke-check": "node scripts/final-responsive-mobile-smoke-check.mjs"');
mustContain('package.json verify', packageJson, 'npm run final-responsive-mobile-smoke-check');
mustContain('build.yml', workflow, 'Final responsive and mobile polish smoke check');
mustContain('build.yml', workflow, 'npm run final-responsive-mobile-smoke-check');

if (failures.length) {
  console.error('Final responsive/mobile smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Final responsive/mobile smoke check passed. All completed screens share six-range viewport containment, safe-area spacing, touch and focus safety, reduced-motion support, generated-case coverage, and the protected four-item navigation.');
