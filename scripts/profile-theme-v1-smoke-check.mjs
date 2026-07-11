import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const panel = fs.readFileSync(path.join(rootDir, 'src/ProfileThemeV1Panel.jsx'), 'utf8');
const navigation = fs.readFileSync(path.join(rootDir, 'src/VisualNavigation.jsx'), 'utf8');
const header = fs.readFileSync(path.join(rootDir, 'src/VisualShellHeader.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayProfileThemeV1.css'), 'utf8');
const safetyStyles = fs.readFileSync(path.join(rootDir, 'src/displayProfileThemeV1Safety.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/profile-browser.spec.mjs'), 'utf8');
const handoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_PROFILE_THEME_V1.md'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Profile v1 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Profile coupling or visible answer language: ${text}`);
}

for (const anchor of [
  'data-profile-screen="approved-theme-v1"',
  'Agent profile',
  'Learner Agent',
  'Skill proficiency',
  'Investigation milestones',
  'Activity summary',
  'Complete the active case package',
  'Activity-based development tracks investigation habits only.',
  'These percentages reflect completed learning activity, not hidden case correctness or a pre-submission risk score.',
  'Open Academy Progress',
  'Return to Academy',
  'Continue active case',
  'snapshot.packagesByCase',
  'snapshot.completedByCase',
  'snapshot.notesByCase',
  'snapshot.packetsByCase',
]) mustContain('ProfileThemeV1Panel.jsx', panel, anchor);

for (const anchor of [
  "import ProfileThemeV1Panel from './ProfileThemeV1Panel.jsx';",
  "activeTab === 'profile'",
  '<ProfileThemeV1Panel',
  'className="visual-nav-profile-entry"',
  "onNavigate('profile')",
  "{ key: 'dashboard'",
  "{ key: 'cases'",
  "{ key: 'workspace'",
  "{ key: 'academy'",
]) mustContain('VisualNavigation.jsx', navigation, anchor);

for (const anchor of [
  'aria-label="Open Agent profile"',
  "onClick={() => navigate('profile')}",
  "activeControl === 'help'",
  "activeControl === 'settings'",
]) mustContain('VisualShellHeader.jsx', header, anchor);

for (const anchor of [
  'body[data-visual-tab="profile"]',
  '.visual-nav-profile-entry',
  '.profile-theme-v1',
  '.profile-hero',
  '.profile-stat-grid',
  '.profile-main-grid',
  '.profile-skill-list',
  '.profile-badge-grid',
  '.profile-goal-grid',
  '@media (max-width: 980px)',
  '@media (max-width: 720px)',
  '@media (max-width: 520px)',
  '@media (max-width: 360px)',
]) mustContain('displayProfileThemeV1.css', styles, anchor);

for (const anchor of [
  'body[data-visual-tab="profile"] .visual-os-shell',
  'body[data-visual-tab="profile"] .visual-os-frame',
  'body[data-visual-tab="profile"] .visual-hero',
  'body[data-visual-tab="profile"] .generated-case-control-host',
  'body[data-visual-tab="profile"] .active-case-workflow',
  'body[data-visual-tab="profile"] .workflow-investigate-stage',
  'body[data-visual-tab="profile"] .visual-react-bottom-nav',
  '@media (max-width: 560px)',
]) mustContain('displayProfileThemeV1Safety.css', safetyStyles, anchor);

mustContain('main.jsx', entrypoint, "import './displayProfileThemeV1.css';");
mustContain('main.jsx', entrypoint, "import './displayProfileThemeV1Safety.css';");
mustContain('profile-browser.spec.mjs', browser, 'approved Profile opens from the agent avatar and preserves neutral responsive development metrics');
mustContain('profile-browser.spec.mjs', browser, 'mobile-chromium');
mustContain('profile-browser.spec.mjs', browser, 'panelOverflow');
mustContain('profile-browser.spec.mjs', browser, 'toBeLessThanOrEqual(4)');
mustContain('Profile handoff', handoff, 'agent/profile-approved-theme-v1');
mustContain('Profile handoff', handoff, 'Final verified Profile runtime head: `000c90b87984d41cd01a093a790457fb187ec7a3`');
mustContain('Profile handoff', handoff, 'Profile runtime merge on `main`: `01e25967098594dbe67d4c523d12fe249e810564`');
mustContain('Profile handoff', handoff, 'final responsive/mobile polish only');
mustContain('Source of Truth', sourceOfTruth, '`docs/FRAUD_ACADEMY_PROFILE_THEME_V1.md`');
mustContain('Source of Truth', sourceOfTruth, 'Decision & Luna, Academy, and Profile are the completed approved replacements');
mustContain('Source of Truth', sourceOfTruth, 'There is no unfinished item remaining in the approved display redesign sequence.');
mustContain('README', readme, 'docs/FRAUD_ACADEMY_PROFILE_THEME_V1.md');
mustContain('README', readme, 'The approved display redesign sequence is complete.');
mustContain('package.json', packageJson, 'profile-theme-v1-smoke-check');
mustContain('build.yml', workflow, 'Profile approved-theme v1 smoke check');

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
  mustNotContain('ProfileThemeV1Panel.jsx', panel, forbidden);
  mustNotContain('displayProfileThemeV1.css', styles, forbidden);
  mustNotContain('displayProfileThemeV1Safety.css', safetyStyles, forbidden);
}

for (const forbidden of [
  'Fraudulent',
  'Legitimate',
  'Correct answer',
  'AI recommendation',
  'Red flag',
  'Green flag',
  'Fraud score',
  'Package strengths',
  'Next coaching focus',
]) mustNotContain('ProfileThemeV1Panel.jsx visible copy', panel, forbidden);

if (failures.length) {
  console.error('Profile approved-theme v1 smoke check failed. Repair these focused Profile anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Profile approved-theme v1 smoke check passed. The avatar-owned profile route, neutral skill development, badges, activity summary, case-scoped goals, responsive safety, existing persistence boundaries, and final-polish-only handoff remain intact.');
