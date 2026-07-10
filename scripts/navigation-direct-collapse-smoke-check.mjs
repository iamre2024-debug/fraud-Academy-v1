import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const navigation = fs.readFileSync(path.join(rootDir, 'src/VisualNavigation.jsx'), 'utf8');
const visualTextCollapse = fs.readFileSync(path.join(rootDir, 'src/VisualTextCollapse.jsx'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required direct-collapse anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} still contains retired Progress selector or unsafe copy: ${text}`);
}

mustContain('VisualNavigation.jsx', navigation, "import DirectCollapsibleText from './DirectCollapsibleText.jsx';");
mustContain('VisualNavigation.jsx', navigation, 'function ProgressPanel({ cases, packagesByCase })');
mustContain('VisualNavigation.jsx', navigation, '<DirectCollapsibleText as="p" lines={2} mobileLines={2}>');
mustContain('VisualNavigation.jsx', navigation, "Submit a review package to unlock Luna progress.");
mustNotContain('VisualNavigation.jsx', navigation, 'Luna scoring only appears before submission');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, '.nav-progress-list p');

if (failures.length) {
  console.error('Navigation direct-collapse smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Navigation direct-collapse smoke check passed. Progress text is React-owned, the legacy selector is retired, and Luna progress remains package-gated.');
