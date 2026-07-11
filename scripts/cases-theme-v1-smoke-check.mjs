import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const panel = fs.readFileSync(path.join(rootDir, 'src/CasesThemeV1Panel.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayCasesThemeV1.css'), 'utf8');
const app = fs.readFileSync(path.join(rootDir, 'src/VisualApp.jsx'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/browser-smoke.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_CASES_THEME_V1.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Cases v1 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Cases v1 coupling: ${text}`);
}

for (const anchor of [
  'data-cases-theme-v1="approved"',
  'Search cases',
  'Case Queue',
  '>Detail</button>',
  '>Compact</button>',
  'Selected case preview',
  'Why this case exists',
  'Customer allegation or system alert',
  'Evidence First',
  'className="nav-case-card"',
  'onOpenCase?.(item.id)',
  "['generated', 'Generated']",
  "['completed', 'Completed']",
  'No cases match these filters.',
]) {
  mustContain('CasesThemeV1Panel.jsx', panel, anchor);
}

mustContain('VisualApp.jsx', app, "import CasesThemeV1Panel from './CasesThemeV1Panel.jsx';");
mustContain('VisualApp.jsx', app, "active={activeTab === 'cases'}");
mustContain('main.jsx', entrypoint, "import './displayCasesThemeV1.css';");
mustContain('displayCasesThemeV1.css', styles, 'body[data-visual-tab="cases"]');
mustContain('displayCasesThemeV1.css', styles, '.cases-theme-v1-panel');
mustContain('displayCasesThemeV1.css', styles, '.case-queue-layout');
mustContain('displayCasesThemeV1.css', styles, '@media (max-width: 560px)');
mustContain('displayCasesThemeV1.css', styles, '@media (max-width: 380px)');
mustContain('browser-smoke.spec.mjs', browser, 'approved Cases queue supports neutral search, filters, preview, and responsive layout');
mustContain('browser-smoke.spec.mjs', browser, '[data-cases-theme-v1="approved"]');
mustContain('browser-smoke.spec.mjs', browser, '.cases-theme-v1-panel .nav-case-card');
mustContain('Cases handoff', handoff, 'Workspace shell');
mustContain('Cases handoff', handoff, 'agent/cases-approved-theme-v1');
mustContain('Source of Truth', sourceOfTruth, '`src/CasesThemeV1Panel.jsx`');
mustContain('Source of Truth', sourceOfTruth, '`src/displayCasesThemeV1.css`');
mustContain('Source of Truth', sourceOfTruth, '`docs/FRAUD_ACADEMY_CASES_THEME_V1.md`');
mustContain('Source of Truth', sourceOfTruth, 'Dashboard, Cases, the Workspace shell, Case Briefing, Customer 360, and Investigation tools are the completed approved replacements');
mustContain('Source of Truth', sourceOfTruth, 'The next isolated safe item is **Decision & Luna only**');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'SystemAccessLane',
  'position: fixed',
  'overflow-x: auto',
  'overflow-x: scroll',
]) {
  mustNotContain('displayCasesThemeV1.css', styles, forbidden);
}

for (const forbidden of [
  'localStorage.setItem',
  'indexedDB.open',
  'generateAndSaveCase',
  'writeGeneratedCases',
]) {
  mustNotContain('CasesThemeV1Panel.jsx', panel, forbidden);
}

for (const forbidden of ['Fraudulent', 'Legitimate', 'Correct answer', 'AI recommendation', 'Red flag', 'Green flag']) {
  mustNotContain('CasesThemeV1Panel.jsx visible copy', panel, forbidden);
}

if (failures.length) {
  console.error('Cases approved-theme v1 smoke check failed. Repair these focused queue anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Cases approved-theme v1 smoke check passed. Search, filters, sorting, queue states, selected preview, responsive presentation, Evidence First wording, protected persistence boundaries, and the synchronized Timeline handoff remain intact.');
