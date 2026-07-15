import { useEffect, useState } from 'react';
import useResponsiveLayoutMode from './useResponsiveLayoutMode.js';

const reducedMotionKey = 'fraud-academy-reduced-motion-v1';
const layoutModes = ['auto', 'mobile', 'desktop'];

function readReducedMotion() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(reducedMotionKey) === 'true';
  } catch {
    return false;
  }
}

export default function VisualShellHeader({ activeCase, cases, changeCase, onNavigate }) {
  const [activeControl, setActiveControl] = useState('');
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion);
  const {
    preference: layoutPreference,
    detectedLayout,
    resolvedLayout,
    setPreference: setLayoutPreference,
  } = useResponsiveLayoutMode();

  useEffect(() => {
    document.body.dataset.visualMotion = reducedMotion ? 'reduced' : 'standard';
    try {
      window.localStorage.setItem(reducedMotionKey, String(reducedMotion));
    } catch {
      // Keep the setting functional for the current session when storage is unavailable.
    }
  }, [reducedMotion]);

  function toggleControl(control) {
    setActiveControl((current) => (current === control ? '' : control));
  }

  function navigate(tab) {
    onNavigate?.(tab);
    setActiveControl('');
  }

  return (
    <>
      <header className="visual-hero">
        <div className="hero-cat left">🐈‍⬛</div>
        <div className="hero-bat">🦇</div>
        <div className="hero-title-wrap"><div className="hero-jewel">💜</div><h1>Fraud Academy OS</h1><span>v1.0</span></div>
        <div className="workspace-shell-heading">
          <span className="workspace-shell-mark" aria-hidden="true">FA</span>
          <div>
            <p>Investigation Workspace</p>
            <h1>Fraud Academy OS</h1>
            <span>Evidence First · Active case {activeCase.id}</span>
          </div>
        </div>
        <div className="hero-cat right">🦇</div>
        <nav className="visual-header-controls" aria-label="Application controls">
          <button type="button" className={activeControl === 'help' ? 'active' : ''} aria-label="Open Help" aria-expanded={activeControl === 'help'} aria-controls="visual-header-control-panel" onClick={() => toggleControl('help')}><span aria-hidden="true">?</span><strong>Help</strong></button>
          <button type="button" className={activeControl === 'settings' ? 'active' : ''} aria-label="Open Settings" aria-expanded={activeControl === 'settings'} aria-controls="visual-header-control-panel" onClick={() => toggleControl('settings')}><span aria-hidden="true">⚙</span><strong>Settings</strong></button>
          <button type="button" aria-label="Open Agent profile" onClick={() => navigate('profile')}><span className="agent-avatar" aria-hidden="true">LA</span><strong>Agent</strong></button>
        </nav>
      </header>

      {activeControl && (
        <section id="visual-header-control-panel" className="ornate-card visual-header-control-panel" data-header-panel={activeControl} aria-live="polite">
          <button type="button" className="header-panel-close" aria-label="Close header panel" onClick={() => setActiveControl('')}>×</button>
          {activeControl === 'help' && (
            <>
              <div className="header-control-heading"><span aria-hidden="true">?</span><div><p>Help</p><h2>Evidence First guide</h2></div></div>
              <p>Review records, expand details, search related objects, connect evidence, document the case, and submit only after the checklist is complete.</p>
              <div className="nav-action-row"><button type="button" onClick={() => navigate('academy')}>Open Academy</button><button type="button" onClick={() => navigate('cases')}>Open Case Queue</button></div>
            </>
          )}
          {activeControl === 'settings' && (
            <>
              <div className="header-control-heading"><span aria-hidden="true">⚙</span><div><p>Settings</p><h2>Workspace preferences</h2></div></div>
              <div className="header-setting-row layout-setting-row">
                <span className="layout-setting-copy">
                  <strong>Layout mode</strong>
                  <small>Detected {detectedLayout}; using {resolvedLayout} layout.</small>
                </span>
                <div className="layout-mode-control" role="group" aria-label="Layout mode">
                  {layoutModes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={layoutPreference === mode ? 'active' : ''}
                      aria-pressed={layoutPreference === mode}
                      onClick={() => setLayoutPreference(mode)}
                    >
                      {mode[0].toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <label className="header-setting-row"><span><strong>Reduce motion</strong><small>Use immediate scrolling and limit interface animation.</small></span><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /></label>
            </>
          )}
        </section>
      )}

      <section className="case-info-bar visual-case-strip">
        <div><span>▣</span><strong>Case</strong><em>{activeCase.id}</em></div>
        <div><span>♟</span><strong>Claim Type:</strong><em>{activeCase.type}</em></div>
        <div><span>◈</span><strong>Status:</strong><em>{activeCase.status}</em></div>
        <label className="visual-case-switcher"><span>Case Queue</span><select value={activeCase.id} onChange={(event) => changeCase(event.target.value)}>{cases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.person}</option>)}</select></label>
      </section>
    </>
  );
}
