import fs from 'node:fs';
import path from 'node:path';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { trainingCases } from '../src/data/cases.js';
import { getBusiness360Dossier } from '../src/data/business360Dossier.js';
import { getCustomer360Dossier } from '../src/data/customer360Dossier.js';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import { resolvePinnedEvidence } from '../src/pinnedEvidenceNavigation.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const component = read('src/Mobile360ReferencePages.jsx');
const workspace = read('src/MobileMissionWorkspace.jsx');
const businessWorkspace = read('src/Business360Workspace.jsx');
const mobileIntelPages = read('src/MobileIdentityBusinessIntelPages.jsx');
const styles = read('src/mobile360Reference.css');
const relationshipAccounts = read('src/data/relationshipAccounts.js');
const entrypoint = read('src/main.jsx');
const failures = [];

function requireAnchor(label, content, anchor) {
  if (!content.includes(anchor)) failures.push(`${label} is missing: ${anchor}`);
}

function forbid(label, content, pattern) {
  if (pattern.test(content)) failures.push(`${label} contains forbidden coupling: ${pattern}`);
}

for (const anchor of [
  'MobileCustomer360Reference',
  'getCustomer360Dossier',
  'data-mobile-360-screen="customer"',
  'Customer ID',
  'Training ID',
  'Customer profile',
  'Profile updates',
  'Trusted devices & security',
  'Accounts & products',
  'Relationship',
  'Recent contact notes',
  'MobileBusiness360Reference',
  'getBusiness360Dossier',
  'data-mobile-360-screen="business"',
  'Business ID',
  'Masked EIN',
  'Owner address',
  'Business products & accounts',
  'Credit & loans',
  'Payroll overview',
  'Business updates',
  'Recent notes',
  'Luna Business Research',
  'Mobile360Drawer',
  'AccountDetails',
  'OwnerRelationshipRecords',
  'BusinessAccessRecords',
  'Personal accounts',
  'Trusted devices',
  'Contact history',
  'Destination ID',
  'Bank Code',
  'License applicability',
  'License search',
  'QuickPinButton',
]) requireAnchor('Mobile360ReferencePages.jsx', component, anchor);

for (const anchor of [
  "import {",
  'MobileCustomer360Reference',
  'Mobile360LunaBadge',
  '<MobileCustomer360Reference',
  '<InvestigationToolPanel',
  "backToToolMap={() => showWorkspaceScreen('tool-menu')}",
  'mobileMode',
  'data-mobile-360-header',
  'mobile-360-actions-menu',
  'detailRequest={mobile360DetailRequest}',
  'activeToolProps.markReviewed?.(activeTool)',
  'const pinValue = `${mobile360Profile.id} · ${mobile360Profile.name}`',
  'caseId: activeCase.id',
  'tool: activeTool',
  "showWorkspaceScreen('evidence')",
  'Open ${activeTool} actions',
]) requireAnchor('MobileMissionWorkspace.jsx', workspace, anchor);

for (const anchor of [
  'if (mobileMode)',
  '<MobileBusinessIntelligencePage',
  '<MobileBusiness360Reference',
  'business360Content={',
  'submittedSearch',
  'searchMatched',
  'searchReady',
  'runIntelSearch',
  'clearIntelSearch',
  "setQuery?.('')",
  'data-business-intelligence-stage="search"',
  'data-business-intelligence-stage="business-360"',
]) requireAnchor('Business360Workspace.jsx', businessWorkspace, anchor);

for (const anchor of [
  'data-business-intelligence-screen="reference-v1"',
  'Run Business Search',
  'Business Intel hidden until a search is run.',
  'No matching fictional business returned.',
  'Open Business 360',
  'disabled={!searchMatched || !reportOpen}',
  'These are source-return statuses only. They do not score the business or recommend a decision.',
]) requireAnchor('MobileIdentityBusinessIntelPages.jsx', mobileIntelPages, anchor);

