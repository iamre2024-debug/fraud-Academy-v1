import { useEffect, useMemo, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { buildCoreToolRecords } from './data/coreToolRecords.js';
import { getBusiness360Workspace, getEmployeeProfiles, getPayrollHistory, getTransactionHistory } from './data/businessPayrollWorkspace.js';
import { getDeviceProfiles } from './data/deviceRecords.js';
import { getEvidenceRecords, getFinancialRecords } from './data/caseToolData.js';
import { getIdentityIntelReport, matchesIdentityIntelSearch } from './data/identityIntelReport.js';
import { getLoginRecords } from './data/loginRecords.js';
import { getIpRecords } from './data/ipRecords.js';
import { getSessionRecords } from './data/sessionRecords.js';
import { workflows } from './visualWorkspaceModel.js';

const toolDetails = {
  'Identity Intel / People Search': {
    purpose: 'Search fictional identity records by name, training ID, email, or phone before revealing the profile report.',
    question: 'Does this identity history support who they claim to be?',
  },
  'Login History': {
    purpose: 'Review recorded login attempts, results, devices, locations, authentication, session behavior, and linked activity without drawing an early conclusion.',
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
  'Financial Intelligence': {
    purpose: 'Review account and financial context supplied by the fictional training packet.',
    question: 'What financial context is available for the active case?',
  },
  'Payment Verification': {
    purpose: 'Review neutral payment-object and verification records without treating a status as a final case decision.',
    question: 'What payment objects and verification states are recorded for this case?',
  },
  'Business 360': {
    purpose: 'Review the business relationship, status, observed activity, and case context in one neutral record set.',
    question: 'Which business relationships and entities are connected to the active case?',
  },
  'Business Intelligence': {
    purpose: 'Review business records, values, observation dates, and context supplied by the case packet.',
    question: 'What business-verification records are available for review?',
  },
  'Employee Profile': {
    purpose: 'Review employee identity, role, employer, status, timing, and related case context.',
    question: 'Which employee facts are available, and how do they connect to the case?',
  },
  'Payroll History': {
    purpose: 'Review payroll periods, employers, amounts, channels, statuses, and contextual details.',
    question: 'What payroll activity is recorded for the active case?',
  },
  'Evidence Center': {
    purpose: 'Review evidence records, sources, receipt status, linked objects, and neutral summaries.',
    question: 'Which evidence items are available, pending, or linked to the case?',
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
    record.id, record.time, record.result, record.method, record.mfaStatus, record.authChannel,
    record.device, record.deviceId, record.browserSource, record.location, record.ip, record.session,
    record.sessionDuration, record.sessionBehavior, record.passwordResetLink, record.profileChangeLink,
    record.moneyMovementLink, record.riskContext, record.investigatorUse, ...(record.relatedRecords ?? []),
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
  const records = getLoginRecords(activeCase);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRecords = records.filter((record) => !normalizedQuery || loginRecordSearchText(record).includes(normalizedQuery));
  const activeRecord = filteredRecords.find((record) => record.id === selectedLoginId) ?? filteredRecords[0] ?? records[0];
  const successfulCount = records.filter((record) => /successful/i.test(record.result)).length;
  const deniedCount = records.filter((record) => /(failed|denied)/i.test(record.result)).length;
  const uniqueDevices = new Set(records.map((record) => record.deviceId ?? record.device)).size;
  const uniqueNetworks = new Set(records.map((record) => `${record.ip} ${record.location}`)).size;
  const mfaCount = records.filter((record) => !/(not recorded|no additional)/i.test(record.mfaStatus)).length;

  useEffect(() => {
    setSelectedLoginId('');
  }, [activeCase.id]);

  function saveLoginNote(message) {
    saveNote(`Login History: ${message}`, 'Login history');
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

      <section className="login-history-summary" aria-label="Login history summary">
        {[
          ['Recorded logins', records.length],
          ['Successful', successfulCount],
          ['Failed / denied', deniedCount],
          ['Unique devices', uniqueDevices],
          ['Networks / locations', uniqueNetworks],
          ['MFA events', mfaCount],
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
                  <span>{record.time} · {record.result}</span>
                  <strong>{record.deviceId ?? record.device}</strong>
                  <small>{record.location} · {record.ip} · {record.session}</small>
                </button>
              ))}
              {!filteredRecords.length && (
                <div className="investigation-tool-empty" role="status">No recorded logins match this search.</div>
              )}
            </section>

            <section className="login-detail-panel" aria-label="Expanded login history detail">
              <header>
                <div>
                  <p>Expanded login</p>
                  <h3>{activeRecord.id} · {activeRecord.result}</h3>
                  <span>{activeRecord.time} · {activeRecord.location}</span>
                </div>
                <button type="button" onClick={() => pin(activeRecord.session)}>Pin session</button>
              </header>

              <dl className="login-detail-grid">
                {[
                  ['Login time', activeRecord.time], ['Result', activeRecord.result], ['Method', activeRecord.method], ['MFA status', activeRecord.mfaStatus],
                  ['Authentication channel', activeRecord.authChannel], ['Device ID', activeRecord.deviceId ?? activeRecord.device], ['Device / browser', activeRecord.browserSource],
                  ['IP address', activeRecord.ip], ['Location', activeRecord.location], ['Session ID', activeRecord.session], ['Session duration', activeRecord.sessionDuration],
                  ['Login context', activeRecord.riskContext],
                ].map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>

              <section className="login-session-panel" aria-label="Session and linked activity">
                <article><span>Session behavior</span><strong>{activeRecord.sessionBehavior}</strong></article>
                <article><span>Password reset timing</span><strong>{activeRecord.passwordResetLink}</strong></article>
                <article><span>Profile change link</span><strong>{activeRecord.profileChangeLink}</strong></article>
                <article><span>Money movement link</span><strong>{activeRecord.moneyMovementLink}</strong></article>
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
                <button type="button" onClick={() => saveLoginNote(`${activeRecord.id} reviewed: ${activeRecord.sessionBehavior}`)}>Save login note</button>
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
          <span>Mark reviewed after checking the login result, authentication, device, IP/location, session behavior, and linked case activity.</span>
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
  const records = getIpRecords(activeCase);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRecords = records.filter((record) => !normalizedQuery || ipRecordSearchText(record).includes(normalizedQuery));
  const activeRecord = filteredRecords.find((record) => record.id === selectedIpId) ?? filteredRecords[0] ?? records[0];
  const lookupHasRun = normalizedQuery.length > 0;
  const sessionCount = records.reduce((count, record) => count + record.observedSessions.length, 0);
  const deviceCount = new Set(records.flatMap((record) => record.observedDevices)).size;

  useEffect(() => {
    setSelectedIpId('');
  }, [activeCase.id]);

  function hiddenUntilLookup(value) {
    return lookupHasRun ? value : 'Run an IP lookup to reveal';
  }

  function saveIpNote(message) {
    saveNote(`IP Intelligence: ${message}`, 'IP intelligence');
  }

  return (
    <>
      <section className="ip-intel-findbar" aria-label="Find IP intelligence information">
        <div>
          <p>IP lookup</p>
          <h3>Search an IP, city, ISP, network type, session, device, or location to reveal network intelligence.</h3>
        </div>
        <label>
          <span>Search IP Intelligence</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: 198.51.100.42, residential, ISP, Arlington, proxy..."
            aria-label="Search IP Intelligence records"
          />
        </label>
        <span aria-live="polite">{lookupHasRun ? `${filteredRecords.length} of ${records.length} records shown` : 'Lookup required'}</span>
      </section>

      <section className="ip-intel-summary" aria-label="IP intelligence summary">
        {[
          ['Raw IP records', records.length], ['Linked sessions', sessionCount], ['Observed devices', deviceCount],
          ['Lookup state', lookupHasRun ? 'Complete' : 'Required'], ['Related logins', records.reduce((count, record) => count + record.observedLogins.length, 0)], ['Active case', activeCase.id],
        ].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>

      {activeRecord ? (
        <>
          <div className="ip-intel-workspace">
            <section className="ip-record-list" aria-label="IP intelligence records">
              <header><p>Raw IP records</p><h3>Choose an IP to look up</h3></header>
              {(lookupHasRun ? filteredRecords : records).map((record) => (
                <button
                  key={record.id}
                  type="button"
                  className={record.id === activeRecord.id ? 'active' : ''}
                  onClick={() => setSelectedIpId(record.id)}
                  data-ip-intelligence-record={record.id}
                >
                  <span>{record.id}</span>
                  <strong>{record.ip}</strong>
                  <small>{record.observedSessions.length} session{record.observedSessions.length === 1 ? '' : 's'} · {lookupHasRun ? record.lookupResult : 'lookup needed'}</small>
                </button>
              ))}
              {lookupHasRun && !filteredRecords.length && <div className="investigation-tool-empty" role="status">No IP intelligence records match this lookup.</div>}
            </section>

            <section className="ip-detail-panel" aria-label="Expanded IP intelligence detail">
              <header>
                <div><p>Network lookup</p><h3>{activeRecord.ip}</h3><span>{hiddenUntilLookup(activeRecord.lookupResult)}</span></div>
                <button type="button" onClick={() => pin(activeRecord.ip)}>Pin IP address</button>
              </header>
              <dl className="ip-detail-grid">
                {[
                  ['City / country', `${activeRecord.city}, ${activeRecord.country}`], ['ISP', activeRecord.isp], ['Network type', activeRecord.networkType],
                  ['Residential status', activeRecord.residentialStatus], ['VPN / proxy / TOR', activeRecord.vpnProxyTor], ['First seen', activeRecord.firstSeen],
                  ['Last seen', activeRecord.lastSeen], ['Velocity', activeRecord.velocity], ['Seen elsewhere', activeRecord.crossCasePresence],
                ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{hiddenUntilLookup(value)}</dd></div>)}
              </dl>
              <section className="ip-observation-panel" aria-label="Observed IP records">
                <article><span>Recorded sessions</span><strong>{activeRecord.observedSessions.join(' · ')}</strong></article>
                <article><span>Recorded devices</span><strong>{activeRecord.observedDevices.join(' · ')}</strong></article>
                <article><span>Location history</span><strong>{hiddenUntilLookup(activeRecord.historicalLocations.join(' · '))}</strong></article>
              </section>
            </section>
          </div>

          <section className="ip-intel-lower-grid" aria-label="IP intelligence history and related evidence">
            <article className="ip-location-panel">
              <header><p>Location Sequence</p><h3>Evidence to compare</h3></header>
              <div>
                {activeRecord.observedLogins.map((login, index) => <span key={login}>{login} · {activeRecord.observedSessions[index] ?? 'Session recorded'} · {hiddenUntilLookup(activeRecord.historicalLocations[index] ?? activeRecord.historicalLocations[0])}</span>)}
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
                <button type="button" onClick={() => saveIpNote(`${activeRecord.ip} reviewed: ${lookupHasRun ? activeRecord.lookupResult : 'lookup not run'}`)}>Save IP note</button>
              </div>
            </article>
          </section>
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
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('IP Intelligence')}>
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
  const records = getSessionRecords(activeCase);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRecords = records.filter((record) => !normalizedQuery || sessionRecordSearchText(record).includes(normalizedQuery));
  const activeRecord = filteredRecords.find((record) => record.session === selectedSessionId) ?? filteredRecords[0] ?? records[0];
  const loggedOutCount = records.filter((record) => /normal logout/i.test(record.logoutStatus)).length;
  const profileActivityCount = records.filter((record) => !record.profileActions.every((item) => /no profile/i.test(item))).length;
  const moneyMovementCount = records.filter((record) => !record.moneyMovement.every((item) => /no money/i.test(item))).length;
  const uniqueDevices = new Set(records.map((record) => record.deviceId ?? record.device)).size;
  const uniqueIps = new Set(records.map((record) => record.ip)).size;

  useEffect(() => {
    setSelectedSessionId('');
  }, [activeCase.id]);

  function saveSessionNote(message) {
    saveNote(`Session History: ${message}`, 'Session history');
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

      <section className="session-history-summary" aria-label="Session history summary">
        {[
          ['Recorded sessions', records.length], ['Normal logout', loggedOutCount], ['Session timeout', records.length - loggedOutCount],
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

const documentRequestStatuses = ['All', 'Requested', 'Received', 'Pending Review', 'Approved', 'Rejected', 'Expired', 'Missing', 'Exception Approved'];

function documentRequestStatus(status = '') {
  if (status === 'Available') return 'Pending Review';
  return documentRequestStatuses.includes(status) ? status : 'Pending Review';
}

function buildDocumentRequests(activeCase) {
  const evidence = getEvidenceRecords(activeCase);
  return (evidence.documents ?? []).map((document) => {
    const status = documentRequestStatus(document.status);
    const isOptional = /optional/i.test(document.category);
    const received = ['Received', 'Approved', 'Pending Review'].includes(status) ? document.updated : 'Not received';
    return {
      id: document.id,
      documentType: document.title,
      category: document.category,
      status,
      reason: status === 'Requested'
        ? 'Requested to complete the fictional case packet.'
        : status === 'Missing'
          ? 'Optional supporting document is not included in the current packet.'
          : 'Available for case-document review and comparison.',
      requirement: isOptional ? 'Optional' : 'Required',
      dueDate: status === 'Requested' ? 'Follow up date not supplied' : 'Not applicable',
      authenticity: status === 'Approved' ? 'Approved in training packet' : 'Not reviewed',
      reviewerNotes: document.preview,
      linkedCase: activeCase.id,
      linkedTool: 'Evidence Center',
      receivedDate: received,
      fields: document.fields,
    };
  });
}

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
}) {
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const requests = buildDocumentRequests(activeCase);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRequests = requests.filter((request) => (
    (statusFilter === 'All' || request.status === statusFilter)
    && (!normalizedQuery || documentRequestSearchText(request).includes(normalizedQuery))
  ));
  const activeRequest = filteredRequests.find((request) => request.id === selectedRequestId) ?? filteredRequests[0] ?? requests[0];
  const counts = documentRequestStatuses.slice(1).map((status) => [status, requests.filter((request) => request.status === status).length]);

  useEffect(() => {
    setSelectedRequestId('');
    setStatusFilter('All');
  }, [activeCase.id]);

  function saveRequestNote(message) {
    saveNote(`Document Request: ${message}`, 'Document request');
  }

  return (
    <>
      <section className="document-request-findbar" aria-label="Find document request information">
        <div>
          <p>Document request workflow</p>
          <h3>Review requested, received, missing, and pending documents for the active fictional case.</h3>
        </div>
        <label>
          <span>Search Document Request</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: affidavit, cancellation, required, missing, Evidence Center..."
            aria-label="Search Document Request records"
          />
        </label>
        <span aria-live="polite">{filteredRequests.length} of {requests.length} requests shown</span>
      </section>

      <section className="document-request-statuses" aria-label="Document request statuses">
        {documentRequestStatuses.map((status) => {
          const count = status === 'All' ? requests.length : requests.filter((request) => request.status === status).length;
          return <button key={status} type="button" className={statusFilter === status ? 'active' : ''} onClick={() => setStatusFilter(status)}>{status}<strong>{count}</strong></button>;
        })}
      </section>

      {activeRequest ? (
        <div className="document-request-workspace">
          <section className="document-request-list" aria-label="Document request records">
            <header>
              <p>Request queue</p>
              <h3>Choose a document request</h3>
            </header>
            {filteredRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                className={request.id === activeRequest.id ? 'active' : ''}
                onClick={() => setSelectedRequestId(request.id)}
                data-document-request={request.id}
              >
                <span>{request.status}</span>
                <strong>{request.documentType}</strong>
                <small>{request.requirement} · {request.receivedDate}</small>
              </button>
            ))}
            {!filteredRequests.length && <div className="investigation-tool-empty" role="status">No document requests match this filter or search.</div>}
          </section>

          <section className="document-request-detail" aria-label="Expanded document request detail">
            <header>
              <div>
                <p>Request detail</p>
                <h3>{activeRequest.id} · {activeRequest.documentType}</h3>
                <span>{activeRequest.status}</span>
              </div>
              <button type="button" onClick={() => pin(`${activeRequest.id} · ${activeRequest.documentType}`)}>Pin request</button>
            </header>
            <dl>
              {[
                ['Document type', activeRequest.documentType],
                ['Reason requested', activeRequest.reason],
                ['Required / optional', activeRequest.requirement],
                ['Due date', activeRequest.dueDate],
                ['Status', activeRequest.status],
                ['Authenticity flag', activeRequest.authenticity],
                ['Linked case', activeRequest.linkedCase],
                ['Linked tool', activeRequest.linkedTool],
                ['Received date', activeRequest.receivedDate],
              ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            <article className="document-request-notes">
              <span>Reviewer notes</span>
              <p>{activeRequest.reviewerNotes}</p>
              <small>{activeRequest.fields}</small>
            </article>
            <div className="document-request-actions">
              <button type="button" onClick={() => saveRequestNote(`${activeRequest.id} follow-up recorded for ${activeRequest.status}.`)}>Save follow-up note</button>
              <button type="button" onClick={() => openTool('Evidence Center')}>Open Evidence Center</button>
            </div>
          </section>
        </div>
      ) : (
        <div className="investigation-tool-empty" role="status">No document requests are available for this case.</div>
      )}

      <section className="document-request-summary" aria-label="Document request workflow summary">
        {counts.filter(([, count]) => count > 0).map(([status, count]) => <article key={status}><span>{status}</span><strong>{count}</strong></article>)}
      </section>

      <nav className="investigation-tool-next-routes" aria-label="Document request next routes">
        <button type="button" onClick={() => openTool('Evidence Center')}>Open Evidence Center</button>
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
  const [searchDraft, setSearchDraft] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('identity-summary');
  const searchMatched = submittedSearch && matchesIdentityIntelSearch(report, submittedSearch);
  const activeSection = report.sections.find((section) => section.id === activeSectionId) ?? report.sections[0];

  useEffect(() => {
    setSearchDraft('');
    setSubmittedSearch('');
    setActiveSectionId('identity-summary');
  }, [activeCase.id]);

  function runSearch() {
    setSubmittedSearch(searchDraft.trim());
  }

  function saveIdentityNote(message) {
    saveNote(`Identity Intel: ${message}`, 'Identity Intel');
  }

  return (
    <>
      <section className="identity-intel-search" aria-label="Identity Intel search">
        <div>
          <p>People Search</p>
          <h3>Search a name, fictional Training ID, email, or phone to reveal the identity report.</h3>
          <span>Fictional training data only. Identity information is evidence, not a case conclusion.</span>
        </div>
        <label>
          <span>Name + DOB, Training ID, email, or phone</span>
          <input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') runSearch(); }}
            placeholder="Try: TRN-8842-19, Maya Sterling, or a training email"
            aria-label="Search Identity Intel records"
          />
        </label>
        <button type="button" onClick={runSearch} disabled={!searchDraft.trim()}>Run People Search</button>
      </section>

      {!submittedSearch && <section className="identity-intel-gate" aria-label="Identity report locked">
        <strong>Identity report hidden until a search is run.</strong>
        <span>Use a fictional profile value from the active case to reveal the report.</span>
      </section>}

      {submittedSearch && !searchMatched && <section className="identity-intel-gate" aria-label="No identity match">
        <strong>No fictional identity match returned for this search.</strong>
        <span>Try the active customer name, Training ID, email, or phone from Customer 360.</span>
      </section>}

      {searchMatched && <>
        <section className="identity-intel-summary" aria-label="Identity Match Summary">
          <header>
            <div>
              <p>Identity Match Summary</p>
              <h3>{activeCase.person}</h3>
              <span>{report.profile.profileId} · Fictional training profile</span>
            </div>
            <button type="button" onClick={() => pin(`${report.profile.profileId} · ${activeCase.person}`)}>Pin profile</button>
          </header>
          <dl>
            {report.summary.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </section>

        <section className="identity-intel-counts" aria-label="Identity report counts">
          {report.counts.map(([label, count]) => <article key={label}><strong>{count}</strong><span>{label}</span></article>)}
        </section>

        <div className="identity-intel-workspace">
          <section className="identity-intel-sections" aria-label="Identity report sections">
            <header><p>Full report</p><h3>Open a report section</h3></header>
            {report.sections.map((section) => <button key={section.id} type="button" className={section.id === activeSection.id ? 'active' : ''} onClick={() => setActiveSectionId(section.id)}>{section.title}</button>)}
          </section>

          <section className="identity-intel-report" aria-label="Expanded identity report">
            <header>
              <div><p>Fictional report section</p><h3>{activeSection.title}</h3></div>
              <button type="button" onClick={() => saveIdentityNote(`${activeSection.title} reviewed for ${report.profile.profileId}.`)}>Save section note</button>
            </header>
            <dl>{activeSection.fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
          </section>

          <aside className="identity-intel-evidence" aria-label="Evidence Explorer">
            <header><p>Evidence Explorer</p><h3>Case objects to compare</h3></header>
            <div>
              {(activeCase.identityRecords ?? []).map((item) => <article key={item.id}><span>{item.type}</span><strong>{item.value}</strong><small>{item.id} · {item.lastSeen}</small><button type="button" onClick={() => pin(`${item.id} · ${item.value}`)}>Pin</button></article>)}
            </div>
            <button type="button" onClick={() => saveIdentityNote(`Identity Match Summary ${report.profile.profileId} reviewed for ${activeCase.person}.`)}>Save match summary note</button>
          </aside>
        </div>
      </>}

      <nav className="investigation-tool-next-routes" aria-label="Identity Intel next routes">
        <button type="button" onClick={() => openTool('Customer 360')}>Open Customer 360</button>
        <button type="button" onClick={() => openTool('Evidence Center')}>Open Evidence Center</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div>
          <strong>Identity Intel / People Search review</strong>
          <span>Run a search, review the fictional report, and compare it with case evidence before marking this tool reviewed.</span>
        </div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} disabled={!searchMatched} onClick={() => markReviewed('Identity Intel / People Search')}>
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
        <div><p>Banking activity</p><h3>30-day training activity view. Filter merchant, date, account, amount context, channel, or debit and credit activity.</h3></div>
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
          <button type="button" onClick={() => openTool('Evidence Center')}>Open Evidence Center</button>
        </aside>
      </div> : <div className="investigation-tool-empty" role="status">No transaction records are available for this case.</div>}

      <nav className="investigation-tool-next-routes" aria-label="Transaction History next routes"><button type="button" onClick={() => openTool('Financial Intelligence')}>Open Financial Intelligence</button><button type="button" onClick={() => openTool('Payment Verification')}>Open Payment Verification</button><button type="button" onClick={() => openTool('Evidence Center')}>Open Evidence Center</button><button type="button" onClick={jumpDecision}>Open Submit Decision</button></nav>
      <footer className="investigation-tool-review-bar"><div><strong>Transaction History review</strong><span>Review the activity feed, transaction details, linked records, and documents before marking the tool reviewed.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Transaction History')}>{reviewed ? '✓ Transaction History reviewed' : 'Mark Transaction History reviewed'}</button></footer>
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
        <aside className="business-360-evidence" aria-label="Business 360 evidence"><header><p>Evidence Explorer</p><h3>Business records to compare</h3></header>{workspace.intelligence.map((record) => <article key={record.id}><span>{record.type}</span><strong>{record.value}</strong><small>{record.id} | {record.observed}</small></article>)}<button type="button" onClick={() => openTool('Evidence Center')}>Open Evidence Center</button></aside>
      </div>
      <nav className="investigation-tool-next-routes" aria-label="Business 360 next routes"><button type="button" onClick={() => openTool('Business Intelligence')}>Open Business Intelligence</button><button type="button" onClick={() => openTool('Employee Profile')}>Open Employee Profile</button><button type="button" onClick={() => openTool('Payroll History')}>Open Payroll History</button><button type="button" onClick={jumpDecision}>Open Submit Decision</button></nav>
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
      <nav className="investigation-tool-next-routes" aria-label="Employee Profile next routes"><button type="button" onClick={() => openTool('Business 360')}>Open Business 360</button><button type="button" onClick={() => openTool('Payroll History')}>Open Payroll History</button><button type="button" onClick={() => openTool('Evidence Center')}>Open Evidence Center</button><button type="button" onClick={jumpDecision}>Open Submit Decision</button></nav>
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
        <button type="button" onClick={() => openTool('Evidence Center')}>Open Evidence Center</button>
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
        {(tool === 'Evidence Center' || tool === 'Financial Intelligence') && <button type="button" onClick={() => openTool('Transaction History')}>Open Transaction History</button>}
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
