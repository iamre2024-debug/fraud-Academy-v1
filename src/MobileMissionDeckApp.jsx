import { useEffect, useMemo, useState } from 'react';
import AcademyProgressPanel from './AcademyProgressPanel.jsx';
import AcademyThemeV1Panel from './AcademyThemeV1Panel.jsx';
import LunaApiAccessSetting from './LunaApiAccessSetting.jsx';
import CloudSyncControl from './CloudSyncControl.jsx';
import { LunaMascot } from './DecisionReviewVisuals.jsx';
import MobileCaseQueue from './MobileCaseQueue.jsx';
import ProfileThemeV1Panel from './ProfileThemeV1Panel.jsx';
import { publicCaseTaxonomy } from './data/publicCaseView.js';

const reducedMotionKey = 'fraud-academy-reduced-motion-v1';

const storageKeys = {
  completed: 'fraud-academy-completed-tools-v1',
  notes: 'fraud-academy-notes-v1',
  packages: 'fraud-academy-review-packages-v1',
};

const routes = [
  { key: 'dashboard', icon: '⌂', label: 'Home' },
  { key: 'cases', icon: '▣', label: 'Cases' },
  { key: 'workspace', icon: '⊞', label: 'Workspace' },
  { key: 'academy', icon: '◇', label: 'Academy' },
  { key: 'profile', icon: '☾', label: 'Agent' },
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
  onOpenWorkspace,
  quickGenerator,
  workspace,
  workspaceScreen,
}) {
  const [control, setControl] = useState('');
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion);
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const snapshot = useMemo(readSnapshot, [activeTab, snapshotVersion]);
  const focusedReviewScreen = activeTab === 'workspace'
    && ['indicators', 'determination', 'submit', 'debrief'].includes(workspaceScreen);

  useEffect(() => {
    const refresh = () => setSnapshotVersion((current) => current + 1);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('fraud-academy:package-saved', refresh);
    window.addEventListener('fraud-academy:packages-updated', refresh);
    window.addEventListener('fraud-academy:cloud-hydrated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('fraud-academy:package-saved', refresh);
      window.removeEventListener('fraud-academy:packages-updated', refresh);
      window.removeEventListener('fraud-academy:cloud-hydrated', refresh);
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

  useEffect(() => {
    if (focusedReviewScreen) setControl('');
  }, [focusedReviewScreen]);

  function navigate(tab, nextWorkspaceScreen = 'briefing') {
    setControl('');
    if (tab === 'workspace' && onOpenWorkspace) {
      onOpenWorkspace(nextWorkspaceScreen);
    } else {
      onNavigate(tab);
    }
    window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 0);
  }

  return (
    <div className="mission-mobile-root" data-mobile-mission-tab={activeTab} data-mobile-reference-shell="integrated">
      <MissionAtmosphere />
      {activeTab !== 'workspace' && <header className="mission-mobile-header">
        <button type="button" className="mission-mobile-brand" aria-label="Open dashboard" onClick={() => navigate('dashboard')}>
          <MobileShellShield />
          <span><strong>Fraud Academy <i>v1</i></strong><small>Investigate. Learn. Prevent.</small></span>
        </button>
        <div className="mission-mobile-header-actions mobile-shell-header-actions">
          <button type="button" className="mobile-shell-luna-button" aria-label="Open Agent profile" onClick={() => navigate('profile')}>
            <LunaMascot title="Luna, Fraud Academy guide" />
          </button>
          <button type="button" aria-label="Open Settings" aria-expanded={control === 'settings'} onClick={() => setControl((current) => current === 'settings' ? '' : 'settings')}>⚙️</button>
        </div>
      </header>}

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
              <CloudSyncControl variant="mobile" />
              <LunaApiAccessSetting variant="mobile" />
              <button type="button" onClick={() => setControl('help')}>Open Evidence First guide</button>
            </>
          )}
        </section>
      )}

      <div className="mission-mobile-viewport" data-focused-review={focusedReviewScreen ? 'true' : 'false'}>
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
          {activeTab === 'cases' && <MobileCaseQueue
            activeCaseId={activeCaseId}
            cases={cases}
            claimTypes={claimTypes}
            completedByCase={snapshot.completedByCase}
            onGenerateCases={onGenerateCases}
            onOpenCaseBriefing={(caseId) => onOpenCase(caseId, 'briefing')}
            onOpenCaseWorkspace={(caseId) => onOpenCase(caseId, 'tool-menu')}
            packagesByCase={snapshot.packagesByCase}
          />}
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

function MobileShellShield() {
  return (
    <span className="mobile-shell-shield" aria-hidden="true">
      <svg viewBox="0 0 48 56" focusable="false">
        <defs>
          <linearGradient id="mobile-shell-shield-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#75efff" />
            <stop offset=".48" stopColor="#168cff" />
            <stop offset="1" stopColor="#635cff" />
          </linearGradient>
        </defs>
        <path d="M24 3c6.8 4 13.6 5.7 20 6.7v14.7c0 13.8-7.7 23-20 28.8C11.7 47.4 4 38.2 4 24.4V9.7C10.4 8.7 17.2 7 24 3Z" fill="#071a3b" stroke="url(#mobile-shell-shield-gradient)" strokeWidth="3" />
        <path d="m24 14 2.8 8.1 8.2 2.8-8.2 2.9L24 36l-2.8-8.2-8.2-2.9 8.2-2.8Z" fill="#ff9edc" />
      </svg>
    </span>
  );
}

