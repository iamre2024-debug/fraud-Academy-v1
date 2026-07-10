import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const navigation = fs.readFileSync(path.join(rootDir, 'src/VisualNavigation.jsx'), 'utf8');
const visualApp = fs.readFileSync(path.join(rootDir, 'src/VisualApp.jsx'), 'utf8');
const legacyCollapsePath = path.join(rootDir, 'src/VisualTextCollapse.jsx');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required direct-collapse anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} still contains a retired Navigation selector, legacy mount, or unsafe copy: ${text}`);
}

mustContain('VisualNavigation.jsx', navigation, "import DirectCollapsibleText from './DirectCollapsibleText.jsx';");
mustContain('VisualNavigation.jsx', navigation, 'function NavigationPanel({ activeTab, cases, snapshot, onNavigate, onOpenCase })');
mustContain('VisualNavigation.jsx', navigation, '<DirectCollapsibleText as="span" lines={2} mobileLines={2}>');
mustContain('VisualNavigation.jsx', navigation, 'function AcademyPanel()');
mustContain('VisualNavigation.jsx', navigation, '{detail}');
mustContain('VisualNavigation.jsx', navigation, 'function ProgressPanel({ cases, packagesByCase })');
mustContain('VisualNavigation.jsx', navigation, 'Submit a review package to unlock Luna progress.');
mustNotContain('VisualNavigation.jsx', navigation, 'Luna scoring only appears before submission');
mustNotContain('VisualApp.jsx', visualApp, 'VisualTextCollapse');

if (fs.existsSync(legacyCollapsePath)) {
  failures.push('src/VisualTextCollapse.jsx must remain retired now that all compact text is React-owned.');
}

const directParagraphWrappers = navigation.match(/<DirectCollapsibleText as="p" lines=\{2\} mobileLines=\{2\}>/g) ?? [];
if (directParagraphWrappers.length < 2) {
  failures.push('VisualNavigation.jsx must keep direct paragraph wrappers for both Academy learning copy and Progress package status.');
}

if (failures.length) {
  console.error('Navigation direct-collapse smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Navigation direct-collapse smoke check passed. Heading, Academy learning, and Progress copy are React-owned, the legacy collapse mount is retired, and Luna progress remains package-gated.');
