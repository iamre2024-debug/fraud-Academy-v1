import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import { getBusiness360Dossier } from '../src/data/business360Dossier.js';
import {
  matchesBusinessIntelSearch,
  normalizeBusinessIntelAddress,
  normalizeBusinessIntelId,
  normalizeBusinessIntelName,
  normalizeBusinessIntelPhone,
  prefillBusinessIntelSearch,
} from '../src/data/businessIntelSearch.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentPath = path.join(rootDir, 'src/MobileIdentityBusinessIntelPages.jsx');
const stylePath = path.join(rootDir, 'src/mobileIdentityBusinessIntelReference.css');
const panelPath = path.join(rootDir, 'src/InvestigationToolPanel.jsx');
const businessPath = path.join(rootDir, 'src/Business360Workspace.jsx');
const missionPath = path.join(rootDir, 'src/MobileMissionWorkspace.jsx');
const mainPath = path.join(rootDir, 'src/main.jsx');
const browserPath = path.join(rootDir, 'tests/identity-business-intel-browser.spec.mjs');

const component = fs.readFileSync(componentPath, 'utf8');
const styles = fs.readFileSync(stylePath, 'utf8');
const panel = fs.readFileSync(panelPath, 'utf8');
const business = fs.readFileSync(businessPath, 'utf8');
const mission = fs.readFileSync(missionPath, 'utf8');
const main = fs.readFileSync(mainPath, 'utf8');
const browser = fs.readFileSync(browserPath, 'utf8');

function fail(message) {
  console.error(`Identity / Business Intel smoke check failed: ${message}`);
  process.exit(1);
}

function requireText(fileName, source, value) {
  if (!source.includes(value)) fail(`${fileName} is missing ${value}.`);
}

for (const marker of [
  'data-identity-intelligence-screen="reference-v1"',
  'data-business-intelligence-screen="reference-v1"',
  'Run People Search',
  'View Full Profile Report',
  'Generate Identity Search Report',
  'Run Business Search',
  'View Detailed Business Intel',
  'Business Source Coverage',
  'Luna debrief is available after submission',
  "markReviewed('Identity Intel / People Search')",
  "markReviewed('Business 360')",
]) {
  requireText('MobileIdentityBusinessIntelPages.jsx', component, marker);
}

for (const marker of [
  '.mission-identity-intel-reference-page',
  '.mission-business-intel-reference-page',
  '.mobile-intel-search-card',
  '.mobile-intel-subject-hero',
  '.mobile-intel-report-workspace',
  '.mobile-business-intel-tabs',
  'min-height: 44px',
  '@media (max-width: 370px)',
  '@media (prefers-reduced-motion: reduce)',
]) {
  requireText('mobileIdentityBusinessIntelReference.css', styles, marker);
}

requireText('InvestigationToolPanel.jsx', panel, 'MobileIdentityIntelligencePage');
requireText('InvestigationToolPanel.jsx', panel, 'mobileMode={mobileMode}');
requireText('Business360Workspace.jsx', business, 'MobileBusinessIntelligencePage');
requireText('Business360Workspace.jsx', business, 'matchesBusinessIntelSearch');
requireText('Business360Workspace.jsx', business, 'prefillBusinessIntelSearch');
requireText('MobileMissionWorkspace.jsx', mission, 'mission-identity-intel-reference-page');
requireText('MobileMissionWorkspace.jsx', mission, 'mission-business-intel-reference-page');
requireText('main.jsx', main, "import './mobileIdentityBusinessIntelReference.css';");
requireText('identity-business-intel-browser.spec.mjs', browser, 'No fictional identity match returned for this search.');
requireText('identity-business-intel-browser.spec.mjs', browser, 'No matching fictional business returned.');
requireText('identity-business-intel-browser.spec.mjs', browser, 'BIZ-STALE-RESULT');

const forbiddenReferenceClaims = [
  '92%',
  'High Confidence',
  'Very Strong Match',
  'Verified Business',
  'Low Risk',
  'AI Verified',
  'TechSphere Solutions',
  'James Carter',
];
for (const value of forbiddenReferenceClaims) {
  if (component.includes(value)) fail(`the mobile component hard-codes the reference claim or placeholder "${value}".`);
}

