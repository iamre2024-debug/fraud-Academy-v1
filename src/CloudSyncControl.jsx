import { useEffect, useMemo, useState } from 'react';
import {
  cloudSyncEvents,
  getCloudSyncKey,
  getCloudSyncState,
  initializeCloudSync,
  setCloudSyncKey,
  syncNow,
  validateCloudSyncKey,
} from './data/cloudSyncClient.js';

const statusLabels = {
  starting: 'Starting',
  pending: 'Waiting to sync',
  syncing: 'Syncing',
  synced: 'Cloud current',
  offline: 'Saved offline',
  'local-only': 'Local recovery',
  error: 'Sync paused',
};

function maskedRecoveryCode(value) {
  if (!value) return 'Not created';
  return `•••• •••• •••• ${value.slice(-6)}`;
}

export default function CloudSyncControl({ variant = 'desktop' }) {
  const [syncState, setSyncState] = useState(getCloudSyncState);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [message, setMessage] = useState('');
  const [showCode, setShowCode] = useState(false);
  const currentCode = getCloudSyncKey();
  const visibleCode = useMemo(
    () => (showCode ? currentCode : maskedRecoveryCode(currentCode)),
    [currentCode, showCode, syncState],
  );

  useEffect(() => {
    initializeCloudSync();
    const refresh = (event) => setSyncState(event.detail ?? getCloudSyncState());
    window.addEventListener(cloudSyncEvents.status, refresh);
    return () => window.removeEventListener(cloudSyncEvents.status, refresh);
  }, []);

  async function copyRecoveryCode() {
    try {
      await navigator.clipboard.writeText(getCloudSyncKey());
      setMessage('Recovery code copied. Keep it private.');
    } catch {
      setShowCode(true);
      setMessage('Copy the recovery code shown here and keep it private.');
    }
  }

  async function connectRecoveryCode(event) {
    event.preventDefault();
    const validation = validateCloudSyncKey(recoveryCode);
    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }
    setMessage('Connecting this device…');
    await setCloudSyncKey(validation.value);
    setRecoveryCode('');
    setSyncState(getCloudSyncState());
    setMessage('This device now uses that recovery code.');
  }

  async function handleSyncNow() {
    setMessage('Checking cloud recovery…');
    await syncNow({ force: true });
    setSyncState(getCloudSyncState());
    setMessage('');
  }

  const statusLabel = statusLabels[syncState.status] ?? 'Local recovery';
  const lastSynced = syncState.lastSyncedAt
    ? new Date(syncState.lastSyncedAt).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not synced yet';

  return (
    <section
      className={`cloud-sync-control cloud-sync-control-${variant}`}
      data-cloud-sync-status={syncState.status}
      aria-label="Cloud save and recovery"
    >
      <div className="cloud-sync-heading">
        <span aria-hidden="true">☁</span>
        <div>
          <strong>Cloud save</strong>
          <small>{statusLabel} · {lastSynced}</small>
        </div>
        <i aria-hidden="true" />
      </div>
      <p>{syncState.message}</p>
      <div className="cloud-recovery-code">
        <span><small>Private recovery code</small><code>{visibleCode}</code></span>
        <button type="button" onClick={() => setShowCode((current) => !current)}>{showCode ? 'Hide' : 'Show'}</button>
        <button type="button" onClick={copyRecoveryCode}>Copy</button>
      </div>
      <div className="cloud-sync-actions">
        <button type="button" onClick={handleSyncNow} disabled={syncState.status === 'syncing'}>
          {syncState.status === 'syncing' ? 'Syncing…' : 'Sync now'}
        </button>
      </div>
      <form onSubmit={connectRecoveryCode}>
        <label>
          <span>Restore on another device</span>
          <input
            type="password"
            autoComplete="off"
            value={recoveryCode}
            onChange={(event) => setRecoveryCode(event.target.value)}
            placeholder="Paste your recovery code"
          />
        </label>
        <button type="submit">Use code</button>
      </form>
      {message && <small className="cloud-sync-message" role="status">{message}</small>}
    </section>
  );
}
