import { useEffect, useMemo, useState } from 'react';
import AcademyProgressPanel from './AcademyProgressPanel.jsx';
import AcademyThemeV1Panel from './AcademyThemeV1Panel.jsx';
import CasesThemeV1Panel from './CasesThemeV1Panel.jsx';
import LunaApiAccessSetting from './LunaApiAccessSetting.jsx';
import CloudSyncControl from './CloudSyncControl.jsx';
import MobileLunaPortrait, { MobileFraudShield } from './MobileLunaPortrait.jsx';
import ProfileThemeV1Panel from './ProfileThemeV1Panel.jsx';

const reducedMotionKey = 'fraud-academy-reduced-motion-v1';
const openMobileSettingsEvent = 'fraud-academy:open-mobile-settings';

const storageKeys = {
  completed: 'fraud-academy-completed-tools-v1',
  notes: 'fraud-academy-notes-v1',
  packages: 'fraud-academy-review-packages-v1',
};

const routes = [
  { key: 'dashboard', icon: '⌂', label: 'Home', matches: ['dashboard'] },
  { key: 'cases', icon: '▣', label: 'Cases', matches: ['cases'] },
  { key: 'workspace', icon: '⊞', label: 'Workspace', matches: ['workspace'] },
  { key: 'academy', icon: '◇', label: 'Academy', matches: ['academy', 'progress'] },
  { key: 'profile', icon: '☾', label: 'Agent', matches: ['profile'] },
  { key: 'quotes', icon: '❝', label: 'Quotes' },
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
    const openSettings = () => setControl('settings');
    window.addEventListener(openMobileSettingsEvent, openSettings);
    return () => window.removeEventListener(openMobileSettingsEvent, openSettings);
  }, []);

  useEffect(() => {
    document.body.dataset.visualMotion = reducedMotion ? 'reduced' : 'standard';
    try {
      window.localStorage.setItem(reducedMotionKey, String(reducedMotion));
    } catch {
      // The current session still honors the setting when storage is unavailable.
    }
  }, [reducedMotion]);

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
    <div className="mission-mobile-root" data-mobile-mission-tab={activeTab} data-mobile-reference-shell="v2">
      <MissionAtmosphere />
      {activeTab !== 'workspace' && <header className="mission-mobile-header">
        <button type="button" className="mission-mobile-brand" aria-label="Open dashboard" onClick={() => navigate('dashboard')}>
          <MobileFraudShield size={38} />
          <span><strong>Fraud Academy <i>v1</i></strong><small>Investigate. Learn. Prevent.</small></span>
        </button>
        {activeTab !== 'dashboard' && <button type="button" className="mission-mobile-case-chip" onClick={() => navigate('workspace', 'briefing')}>
          <span>Active case</span><strong>{activeCase?.id}</strong>
        </button>}
        <div className="mission-mobile-header-actions">
          <button
            type="button"
            className={activeTab === 'dashboard' ? 'mission-mobile-notification' : ''}
            aria-label="Open display settings"
            aria-expanded={Boolean(control)}
            onClick={() => setControl((current) => current ? '' : 'settings')}
          >
            {activeTab === 'dashboard' ? <><span aria-hidden="true">♢</span><i /></> : '•••'}
          </button>
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

        <section className="mission-mobile-page" hidden={activeTab !== 'quotes'} data-mission-page="quotes">
          {activeTab === 'quotes' && <MissionQuotesPage onNavigate={navigate} />}
        </section>
      </div>

      <nav className="mission-mobile-dock" aria-label="Mission navigation">
        {routes.map((route) => {
          const isActive = (route.matches ?? [route.key]).includes(activeTab);
          return (
          <button
            key={route.key}
            type="button"
            className={isActive ? 'active' : ''}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => navigate(route.key)}
          >
            <span aria-hidden="true">{route.icon}</span><small>{route.label}</small>
          </button>
          );
        })}
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
  // Legacy smoke marker: mobile-dashboard-active-file. The v2 board folds that route into the compact dashboard hierarchy.
  const requiredTools = activeCase?.requiredTools?.length ?? 0;
  const reviewedRequired = (snapshot.completedByCase[activeCase?.id] ?? [])
    .filter((item) => activeCase?.requiredTools?.includes(item)).length;
  const workspaceProgress = requiredTools ? Math.round((reviewedRequired / requiredTools) * 100) : 0;
  const openCases = cases.filter((item) => !/closed|complete/i.test(item.status ?? '')).length;
  const caseAlerts = Array.isArray(activeCase?.alerts)
    ? activeCase.alerts
    : Array.isArray(activeCase?.caseBriefing?.alerts)
      ? activeCase.caseBriefing.alerts
      : [];

  return (
    <div className="mobile-reference-dashboard">
      <section className="mobile-dashboard-greeting">
        <span className="mobile-dashboard-bow" aria-hidden="true">୨୧</span>
        <div>
          <h1 aria-label="Good morning Ree, let’s stop fraud ✨">Good morning Ree —<br />let’s stop fraud ✨</h1>
          <p><span aria-hidden="true">♥</span> Every case you solve makes a safer world.</p>
        </div>
        <button type="button" onClick={() => onNavigate('profile')} aria-label="Open Luna agent panel">
          <MobileLunaPortrait size={88} />
          <span><strong>Luna ✨</strong><small>Your AI Assistant</small></span>
        </button>
      </section>

      <section className="mobile-dashboard-grid" aria-label="Fraud Academy dashboard">
        <button type="button" className="mobile-dashboard-card mobile-dashboard-active-case" onClick={() => onOpenCase(activeCase.id)}>
          <span>▣ Active Cases</span><strong>{openCases}</strong><small>Open {activeCase.id}</small><em>›</em>
        </button>
        <button type="button" className="mobile-dashboard-card mobile-dashboard-alerts" onClick={() => onOpenCase(activeCase.id)}>
          <span>△ Alerts</span><strong>{caseAlerts.length || '—'}</strong><small>{caseAlerts.length ? `${caseAlerts.length} saved case alert${caseAlerts.length === 1 ? '' : 's'}` : 'Open the briefing for case facts'}</small><em>›</em>
        </button>
        <button type="button" className="mobile-dashboard-card mobile-dashboard-workspace" onClick={() => onNavigate('workspace', 'tool-menu')}>
          <span>Workspace Progress</span>
          <strong className="mobile-dashboard-ring" style={{ '--dashboard-progress': `${workspaceProgress * 3.6}deg` }}>{workspaceProgress}%</strong>
          <small>{reviewedRequired} of {requiredTools} required tools reviewed</small>
          <em>›</em>
        </button>
      </section>

      <section className="mobile-dashboard-academy-panel">
        <button type="button" onClick={() => onNavigate('academy')} aria-label="Open Academy">
          <span className="mobile-dashboard-level">✦</span>
          <span>
            <small>Academy Progress</small>
            <strong>{snapshot.packages} completed package{snapshot.packages === 1 ? '' : 's'}</strong>
            <i><b style={{ width: `${Math.min(100, cases.length ? (snapshot.packages / cases.length) * 100 : 0)}%` }} /></i>
          </span>
          <em>›</em>
        </button>
        <dl>
          <div><dt>Reviewed</dt><dd>{snapshot.reviewed}</dd></div>
          <div><dt>Notes</dt><dd>{snapshot.notes}</dd></div>
          <div><dt>Packages</dt><dd>{snapshot.packages}</dd></div>
        </dl>
      </section>

      <section className="mobile-dashboard-panels">
        <button type="button" className="mobile-dashboard-agent" onClick={() => onNavigate('profile')}>
          <span><small>Agent Panel</small><strong>Luna <i>Online</i></strong><p>I’m here to help organize case facts and evidence.</p></span>
          <MobileLunaPortrait size={74} />
        </button>
        <button type="button" className="mobile-dashboard-quote" onClick={() => onNavigate('quotes')}>
          <span>❝</span><small className="mobile-dashboard-quote-label">Quotes</small><strong>Fraud is clever,<br />but so are we.</strong><small>Every careful step builds a stronger case.</small>
        </button>
      </section>

      <details className="mobile-dashboard-generator">
        <summary><span>✦</span><div><small>Scenario generator</small><strong>Create another fictional case</strong></div><b>＋</b></summary>
        {quickGenerator}
      </details>
    </div>
  );
}

function MissionQuotesPage({ onNavigate }) {
  return (
    <div className="mobile-quotes-page">
      <header><span>✦ Fraud Academy</span><h1>Words for careful investigators</h1><p>Cute encouragement, professional judgment, and no case answers.</p></header>
      <article><i>❝</i><blockquote>Evidence before assumptions. Facts before findings.</blockquote><span>Today’s investigator reminder</span></article>
      <article><i>♡</i><blockquote>A strong decision explains what the records prove—and what they do not.</blockquote><span>Luna’s notebook</span></article>
      <article><i>✦</i><blockquote>Slow down at the right moment. One verified link can change the whole timeline.</blockquote><span>Fraud Academy</span></article>
      <button type="button" onClick={() => onNavigate('workspace', 'briefing')}>Return to active case</button>
    </div>
  );
}
