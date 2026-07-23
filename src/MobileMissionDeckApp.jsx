import { useEffect, useMemo, useState } from 'react';
import AcademyProgressPanel from './AcademyProgressPanel.jsx';
import AcademyThemeV1Panel from './AcademyThemeV1Panel.jsx';
import CasesThemeV1Panel from './CasesThemeV1Panel.jsx';
import ProfileThemeV1Panel from './ProfileThemeV1Panel.jsx';

const reducedMotionKey = 'fraud-academy-reduced-motion-v1';

const storageKeys = {
  completed: 'fraud-academy-completed-tools-v1',
  notes: 'fraud-academy-notes-v1',
  packages: 'fraud-academy-review-packages-v1',
};

const routes = [
  { key: 'dashboard', icon: '🧭', label: 'Home' },
  { key: 'cases', icon: '🗂️', label: 'Cases' },
  { key: 'workspace', icon: '🛰️', label: 'Mission' },
  { key: 'academy', icon: '🌙', label: 'Academy' },
  { key: 'profile', icon: '🐈‍⬛', label: 'Agent' },
];

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function countCaseValues(data) {
  return Object.values(data).reduce((total, items) => total + (Array.isArray(items) ? items.length : 0), 0);
}

function readSnapshot() {
  const completedByCase = readJson(storageKeys.completed, {});
  const notesByCase = readJson(storageKeys.notes, {});
  const packagesByCase = readJson(storageKeys.packages, {});
  return {
    completedByCase,
    notesByCase,
    packagesByCase,
    reviewed: countCaseValues(completedByCase),
    notes: countCaseValues(notesByCase),
    packages: countCaseValues(packagesByCase),
  };
}

function readReducedMotion() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(reducedMotionKey) === 'true';
  } catch {
    return false;
  }
}

