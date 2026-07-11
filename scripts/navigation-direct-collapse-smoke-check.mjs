import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const navigation = fs.readFileSync(path.join(rootDir, 'src/VisualNavigation.jsx'), 'utf8');
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
mustContain('VisualNavigation.jsx', navigation, "import DirectCollapsibleText from './DirectCollapsibleText.jsx';");
mustContain('VisualNavigation.jsx', navigation, 'function NavigationPanel({ activeTab, cases, snapshot, onNavigate, onOpenCase })');
mustContain('VisualNavigation.jsx', navigation, '<DirectCollapsibleText as="span" lines={2} mobileLines={2}>');
mustContain('VisualNavigation.jsx', navigation, 'function AcademyPanel()');
mustContain('VisualNavigation.jsx', navigation, '{detail}');
mustContain('VisualNavigation.jsx', navigation, '<AcademyProgressPanel cases={cases} packagesByCase={snapshot.packagesByCase} onOpenCase={onOpenCase} />');
mustContain('AcademyProgressPanel.jsx', progress, "import DirectCollapsibleText from './DirectCollapsibleText.jsx';");
mustContain('AcademyProgressPanel.jsx', progress, '<DirectCollapsibleText as="p" lines={2} mobileLines={2}>');
mustContain('AcademyProgressPanel.jsx', progress, 'Submit a review package to unlock Luna progress.');
mustNotContain('VisualNavigation.jsx', navigation, 'Luna scoring only appears before submission');
mustContain('VisualTextCollapse.jsx', visualTextCollapse, 'data-react-text-collapse="retired"');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, 'COLLAPSE_SELECTOR');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, 'querySelectorAll');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, 'createPortal');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, '.visual-nav-heading span');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, '.nav-learning-grid article p');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, '.nav-progress-list p');

const academyWrappers = navigation.match(/<DirectCollapsibleText as="p" lines=\{2\} mobileLines=\{2\}>/g) ?? [];
if (academyWrappers.length < 1) {
  failures.push('VisualNavigation.jsx must keep a direct paragraph wrapper for Academy learning copy.');
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

console.log('Navigation direct-collapse smoke check passed. Heading, Academy learning, and Progress copy are React-owned, the legacy scanner is inert, and Luna progress remains package-gated.');
