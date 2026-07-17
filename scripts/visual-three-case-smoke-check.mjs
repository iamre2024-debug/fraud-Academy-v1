import fs from 'node:fs';
import path from 'node:path';
import { trainingCases as baseCases } from '../src/data/cases.js';
import { enrichTrainingCases } from '../src/data/caseEnrichment.js';
import { businessRecordsByCase } from '../src/data/businessRecords.js';
import { getDeviceProfiles } from '../src/data/deviceRecords.js';
import { getLoginRecords } from '../src/data/loginRecords.js';
import { getIpRecords } from '../src/data/ipRecords.js';
import { getSessionRecords } from '../src/data/sessionRecords.js';
import { getCaseDocuments } from '../src/data/documentRecords.js';
import { getCustomer360Dossier } from '../src/data/customer360Dossier.js';
import { getIdentityIntelReport } from '../src/data/identityIntelReport.js';
import { buildAccessHistoryReport } from '../src/data/accessHistoryReports.js';
import { financialRecordsByCase } from '../src/data/financialRecords.js';
import { systemAccessRecordsByCase } from '../src/data/systemAccessRecords.js';
import { decisionCallGroups, getDecisionCallGroups, reviewChoices } from '../src/data/reviewPackage.js';

const rootDir = process.cwd();
const cases = enrichTrainingCases(baseCases);
const failures = [];

function read(file) {
  return fs.readFileSync(path.join(rootDir, file), 'utf8');
}

function requireText(file, content, text, label) {
  if (!content.includes(text)) failures.push(`${file} is missing ${label}: ${text}`);
}

function requireAbsent(file, content, text, label) {
  if (content.includes(text)) failures.push(`${file} still contains retired ${label}: ${text}`);
}

function requireCount(label, actual, minimum) {
  if (actual < minimum) failures.push(`${label} expected at least ${minimum}, found ${actual}.`);
}

if (cases.length < 3) failures.push(`Expected at least 3 built-in cases, found ${cases.length}.`);

