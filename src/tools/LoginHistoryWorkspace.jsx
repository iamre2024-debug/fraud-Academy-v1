import { useEffect, useState } from 'react';
import { generateAccessHistoryReport, generatedAccessReportTypes } from '../data/accessHistoryReports.js';
import { getLoginRecords } from '../data/loginRecords.js';
import { downloadAccessReport } from './shared.jsx';

function loginRecordSearchText(record) {
  return [
    record.id, record.timestamp, record.date, record.timeOfDay, record.eventType, record.result, record.method, record.mfaStatus, record.authChannel,
    record.device, record.deviceId, record.browserSource, record.operatingSystem, record.location, record.ip, record.sessionReference,
    record.failedAttemptCount, record.accountLockout, record.passwordResetLink, record.profileChangeLink,
    record.loginContext, record.investigatorUse, ...(record.relatedRecords ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
}

export default function LoginHistoryWorkspace({
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

