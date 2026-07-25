import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const app = fs.readFileSync(path.join(rootDir, 'src/VisualApp.jsx'), 'utf8');
const desktop = fs.readFileSync(path.join(rootDir, 'src/DesktopMissionControlApp.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/desktopMissionControlV2.css'), 'utf8');
const dayNightStyles = fs.readFileSync(path.join(rootDir, 'src/desktopMissionControlDayNight.css'), 'utf8');
const themeMode = fs.readFileSync(path.join(rootDir, 'src/useDesktopThemeMode.js'), 'utf8');
const persistenceKeys = fs.readFileSync(path.join(rootDir, 'src/data/persistenceKeys.js'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const browser = fs.readFileSync(path.join(rootDir, 'tests/desktop-mission-control-browser.spec.mjs'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, anchor) {
  if (!content.includes(anchor)) failures.push(`${fileLabel} is missing desktop mission-control anchor: ${anchor}`);
}

function mustNotContain(fileLabel, content, anchor) {
  if (content.includes(anchor)) failures.push(`${fileLabel} contains forbidden desktop mission-control coupling: ${anchor}`);
}

for (const anchor of [
  "import DesktopMissionControlApp from './DesktopMissionControlApp.jsx'",
  '<DesktopMissionControlApp',
  'onOpenWorkspaceRoute={openDesktopWorkspace}',
  'quickGenerator={<GeneratedCaseControls inline',
  'workspaceGenerator={<GeneratedCaseControls inline',
  '<LunaPostSubmissionPanel',
  'inline',
]) mustContain('VisualApp.jsx', app, anchor);

for (const anchor of [
  'className="desktop-mission-control-v2"',
  'aria-label="Main navigation"',
  "accessibleLabel: 'Dashboard'",
  "accessibleLabel: 'Cases'",
  "accessibleLabel: 'Workspace'",
  "accessibleLabel: 'Academy'",
  'data-react-navigation-panel="dashboard"',
  'className="dashboard-quick-grid"',
  'className="desktop-agent-button dashboard-agent-mark"',
  'data-desktop-theme={desktopTheme.resolvedTheme}',
  'aria-label={compact ? \'Desktop theme settings\' : \'Desktop theme\'}',
  'className="desktop-command-deck"',
  'className="desktop-utility-rail"',
  'title="Quick Pad"',
  'title="Pinned Evidence"',
  'title="Case Notes"',
  'className="desktop-case-path"',
  'id="visual-header-control-panel"',
  'aria-label="Close header panel"',
  'role="group" aria-label="Layout mode"',
  'className="desktop-workspace-generator"',
  '<h2>Saved package progress</h2>',
  "onOpenWorkspace('timeline', 'Timeline')",
  "onOpenWorkspace('evidence')",
  "onOpenWorkspace('notes')",
  "onOpenWorkspace('tool-menu')",
  '<CasesThemeV1Panel',
  'inline',
  '<AcademyThemeV1Panel',
  '<AcademyProgressPanel',
  '<ProfileThemeV1Panel',
  '<CloudSyncControl',
]) mustContain('DesktopMissionControlApp.jsx', desktop, anchor);

for (const anchor of [
  'body[data-layout-mode="desktop"]',
  '.desktop-mission-control-v2',
  'grid-template-columns: 266px minmax(0, 1fr)',
  '.desktop-page[hidden]',
  'overflow-wrap: anywhere',
  '.desktop-workspace-page .visual-os-frame',
  '.desktop-cases-page .case-generator-v2-controls',
  '@media (max-width: 1240px)',
  '@media (max-width: 980px)',
  '@media (max-width: 760px)',
]) mustContain('desktopMissionControlV2.css', styles, anchor);

for (const anchor of [
  'data-desktop-theme="night"',
  '.desktop-theme-control',
  '.desktop-command-deck',
  '.desktop-utility-rail',
  '.desktop-case-hero',
  '.desktop-case-path',
  '.desktop-recent-cases',
  'body[data-layout-mode="desktop"]',
]) mustContain('desktopMissionControlDayNight.css', dayNightStyles, anchor);

for (const anchor of [
  "export const desktopThemePreferenceKey = 'fraud-academy-desktop-theme-v1'",
  "export const desktopThemeModes = ['day', 'auto', 'night']",
  "window.matchMedia('(prefers-color-scheme: dark)')",
  'document.body.dataset.desktopTheme = resolvedTheme',
  'resolveDesktopTheme',
]) mustContain('useDesktopThemeMode.js', themeMode, anchor);

mustContain('main.jsx', entrypoint, "import './desktopMissionControlV2.css';");
mustContain('main.jsx', entrypoint, "import './desktopMissionControlDayNight.css';");
mustContain('desktop browser spec', browser, 'desktop mission control renders complete wide pages and exact workspace shortcuts');
mustContain('desktop browser spec', browser, "toHaveAttribute('data-workspace-screen', 'timeline')");
mustContain('desktop browser spec', browser, "toHaveAttribute('data-workspace-screen', 'evidence')");
mustContain('desktop browser spec', browser, "toHaveAttribute('data-workspace-screen', 'notes')");
mustContain('desktop browser spec', browser, "toHaveAttribute('data-workspace-screen', 'tool-menu')");
mustContain('desktop browser spec', browser, 'document.documentElement.scrollWidth');
mustContain('desktop browser spec', browser, 'desktop day, auto, and night themes share one stable layout and persist locally');

mustNotContain('persistenceKeys.js', persistenceKeys, 'fraud-academy-desktop-theme-v1');

for (const forbidden of [
  'createPortal',
  'document.querySelector',
  'insertAdjacentElement',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
]) mustNotContain('DesktopMissionControlApp.jsx', desktop, forbidden);

for (const forbidden of [
  '.mission-mobile-root',
  '.mission-mobile-dock',
  'body[data-layout-mode="mobile"]',
]) mustNotContain('desktopMissionControlV2.css', styles, forbidden);

if (failures.length) {
  console.error('Desktop Mission Control v2 smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Desktop Mission Control v2 smoke check passed. Direct page composition, exact workspace routes, wide-card wrapping, desktop-only scope, mobile isolation, and credential boundaries remain protected.');
