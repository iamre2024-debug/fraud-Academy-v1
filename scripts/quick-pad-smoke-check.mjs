import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const model = read('src/visualWorkspaceModel.js');
const state = read('src/useVisualWorkspaceCaseState.js');
const workspace = read('src/VisualWorkspace.jsx');
const customer = read('src/Customer360Panel.jsx');
const device = read('src/InvestigationToolPanel.jsx');
const component = read('src/CaseQuickPad.jsx');
const styles = read('src/caseQuickPad.css');

const checks = [
  ['Quick Pad has its own persisted storage key', model.includes("quickPad: 'fraud-academy-quick-pad-v1'")],
  ['Quick Pad state is scoped by active case', state.includes('quickPadByCase[caseId]')],
  ['Quick IDs remain separate from pinned evidence', workspace.includes("recordAction('Saved to Quick Pad'") && !component.includes('Pinned Evidence')],
  ['Quick Pad renders for both workspace layouts', (workspace.match(/\{quickPadLayer\}/g) ?? []).length === 2],
  ['Saved values can populate the current search', workspace.includes('setQuery(item.value)')],
  ['Saved values can reopen their source tool', workspace.includes('openTool(item.sourceTool')],
  ['Account IDs can be added from Customer 360', customer.includes("label: 'Account ID'")],
  ['Bank and destination IDs can be added', customer.includes("label: 'Bank Code'") && customer.includes("label: 'Destination ID'")],
  ['Device IDs can be added', device.includes("label: 'Device ID'")],
  ['Scratch text can become a formal case note', workspace.includes("saveNote(quickPad.scratch, 'Quick Pad note')")],
  ['Panel stays compact on phones', styles.includes('max-height: min(300px, 36dvh)')],
  ['Panel clears the fixed mobile dock', styles.includes('bottom: calc(88px + env(safe-area-inset-bottom))')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) console.log(`${passed ? '✓' : '✗'} ${label}`);
if (failed.length) process.exit(1);
console.log(`Quick Pad smoke check passed (${checks.length} checks).`);
