import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const panel = fs.readFileSync(path.join(rootDir, 'src/InvestigationToolPanel.jsx'), 'utf8');
const panelStyles = fs.readFileSync(path.join(rootDir, 'src/displayInvestigationToolsThemeV1.css'), 'utf8');
const viewportStyles = fs.readFileSync(path.join(rootDir, 'src/displayFinalResponsivePolishV1.css'), 'utf8');
const mobileStyles = fs.readFileSync(path.join(rootDir, 'src/mobileMissionDeckV3.css'), 'utf8');
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

mustContain('InvestigationToolPanel.jsx', panel, 'data-investigation-tools-screen="approved-theme-v1"');
mustContain('InvestigationToolPanel.jsx', panel, 'buildCoreToolRecords');
mustContain('InvestigationToolPanel.jsx', panel, 'investigation-tool-record-card');
mustContain('InvestigationToolPanel.jsx', panel, 'investigation-tool-field-grid');
mustContain('InvestigationToolPanel.jsx', panel, 'aria-label={`Pin ${row.pin}`}');
mustContain('InvestigationToolPanel.jsx', panel, 'investigation-tool-empty');
mustContain('displayInvestigationToolsThemeV1.css', panelStyles, '.investigation-tools-theme-v1 *');
mustContain('displayInvestigationToolsThemeV1.css', panelStyles, 'box-sizing: border-box;');
mustContain('displayInvestigationToolsThemeV1.css', panelStyles, '@media (max-width: 960px)');
mustContain('displayInvestigationToolsThemeV1.css', panelStyles, '@media (max-width: 720px)');
mustContain('displayInvestigationToolsThemeV1.css', panelStyles, '@media (max-width: 430px)');
mustContain('displayInvestigationToolsThemeV1.css', panelStyles, '.investigation-tool-workspace');
mustContain('displayInvestigationToolsThemeV1.css', panelStyles, '.investigation-tool-record-card dl');
mustContain('displayInvestigationToolsThemeV1.css', panelStyles, 'grid-template-columns: minmax(0, 1fr);');
mustContain('displayFinalResponsivePolishV1.css', viewportStyles, '.visual-os-shell *');
mustContain('displayFinalResponsivePolishV1.css', viewportStyles, 'overflow-x: clip;');
mustContain('displayFinalResponsivePolishV1.css', viewportStyles, 'overflow-wrap: anywhere;');
mustContain('displayFinalResponsivePolishV1.css', viewportStyles, 'min-height: 44px;');
mustContain('mobileMissionDeckV3.css', mobileStyles, '.mission-tool-content > .activity-panel');
mustContain('mobileMissionDeckV3.css', mobileStyles, '.investigation-tool-field-grid) { grid-template-columns: 1fr; }');
mustNotContain('main.jsx', entrypoint, "import './displayPhaseFour.css';");
if (fs.existsSync(path.join(rootDir, 'src/displayPhaseFour.css'))) {
  failures.push('Retired displayPhaseFour.css compatibility layer still exists.');
}

mustContain('browser-smoke.spec.mjs', browser, 'responsive investigation records stay inside the viewport');
mustContain('browser-smoke.spec.mjs', browser, 'panelFits: withinViewport(panelElement)');
mustContain('browser-smoke.spec.mjs', browser, 'summaryOverflow: summaryElement.scrollWidth - summaryElement.clientWidth');
mustContain('browser-smoke.spec.mjs', browser, "testInfo.project.name === 'mobile-chromium'");
mustContain('browser-smoke.spec.mjs', browser, 'fieldColumns: fieldGrid ? getComputedStyle(fieldGrid).gridTemplateColumns');

mustContain('Display Handoff', displayHandoff, 'Completed in the focused responsive-record change:');
mustContain('Display Handoff', displayHandoff, 'The original `src/displayPhaseFour.css` compatibility layer is retired');
mustContain('Source of Truth', sourceOfTruth, '`src/displayInvestigationToolsThemeV1.css` owns the active desktop and compact-width record-card presentation');

for (const forbidden of [
  'generatedCaseRepository',
  'indexedDB',
  'localStorage',
  'SystemAccessLane',
  'position: fixed',
]) {
  mustNotContain('displayInvestigationToolsThemeV1.css', panelStyles, forbidden);
}

for (const forbidden of ['Fraudulent', 'Legitimate', 'Correct answer', 'AI recommendation', 'Red flag', 'Green flag']) {
  mustNotContain('InvestigationToolPanel.jsx', panel, forbidden);
}

if (failures.length) {
  console.error('Display Phase 4 smoke check failed. Repair these responsive-record anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Display Phase 4 smoke check passed. The retired table compatibility layer stays absent, active record cards retain responsive width protections, and protected investigation behavior remains intact.');
