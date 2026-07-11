import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const styles = fs.readFileSync(path.join(rootDir, 'src/displayFinalResponsivePolishV1.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/final-responsive-polish-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_FINAL_RESPONSIVE_POLISH_V1.md'), 'utf8');
const navigation = fs.readFileSync(path.join(rootDir, 'src/VisualNavigation.jsx'), 'utf8');
const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required final responsive/mobile anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden final responsive/mobile coupling: ${text}`);
}

for (const anchor of [
  'html,',
  'body[data-visual-tab] .visual-os-shell',
  'body[data-visual-tab] .visual-os-frame',
  'body[data-visual-tab] .visual-react-bottom-nav',
  'env(safe-area-inset-bottom)',
  '@media (max-width: 760px)',
  '@media (max-width: 430px)',
  '@media (max-width: 350px)',
  '@media (prefers-reduced-motion: reduce)',
  'min-height: 44px',
  'overflow-wrap: anywhere',
  'overflow-x: clip',
]) {
  mustContain('displayFinalResponsivePolishV1.css', styles, anchor);
}

for (const forbidden of [
  'localStorage',
  'indexedDB',
  'generatedCaseRepository',
  'position: fixed',
  'display: none',
  'SystemAccessLane',
]) {
  mustNotContain('displayFinalResponsivePolishV1.css', styles, forbidden);
}

mustContain('main.jsx', entrypoint, "import './displayFinalResponsivePolishV1.css';");
mustContain('final responsive browser test', browser, "{ width: 350, height: 740 }");
mustContain('final responsive browser test', browser, "{ width: 1440, height: 1000 }");
mustContain('final responsive browser test', browser, "expect(navMetrics.count).toBe(4)");
mustContain('final responsive browser test', browser, "expect(navMetrics.minButtonHeight).toBeGreaterThanOrEqual(44)");
mustContain('final responsive browser test', browser, "[data-profile-screen=\"approved-theme-v1\"]");
mustContain('final responsive browser test', browser, "[data-academy-screen=\"approved-theme-v1\"]");
mustContain('final responsive handoff', handoff, 'final responsive/mobile polish only');
mustContain('final responsive handoff', handoff, 'Do not make further display changes unless a new approved scope is opened.');
mustContain('VisualNavigation.jsx', navigation, "{ key: 'dashboard'");
mustContain('VisualNavigation.jsx', navigation, "{ key: 'cases'");
mustContain('VisualNavigation.jsx', navigation, "{ key: 'workspace'");
mustContain('VisualNavigation.jsx', navigation, "{ key: 'academy'");
mustNotContain('VisualNavigation.jsx navigationItems', navigation.match(/const navigationItems = \[([\s\S]*?)\n\];/)?.[1] ?? '', "key: 'profile'");
mustNotContain('VisualNavigation.jsx navigationItems', navigation.match(/const navigationItems = \[([\s\S]*?)\n\];/)?.[1] ?? '', "key: 'progress'");
mustContain('package.json', packageJson, 'final-responsive-polish-v1-smoke-check');
mustContain('build workflow', workflow, 'Final responsive and mobile polish v1 smoke check');

if (failures.length) {
  console.error('Final responsive/mobile polish v1 smoke check failed. Repair these cross-screen safety anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Final responsive/mobile polish v1 smoke check passed. Cross-screen containment, compact-phone and wide-desktop coverage, safe-area navigation, touch targets, four-item navigation, and protected architecture remain intact.');
