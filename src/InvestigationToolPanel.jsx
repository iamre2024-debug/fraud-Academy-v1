import { useEffect, useMemo, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import DocumentViewerWorkspace from './DocumentViewerWorkspace.jsx';
import MerchantIntelligenceWorkspace from './MerchantIntelligenceWorkspace.jsx';
import { accessReportExportText, generateAccessHistoryReport, generatedAccessReportTypes } from './data/accessHistoryReports.js';
import { buildCoreToolRecords } from './data/coreToolRecords.js';
import { getBusiness360Workspace, getEmployeeProfiles, getPayrollHistory, getTransactionHistory } from './data/businessPayrollWorkspace.js';
import { getDeviceProfiles } from './data/deviceRecords.js';
import { getFinancialRecords } from './data/caseToolData.js';
import { getCaseDocuments } from './data/documentRecords.js';
import {
  applyCustomerResponse,
  buildPaperworkInboxRecords,
  createPaperworkAttempt,
  getPaperworkRequestTemplates,
} from './data/documentRequestWorkflow.js';
import { financialInvestigationTabs, financialRecordSearchText, getFinancialInvestigation } from './data/financialInvestigationRecords.js';
import { getIdentityIntelReport, matchesIdentityIntelSearch } from './data/identityIntelReport.js';
import { getLoginRecords } from './data/loginRecords.js';
import { getIpRecords } from './data/ipRecords.js';
import { getKybReview, kybRecordSearchText, kybReviewTabs, matchesKybReviewLookup } from './data/kybReviewRecords.js';
import { generateKybReviewReport, hasGeneratedKybReport, kybReportExportText } from './data/kybReviewReport.js';
import { getSessionRecords } from './data/sessionRecords.js';
import { queueDocumentViewerRoute } from './documentViewerRoute.js';
import { workflows } from './visualWorkspaceModel.js';

const toolDetails = {
  'Identity Intel / People Search': {
    purpose: 'Search fictional identity records by Training ID or Name + DOB, review the match summary, then open the full profile report.',
    question: 'Does this identity history support who they claim to be?',
  },
  'Login History': {
    purpose: 'Review authentication attempts, results, methods, devices, locations, MFA, and session references without mixing in post-login activity or drawing an early conclusion.',
    question: 'Who logged in, when, and from where?',
  },
  'Session History': {
    purpose: 'Review recorded actions after authentication and connect each session to its login, profile activity, payment activity, and logout state without drawing an early conclusion.',
    question: 'After login, what did the user do?',
  },
  'Device Intelligence': {
    purpose: 'Compare fictional device identifiers, browsers, sessions, methods, locations, and network records.',
    question: 'Which devices appear in the case activity, and where do those devices repeat?',
  },
  'IP Intelligence': {
    purpose: 'Look up fictional network and location evidence, then compare it with recorded sessions and devices without drawing an early conclusion.',
    question: 'Where did the connection originate, and has it been seen elsewhere?',
  },
  'Transaction History': {
    purpose: 'Review the transaction records in scope before comparing them with other financial and customer evidence.',
    question: 'What transactions are in scope, and what details are recorded for each item?',
  },
  'Merchant Intelligence': {
    purpose: 'Review merchant identity, category, customer history, authorization, fulfillment, disputes, refunds, subscription or marketplace activity, and reason-code evidence in one claim-specific workspace.',
    question: 'Is this a customer issue, merchant issue, fraud issue, or dispute issue?',
  },
  'Financial Investigation': {
    purpose: 'Use a direct money command center to compare balances, deposits, spending, cash, digital payments, linked accounts, merchants, behavior, and funds flow.',
    question: 'Does the money make sense?',
  },
  'Payment Verification': {
    purpose: 'Review neutral payment-object and verification records without treating a status as a final case decision.',
    question: 'What payment objects and verification states are recorded for this case?',
  },
  'Business 360': {
    purpose: 'Review the business relationship, status, observed activity, and case context in one neutral record set.',
    question: 'Which business relationships and entities are connected to the active case?',
  },
  'KYB Review': {
    purpose: 'Look up a fictional business and compare registration, owners, online presence, bank ownership, revenue, payroll, and source documents.',
    question: 'Do the business identity and operating records connect across independent sources?',
  },
  'Employee Profile': {
    purpose: 'Review employee identity, role, employer, status, timing, and related case context.',
    question: 'Which employee facts are available, and how do they connect to the case?',
  },
  'Payroll History': {
    purpose: 'Review payroll periods, employers, amounts, channels, statuses, and contextual details.',
    question: 'What payroll activity is recorded for the active case?',
  },
  'Document Viewer': {
    purpose: 'Search by exact Account ID, then review the matching customer documents, complete pages, extracted fields, and source details without drawing an early conclusion.',
    question: 'Which customer account do these documents belong to, and what can be verified from each record?',
  },
  'Document Request': {
    purpose: 'Track fictional case documents that were requested, received, missing, or awaiting review without treating the request status as a case outcome.',
    question: 'What documents were requested, received, missing, or pending review for this case?',
  },
  'Link Analysis': {
    purpose: 'Review connections between customer, access, identity, device, network, and case objects.',
    question: 'Which identifiers and records connect across the active case?',
  },
  'System Access Lane': {
    purpose: 'Review neutral internal, vendor, API, and permissioned third-party access records tied to case objects.',
    question: 'Which approved system-access records touch the active case objects?',
  },
};

function downloadAccessReport(report) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([accessReportExportText(report)], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${report.id}.txt`;
  link.click();
  window.URL.revokeObjectURL(url);
}

function downloadKybReport(report) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([kybReportExportText(report)], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${report.id}.txt`;
  link.click();
  window.URL.revokeObjectURL(url);
}

function detailFor(tool, activeCategory) {
  return toolDetails[tool] ?? {
    purpose: `Review the available ${activeCategory.label.toLowerCase()} records while the final decision remains locked.`,
    question: `What records are available inside ${tool}?`,
  };
}

function fieldPairs(columns, values) {
  return columns.map((column, index) => ({
    label: column,
    value: values[index] ?? 'Not recorded',
  }));
}

function searchableText(row) {
  return `${row.id} ${row.label} ${row.detail} ${row.values.join(' ')}`.toLowerCase();
}

function paymentRecordSearchText(record) {
  return [
    record.id,
    record.type,
    record.object,
    record.bankName,
    record.accountType,
    record.accountHolder,
    record.ownerMatch,
    record.accountStatus,
    record.standing,
    record.priorUse,
    record.firstSeen,
    record.verificationMethod,
    record.recoverability,
    record.bankCode,
    record.destinationId,
    record.oldDestination,
    record.newDestination,
    record.changeComparison,
    record.status,
    record.lastSeen,
    record.verificationOutcome,
    record.context,
    record.notes,
    ...(record.relatedRecords ?? []),
    ...(record.actions ?? []),
    ...(record.verificationLog ?? []).flatMap((entry) => [entry.time, entry.method, entry.result, entry.note]),
  ].filter(Boolean).join(' ').toLowerCase();
}

function statusTone(value = '') {
  const normalized = value.toLowerCase();
  if (/(name match|open|good|answered|confirmed|available|active)/.test(normalized)) return 'good';
  if (/(partial|pending|callback|more information|manual|recorded|tokenized)/.test(normalized)) return 'warn';
  if (/(no match|closed|frozen|fraud|nsf|unable|wrong|not confirmed|no answer)/.test(normalized)) return 'alert';
  return 'neutral';
}

function deviceRecordSearchText(record) {
  return [
    record.id,
    record.deviceName,
    record.deviceType,
    record.operatingSystem,
    record.browser,
    record.deviceFingerprint,
    record.browserFingerprint,
    record.firstSeen,
    record.lastSeen,
    record.trustedStatus,
    record.rootedJailbroken,
    record.emulatorIndicator,
    record.vpnProxyIndicator,
    record.sharedDeviceDetection,
    record.walletUsage,
    record.normalBehavior,
    record.lookupResult,
    record.investigatorUse,
    ...(record.linkedProfiles ?? []),
    ...(record.history ?? []),
    ...(record.relatedRecords ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function loginRecordSearchText(record) {
  return [
    record.id, record.timestamp, record.date, record.timeOfDay, record.eventType, record.result, record.method, record.mfaStatus, record.authChannel,
    record.device, record.deviceId, record.browserSource, record.operatingSystem, record.location, record.ip, record.sessionReference,
    record.failedAttemptCount, record.accountLockout, record.passwordResetLink, record.profileChangeLink,
    record.loginContext, record.investigatorUse, ...(record.relatedRecords ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function LoginHistoryWorkspace({
  activeCase,
  query,
  setQuery,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
}) {
  const [selectedLoginId, setSelectedLoginId] = useState('');
  const [resultFilter, setResultFilter] = useState('All results');
  const [methodFilter, setMethodFilter] = useState('All methods');
  const [deviceFilter, setDeviceFilter] = useState('All devices');
  const [dateFilter, setDateFilter] = useState('All dates');
  const [reportGenerated, setReportGenerated] = useState(() => generatedAccessReportTypes(activeCase.id).includes('login'));
  const records = getLoginRecords(activeCase);
  const normalizedQuery = query.trim().toLowerCase();
  const resultOptions = ['All results', ...new Set(records.map((record) => record.result))];
  const methodOptions = ['All methods', ...new Set(records.map((record) => record.method))];
  const deviceOptions = ['All devices', ...new Set(records.map((record) => record.deviceId ?? record.device))];
  const dateOptions = ['All dates', ...new Set(records.map((record) => record.date))];
  const filteredRecords = records.filter((record) => (
    (!normalizedQuery || loginRecordSearchText(record).includes(normalizedQuery))
    && (resultFilter === 'All results' || record.result === resultFilter)
    && (methodFilter === 'All methods' || record.method === methodFilter)
    && (deviceFilter === 'All devices' || (record.deviceId ?? record.device) === deviceFilter)
    && (dateFilter === 'All dates' || record.date === dateFilter)
  ));
  const loginFiltersClear = !normalizedQuery && resultFilter === 'All results' && methodFilter === 'All methods' && deviceFilter === 'All devices' && dateFilter === 'All dates';
  const activeRecord = filteredRecords.find((record) => record.id === selectedLoginId) ?? filteredRecords[0] ?? (loginFiltersClear ? records[0] : null);
  const successfulCount = records.filter((record) => /successful/i.test(record.result)).length;
  const deniedCount = records.filter((record) => /(failed|denied)/i.test(record.result)).length;
  const lockoutCount = records.filter((record) => /locked/i.test(record.result)).length;
  const uniqueDevices = new Set(records.map((record) => record.deviceId ?? record.device)).size;
  const mfaCount = records.filter((record) => /completed|delivered|approved/i.test(record.mfaStatus)).length;

  useEffect(() => {
    setSelectedLoginId('');
    setResultFilter('All results');
    setMethodFilter('All methods');
    setDeviceFilter('All devices');
    setDateFilter('All dates');
    setReportGenerated(generatedAccessReportTypes(activeCase.id).includes('login'));
  }, [activeCase.id]);

  function saveLoginNote(message) {
    saveNote(`Login History: ${message}`, 'Login history');
  }

  function generateLoginReport() {
    const report = generateAccessHistoryReport(activeCase, 'login');
    downloadAccessReport(report);
    setReportGenerated(true);
    saveLoginNote(`${report.title} generated and added to Document Viewer.`);
  }

  return (
    <>
      <section className="login-history-findbar" aria-label="Find login history information">
        <div>
          <p>Login records</p>
          <h3>Every recorded login is available below. Search a Login ID, Session ID, device, IP, location, MFA result, or linked activity to narrow the view.</h3>
        </div>
        <label>
          <span>Search Login History</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: SES-7781, Dallas, MFA, password reset, Mobile Safari..."
            aria-label="Search Login History records"
          />
        </label>
        <span aria-live="polite">{filteredRecords.length} of {records.length} records shown</span>
      </section>

      <section className="access-history-filters login-history-filters" aria-label="Filter Login History">
        <label><span>Result</span><select value={resultFilter} onChange={(event) => setResultFilter(event.target.value)} aria-label="Filter Login History by result">{resultOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Method</span><select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)} aria-label="Filter Login History by method">{methodOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Device</span><select value={deviceFilter} onChange={(event) => setDeviceFilter(event.target.value)} aria-label="Filter Login History by device">{deviceOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Date</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter Login History by date">{dateOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <button type="button" onClick={() => { setQuery(''); setResultFilter('All results'); setMethodFilter('All methods'); setDeviceFilter('All devices'); setDateFilter('All dates'); }}>Clear filters</button>
      </section>

      <section className="login-history-summary" aria-label="Login history summary">
        {[
          ['Authentication events', records.length],
          ['Successful', successfulCount],
          ['Failed / denied', deniedCount],
          ['Account lockouts', lockoutCount],
          ['Unique devices', uniqueDevices],
          ['MFA completed', mfaCount],
        ].map(([label, value]) => (
          <article key={label}><span>{label}</span><strong>{value}</strong></article>
        ))}
      </section>

      {activeRecord ? (
        <>
          <div className="login-history-workspace">
            <section className="login-record-list" aria-label="Login history records">
              <header>
                <p>Recorded logins</p>
                <h3>Choose a login to expand</h3>
              </header>
              {filteredRecords.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  className={record.id === activeRecord.id ? 'active' : ''}
                  onClick={() => setSelectedLoginId(record.id)}
                  data-login-history-record={record.id}
                >
                  <span>{record.timestamp} · {record.result}</span>
                  <strong>{record.deviceId ?? record.device}</strong>
                  <small>{record.eventType} · {record.location} · {record.ip} · {record.sessionReference}</small>
                </button>
              ))}
              {!filteredRecords.length && (
                <div className="investigation-tool-empty" role="status">No recorded logins match this search.</div>
              )}
            </section>

            <section className="login-detail-panel" aria-label="Expanded login history detail">
              <header>
                <div>
                  <p>Expanded authentication event</p>
                  <h3>{activeRecord.id} · {activeRecord.result}</h3>
                  <span>{activeRecord.timestamp} · {activeRecord.location}</span>
                </div>
                <button type="button" onClick={() => pin(activeRecord.id)}>Pin login event</button>
              </header>

              <dl className="login-detail-grid">
                {[
                  ['Date / time', activeRecord.timestamp], ['Event type', activeRecord.eventType], ['Result', activeRecord.result], ['Failed-attempt count', activeRecord.failedAttemptCount],
                  ['Account lockout', activeRecord.accountLockout], ['Method', activeRecord.method], ['MFA status', activeRecord.mfaStatus],
                  ['Authentication channel', activeRecord.authChannel], ['Device ID', activeRecord.deviceId ?? activeRecord.device], ['Device / browser', activeRecord.browserSource],
                  ['Operating system', activeRecord.operatingSystem], ['IP address', activeRecord.ip], ['Location', activeRecord.location], ['Session reference', activeRecord.sessionReference],
                ].map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>

              <section className="login-session-panel" aria-label="Session and linked activity">
                <article><span>Session availability</span><strong>{activeRecord.sessionReference === 'No session created' ? 'Authentication did not create a session' : `Open ${activeRecord.sessionReference} in Session History`}</strong></article>
                <article><span>Password reset timing</span><strong>{activeRecord.passwordResetLink}</strong></article>
                <article><span>Profile change link</span><strong>{activeRecord.profileChangeLink}</strong></article>
                <article><span>Authentication scope</span><strong>Post-login pages and actions are kept in Session History.</strong></article>
              </section>
            </section>
          </div>

          <section className="login-history-lower-grid" aria-label="Login history related evidence">
            <article className="login-related-panel">
              <header><p>Related Records</p><h3>Evidence to cross-reference</h3></header>
              <div>{(activeRecord.relatedRecords ?? []).map((item) => <span key={item}>{item}</span>)}</div>
            </article>
            <article className="login-notes-panel">
              <header><p>Investigator Notes</p><h3>Evidence-first reminder</h3></header>
              <p>{activeRecord.investigatorUse} A successful MFA event is evidence of authentication activity, not a final conclusion about authorization.</p>
              <div>
                <button type="button" onClick={() => saveLoginNote(`${activeRecord.id} reviewed: ${activeRecord.timestamp} · ${activeRecord.eventType} · ${activeRecord.result} · ${activeRecord.deviceId ?? activeRecord.device} · ${activeRecord.ip}`)}>Save login note</button>
                <button type="button" onClick={generateLoginReport}>{reportGenerated ? 'Regenerate Login Timeline Report' : 'Generate Login Timeline Report'}</button>
              </div>
            </article>
          </section>
        </>
      ) : (
        <div className="investigation-tool-empty" role="status">No login history records are available for this case.</div>
      )}

      <nav className="investigation-tool-next-routes" aria-label="Login history next routes">
        <button type="button" onClick={() => openTool('Session History')}>Open Session History</button>
        <button type="button" onClick={() => openTool('Device Intelligence')}>Open Device Intelligence</button>
        <button type="button" onClick={() => openTool('IP Intelligence')}>Open IP Intelligence</button>
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div>
          <strong>Login History review</strong>
          <span>Mark reviewed after checking authentication results, failed-attempt and lockout history, method, MFA, device, IP/location, and session references.</span>
        </div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Login History')}>
          {reviewed ? '✓ Login History reviewed' : 'Mark Login History reviewed'}
        </button>
      </footer>
    </>
  );
}

function sessionRecordSearchText(record) {
  return [
    record.session, record.id, record.start, record.end, record.duration, record.logoutStatus, record.method,
    record.device, record.deviceId, record.location, record.ip, record.result, record.investigatorUse,
    ...(record.pagesViewed ?? []), ...(record.securitySettings ?? []), ...(record.profileActions ?? []),
    ...(record.payeeTokenActivity ?? []), ...(record.moneyMovement ?? []), ...(record.sessionPath ?? []), ...(record.relatedRecords ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function ipRecordSearchText(record) {
  return [
    record.id, record.ip, record.city, record.country, record.isp, record.networkType, record.residentialStatus,
    record.vpnProxyTor, record.firstSeen, record.lastSeen, record.velocity, record.crossCasePresence, record.lookupResult,
    ...(record.historicalLocations ?? []), ...(record.observedSessions ?? []), ...(record.observedDevices ?? []),
    ...(record.observedLogins ?? []), ...(record.relatedRecords ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function IPIntelligenceWorkspace({
  activeCase,
  query,
  setQuery,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
}) {
  const [selectedIpId, setSelectedIpId] = useState('');
  const [submittedIp, setSubmittedIp] = useState('');
  const [reportGenerated, setReportGenerated] = useState(() => generatedAccessReportTypes(activeCase.id).includes('ip'));
  const records = getIpRecords(activeCase);
  const normalizedSubmittedIp = submittedIp.trim().replace(/^IP-/i, '').toLowerCase();
  const activeRecord = normalizedSubmittedIp
    ? records.find((record) => record.ip.toLowerCase() === normalizedSubmittedIp && (!selectedIpId || record.id === selectedIpId))
      ?? records.find((record) => record.ip.toLowerCase() === normalizedSubmittedIp)
      ?? null
    : null;
  const lookupHasRun = normalizedSubmittedIp.length > 0;
  const lookupMatched = Boolean(activeRecord);
  const sessionCount = records.reduce((count, record) => count + record.observedSessions.length, 0);
  const deviceCount = new Set(records.flatMap((record) => record.observedDevices)).size;

  useEffect(() => {
    setSelectedIpId('');
    setSubmittedIp('');
    setReportGenerated(generatedAccessReportTypes(activeCase.id).includes('ip'));
  }, [activeCase.id]);

  function runIpLookup() {
    const clean = query.trim().replace(/^IP-/i, '');
    setSubmittedIp(clean);
    const matched = records.find((record) => record.ip.toLowerCase() === clean.toLowerCase());
    setSelectedIpId(matched?.id ?? '');
  }

  function saveIpNote(message) {
    saveNote(`IP Intelligence: ${message}`, 'IP intelligence');
  }

  function generateIpReport() {
    const report = generateAccessHistoryReport(activeCase, 'ip');
    downloadAccessReport(report);
    setReportGenerated(true);
    saveIpNote(`${report.title} generated and added to Document Viewer.`);
  }

  return (
    <>
      <section className="ip-intel-findbar" aria-label="Find IP intelligence information">
        <div>
          <p>IP lookup</p>
          <h3>Enter one of the raw IP addresses below, then run the lookup to reveal its network and history records.</h3>
        </div>
        <label>
          <span>Search IP Intelligence</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') runIpLookup(); }}
            placeholder="Try: 198.51.100.42"
            aria-label="Search IP Intelligence records"
          />
        </label>
        <button type="button" className="ip-lookup-action" onClick={runIpLookup} disabled={!query.trim()}>Run IP Lookup</button>
        <span aria-live="polite">{lookupMatched ? 'Lookup complete' : lookupHasRun ? 'No exact IP match' : 'Lookup required'}</span>
      </section>

      <section className="ip-intel-summary" aria-label="IP intelligence summary">
        {[
          ['Raw IP records', records.length], ['Linked sessions', sessionCount], ['Observed devices', deviceCount],
          ['Lookup state', lookupMatched ? 'Complete' : lookupHasRun ? 'No match' : 'Required'], ['Related logins', records.reduce((count, record) => count + record.observedLogins.length, 0)], ['Active case', activeCase.id],
        ].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>

      {records.length ? (
        <>
          <div className="ip-intel-workspace">
            <section className="ip-record-list" aria-label="IP intelligence records">
              <header><p>Raw IP records</p><h3>Choose an IP to look up</h3></header>
              {records.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  className={record.id === activeRecord?.id ? 'active' : ''}
                  onClick={() => { setQuery(record.ip); setSubmittedIp(''); setSelectedIpId(record.id); }}
                  data-ip-intelligence-record={record.id}
                >
                  <span>{record.id}</span>
                  <strong>{record.ip}</strong>
                  <small>{record.observedLogins.length} authentication event{record.observedLogins.length === 1 ? '' : 's'} · {record.observedSessions.length} session{record.observedSessions.length === 1 ? '' : 's'} · {record.id === activeRecord?.id ? 'lookup complete' : 'lookup required'}</small>
                </button>
              ))}
            </section>

            <section className="ip-detail-panel" aria-label="Expanded IP intelligence detail">
              {activeRecord ? (
                <>
                  <header>
                    <div><p>Network lookup</p><h3>{activeRecord.ip}</h3><span>{activeRecord.lookupResult}</span></div>
                    <button type="button" onClick={() => pin(activeRecord.ip)}>Pin IP address</button>
                  </header>
                  <dl className="ip-detail-grid">
                    {[
                      ['City / country', `${activeRecord.city}, ${activeRecord.country}`], ['ISP', activeRecord.isp], ['Network type', activeRecord.networkType],
                      ['Residential status', activeRecord.residentialStatus], ['VPN / proxy / TOR', activeRecord.vpnProxyTor], ['First seen', activeRecord.firstSeen],
                      ['Last seen', activeRecord.lastSeen], ['Velocity', activeRecord.velocity], ['Seen elsewhere', activeRecord.crossCasePresence],
                    ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                  </dl>
                  <section className="ip-observation-panel" aria-label="Observed IP records">
                    <article><span>Recorded sessions</span><strong>{activeRecord.observedSessions.join(' · ') || 'No authenticated session recorded'}</strong></article>
                    <article><span>Recorded devices</span><strong>{activeRecord.observedDevices.join(' · ')}</strong></article>
                    <article><span>Location history</span><strong>{activeRecord.historicalLocations.join(' · ')}</strong></article>
                  </section>
                </>
              ) : (
                <div className="investigation-tool-empty ip-lookup-empty" role="status">
                  <span>{lookupHasRun ? 'No exact match' : 'Lookup required'}</span>
                  <h3>{lookupHasRun ? `No network record matched ${submittedIp}.` : 'Choose a raw IP and run the lookup.'}</h3>
                  <p>Network type, origin, historical use, VPN/proxy/TOR data, velocity, and cross-profile presence remain hidden until an exact fictional IP lookup succeeds.</p>
                </div>
              )}
            </section>
          </div>

          {activeRecord && <section className="ip-intel-lower-grid" aria-label="IP intelligence history and related evidence">
            <article className="ip-location-panel">
              <header><p>Location Sequence</p><h3>Evidence to compare</h3></header>
              <div>
                {activeRecord.observedLoginEvents.map((login) => <span key={login.id}>{login.time} · {login.id} · {login.result} · {login.session} · {login.location}</span>)}
              </div>
            </article>
            <article className="ip-related-panel">
              <header><p>Related Records</p><h3>Cross-reference points</h3></header>
              <div>{activeRecord.relatedRecords.map((item) => <span key={item}>{item}</span>)}</div>
            </article>
            <article className="ip-notes-panel">
              <header><p>Investigator Notes</p><h3>Evidence-first reminder</h3></header>
              <p>{activeRecord.investigatorUse}</p>
              <div>
                <button type="button" onClick={() => saveIpNote(`${activeRecord.ip} reviewed: ${activeRecord.lookupResult}`)}>Save IP note</button>
                <button type="button" onClick={generateIpReport}>{reportGenerated ? 'Regenerate IP Intelligence Report' : 'Generate IP Intelligence Report'}</button>
              </div>
            </article>
          </section>}
        </>
      ) : <div className="investigation-tool-empty" role="status">No IP intelligence records are available for this case.</div>}

      <nav className="investigation-tool-next-routes" aria-label="IP intelligence next routes">
        <button type="button" onClick={() => openTool('Login History')}>Open Login History</button>
        <button type="button" onClick={() => openTool('Session History')}>Open Session History</button>
        <button type="button" onClick={() => openTool('Device Intelligence')}>Open Device Intelligence</button>
        <button type="button" onClick={() => openTool('Customer 360')}>Open Customer 360</button>
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div><strong>IP Intelligence review</strong><span>Mark reviewed after running the lookup, checking network context, and comparing it to the linked login, session, device, and timeline evidence.</span></div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} disabled={!lookupMatched} onClick={() => markReviewed('IP Intelligence')}>
          {reviewed ? '✓ IP Intelligence reviewed' : 'Mark IP Intelligence reviewed'}
        </button>
      </footer>
    </>
  );
}

function SessionHistoryWorkspace({
  activeCase,
  query,
  setQuery,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
}) {
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [logoutFilter, setLogoutFilter] = useState('All logout states');
  const [activityFilter, setActivityFilter] = useState('All activity');
  const [deviceFilter, setDeviceFilter] = useState('All devices');
  const [dateFilter, setDateFilter] = useState('All dates');
  const [reportGenerated, setReportGenerated] = useState(() => generatedAccessReportTypes(activeCase.id).includes('session'));
  const records = getSessionRecords(activeCase);
  const normalizedQuery = query.trim().toLowerCase();
  const logoutOptions = ['All logout states', ...new Set(records.map((record) => record.logoutStatus))];
  const activityOptions = ['All activity', ...new Set(records.flatMap((record) => record.activityTypes ?? []))];
  const deviceOptions = ['All devices', ...new Set(records.map((record) => record.deviceId ?? record.device))];
  const dateOptions = ['All dates', ...new Set(records.map((record) => record.date))];
  const filteredRecords = records.filter((record) => (
    (!normalizedQuery || sessionRecordSearchText(record).includes(normalizedQuery))
    && (logoutFilter === 'All logout states' || record.logoutStatus === logoutFilter)
    && (activityFilter === 'All activity' || record.activityTypes?.includes(activityFilter))
    && (deviceFilter === 'All devices' || (record.deviceId ?? record.device) === deviceFilter)
    && (dateFilter === 'All dates' || record.date === dateFilter)
  ));
  const sessionFiltersClear = !normalizedQuery && logoutFilter === 'All logout states' && activityFilter === 'All activity' && deviceFilter === 'All devices' && dateFilter === 'All dates';
  const activeRecord = filteredRecords.find((record) => record.session === selectedSessionId) ?? filteredRecords[0] ?? (sessionFiltersClear ? records[0] : null);
  const loggedOutCount = records.filter((record) => /normal logout/i.test(record.logoutStatus)).length;
  const timeoutCount = records.filter((record) => /timeout/i.test(record.logoutStatus)).length;
  const profileActivityCount = records.filter((record) => record.hasProfileActivity).length;
  const moneyMovementCount = records.filter((record) => record.hasMoneyActivity).length;
  const uniqueDevices = new Set(records.map((record) => record.deviceId ?? record.device)).size;
  const uniqueIps = new Set(records.map((record) => record.ip)).size;

  useEffect(() => {
    setSelectedSessionId('');
    setLogoutFilter('All logout states');
    setActivityFilter('All activity');
    setDeviceFilter('All devices');
    setDateFilter('All dates');
    setReportGenerated(generatedAccessReportTypes(activeCase.id).includes('session'));
  }, [activeCase.id]);

  function saveSessionNote(message) {
    saveNote(`Session History: ${message}`, 'Session history');
  }

  function generateSessionReport() {
    const report = generateAccessHistoryReport(activeCase, 'session');
    downloadAccessReport(report);
    setReportGenerated(true);
    saveSessionNote(`${report.title} generated and added to Document Viewer.`);
  }

  return (
    <>
      <section className="session-history-findbar" aria-label="Find session history information">
        <div>
          <p>Session records</p>
          <h3>Every recorded session is available below. Search a Session ID, Login ID, device, IP, profile action, payment activity, or logout state to narrow the view.</h3>
        </div>
        <label>
          <span>Search Session History</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: SES-7781, card controls, timeout, payment method, profile..."
            aria-label="Search Session History records"
          />
        </label>
        <span aria-live="polite">{filteredRecords.length} of {records.length} records shown</span>
      </section>

      <section className="access-history-filters session-history-filters" aria-label="Filter Session History">
        <label><span>Logout state</span><select value={logoutFilter} onChange={(event) => setLogoutFilter(event.target.value)} aria-label="Filter Session History by logout state">{logoutOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Activity</span><select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)} aria-label="Filter Session History by activity">{activityOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Device</span><select value={deviceFilter} onChange={(event) => setDeviceFilter(event.target.value)} aria-label="Filter Session History by device">{deviceOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Date</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter Session History by date">{dateOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <button type="button" onClick={() => { setQuery(''); setLogoutFilter('All logout states'); setActivityFilter('All activity'); setDeviceFilter('All devices'); setDateFilter('All dates'); }}>Clear filters</button>
      </section>

      <section className="session-history-summary" aria-label="Session history summary">
        {[
          ['Recorded sessions', records.length], ['Normal logout', loggedOutCount], ['Session timeout', timeoutCount],
          ['Profile activity', profileActivityCount], ['Money activity', moneyMovementCount], ['Devices / IPs', `${uniqueDevices} / ${uniqueIps}`],
        ].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>

      {activeRecord ? (
        <>
          <div className="session-history-workspace">
            <section className="session-record-list" aria-label="Session history records">
              <header><p>Recorded sessions</p><h3>Choose a session to expand</h3></header>
              {filteredRecords.map((record) => (
                <button
                  key={record.session}
                  type="button"
                  className={record.session === activeRecord.session ? 'active' : ''}
                  onClick={() => setSelectedSessionId(record.session)}
                  data-session-history-record={record.session}
                >
                  <span>{record.start} to {record.end} · {record.duration}</span>
                  <strong>{record.session}</strong>
                  <small>{record.deviceId ?? record.device} · {record.logoutStatus}</small>
                </button>
              ))}
              {!filteredRecords.length && <div className="investigation-tool-empty" role="status">No recorded sessions match this search.</div>}
            </section>

            <section className="session-detail-panel" aria-label="Expanded session history detail">
              <header>
                <div><p>Expanded session</p><h3>{activeRecord.session}</h3><span>{activeRecord.start} to {activeRecord.end} · {activeRecord.logoutStatus}</span></div>
                <button type="button" onClick={() => pin(activeRecord.session)}>Pin session</button>
              </header>
              <dl className="session-detail-grid">
                {[
                  ['Login ID', activeRecord.id], ['Session start', activeRecord.start], ['Session end', activeRecord.end], ['Duration', activeRecord.duration],
                  ['Logout / timeout', activeRecord.logoutStatus], ['Authentication method', activeRecord.method], ['Device ID', activeRecord.deviceId ?? activeRecord.device],
                  ['IP / location', `${activeRecord.ip} · ${activeRecord.location}`],
                ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
              <section className="session-activity-grid" aria-label="Session activity detail">
                {[
                  ['Pages viewed', activeRecord.pagesViewed], ['Security settings', activeRecord.securitySettings], ['Profile actions', activeRecord.profileActions],
                  ['Payee / token activity', activeRecord.payeeTokenActivity], ['Transfer / purchase path', activeRecord.moneyMovement],
                ].map(([label, items]) => (
                  <article key={label}><span>{label}</span><strong>{items.join(' · ')}</strong></article>
                ))}
              </section>
            </section>
          </div>

          <section className="session-history-lower-grid" aria-label="Session history sequence and related evidence">
            <article className="session-path-panel">
              <header><p>Session Path</p><h3>Recorded order of activity</h3></header>
              <div>{activeRecord.sessionPath.map((item) => <span key={item}>{item}</span>)}</div>
            </article>
            <article className="session-related-panel">
              <header><p>Related Records</p><h3>Evidence to cross-reference</h3></header>
              <div>{activeRecord.relatedRecords.map((item) => <span key={item}>{item}</span>)}</div>
            </article>
            <article className="session-notes-panel">
              <header><p>Investigator Notes</p><h3>Evidence-first reminder</h3></header>
              <p>{activeRecord.investigatorUse} Read the session path with Login History, Customer 360, financial records, and Timeline before documenting a decision.</p>
              <div>
                <button type="button" onClick={() => saveSessionNote(`${activeRecord.session} reviewed: ${activeRecord.sessionPath.join(' / ')}`)}>Save session note</button>
                <button type="button" onClick={generateSessionReport}>{reportGenerated ? 'Regenerate Session History Report' : 'Generate Session History Report'}</button>
              </div>
            </article>
          </section>
        </>
      ) : <div className="investigation-tool-empty" role="status">No session history records are available for this case.</div>}

      <nav className="investigation-tool-next-routes" aria-label="Session history next routes">
        <button type="button" onClick={() => openTool('Login History')}>Open Login History</button>
        <button type="button" onClick={() => openTool('Customer 360')}>Open Customer 360</button>
        <button type="button" onClick={() => openTool('Transaction History')}>Open Transaction History</button>
        <button type="button" onClick={() => openTool('Payment Verification')}>Open Payment Verification</button>
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div><strong>Session History review</strong><span>Mark reviewed after checking the session start/end, activity path, logout state, and linked profile and financial records.</span></div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Session History')}>
          {reviewed ? '✓ Session History reviewed' : 'Mark Session History reviewed'}
        </button>
      </footer>
    </>
  );
}

function DeviceIntelligenceWorkspace({
  activeCase,
  query,
  setQuery,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
}) {
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const records = getDeviceProfiles(activeCase);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRecords = records.filter((record) => !normalizedQuery || deviceRecordSearchText(record).includes(normalizedQuery));
  const activeRecord = filteredRecords.find((record) => record.id === selectedDeviceId) ?? filteredRecords[0] ?? records[0];
  const lookupHasRun = normalizedQuery.length > 0;

  useEffect(() => {
    setSelectedDeviceId('');
  }, [activeCase.id]);

  function hiddenUntilLookup(value) {
    return lookupHasRun ? value : 'Run a device lookup to reveal';
  }

  function saveDeviceNote(message) {
    saveNote(`Device Intelligence: ${message}`, 'Device intelligence');
  }

  return (
    <>
      <section className="device-intel-findbar" aria-label="Find device intelligence information">
        <div>
          <p>Device lookup</p>
          <h3>Search a Device ID, fingerprint, browser, session, profile, wallet, or location to reveal device intelligence.</h3>
        </div>
        <label>
          <span>Search Device Intelligence</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: DEV-MAYA-IP16-001, fingerprint, emulator, shared, wallet, Safari..."
            aria-label="Search Device Intelligence records"
          />
        </label>
        <span aria-live="polite">{lookupHasRun ? `${filteredRecords.length} of ${records.length} records shown` : 'Lookup required'}</span>
      </section>

      {activeRecord ? (
        <>
          <section className="device-intel-snapshot" aria-label="Device intelligence snapshot">
            <article className="device-intel-hero">
              <p>Device Snapshot</p>
              <h3>{activeRecord.deviceName}</h3>
              <div className="payment-chip-row">
                <span className={`payment-status-chip ${statusTone(activeRecord.trustedStatus)}`}>{hiddenUntilLookup(activeRecord.trustedStatus)}</span>
                <span className={`payment-status-chip ${statusTone(activeRecord.lookupResult)}`}>{hiddenUntilLookup(activeRecord.lookupResult)}</span>
              </div>
            </article>
            {[
              ['Device ID', activeRecord.id],
              ['Fingerprint', hiddenUntilLookup(activeRecord.deviceFingerprint)],
              ['First seen', activeRecord.firstSeen],
              ['Last seen', activeRecord.lastSeen],
            ].map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </section>

          <div className="device-intel-workspace">
            <section className="device-record-list" aria-label="Device intelligence records">
              <header>
                <p>Device records</p>
                <h3>Choose the device to compare</h3>
              </header>
              {(lookupHasRun ? filteredRecords : records).map((record) => (
                <button
                  key={record.id}
                  type="button"
                  className={record.id === activeRecord.id ? 'active' : ''}
                  onClick={() => setSelectedDeviceId(record.id)}
                  data-device-intelligence-record={record.id}
                >
                  <span>{record.id}</span>
                  <strong>{record.deviceName}</strong>
                  <small>{record.deviceType} · {lookupHasRun ? record.lookupResult : 'lookup needed'}</small>
                </button>
              ))}
              {lookupHasRun && !filteredRecords.length && (
                <div className="investigation-tool-empty" role="status">No device intelligence records match this lookup.</div>
              )}
            </section>

            <section className="device-detail-panel" aria-label="Expanded device intelligence detail">
              <header>
                <div>
                  <p>Expanded device history</p>
                  <h3>{activeRecord.id}</h3>
                  <span>{activeRecord.deviceName} · {activeRecord.deviceType}</span>
                </div>
                <button type="button" onClick={() => pin(activeRecord.id)}>Pin Device ID</button>
              </header>

              <dl className="device-detail-grid">
                {[
                  ['Operating system', activeRecord.operatingSystem],
                  ['Browser', activeRecord.browser],
                  ['Browser fingerprint', hiddenUntilLookup(activeRecord.browserFingerprint)],
                  ['Trusted status', hiddenUntilLookup(activeRecord.trustedStatus)],
                  ['Rooted / jailbroken', hiddenUntilLookup(activeRecord.rootedJailbroken)],
                  ['Emulator-like indicator', hiddenUntilLookup(activeRecord.emulatorIndicator)],
                  ['VPN / proxy indicator', hiddenUntilLookup(activeRecord.vpnProxyIndicator)],
                  ['Shared device detection', hiddenUntilLookup(activeRecord.sharedDeviceDetection)],
                  ['Linked profiles', hiddenUntilLookup((activeRecord.linkedProfiles ?? []).join(' · '))],
                  ['Wallet usage', hiddenUntilLookup(activeRecord.walletUsage)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              <section className="device-behavior-panel" aria-label="Normal behavior comparison">
                <article>
                  <span>Normal behavior comparison</span>
                  <strong>{hiddenUntilLookup(activeRecord.normalBehavior)}</strong>
                </article>
                <article>
                  <span>How to use it</span>
                  <strong>{activeRecord.investigatorUse}</strong>
                </article>
              </section>
            </section>
          </div>

          <section className="device-intel-lower-grid" aria-label="Device history and related records">
            <article className="device-history-panel">
              <header>
                <p>Device History</p>
                <h3>Observed sessions</h3>
              </header>
              <div className="device-history-list">
                {(activeRecord.history ?? []).map((item) => <span key={item}>{item}</span>)}
              </div>
            </article>

            <article className="device-related-panel">
              <header>
                <p>Related Records</p>
                <h3>Cross-reference points</h3>
              </header>
              <div>
                {(activeRecord.relatedRecords ?? []).map((item) => <span key={item}>{item}</span>)}
              </div>
            </article>

            <article className="device-notes-panel">
              <header>
                <p>Investigator Notes</p>
                <h3>Evidence-first reminder</h3>
              </header>
              <p>Device Intelligence reveals lookup results only after search. Compare the device with Login History, Session History, IP Intelligence, and the customer story before deciding.</p>
              <div>
                <button type="button" onClick={() => saveDeviceNote(`${activeRecord.id} reviewed: ${activeRecord.normalBehavior}`)}>Save device note</button>
              </div>
            </article>
          </section>
        </>
      ) : (
        <div className="investigation-tool-empty" role="status">No device intelligence records are available for this case.</div>
      )}

      <nav className="investigation-tool-next-routes" aria-label="Device intelligence next routes">
        <button type="button" onClick={() => openTool('Login History')}>Open Login History</button>
        <button type="button" onClick={() => openTool('IP Intelligence')}>Open IP Intelligence</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div>
          <strong>Device Intelligence review</strong>
          <span>Mark reviewed after searching the device, checking fingerprint/history, and comparing it to normal behavior.</span>
        </div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Device Intelligence')}>
          {reviewed ? '✓ Device Intelligence reviewed' : 'Mark Device Intelligence reviewed'}
        </button>
      </footer>
    </>
  );
}

const documentRequestStatuses = ['All', 'Not Requested', 'Requested', 'Received', 'Incomplete', 'Received Late', 'No Response', 'Pending Review', 'Approved', 'Rejected', 'Expired', 'Missing', 'Exception Approved'];

function documentRequestSearchText(request) {
  return Object.values(request).filter(Boolean).join(' ').toLowerCase();
}

function DocumentRequestWorkspace({
  activeCase,
  query,
  setQuery,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
  documentRequests,
  setDocumentRequestsByCase,
}) {
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDocumentId, setComposeDocumentId] = useState('');
  const [composeReason, setComposeReason] = useState('Please provide this paperwork so the disputed claim can be reviewed.');
  const [composeChannel, setComposeChannel] = useState('Secure upload link');
  const [composeDueDate, setComposeDueDate] = useState(() => {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    return due.toISOString().slice(0, 10);
  });
  const [mobilePane, setMobilePane] = useState('inbox');
  const [requestConfirmation, setRequestConfirmation] = useState('');
  const requestTemplates = getPaperworkRequestTemplates(activeCase);
  const requests = buildPaperworkInboxRecords(activeCase, documentRequests);
  const merchantDocuments = getCaseDocuments(activeCase).filter((document) => document.folder === 'Merchant Evidence' && document.pages?.length);
  const firstMerchantDocument = merchantDocuments[0];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRequests = requests.filter((request) => (
    (statusFilter === 'All' || request.status === statusFilter)
    && (!normalizedQuery || documentRequestSearchText(request).includes(normalizedQuery))
  ));
  const activeRequest = filteredRequests.find((request) => request.id === selectedRequestId) ?? filteredRequests[0];
  const counts = documentRequestStatuses.slice(1).map((status) => [status, requests.filter((request) => request.status === status).length]);

  useEffect(() => {
    setSelectedRequestId('');
    setStatusFilter('All');
    setComposeOpen(false);
    setComposeDocumentId('');
    setMobilePane('inbox');
    setRequestConfirmation('');
  }, [activeCase.id]);

  function saveRequestNote(message) {
    saveNote(`Document Request: ${message}`, 'Document request');
  }

  function openComposer(request) {
    const requestedSourceId = request?.sourceDocumentId;
    const sourceDocumentId = requestTemplates.some((item) => item.id === requestedSourceId)
      ? requestedSourceId
      : requestTemplates[0]?.id ?? '';
    const requestedTitle = request?.requestedDocumentType ?? request?.documentType ?? requestTemplates[0]?.title ?? 'this paperwork';
    setComposeDocumentId(sourceDocumentId);
    setComposeReason(['Incomplete', 'No Response'].includes(request?.status)
      ? `Please provide a complete copy of ${requestedTitle}, including every page and visible reference.`
      : 'Please provide this paperwork so the disputed claim can be reviewed.');
    setComposeChannel(request?.requestDeliveryChannel === 'Not sent' ? 'Secure upload link' : request?.requestDeliveryChannel ?? 'Secure upload link');
    setComposeOpen(true);
    setMobilePane('compose');
    setRequestConfirmation('');
  }

  function submitPaperworkRequest(event) {
    event.preventDefault();
    const document = requestTemplates.find((request) => request.id === composeDocumentId);
    if (!document || !composeReason.trim()) return;
    const requestedDate = new Date().toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    const dueDate = composeDueDate
      ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${composeDueDate}T12:00:00`))
      : 'Follow-up date not supplied';
    const attempt = createPaperworkAttempt({
      activeCase,
      document,
      reason: composeReason.trim(),
      dueDate,
      requestedDate,
      deliveryChannel: composeChannel,
    });
    setDocumentRequestsByCase((current) => ({
      ...current,
      [activeCase.id]: {
        ...(current[activeCase.id] ?? {}),
        [document.id]: {
          schemaVersion: 2,
          sourceDocumentId: document.id,
          attempts: [...(current[activeCase.id]?.[document.id]?.attempts ?? []), attempt],
        },
      },
    }));
    setSelectedRequestId(attempt.requestId);
    setStatusFilter('All');
    setComposeOpen(false);
    setMobilePane('reader');
    setRequestConfirmation(`${document.title} request sent to ${activeCase.person ?? 'the customer'} through ${composeChannel}.`);
    saveRequestNote(`${document.title} requested from ${activeCase.person ?? 'the customer'} through ${composeChannel}; follow-up due ${dueDate}.`);
  }

  function checkCustomerResponse(request = activeRequest) {
    if (!request || request.recordKind !== 'outbound-request' || request.status !== 'Requested' || request.responseCheckedAt) return;
    const sourceDocument = requestTemplates.find((item) => item.id === request.sourceDocumentId);
    if (!sourceDocument) return;
    const checkedAt = new Date().toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    const currentAttempt = documentRequests[request.sourceDocumentId]?.attempts?.find((attempt) => attempt.attemptId === request.attemptId);
    if (!currentAttempt) return;
    const updatedAttempt = applyCustomerResponse({ activeCase, document: sourceDocument, attempt: currentAttempt, checkedAt });
    setDocumentRequestsByCase((current) => ({
      ...current,
      [activeCase.id]: (() => {
        const caseRequests = current[activeCase.id] ?? {};
        const documentState = caseRequests[request.sourceDocumentId] ?? { schemaVersion: 2, sourceDocumentId: request.sourceDocumentId, attempts: [] };
        const attempts = documentState.attempts.map((attempt) => attempt.attemptId === request.attemptId ? updatedAttempt : attempt);
        return { ...caseRequests, [request.sourceDocumentId]: { ...documentState, attempts } };
      })(),
    }));
    setSelectedRequestId(updatedAttempt.responseId || updatedAttempt.requestId);
    setStatusFilter('All');
    setMobilePane('reader');
    const confirmation = updatedAttempt.responseStatus === 'No Response'
      ? `${sourceDocument.title}: no customer response was received for this scenario.`
      : updatedAttempt.responseStatus === 'Incomplete'
        ? `${sourceDocument.title} received from the customer, but the submission is incomplete.`
        : updatedAttempt.responseStatus === 'Received Late'
          ? `${sourceDocument.title} received from the customer after the follow-up date.`
          : `${sourceDocument.title} received from the customer and added as a separate Document Viewer record.`;
    setRequestConfirmation(confirmation);
    saveRequestNote(`${sourceDocument.title} response check recorded: ${updatedAttempt.responseStatus}.`);
  }

  function openRequest(requestId) {
    setSelectedRequestId(requestId);
    setComposeOpen(false);
    setMobilePane('reader');
    setRequestConfirmation('');
  }

  function openDocumentViewerRoute({ folder = 'All Documents', documentId = '', pane = 'inbox' } = {}) {
    queueDocumentViewerRoute({ caseId: activeCase.id, folder, documentId, pane });
    openTool('Document Viewer');
  }

  function openMerchantPaperwork() {
    openDocumentViewerRoute({
      folder: 'Merchant Evidence',
      documentId: firstMerchantDocument?.id ?? '',
      pane: firstMerchantDocument ? 'reader' : 'inbox',
    });
  }

  return (
    <>
      <section className="document-request-findbar" aria-label="Find document request information">
        <div>
          <p>Paperwork inbox</p>
          <h3>Send, track, and review case paperwork without leaving the active claim.</h3>
        </div>
        <label>
          <span>Search Document Request</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: affidavit, cancellation, required, missing, Document Viewer..."
            aria-label="Search Document Request records"
          />
        </label>
        <span aria-live="polite">{filteredRequests.length} of {requests.length} requests shown</span>
      </section>

      {requestConfirmation && <div className="document-request-confirmation" role="status">✓ {requestConfirmation}</div>}

      <div className="document-request-inbox" data-mobile-pane={composeOpen ? 'compose' : mobilePane}>
        <aside className="document-request-statuses" aria-label="Document request statuses">
          <button type="button" className="document-request-compose-button" onClick={() => openComposer()} disabled={!requestTemplates.length}>＋ Request Paperwork</button>
          <p>Mailboxes</p>
          {documentRequestStatuses.map((status) => {
            const count = status === 'All' ? requests.length : requests.filter((request) => request.status === status).length;
            if (status !== 'All' && count === 0) return null;
            return <button key={status} type="button" className={statusFilter === status ? 'active' : ''} onClick={() => { setStatusFilter(status); setMobilePane('inbox'); }}>{status === 'All' ? 'All paperwork' : status}<strong>{count}</strong></button>;
          })}
          {firstMerchantDocument && <button type="button" className="document-request-viewer-route merchant-paperwork-route" onClick={openMerchantPaperwork}>View Merchant Paperwork <strong>{merchantDocuments.length}</strong></button>}
          <button type="button" className="document-request-viewer-route" onClick={() => openDocumentViewerRoute()}>Open All Documents</button>
        </aside>

        <section className="document-request-list" aria-label="Document request records">
            <header>
              <p>{statusFilter === 'All' ? 'All paperwork' : statusFilter}</p>
              <h3>{filteredRequests.length} conversation{filteredRequests.length === 1 ? '' : 's'}</h3>
            </header>
            {filteredRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                className={request.id === activeRequest.id ? 'active' : ''}
                onClick={() => openRequest(request.id)}
                data-document-request={request.id}
              >
                <span className={`document-request-status-dot status-${request.status.toLowerCase().replace(/\s+/g, '-')}`} aria-hidden="true"></span>
                <span className="document-request-message-copy"><strong>{request.documentType}</strong><small>{request.status === 'Not Requested' ? 'Not sent' : request.pagesAvailable ? `From: ${request.sender}` : `To: ${request.recipient}`} · {request.requirement}</small><em>{request.reason}</em></span>
                <span className="document-request-message-meta"><small>{request.status}</small><time>{request.recordKind === 'customer-submission' ? request.receivedDate : request.requestedDate}</time></span>
              </button>
            ))}
            {!filteredRequests.length && <div className="investigation-tool-empty" role="status">No document requests match this filter or search.</div>}
          </section>

        <main className="document-request-detail" aria-label={composeOpen ? 'Compose paperwork request' : 'Expanded document request detail'}>
          {composeOpen ? (
            <form className="document-request-compose" onSubmit={submitPaperworkRequest}>
              <header>
                <button type="button" className="document-request-mobile-back" onClick={() => { setComposeOpen(false); setMobilePane(activeRequest ? 'reader' : 'inbox'); }}>‹ Back</button>
                <div><p>New request</p><h3>Request Paperwork</h3><span>This creates a saved request on {activeCase.id}.</span></div>
              </header>
              <label><span>To</span><input value={activeCase.person ?? 'Customer on the active case'} readOnly aria-label="Paperwork request recipient" /></label>
              <label><span>Paperwork</span><select value={composeDocumentId || requestTemplates[0]?.id || ''} onChange={(event) => setComposeDocumentId(event.target.value)} aria-label="Paperwork to request">{requestTemplates.map((request) => <option key={request.id} value={request.id}>{request.title}</option>)}</select></label>
              <label><span>Delivery method</span><select value={composeChannel} onChange={(event) => setComposeChannel(event.target.value)} aria-label="Paperwork request delivery method"><option>Secure upload link</option><option>Email</option><option>Mail</option><option>Customer service follow-up</option></select></label>
              <label><span>Follow-up due</span><input type="date" value={composeDueDate} onChange={(event) => setComposeDueDate(event.target.value)} aria-label="Paperwork request due date" /></label>
              <label className="document-request-compose-reason"><span>Message / reason</span><textarea value={composeReason} onChange={(event) => setComposeReason(event.target.value)} aria-label="Paperwork request reason" /></label>
              <div className="document-request-compose-actions"><button type="button" onClick={() => { setComposeOpen(false); setMobilePane(activeRequest ? 'reader' : 'inbox'); }}>Cancel</button><button type="submit" className="primary" disabled={!composeDocumentId && !requestTemplates[0]?.id}>Send Request</button></div>
            </form>
          ) : activeRequest ? (<>
            <header>
              <button type="button" className="document-request-mobile-back" onClick={() => setMobilePane('inbox')}>‹ Inbox</button>
              <div>
                <p>Paperwork conversation</p>
                <h3>{activeRequest.documentType}</h3>
                <span>{activeRequest.id} · {activeRequest.status}</span>
              </div>
              <button type="button" onClick={() => pin(`${activeRequest.id} · ${activeRequest.documentType}`)}>Pin request</button>
            </header>
            {activeRequest.status === 'Not Requested' ? (
              <section className="document-request-not-sent" role="status">
                <span>Not requested</span>
                <h4>No paperwork request has been sent.</h4>
                <p>The customer has not been contacted for this item. Send a request only when the claim scenario requires this evidence.</p>
                <button type="button" onClick={() => openComposer(activeRequest)}>Request this paperwork</button>
              </section>
            ) : activeRequest.pagesAvailable ? (<>
              <section className="document-request-message-header"><dl><div><dt>From</dt><dd>{activeRequest.sender}</dd></div><div><dt>To</dt><dd>Fraud Academy Chargebacks</dd></div><div><dt>Received</dt><dd>{activeRequest.receivedDate}</dd></div><div><dt>Source</dt><dd>{activeRequest.deliveryChannel}</dd></div></dl></section>
              <article className="document-request-message-body inbound">{activeRequest.unread && <span className="document-request-unread">New customer submission</span>}<p>Customer-submitted paperwork received for case <strong>{activeRequest.linkedCase}</strong>.</p><p>{activeRequest.reason}</p><p>Open the source document below and review the actual page before recording what it supports or leaves unresolved.</p></article>
            </>) : activeRequest.status === 'No Response' ? (<>
              <section className="document-request-message-header"><dl><div><dt>Request sent to</dt><dd>{activeRequest.recipient}</dd></div><div><dt>Sent</dt><dd>{activeRequest.requestedDate}</dd></div><div><dt>Follow-up checked</dt><dd>{activeRequest.responseCheckedAt}</dd></div><div><dt>Result</dt><dd>No customer submission</dd></div></dl></section>
              <article className="document-request-message-body"><p>No document was returned after this request was checked.</p><p>The request history stays visible, but there is no source page to review for this scenario.</p></article>
            </>) : (<>
              <section className="document-request-message-header"><dl><div><dt>From</dt><dd>Fraud Academy Document Services</dd></div><div><dt>To</dt><dd>{activeRequest.recipient}</dd></div><div><dt>Sent</dt><dd>{activeRequest.requestedDate}</dd></div><div><dt>Delivery</dt><dd>{activeRequest.deliveryChannel}</dd></div></dl></section>
              <article className="document-request-message-body"><p>Hello {activeRequest.recipient},</p><p>{activeRequest.reason}</p><p>Please submit the requested paperwork by <strong>{activeRequest.dueDate}</strong>. The request is now waiting for the scenario customer to respond; no document is created by the agent.</p><p>Thank you,<br />Fraud Academy Document Services</p></article>
            </>)}
            <dl>
              {[
                ['Document type', activeRequest.documentType],
                ['Required / optional', activeRequest.requirement],
                ['Due date', activeRequest.dueDate],
                ['Status', activeRequest.status],
                ['Authenticity flag', activeRequest.authenticity],
                ['Linked case', activeRequest.linkedCase],
                ['Linked tool', activeRequest.linkedTool],
                ['Received date', activeRequest.receivedDate],
                ...(activeRequest.responseCheckedAt ? [['Response checked', activeRequest.responseCheckedAt]] : []),
              ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            <article className="document-request-notes">
              <span>Reviewer notes</span>
              <p>{activeRequest.reviewerNotes}</p>
              <small>{activeRequest.fields}</small>
            </article>
            <div className="document-request-actions">
              <button type="button" onClick={() => saveRequestNote(`${activeRequest.id} follow-up recorded for ${activeRequest.status}.`)}>Save follow-up note</button>
              {activeRequest.recordKind === 'outbound-request' && activeRequest.status === 'Requested' && !activeRequest.responseCheckedAt && <button type="button" className="document-request-check-response" onClick={() => checkCustomerResponse(activeRequest)}>Check for Customer Response</button>}
              {['Not Requested', 'Incomplete', 'No Response'].includes(activeRequest.status) && <button type="button" onClick={() => openComposer(activeRequest)}>{activeRequest.status === 'Not Requested' ? 'Request paperwork' : 'Request again'}</button>}
              {activeRequest.pagesAvailable && <button type="button" onClick={() => openDocumentViewerRoute({ folder: activeRequest.category, documentId: activeRequest.documentViewerId, pane: 'reader' })}>Open Customer Document</button>}
              {firstMerchantDocument && <button type="button" onClick={openMerchantPaperwork}>View Merchant Paperwork</button>}
            </div>
          </>) : <div className="investigation-tool-empty" role="status">No document requests are available for this case.</div>}
        </main>
      </div>

      <section className="document-request-summary" aria-label="Document request workflow summary">
        {counts.filter(([, count]) => count > 0).map(([status, count]) => <article key={status}><span>{status}</span><strong>{count}</strong></article>)}
      </section>

      <nav className="investigation-tool-next-routes" aria-label="Document request next routes">
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div>
          <strong>Document Request review</strong>
          <span>Review completion records workflow progress only. It does not determine the case outcome.</span>
        </div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Document Request')}>
          {reviewed ? '✓ Document Request reviewed' : 'Mark Document Request reviewed'}
        </button>
      </footer>
    </>
  );
}

function IdentityIntelWorkspace({
  activeCase,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
}) {
  const report = useMemo(() => getIdentityIntelReport(activeCase), [activeCase]);
  const [searchMode, setSearchMode] = useState('id');
  const [idDraft, setIdDraft] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [dobDraft, setDobDraft] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('identity-summary');
  const searchMatched = submittedSearch && matchesIdentityIntelSearch(report, submittedSearch);
  const searchReady = searchMode === 'id' ? Boolean(idDraft.trim()) : Boolean(nameDraft.trim() && dobDraft.trim());
  const activeSection = report.sections.find((section) => section.id === activeSectionId) ?? report.sections[0];

  useEffect(() => {
    setSearchMode('id');
    setIdDraft('');
    setNameDraft('');
    setDobDraft('');
    setSubmittedSearch(null);
    setSearchHistory([]);
    setReportOpen(false);
    setActiveSectionId('identity-summary');
  }, [activeCase.id]);

  function runSearch() {
    if (!searchReady) return;
    const criteria = searchMode === 'id'
      ? { mode: 'id', id: idDraft.trim() }
      : { mode: 'name-dob', name: nameDraft.trim(), dob: dobDraft.trim() };
    const label = criteria.mode === 'id' ? `Training ID: ${criteria.id}` : `${criteria.name} · ${criteria.dob}`;
    setSubmittedSearch(criteria);
    setSearchHistory((current) => [label, ...current.filter((item) => item !== label)].slice(0, 4));
    setReportOpen(false);
    setActiveSectionId('identity-summary');
  }

  function saveIdentityNote(message) {
    saveNote(`Identity Intel: ${message}`, 'Identity Intel');
  }

  function exportIdentityReport() {
    const lines = [
      'Fraud Academy - Identity Search Report',
      `Case: ${activeCase.id}`,
      `Profile: ${report.profile.profileId}`,
      `Subject: ${activeCase.person}`,
      'Fictional training data only',
      '',
      ...report.summary.map(([label, value]) => `${label}: ${value}`),
      '',
      ...report.sections.flatMap((section) => [section.title, ...section.fields.map((field) => `${field.label}: ${field.value}`), '']),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeCase.id}-identity-search-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <section className="identity-intel-search" aria-label="Identity Intel search">
        <div>
          <p>People Search</p>
          <h3>Search by fictional Training ID or by Name + DOB.</h3>
          <span>Fictional training data only. Identity information is evidence, not a case conclusion.</span>
        </div>
        <div className="identity-intel-search-fields">
          <label><span>Search method</span><select value={searchMode} onChange={(event) => setSearchMode(event.target.value)} aria-label="Choose People Search method"><option value="id">SSN / Training ID</option><option value="name-dob">Name + DOB</option></select></label>
          {searchMode === 'id' ? <label><span>Fictional Training ID</span><input value={idDraft} onChange={(event) => setIdDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') runSearch(); }} placeholder="TRN-8842-19" aria-label="Search Identity Intel by Training ID" /></label> : <>
            <label><span>Full name</span><input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') runSearch(); }} placeholder="Maya Sterling" aria-label="Search Identity Intel by name" /></label>
            <label><span>Date of birth</span><input value={dobDraft} onChange={(event) => setDobDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') runSearch(); }} placeholder="Feb 14, 1988" aria-label="Search Identity Intel by date of birth" /></label>
          </>}
        </div>
        <button type="button" onClick={runSearch} disabled={!searchReady}>Run People Search</button>
      </section>

      {!submittedSearch && <section className="identity-intel-gate" aria-label="Identity report locked">
        <strong>Identity report hidden until a search is run.</strong>
        <span>Use a fictional profile value from the active case to reveal the report.</span>
      </section>}

      {submittedSearch && !searchMatched && <section className="identity-intel-gate" aria-label="No identity match">
        <strong>No fictional identity match returned for this search.</strong>
        <span>Use the fictional Training ID, or pair the customer name with the exact training DOB from Customer 360.</span>
      </section>}

      {searchMatched && <>
        <section className="identity-intel-summary" aria-label="Identity Match Summary">
          <header>
            <div>
              <p>Identity Match Summary</p>
              <h3>{activeCase.person}</h3>
              <span>{report.profile.profileId} · Fictional training profile</span>
            </div>
            <div className="identity-intel-summary-actions"><button type="button" onClick={() => pin(`${report.profile.profileId} · ${activeCase.person}`)}>Pin profile</button><button type="button" onClick={() => saveIdentityNote(`Identity Match Summary ${report.profile.profileId} reviewed for ${activeCase.person}.`)}>Save summary note</button><button type="button" className="investigation-tool-primary" onClick={() => setReportOpen(true)}>{reportOpen ? 'Full Profile Report Open' : 'View Full Profile Report'}</button></div>
          </header>
          <dl>
            {report.summary.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </section>

        <section className="identity-intel-counts" aria-label="Identity report counts">
          {report.counts.map(([label, count]) => <article key={label}><strong>{count}</strong><span>{label}</span></article>)}
        </section>

        {!reportOpen && <section className="identity-intel-gate" aria-label="Full identity report closed"><strong>Identity Match Summary returned.</strong><span>Review the match and count bubbles, then open the full fictional profile report.</span></section>}

        {reportOpen && <div className="identity-intel-workspace">
          <section className="identity-intel-sections identity-intel-source-panel" aria-label="People Search history and source records">
            <header><p>Search & Sources</p><h3>Criteria and matched objects</h3></header>
            <div className="identity-intel-search-history">{searchHistory.map((item, index) => <span key={`${item}-${index}`}><strong>{index ? 'Previous search' : 'Current search'}</strong>{item}</span>)}</div>
            <div className="identity-intel-source-records">{(activeCase.identityRecords ?? []).map((item) => <article key={item.id}><span>{item.type}</span><strong>{item.value}</strong><small>{item.id} · {item.lastSeen}</small><button type="button" onClick={() => pin(`${item.id} · ${item.value}`)}>Pin</button></article>)}</div>
          </section>

          <section className="identity-intel-report" aria-label="Expanded identity report">
            <header>
              <div><p>Fictional report section</p><h3>{activeSection.title}</h3></div>
              <button type="button" onClick={() => saveIdentityNote(`${activeSection.title} reviewed for ${report.profile.profileId}.`)}>Save section note</button>
            </header>
            <dl>{activeSection.fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
          </section>

          <aside className="identity-intel-evidence" aria-label="Evidence Explorer">
            <header><p>Evidence Explorer</p><h3>Open a full report section</h3></header>
            <div className="identity-intel-section-buttons">{report.sections.map((section) => <button key={section.id} type="button" aria-label={section.title} className={section.id === activeSection.id ? 'active' : ''} onClick={() => setActiveSectionId(section.id)}><strong>{section.title}</strong><span>{section.fields.length} fields</span></button>)}</div>
            <button type="button" onClick={exportIdentityReport}>Generate Identity Search Report</button>
          </aside>
        </div>}
      </>}

      <nav className="investigation-tool-next-routes" aria-label="Identity Intel next routes">
        <button type="button" onClick={() => openTool('Customer 360')}>Open Customer 360</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div>
          <strong>Identity Intel / People Search review</strong>
          <span>Run a search, review the fictional report, and compare it with case evidence before marking this tool reviewed.</span>
        </div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} disabled={!searchMatched || !reportOpen} onClick={() => markReviewed('Identity Intel / People Search')}>
          {reviewed ? '✓ Identity Intel / People Search reviewed' : 'Mark Identity Intel / People Search reviewed'}
        </button>
      </footer>
    </>
  );
}

function TransactionHistoryWorkspace({ activeCase, pin, saveNote, markReviewed, reviewed, openTool, jumpDecision }) {
  const records = useMemo(() => getTransactionHistory(activeCase), [activeCase]);
  const [merchantSearch, setMerchantSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [account, setAccount] = useState('All accounts');
  const [channel, setChannel] = useState('All channels');
  const [direction, setDirection] = useState('All activity');
  const [selectedId, setSelectedId] = useState('');
  const accounts = ['All accounts', ...new Set(records.map((record) => record.instrument))];
  const channels = ['All channels', ...new Set(records.map((record) => record.channel))];
  const filteredRecords = records.filter((record) => {
    const date = new Date(record.posted);
    return (!merchantSearch || `${record.id} ${record.merchant} ${record.category} ${record.instrument}`.toLowerCase().includes(merchantSearch.toLowerCase()))
      && (account === 'All accounts' || record.instrument === account)
      && (channel === 'All channels' || record.channel === channel)
      && (direction === 'All activity' || record.direction === direction)
      && (!fromDate || date >= new Date(`${fromDate}T00:00:00`))
      && (!toDate || date <= new Date(`${toDate}T23:59:59`));
  });
  const activeRecord = filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? records[0];
  const total = filteredRecords.reduce((sum, record) => sum + record.amountValue, 0);

  useEffect(() => {
    setMerchantSearch('');
    setFromDate('');
    setToDate('');
    setAccount('All accounts');
    setChannel('All channels');
    setDirection('All activity');
    setSelectedId('');
  }, [activeCase.id]);

  function saveTransactionNote(message) {
    saveNote(`Transaction History: ${message}`, 'Transaction history');
  }

  return (
    <>
      <section className="transaction-history-findbar" aria-label="Transaction History filters">
        <div><p>Banking activity</p><h3>Case activity view. Filter merchant, date, account, amount context, channel, or debit and credit activity.</h3></div>
        <label><span>Merchant or transaction</span><input value={merchantSearch} onChange={(event) => setMerchantSearch(event.target.value)} placeholder="Merchant, transaction ID, category, or account" aria-label="Search Transaction History" /></label>
        <label><span>From date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label="Transaction History from date" /></label>
        <label><span>To date</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} aria-label="Transaction History to date" /></label>
      </section>

      <section className="transaction-history-filter-row" aria-label="Transaction History quick filters">
        <select value={channel} onChange={(event) => setChannel(event.target.value)} aria-label="Transaction channel filter">{channels.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={direction} onChange={(event) => setDirection(event.target.value)} aria-label="Transaction debit credit filter"><option>All activity</option><option>Debit</option><option>Non-monetary</option></select>
        <span>{filteredRecords.length} of {records.length} activity records shown</span>
      </section>

      <section className="transaction-history-summary" aria-label="Transaction History summary">
        <article><span>Activity window</span><strong>30 days</strong></article>
        <article><span>Records shown</span><strong>{filteredRecords.length}</strong></article>
        <article><span>Debit activity shown</span><strong>${total.toFixed(2)}</strong></article>
        <article><span>Accounts / cards</span><strong>{accounts.length - 1}</strong></article>
      </section>

      <div className="transaction-history-account-rail" aria-label="Transaction account and card rail">
        {accounts.map((item) => <button key={item} type="button" className={account === item ? 'active' : ''} onClick={() => setAccount(item)}>{item}</button>)}
      </div>

      {activeRecord ? <div className="transaction-history-workspace">
        <section className="transaction-history-list" aria-label="Transaction History activity feed">
          <header><p>Activity feed</p><h3>Choose a transaction to expand</h3></header>
          {filteredRecords.map((record) => <button key={record.id} type="button" className={record.id === activeRecord.id ? 'active' : ''} onClick={() => setSelectedId(record.id)} data-transaction-history-record={record.id}>
            <span>{record.posted} at {record.time}</span><strong>{record.merchant}</strong><small>{record.amount} | {record.channel} | {record.instrument}</small>
          </button>)}
          {!filteredRecords.length && <div className="investigation-tool-empty" role="status">No activity records match these filters.</div>}
        </section>

        <section className="transaction-history-detail" aria-label="Transaction detail drawer">
          <header><div><p>Transaction detail drawer</p><h3>{activeRecord.id} | {activeRecord.merchant}</h3><span>{activeRecord.posted} at {activeRecord.time}</span></div><button type="button" onClick={() => pin(activeRecord.id)}>Pin transaction</button></header>
          <dl>{[
            ['Amount', activeRecord.amount], ['Direction', activeRecord.direction], ['Account / card', activeRecord.instrument], ['Channel', activeRecord.channel], ['Category', activeRecord.category], ['Card entry mode', activeRecord.entryMode], ['Location', activeRecord.location], ['Status', activeRecord.status],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <article className="transaction-history-context"><span>Recorded context</span><p>{activeRecord.context}</p></article>
          <div className="transaction-history-actions"><button type="button" onClick={() => saveTransactionNote(`${activeRecord.id} reviewed with ${activeRecord.entryMode} and ${activeRecord.instrument}.`)}>Save transaction note</button><button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button></div>
        </section>

        <aside className="transaction-history-evidence" aria-label="Transaction related evidence">
          <header><p>Related evidence</p><h3>Objects and documents</h3></header>
          <article><span>Related records</span><strong>{activeRecord.relatedRecords.join(' | ')}</strong></article>
          <article><span>Related documents</span><strong>{activeRecord.relatedDocuments.join(' | ') || 'No document linked in current packet'}</strong></article>
        </aside>
      </div> : <div className="investigation-tool-empty" role="status">No transaction records are available for this case.</div>}

      <nav className="investigation-tool-next-routes" aria-label="Transaction History next routes">
        {activeCase.availableTools?.includes('Merchant Intelligence') && <button type="button" onClick={() => openTool('Merchant Intelligence')}>Open Merchant Intelligence</button>}
        {activeCase.availableTools?.includes('Financial Investigation') && <button type="button" onClick={() => openTool('Financial Investigation')}>Open Financial Investigation</button>}
        {activeCase.availableTools?.includes('Payment Verification') && <button type="button" onClick={() => openTool('Payment Verification')}>Open Payment Verification</button>}
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>
      <footer className="investigation-tool-review-bar"><div><strong>Transaction History review</strong><span>Review the activity feed, transaction details, linked records, and documents before marking the tool reviewed.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Transaction History')}>{reviewed ? '✓ Transaction History reviewed' : 'Mark Transaction History reviewed'}</button></footer>
    </>
  );
}

function FinancialInvestigationWorkspace({ activeCase, pin, saveNote, markReviewed, reviewed, openTool, jumpDecision }) {
  const workspace = useMemo(() => getFinancialInvestigation(activeCase), [activeCase]);
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('All periods');
  const [recordQuery, setRecordQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const tab = financialInvestigationTabs.find((item) => item.id === activeTab) ?? financialInvestigationTabs[0];
  const tabRecords = workspace.recordsByTab[activeTab] ?? [];
  const periods = ['All periods', ...new Set(tabRecords.map((record) => record.period).filter(Boolean))];
  const normalizedQuery = recordQuery.trim().toLowerCase();
  const filteredRecords = tabRecords.filter((record) => (
    (period === 'All periods' || record.period === period)
    && (!normalizedQuery || financialRecordSearchText(record).includes(normalizedQuery))
  ));
  const activeRecord = filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? tabRecords[0];
  const maxComparison = Math.max(1, ...workspace.comparison.flatMap((item) => [item.baseline, item.current]));
  const maxDeposit = Math.max(1, ...workspace.depositTrend.map((item) => item.value));

  useEffect(() => {
    setActiveTab('overview');
    setPeriod('All periods');
    setRecordQuery('');
    setSelectedId('');
  }, [activeCase.id]);

  useEffect(() => {
    setPeriod('All periods');
    setSelectedId('');
  }, [activeTab]);

  function selectTab(tabId) {
    setActiveTab(tabId);
  }

  function saveFinancialNote(record) {
    saveNote(`Financial Investigation: ${record.id} - ${record.detail}`, 'Financial investigation');
  }

  return (
    <>
      <section className="financial-investigation-kpis" aria-label="Financial Investigation account metrics">
        {workspace.kpis.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.context}</small></article>)}
      </section>

      <section className="financial-account-strip" aria-label="Financial relationship snapshot">
        <div><p>Account in review</p><h3>{workspace.profile.account}</h3><span>{workspace.profile.accountType} | {workspace.profile.accountAge} | {workspace.profile.accountStatus}</span></div>
        <dl><div><dt>Relationship</dt><dd>{workspace.profile.relationshipLength}</dd></div><div><dt>Credit limit</dt><dd>{workspace.profile.creditLimit}</dd></div><div><dt>Overdraft</dt><dd>{workspace.profile.overdraft}</dd></div><div><dt>Recorded alert</dt><dd>{workspace.profile.alert}</dd></div></dl>
      </section>

      <nav className="financial-investigation-tabs" aria-label="Financial Investigation sections">
        {financialInvestigationTabs.map((item) => <button key={item.id} type="button" className={activeTab === item.id ? 'active' : ''} aria-pressed={activeTab === item.id} onClick={() => selectTab(item.id)}>{item.label}</button>)}
      </nav>

      <section className="financial-investigation-findbar" aria-label="Financial Investigation filters">
        <div><p>{tab.label}</p><h3>{tab.question}</h3></div>
        <label><span>Search this section</span><input value={recordQuery} onChange={(event) => setRecordQuery(event.target.value)} placeholder="Record, amount, merchant, account, source, or destination" aria-label="Search Financial Investigation records" /></label>
        <label><span>Comparison period</span><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Financial Investigation period filter">{periods.map((item) => <option key={item}>{item}</option>)}</select></label>
        <span>{filteredRecords.length} of {tabRecords.length} records shown</span>
      </section>

      {(activeTab === 'overview' || activeTab === 'trends') && (
        <section className="financial-comparison-grid" aria-label="Financial behavior comparisons">
          {workspace.comparison.map((item) => <article key={item.label}><header><strong>{item.label}</strong><span>{item.baseline} baseline | {item.current} current</span></header><div><i style={{ width: `${Math.max(3, (item.baseline / maxComparison) * 100)}%` }} /><b style={{ width: `${Math.max(3, (item.current / maxComparison) * 100)}%` }} /></div><p>{item.context}</p></article>)}
        </section>
      )}

      {activeTab === 'deposits' && (
        <section className="financial-deposit-trend" aria-label="Deposit trend">
          <header><p>Deposit trend</p><h3>Recorded incoming funds by date</h3></header>
          <div>{workspace.depositTrend.map((item) => <article key={`${item.label}-${item.title}`}><span>{item.label}</span><div><i style={{ height: `${Math.max(8, (item.value / maxDeposit) * 100)}%` }} /></div><strong>${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong><small>{item.title}</small></article>)}</div>
        </section>
      )}

      <div className="financial-investigation-workspace">
        <main className="financial-record-workspace">
          <section className="financial-record-list" aria-label={`${tab.label} records`}>
            <header><div><p>Evidence records</p><h3>{tab.label}</h3></div><span>{filteredRecords.length} shown</span></header>
            {filteredRecords.map((record) => <button key={record.id} type="button" className={activeRecord?.id === record.id ? 'active' : ''} onClick={() => setSelectedId(record.id)} data-financial-investigation-record={record.id}><span>{record.category} | {record.observed}</span><strong>{record.title}</strong><small>{record.value} | {record.status}</small></button>)}
            {!filteredRecords.length && <div className="investigation-tool-empty" role="status">No financial records match these filters.</div>}
          </section>

          {activeRecord ? <section className="financial-record-detail" aria-label="Expanded financial record">
            <header><div><p>Expanded evidence</p><h3>{activeRecord.id}</h3><span>{activeRecord.title} | {activeRecord.observed}</span></div><button type="button" onClick={() => pin(`${activeRecord.id} | ${activeRecord.title}`)}>Pin record</button></header>
            <dl>{activeRecord.fields.map(([label, value]) => <div key={`${activeRecord.id}-${label}`}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <article><span>Recorded context</span><p>{activeRecord.detail}</p></article>
            <div className="financial-related-records"><span>Related records</span><div>{activeRecord.relatedRecords.map((item) => <button key={item} type="button" onClick={() => pin(item)}>{item}</button>)}</div></div>
            <button type="button" onClick={() => saveFinancialNote(activeRecord)}>Save evidence note</button>
          </section> : <div className="investigation-tool-empty" role="status">Choose a financial record to open its details.</div>}
        </main>

        <aside className="financial-case-rail" aria-label="Financial Investigation case summary">
          <header><p>Case money summary</p><h3>{activeCase.amount}</h3><span>{activeCase.claimType ?? activeCase.type}</span></header>
          <section><p>Reviewed financial facts</p>{workspace.reviewedFacts.map((fact) => <article key={fact}>{fact}</article>)}</section>
          <section><p>Record inventory</p><div>{financialInvestigationTabs.map((item) => <button key={item.id} type="button" onClick={() => selectTab(item.id)}><span>{item.label}</span><strong>{workspace.recordsByTab[item.id]?.length ?? 0}</strong></button>)}</div></section>
          <nav><button type="button" onClick={() => openTool('Transaction History')}>Open Transaction History</button><button type="button" onClick={() => openTool('Payment Verification')}>Open Payment Verification</button></nav>
        </aside>
      </div>

      <nav className="investigation-tool-next-routes" aria-label="Financial Investigation next routes"><button type="button" onClick={() => openTool('Transaction History')}>Open Transaction History</button><button type="button" onClick={() => openTool('Payment Verification')}>Open Payment Verification</button><button type="button" onClick={jumpDecision}>Open Submit Decision</button></nav>
      <footer className="investigation-tool-review-bar"><div><strong>Financial Investigation review</strong><span>Mark reviewed after comparing the relevant money sections and saving the evidence needed for the case package.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Financial Investigation')}>{reviewed ? '✓ Financial Investigation reviewed' : 'Mark Financial Investigation reviewed'}</button></footer>
    </>
  );
}

function KYBReviewWorkspace({ activeCase, pin, saveNote, markReviewed, reviewed, openTool, jumpDecision }) {
  const workspace = useMemo(() => getKybReview(activeCase), [activeCase]);
  const [lookupValue, setLookupValue] = useState('');
  const [confirmedLookup, setConfirmedLookup] = useState('');
  const [lookupAttempted, setLookupAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [recordQuery, setRecordQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [report, setReport] = useState(null);
  const [reportGenerated, setReportGenerated] = useState(() => hasGeneratedKybReport(activeCase.id));
  const searchMatched = matchesKybReviewLookup(workspace, confirmedLookup);
  const tab = kybReviewTabs.find((item) => item.id === activeTab) ?? kybReviewTabs[0];
  const tabRecords = workspace.recordsByTab[activeTab] ?? [];
  const normalizedQuery = recordQuery.trim().toLowerCase();
  const filteredRecords = searchMatched ? tabRecords.filter((record) => !normalizedQuery || kybRecordSearchText(record).includes(normalizedQuery)) : [];
  const activeRecord = filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? tabRecords[0];

  useEffect(() => {
    setLookupValue('');
    setConfirmedLookup('');
    setLookupAttempted(false);
    setActiveTab('overview');
    setRecordQuery('');
    setSelectedId('');
    setReport(null);
    setReportGenerated(hasGeneratedKybReport(activeCase.id));
  }, [activeCase.id]);

  useEffect(() => {
    setRecordQuery('');
    setSelectedId('');
  }, [activeTab]);

  function runLookup(event) {
    event.preventDefault();
    setLookupAttempted(true);
    setConfirmedLookup(lookupValue.trim());
  }

  function generateReport() {
    const nextReport = generateKybReviewReport(activeCase);
    setReport(nextReport);
    setReportGenerated(true);
    saveNote(`KYB Business Report generated for ${workspace.profile.legalName}.`, 'KYB Review');
  }

  return (
    <>
      <section className="kyb-lookup-panel" aria-label="KYB business lookup">
        <div><p>Business lookup</p><h3>Find the exact entity before opening its KYB record</h3><span>Search by legal name, DBA, masked EIN, registration ID, or exact business address.</span></div>
        <form onSubmit={runLookup}><label><span>Business identifier</span><input value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} placeholder="Legal name, DBA, **-***1234, registration ID, or address" aria-label="Search KYB Review" /></label><button type="submit" disabled={!lookupValue.trim()}>Search business</button></form>
        <article className="kyb-case-entity"><span>Business object attached to this training case</span><strong>{workspace.profile.dba}</strong><small>{workspace.profile.jurisdiction} | {workspace.profile.industry}</small><button type="button" onClick={() => setLookupValue(workspace.profile.legalName)}>Use legal name</button></article>
      </section>

      {lookupAttempted && !searchMatched && <div className="kyb-lookup-message" role="status"><strong>No exact fictional business match.</strong><span>Check the full legal name, DBA, masked EIN, registration ID, or complete address and search again.</span></div>}

      {searchMatched && <>
        <section className="kyb-profile-header" aria-label="Matched business profile">
          <header><div><p>Exact business match</p><h3>{workspace.profile.legalName}</h3><span>{workspace.profile.dba} | {workspace.profile.entityType}</span></div><button type="button" onClick={() => pin(`${workspace.profile.registrationId} | ${workspace.profile.legalName}`)}>Pin business</button></header>
          <dl>{[['Registration', workspace.profile.registrationId], ['Masked EIN', workspace.profile.ein], ['Jurisdiction', workspace.profile.jurisdiction], ['Standing', workspace.profile.standing], ['Formation', workspace.profile.formationDate], ['Address', workspace.profile.address], ['Phone', workspace.profile.phone], ['Website', workspace.profile.website]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </section>

        <section className="kyb-review-kpis" aria-label="KYB record inventory"><article><span>Owner / UBO records</span><strong>{workspace.counts.owners}</strong><small>Identity records connected</small></article><article><span>Business links</span><strong>{workspace.counts.businessRecords}</strong><small>Business 360 records</small></article><article><span>Payment objects</span><strong>{workspace.counts.paymentObjects}</strong><small>Ownership records available</small></article><article><span>Documents & links</span><strong>{workspace.counts.documents}</strong><small>Source inventory</small></article></section>

        <nav className="kyb-review-tabs" aria-label="KYB Review sections">{kybReviewTabs.map((item) => <button key={item.id} type="button" className={activeTab === item.id ? 'active' : ''} aria-pressed={activeTab === item.id} onClick={() => setActiveTab(item.id)}>{item.label}</button>)}</nav>

        <section className="kyb-review-findbar" aria-label="KYB Review record filter"><div><p>{tab.label}</p><h3>{tab.question}</h3></div><label><span>Filter opened records</span><input value={recordQuery} onChange={(event) => setRecordQuery(event.target.value)} placeholder="Record, owner, identifier, source, or value" aria-label="Filter KYB Review records" /></label><span>{filteredRecords.length} of {tabRecords.length} shown</span></section>

        <div className="kyb-review-workspace">
          <section className="kyb-record-list" aria-label={`${tab.label} KYB records`}><header><div><p>Source records</p><h3>{tab.label}</h3></div><span>{filteredRecords.length} shown</span></header>{filteredRecords.map((record) => <button key={record.id} type="button" className={activeRecord?.id === record.id ? 'active' : ''} onClick={() => setSelectedId(record.id)} data-kyb-review-record={record.id}><span>{record.category} | {record.observed}</span><strong>{record.title}</strong><small>{record.value}</small></button>)}{!filteredRecords.length && <div className="investigation-tool-empty" role="status">No KYB records match this filter.</div>}</section>

          {activeRecord ? <section className="kyb-record-detail" aria-label="Expanded KYB record"><header><div><p>Expanded source record</p><h3>{activeRecord.id}</h3><span>{activeRecord.title}</span></div><button type="button" onClick={() => pin(`${activeRecord.id} | ${activeRecord.title}`)}>Pin record</button></header><dl>{activeRecord.fields.map(([label, value]) => <div key={`${activeRecord.id}-${label}`}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><article><span>Recorded context</span><p>{activeRecord.detail}</p></article><div className="kyb-related-records"><span>Related records</span><div>{activeRecord.relatedRecords.map((item) => <button key={item} type="button" onClick={() => pin(item)}>{item}</button>)}</div></div><button type="button" onClick={() => saveNote(`KYB Review: ${activeRecord.id} - ${activeRecord.detail}`, 'KYB Review')}>Save evidence note</button></section> : <div className="investigation-tool-empty" role="status">Choose a KYB source record to open its details.</div>}

          <aside className="kyb-case-rail" aria-label="KYB Review case summary"><header><p>Business evidence summary</p><h3>{workspace.profile.dba}</h3><span>{activeCase.id}</span></header><section><p>Reviewed business facts</p>{workspace.reviewedFacts.map((fact) => <article key={fact}>{fact}</article>)}</section><section className="kyb-report-actions"><p>KYB Business Report</p><span>Generate a factual report from the opened fictional business records. The report is stored with the matching account documents.</span><button type="button" onClick={generateReport}>{reportGenerated ? 'Regenerate report' : 'Generate report'}</button>{report && <button type="button" onClick={() => downloadKybReport(report)}>Export report</button>}</section><nav><button type="button" onClick={() => openTool('Business 360')}>Open Business 360</button><button type="button" onClick={() => openTool('Payment Verification')}>Open Payment Verification</button><button type="button" onClick={() => openTool('Financial Investigation')}>Open Financial Investigation</button></nav></aside>
        </div>
      </>}

      <nav className="investigation-tool-next-routes" aria-label="KYB Review next routes"><button type="button" onClick={() => openTool('Business 360')}>Open Business 360</button><button type="button" onClick={() => openTool('Identity Intel / People Search')}>Open Identity Intel</button><button type="button" onClick={jumpDecision}>Open Submit Decision</button></nav>
      <footer className="investigation-tool-review-bar"><div><strong>KYB Review</strong><span>Complete an exact lookup and compare the relevant source records before marking this business review complete.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} disabled={!searchMatched} onClick={() => markReviewed('KYB Review')}>{reviewed ? '✓ KYB Review reviewed' : 'Mark KYB Review reviewed'}</button></footer>
    </>
  );
}

function Business360Workspace({ activeCase, pin, saveNote, markReviewed, reviewed, openTool, jumpDecision }) {
  const workspace = useMemo(() => getBusiness360Workspace(activeCase), [activeCase]);
  const [selectedId, setSelectedId] = useState('');
  const activeRelationship = workspace.relationships.find((record) => record.id === selectedId) ?? workspace.relationships[0];
  useEffect(() => setSelectedId(''), [activeCase.id]);

  return (
    <>
      <section className="business-360-profile" aria-label="Business 360 profile">
        <header><div><p>Business and KYB profile</p><h3>{workspace.profile.entity}</h3><span>Fictional training business context. Review evidence without assigning a case outcome.</span></div><button type="button" onClick={() => pin(workspace.profile.entity)}>Pin business</button></header>
        <dl>{[
          ['Entity type', workspace.profile.entityType], ['Registration', workspace.profile.registration], ['Masked EIN', workspace.profile.ein], ['Owner', workspace.profile.owner], ['Officer', workspace.profile.officer], ['Registered agent', workspace.profile.registeredAgent], ['Business address', workspace.profile.address], ['Filing date', workspace.profile.filingDate], ['Business standing', workspace.profile.standing], ['Revenue / cash-flow context', workspace.profile.revenue], ['Business contact', workspace.profile.contact], ['Relationship', workspace.profile.relationship],
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </section>

      <div className="business-360-workspace">
        <section className="business-360-relationships" aria-label="Business relationships"><header><p>Relationships</p><h3>Choose a business object</h3></header>{workspace.relationships.map((record) => <button key={record.id} type="button" className={record.id === activeRelationship?.id ? 'active' : ''} onClick={() => setSelectedId(record.id)} data-business-360-record={record.id}><span>{record.id} | {record.status}</span><strong>{record.entity}</strong><small>{record.relationship}</small></button>)}</section>
        {activeRelationship ? <section className="business-360-detail" aria-label="Business relationship detail"><header><div><p>Selected relationship</p><h3>{activeRelationship.entity}</h3><span>{activeRelationship.observed}</span></div><button type="button" onClick={() => pin(activeRelationship.entity)}>Pin relationship</button></header><dl>{[['Relationship', activeRelationship.relationship], ['Status', activeRelationship.status], ['Observed', activeRelationship.observed], ['Case context', activeRelationship.context]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><button type="button" onClick={() => saveNote(`Business 360: ${activeRelationship.id} reviewed for ${activeCase.id}.`, 'Business 360')}>Save business note</button></section> : <div className="investigation-tool-empty" role="status">No business relationship is recorded for this case.</div>}
        <aside className="business-360-evidence" aria-label="Business 360 evidence"><header><p>Evidence Explorer</p><h3>Business records to compare</h3></header>{workspace.intelligence.map((record) => <article key={record.id}><span>{record.type}</span><strong>{record.value}</strong><small>{record.id} | {record.observed}</small></article>)}</aside>
      </div>
      <nav className="investigation-tool-next-routes" aria-label="Business 360 next routes"><button type="button" onClick={() => openTool('KYB Review')}>Open KYB Review</button><button type="button" onClick={() => openTool('Employee Profile')}>Open Employee Profile</button><button type="button" onClick={() => openTool('Payroll History')}>Open Payroll History</button><button type="button" onClick={jumpDecision}>Open Submit Decision</button></nav>
      <footer className="investigation-tool-review-bar"><div><strong>Business 360 review</strong><span>Review the fictional business profile, relationship records, and linked evidence before marking the tool reviewed.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Business 360')}>{reviewed ? '✓ Business 360 reviewed' : 'Mark Business 360 reviewed'}</button></footer>
    </>
  );
}

function EmployeeProfileWorkspace({ activeCase, pin, saveNote, markReviewed, reviewed, openTool, jumpDecision }) {
  const records = useMemo(() => getEmployeeProfiles(activeCase), [activeCase]);
  const [selectedId, setSelectedId] = useState('');
  const activeRecord = records.find((record) => record.id === selectedId) ?? records[0];
  useEffect(() => setSelectedId(''), [activeCase.id]);

  return (
    <>
      <section className="employee-profile-summary" aria-label="Employee Profile summary">{[['Employee records', records.length], ['Employers', new Set(records.map((record) => record.employer)).size], ['Payroll links', records.reduce((count, record) => count + record.linkedPayroll.length, 0)], ['Active case', activeCase.id]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
      {activeRecord ? <div className="employee-profile-workspace">
        <section className="employee-profile-list" aria-label="Employee Profile records"><header><p>Employee records</p><h3>Choose an employee or contact</h3></header>{records.map((record) => <button key={record.id} type="button" className={record.id === activeRecord.id ? 'active' : ''} onClick={() => setSelectedId(record.id)} data-employee-profile-record={record.id}><span>{record.id} | {record.status}</span><strong>{record.name}</strong><small>{record.role} | {record.employer}</small></button>)}</section>
        <section className="employee-profile-detail" aria-label="Employee Profile detail"><header><div><p>Employee profile</p><h3>{activeRecord.name}</h3><span>{activeRecord.role} | {activeRecord.employer}</span></div><button type="button" onClick={() => pin(`${activeRecord.id} | ${activeRecord.name}`)}>Pin employee</button></header><dl>{[['Employee ID', activeRecord.id], ['Employer', activeRecord.employer], ['Role', activeRecord.role], ['Department', activeRecord.department], ['Status', activeRecord.status], ['Hire date', activeRecord.hireDate], ['Employment timeline', activeRecord.employmentTimeline], ['Official contact / callback', activeRecord.officialContact], ['Direct deposit context', activeRecord.directDeposit], ['Linked payroll records', activeRecord.linkedPayroll.join(' | ') || 'None recorded']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><button type="button" onClick={() => saveNote(`Employee Profile: ${activeRecord.id} reviewed for ${activeCase.id}.`, 'Employee profile')}>Save employee note</button></section>
        <aside className="employee-profile-evidence" aria-label="Employee payroll evidence"><header><p>Payroll connection</p><h3>Next evidence to review</h3></header><p>Compare the employee record, employer relationship, direct-deposit context, and any payroll change request before documenting a case decision.</p><button type="button" onClick={() => openTool('Payroll History')}>Open Payroll History</button><button type="button" onClick={() => openTool('Payment Verification')}>Open Payment Verification</button></aside>
      </div> : <div className="investigation-tool-empty" role="status">No employee records are available for this case.</div>}
      <nav className="investigation-tool-next-routes" aria-label="Employee Profile next routes"><button type="button" onClick={() => openTool('Business 360')}>Open Business 360</button><button type="button" onClick={() => openTool('Payroll History')}>Open Payroll History</button><button type="button" onClick={jumpDecision}>Open Submit Decision</button></nav>
      <footer className="investigation-tool-review-bar"><div><strong>Employee Profile review</strong><span>Review employee and employer facts, official contact details, and linked payroll context before marking the tool reviewed.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Employee Profile')}>{reviewed ? '✓ Employee Profile reviewed' : 'Mark Employee Profile reviewed'}</button></footer>
    </>
  );
}

function PayrollHistoryWorkspace({ activeCase, pin, saveNote, markReviewed, reviewed, openTool, jumpDecision }) {
  const records = useMemo(() => getPayrollHistory(activeCase), [activeCase]);
  const [employer, setEmployer] = useState('All employers');
  const [selectedId, setSelectedId] = useState('');
  const employers = ['All employers', ...new Set(records.map((record) => record.employer))];
  const filteredRecords = records.filter((record) => employer === 'All employers' || record.employer === employer);
  const activeRecord = filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? records[0];
  useEffect(() => { setEmployer('All employers'); setSelectedId(''); }, [activeCase.id]);

  return (
    <>
      <section className="payroll-history-findbar" aria-label="Payroll History filters"><div><p>Payroll and direct deposit</p><h3>Review each fictional payroll run, destination context, change record, callback status, and related employee evidence.</h3></div><label><span>Employer</span><select value={employer} onChange={(event) => setEmployer(event.target.value)} aria-label="Payroll History employer filter">{employers.map((item) => <option key={item}>{item}</option>)}</select></label><span>{filteredRecords.length} of {records.length} payroll records shown</span></section>
      <section className="payroll-history-summary" aria-label="Payroll History summary">{[['Payroll records', records.length], ['Employers', employers.length - 1], ['Direct deposit records', records.filter((record) => /direct deposit/i.test(record.channel)).length], ['Linked employee records', new Set(records.flatMap((record) => record.relatedRecords.filter((item) => item.startsWith('EMP-')))).size]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
      {activeRecord ? <div className="payroll-history-workspace">
        <section className="payroll-history-list" aria-label="Payroll History records"><header><p>Payroll runs</p><h3>Choose a payroll record</h3></header>{filteredRecords.map((record) => <button key={record.id} type="button" className={record.id === activeRecord.id ? 'active' : ''} onClick={() => setSelectedId(record.id)} data-payroll-history-record={record.id}><span>{record.period} | {record.runStatus}</span><strong>{record.employee}</strong><small>{record.amount} | {record.employer}</small></button>)}</section>
        <section className="payroll-history-detail" aria-label="Payroll History detail"><header><div><p>Payroll run detail</p><h3>{activeRecord.id} | {activeRecord.period}</h3><span>{activeRecord.employer} | {activeRecord.amount}</span></div><button type="button" onClick={() => pin(activeRecord.id)}>Pin payroll record</button></header><dl>{[['Employee', activeRecord.employee], ['Employer', activeRecord.employer], ['Payroll amount', activeRecord.amount], ['Channel', activeRecord.channel], ['Run status', activeRecord.runStatus], ['Destination', activeRecord.destination], ['Prior destination', activeRecord.priorDestination], ['Effective date', activeRecord.effectiveDate], ['Change request', activeRecord.changeRequest], ['Admin activity', activeRecord.adminActivity], ['Trusted callback', activeRecord.callback], ['Related records', activeRecord.relatedRecords.join(' | ')]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><button type="button" onClick={() => saveNote(`Payroll History: ${activeRecord.id} reviewed for ${activeCase.id}.`, 'Payroll history')}>Save payroll note</button></section>
        <aside className="payroll-history-controls" aria-label="Payroll related controls"><header><p>Related review</p><h3>Compare payroll evidence</h3></header><p>{activeRecord.context}</p><button type="button" onClick={() => openTool('Employee Profile')}>Open Employee Profile</button><button type="button" onClick={() => openTool('Payment Verification')}>Open Payment Verification</button><button type="button" onClick={() => openTool('Document Request')}>Open Document Request</button></aside>
      </div> : <div className="investigation-tool-empty" role="status">No payroll records match this filter.</div>}
      <nav className="investigation-tool-next-routes" aria-label="Payroll History next routes"><button type="button" onClick={() => openTool('Employee Profile')}>Open Employee Profile</button><button type="button" onClick={() => openTool('Business 360')}>Open Business 360</button><button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button><button type="button" onClick={jumpDecision}>Open Submit Decision</button></nav>
      <footer className="investigation-tool-review-bar"><div><strong>Payroll History review</strong><span>Review the payroll run, destination context, change request, callback status, and linked employee records before marking the tool reviewed.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Payroll History')}>{reviewed ? '✓ Payroll History reviewed' : 'Mark Payroll History reviewed'}</button></footer>
    </>
  );
}

function PaymentVerificationWorkspace({
  activeCase,
  query,
  setQuery,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
}) {
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const financial = getFinancialRecords(activeCase);
  const records = financial.paymentVerification ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRecords = records.filter((record) => !normalizedQuery || paymentRecordSearchText(record).includes(normalizedQuery));
  const activeRecord = filteredRecords.find((record) => record.id === selectedPaymentId) ?? filteredRecords[0] ?? records[0];

  useEffect(() => {
    setSelectedPaymentId('');
  }, [activeCase.id]);

  function savePaymentNote(message) {
    saveNote(`Payment Verification: ${message}`, 'Payment verification');
  }

  return (
    <>
      <section className="payment-verification-findbar" aria-label="Find payment verification information">
        <div>
          <p>Find the answer here</p>
          <h3>Search Bank Code, Destination ID, account holder, status, match result, prior use, recovery, or action.</h3>
        </div>
        <label>
          <span>Search Payment Verification</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: name match, DST-7740, callback, open, NSF, fraud..."
            aria-label="Search Payment Verification records"
          />
        </label>
        <span aria-live="polite">{filteredRecords.length} of {records.length} records shown</span>
      </section>

      {activeRecord ? (
        <>
          <section className="payment-verification-snapshot" aria-label="Account snapshot">
            <article className="payment-verification-hero">
              <p>Account Snapshot</p>
              <h3>{activeRecord.object}</h3>
              <div className="payment-chip-row">
                <span className={`payment-status-chip ${statusTone(activeRecord.ownerMatch)}`}>{activeRecord.ownerMatch}</span>
                <span className={`payment-status-chip ${statusTone(activeRecord.accountStatus)}`}>{activeRecord.accountStatus}</span>
                <span className={`payment-status-chip ${statusTone(activeRecord.standing)}`}>{activeRecord.standing}</span>
              </div>
            </article>
            {[
              ['Owner match', activeRecord.ownerMatch],
              ['Account status', activeRecord.accountStatus],
              ['Prior use', activeRecord.priorUse],
              ['Recoverability', activeRecord.recoverability],
            ].map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </section>

          <div className="payment-verification-workspace">
            <section className="payment-record-list" aria-label="Payment verification records">
              <header>
                <p>Record list</p>
                <h3>Choose the object to verify</h3>
              </header>
              {filteredRecords.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  className={record.id === activeRecord.id ? 'active' : ''}
                  onClick={() => setSelectedPaymentId(record.id)}
                  data-payment-verification-record={record.id}
                >
                  <span>{record.id}</span>
                  <strong>{record.object}</strong>
                  <small>{record.bankName} · {record.ownerMatch} · {record.accountStatus}</small>
                </button>
              ))}
              {!filteredRecords.length && (
                <div className="investigation-tool-empty" role="status">No payment verification records match this search.</div>
              )}
            </section>

            <section className="payment-detail-panel" aria-label="Expanded payment verification detail">
              <header>
                <div>
                  <p>Expanded verification</p>
                  <h3>{activeRecord.id} · {activeRecord.type}</h3>
                  <span>{activeRecord.bankName}</span>
                </div>
                <button type="button" onClick={() => pin(activeRecord.object)}>Pin object</button>
              </header>

              <dl className="payment-detail-grid">
                {[
                  ['Account holder', activeRecord.accountHolder],
                  ['Bank name', activeRecord.bankName],
                  ['Account type', activeRecord.accountType],
                  ['Bank Code', activeRecord.bankCode],
                  ['Destination ID', activeRecord.destinationId],
                  ['First seen', activeRecord.firstSeen],
                  ['Verification method', activeRecord.verificationMethod],
                  ['Verification outcome', activeRecord.verificationOutcome],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              <section className="payment-comparison-panel" aria-label="Old versus new account comparison">
                <article>
                  <span>Old / prior account</span>
                  <strong>{activeRecord.oldDestination}</strong>
                </article>
                <article>
                  <span>New destination</span>
                  <strong>{activeRecord.newDestination}</strong>
                </article>
                <article>
                  <span>Payroll / vendor change comparison</span>
                  <strong>{activeRecord.changeComparison}</strong>
                </article>
              </section>

              <section className="payment-related-records" aria-label="Related records">
                <p>Related Records</p>
                <div>
                  {(activeRecord.relatedRecords ?? []).map((item) => <span key={item}>{item}</span>)}
                </div>
              </section>
            </section>
          </div>

          <section className="payment-verification-lower-grid" aria-label="Verification log and action panel">
            <article className="payment-call-drawer">
              <header>
                <p>Verification Call Drawer</p>
                <h3>{activeRecord.verificationOutcome}</h3>
              </header>
              <div className="payment-log-list">
                {(activeRecord.verificationLog ?? []).map((entry) => (
                  <div key={`${activeRecord.id}-${entry.time}`}>
                    <span>{entry.time}</span>
                    <strong>{entry.method} · {entry.result}</strong>
                    <p>{entry.note}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="payment-action-panel">
              <header>
                <p>Action Panel</p>
                <h3>Available next actions</h3>
              </header>
              <div>
                {(activeRecord.actions ?? []).map((action) => (
                  <button key={action} type="button" onClick={() => savePaymentNote(`${action} selected for ${activeRecord.id}.`)}>
                    {action}
                  </button>
                ))}
              </div>
            </article>

            <article className="payment-notes-panel">
              <header>
                <p>Investigator Notes</p>
                <h3>What this record is for</h3>
              </header>
              <p>{activeRecord.notes}</p>
              <div>
                <button type="button" onClick={() => savePaymentNote(`${activeRecord.id} reviewed: ${activeRecord.notes}`)}>Save verification note</button>
              </div>
            </article>
          </section>
        </>
      ) : (
        <div className="investigation-tool-empty" role="status">No payment verification records are available for this case.</div>
      )}

      <nav className="investigation-tool-next-routes" aria-label="Payment verification next routes">
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div>
          <strong>Payment Verification review</strong>
          <span>Mark reviewed after checking ownership, status, prior use, comparison, verification log, related records, and actions.</span>
        </div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Payment Verification')}>
          {reviewed ? '✓ Payment Verification reviewed' : 'Mark Payment Verification reviewed'}
        </button>
      </footer>
    </>
  );
}

export default function InvestigationToolPanel({
  activeCategory,
  activeCase,
  cases,
  openDocumentAccountCase,
  tool,
  openTool,
  query,
  setQuery,
  data,
  rows,
  activeRow,
  setExpandedId,
  pin,
  saveNote,
  markReviewed,
  currentCompleted,
  jumpDecision,
  documentRequests,
  setDocumentRequestsByCase,
}) {
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const displayData = buildCoreToolRecords(tool, activeCase, data) ?? data;
  const normalizedQuery = query.trim().toLowerCase();
  const displayRows = displayData === data
    ? rows
    : displayData.rows.filter((row) => !normalizedQuery || searchableText(row).includes(normalizedQuery));
  const selectedId = selectedRecordId || activeRow?.id;
  const displayActiveRow = displayRows.find((row) => row.id === selectedId) ?? displayRows[0];
  const selectedFields = useMemo(
    () => displayActiveRow ? fieldPairs(displayData.columns, displayActiveRow.values) : [],
    [displayActiveRow, displayData.columns],
  );
  const toolDetail = detailFor(tool, activeCategory);
  const reviewed = currentCompleted.includes(tool);
  const reportRow = displayActiveRow ?? activeRow;

  useEffect(() => {
    setSelectedRecordId('');
  }, [activeCase.id, tool]);

  function openRecord(rowId) {
    setSelectedRecordId(rowId);
    setExpandedId(rowId);
  }

  function saveDisplayedNote() {
    if (!reportRow) return;
    saveNote(`Expanded ${tool} record ${reportRow.id}: ${reportRow.detail}`, 'Expanded record');
  }

  return (
    <section
      className="ornate-card activity-panel investigation-tools-theme-v1"
      data-investigation-tools-screen="approved-theme-v1"
      data-tool-name={tool}
    >
      <header className="investigation-tool-header">
        <div>
          <p className="investigation-tool-eyebrow">{activeCategory.label} · Evidence First</p>
          <h2>{tool}</h2>
          <p>{toolDetail.purpose}</p>
        </div>
        <div className="investigation-tool-header-actions">
          <span>{activeCase.id}</span>
          <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
        </div>
      </header>

      <section className="investigation-tool-question" aria-labelledby="investigation-tool-question-heading">
        <div aria-hidden="true">?</div>
        <div>
          <p>Working question</p>
          <h3 id="investigation-tool-question-heading">{toolDetail.question}</h3>
          <span>Review the records, expand the useful details, and save only the evidence needed for the case package.</span>
        </div>
      </section>

      <section className="investigation-tool-controls" aria-label="Investigation tool controls">
        <label>
          <span>Current tool group</span>
          <select
            className="tool-select"
            value={tool}
            onChange={(event) => openTool(event.target.value)}
            aria-label="Choose investigation tool"
          >
            {activeCategory.tools.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="investigation-tool-flow" aria-label="Evidence workflow">
          {workflows.map((item, index) => (
            <span key={item} className={index <= 5 ? 'current-flow' : ''}>{index + 1}. {item}</span>
          ))}
        </div>
      </section>

      {tool === 'Identity Intel / People Search' ? (
        <IdentityIntelWorkspace
          activeCase={activeCase}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Transaction History' ? (
        <TransactionHistoryWorkspace
          activeCase={activeCase}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Merchant Intelligence' ? (
        <MerchantIntelligenceWorkspace
          activeCase={activeCase}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
          documentRequests={documentRequests}
        />
      ) : tool === 'Financial Investigation' ? (
        <FinancialInvestigationWorkspace
          activeCase={activeCase}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Business 360' ? (
        <Business360Workspace
          activeCase={activeCase}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'KYB Review' ? (
        <KYBReviewWorkspace
          activeCase={activeCase}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Employee Profile' ? (
        <EmployeeProfileWorkspace
          activeCase={activeCase}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Payroll History' ? (
        <PayrollHistoryWorkspace
          activeCase={activeCase}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Login History' ? (
        <LoginHistoryWorkspace
          activeCase={activeCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Session History' ? (
        <SessionHistoryWorkspace
          activeCase={activeCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
        />
      ) : tool === 'IP Intelligence' ? (
        <IPIntelligenceWorkspace
          activeCase={activeCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Payment Verification' ? (
        <PaymentVerificationWorkspace
          activeCase={activeCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Document Viewer' ? (
        <DocumentViewerWorkspace
          activeCase={activeCase}
          cases={cases}
          openDocumentAccountCase={openDocumentAccountCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
          documentRequests={documentRequests}
        />
      ) : tool === 'Document Request' ? (
        <DocumentRequestWorkspace
          activeCase={activeCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
          documentRequests={documentRequests}
          setDocumentRequestsByCase={setDocumentRequestsByCase}
        />
      ) : tool === 'Device Intelligence' ? (
        <DeviceIntelligenceWorkspace
          activeCase={activeCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : (
        <>

      <section className="investigation-tool-metrics" aria-label={`${tool} review summary`}>
        <article><span>Records available</span><strong>{displayData.rows.length}</strong></article>
        <article><span>Records shown</span><strong>{displayRows.length}</strong></article>
        <article><span>Review status</span><strong>{reviewed ? 'Reviewed' : 'Open'}</strong></article>
        <article><span>Active case</span><strong>{activeCase.id}</strong></article>
      </section>

      <div className="investigation-tool-search-row">
        <label>
          <span>Search this tool</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search records, values, history, devices, merchants, documents..."
            aria-label={`Search ${tool} records`}
          />
        </label>
        <span aria-live="polite">{displayRows.length} of {displayData.rows.length} shown</span>
      </div>

      <div className="investigation-tool-workspace">
        <section className="investigation-tool-records" aria-labelledby="investigation-tool-records-heading">
          <header className="investigation-tool-section-heading">
            <div>
              <p>Record review</p>
              <h3 id="investigation-tool-records-heading">Available {tool} records</h3>
            </div>
            <span>{displayRows.length} shown</span>
          </header>

          <div className="investigation-tool-record-list">
            {displayRows.map((row) => {
              const fields = fieldPairs(displayData.columns, row.values).filter((field) => !/action/i.test(field.label)).slice(0, 3);
              const selected = displayActiveRow?.id === row.id;
              return (
                <article
                  key={row.id}
                  className={`investigation-tool-record-card ${selected ? 'selected' : ''}`}
                  data-investigation-record={row.id}
                >
                  <header>
                    <div><span>{row.id}</span><h4>{row.label}</h4></div>
                    <span>{selected ? 'Open' : 'Record'}</span>
                  </header>
                  <dl>
                    {fields.map((field) => (
                      <div key={`${row.id}-${field.label}`}>
                        <dt>{field.label}</dt>
                        <dd><DirectCollapsibleText lines={2} mobileLines={3}>{String(field.value)}</DirectCollapsibleText></dd>
                      </div>
                    ))}
                  </dl>
                  <div className="investigation-tool-record-actions">
                    <button type="button" onClick={() => openRecord(row.id)}>{selected ? 'Record open' : 'Open record'}</button>
                    <button type="button" onClick={() => pin(row.pin)}>Pin</button>
                  </div>
                </article>
              );
            })}
            {!displayRows.length && (
              <div className="investigation-tool-empty" role="status">
                No records match this search. Clear or revise the search to continue reviewing this tool.
              </div>
            )}
          </div>
        </section>

        <aside className="investigation-tool-detail" aria-label="Expanded investigation record">
          {displayActiveRow ? (
            <>
              <header className="investigation-tool-detail-heading">
                <div>
                  <p>Expanded record</p>
                  <h3>{displayActiveRow.id}</h3>
                  <span>{displayActiveRow.label}</span>
                </div>
                <button type="button" onClick={() => pin(displayActiveRow.pin)}>Pin record</button>
              </header>

              <dl className="investigation-tool-field-grid">
                {selectedFields.map((field) => (
                  <div key={`${displayActiveRow.id}-${field.label}`}>
                    <dt>{field.label}</dt>
                    <dd><DirectCollapsibleText lines={3} mobileLines={4}>{String(field.value)}</DirectCollapsibleText></dd>
                  </div>
                ))}
              </dl>

              <div className="investigation-tool-review-lanes">
                <article>
                  <span>History</span>
                  <h4>Record history</h4>
                  <DirectCollapsibleText lines={3} mobileLines={4}>
                    {displayActiveRow.id} is open inside {tool} for {activeCase.id}. Compare the recorded timing and values with the active case packet.
                  </DirectCollapsibleText>
                </article>
                <article>
                  <span>Link Analysis</span>
                  <h4>Connected objects</h4>
                  <DirectCollapsibleText lines={3} mobileLines={4}>
                    {displayActiveRow.label}: {displayActiveRow.pin}. Active customer object: {activeCase.person} · {activeCase.trainingId}.
                  </DirectCollapsibleText>
                </article>
              </div>

              <div className="investigation-tool-detail-actions">
                <button type="button" onClick={saveDisplayedNote}>Save expanded note</button>
              </div>
            </>
          ) : (
            <div className="investigation-tool-empty" role="status">Open a record to review its full details.</div>
          )}
        </aside>
      </div>

      <nav className="investigation-tool-next-routes" aria-label="Investigation record next routes">
        {(tool === 'Document Viewer' || tool === 'Financial Investigation') && <button type="button" onClick={() => openTool('Transaction History')}>Open Transaction History</button>}
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div>
          <strong>{tool} review</strong>
          <span>Review completion records process progress only. It does not determine the case outcome.</span>
        </div>
        <button type="button" className="investigation-tool-primary" onClick={() => markReviewed(tool)}>
          {reviewed ? `✓ ${tool} reviewed` : `Mark ${tool} reviewed`}
        </button>
      </footer>
        </>
      )}
    </section>
  );
}
