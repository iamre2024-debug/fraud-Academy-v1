import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const summary = fs.readFileSync(path.join(rootDir, 'src/CaseSummaryCard.jsx'), 'utf8');
const visualApp = fs.readFileSync(path.join(rootDir, 'src/VisualApp.jsx'), 'utf8');
const visualTextCollapse = fs.readFileSync(path.join(rootDir, 'src/VisualTextCollapse.jsx'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required summary direct-collapse anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} still contains a retired summary scanner anchor: ${text}`);
}

mustContain('CaseSummaryCard.jsx', summary, "import DirectCollapsibleText from './DirectCollapsibleText.jsx';");
mustContain('CaseSummaryCard.jsx', summary, '<small>Transaction / payee info</small>');
mustContain('CaseSummaryCard.jsx', summary, '<small>Short summary</small>');
mustContain('CaseSummaryCard.jsx', summary, '{activeCase.transactionInfo ?? activeCase.type}');
mustContain('CaseSummaryCard.jsx', summary, '{activeCase.shortSummary ?? activeCase.queueReason}');
mustContain('VisualApp.jsx', visualApp, '<VisualTextCollapse />');
mustContain('VisualTextCollapse.jsx', visualTextCollapse, 'data-react-text-collapse="retired"');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, 'summary-copy');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, 'querySelectorAll');
mustNotContain('VisualTextCollapse.jsx', visualTextCollapse, 'createPortal');

const summaryWrappers = summary.match(/<DirectCollapsibleText as="strong" lines=\{2\} mobileLines=\{3\}>/g) ?? [];
if (summaryWrappers.length !== 2) {
  failures.push('CaseSummaryCard.jsx must keep exactly two direct strong wrappers for transaction/payee information and the short summary.');
}

if (failures.length) {
  console.error('Summary direct-collapse smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Summary direct-collapse smoke check passed. Case Summary long copy is React-owned and the selector-based compatibility scanner remains inert.');