function MissionDashboard({ activeCase, cases, onNavigate, onOpenCase, quickGenerator, snapshot }) {
  const reviewed = snapshot.completedByCase[activeCase?.id]?.length ?? 0;
  const notes = snapshot.notesByCase[activeCase?.id]?.length ?? 0;
  const packages = snapshot.packagesByCase[activeCase?.id]?.length ?? 0;
  const progress = Math.min(100, 12 + reviewed * 4 + notes * 4 + packages * 20);

  return (
    <div className="mission-dashboard-v3 sky-dashboard" data-dashboard-theme="sky">
      <section className="mission-dashboard-intro">
        <span className="sky-dashboard-charm sky-dashboard-bow" aria-hidden="true">🎀</span>
        <span className="sky-dashboard-shimmer sky-dashboard-shimmer-one" aria-hidden="true">✦</span>
        <span className="sky-dashboard-shimmer sky-dashboard-shimmer-two" aria-hidden="true">✧</span>
        <div><span>Evidence First workspace</span><h1>Welcome back, Ree ✨</h1><p><b aria-hidden="true">♥</b> Every case you solve makes a safer world.</p></div>
        <button type="button" className="sky-luna-launcher" onClick={() => onNavigate('profile')}>
          <span className="sky-luna-orb"><img src="/assets/luna-sky-plush-v1.webp" alt="Luna, Fraud Academy guide" /></span>
          <small>Luna <i aria-hidden="true">✦</i></small>
        </button>
      </section>

      <section className="mission-dashboard-metrics" aria-label="Fraud Academy workspace metrics">
        <button type="button" onClick={() => onNavigate('cases')}>
          <span aria-hidden="true">▣</span><strong>{cases.length}</strong><small>Active cases</small><em>Open queue</em><i aria-hidden="true">✦</i>
        </button>
        <button type="button" onClick={() => onNavigate('workspace', 'tool-menu')}>
          <span aria-hidden="true">✓</span><strong>{reviewed}</strong><small>Tools reviewed</small><em>Current case</em><i aria-hidden="true">♥</i>
        </button>
        <button type="button" onClick={() => onNavigate('progress')}>
          <span aria-hidden="true">◇</span><strong>{snapshot.packages}</strong><small>Saved packages</small><em>View progress</em><i aria-hidden="true">✧</i>
        </button>
      </section>

      <section className="mission-dashboard-fieldwork" aria-label="Active case fieldwork progress">
        <header><span aria-hidden="true">✦</span><div><p>Active case progress</p><h2>{activeCase.id}</h2></div><strong>{progress}%</strong></header>
        <div className="mission-dashboard-progress-track"><span style={{ width: `${progress}%` }} /></div>
        <dl>
          <div><dt>Reviewed tools</dt><dd>{reviewed}</dd></div>
          <div><dt>Case notes</dt><dd>{notes}</dd></div>
          <div><dt>Decision packages</dt><dd>{packages}</dd></div>
        </dl>
      </section>

      <article className="mission-dashboard-active-case">
        <header>
          <span aria-hidden="true">✧</span>
          <div><p>Active case</p><h2>{activeCase.id}</h2><small>{activeCase.status}</small></div>
        </header>
        <p>{publicCaseTaxonomy(activeCase).workflowType}</p>
        <dl>
          <div><dt>Customer</dt><dd>{activeCase.person}</dd></div>
          <div><dt>Amount / exposure</dt><dd>{activeCase.amount}</dd></div>
          <div><dt>Product</dt><dd>{publicCaseTaxonomy(activeCase).productType}</dd></div>
        </dl>
        <button type="button" className="sky-primary-button" onClick={() => onOpenCase(activeCase.id)}>Open workspace <span>→</span></button>
      </article>

      <section className="mission-command-drawers" aria-label="Mission shortcuts">
        <button type="button" onClick={() => onNavigate('cases')}><span>▣</span><strong>Case Queue</strong><small>Choose a fictional training file</small></button>
        <button type="button" onClick={() => onNavigate('workspace', 'tool-menu')}><span>⊞</span><strong>Evidence Map</strong><small>Open available investigation tools</small></button>
      </section>

      <aside className="mission-luna-signal">
        <span className="sky-luna-signal-art"><img src="/assets/luna-sky-plush-v1.webp" alt="" /></span>
        <div><strong>Luna debrief is protected</strong><p>Coaching and case conclusions appear only after the decision package is submitted.</p></div>
      </aside>

      <details className="mission-dashboard-generator">
        <summary><span>＋</span><div><p>Scenario forge</p><h2>Generate a new case</h2></div></summary>
        {quickGenerator}
      </details>
    </div>
  );
}
