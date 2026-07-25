import { useState } from 'react';
import {
  clearLunaApiAccessToken,
  readLunaApiAccessToken,
  saveLunaApiAccessToken,
} from './data/lunaApi.js';

export default function LunaApiAccessSetting({ variant = 'desktop' }) {
  const [accessDraft, setAccessDraft] = useState('');
  const [connected, setConnected] = useState(() => Boolean(readLunaApiAccessToken()));

  function connect(event) {
    event.preventDefault();
    const saved = saveLunaApiAccessToken(accessDraft);
    setConnected(saved);
    if (saved) setAccessDraft('');
  }

  function disconnect() {
    clearLunaApiAccessToken();
    setAccessDraft('');
    setConnected(false);
  }

  return (
    <form className={`luna-api-access-setting ${variant}`} onSubmit={connect}>
      <span>
        <strong>Private Luna coaching</strong>
        <small>
          {connected
            ? 'Saved for this browser session. Luna will use protected API coaching when the token matches the deployment.'
            : 'Optional. Luna uses the safe built-in debrief until a private access token is connected.'}
        </small>
      </span>
      {!connected ? (
        <div>
          <input
            type="password"
            value={accessDraft}
            onChange={(event) => setAccessDraft(event.target.value)}
            placeholder="Private Luna access token"
            aria-label="Private Luna access token"
            autoComplete="off"
          />
          <button type="submit" disabled={!accessDraft.trim()}>Connect</button>
        </div>
      ) : (
        <button type="button" onClick={disconnect}>Disconnect</button>
      )}
    </form>
  );
}
