import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const panel = read('src/InvestigationToolPanel.jsx');
const main = read('src/main.jsx');
const vite = read('vite.config.js');
const vercel = read('vercel.json');
const cloudClient = read('src/data/cloudSyncClient.js');
const cloudApi = read('api/cloud-sync.js');
const lunaApi = read('api/luna-debrief.js');
const serviceWorker = read('public/sw.js');
const quickPad = read('src/CaseQuickPad.jsx');
const quickPadStyles = read('src/caseQuickPad.css');
const cases = read('src/CasesThemeV1Panel.jsx');
const accessibility = read('src/accessibility.css');
const visualWorkspace = read('src/VisualWorkspace.jsx');
const mobileShell = read('src/MobileMissionDeckApp.jsx');
const mobileWorkspace = read('src/MobileMissionWorkspace.jsx');

assert.ok(panel.split('\n').length < 700, 'InvestigationToolPanel must remain a small lazy router.');
for (const moduleName of [
  'DeviceIntelligenceWorkspace',
  'DocumentRequestWorkspace',
  'EmployeeProfileWorkspace',
  'IPIntelligenceWorkspace',
  'IdentityIntelWorkspace',
  'LoginHistoryWorkspace',
  'PaymentVerificationWorkspace',
  'PayrollHistoryWorkspace',
  'SessionHistoryWorkspace',
  'TransactionHistoryWorkspace',
]) {
  assert.match(panel, new RegExp(`lazy\\(\\(\\) => import\\('\\./tools/${moduleName}\\.jsx'\\)\\)`));
  assert.ok(fs.existsSync(`src/tools/${moduleName}.jsx`), `${moduleName} must exist as a separate module.`);
}
assert.match(panel, /<Suspense fallback=/);
assert.doesNotMatch(panel, /function (?:LoginHistory|PayrollHistory|PaymentVerification)Workspace/);

for (const anchor of ['react()', 'manualChunks: chunkFor', "return 'vendor'", "return 'case-data'", 'serviceWorkerCacheVersion()']) {
  assert.ok(vite.includes(anchor), `Vite configuration is missing ${anchor}.`);
}
assert.match(main, /<ErrorBoundary>[\s\S]*<VisualApp \/>[\s\S]*<\/ErrorBoundary>/);
assert.ok(fs.existsSync('src/ErrorBoundary.jsx'));

for (const anchor of [
  'salt: bytesToBase64Url(salt)',
  "payload.salt === 'string'",
  'legacySaltBytes()',
  'mergeCloudSnapshots(currentLocalSnapshot, mergedSnapshot)',
  'localClockNow !== localClockAtSnapshot',
]) assert.ok(cloudClient.includes(anchor), `Cloud client is missing ${anchor}.`);

for (const apiSource of [cloudApi, lunaApi]) {
  assert.match(apiSource, /req\.headers\?\.(?:host|\['host'\]) \|\| req\.headers\?\.\['x-forwarded-host'\]/);
  assert.match(apiSource, /hops\[hops\.length - 1\]/);
  assert.match(apiSource, /sweepExpiredWindows\(now\)/);
}
assert.match(lunaApi, /Buffer\.byteLength\(JSON\.stringify\(req\.body \?\? \{\}\), 'utf8'\)/);
assert.match(lunaApi, /timingSafeEqual\(supplied, expected\)/);
assert.match(cloudApi, /Buffer\.byteLength\(JSON\.stringify\(body\), 'utf8'\)/);

for (const header of [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
]) assert.ok(vercel.includes(header), `Vercel headers are missing ${header}.`);

for (const anchor of ['CACHE_VERSION', 'offlineFallback()', 'cachePut(event', 'event.waitUntil(refresh.catch(() => {}))']) {
  assert.ok(serviceWorker.includes(anchor), `Service worker is missing ${anchor}.`);
}

assert.match(quickPad, /copyResetTimerRef/);
assert.match(quickPad, /window\.clearTimeout\(copyResetTimerRef\.current\)/);
assert.match(quickPadStyles, /@media \(max-width: 720px\)/);
assert.doesNotMatch(quickPadStyles, /@media \(max-width: 700px\)/);
assert.match(cases, /describeGeneratorFailure/);
assert.match(cases, /role="alert"/);

for (const anchor of ['--fa-tap-min: 44px', ':focus-visible', '@media (prefers-reduced-motion: reduce)', '.skip-link']) {
  assert.ok(accessibility.includes(anchor), `Accessibility layer is missing ${anchor}.`);
}
assert.match(visualWorkspace, /<main id="main"[^>]*tabIndex=\{-1\}/);
assert.match(mobileShell, /<main id="main"[^>]*tabIndex=\{-1\}/);
assert.doesNotMatch(mobileWorkspace, /<main/);

for (const removed of [
  'academyProgress.css',
  'case-summary.css',
  'desktopCommand.css',
  'lunaDebrief.css',
  'mobileBlueMissionDeck.css',
  'mobileNeonCardStack.css',
  'mobilePanelGuard.css',
  'records.css',
  'scenarioEngine.css',
  'styles.css',
]) assert.equal(fs.existsSync(`src/${removed}`), false, `${removed} should remain removed.`);

console.log('Engineering hardening smoke check passed.');
