import { useEffect, useState } from 'react';
import { getDeviceProfiles } from '../data/deviceRecords.js';
import { statusTone } from './shared.jsx';

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


export default function DeviceIntelligenceWorkspace({
  activeCase,
  query,
  setQuery,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
  quickPin,
}) {
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const records = getDeviceProfiles(activeCase);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRecords = records.filter((record) => !normalizedQuery || deviceRecordSearchText(record).includes(normalizedQuery));
  const lookupHasRun = normalizedQuery.length > 0;
  const activeRecord = filteredRecords.find((record) => record.id === selectedDeviceId)
    ?? filteredRecords[0]
    ?? (lookupHasRun ? null : records[0]);
  const lookupMatched = lookupHasRun && Boolean(activeRecord);

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
        <span aria-live="polite">
          {lookupHasRun
            ? filteredRecords.length
              ? `${filteredRecords.length} of ${records.length} records returned`
              : 'No matching device record returned'
            : 'Lookup required'}
        </span>
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
                <button type="button" onClick={() => quickPin({ label: 'Device ID', value: activeRecord.id, sourceTool: 'Device Intelligence', sourceRecordId: activeRecord.id })}>Quick Pad Device ID</button>
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
        <div className="investigation-tool-empty" role="status">
          {lookupHasRun && records.length
            ? 'No device intelligence records match this lookup. Check the Device ID, fingerprint, browser, session, profile, wallet, or location and try again.'
            : 'No device intelligence records are available for this case.'}
        </div>
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
        <button
          type="button"
          className={reviewed ? '' : 'investigation-tool-primary'}
          disabled={!reviewed && !lookupMatched}
          onClick={() => markReviewed('Device Intelligence')}
        >
          {reviewed ? '✓ Device Intelligence reviewed' : 'Mark Device Intelligence reviewed'}
        </button>
      </footer>
    </>
  );
}

const documentRequestStatuses = ['All', 'Not Requested', 'Requested', 'Received', 'Incomplete', 'Received Late', 'No Response', 'Pending Review', 'Approved', 'Rejected', 'Expired', 'Missing', 'Exception Approved'];

