import { useEffect, useState } from 'react';
import { generateAccessHistoryReport, generatedAccessReportTypes } from '../data/accessHistoryReports.js';
import { getSessionRecords } from '../data/sessionRecords.js';
import { downloadAccessReport } from './shared.jsx';

function sessionRecordSearchText(record) {
  return [
    record.session, record.id, record.start, record.end, record.duration, record.logoutStatus, record.method,
    record.device, record.deviceId, record.location, record.ip, record.result, record.investigatorUse,
    ...(record.pagesViewed ?? []), ...(record.securitySettings ?? []), ...(record.profileActions ?? []),
    ...(record.payeeTokenActivity ?? []), ...(record.moneyMovement ?? []), ...(record.sessionPath ?? []), ...(record.relatedRecords ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
}


export default function SessionHistoryWorkspace({
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

