import fs from 'node:fs';
import {
  quickPadItemSupportsTool,
  quickPadSourceRoute,
} from '../src/data/quickPadRouting.js';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const model = read('src/visualWorkspaceModel.js');
const state = read('src/useVisualWorkspaceCaseState.js');
const workspace = read('src/VisualWorkspace.jsx');
const customer = read('src/Customer360Panel.jsx');
const device = read('src/InvestigationToolPanel.jsx');
const component = read('src/CaseQuickPad.jsx');
const caseQueue = read('src/MobileCaseQueue.jsx');
const styles = read('src/caseQuickPad.css');

const available = new Set(['Business 360', 'Payment Verification', 'Payroll History']);
const restorableBusinessId = {
  label: 'Business ID',
  value: 'BIZ-TRAINING-42',
  sourceTool: 'Business 360',
};
const nestedBusinessDevice = {
  label: 'Device ID',
  value: 'DEV-TRAINING-42',
  sourceTool: 'Business 360',
  sourceRecordId: 'OWNER-42',
};
const nestedBusinessEmail = {
  label: 'Email',
  value: 'owner@example.test',
  sourceTool: 'Business 360',
};

const checks = [
  ['Quick Pad has its own persisted storage key', model.includes("quickPad: 'fraud-academy-quick-pad-v1'")],
  ['Quick Pad state is scoped by active case', state.includes('quickPadByCase[caseId]')],
  ['Quick IDs remain separate from pinned evidence', workspace.includes("recordAction('Saved to Quick Pad'") && !component.includes('Pinned Evidence')],
  [
    'Quick Pad renders for both layouts and the mobile shell controls focused-screen visibility',
    (workspace.match(/quickPadLayer/g) ?? []).length >= 3
      && styles.includes('.mission-workspace-v3[data-workspace-screen="determination"]'),
  ],
  ['Saved values can populate only a compatible current search', workspace.includes('quickPadItemSupportsTool') && workspace.includes('setQuery(quickPadQueryForTool(item, activeTool))')],
  ['Saved values can reopen only an exact canonical source route', workspace.includes('quickPadSourceRoute(item') && workspace.includes('openTool(route.sourceTool')],
  ['Business identifiers can restore the search-first company route', quickPadItemSupportsTool(restorableBusinessId, 'Business 360', 'mobile') && quickPadSourceRoute(restorableBusinessId, { availableTools: available, layoutMode: 'mobile' })?.query === restorableBusinessId.value],
  ['Nested Business values do not claim an exact source route', quickPadSourceRoute(nestedBusinessDevice, { availableTools: available, layoutMode: 'mobile' }) === null && quickPadSourceRoute(nestedBusinessEmail, { availableTools: available, layoutMode: 'mobile' }) === null],
  ['Actions render only when their real destination is available', component.includes('canUseItem(item)') && component.includes('canOpenItem(item)') && component.includes('{usableHere &&') && component.includes('{sourceAvailable &&')],
  ['Source actions use accurate wording', component.includes('Open source') && !component.includes('Open record')],
  ['Account IDs can be added from Customer 360', customer.includes("label: 'Account ID'")],
  ['Bank and destination IDs can be added', device.includes("label: 'Bank Code'") && device.includes("label: 'Destination ID'")],
  ['Device IDs can be added', device.includes("label: 'Device ID'")],
  ['Scratch text can become a formal case note', workspace.includes("saveNote(quickPad.scratch, 'Quick Pad note')")],
  ['The notebook displays only notes passed from the active case', component.includes('aria-label="Current case notebook"') && component.includes('notes.map(') && !component.includes('localStorage')],
  ['The phone panel responds to the visual keyboard', component.includes('window.visualViewport') && component.includes("'--quick-pad-keyboard-inset'")],
  ['The phone dialog supports focus entry and Escape', component.includes("event.key === 'Escape'") && component.includes("querySelector('button, input, textarea, select')")],
  ['Quick Pad can escape the hidden Workspace page on the phone shell', workspace.includes("portalToBody={layoutMode === 'mobile'}") && component.includes('createPortal(content, document.body)') && styles.includes(':not([data-visual-tab="cases"])')],
  ['Quick Pad yields to the modal case generator at every forced-mobile width', /^body\[data-layout-mode="mobile"\]:has\(\.mobile-case-generator-backdrop\) \.case-quick-pad\s*\{\s*display:\s*none;\s*\}/m.test(styles)],
  ['The case generator suspends the open Quick Pad and its Escape listener', component.includes("'fraud-academy:case-generator-visibility'") && component.includes('setOpen(false)') && caseQueue.includes("'fraud-academy:case-generator-visibility'") && caseQueue.includes('detail: { open: generatorOpen }')],
  ['The case generator traps focus, makes its background inert, and restores its launcher', caseQueue.includes("event.key !== 'Tab'") && caseQueue.includes("node.setAttribute('inert', '')") && caseQueue.includes('generatorToggleRef.current?.focus') && caseQueue.includes('generatorDialogRef')],
  ['Panel stays compact on phones', styles.includes('max-height: min(58dvh, calc(100dvh - var(--fa-dock-height, 76px) - var(--quick-pad-keyboard-inset, 0px) - 34px))')],
  ['Panel clears the fixed mobile dock and visual keyboard', styles.includes('bottom: calc(var(--fa-dock-height, 76px) + 12px + env(safe-area-inset-bottom) + var(--quick-pad-keyboard-inset, 0px))')],
  ['Phone actions retain full touch targets', /body\[data-layout-mode="mobile"\] \.case-quick-pad-actions button\s*\{[^}]*min-height:\s*44px/s.test(styles)],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) console.log(`${passed ? '✓' : '✗'} ${label}`);
if (failed.length) process.exit(1);
console.log(`Quick Pad smoke check passed (${checks.length} checks).`);
