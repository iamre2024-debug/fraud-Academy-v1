import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const styles = fs.readFileSync(path.join(rootDir, 'src/finalResponsiveMobilePolish.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/final-responsive-mobile-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_FINAL_RESPONSIVE_MOBILE_POLISH.md'), 'utf8');
const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required final responsive/mobile anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden runtime or persistence coupling: ${text}`);
}

for (const anchor of [
  'Final cross-screen responsive and mobile safety pass',
  'overflow-x: clip',
  'env(safe-area-inset-bottom, 0px)',
  '.visual-header-controls button',
  '.header-panel-close',
  '.summary-actions button',
  '.active-case-workflow-list button',
  '[data-case-briefing-screen="approved-theme-v1"]',
  '[data-customer-360-screen="approved-theme-v1"]',
  '[data-investigation-tools-screen="approved-theme-v1"]',
  '[data-timeline-screen="approved-theme-v1"]',
  '[data-decision-screen="approved-theme-v1"]',
  '[data-luna-screen="approved-theme-v1"]',
  '[data-academy-screen="approved-theme-v1"]',
  '[data-profile-screen="approved-theme-v1"]',
  '[data-cases-theme-v1="approved"]',
  'min-height: 44px',
  'font-size: 16px',
  '@media (max-width: 820px)',
  '@media (max-width: 620px)',
  '@media (max-width: 390px)',
  '@media (prefers-reduced-motion: reduce)',
]) mustContain('finalResponsiveMobilePolish.css', styles, anchor);

mustContain('main.jsx', entrypoint, "import './finalResponsiveMobilePolish.css';");

for (const anchor of [
  'final responsive and mobile audit covers every approved screen without layout or Evidence First regressions',
  'Workspace and Case Briefing',
  'Customer 360',
  'Investigation tools',
  'Timeline',
  'Decision and locked Luna',
  'Dashboard',
  'Cases',
  'Academy',
  'Profile',
  'Academy Progress',
  "projectName === 'mobile-chromium'",
  'toBeGreaterThanOrEqual(44)',
  'toBeLessThanOrEqual(snapshot.viewportWidth + 1)',
  'forbiddenPreSubmissionCopy',
]) mustContain('final-responsive-mobile-browser.spec.mjs', browser, anchor);

mustContain('Final responsive/mobile handoff', handoff, 'agent/final-responsive-mobile-polish');
mustContain('Final responsive/mobile handoff', handoff, 'all listed screens are complete');
mustContain('Final responsive/mobile handoff', handoff, 'No further redesign screen remains');
mustContain('package.json', packageJson, 'final-responsive-mobile-polish-smoke-check');
mustContain('build.yml', workflow, 'Final responsive/mobile polish smoke check');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'sessionStorage',
  'SystemAccessLane',
  'setItem(',
  'removeItem(',
]) mustNotContain('finalResponsiveMobilePolish.css', styles, forbidden);

if (failures.length) {
  console.error('Final responsive/mobile polish smoke check failed. Repair these cross-screen safety anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Final responsive/mobile polish smoke check passed. Cross-screen width safety, safe-area spacing, 44-pixel mobile controls, text wrapping, desktop/Pixel 7 coverage, Evidence First wording, and protected architecture boundaries remain intact.');
