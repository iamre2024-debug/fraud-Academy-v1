import { useEffect, useMemo, useState } from 'react';

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function searchable(login) {
  return `${login.id} ${login.time} ${login.result} ${login.device} ${login.deviceId} ${login.location} ${login.ip} ${login.session} ${login.method}`.toLowerCase();
}

export default function LoginHistoryPanel({
  activeCase,
  openTool,
  pin,
  saveNote,
  saveCaseReportPacket,
  markReviewed,
  currentCompleted,
  jumpDecision,
}) {
  const logins = activeCase.loginHistory ?? [];
  const [query, setQuery] = useState('');
  const [resultFilter, setResultFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const reviewed = currentCompleted.includes('Login History');

  useEffect(() => {
    setQuery('');
    setResultFilter('all');
    setMethodFilter('all');
    setLocationFilter('all');
    setSelectedId('');
  }, [activeCase.id]);

  const visibleLogins = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return logins.filter((login) => {
      if (normalized && !searchable(login).includes(normalized)) return false;
      if (resultFilter !== 'all' && login.result !== resultFilter) return false;
      if (methodFilter !== 'all' && login.method !== methodFilter) return false;
      if (locationFilter !== 'all' && login.location !== locationFilter) return false;
      return true;
    });
  }, [logins, query, resultFilter, methodFilter, locationFilter]);

  const selected = visibleLogins.find((login) => login.id === selectedId)
    ?? logins.find((login) => login.id === selectedId)
    ?? visibleLogins[0]
    ?? logins[0];
  const relatedEvents = selected
    ? (activeCase.events ?? []).filter((event) => event.time === selected.time || String(event.detail).includes(selected.session)).slice(0, 4)
    : [];

  function clearFilters() {
    setQuery('');
    setResultFilter('all');
    setMethodFilter('all');
    setLocationFilter('all');
  }

  function saveLoginPacket() {
    if (!selected) return;
    saveCaseReportPacket({
      id: `${activeCase.id}-LOGIN-${selected.id}`,
      label: 'Login History evidence',
      pin: selected.session,
      values: [
        selected.id,
        selected.time,
        selected.result,
        selected.deviceId ?? selected.device,
        selected.ip,
        selected.location,
        selected.method,
      ],
      detail: `Login ${selected.id} · ${selected.time} · ${selected.result} · ${selected.deviceId ?? selected.device} · ${selected.session} · ${selected.ip} · ${selected.location} · ${selected.method}.`,
    });
  }

  return (
    <section className="ornate-card activity-panel login-history-panel" data-login-history-screen="event-review-v1" data-tool-name="Login History">
      <header className="login-history-header">
        <div>
          <p>Login, Device & IP · Evidence First</p>
          <h2>Login History</h2>
          <span>Filter access attempts, open one event, and compare the session, device, IP address, location, method, and result.</span>
        </div>
        <div>
          <strong>{activeCase.id}</strong>
          <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
        </div>
      </header>

      <section className="login-filter-card" aria-label="Login History filters">
        <label className="login-search-field">
          <span>Search login, IP, device, session, or location</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search access records" aria-label="Search Login History" />
        </label>
        <div className="login-filter-grid">
          <label><span>Result</span><select value={resultFilter} onChange={(event) => setResultFilter(event.target.value)} aria-label="Filter login result"><option value="all">All results</option>{unique(logins.map((item) => item.result)).map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Method</span><select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)} aria-label="Filter login method"><option value="all">All methods</option>{unique(logins.map((item) => item.method)).map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Location</span><select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} aria-label="Filter login location"><option value="all">All locations</option>{unique(logins.map((item) => item.location)).map((value) => <option key={value}>{value}</option>)}</select></label>
          <button type="button" onClick={clearFilters}>Clear Filters</button>
        </div>
        <p aria-live="polite">{visibleLogins.length} of {logins.length} login records shown</p>
      </section>

      <div className="login-history-workspace">
        <section className="login-records" aria-labelledby="login-records-heading">
          <header><div><p>Access events</p><h3 id="login-records-heading">Recorded login attempts</h3></div><span>{visibleLogins.length} shown</span></header>
          <div className="login-record-list">
            {visibleLogins.map((login) => {
              const open = selected?.id === login.id;
              return (
                <article key={login.id} className={open ? 'selected' : ''} data-login-record={login.id}>
                  <header><div><span>{login.id}</span><h4>Login event</h4></div><em>{login.result}</em></header>
                  <dl>
                    <div><dt>Time</dt><dd>{login.time}</dd></div>
                    <div><dt>Device</dt><dd>{login.device}</dd></div>
                    <div><dt>Location</dt><dd>{login.location}</dd></div>
                    <div><dt>Method</dt><dd>{login.method}</dd></div>
                  </dl>
                  <div><button type="button" onClick={() => setSelectedId(login.id)}>{open ? 'Event open' : 'Open event'}</button><button type="button" onClick={() => pin(login.session)}>Pin session</button></div>
                </article>
              );
            })}
            {!visibleLogins.length && <p className="login-empty">No login records match the current filters.</p>}
          </div>
        </section>

        <aside className="login-session-detail" aria-label="Selected login and session detail">
          {selected ? (
            <>
              <header><div><p>Selected access event</p><h3>{selected.id}</h3><span>{selected.time} · {selected.result}</span></div><button type="button" onClick={() => pin(selected.session)}>Pin record</button></header>
              <dl className="login-detail-grid">
                <div><dt>Event ID</dt><dd>{selected.id}</dd></div>
                <div><dt>Result</dt><dd>{selected.result}</dd></div>
                <div><dt>Time</dt><dd>{selected.time}</dd></div>
                <div><dt>Authentication method</dt><dd>{selected.method}</dd></div>
                <div><dt>Device</dt><dd>{selected.device}</dd></div>
                <div><dt>Device ID</dt><dd>{selected.deviceId ?? 'Not recorded'}</dd></div>
                <div><dt>Session ID</dt><dd>{selected.session}</dd></div>
                <div><dt>IP address</dt><dd>{selected.ip}</dd></div>
                <div><dt>Location</dt><dd>{selected.location}</dd></div>
                <div><dt>Case</dt><dd>{activeCase.id}</dd></div>
              </dl>
              <section className="login-related-events">
                <header><p>Session context</p><h4>Related recorded events</h4></header>
                {relatedEvents.map((event) => <article key={event.id}><strong>{event.time} · {event.label}</strong><span>{event.detail}</span></article>)}
                {!relatedEvents.length && <p>No separate event row shares this exact timestamp or session. Open Session History for the complete session event list.</p>}
              </section>
              <nav className="login-related-tools" aria-label="Login record related tools">
                <button type="button" onClick={() => openTool('Session History')}>Open Session History</button>
                <button type="button" onClick={() => openTool('Device Intelligence')}>Open Device Intelligence</button>
                <button type="button" onClick={() => openTool('IP Intelligence')}>Open IP Intelligence</button>
              </nav>
              <div className="login-detail-actions">
                <button type="button" onClick={() => saveNote(`Login ${selected.id}: ${selected.time} · ${selected.result} · ${selected.deviceId ?? selected.device} · ${selected.session} · ${selected.ip} · ${selected.location} · ${selected.method}.`, 'Login record')}>Save login note</button>
                <button type="button" onClick={saveLoginPacket}>Save login to evidence</button>
              </div>
            </>
          ) : <p className="login-empty">Open a login event to review its complete details.</p>}
        </aside>
      </div>

      <footer className="login-review-bar"><div><strong>Login History review</strong><span>Review completion tracks process progress only.</span></div><button type="button" onClick={() => markReviewed('Login History')}>{reviewed ? '✓ Login History reviewed' : 'Mark Login History reviewed'}</button></footer>
    </section>
  );
}
