import fs from 'node:fs';
import { trainingCases } from '../src/data/cases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { getLinkedRelationships } from '../src/data/linkAnalysisRelationships.js';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const model = read('src/visualWorkspaceModel.js');
const state = read('src/useVisualWorkspaceCaseState.js');
const workspace = read('src/VisualWorkspace.jsx');
const customer = read('src/Customer360Panel.jsx');
const device = read('src/InvestigationToolPanel.jsx');
const component = read('src/CaseQuickPad.jsx');
const styles = read('src/caseQuickPad.css');
const mobileStyles = read('src/mobileReferenceTheme.css');
const mobilePins = read('src/MobileToolQuickPins.jsx');
const mobileWorkspace = read('src/MobileMissionWorkspace.jsx');
const linkAnalysis = read('src/MobileLinkAnalysisPanel.jsx');
const paymentWorkspace = read('src/InvestigationToolPanel.jsx');
const cases = enrichTrainingCases(trainingCases);
const chargebackCase = cases.find((item) => item.id === 'FA-CB-24007');
const accountLevelLinks = getLinkedRelationships(
  cases,
  'destination',
  'DST-CARD-8841',
  chargebackCase.id,
);
const profileLevelLinks = getLinkedRelationships(
  cases,
  'phone',
  chargebackCase.customer.contact.phone,
  chargebackCase.id,
);

const checks = [
  ['Quick Pad has its own persisted storage key', model.includes("quickPad: 'fraud-academy-quick-pad-v1'")],
  ['Quick Pad state is scoped by active case', state.includes('quickPadByCase[caseId]')],
  ['Quick IDs remain separate from pinned evidence', workspace.includes("recordAction('Saved to Quick Pad'") && !component.includes('Pinned Evidence')],
  ['Quick Pad renders for both workspace layouts', (workspace.match(/\{quickPadLayer\}/g) ?? []).length === 2],
  ['Only structured saved values can populate a supported search', workspace.includes('setQuery(item.queryHint)') && component.includes('canUseItem(item) &&')],
  ['Only supported saved records expose an open action', workspace.includes("item.openAction === 'source-query'") && workspace.includes("item.openAction === 'related-account'") && component.includes('canOpenItem(item) &&')],
  ['Account IDs can be added from Customer 360', customer.includes("label: 'Account ID'")],
  ['Bank and destination IDs can be added', customer.includes("label: 'Bank Code'") && customer.includes("label: 'Destination ID'")],
  ['Device IDs can be added', device.includes("label: 'Device ID'")],
  ['Supported tool IDs have mobile Quick Pad actions', ['Customer ID', 'Training ID', 'Business ID', 'Employee ID', 'Bank Code', 'Destination ID', 'Phone number', 'Email', 'Device ID', 'IP address', 'Merchant ID', 'Transaction ID', 'Case ID'].every((label) => mobilePins.includes(`label: '${label}'`))],
  ['Link results can be saved without becoming evidence', linkAnalysis.includes('Quick Pad account') && !linkAnalysis.includes('pinEvidence')],
  ['Link account pins retain their related-case target', linkAnalysis.includes("openAction: 'related-account'") && linkAnalysis.includes('relatedCaseId: relationship.caseId')],
  ['Payment identifiers retain a structured lookup hint', paymentWorkspace.includes('activeLookupHint') && paymentWorkspace.includes("openTargetTool: 'Payment Verification'")],
  ['Generic overflow shortcuts cannot expose hidden or stale records', !mobileWorkspace.includes('<MobileToolQuickPins')],
  ['Account-level Link Analysis does not fan one match across every product', accountLevelLinks.length === 1 && accountLevelLinks[0].scope === 'account' && accountLevelLinks[0].accountId === 'CARD-8841'],
  ['Profile identifiers remain profile-level instead of inflating account totals', profileLevelLinks.length === 1 && profileLevelLinks[0].scope === 'profile' && !profileLevelLinks[0].accountId],
  ['Scratch text can become a formal case note', workspace.includes("saveNote(quickPad.scratch, 'Quick Pad note')")],
  ['Quick Pad reports auto-save and last-saved state', component.includes('Auto-save ready') && component.includes('Last saved')],
  ['Case notes and investigator notebook remain separate', component.includes('Investigator-wide notebook archive') && component.includes("agentNotebookKey = 'fraud-academy-agent-notepad-v1'")],
  ['Quick Pad responds to the visual viewport keyboard inset', component.includes('window.visualViewport') && mobileStyles.includes('--quick-pad-keyboard-inset')],
  ['Opening and closing preserve page scroll', component.includes('scrollPositionRef') && component.includes('window.scrollTo')],
  ['Expanded panel reserves investigation viewport space', component.includes('--quick-pad-open-reserved-height') && mobileStyles.includes('var(--quick-pad-open-reserved-height')],
  ['Every saved ID offers copy and unpin while record actions are capability-gated', ['Copy', 'Unpin', 'canOpenItem(item) &&'].every((label) => component.includes(label))],
  ['Panel stays compact on phones', styles.includes('max-height: min(300px, 36dvh)')],
  ['Panel clears the fixed mobile dock', styles.includes('bottom: calc(88px + env(safe-area-inset-bottom))')],
  ['Reference theme keeps the charm above the six-tab safe-area dock', mobileStyles.includes('bottom:calc(var(--fa-dock-height)') && mobileStyles.includes('env(safe-area-inset-bottom)')],
  ['Closed charm has a reserved mobile rail outside investigation content', mobileStyles.includes('--fa-quick-pad-rail') && mobileStyles.includes('overflow-y: auto')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) console.log(`${passed ? '✓' : '✗'} ${label}`);
if (failed.length) process.exit(1);
console.log(`Quick Pad smoke check passed (${checks.length} checks).`);
