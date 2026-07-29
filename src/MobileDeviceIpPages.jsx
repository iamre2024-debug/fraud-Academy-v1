function IntelligenceGlyph({ type, size = 20 }) {
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

  if (type === 'shield') return <svg {...common}><path d="M12 2.5 20 6v5.5c0 4.8-3 8.1-8 10-5-1.9-8-5.2-8-10V6z" /><path d="m8.7 12 2.2 2.2 4.6-4.7" /></svg>;
  if (type === 'device') return <svg {...common}><rect x="6" y="2.5" width="12" height="19" rx="2.3" /><path d="M10 5h4M10.5 18.5h3" /></svg>;
  if (type === 'desktop') return <svg {...common}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 21h8M12 16v5" /></svg>;
  if (type === 'browser') return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 8h18M7 6h.01M10 6h.01" /></svg>;
  if (type === 'fingerprint') return <svg {...common}><path d="M7 9a5 5 0 0 1 10 0c0 5-1 9-3 12M9 13c0 3-.5 5.5-1.5 7M12 6.5A2.5 2.5 0 0 1 14.5 9c0 4.5-.6 7.8-1.8 10M5 12.5V9a7 7 0 0 1 14 0v3.5" /></svg>;
  if (type === 'calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></svg>;
  if (type === 'clock') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>;
  if (type === 'sessions') return <svg {...common}><circle cx="8" cy="8" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M2.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M13.5 15c3.6-.7 6.1.9 7 4" /></svg>;
  if (type === 'network') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.4 2.6 3.5 5.6 3.5 9S14.4 18.4 12 21c-2.4-2.6-3.5-5.6-3.5-9S9.6 5.6 12 3Z" /></svg>;
  if (type === 'location') return <svg {...common}><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg>;
  if (type === 'provider') return <svg {...common}><path d="M4 20V8l8-5 8 5v12M8 20v-7h8v7M2 20h20" /></svg>;
  if (type === 'route') return <svg {...common}><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M7.5 16.5 16.5 7.5M8 6h5M6 8V3" /></svg>;
  if (type === 'search') return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>;
  if (type === 'pin') return <svg {...common}><path d="M9 3h6l.8 5 2.2 2v2H6v-2l2.2-2zM12 12v9" /></svg>;
  if (type === 'note') return <svg {...common}><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" /></svg>;
  if (type === 'report') return <svg {...common}><path d="M5 3h10l4 4v14H5zM15 3v5h4M8 12h8M8 16h8" /></svg>;
  if (type === 'chevron') return <svg {...common}><path d="m9 5 7 7-7 7" /></svg>;
  if (type === 'copy') return <svg {...common}><rect x="8" y="8" width="11" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>;
}

function LunaBadge() {
  return (
    <aside className="mobile-intel-luna" aria-label="Luna debrief is available after submission">
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r="33" fill="#061d4d" stroke="#42d5ff" strokeWidth="2" />
        <path d="m18 25 5-14 11 10h4l11-10 5 15c5 8 4 20-2 27-8 9-26 9-34-1-6-7-6-19 0-27Z" fill="#f5fbff" />
        <path d="m23 13 7 10-10 4m29-14-7 10 10 4" fill="#f3a6cf" opacity=".72" />
        <ellipse cx="29" cy="35" rx="3.2" ry="4.3" fill="#173b70" />
        <ellipse cx="43" cy="35" rx="3.2" ry="4.3" fill="#173b70" />
        <circle cx="28" cy="33.5" r=".9" fill="#fff" />
        <circle cx="42" cy="33.5" r=".9" fill="#fff" />
        <path d="m36 40-3.2 2.1L36 44l3.2-1.9Z" fill="#d56d9f" />
        <path d="M27 47c3.7 4.1 14.3 4.1 18 0" fill="none" stroke="#31517a" strokeWidth="2" strokeLinecap="round" />
        <path d="M25 55c6-4 16-4 22 0l-2 10H27Z" fill="#07377c" />
        <path d="m36 54 2.6 3.8L36 60l-2.6-2.2Z" fill="#55dfff" />
      </svg>
      <span><strong>Luna ☾</strong><small>Debrief after submit</small></span>
    </aside>
  );
}

function IntelligenceHeader({ icon, subtitle, title }) {
  return (
    <header className="mobile-intel-header">
      <span className="mobile-intel-title-icon"><IntelligenceGlyph type={icon} size={25} /></span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <span className="mobile-intel-evidence-chip">Evidence First</span>
    </header>
  );
}

function IntelligenceSearch({ ariaLabel, children, onChange, onKeyDown, placeholder, query }) {
  return (
    <label className="mobile-intel-search">
      <IntelligenceGlyph type="search" size={20} />
      <span className="sr-only">{ariaLabel}</span>
      <input
        value={query}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {children}
    </label>
  );
}

function FactRow({ icon, label, value }) {
  return (
    <div className="mobile-intel-fact-row">
      <span><IntelligenceGlyph type={icon} size={19} /></span>
      <dt>{label}</dt>
      <dd>{value || 'Not recorded'}</dd>
    </div>
  );
}

function DeviceArtwork({ desktop = false }) {
  return (
    <span className="mobile-device-art" data-device-art={desktop ? 'desktop' : 'mobile'} aria-hidden="true">
      <IntelligenceGlyph type={desktop ? 'desktop' : 'device'} size={33} />
      <i /><i /><i />
    </span>
  );
}

function recordDeviceStatus(activeRecord, lookupHasRun) {
  if (!lookupHasRun) return 'Lookup required';
  return activeRecord?.trustedStatus || 'Status not recorded';
}

export function MobileDeviceIntelligencePage({
  activeRecord,
  filteredRecords,
  jumpDecision,
  lookupHasRun,
  lookupMatched,
  markReviewed,
  openTool,
  pin,
  query,
  quickPin,
  records,
  reviewed,
  saveDeviceNote,
  setQuery,
  setSelectedDeviceId,
}) {
  const visibleRecords = lookupHasRun ? filteredRecords : records;
  const revealed = lookupHasRun && activeRecord;

  return (
    <section className="mobile-device-ip-reference mobile-device-reference" data-mobile-device-reference="true">
      <section className="mobile-intel-search-shell" aria-label="Device Intelligence lookup">
        <IntelligenceSearch
          ariaLabel="Search Device Intelligence records"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Device ID, fingerprint, browser..."
          query={query}
        >
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear Device Intelligence search">×</button>}
        </IntelligenceSearch>
        <small aria-live="polite">
          {lookupHasRun
            ? filteredRecords.length
              ? `${filteredRecords.length} of ${records.length} records returned`
              : 'No matching device record returned'
            : 'Lookup required'}
        </small>
      </section>

      {activeRecord ? (
        <>
          <section className="device-intel-snapshot mobile-device-primary" aria-label="Device intelligence snapshot">
            <header>
              <div>
                <p>Primary device <span aria-hidden="true">✦</span></p>
                <h3>{activeRecord.deviceName}</h3>
                <span>{activeRecord.operatingSystem}</span>
                <em>{recordDeviceStatus(activeRecord, lookupHasRun)}</em>
              </div>
              <DeviceArtwork desktop={/desktop/i.test(activeRecord.deviceType)} />
              <LunaBadge />
            </header>
            <p className="mobile-intel-lookup-note">
              {revealed
                ? activeRecord.lookupResult
                : 'Run a device lookup to reveal recorded status, fingerprint, and comparison details.'}
            </p>
          </section>

          <section className="device-detail-panel mobile-device-facts" aria-label="Expanded device intelligence detail">
            <header>
              <div><p>Device record</p><h3>{activeRecord.id}</h3><span>{activeRecord.deviceType}</span></div>
              <nav aria-label="Device record actions">
                <button type="button" onClick={() => pin(activeRecord.id)}><IntelligenceGlyph type="pin" size={17} /> Pin Device ID</button>
                <button type="button" onClick={() => quickPin({ label: 'Device ID', value: activeRecord.id, sourceTool: 'Device Intelligence', sourceRecordId: activeRecord.id })}><IntelligenceGlyph type="note" size={17} /> Quick Pad Device ID</button>
              </nav>
            </header>
            <dl className="device-detail-grid mobile-intel-fact-list">
              <FactRow icon="device" label="Device ID" value={activeRecord.id} />
              <FactRow icon="desktop" label="Device type" value={activeRecord.deviceType} />
              <FactRow icon="browser" label="Operating system" value={activeRecord.operatingSystem} />
              <FactRow icon="browser" label="Browser" value={activeRecord.browser} />
              <FactRow icon="calendar" label="First seen" value={activeRecord.firstSeen} />
              <FactRow icon="clock" label="Last seen" value={activeRecord.lastSeen} />
              <FactRow icon="sessions" label="Linked sessions" value={`${activeRecord.history?.length ?? 0} recorded event${activeRecord.history?.length === 1 ? '' : 's'}`} />
              <FactRow icon="shield" label="Recorded device status" value={recordDeviceStatus(activeRecord, lookupHasRun)} />
            </dl>

            {revealed ? (
              <section className="mobile-device-lookup-details" aria-label="Device lookup details">
                <article><span>Device fingerprint</span><strong>{activeRecord.deviceFingerprint}</strong></article>
                <article><span>Browser fingerprint</span><strong>{activeRecord.browserFingerprint}</strong></article>
                <article><span>Rooted / jailbroken</span><strong>{activeRecord.rootedJailbroken}</strong></article>
                <article><span>Emulator indicator</span><strong>{activeRecord.emulatorIndicator}</strong></article>
                <article><span>VPN / proxy indicator</span><strong>{activeRecord.vpnProxyIndicator}</strong></article>
                <article><span>Shared-device detection</span><strong>{activeRecord.sharedDeviceDetection}</strong></article>
                <article><span>Linked profiles</span><strong>{activeRecord.linkedProfiles?.join(' · ') || 'No linked profile recorded'}</strong></article>
                <article><span>Wallet usage</span><strong>{activeRecord.walletUsage}</strong></article>
              </section>
            ) : (
              <div className="mobile-intel-protected-detail" role="status">
                <IntelligenceGlyph type="fingerprint" size={22} />
                <span><strong>Lookup details protected</strong><small>Search a Device ID, fingerprint, browser, session, profile, wallet, or location.</small></span>
              </div>
            )}
          </section>

          <details className="mobile-intel-more-panel">
            <summary>
              <span><strong>Device history and evidence actions</strong><small>{visibleRecords.length} device record{visibleRecords.length === 1 ? '' : 's'} · {activeRecord.history?.length ?? 0} recorded events</small></span>
              <IntelligenceGlyph type="chevron" size={18} />
            </summary>
            <div>
              <section className="device-record-list mobile-device-records" aria-label="Device intelligence records">
                <header><div><p>Available device records</p><h3>Choose a device to compare</h3></div><span>{visibleRecords.length}</span></header>
                {visibleRecords.map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    className={record.id === activeRecord.id ? 'active' : ''}
                    aria-pressed={record.id === activeRecord.id}
                    onClick={() => setSelectedDeviceId(record.id)}
                    data-device-intelligence-record={record.id}
                  >
                    <DeviceArtwork desktop={/desktop/i.test(record.deviceType)} />
                    <span><strong>{record.deviceName}</strong><small>{record.id}</small><small>{record.deviceType}</small></span>
                    <em>{lookupHasRun ? record.lookupResult : 'Lookup needed'}</em>
                    <IntelligenceGlyph type="chevron" size={17} />
                  </button>
                ))}
                {lookupHasRun && !filteredRecords.length && (
                  <div className="investigation-tool-empty" role="status">No device intelligence records match this lookup.</div>
                )}
              </section>

              <section className="device-history-panel mobile-device-history" aria-label="Device change and usage history">
                <header><div><p>Device history</p><h3>Complete recorded event log</h3></div><span>{activeRecord.history?.length ?? 0}</span></header>
                <div className="device-history-list">
                  {(activeRecord.history ?? []).map((item, index) => (
                    <article key={`${activeRecord.id}-${item}`}>
                      <DeviceArtwork desktop={/desktop/i.test(activeRecord.deviceType)} />
                      <span><strong>{index === 0 ? 'Most recent device event' : 'Prior device event'}</strong><small>{item}</small></span>
                    </article>
                  ))}
                </div>
              </section>

              {revealed && (
                <section className="device-behavior-panel mobile-device-comparison" aria-label="Normal behavior comparison">
                  <header><p>Recorded comparison</p><h3>Use with related evidence</h3></header>
                  <article><span>Normal behavior comparison</span><strong>{activeRecord.normalBehavior}</strong></article>
                  <article><span>Investigator use</span><strong>{activeRecord.investigatorUse}</strong></article>
                </section>
              )}

              <section className="device-related-panel mobile-intel-related" aria-label="Device related records">
                <header><p>Related records</p><h3>Cross-reference points</h3></header>
                <div>{(activeRecord.relatedRecords ?? []).map((item) => <span key={item}>{item}</span>)}</div>
              </section>

              <section className="device-notes-panel mobile-intel-notes">
                <header><p>Investigator notes</p><h3>Save factual observations</h3></header>
                <p>Compare the device with Login History, Session History, IP Intelligence, and the customer story before deciding.</p>
                <button type="button" onClick={() => saveDeviceNote(`${activeRecord.id} reviewed: ${activeRecord.normalBehavior}`)}><IntelligenceGlyph type="note" size={18} /> Save device note</button>
              </section>

              <nav className="investigation-tool-next-routes mobile-intel-routes" aria-label="Device intelligence next routes">
                <button type="button" onClick={() => openTool('Login History')}>Open Login History</button>
                <button type="button" onClick={() => openTool('IP Intelligence')}>Open IP Intelligence</button>
                <button type="button" className="primary" onClick={jumpDecision}>Open Submit Decision</button>
              </nav>

            </div>
          </details>

        </>
      ) : (
        <div className="investigation-tool-empty mobile-intel-no-match" role="status">
          <IntelligenceGlyph type="search" size={24} />
          <strong>No device intelligence records match this lookup.</strong>
          <span>Check the Device ID, fingerprint, browser, session, profile, wallet, or location and try again.</span>
        </div>
      )}

      <footer className="investigation-tool-review-bar mobile-intel-review">
        <div><strong>Device Intelligence review</strong><span>Review the lookup, full event log, and linked evidence before marking complete.</span></div>
        <button
          type="button"
          className={reviewed ? '' : 'investigation-tool-primary'}
          disabled={!reviewed && !lookupMatched}
          onClick={() => markReviewed('Device Intelligence')}
        >
          {reviewed ? '✓ Device Intelligence reviewed' : 'Mark Device Intelligence reviewed'}
        </button>
      </footer>

    </section>
  );
}