if (workspace.includes('<MobileBusiness360Reference')) {
  failures.push('MobileMissionWorkspace.jsx bypasses the required search-first Business Intelligence gate.');
}

for (const anchor of [
  'Dedicated Customer 360 and Business 360 mobile pages',
  'body[data-layout-mode="mobile"] .mobile-360-reference',
  '.mobile-360-pair',
  '.mobile-360-account-grid',
  '.mobile-360-business-contact',
  '.mobile-360-business-activity-pair.single',
  '.mobile-360-owner-record-group',
  '.mobile-360-actions-menu',
  '.mobile-360-drawer',
  '@media (max-width: 360px)',
]) requireAnchor('mobile360Reference.css', styles, anchor);

requireAnchor('main.jsx', entrypoint, "import './mobile360Reference.css';");

for (const anchor of [
  'destinationId',
  'maskedDestinationId',
  'bankCode',
]) requireAnchor('relationshipAccounts.js', relationshipAccounts, anchor);

forbid('Mobile360ReferencePages.jsx', component, /activeCase\.(?:status|alertReason|amount|transactionInfo|scenarioTitle)/);
forbid('Mobile360ReferencePages.jsx', component, /\b(?:Fraud Confirmed|Correct answer|Scenario Truth|Final Finding|risk score|engagement score)\b/i);
forbid('Mobile360ReferencePages.jsx', component, /mobile-360-(?:pin-profile|review|research-entry)/);
forbid('Mobile360ReferencePages.jsx', component, />\s*Open account\s*</);
forbid('mobile360Reference.css', styles, /body\[data-layout-mode="desktop"\]/);
forbid('mobile360Reference.css', styles, /!important/);
forbid('mobile360Reference.css', styles, /\.mobile-360-(?:pin-profile|review|research-entry)\b/);
forbid('MobileIdentityBusinessIntelPages.jsx', mobileIntelPages, /\b(?:High Risk|Low Risk|risk score|fraud score|AI recommendation|caseTruth|correctDetermination|accepted determination)\b/i);

const businessMain = component.slice(component.indexOf('export function MobileBusiness360Reference'));
const mainSectionOrder = [
  'title="Business products & accounts"',
  'title="Credit & loans"',
  'title="Payroll overview"',
  'title="Business updates"',
  'title="Recent notes"',
].map((anchor) => businessMain.indexOf(anchor));
if (mainSectionOrder.some((index) => index < 0)
  || mainSectionOrder.some((index, position) => position > 0 && index <= mainSectionOrder[position - 1])) {
  failures.push('Business 360 main cards must keep products/credit, payroll/updates, then full-width recent notes in reference order.');
}