export default function MobileMissionDeckApp({
  activeTab,
  activeCase,
  activeCaseId,
  cases,
  claimTypes,
  layoutController,
  luna,
  onGenerateCases,
  onNavigate,
  onOpenCase,
  quickGenerator,
  workspace,
}) {
  const [control, setControl] = useState('');
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion);
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const snapshot = useMemo(readSnapshot, [activeTab, snapshotVersion]);

  useEffect(() => {
    const refresh = () => setSnapshotVersion((current) => current + 1);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('fraud-academy:package-saved', refresh);
    window.addEventListener('fraud-academy:packages-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('fraud-academy:package-saved', refresh);
      window.removeEventListener('fraud-academy:packages-updated', refresh);
    };
  }, []);

  useEffect(() => {
    document.body.dataset.visualMotion = reducedMotion ? 'reduced' : 'standard';
    try {
      window.localStorage.setItem(reducedMotionKey, String(reducedMotion));
    } catch {
      // The current session still honors the setting when storage is unavailable.
    }
  }, [reducedMotion]);

  function navigate(tab) {
    setControl('');
    onNavigate(tab);
    window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 0);
  }

  return (
    <div className="mission-mobile-root" data-mobile-mission-tab={activeTab}>
      <MissionAtmosphere />
      <header className="mission-mobile-header">
        <button type="button" className="mission-mobile-brand" aria-label="Open dashboard" onClick={() => navigate('dashboard')}>
          <span aria-hidden="true">🛡️</span>
          <span><strong>Fraud Academy</strong><small>Mission Deck</small></span>
        </button>
        <button type="button" className="mission-mobile-case-chip" onClick={() => navigate('workspace')}>
          <span>Active mission</span><strong>{activeCase?.id}</strong>
        </button>
        <div className="mission-mobile-header-actions">
          <button type="button" aria-label="Open Help" aria-expanded={control === 'help'} onClick={() => setControl((current) => current === 'help' ? '' : 'help')}>❔</button>
          <button type="button" aria-label="Open Settings" aria-expanded={control === 'settings'} onClick={() => setControl((current) => current === 'settings' ? '' : 'settings')}>⚙️</button>
        </div>
      </header>

      {control && (
        <section className="mission-mobile-control-sheet" aria-live="polite" data-control={control}>
          <button type="button" className="mission-sheet-close" aria-label="Close" onClick={() => setControl('')}>×</button>
          {control === 'help' ? (
            <>
              <span className="mission-sheet-icon" aria-hidden="true">🧩</span>
              <p>Evidence First guide</p>
              <h2>Follow the mission trail</h2>
              <ol>
                <li>Read the case briefing.</li>
                <li>Open only the records you need.</li>
                <li>Pin evidence and save notes.</li>
                <li>Submit your decision to unlock Luna.</li>
              </ol>
              <div><button type="button" onClick={() => navigate('academy')}>Open Academy</button><button type="button" onClick={() => navigate('cases')}>Case Queue</button></div>
            </>
          ) : (
            <>
              <span className="mission-sheet-icon" aria-hidden="true">🎛️</span>
              <p>Display settings</p>
              <h2>Mission controls</h2>
              <label className="mission-setting-row">
                <span><strong>Layout</strong><small>Detected {layoutController.detectedLayout}; using {layoutController.resolvedLayout}.</small></span>
                <select value={layoutController.preference} onChange={(event) => layoutController.setPreference(event.target.value)} aria-label="Layout mode">
                  <option value="auto">Auto</option>
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                </select>
              </label>
              <label className="mission-setting-row">
                <span><strong>Reduce motion</strong><small>Use immediate page changes and quieter animation.</small></span>
                <input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} />
              </label>
            </>
          )}
        </section>
      )}

      <div className="mission-mobile-viewport">
        <section className="mission-mobile-page" hidden={activeTab !== 'dashboard'} data-mission-page="dashboard">
          {activeTab === 'dashboard' && (
            <MissionDashboard
              activeCase={activeCase}
              cases={cases}
              onNavigate={navigate}
              onOpenCase={onOpenCase}
              quickGenerator={quickGenerator}
              snapshot={snapshot}
            />
          )}
        </section>

        <section className="mission-mobile-page" hidden={activeTab !== 'cases'} data-mission-page="cases">
          <CasesThemeV1Panel
            active={activeTab === 'cases'}
            activeCaseId={activeCaseId}
            cases={cases}
            claimTypes={claimTypes}
            inline
            onGenerateCases={onGenerateCases}
            onOpenCase={onOpenCase}
          />
        </section>

        <section className="mission-mobile-page mission-mobile-workspace-page" hidden={activeTab !== 'workspace'} data-mission-page="workspace">
          {workspace}
        </section>

        <section className="mission-mobile-page" hidden={activeTab !== 'academy'} data-mission-page="academy">
          {activeTab === 'academy' && <MissionPageHeading icon="🌙" eyebrow="Learning constellation" title="Luna Academy" text="Build evidence-first judgment one mission at a time." />}
          {activeTab === 'academy' && <AcademyThemeV1Panel onNavigate={navigate} />}
        </section>

        <section className="mission-mobile-page" hidden={activeTab !== 'progress'} data-mission-page="progress">
          {activeTab === 'progress' && <MissionPageHeading icon="🏅" eyebrow="Saved fieldwork" title="Mission Progress" text="Packages and debrief access reflect work you actually completed." />}
          {activeTab === 'progress' && <AcademyProgressPanel cases={cases} packagesByCase={snapshot.packagesByCase} onOpenCase={onOpenCase} />}
        </section>

        <section className="mission-mobile-page" hidden={activeTab !== 'profile'} data-mission-page="profile">
          {activeTab === 'profile' && <MissionPageHeading icon="🐈‍⬛" eyebrow="Investigator profile" title="Agent Command File" text="Track skills, badges, goals, and active-case progress." />}
          {activeTab === 'profile' && (
            <ProfileThemeV1Panel
              activeCaseId={activeCaseId}
              cases={cases}
              snapshot={snapshot}
              onNavigate={navigate}
              onOpenCase={onOpenCase}
            />
          )}
        </section>
      </div>

      <nav className="mission-mobile-dock" aria-label="Mission navigation">
        {routes.map((route) => (
          <button
            key={route.key}
            type="button"
            className={activeTab === route.key ? 'active' : ''}
            aria-current={activeTab === route.key ? 'page' : undefined}
            onClick={() => navigate(route.key)}
          >
            <span aria-hidden="true">{route.icon}</span><small>{route.label}</small>
          </button>
        ))}
      </nav>
      {luna}
    </div>
  );
}

function MissionPageHeading({ icon, eyebrow, title, text }) {
  return (
    <header className="mission-page-heading">
      <span aria-hidden="true">{icon}</span>
      <div><p>{eyebrow}</p><h1>{title}</h1><small>{text}</small></div>
    </header>
  );
}

function MissionAtmosphere() {
  return (
    <div className="mission-mobile-atmosphere" aria-hidden="true">
      <span /><span /><span /><span /><span /><span />
      <i /><i /><b />
    </div>
  );
}