for (const item of cases) {
  const prefix = `${item.id} visual case coverage`;
  for (const field of ['id', 'type', 'priority', 'status', 'person', 'trainingId', 'amount', 'opened', 'allegation', 'queueReason', 'claimId', 'transactionInfo', 'shortSummary']) {
    if (!item[field]) failures.push(`${prefix} is missing ${field}.`);
  }

  if (!item.intake?.channel || !item.intake?.contactTime || !item.intake?.customerLocation || !item.intake?.statedDevice) {
    failures.push(`${prefix} is missing full intake metadata.`);
  }

  requireCount(`${prefix} identity records`, item.identityRecords?.length ?? 0, 4);
  requireCount(`${prefix} login history records`, item.loginHistory?.length ?? 0, 4);
  requireCount(`${prefix} timeline events`, item.events?.length ?? 0, 4);
  requireCount(`${prefix} documents`, item.documents?.length ?? 0, 3);
  requireCount(`${prefix} profile maintenance records`, item.customer?.profileChanges?.length ?? 0, 3);

  for (const event of item.customer?.profileChanges ?? []) {
    for (const field of ['id', 'date', 'time', 'eventType', 'item', 'oldValue', 'newValue', 'channel', 'source', 'user', 'device', 'ip', 'session', 'mfaMethod', 'notes', 'detail']) {
      if (!event[field]) failures.push(`${prefix} profile event ${event.id} is missing ${field}.`);
    }
    if (/viewed|form submitted|transaction posted/i.test(event.item)) failures.push(`${prefix} profile event ${event.id} is session or transaction activity instead of profile maintenance.`);
  }

  const deviceIdsByDevice = new Map();
  for (const login of item.loginHistory ?? []) {
    if (!login.deviceId) failures.push(`${prefix} login ${login.id} is missing a Device ID.`);
    const existingId = deviceIdsByDevice.get(login.device);
    if (existingId && existingId !== login.deviceId) {
      failures.push(`${prefix} device ${login.device} changed Device ID from ${existingId} to ${login.deviceId}.`);
    }
    deviceIdsByDevice.set(login.device, login.deviceId);
  }

  const financial = financialRecordsByCase[item.id] ?? {};
  const business = businessRecordsByCase[item.id] ?? {};
  const documents = getCaseDocuments(item);
  const customerDossier = getCustomer360Dossier(item);
  const identityReport = getIdentityIntelReport(item);
  const deviceProfiles = getDeviceProfiles(item);
  const loginRecords = getLoginRecords(item);
  const ipRecords = getIpRecords(item);
  const sessionRecords = getSessionRecords(item);
  requireCount(`${prefix} transaction records`, financial.transactions?.length ?? 0, 2);
  requireCount(`${prefix} financial intelligence records`, financial.financialIntel?.length ?? 0, 2);
  requireCount(`${prefix} payment verification records`, financial.paymentVerification?.length ?? 0, 2);
  requireCount(`${prefix} device intelligence profiles`, deviceProfiles.length, 1);
  requireCount(`${prefix} enriched login records`, loginRecords.length, 4);
  requireCount(`${prefix} IP intelligence records`, ipRecords.length, 2);
  requireCount(`${prefix} enriched session records`, sessionRecords.length, 4);
  if (!loginRecords.some((record) => /failed|locked/i.test(record.result))) failures.push(`${prefix} has no failed or locked authentication event for comparison.`);
  requireCount(`${prefix} business relationship records`, business.business360?.length ?? 0, 1);
  requireCount(`${prefix} business intelligence records`, business.businessIntel?.length ?? 0, 1);
  requireCount(`${prefix} document viewer records`, documents.length, 9);
  requireCount(`${prefix} document request records`, documents.filter((document) => document.requestStatus).length, 9);
  requireCount(`${prefix} Customer 360 products`, customerDossier.products.length, 1);
  requireCount(`${prefix} Customer 360 contact records`, customerDossier.recentContacts.length, 2);
  requireCount(`${prefix} Identity Intel full-report sections`, identityReport.sections.length, 17);
  for (const title of ['Driver License Review', 'Bank Statement', 'EIN Assignment Notice', 'Tax Return Transcript', 'Utility Bill - Proof of Address', 'Phone Ownership Report']) {
    if (!documents.some((document) => document.title === title)) failures.push(`${prefix} is missing ${title}.`);
  }
  requireCount(`${prefix} system access records`, systemAccessRecordsByCase[item.id]?.length ?? 0, 2);

  for (const profile of deviceProfiles) {
    for (const field of [
      'id',
      'deviceName',
      'deviceType',
      'operatingSystem',
      'browser',
      'deviceFingerprint',
      'browserFingerprint',
      'firstSeen',
      'lastSeen',
      'trustedStatus',
      'rootedJailbroken',
      'emulatorIndicator',
      'vpnProxyIndicator',
      'sharedDeviceDetection',
      'linkedProfiles',
      'walletUsage',
      'normalBehavior',
      'lookupResult',
      'history',
      'relatedRecords',
      'investigatorUse',
    ]) {
      if (!profile[field] || (Array.isArray(profile[field]) && profile[field].length === 0)) {
        failures.push(`${prefix} device profile ${profile.id} is missing required field ${field}.`);
      }
    }
  }

  for (const login of loginRecords) {
    for (const field of [
      'id', 'timestamp', 'date', 'timeOfDay', 'eventType', 'result', 'method', 'mfaStatus', 'authChannel', 'browserSource', 'operatingSystem',
      'sessionReference', 'sessionDuration', 'sessionBehavior', 'passwordResetLink', 'profileChangeLink', 'loginContext',
      'relatedRecords', 'investigatorUse',
    ]) {
      if (!login[field] || (Array.isArray(login[field]) && login[field].length === 0)) {
        failures.push(`${prefix} login record ${login.id} is missing required field ${field}.`);
      }
    }
    if (login.failedAttemptCount === undefined || login.accountLockout === undefined) failures.push(`${prefix} login record ${login.id} is missing attempt or lockout data.`);
  }

  for (const ipRecord of ipRecords) {
    for (const field of [
      'id', 'ip', 'city', 'country', 'isp', 'networkType', 'residentialStatus', 'vpnProxyTor', 'firstSeen', 'lastSeen',
      'historicalLocations', 'velocity', 'crossCasePresence', 'lookupResult', 'observedSessions', 'observedDevices',
      'observedLogins', 'observedLoginEvents', 'relatedRecords', 'investigatorUse',
    ]) {
      if (!ipRecord[field] || (Array.isArray(ipRecord[field]) && ipRecord[field].length === 0)) {
        failures.push(`${prefix} IP record ${ipRecord.id} is missing required field ${field}.`);
      }
    }
  }

  for (const session of sessionRecords) {
    for (const field of [
      'session', 'id', 'start', 'end', 'duration', 'logoutStatus', 'pagesViewed', 'securitySettings',
      'profileActions', 'payeeTokenActivity', 'moneyMovement', 'sessionPath', 'relatedRecords', 'investigatorUse',
    ]) {
      if (!session[field] || (Array.isArray(session[field]) && session[field].length === 0)) {
        failures.push(`${prefix} session record ${session.session} is missing required field ${field}.`);
      }
    }
    if (!/successful/i.test(session.result)) failures.push(`${prefix} session ${session.session} was created from a non-successful authentication event.`);
    const matchingProfileIds = new Set((item.customer?.profileChanges ?? []).filter((event) => event.session === session.session).map((event) => event.id));
    for (const action of session.profileActions.filter((value) => !/no profile/i.test(value))) {
      const profileId = action.split(' · ')[0];
      if (!matchingProfileIds.has(profileId)) failures.push(`${prefix} session ${session.session} links profile event ${profileId} from another session.`);
    }
  }

  for (const reportType of ['login', 'session', 'ip']) {
    const report = buildAccessHistoryReport(item, reportType);
    if (!report.pages.length || report.folder !== 'System Reports') failures.push(`${prefix} is missing the ${reportType} system report.`);
  }
}

