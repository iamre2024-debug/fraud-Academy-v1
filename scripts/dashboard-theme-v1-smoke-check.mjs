import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const navigation = fs.readFileSync(path.join(rootDir, 'src/VisualNavigation.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayDashboardThemeV1.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/browser-smoke.spec.mjs'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Dashboard v1 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Dashboard v1 coupling: ${text}`);
}

mustContain('VisualNavigation.jsx', navigation, "activeTab === 'dashboard' ? 'dashboard-theme-v1' : ''");
mustContain('VisualNavigation.jsx', navigation, 'className="dashboard-active-case"');
mustContain('VisualNavigation.jsx', navigation, '<strong>Case Queue</strong>');
mustContain('VisualNavigation.jsx', navigation, '<strong>Evidence Workspace</strong>');
mustContain('VisualNavigation.jsx', navigation, '<strong>Timeline</strong>');
mustContain('VisualNavigation.jsx', navigation, '<strong>Reports & Progress</strong>');
mustContain('VisualNavigation.jsx', navigation, 'case scoring remains locked until the decision package is submitted');

mustContain('displayDashboardThemeV1.css', styles, 'body[data-visual-tab="dashboard"]');
mustContain('displayDashboardThemeV1.css', styles, '.dashboard-v1-shell');
mustContain('displayDashboardThemeV1.css', styles, '.dashboard-active-case');
mustContain('displayDashboardThemeV1.css', styles, '.dashboard-quick-grid');
mustContain('displayDashboardThemeV1.css', styles, '@media (max-width: 560px)');
mustContain('displayDashboardThemeV1.css', styles, '@media (max-width: 380px)');
mustContain('main.jsx', entrypoint, "import './displayDashboardThemeV1.css';");

mustContain('browser-smoke.spec.mjs', browser, 'approved Dashboard resumes the active case without answer leaks');
mustContain('browser-smoke.spec.mjs', browser, "toHaveAttribute('data-visual-tab', 'dashboard')");
mustContain('browser-smoke.spec.mjs', browser, "locator('.dashboard-active-case')");
mustContain('Source of Truth', sourceOfTruth, '`src/displayDashboardThemeV1.css`');
mustContain('Source of Truth', sourceOfTruth, 'Cases redesign');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'SystemAccessLane',
  'position: fixed',
  'overflow-x: auto',
  'overflow-x: scroll',
]) {
  mustNotContain('displayDashboardThemeV1.css', styles, forbidden);
}

for (const forbidden of ['Fraudulent', 'Legitimate', 'Correct answer', 'AI recommendation', 'Red flag', 'Green flag']) {
  mustNotContain('VisualNavigation.jsx Dashboard', navigation, forbidden);
}

if (failures.length) {
  console.error('Dashboard approved-theme v1 smoke check failed. Repair these focused display anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Dashboard approved-theme v1 smoke check passed. The light mobile-first Dashboard, contextual progress, neutral Luna guidance, responsive scope, and protected architecture boundaries remain intact.');
