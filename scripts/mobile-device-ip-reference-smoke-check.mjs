import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const entrypoint = read('src/main.jsx');
const workspace = read('src/MobileMissionWorkspace.jsx');
const panel = read('src/InvestigationToolPanel.jsx');
const pages = read('src/MobileDeviceIpPages.jsx');
const styles = read('src/mobileDeviceIpReference.css');
const failures = [];

function requireAnchor(label, content, anchor) {
  if (!content.includes(anchor)) failures.push(`${label} is missing: ${anchor}`);
}

requireAnchor('main.jsx', entrypoint, "import './mobileDeviceIpReference.css';");

for (const anchor of [
  'mission-device-intelligence-page mission-device-ip-reference-page',
  'mission-ip-intelligence-page mission-device-ip-reference-page',
  'data-device-intelligence-page',
  'data-ip-intelligence-page',
]) requireAnchor('MobileMissionWorkspace.jsx', workspace, anchor);

for (const anchor of [
  "import { MobileDeviceIntelligencePage, MobileIPIntelligencePage } from './MobileDeviceIpPages.jsx';",
  '<MobileDeviceIntelligencePage',
  '<MobileIPIntelligencePage',
  'mobileMode={mobileMode}',
  'No matching device record returned',
  'No exact IP match',
  'setSubmittedIp(clean)',
  "setSubmittedIp('')",
  'disabled={!reviewed && !lookupMatched}',
  'disabled={!lookupMatched}',
]) requireAnchor('InvestigationToolPanel.jsx', panel, anchor);

for (const anchor of [
  'MobileDeviceIntelligencePage',
  'MobileIPIntelligencePage',
  'data-mobile-device-reference',
  'data-mobile-ip-reference',
  'Primary device',
  'Complete recorded event log',
  'Recorded device status',
  'Quick Pad Device ID',
  'Run IP Lookup',
  'ASN / provider',
  'Distance / velocity facts',
  'Complete recorded authentication log',
  'Debrief after submit',
  'Evidence First',
  'Save device note',
  'Save IP note',
  'Generate IP Intelligence Report',
]) requireAnchor('MobileDeviceIpPages.jsx', pages, anchor);

for (const anchor of [
  'Device Intelligence + IP Intelligence mobile reference rebuild',
  '.mission-device-ip-reference-page',
  '.mobile-device-primary',
  '.mobile-device-facts',
  '.mobile-device-records',
  '.mobile-device-history',
  '.mobile-ip-hero',
  '.mobile-ip-globe',
  '.mobile-ip-records',
  '.mobile-ip-usage',
  '.mobile-intel-review',
  '@media (max-width: 350px)',
]) requireAnchor('mobileDeviceIpReference.css', styles, anchor);

if (/body\[data-layout-mode="desktop"\]/.test(styles)) {
  failures.push('Device/IP reference styles must not alter the desktop layout.');
}

if (/font-size:\s*(?:0\.[0-6]\d*)rem/.test(styles)) {
  failures.push('Device/IP reference styles must preserve the 12px mobile type floor.');
}

if (/\b(?:High Risk|Medium Risk|Low Risk|Risk Score|AI Verified|fraud score)\b/i.test(pages)) {
  failures.push('Device/IP mobile pages restore answer-bearing mockup risk or verification conclusions.');
}

if (/\b(?:KYB Review|caseTruth|correctDetermination|accepted determination)\b/i.test(pages)) {
  failures.push('Device/IP mobile pages restore a retired or hidden-answer surface.');
}

if (!/body\[data-layout-mode="mobile"\][^{]*\.mission-device-ip-reference-page/.test(styles)) {
  failures.push('Device/IP styles are not scoped to the dedicated mobile route.');
}

if (failures.length) {
  console.error('Mobile Device/IP reference smoke check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mobile Device/IP reference smoke check passed. Dedicated React pages preserve search, pinning, Quick Pad, notes, reports, review state, desktop isolation, and Evidence First.');