const visualApp = read('src/VisualApp.jsx');
const visualWorkspace = read('src/VisualWorkspace.jsx');
const visualWorkspaceActions = read('src/useVisualWorkspaceActions.js');
const visualWorkspaceModel = read('src/visualWorkspaceModel.js');
const activeToolPanel = read('src/ActiveToolPanel.jsx');
const bottomInvestigationGrid = read('src/BottomInvestigationGrid.jsx');
const caseSummaryCard = read('src/CaseSummaryCard.jsx');
const categoryTileRail = read('src/CategoryTileRail.jsx');
const submitDecisionPanel = read('src/SubmitDecisionPanel.jsx');
const visualShellHeader = read('src/VisualShellHeader.jsx');
const visualNavigation = read('src/VisualNavigation.jsx');
const main = read('src/main.jsx');

for (const required of [
  "const [activeCaseId, setActiveCaseId]",
  "const [activeTab, setActiveTab] = useState('workspace')",
  "function openCase(caseId, nextWorkspaceScreen = 'briefing')",
  'onCaseChange={openCase}',
  'onOpenCase={openCase}',
]) {
  requireText('src/VisualApp.jsx', visualApp, required, 'active case/navigation coordinator anchor');
}

for (const required of [
  "import useVisualWorkspaceActions from './useVisualWorkspaceActions.js'",
  "from './visualWorkspaceModel.js'",
  'rowsFor(activeTool, activeCase)',
  'useVisualWorkspaceActions({',
  'function jumpDecision()',
  'submitRef.current?.scrollIntoView',
  '<BottomInvestigationGrid',
  '<CaseSummaryCard',
  '<CategoryTileRail',
  '<SubmitDecisionPanel',
  '<VisualShellHeader',
]) {
  requireText('src/VisualWorkspace.jsx', visualWorkspace, required, 'three-case visual workflow anchor');
}

for (const required of [
  'getReviewPackageStatus({',
  'buildReviewPackage({',
  "window.dispatchEvent(new CustomEvent('fraud-academy:package-saved'",
]) {
  requireText('src/useVisualWorkspaceActions.js', visualWorkspaceActions, required, 'three-case action controller anchor');
}

for (const required of [
  'className="visual-hero"',
  'className="case-info-bar visual-case-strip"',
  'className="visual-case-switcher"',
  '<strong>Case</strong>',
  '<strong>Claim Type:</strong>',
  '<strong>Status:</strong>',
  'cases.map',
  'changeCase(event.target.value)',
]) {
  requireText('src/VisualShellHeader.jsx', visualShellHeader, required, 'visual shell header module anchor');
}

