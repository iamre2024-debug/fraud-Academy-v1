import fs from 'node:fs';

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
const linkAnalysis = read('src/MobileLinkAnalysisPanel.jsx');

const checks = [
  ['Quick Pad has its own persisted storage key', model.includes("quickPad: 'fraud-academy-quick-pad-v1'")],
  ['Quick Pad state is scoped by active case', state.includes('quickPadByCase[caseId]')],
  ['Quick IDs remain separate from pinned evidence', workspace.includes("recordAction('Saved to Quick Pad'") && !component.includes('Pinned Evidence')],
  ['Quick Pad renders for both workspace layouts', (workspace.match(/\{quickPadLayer\}/g) ?? []).length === 2],
  ['Saved values can populate the current search', workspace.includes('setQuery(item.value)')],
  ['Saved values can reopen their source tool', workspace.includes('openTool(sourceTool') && workspace.includes("item.sourceTool === 'Business Intelligence' ? 'KYB Review'")],
  ['Account IDs can be added from Customer 360', customer.includes("label: 'Account ID'")],
  ['Bank and destination IDs can be added', customer.includes("label: 'Bank Code'") && customer.includes("label: 'Destination ID'")],
  ['Device IDs can be added', device.includes("label: 'Device ID'")],
  ['Supported tool IDs have mobile Quick Pad actions', ['Customer ID', 'Training ID', 'Business ID', 'Employee ID', 'Bank Code', 'Destination ID', 'Phone number', 'Email', 'Device ID', 'IP address', 'Merchant ID', 'Transaction ID', 'Case ID'].every((label) => mobilePins.includes(`label: '${label}'`))],
  ['Link results can be saved without becoming evidence', linkAnalysis.includes('Quick Pad account') && !linkAnalysis.includes('pinEvidence')],
  ['Scratch text can become a formal case note', workspace.includes("saveNote(quickPad.scratch, 'Quick Pad note')")],
  ['Quick Pad reports auto-save and last-saved state', component.includes('Auto-save ready') && component.includes('Last saved')],
  ['Case notes and investigator notebook remain separate', component.includes('Investigator-wide notebook archive') && component.includes("agentNotebookKey = 'fraud-academy-agent-notepad-v1'")],
  ['Quick Pad responds to the visual viewport keyboard inset', component.includes('window.visualViewport') && mobileStyles.includes('--quick-pad-keyboard-inset')],
  ['Opening and closing preserve page scroll', component.includes('scrollPositionRef') && component.includes('window.scrollTo')],
  ['Every saved ID offers copy, source, and unpin actions', ['Copy', 'Open record', 'Unpin'].every((label) => component.includes(label))],
  ['Panel stays compact on phones', styles.includes('max-height: min(300px, 36dvh)')],
  ['Panel clears the fixed mobile dock', styles.includes('bottom: calc(88px + env(safe-area-inset-bottom))')],
  ['Reference theme keeps the charm above the six-tab safe-area dock', mobileStyles.includes('bottom:calc(var(--fa-dock-height)') && mobileStyles.includes('env(safe-area-inset-bottom)')],
  ['Closed charm has a reserved mobile rail outside investigation content', mobileStyles.includes('--fa-quick-pad-rail') && mobileStyles.includes('overflow-y: auto')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) console.log(`${passed ? '✓' : '✗'} ${label}`);
if (failed.length) process.exit(1);
console.log(`Quick Pad smoke check passed (${checks.length} checks).`);