if (!/\{!has360Header\s*&&\s*!ownsIntelHeader\s*&&\s*!isReviewScreen\s*&&\s*\(\s*<footer className="mission-workspace-status"/s.test(workspace)) {
  failures.push('MobileMissionWorkspace.jsx must hide workspace status chips on direct Customer 360, Intel-owned pages, and focused review screens.');
}

if (!/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(styles)) {
  failures.push('mobile360Reference.css must keep the approved two-column phone card rhythm.');
}

if (!/\.mobile-360-quick-pin\s*\{[^}]*min-height:\s*44px/s.test(styles)) {
  failures.push('Mobile 360 Quick Pad controls must keep a 44px minimum touch target.');
}

function requireContract(condition, message) {
  if (!condition) failures.push(message);
}

const enrichedCases = enrichTrainingCases(trainingCases);
const personalCreditCase = enrichedCases.find((item) => item.id === 'FA-CR-24003');
requireContract(Boolean(personalCreditCase), 'The personal credit-review contract case FA-CR-24003 is missing.');

if (personalCreditCase) {
  const customer = getCustomer360Dossier(personalCreditCase);
  const customerPin = `${customer.identity.trainingId} · ${customer.identity.legalName}`;
  const resolvedCustomerPin = resolvePinnedEvidence(
    customerPin,
    personalCreditCase,
    personalCreditCase.availableTools,
  );

  requireContract(
    customer.identity.legalName === 'Avery Brooks'
      && customer.identity.trainingId === 'TRN-2044-77',
    'Customer 360 must resolve the active FA-CR-24003 customer identity.',
  );
  requireContract(
    customer.relationship.businessRelationships.length === 0
      && !personalCreditCase.availableTools.some((tool) => (
        ['Business 360', 'Employee Profile', 'Payroll History'].includes(tool)
      )),
    'The ordinary personal credit case must not expose a business relationship or payroll-only tools.',
  );
  requireContract(
    resolvedCustomerPin?.tool === 'Customer 360'
      && resolvedCustomerPin.query === 'TRN-2044-77',
    'A Customer 360 profile pin must resolve and reopen the active training identity.',
  );
}

const generatedPayrollCase = enrichTrainingCases([createGeneratedCase({
  index: 99361,
  customerType: 'business',
  productType: 'payroll-product',
  workflowType: 'payroll-change-alert',
  difficulty: 'standard',
  evidenceDepth: 'deep',
})])[0];
const generatedBusiness = getBusiness360Dossier(generatedPayrollCase);
const generatedPin = `${generatedBusiness.profile.registrationFileNumber} | ${generatedBusiness.profile.legalName}`;
const generatedPinRoute = resolvePinnedEvidence(
  generatedPin,
  generatedPayrollCase,
  generatedPayrollCase.availableTools,
);
const reopenedGeneratedBusiness = getBusiness360Dossier(generatedPayrollCase, {
  relationshipId: generatedPinRoute?.query,
});
requireContract(
  generatedBusiness.profile.legalName === generatedPayrollCase.profile.business
    && generatedBusiness.profile.businessId.startsWith('BIZ-')
    && !/@https?:\/\//i.test(generatedBusiness.profile.email)
    && generatedBusiness.owners.length > 0
    && !/not available/i.test(generatedBusiness.owners[0].currentResidentialAddress)
    && generatedBusiness.accounts.length > 0
    && Boolean(generatedBusiness.payrollRelationship),
  'Generated business/payroll cases must keep one complete active-record Business 360 dossier.',
);
requireContract(
  generatedPinRoute?.tool === 'Business 360'
    && generatedPinRoute.query === generatedBusiness.profile.registrationFileNumber
    && reopenedGeneratedBusiness.profile.businessId === generatedBusiness.profile.businessId,
  'Generated Business 360 profile pins must resolve to the displayed business record.',
);

const unrelatedRelationshipCase = {
  ...generatedPayrollCase,
  businessRelationships: [{
    businessId: 'BIZ-OTHER-9001',
    businessName: 'Other Source Record LLC',
    ownershipPercentage: '15%',
  }],
};
const unrelated = getBusiness360Dossier(unrelatedRelationshipCase, {
  relationshipId: 'BIZ-OTHER-9001',
});
requireContract(
  unrelated.profile.legalName === 'Other Source Record LLC'
    && unrelated.accounts.length === 0
    && unrelated.payrollRelationship === null
    && Boolean(unrelated.coverageNotice),
  'A genuinely different linked business must remain an honest source-only dossier.',
);

const switchedCustomerNames = enrichedCases.map((item) => getCustomer360Dossier(item).identity.legalName);
const switchedCustomerNamesAgain = [...enrichedCases]
  .reverse()
  .map((item) => getCustomer360Dossier(item).identity.legalName)
  .reverse();
requireContract(
  switchedCustomerNames.every((name, index) => name === switchedCustomerNamesAgain[index])
    && new Set(switchedCustomerNames).size === enrichedCases.length,
  'Customer 360 selectors must remain active-case scoped after repeated case switching.',
);

if (failures.length) {
  console.error('Mobile 360 reference smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mobile 360 reference smoke check passed. Customer 360 uses its scoped dossier, Business 360 stays search-first, and both preserve active-record and canonical pin contracts.');
