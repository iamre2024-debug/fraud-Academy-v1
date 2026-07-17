import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const navigation = fs.readFileSync(path.join(rootDir, 'src/VisualNavigation.jsx'), 'utf8');
const progress = fs.readFileSync(path.join(rootDir, 'src/AcademyProgressPanel.jsx'), 'utf8');
const visualTextCollapse = fs.readFileSync(path.join(rootDir, 'src/VisualTextCollapse.jsx'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Academy Progress anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.toLowerCase().includes(text.toLowerCase())) failures.push(`${fileLabel} contains unsafe or retired Academy Progress copy: ${text}`);
}

mustContain('VisualNavigation.jsx', navigation, "import AcademyProgressPanel from './AcademyProgressPanel.jsx';");
mustContain('VisualNavigation.jsx', navigation, "window.addEventListener('fraud-academy:package-saved', refresh);");
mustContain('VisualNavigation.jsx', navigation, '<AcademyProgressPanel cases={cases} packagesByCase={snapshot.packagesByCase} onOpenCase={onOpenCase} />');

mustContain('AcademyProgressPanel.jsx', progress, "import DirectCollapsibleText from './DirectCollapsibleText.jsx';");
mustContain('AcademyProgressPanel.jsx', progress, 'Submit a decision to save the record and unlock Luna progress.');
mustContain('AcademyProgressPanel.jsx', progress, 'Luna debrief is available for this case.');
mustContain('AcademyProgressPanel.jsx', progress, 'reviewPackage.reviewedRequired');
mustContain('AcademyProgressPanel.jsx', progress, 'reviewPackage.pinnedEvidence?.length');
mustContain('AcademyProgressPanel.jsx', progress, 'reviewPackage.noteSnapshot?.length');
mustContain('AcademyProgressPanel.jsx', progress, 'onClick={() => onOpenCase(item.id)}');
mustContain('AcademyProgressPanel.jsx', progress, '<DirectCollapsibleText as="p" lines={2} mobileLines={2}>');

mustNotContain('AcademyProgressPanel.jsx', progress, 'fraud score');
mustNotContain('AcademyProgressPanel.jsx', progress, 'correct answer');
mustNotContain('AcademyProgressPanel.jsx', progress, 'red flag');
mustNotContain('AcademyProgressPanel.jsx', progress, 'green flag');
mustNotContain('AcademyProgressPanel.jsx', progress, 'AI recommendation');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, '.nav-progress-list p');

if (failures.length) {
  console.error('Academy Progress smoke check failed. Repair these package-flow anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Academy Progress smoke check passed. Saved-package snapshots refresh through React, locked cases stay neutral, and Luna remains post-submission only.');