for (const required of [
  'className="ornate-card case-summary-visual"',
  'className="case-summary-meta-grid"',
  '<small>Claim ID</small>',
  '<small>Transaction / payee info</small>',
  '<small>Short summary</small>',
  "pin(activeCase.id)",
  'const firstInvestigationTool =',
  'const quickRoutes = [...new Set(',
  'quickRoutes.map((toolName)',
  'case-briefing-chargeback-card',
  'decision-jump-button',
]) {
  requireText('src/CaseSummaryCard.jsx', caseSummaryCard, required, 'case summary card module anchor');
}

for (const required of [
  'className="visual-categories"',
  'className="visual-category-row"',
  'category-progress-track',
  'reviewedCount',
  'progressPercent',
  'setTool(item.tools[0])',
  "onNavigate('academy')",
]) {
  requireText('src/CategoryTileRail.jsx', categoryTileRail, required, 'category tile rail module anchor');
}

for (const required of [
  'className="bottom-investigation-grid"',
  'className="ornate-card tray-card"',
  'Pinned Evidence & Key Identifiers',
  'className="ornate-card notebook-card"',
]) {
  requireText('src/BottomInvestigationGrid.jsx', bottomInvestigationGrid, required, 'bottom investigation grid module anchor');
}

for (const required of [
  'getDecisionCallGroups(activeCase)',
  'selectionGroups.map',
  'className="ornate-card submit-decision-panel decision-theme-v1"',
  'activeCase.id',
  'Submit Decision',
]) {
  requireText('src/SubmitDecisionPanel.jsx', submitDecisionPanel, required, 'Submit Decision panel module anchor');
}

for (const required of [
  'System Access Lane',
  'getSystemAccessRecords(activeCase.id)',
  "columns: ['Device ID'",
  'item.deviceId ?? `DEV-${item.id}`',
  'export function rowsFor(tool, activeCase)',
]) {
  requireText('src/visualWorkspaceModel.js', visualWorkspaceModel, required, 'three-case visual model anchor');
}

for (const required of [
  'cases.map',
  'onOpenCase(item.id)',
  "onNavigate('workspace')",
  "onNavigate('progress')",
  "{ key: 'academy'",
]) {
  requireText('src/VisualNavigation.jsx', visualNavigation, required, 'direct navigation callback anchor');
}

for (const forbidden of [
  "import './visualInvestigationRepair.js'",
  "import './visualQaPatch.js'",
  "import './visualNavPatch.js'",
  "import './visualTextCollapse.js'",
]) {
  requireAbsent('src/main.jsx', main, forbidden, 'DOM patch import');
}

requireCount('Submit Decision learner choices', reviewChoices.length, 12);
requireCount('Submit Decision call groups', decisionCallGroups.length, 4);

for (const choice of [
  'Route for chargeback representment review',
  'Route for credit risk underwriting review',
  'Escalate for insider / vendor / API / open banking review',
  'No action yet / continue investigation',
]) {
  if (!reviewChoices.includes(choice)) failures.push(`Submit Decision is missing learner choice: ${choice}`);
}

const builtInChargeback = cases.find((item) => item.claimTypeId === 'non-fraud-chargeback');
const builtInCredit = cases.find((item) => item.claimTypeId === 'credit-risk');
if (!builtInChargeback?.chargebackDecision?.reasonCode) failures.push('Built-in non-fraud chargeback case is missing Design Bible reason-code details.');
if (!builtInCredit?.creditDecision?.deadline) failures.push('Built-in credit case is missing its credit decision rail.');
if (!getDecisionCallGroups(builtInChargeback).some((group) => group.label === 'Chargeback determination calls')) {
  failures.push('Chargeback cases should receive lane-specific decision calls.');
}
if (!getDecisionCallGroups(builtInCredit).some((group) => group.label === 'Credit decision calls')) {
  failures.push('Credit cases should receive lane-specific decision calls.');
}

if (failures.length) {
  console.error('Visual three-case smoke check failed. Repair these anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Visual three-case smoke check passed. All built-in cases have enriched intake metadata, stable Device IDs, record depth, direct React routing anchors, controller-backed case actions, and expanded Submit Decision choices.');
