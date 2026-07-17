import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const navigation = fs.readFileSync(path.join(rootDir, 'src/VisualNavigation.jsx'), 'utf8');
const academy = fs.readFileSync(path.join(rootDir, 'src/AcademyThemeV1Panel.jsx'), 'utf8');
const progress = fs.readFileSync(path.join(rootDir, 'src/AcademyProgressPanel.jsx'), 'utf8');
const visualTextCollapse = fs.readFileSync(path.join(rootDir, 'src/VisualTextCollapse.jsx'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required direct-collapse anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} still contains a retired Navigation selector, scanner, or unsafe copy: ${text}`);
}

mustContain('VisualNavigation.jsx', navigation, "import AcademyProgressPanel from './AcademyProgressPanel.jsx';");
mustContain('VisualNavigation.jsx', navigation, "import AcademyThemeV1Panel from './AcademyThemeV1Panel.jsx';");
mustContain('VisualNavigation.jsx', navigation, "import DirectCollapsibleText from './DirectCollapsibleText.jsx';");
mustContain('VisualNavigation.jsx', navigation, 'function NavigationPanel({ activeTab, activeCaseId, cases, snapshot, onNavigate, onOpenCase })');
mustContain('VisualNavigation.jsx', navigation, '<DirectCollapsibleText as="span" lines={2} mobileLines={2}>');
mustContain('VisualNavigation.jsx', navigation, '<AcademyThemeV1Panel');
mustContain('VisualNavigation.jsx', navigation, '<AcademyProgressPanel cases={cases} packagesByCase={snapshot.packagesByCase} onOpenCase={onOpenCase} />');
mustContain('AcademyThemeV1Panel.jsx', academy, "import DirectCollapsibleText from './DirectCollapsibleText.jsx';");
mustContain('AcademyThemeV1Panel.jsx', academy, '<DirectCollapsibleText as="p" lines={3} mobileLines={3}>');
mustContain('AcademyThemeV1Panel.jsx', academy, "onClick={() => onNavigate('progress')}>Open Academy Progress</button>");
mustContain('AcademyProgressPanel.jsx', progress, "import DirectCollapsibleText from './DirectCollapsibleText.jsx';");
mustContain('AcademyProgressPanel.jsx', progress, '<DirectCollapsibleText as="p" lines={2} mobileLines={2}>');
mustContain('AcademyProgressPanel.jsx', progress, 'Submit a decision to save the record and unlock Luna progress.');
mustNotContain('VisualNavigation.jsx', navigation, 'Luna scoring only appears before submission');
mustContain('VisualTextCollapse.jsx', visualTextCollapse, 'data-react-text-collapse="retired"');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, 'COLLAPSE_SELECTOR');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, 'querySelectorAll');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, 'createPortal');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, '.visual-nav-heading span');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, '.nav-learning-grid article p');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, '.nav-progress-list p');

const academyWrappers = academy.match(/<DirectCollapsibleText as="p" lines=\{3\} mobileLines=\{3\}>/g) ?? [];
if (academyWrappers.length < 2) {
  failures.push('AcademyThemeV1Panel.jsx must keep direct paragraph wrappers for the hero and learning-path descriptions.');
}

const progressWrappers = progress.match(/<DirectCollapsibleText as="p" lines=\{2\} mobileLines=\{2\}>/g) ?? [];
if (progressWrappers.length < 1) {
  failures.push('AcademyProgressPanel.jsx must keep a direct paragraph wrapper for package-status copy.');
}

if (failures.length) {
  console.error('Navigation direct-collapse smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Navigation direct-collapse smoke check passed. Navigation heading, approved Academy learning copy, contextual Progress, and package copy are React-owned, the legacy scanner is inert, and Luna progress remains package-gated.');
