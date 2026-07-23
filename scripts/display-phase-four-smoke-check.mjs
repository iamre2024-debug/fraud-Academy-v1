import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const panel = fs.readFileSync(path.join(rootDir, 'src/ActiveToolPanel.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayPhaseFour.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/browser-smoke.spec.mjs'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const displayHandoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_DISPLAY_HANDOFF.md'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Phase 4 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Phase 4 coupling: ${text}`);
}

mustContain('ActiveToolPanel.jsx', panel, 'role="table"');
mustContain('ActiveToolPanel.jsx', panel, 'role="columnheader"');
mustContain('ActiveToolPanel.jsx', panel, 'role="cell"');
mustContain('ActiveToolPanel.jsx', panel, 'data-field={displayData.columns[index]');
mustContain('ActiveToolPanel.jsx', panel, 'data-record-id={row.id}');
mustContain('ActiveToolPanel.jsx', panel, 'aria-label={`Pin ${row.id}`}');
mustContain('ActiveToolPanel.jsx', panel, 'activity-empty-state');

mustContain('displayPhaseFour.css', styles, '@media (max-width: 760px)');
mustContain('displayPhaseFour.css', styles, '.activity-row.table-head');
mustContain('displayPhaseFour.css', styles, 'display: none;');
mustContain('displayPhaseFour.css', styles, 'content: attr(data-field);');
mustContain('displayPhaseFour.css', styles, '.activity-row:not(.table-head)');
mustContain('displayPhaseFour.css', styles, 'position: static;');
mustContain('displayPhaseFour.css', styles, 'box-sizing: border-box;');
mustContain('displayPhaseFour.css', styles, '@media (max-width: 420px)');
mustContain('main.jsx', entrypoint, "import './displayPhaseFour.css';");

mustContain('browser-smoke.spec.mjs', browser, 'responsive investigation records stay inside the viewport');
mustContain('browser-smoke.spec.mjs', browser, 'panelFits: withinViewport(panelElement)');
mustContain('browser-smoke.spec.mjs', browser, 'summaryOverflow: summaryElement.scrollWidth - summaryElement.clientWidth');
mustContain('browser-smoke.spec.mjs', browser, "testInfo.project.name === 'mobile-chromium'");
mustContain('browser-smoke.spec.mjs', browser, 'fieldColumns: fieldGrid ? getComputedStyle(fieldGrid).gridTemplateColumns');

mustContain('Display Handoff', displayHandoff, 'Completed in the focused responsive-record change:');
mustContain('Source of Truth', sourceOfTruth, '`src/displayPhaseFour.css`');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'SystemAccessLane',
  'position: fixed',
  'overflow-x: auto',
  'overflow-x: scroll',
]) {
  mustNotContain('displayPhaseFour.css', styles, forbidden);
}

for (const forbidden of ['Fraudulent', 'Legitimate', 'Correct answer', 'AI recommendation', 'Red flag', 'Green flag']) {
  mustNotContain('ActiveToolPanel.jsx', panel, forbidden);
}

if (failures.length) {
  console.error('Display Phase 4 smoke check failed. Repair these responsive-record anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Display Phase 4 smoke check passed. Legacy dense records retain labeled mobile-card behavior, approved Investigation-tool records stay within the viewport, and protected investigation behavior remains intact.');