function MissionDashboard({ activeCase, cases, onNavigate, onOpenCase, quickGenerator, snapshot }) {
  const queuedCases = cases.filter((item) => item.id !== activeCase?.id).slice(0, 3);
  const reviewed = snapshot.completedByCase[activeCase?.id]?.length ?? 0;
  const notes = snapshot.notesByCase[activeCase?.id]?.length ?? 0;
  const packages = snapshot.packagesByCase[activeCase?.id]?.length ?? 0;
  const progress = Math.min(100, 12 + reviewed * 4 + notes * 4 + packages * 20);

  return (
    <div className="mission-dashboard-v3">
      <section className="mission-dashboard-intro">
        <div><span>🌌 Mission Control</span><h1>Good evening, Agent</h1><p>Your active investigation is waiting in the field deck.</p></div>
        <button type="button" onClick={() => onNavigate('profile')}><span>🐈‍⬛</span><small>Luna</small></button>
      </section>

      <section className="mission-case-deck" aria-label="Layered active case deck">
        {queuedCases.map((item, index) => (
          <button key={item.id} type="button" className={`mission-case-layer layer-${index + 1}`} onClick={() => onOpenCase(item.id)}>
            <span>{item.id}</span><small>{item.priority} · {item.type}</small>
          </button>
        ))}
        <article className="mission-active-file">
          <MissionLighthouse />
          <div className="mission-active-file-copy">
            <span className="mission-live-chip">● ACTIVE CASE</span>
            <h2>{activeCase.id}</h2>
            <p>{activeCase.type}</p>
            <dl>
              <div><dt>👤 Customer</dt><dd>{activeCase.person}</dd></div>
              <div><dt>💵 Exposure</dt><dd>{activeCase.amount}</dd></div>
              <div><dt>📍 Lane</dt><dd>{activeCase.lane ?? 'Investigation'}</dd></div>
            </dl>
            <div className="mission-progress-line"><span style={{ width: `${progress}%` }} /><strong>{progress}%</strong></div>
            <button type="button" onClick={() => onOpenCase(activeCase.id)}>Enter mission workspace <span>→</span></button>
          </div>
          <b className="mission-file-ribbon">UNDER INVESTIGATION</b>
        </article>
      </section>

      <section className="mission-command-drawers" aria-label="Mission shortcuts">
        <button type="button" onClick={() => onNavigate('cases')}><span>🗂️</span><strong>Case Queue</strong><small>{cases.length} files ready</small></button>
        <button type="button" onClick={() => onNavigate('workspace')}><span>🧬</span><strong>Evidence Map</strong><small>{reviewed} tools reviewed</small></button>
        <button type="button" onClick={() => onNavigate('progress')}><span>🏅</span><strong>Progress</strong><small>{snapshot.packages} saved packages</small></button>
      </section>

      <section className="mission-dashboard-generator">
        <header><span>✨</span><div><p>Scenario forge</p><h2>Generate a new case</h2></div></header>
        {quickGenerator}
      </section>

      <aside className="mission-luna-signal">
        <span aria-hidden="true">🌙</span>
        <div><strong>Luna signal is protected</strong><p>Manager coaching appears only after you submit the decision package.</p></div>
      </aside>
    </div>
  );
}

function MissionLighthouse() {
  return (
    <svg className="mission-lighthouse" viewBox="0 0 360 300" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="mission-v3-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#123f75" />
          <stop offset="0.55" stopColor="#061b37" />
          <stop offset="1" stopColor="#020915" />
        </linearGradient>
        <linearGradient id="mission-v3-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bff7ff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#bff7ff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#bff7ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="360" height="300" rx="24" fill="url(#mission-v3-sky)" />
      <g fill="#91efff"><circle cx="34" cy="40" r="2" /><circle cx="91" cy="76" r="1.5" /><circle cx="285" cy="35" r="1.5" /><circle cx="327" cy="92" r="2" /><circle cx="188" cy="55" r="1" /></g>
      <path d="M185 137 L355 86 L355 125 L187 151 Z" fill="url(#mission-v3-beam)" />
      <path d="M0 251 C68 218 129 245 183 226 C238 207 302 218 360 192 L360 300 L0 300 Z" fill="#03101f" />
      <path d="M224 250 L242 132 L273 132 L294 250 Z" fill="#d2edf5" />
      <rect x="239" y="111" width="38" height="23" rx="3" fill="#d8f9ff" stroke="#62deff" strokeWidth="3" />
      <path d="M236 111 L258 92 L281 111 Z" fill="#102c4b" stroke="#62deff" strokeWidth="3" />
      <rect x="253" y="79" width="11" height="14" fill="#8defff" />
      <path d="M0 272 C71 255 116 281 177 263 C244 243 299 275 360 249" fill="none" stroke="#35d8ff" strokeOpacity="0.6" strokeWidth="3" />
    </svg>
  );
}