function IpGlobe() {
  return (
    <figure className="mobile-ip-globe" aria-hidden="true">
      <span><IntelligenceGlyph type="location" size={25} /></span>
      <i /><i /><i /><i />
    </figure>
  );
}

export function MobileIPIntelligencePage({
  activeCase,
  activeRecord,
  deviceCount,
  generateIpReport,
  jumpDecision,
  lookupHasRun,
  lookupMatched,
  markReviewed,
  openTool,
  pin,
  query,
  records,
  reportGenerated,
  runIpLookup,
  saveIpNote,
  selectIpRecord,
  sessionCount,
  setQuery,
  submittedIp,
  reviewed,
}) {
  const relatedLoginCount = records.reduce((count, record) => count + record.observedLogins.length, 0);

  return (
    <section className="mobile-device-ip-reference mobile-ip-reference" data-mobile-ip-reference="true">
      <section className="mobile-intel-search-shell mobile-ip-search-shell" aria-label="Find IP intelligence information">
        <IntelligenceSearch
          ariaLabel="Search IP Intelligence records"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') runIpLookup(); }}
          placeholder="Enter an exact fictional IP address"
          query={query}
        />
        <button type="button" className="ip-lookup-action" onClick={runIpLookup} disabled={!query.trim()}>Run IP Lookup</button>
        <small aria-live="polite">{lookupMatched ? 'Lookup complete' : lookupHasRun ? 'No exact IP match' : 'Lookup required'}</small>
      </section>

      <section className="ip-intel-summary mobile-ip-summary" aria-label="IP intelligence summary">
        {[
          ['Raw IP records', records.length],
          ['Linked sessions', sessionCount],
          ['Observed devices', deviceCount],
          ['Lookup state', lookupMatched ? 'Complete' : lookupHasRun ? 'No match' : 'Required'],
          ['Related logins', relatedLoginCount],
          ['Active case', activeCase.id],
        ].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>

      <section className="ip-detail-panel mobile-ip-detail" aria-label="Expanded IP intelligence detail">
        {activeRecord ? (
          <>
            <header className="mobile-ip-hero">
              <div>
                <p>IP address</p>
                <h3>{activeRecord.ip}</h3>
                <span>{activeRecord.lookupResult}</span>
                <em>Exact lookup complete</em>
              </div>
              <IpGlobe />
            </header>

            <nav className="mobile-ip-detail-actions" aria-label="IP record actions">
              <button type="button" onClick={() => pin(activeRecord.ip)}><IntelligenceGlyph type="pin" size={17} /> Pin IP address</button>
              <button type="button" onClick={() => window.navigator.clipboard?.writeText(activeRecord.ip)}><IntelligenceGlyph type="copy" size={17} /> Copy IP</button>
            </nav>

            <dl className="ip-detail-grid mobile-intel-fact-list">
              <FactRow icon="provider" label="ASN / provider" value={activeRecord.isp} />
              <FactRow icon="location" label="Approx. location" value={`${activeRecord.city}, ${activeRecord.country}`} />
              <FactRow icon="network" label="Network type" value={activeRecord.networkType} />
              <FactRow icon="shield" label="VPN / proxy / TOR" value={activeRecord.vpnProxyTor} />
              <FactRow icon="calendar" label="First seen" value={activeRecord.firstSeen} />
              <FactRow icon="clock" label="Last seen" value={activeRecord.lastSeen} />
              <FactRow icon="sessions" label="Associated sessions" value={activeRecord.observedSessions.join(' · ') || 'No authenticated session recorded'} />
              <FactRow icon="route" label="Distance / velocity facts" value={activeRecord.velocity} />
              <FactRow icon="network" label="Cross-profile presence" value={activeRecord.crossCasePresence} />
            </dl>
          </>
        ) : (
          <div className="investigation-tool-empty ip-lookup-empty" role="status">
            <IpGlobe />
            <span>{lookupHasRun ? 'No exact match' : 'Lookup required'}</span>
            <h3>{lookupHasRun ? `No network record matched ${submittedIp}.` : 'Run an exact IP lookup to reveal network facts.'}</h3>
            <p>Provider, approximate location, network type, VPN/proxy/TOR facts, usage history, and linked sessions remain hidden until the exact fictional IP lookup succeeds.</p>
          </div>
        )}
      </section>

      {activeRecord && (
        <details className="mobile-intel-more-panel">
          <summary>
            <span><strong>Usage history and evidence actions</strong><small>{activeRecord.observedLoginEvents.length} authentication event{activeRecord.observedLoginEvents.length === 1 ? '' : 's'} · {activeRecord.observedDevices.length} device{activeRecord.observedDevices.length === 1 ? '' : 's'}</small></span>
            <IntelligenceGlyph type="chevron" size={18} />
          </summary>
          <div>
            <section className="ip-location-panel mobile-ip-usage" aria-label="IP usage history">
              <header><div><p>Usage history</p><h3>Complete recorded authentication log</h3></div><span>{activeRecord.observedLoginEvents.length}</span></header>
              <div>
                {activeRecord.observedLoginEvents.map((login) => (
                  <article key={login.id} data-ip-usage-event={login.id}>
                    <span><IntelligenceGlyph type="clock" size={18} /></span>
                    <div><strong>{login.time}</strong><small>{login.id} · {login.result}</small><small>{login.session} · {login.device}</small><small>{login.location}</small></div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mobile-ip-observations" aria-label="Recorded network observations">
              <header><p>Network observations</p><h3>Facts to compare</h3></header>
              <article><span>Residential status</span><strong>{activeRecord.residentialStatus}</strong></article>
              <article><span>Historical locations</span><strong>{activeRecord.historicalLocations.join(' · ')}</strong></article>
              <article><span>Observed devices</span><strong>{activeRecord.observedDevices.join(' · ') || 'No device returned'}</strong></article>
            </section>

            <section className="ip-related-panel mobile-intel-related" aria-label="IP related records">
              <header><p>Related records</p><h3>Cross-reference points</h3></header>
              <div>{activeRecord.relatedRecords.map((item) => <span key={item}>{item}</span>)}</div>
            </section>

            <section className="ip-notes-panel mobile-intel-notes">
              <header><p>Investigator notes</p><h3>Save factual observations</h3></header>
              <p>{activeRecord.investigatorUse}</p>
              <div>
                <button type="button" onClick={() => saveIpNote(`${activeRecord.ip} reviewed: ${activeRecord.lookupResult}`)}><IntelligenceGlyph type="note" size={18} /> Save IP note</button>
                <button type="button" onClick={generateIpReport}><IntelligenceGlyph type="report" size={18} /> {reportGenerated ? 'Regenerate IP Intelligence Report' : 'Generate IP Intelligence Report'}</button>
              </div>
            </section>

            <nav className="investigation-tool-next-routes mobile-intel-routes" aria-label="IP intelligence next routes">
              <button type="button" onClick={() => openTool('Login History')}>Open Login History</button>
              <button type="button" onClick={() => openTool('Session History')}>Open Session History</button>
              <button type="button" onClick={() => openTool('Device Intelligence')}>Open Device Intelligence</button>
              <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
              <button type="button" className="primary" onClick={jumpDecision}>Open Submit Decision</button>
            </nav>

            <footer className="investigation-tool-review-bar mobile-intel-review">
              <div><strong>IP Intelligence review</strong><span>Run the exact lookup and compare its complete usage history with the linked device and session records.</span></div>
              <button
                type="button"
                className={reviewed ? '' : 'investigation-tool-primary'}
                disabled={!lookupMatched}
                onClick={() => markReviewed('IP Intelligence')}
              >
                {reviewed ? '✓ IP Intelligence reviewed' : 'Mark IP Intelligence reviewed'}
              </button>
            </footer>
          </div>
        </details>
      )}
    </section>
  );
}
