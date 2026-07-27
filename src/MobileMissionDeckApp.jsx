import { useEffect, useMemo, useState } from 'react';
import AcademyProgressPanel from './AcademyProgressPanel.jsx';
import AcademyThemeV1Panel from './AcademyThemeV1Panel.jsx';
import CasesThemeV1Panel from './CasesThemeV1Panel.jsx';
import LunaApiAccessSetting from './LunaApiAccessSetting.jsx';
import CloudSyncControl from './CloudSyncControl.jsx';
import MobileLunaPortrait from './MobileLunaPortrait.jsx';
import ProfileThemeV1Panel from './ProfileThemeV1Panel.jsx';

const reducedMotionKey = 'fraud-academy-reduced-motion-v1';
const openMobileSettingsEvent = 'fraud-academy:open-mobile-settings';

const storageKeys = {
  completed: 'fraud-academy-completed-tools-v1',
  notes: 'fraud-academy-notes-v1',
  packages: 'fraud-academy-review-packages-v1',
};

const routes = [
  { key: 'dashboard', icon: '⌂', label: 'Home' },
  { key: 'cases', icon: '▤', label: 'Cases' },
  { key: 'workspace', icon: '✦', label: 'Workspace' },
  { key: 'academy', icon: '♢', label: 'Academy' },
  { key: 'profile', icon: '♡', label: 'Agent' },
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
    <div className="mission-mobile-root" data-mobile-mission-tab={activeTab}>
      <MissionAtmosphere />
      {activeTab !== 'workspace' && <header className="mission-mobile-header">
        <button type="button" className="mission-mobile-brand" aria-label="Open dashboard" onClick={() => navigate('dashboard')}>
          <span aria-hidden="true">✦</span>
          <span><strong>Fraud Academy</strong><small>Investigation OS</small></span>
        </button>
        <button type="button" className="mission-mobile-case-chip" onClick={() => navigate('workspace', 'briefing')}>
          <span>Active case</span><strong>{activeCase?.id}</strong>
        </button>
        <div className="mission-mobile-header-actions">
          <button type="button" aria-label="Open menu" aria-expanded={Boolean(control)} onClick={() => setControl((current) => current ? '' : 'settings')}>•••</button>
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
  const reviewed = snapshot.completedByCase[activeCase?.id]?.length ?? 0;
  const notes = snapshot.notesByCase[activeCase?.id]?.length ?? 0;
  const packages = snapshot.packagesByCase[activeCase?.id]?.length ?? 0;
  const requiredTools = activeCase?.requiredTools?.length ?? 0;
  const reviewedRequired = (snapshot.completedByCase[activeCase?.id] ?? [])
    .filter((item) => activeCase?.requiredTools?.includes(item)).length;
  const workspaceProgress = requiredTools ? Math.round((reviewedRequired / requiredTools) * 100) : 0;
  const academyProgress = Math.min(100, snapshot.packages * 10);
  const needsAttention = /high|urgent/i.test(activeCase?.priority ?? '') && !packages;

  return (
    <div className="mobile-reference-dashboard">
      <section className="mobile-dashboard-greeting">
        <div><span>✦ Good morning</span><h1>Good morning Ree, let’s stop fraud ✨</h1><p>One case, one workspace, one evidence-first investigation at a time.</p></div>
        <i aria-hidden="true">୨୧</i>
      </section>

      <button type="button" className="mobile-dashboard-luna" onClick={() => onNavigate('profile')}>
        <MobileLunaPortrait size={76} />
        <span><small>Your investigation assistant</small><strong>Luna</strong><p>Answers stay protected until a decision is submitted.</p></span>
        <b>›</b>
      </button>

      <section className="mobile-dashboard-grid" aria-label="Fraud Academy dashboard">
        <button type="button" className="mobile-dashboard-card mobile-dashboard-active-case" onClick={() => onOpenCase(activeCase.id)}>
          <span>Active cases</span><strong>{cases.length}</strong><small>Open {activeCase.id}</small><em>▤</em>
        </button>
        <button type="button" className="mobile-dashboard-card mobile-dashboard-alerts" onClick={() => onOpenCase(activeCase.id)}>
          <span>Alerts</span><strong>{needsAttention ? '1' : '0'}</strong><small>{needsAttention ? `${activeCase.priority} priority case needs review` : 'No active-case reminder'}</small><em>✦</em>
        </button>
        <button type="button" className="mobile-dashboard-card mobile-dashboard-workspace" onClick={() => onNavigate('workspace', 'tool-menu')}>
          <span>Workspace progress</span><strong>{workspaceProgress}%</strong><small>{reviewedRequired}/{requiredTools} required tools reviewed</small><i><b style={{ width: `${workspaceProgress}%` }} /></i><em>⌁</em>
        </button>
        <button type="button" className="mobile-dashboard-card mobile-dashboard-academy" onClick={() => onNavigate('academy')}>
          <span>Academy progress</span><strong>{academyProgress}%</strong><small>{snapshot.packages} completed case package{snapshot.packages === 1 ? '' : 's'}</small><i><b style={{ width: `${academyProgress}%` }} /></i><em>♢</em>
        </button>
      </section>

      <section className="mobile-dashboard-active-file">
        <header><span>ACTIVE CASE</span><strong>{activeCase.priority}</strong></header>
        <h2>{activeCase.id}</h2><p>{activeCase.type}</p>
        <dl><div><dt>Customer / business</dt><dd>{activeCase.person}</dd></div><div><dt>Review workflow</dt><dd>{activeCase.lane ?? 'Investigation'}</dd></div><div><dt>Reported amount</dt><dd>{activeCase.amount}</dd></div><div><dt>Saved notes</dt><dd>{notes}</dd></div></dl>
        <button type="button" onClick={() => onOpenCase(activeCase.id)}>Open workspace <span>→</span></button>
      </section>

      <section className="mobile-dashboard-panels">
        <button type="button" onClick={() => onNavigate('profile')}><span>♡</span><div><small>Agent panel</small><strong>Ree’s investigator file</strong><p>{reviewed} tools reviewed · {packages} submitted package{packages === 1 ? '' : 's'}</p></div><b>›</b></button>
        <button type="button" onClick={() => onNavigate('quotes')}><span>❝</span><div><small>Quotes panel</small><strong>Evidence before assumptions.</strong><p>Open today’s Fraud Academy encouragement.</p></div><b>›</b></button>
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
