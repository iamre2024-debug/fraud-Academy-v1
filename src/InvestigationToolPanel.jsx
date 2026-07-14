import { useEffect, useMemo, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { buildCoreToolRecords } from './data/coreToolRecords.js';
import { getDeviceProfiles } from './data/deviceRecords.js';
import { evidenceRecordsByCase } from './data/evidenceRecords.js';
import { financialRecordsByCase } from './data/financialRecords.js';
import { getLoginRecords } from './data/loginRecords.js';
import { getIpRecords } from './data/ipRecords.js';
import { getSessionRecords } from './data/sessionRecords.js';
import { workflows } from './visualWorkspaceModel.js';

const toolDetails = {
  'Identity Intelligence': {
    purpose: 'Review identity records, values, history, and linked customer objects without drawing an early conclusion.',
    question: 'Which identity records belong to this customer, and how have those records changed over time?',
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
  const evidence = evidenceRecordsByCase[activeCase.id] ?? { documents: [] };
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
  const financial = financialRecordsByCase[activeCase.id] ?? { paymentVerification: [] };
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

      {tool === 'Login History' ? (
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
