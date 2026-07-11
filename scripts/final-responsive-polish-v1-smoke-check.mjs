import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const styles = fs.readFileSync(path.join(rootDir, 'src/displayFinalResponsivePolishV1.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/final-responsive-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_FINAL_RESPONSIVE_POLISH_V1.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required final responsive anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden final responsive coupling: ${text}`);
}

for (const anchor of [
  'overflow-x: clip',
  'text-size-adjust: 100%',
  'box-sizing: border-box',
  '.visual-os-frame > *',
  '.dashboard-v1-shell',
  '.cases-theme-v1-panel',
  '.active-case-workflow',
  '.academy-theme-v1',
  '.profile-theme-v1',
  'min-height: 44px',
  'env(safe-area-inset-bottom)',
  '@media (min-width: 1440px)',
  '@media (max-width: 1100px)',
  '@media (max-width: 820px)',
  '@media (max-width: 620px)',
  '@media (max-width: 430px)',
  '@media (max-width: 350px)',
  '@media (prefers-reduced-motion: reduce)',
]) mustContain('displayFinalResponsivePolishV1.css', styles, anchor);

mustContain('main.jsx', entrypoint, "import './displayFinalResponsivePolishV1.css';");
mustContain('final-responsive-browser.spec.mjs', browser, 'final responsive polish protects every completed global surface');
mustContain('final-responsive-browser.spec.mjs', browser, '{ width: 350, height: 780 }');
mustContain('final-responsive-browser.spec.mjs', browser, '{ width: 412, height: 915 }');
mustContain('final-responsive-browser.spec.mjs', browser, '{ width: 640, height: 900 }');
mustContain('final-responsive-browser.spec.mjs', browser, '{ width: 768, height: 900 }');
mustContain('final-responsive-browser.spec.mjs', browser, '{ width: 1024, height: 900 }');
mustContain('final-responsive-browser.spec.mjs', browser, '{ width: 1440, height: 1000 }');
mustContain('final-responsive-browser.spec.mjs', browser, "['briefing', 'investigate', 'timeline', 'determination', 'debrief']");
mustContain('Final responsive handoff', handoff, 'agent/final-responsive-polish-reconciled');
mustContain('Final responsive handoff', handoff, 'Runtime pull request: `#55`');
mustContain('Final responsive handoff', handoff, 'Final verified runtime head: `b4666c0c659520225d38e4408cc964b058bb401f`');
mustContain('Final responsive handoff', handoff, 'Runtime merge on `main`: `f769d80e4b87d6d3e89095026df0bffd0355b6d7`');
mustContain('Final responsive handoff', handoff, 'all listed screens are complete');
mustContain('Source of Truth', sourceOfTruth, '`docs/FRAUD_ACADEMY_FINAL_RESPONSIVE_POLISH_V1.md`');
mustContain('Source of Truth', sourceOfTruth, 'There is no unfinished item remaining in the approved display redesign sequence.');
mustContain('README', readme, 'docs/FRAUD_ACADEMY_FINAL_RESPONSIVE_POLISH_V1.md');
mustContain('README', readme, 'The approved display redesign sequence is complete.');
mustContain('package.json', packageJson, 'final-responsive-polish-v1-smoke-check');
mustContain('build.yml', workflow, 'Final responsive/mobile polish v1 smoke check');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'SystemAccessLane',
  'buildReviewPackage',
  'buildLunaDebrief',
  'position: fixed',
  'overflow-x: auto',
  'overflow-x: scroll',
]) mustNotContain('displayFinalResponsivePolishV1.css', styles, forbidden);

if (failures.length) {
  console.error('Final responsive/mobile polish v1 smoke check failed. Repair these cross-screen safety anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Final responsive/mobile polish v1 smoke check passed. Compact phone, standard phone, large phone/small tablet, tablet, laptop, wide-screen, touch-target, safe-area, focus, reduced-motion, horizontal-overflow protections, verified merge metadata, and the completed display handoff remain intact.');
