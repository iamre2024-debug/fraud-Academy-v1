import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/VisualApp.jsx');
const entrypoint = read('src/main.jsx');
const shell = read('src/MobileMissionDeckApp.jsx');
const workspace = read('src/MobileMissionWorkspace.jsx');
const workspaceController = read('src/VisualWorkspace.jsx');
const referencePages = read('src/MobileReferenceToolPages.jsx');
const linkAnalysis = read('src/MobileLinkAnalysisPanel.jsx');
const quickPad = read('src/CaseQuickPad.jsx');
const theme = read('src/mobileReferenceTheme.css');
const documentViewer = read('src/DocumentViewerWorkspace.jsx');
const playwrightConfig = read('playwright.config.mjs');
const failures = [];

function requireAnchor(label, content, anchor) {
  if (!content.includes(anchor)) failures.push(`${label} is missing: ${anchor}`);
}

for (const anchor of [
  "import './mobileMissionDeckV3.css';",
  "import './mobileReferenceTheme.css';",
]) requireAnchor('main.jsx', entrypoint, anchor);

if (entrypoint.indexOf("import './mobileReferenceTheme.css';") < entrypoint.indexOf("import './mobileMissionDeckV3.css';")) {
  failures.push('The canonical mobile reference theme must load after the prior mobile shell.');
}
if (entrypoint.includes("import './mobileBlueMissionDeck.css';")) failures.push('The retired Blue Mission Deck override must not load.');

for (const anchor of [
  'useResponsiveLayoutMode',
  "layoutController.resolvedLayout === 'mobile'",
  '<MobileMissionDeckApp',
  'layoutMode="mobile"',
  'onOpenWorkspace={openMobileWorkspace}',
]) requireAnchor('VisualApp.jsx', app, anchor);

for (const anchor of [
  'mission-mobile-root',
  'mission-mobile-dock',
  "label: 'Home'",
  "label: 'Cases'",
  "label: 'Workspace'",
  "label: 'Academy'",
  "label: 'Agent'",
  "label: 'Quotes'",
  'Good morning Ree, let’s stop fraud ✨',
  '<MobileLunaPortrait',
  'mobile-dashboard-active-file',
  'MissionQuotesPage',
  'mission-mobile-workspace-page',
]) requireAnchor('MobileMissionDeckApp.jsx', shell, anchor);

for (const anchor of [
  'mission-workspace-v3',
  'mission-workspace-bar',
  '<MobileMissionCaseBriefing',
  '<CategoryTileRail',
  '<MobileCustomer360Page',
  '<MobileBusiness360Page',
  '<MobileFinancialInvestigationPage',
  '<MobileEmployeeProfilePage',
  '<MobilePayrollHistoryPage',
  '<MobileLinkAnalysisPanel',
  '<TimelinePanel',
  '<InvestigationToolPanel',
  '<SubmitDecisionPanel',
  'layoutMode="mobile"',
  'mission-document-request-page',
  'mission-login-history-page',
  'decision-luna-portal-anchor',
]) requireAnchor('MobileMissionWorkspace.jsx', workspace, anchor);

for (const anchor of [
  'currentWorkspaceSnapshot',
  'forceHistory',
  'removeUnavailablePinnedEvidence',
  "nextStage === 'debrief' && !hasReviewPackage",
  "available.delete('System Access Lane')",
  'quickPadLayer',
]) requireAnchor('VisualWorkspace.jsx', workspaceController, anchor);

for (const anchor of [
  "tool === 'KYB Review' ? 'Business Intelligence' : tool",
  "tool === 'Business Intelligence' ? 'KYB Review' : tool",
]) requireAnchor('MobileMissionWorkspace.jsx Business Intelligence compatibility', workspace, anchor);

for (const anchor of [
  'data-customer-360-screen',
  'Accounts & products',
  'Trusted devices & security',
  'data-business-360-screen',
  'Compact payroll overview',
  'data-financial-investigation-screen',
  'Account Review',
  'Spending Analysis',
  'data-employee-profile-screen',
  'data-payroll-history-screen',
]) requireAnchor('MobileReferenceToolPages.jsx', referencePages, anchor);

for (const anchor of [
  'Search before relationships appear',
  'Phone Number',
  'matched account',
  'mobile-link-map',
  'Open related account',
  'Quick Pad account',
]) requireAnchor('MobileLinkAnalysisPanel.jsx', linkAnalysis, anchor);

for (const anchor of [
  'case-quick-pad-trigger',
  'case-quick-pad-panel',
  'Quick IDs',
  'Scratch note',
  'Notebook',
  'Last saved',
  'visualViewport',
  'Open record',
  'Unpin',
]) requireAnchor('CaseQuickPad.jsx', quickPad, anchor);

for (const anchor of [
  'mobileReviewStep',
  'data-mobile-review-step',
  'document-mobile-review-shell',
  'Document review pages',
  'Evidence-first field summary',
]) requireAnchor('DocumentViewerWorkspace.jsx', documentViewer, anchor);

for (const anchor of [
  '--fa-bg',
  '.mission-mobile-dock',
  'grid-template-columns: repeat(6, minmax(0, 1fr))',
  '.mission-workspace-bar',
  '.mobile-reference-dashboard',
  '.mobile-reference-panel',
  '.mobile-link-map',
  '.timeline-event-list',
  '.case-quick-pad',
  'env(safe-area-inset-bottom)',
  '--quick-pad-keyboard-inset',
  '@media (max-width: 340px)',
  '@media (max-height: 650px)',
]) requireAnchor('mobileReferenceTheme.css', theme, anchor);

if (!/^@media \(max-width: 700px\)/.test(theme.trim())) {
  failures.push('The mobile reference theme must be isolated behind the mobile breakpoint.');
}
if (/body\[data-layout-mode="desktop"\]/.test(theme)) {
  failures.push('The mobile reference theme must not alter the desktop layout.');
}

for (const browserSpec of [
  'mobile-reference-browser',
  'mobile-workspace-pages-browser',
  'document-request-browser',
  'decision-luna-browser',
  'quick-pad-browser',
]) requireAnchor('playwright.config.mjs mobile project', playwrightConfig, browserSpec);

if (failures.length) {
  console.error('Fraud Academy mobile reference structural smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Fraud Academy mobile reference smoke check passed. Mobile mounts a dedicated midnight-blue page system while desktop and shared case logic remain separate.');