const retiredFiles = [
  'src/App.jsx',
  'src/AcademyProgress.jsx',
  'src/styles.css',
  'src/records.css',
  'src/desktopCommand.css',
  'src/mobileNeonCardStack.css',
  'src/mobilePanelGuard.css',
  'src/case-summary.css',
  'src/scenarioEngine.css',
  'src/academyProgress.css',
  'src/lunaDebrief.css',
  'src/visualQaPatch.js',
];
for (const file of retiredFiles) {
  if (fs.existsSync(path.join(rootDir, file))) fail(`retired file ${file} was restored.`);
}

const businessCase = createGeneratedCase({
  index: 97242,
  customerType: 'business',
  productType: 'payroll-product',
  workflowType: 'payroll-change-alert',
  difficulty: 'standard',
  evidenceDepth: 'deep',
});
const dossier = getBusiness360Dossier(businessCase);
const { profile } = dossier;

if (normalizeBusinessIntelName('  ACME & TRAINING, LLC ') !== normalizeBusinessIntelName('Acme and Training LLC')) {
  fail('business-name normalization does not handle spacing, punctuation, and ampersands consistently.');
}
if (normalizeBusinessIntelName('Acme Training') === normalizeBusinessIntelName('Acme Training LLC')) {
  fail('business-name normalization drops the legal entity suffix and could create a false collision.');
}
if (normalizeBusinessIntelId('TX-REG 0042') !== normalizeBusinessIntelId('txreg0042')) {
  fail('business-ID normalization does not normalize separators safely.');
}
if (normalizeBusinessIntelPhone('(214) 555-0199') !== normalizeBusinessIntelPhone('214.555.0199')) {
  fail('business-phone normalization does not normalize formatting safely.');
}
if (normalizeBusinessIntelPhone('2145550199') === normalizeBusinessIntelPhone('214555019')) {
  fail('business-phone normalization allows a partial-number collision.');
}
if (normalizeBusinessIntelAddress('120 North Cedar Drive, Suite 4') !== normalizeBusinessIntelAddress('120 N. Cedar Dr Ste 4')) {
  fail('business-address normalization does not normalize common address abbreviations.');
}
if (normalizeBusinessIntelAddress('120 North Cedar Drive') === normalizeBusinessIntelAddress('121 North Cedar Drive')) {
  fail('business-address normalization allows a street-number collision.');
}

const correctIdSearch = {
  mode: 'businessId',
  businessName: profile.legalName.toUpperCase(),
  secondary: String(profile.registrationFileNumber).replace(/-/g, ' '),
};
if (!matchesBusinessIntelSearch(dossier, correctIdSearch)) {
  fail('the exact legal-name and Training Business ID search did not return the dossier.');
}
if (matchesBusinessIntelSearch(dossier, { ...correctIdSearch, businessName: profile.legalName.replace(/\s+(LLC|INC\.?|CORP\.?)$/i, '') })) {
  fail('a legal-name suffix mismatch returned the dossier.');
}

const correctPhoneSearch = {
  mode: 'phone',
  businessName: profile.legalName,
  secondary: normalizeBusinessIntelPhone(profile.phone).replace(/^(\d{3})(\d{3})(\d+)$/, '($1) $2-$3'),
};
if (!matchesBusinessIntelSearch(dossier, correctPhoneSearch)) {
  fail('the exact business-phone search did not return the dossier.');
}
if (matchesBusinessIntelSearch(dossier, { ...correctPhoneSearch, secondary: normalizeBusinessIntelPhone(profile.phone).slice(0, -1) })) {
  fail('a partial business phone returned the dossier.');
}

const correctAddressSearch = {
  mode: 'address',
  businessName: profile.legalName,
  secondary: profile.operatingAddress,
};
if (!matchesBusinessIntelSearch(dossier, correctAddressSearch)) {
  fail('the exact operating-address search did not return the dossier.');
}
if (matchesBusinessIntelSearch(dossier, { ...correctAddressSearch, secondary: `${profile.operatingAddress} extra unit` })) {
  fail('a different operating address returned the dossier.');
}

const prefill = prefillBusinessIntelSearch(dossier, profile.registrationFileNumber);
if (!prefill || prefill.mode !== 'businessId' || !matchesBusinessIntelSearch(dossier, prefill)) {
  fail('a routed Business 360 pin does not restore the original business identifier search.');
}

console.log('Identity / Business Intel smoke check passed.');
