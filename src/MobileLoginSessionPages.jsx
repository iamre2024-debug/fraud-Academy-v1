import { useState } from 'react';

function AccessGlyph({ type, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (type === 'search') return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>;
  if (type === 'filter') return <svg {...common}><path d="M3 5h18l-7 8v5l-4 2v-7z" /></svg>;
  if (type === 'login') return <svg {...common}><path d="M9 4H5v16h4M14 8l4 4-4 4M18 12H8" /></svg>;
  if (type === 'session') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2M7 3.5 4.5 6" /></svg>;
  if (type === 'shield') return <svg {...common}><path d="M12 2.5 20 6v5.5c0 4.8-3 8.1-8 10-5-1.9-8-5.2-8-10V6z" /><path d="m8.7 12 2.2 2.2 4.6-4.7" /></svg>;
  if (type === 'device') return <svg {...common}><rect x="4" y="3.5" width="16" height="12" rx="2" /><path d="M8 20h8M12 15.5V20" /></svg>;
  if (type === 'location') return <svg {...common}><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg>;
  if (type === 'network') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.6 5.5 3.6 9s-1.1 6.5-3.6 9c-2.5-2.5-3.6-5.5-3.6-9S9.5 5.5 12 3Z" /></svg>;
  if (type === 'pin') return <svg {...common}><path d="M9 3h6l.8 5 2.2 2v2H6v-2l2.2-2zM12 12v9" /></svg>;
  if (type === 'note') return <svg {...common}><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" /></svg>;
  if (type === 'report') return <svg {...common}><path d="M5 3h10l4 4v14H5zM15 3v5h4M8 12h8M8 16h8" /></svg>;
  if (type === 'chevron') return <svg {...common}><path d="m9 5 7 7-7 7" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>;
}

function MobileAccessLuna() {
  return (
    <aside className="mobile-access-luna" aria-label="Luna debrief is available after submission">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="29" fill="#08275c" stroke="#60ddff" strokeWidth="2" />
        <path d="m16 22 5-12 10 9h3l10-9 5 13c5 7 5 18-1 25-7 8-25 8-32-1-5-7-5-18 0-25Z" fill="#f2fbff" />
        <path d="m21 12 7 9-9 4m24-13-7 9 9 4" fill="#f2a9d2" opacity=".65" />
        <ellipse cx="25" cy="32" rx="3" ry="4" fill="#163c6e" />
        <ellipse cx="39" cy="32" rx="3" ry="4" fill="#163c6e" />
        <path d="m32 37-3 2 3 2 3-2Z" fill="#d06d9e" />
        <path d="M24 43c3 4 13 4 16 0" fill="none" stroke="#31517a" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span><strong>Luna ✦</strong><small>Debrief after submit</small></span>
    </aside>
  );
}

function MobileAccessHeader({ title, subtitle, icon }) {
  return (
    <header className="mobile-access-header">
      <span className="mobile-access-header-icon"><AccessGlyph type={icon} size={25} /></span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <MobileAccessLuna />
      <span className="mobile-access-evidence-boundary">Evidence First</span>
    </header>
  );
}

function loginTone(result = '') {
  if (/successful/i.test(result)) return 'successful';
  if (/locked/i.test(result)) return 'locked';
  if (/failed|denied/i.test(result)) return 'failed';
  return 'recorded';
}

function sessionTone(status = '') {
  if (/normal logout/i.test(status)) return 'normal';
  if (/timeout/i.test(status)) return 'timeout';
  return 'recorded';
}

function listText(items = []) {
  return items?.filter(Boolean).join(' · ') || 'No recorded activity';
}

function accessClock(value = '') {
  const parts = String(value).split('·').map((item) => item.trim()).filter(Boolean);
  return parts.at(-1) || value;
}

function MobileAccessSearch({
  ariaLabel,
  filtersOpen,
  onToggleFilters,
  placeholder,
  query,
  resultCount,
  setQuery,
  totalCount,
}) {
  return (
    <section className="mobile-access-search">
      <label>
        <AccessGlyph type="search" size={20} />
        <span className="sr-only">{ariaLabel}</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
      </label>
      <button
        type="button"
        className={filtersOpen ? 'active' : ''}
        aria-expanded={filtersOpen}
        onClick={onToggleFilters}
        aria-label={filtersOpen ? 'Hide access history filters' : 'Show access history filters'}
      >
        <AccessGlyph type="filter" size={20} />
      </button>
      <small aria-live="polite">{resultCount} of {totalCount} records shown</small>
    </section>
  );
}

function MobileAccessSummary({ className, items, label }) {
  return (
    <section className={className} aria-label={label}>
      {items.map(([itemLabel, value]) => (
        <article key={itemLabel}><span>{itemLabel}</span><strong>{value}</strong></article>
      ))}
    </section>
  );
}

export function MobileLoginHistoryPage({
  activeRecord,
  dateFilter,
  dateOptions,
  deviceFilter,
  deviceOptions,
  filteredRecords,
  generateLoginReport,
  jumpDecision,
  markReviewed,
  methodFilter,
  methodOptions,
  openTool,
  pin,
  query,
  records,
  reportGenerated,
  resultFilter,
  resultOptions,
  reviewed,
  saveLoginNote,
  setDateFilter,
  setDeviceFilter,
  setMethodFilter,
  setQuery,
  setResultFilter,
  setSelectedLoginId,
}) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const successfulCount = records.filter((record) => /successful/i.test(record.result)).length;
  const deniedCount = records.filter((record) => /(failed|denied)/i.test(record.result)).length;
  const lockoutCount = records.filter((record) => /locked/i.test(record.result)).length;
  const uniqueDevices = new Set(records.map((record) => record.deviceId ?? record.device)).size;
  const mfaCount = records.filter((record) => /completed|delivered|approved/i.test(record.mfaStatus)).length;
  const quickResults = resultOptions.slice(0, 4);

  function clearFilters() {
    setQuery('');
    setResultFilter('All results');
    setMethodFilter('All methods');
    setDeviceFilter('All devices');
    setDateFilter('All dates');
  }

  return (
    <section className="mobile-access-reference-page mobile-login-reference" data-mobile-login-reference="true">
      <MobileAccessHeader
        title="Login History"
        subtitle="Track and analyze recorded authentication events."
        icon="login"
      />

      <MobileAccessSearch
        ariaLabel="Search Login History records"
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((current) => !current)}
        placeholder="Search logins, IP, location, device..."
        query={query}
        resultCount={filteredRecords.length}
        setQuery={setQuery}
        totalCount={records.length}
      />

      <nav className="mobile-access-quick-filters" aria-label="Quick Login History result filters">
        {quickResults.map((item) => (
          <button
            key={item}
            type="button"
            className={resultFilter === item ? 'active' : ''}
            aria-pressed={resultFilter === item}
            onClick={() => setResultFilter(item)}
          >
            {item === 'All results' ? 'All' : item}
            <span>{item === 'All results' ? records.length : records.filter((record) => record.result === item).length}</span>
          </button>
        ))}
      </nav>

      {filtersOpen && (
        <section className="access-history-filters login-history-filters mobile-access-filter-panel" aria-label="Filter Login History">
          <label><span>Result</span><select value={resultFilter} onChange={(event) => setResultFilter(event.target.value)} aria-label="Filter Login History by result">{resultOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Method</span><select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)} aria-label="Filter Login History by method">{methodOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Device</span><select value={deviceFilter} onChange={(event) => setDeviceFilter(event.target.value)} aria-label="Filter Login History by device">{deviceOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Date</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter Login History by date">{dateOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <button type="button" onClick={clearFilters}>Clear filters</button>
        </section>
      )}

      <MobileAccessSummary
        className="login-history-summary mobile-access-summary"
        label="Login history summary"
        items={[
          ['Authentication events', records.length],
          ['Successful', successfulCount],
          ['Failed / denied', deniedCount],
          ['Account lockouts', lockoutCount],
          ['Unique devices', uniqueDevices],
          ['MFA completed', mfaCount],
        ]}
      />

      {records.length ? (
        <>
          <section className="login-record-list mobile-login-record-list" aria-label="Login history records">
            {filteredRecords.map((record) => (
              <button
                key={record.id}
                type="button"
                className={record.id === activeRecord.id ? 'active' : ''}
                aria-pressed={record.id === activeRecord.id}
                onClick={() => setSelectedLoginId(record.id)}
                data-login-history-record={record.id}
              >
                <span className="mobile-access-event-mark" data-tone={loginTone(record.result)}>
                  <AccessGlyph type={/successful/i.test(record.result) ? 'shield' : 'login'} size={20} />
                </span>
                <span className="mobile-access-record-copy">
                  <span><strong>{record.timestamp}</strong><em data-tone={loginTone(record.result)}>{record.result}</em></span>
                  <small><AccessGlyph type="shield" size={14} /> MFA: {record.mfaStatus}</small>
                  <small><AccessGlyph type="location" size={14} /> {record.location} · {record.ip}</small>
                  <small><AccessGlyph type="device" size={14} /> {record.browserSource} · {record.operatingSystem}</small>
                  <span className="mobile-access-record-chips">
                    <i>{record.eventType}</i>
                    <i>{record.sessionReference}</i>
                  </span>
                </span>
                <span className="mobile-access-chevron"><AccessGlyph type="chevron" size={18} /></span>
              </button>
            ))}
            {!filteredRecords.length && <div className="investigation-tool-empty" role="status">No recorded logins match this search.</div>}
          </section>

          {activeRecord && (
            <>
              <section className="login-detail-panel mobile-access-detail-panel" aria-label="Expanded login history detail">
                <header>
                  <div>
                    <p>Authentication event detail</p>
                    <h3>{activeRecord.id} · {activeRecord.result}</h3>
                    <span>{activeRecord.timestamp} · {activeRecord.location}</span>
                  </div>
                  <button type="button" onClick={() => pin(activeRecord.id)}><AccessGlyph type="pin" size={17} /> Pin login event</button>
                </header>

                <dl className="login-detail-grid mobile-access-detail-grid">
                  {[
                    ['Date / time', activeRecord.timestamp],
                    ['Event type', activeRecord.eventType],
                    ['Result', activeRecord.result],
                    ['Failed-attempt count', activeRecord.failedAttemptCount],
                    ['Account lockout', activeRecord.accountLockout],
                    ['Method', activeRecord.method],
                    ['MFA status', activeRecord.mfaStatus],
                    ['Authentication channel', activeRecord.authChannel],
                    ['Device ID', activeRecord.deviceId ?? activeRecord.device],
                    ['Device / browser', activeRecord.browserSource],
                    ['Operating system', activeRecord.operatingSystem],
                    ['IP address', activeRecord.ip],
                    ['Location', activeRecord.location],
                    ['Session reference', activeRecord.sessionReference],
                  ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                </dl>

                <section className="login-session-panel mobile-access-linked-panel" aria-label="Session and linked activity">
                  <article><span>Session availability</span><strong>{activeRecord.sessionReference === 'No session created' ? 'Authentication did not create a session' : `Open ${activeRecord.sessionReference} in Session History`}</strong></article>
                  <article><span>Password reset timing</span><strong>{activeRecord.passwordResetLink}</strong></article>
                  <article><span>Profile change link</span><strong>{activeRecord.profileChangeLink}</strong></article>
                  <article><span>Authentication scope</span><strong>Post-login pages and actions are kept in Session History.</strong></article>
                </section>
              </section>

              <section className="login-history-lower-grid mobile-access-lower-grid" aria-label="Login history related evidence">
                <article className="login-related-panel mobile-access-related-panel">
                  <header><p>Related records</p><h3>Evidence to cross-reference</h3></header>
                  <div>{(activeRecord.relatedRecords ?? []).map((item) => <span key={item}>{item}</span>)}</div>
                </article>
                <article className="login-notes-panel mobile-access-notes-panel">
                  <header><p>Investigator notes</p><h3>Evidence-first reminder</h3></header>
                  <p>{activeRecord.investigatorUse} A successful MFA event is evidence of authentication activity, not a final conclusion about authorization.</p>
                  <div>
                    <button type="button" onClick={() => saveLoginNote(`${activeRecord.id} reviewed: ${activeRecord.timestamp} · ${activeRecord.eventType} · ${activeRecord.result} · ${activeRecord.deviceId ?? activeRecord.device} · ${activeRecord.ip}`)}><AccessGlyph type="note" size={17} /> Save login note</button>
                    <button type="button" onClick={generateLoginReport}><AccessGlyph type="report" size={17} /> {reportGenerated ? 'Regenerate Login Timeline Report' : 'Generate Login Timeline Report'}</button>
                  </div>
                </article>
              </section>
            </>
          )}
        </>
      ) : <div className="investigation-tool-empty" role="status">No login history records are available for this case.</div>}

      <nav className="investigation-tool-next-routes mobile-access-routes" aria-label="Login history next routes">
        <button type="button" onClick={() => openTool('Session History')}>Open Session History</button>
        <button type="button" onClick={() => openTool('Device Intelligence')}>Open Device Intelligence</button>
        <button type="button" onClick={() => openTool('IP Intelligence')}>Open IP Intelligence</button>
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
        <button type="button" className="primary" onClick={jumpDecision}>Continue to decision</button>
      </nav>

      <footer className="investigation-tool-review-bar mobile-access-review-bar">
        <div><strong>Login History review</strong><span>Completion records that authentication evidence was checked. It does not determine the case.</span></div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Login History')}>
          {reviewed ? '✓ Login History reviewed' : 'Mark Login History reviewed'}
        </button>
      </footer>
    </section>
  );
}

export function MobileSessionHistoryPage({
  activeCase,
  activeRecord,
  activityFilter,
  activityOptions,
  dateFilter,
  dateOptions,
  deviceFilter,
  deviceOptions,
  filteredRecords,
  generateSessionReport,
  jumpDecision,
  logoutFilter,
  logoutOptions,
  markReviewed,
  openTool,
  pin,
  query,
  records,
  reportGenerated,
  reviewed,
  saveSessionNote,
  setActivityFilter,
  setDateFilter,
  setDeviceFilter,
  setLogoutFilter,
  setQuery,
  setSelectedSessionId,
}) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const loggedOutCount = records.filter((record) => /normal logout/i.test(record.logoutStatus)).length;
  const timeoutCount = records.filter((record) => /timeout/i.test(record.logoutStatus)).length;
  const profileActivityCount = records.filter((record) => record.hasProfileActivity).length;
  const moneyMovementCount = records.filter((record) => record.hasMoneyActivity).length;
  const uniqueDevices = new Set(records.map((record) => record.deviceId ?? record.device)).size;
  const uniqueIps = new Set(records.map((record) => record.ip)).size;
  const quickLogoutFilters = logoutOptions.slice(0, 4);

  function clearFilters() {
    setQuery('');
    setLogoutFilter('All logout states');
    setActivityFilter('All activity');
    setDeviceFilter('All devices');
    setDateFilter('All dates');
  }

  return (
    <section className="mobile-access-reference-page mobile-session-reference" data-mobile-session-reference="true">
      <MobileAccessHeader
        title="Session History"
        subtitle="Review recorded user sessions and actions."
        icon="session"
      />

      <MobileAccessSearch
        ariaLabel="Search Session History records"
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((current) => !current)}
        placeholder="Search sessions, IP, device, browser..."
        query={query}
        resultCount={filteredRecords.length}
        setQuery={setQuery}
        totalCount={records.length}
      />

      <nav className="mobile-access-quick-filters" aria-label="Quick Session History logout filters">
        {quickLogoutFilters.map((item) => (
          <button
            key={item}
            type="button"
            className={logoutFilter === item ? 'active' : ''}
            aria-pressed={logoutFilter === item}
            onClick={() => setLogoutFilter(item)}
          >
            {item === 'All logout states' ? 'All' : item.replace(' recorded', '')}
            <span>{item === 'All logout states' ? records.length : records.filter((record) => record.logoutStatus === item).length}</span>
          </button>
        ))}
      </nav>

      {filtersOpen && (
        <section className="access-history-filters session-history-filters mobile-access-filter-panel" aria-label="Filter Session History">
          <label><span>Logout state</span><select value={logoutFilter} onChange={(event) => setLogoutFilter(event.target.value)} aria-label="Filter Session History by logout state">{logoutOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Activity</span><select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)} aria-label="Filter Session History by activity">{activityOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Device</span><select value={deviceFilter} onChange={(event) => setDeviceFilter(event.target.value)} aria-label="Filter Session History by device">{deviceOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Date</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter Session History by date">{dateOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <button type="button" onClick={clearFilters}>Clear filters</button>
        </section>
      )}

      <MobileAccessSummary
        className="session-history-summary mobile-access-summary"
        label="Session history summary"
        items={[
          ['Recorded sessions', records.length],
          ['Normal logout', loggedOutCount],
          ['Session timeout', timeoutCount],
          ['Profile activity', profileActivityCount],
          ['Money activity', moneyMovementCount],
          ['Devices / IPs', `${uniqueDevices} / ${uniqueIps}`],
        ]}
      />

      {records.length ? (
        <>
          <section className="session-record-list mobile-session-timeline" aria-label="Session history records">
            {filteredRecords.map((record) => (
              <button
                key={record.session}
                type="button"
                className={record.session === activeRecord.session ? 'active' : ''}
                aria-pressed={record.session === activeRecord.session}
                onClick={() => setSelectedSessionId(record.session)}
                data-session-history-record={record.session}
              >
                <span className="mobile-session-timeline-dot" data-tone={sessionTone(record.logoutStatus)} />
                <span className="mobile-session-record-copy">
                  <span><strong>{record.date}</strong><em data-tone={sessionTone(record.logoutStatus)}>{record.logoutStatus}</em></span>
                  <h3>{accessClock(record.start)} to {accessClock(record.end)}<small>{record.duration}</small></h3>
                  <p><span><AccessGlyph type="device" size={14} /> {record.browserSource ?? record.device}</span><span><AccessGlyph type="network" size={14} /> {record.ip}</span></p>
                  <p><span><AccessGlyph type="device" size={14} /> {record.operatingSystem ? `${record.operatingSystem} · ` : ''}{record.deviceId ?? record.device}</span></p>
                  <small>Actions: {listText(record.activityTypes)}</small>
                  <small>IP location: {record.location}</small>
                  <span className="mobile-access-record-chips">
                    <i>{record.id}</i>
                    <i>{record.session}</i>
                  </span>
                  <span className="mobile-session-view-detail">View details <AccessGlyph type="chevron" size={15} /></span>
                </span>
              </button>
            ))}
            {!filteredRecords.length && <div className="investigation-tool-empty" role="status">No recorded sessions match this search.</div>}
          </section>

          {activeRecord && (
            <>
              <section className="session-detail-panel mobile-access-detail-panel" aria-label="Expanded session history detail">
                <header>
                  <div><p>Session detail</p><h3>{activeRecord.session}</h3><span>{activeRecord.start} to {activeRecord.end} · {activeRecord.logoutStatus}</span></div>
                  <button type="button" onClick={() => pin(activeRecord.session)}><AccessGlyph type="pin" size={17} /> Pin session</button>
                </header>
                <dl className="session-detail-grid mobile-access-detail-grid">
                  {[
                    ['Login ID', activeRecord.id],
                    ['Session start', activeRecord.start],
                    ['Session end', activeRecord.end],
                    ['Duration', activeRecord.duration],
                    ['Logout / timeout', activeRecord.logoutStatus],
                    ['Authentication method', activeRecord.method],
                    ['Device ID', activeRecord.deviceId ?? activeRecord.device],
                    ['IP / location', `${activeRecord.ip} · ${activeRecord.location}`],
                  ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                </dl>
                <section className="session-activity-grid mobile-session-activity-grid" aria-label="Session activity detail">
                  {[
                    ['Pages viewed', activeRecord.pagesViewed],
                    ['Security settings', activeRecord.securitySettings],
                    ['Profile actions', activeRecord.profileActions],
                    ['Payee / token activity', activeRecord.payeeTokenActivity],
                    ['Transfer / purchase path', activeRecord.moneyMovement],
                  ].map(([label, items]) => <article key={label}><span>{label}</span><strong>{listText(items)}</strong></article>)}
                </section>
              </section>

              <section className="session-history-lower-grid mobile-access-lower-grid" aria-label="Session history sequence and related evidence">
                <article className="session-path-panel mobile-session-path-panel">
                  <header><p>Session path</p><h3>Recorded order of activity</h3></header>
                  <ol>{activeRecord.sessionPath.map((item) => <li key={item}><i /><span>{item}</span></li>)}</ol>
                </article>
                <article className="session-related-panel mobile-access-related-panel">
                  <header><p>Related records</p><h3>Evidence to cross-reference</h3></header>
                  <div>{activeRecord.relatedRecords.map((item) => <span key={item}>{item}</span>)}</div>
                </article>
                <article className="session-notes-panel mobile-access-notes-panel">
                  <header><p>Investigator notes</p><h3>Evidence-first reminder</h3></header>
                  <p>{activeRecord.investigatorUse} Read the session path with Login History, Customer 360, financial records, and Timeline before documenting a decision.</p>
                  <div>
                    <button type="button" onClick={() => saveSessionNote(`${activeRecord.session} reviewed: ${activeRecord.sessionPath.join(' / ')}`)}><AccessGlyph type="note" size={17} /> Save session note</button>
                    <button type="button" onClick={generateSessionReport}><AccessGlyph type="report" size={17} /> {reportGenerated ? 'Regenerate Session History Report' : 'Generate Session History Report'}</button>
                  </div>
                </article>
              </section>
            </>
          )}
        </>
      ) : <div className="investigation-tool-empty" role="status">No session history records are available for this case.</div>}

      <nav className="investigation-tool-next-routes mobile-access-routes" aria-label="Session history next routes">
        <button type="button" onClick={() => openTool('Login History')}>Open Login History</button>
        <button type="button" onClick={() => openTool('Customer 360')}>Open Customer 360</button>
        {activeCase.availableTools?.includes('Transaction History') && <button type="button" onClick={() => openTool('Transaction History')}>Open Transaction History</button>}
        {activeCase.availableTools?.includes('Payment Verification') && <button type="button" onClick={() => openTool('Payment Verification')}>Open Payment Verification</button>}
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
        <button type="button" className="primary" onClick={jumpDecision}>Continue to decision</button>
      </nav>

      <footer className="investigation-tool-review-bar mobile-access-review-bar">
        <div><strong>Session History review</strong><span>Completion records that the session path and linked evidence were checked. It does not determine the case.</span></div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Session History')}>
          {reviewed ? '✓ Session History reviewed' : 'Mark Session History reviewed'}
        </button>
      </footer>
    </section>
  );
}
