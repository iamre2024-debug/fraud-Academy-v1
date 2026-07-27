import { useEffect, useState } from 'react';
import { generateAccessHistoryReport, generatedAccessReportTypes } from '../data/accessHistoryReports.js';
import { getIpRecords } from '../data/ipRecords.js';
import { downloadAccessReport } from './shared.jsx';

function ipRecordSearchText(record) {
  return [
    record.id, record.ip, record.city, record.country, record.isp, record.networkType, record.residentialStatus,
    record.vpnProxyTor, record.firstSeen, record.lastSeen, record.velocity, record.crossCasePresence, record.lookupResult,
    ...(record.historicalLocations ?? []), ...(record.observedSessions ?? []), ...(record.observedDevices ?? []),
    ...(record.observedLogins ?? []), ...(record.relatedRecords ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
}

export default function IPIntelligenceWorkspace({
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

