import { useEffect, useMemo, useState } from 'react';
import AcademyProgressPanel from './AcademyProgressPanel.jsx';
import AcademyThemeV1Panel from './AcademyThemeV1Panel.jsx';
import CasesThemeV1Panel from './CasesThemeV1Panel.jsx';
import CloudSyncControl from './CloudSyncControl.jsx';
import LunaApiAccessSetting from './LunaApiAccessSetting.jsx';
import ProfileThemeV1Panel from './ProfileThemeV1Panel.jsx';

const reducedMotionKey = 'fraud-academy-reduced-motion-v1';

const storageKeys = {
  completed: 'fraud-academy-completed-tools-v1',
  notes: 'fraud-academy-notes-v1',
  packages: 'fraud-academy-review-packages-v1',
};

const primaryRoutes = [
  { key: 'dashboard', icon: '⌂', label: 'Home', accessibleLabel: 'Dashboard' },
  { key: 'cases', icon: '▦', label: 'Cases', accessibleLabel: 'Cases' },
  { key: 'workspace', icon: '◈', label: 'Workspace', accessibleLabel: 'Workspace' },
  { key: 'academy', icon: '✦', label: 'Academy', accessibleLabel: 'Academy' },
];

const pageCopy = {
  dashboard: {
    eyebrow: 'Mission overview',
    title: 'Investigator dashboard',
    text: 'Resume your active case, reach every investigation surface, and keep your saved fieldwork in view.',
  },
  cases: {
    eyebrow: 'Training operations',
    title: 'Case Queue',
    text: 'Search, preview, generate, and open fictional cases without losing investigation progress.',
  },
  workspace: {
    eyebrow: 'Active investigation',
    title: 'Evidence workspace',
    text: 'Review records, document evidence, and build a decision package for the active case.',
  },
  academy: {
    eyebrow: 'Learning constellation',
    title: 'Luna Academy',
    text: 'Build evidence-first judgment through focused learning modules and case practice.',
  },
  progress: {
    eyebrow: 'Saved fieldwork',
    title: 'Academy Progress',
    text: 'Review saved packages and the cases where post-submission coaching is available.',
  },
  profile: {
    eyebrow: 'Investigator file',
    title: 'Agent Profile',
    text: 'Track practice activity, skill development, badges, and active-case goals.',
  },
};

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

function getActivityProgress(activeCase, snapshot) {
  if (!activeCase) return 0;
  const reviewed = snapshot.completedByCase[activeCase.id]?.length ?? 0;
  const notes = snapshot.notesByCase[activeCase.id]?.length ?? 0;
  const packages = snapshot.packagesByCase[activeCase.id]?.length ?? 0;
  return Math.min(100, 12 + reviewed * 5 + notes * 4 + packages * 24);
}

function scrollPageTop() {
  window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 0);
}

export default function DesktopMissionControlApp({
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
  onOpenWorkspaceRoute,
  quickGenerator,
  workspaceGenerator,
  workspace,
}) {
  const [control, setControl] = useState('');
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion);
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const snapshot = useMemo(readSnapshot, [activeTab, snapshotVersion]);
  const copy = pageCopy[activeTab] ?? pageCopy.dashboard;

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
      // The current session still honors this preference when storage is unavailable.
    }
  }, [reducedMotion]);

  function navigate(tab) {
    setControl('');
    onNavigate(tab);
    scrollPageTop();
  }

  function openWorkspace(screen, tool = '') {
    setControl('');
    onOpenWorkspaceRoute(screen, tool);
    scrollPageTop();
  }

  return (
    <div className="desktop-mission-control-v2" data-desktop-page={activeTab}>
      <DesktopAtmosphere />

      <aside className="desktop-mission-sidebar">
        <button type="button" className="desktop-mission-brand" aria-label="Open dashboard" onClick={() => navigate('dashboard')}>
          <span className="desktop-brand-mark" aria-hidden="true">FA</span>
          <span><strong>Fraud Academy</strong><small>Mission Control</small></span>
        </button>

        <nav className="desktop-primary-nav visual-react-bottom-nav" aria-label="Main navigation" data-react-navigation="true">
          {primaryRoutes.map((route) => (
            <button
              key={route.key}
              type="button"
              className={activeTab === route.key ? 'active' : ''}
              data-mission-route={route.key}
              aria-label={route.accessibleLabel}
              aria-current={activeTab === route.key ? 'page' : undefined}
              onClick={() => route.key === 'workspace' ? openWorkspace() : navigate(route.key)}
            >
              <span aria-hidden="true">{route.icon}</span>
              <span><strong>{route.label}</strong><small>{route.key === 'workspace' ? activeCase?.id : pageCopy[route.key].eyebrow}</small></span>
            </button>
          ))}
        </nav>

        <section className="desktop-sidebar-case" aria-label="Active case shortcut">
          <span>Active investigation</span>
          <strong>{activeCase?.id ?? 'No active case'}</strong>
          <p>{activeCase ? `${activeCase.type} · ${activeCase.person}` : 'Choose a training case to begin.'}</p>
          <button type="button" onClick={() => openWorkspace('briefing')}>Continue case <span aria-hidden="true">→</span></button>
        </section>

        <div className="desktop-sidebar-secondary">
          <button type="button" className={activeTab === 'progress' ? 'active' : ''} onClick={() => navigate('progress')}>
            <span aria-hidden="true">◎</span><span><strong>Progress</strong><small>{snapshot.packages} saved packages</small></span>
          </button>
          <button type="button" className={activeTab === 'profile' ? 'active' : ''} aria-label="Open Agent profile" onClick={() => navigate('profile')}>
            <span aria-hidden="true">LA</span><span><strong>Agent profile</strong><small>Practice record</small></span>
          </button>
        </div>
      </aside>

      <div className="desktop-mission-main">
        <header className="desktop-mission-topbar">
          <div className="desktop-page-title">
            <p>{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <span>{copy.text}</span>
          </div>
          <div className="desktop-topbar-actions">
            <button type="button" className="desktop-active-case-chip" onClick={() => openWorkspace('briefing')}>
              <span>Active case</span><strong>{activeCase?.id}</strong>
            </button>
            <button type="button" aria-label="Open Help" aria-controls="visual-header-control-panel" aria-expanded={control === 'help'} onClick={() => setControl((current) => current === 'help' ? '' : 'help')}>?</button>
            <button type="button" aria-label="Open Settings" aria-controls="visual-header-control-panel" aria-expanded={control === 'settings'} onClick={() => setControl((current) => current === 'settings' ? '' : 'settings')}>⚙</button>
            <button type="button" className="desktop-agent-button dashboard-agent-mark" aria-label="Open Agent profile" onClick={() => navigate('profile')}>LA</button>
          </div>
        </header>

        {control && (
          <section id="visual-header-control-panel" className="desktop-control-drawer" aria-live="polite" data-control={control}>
            <button type="button" className="desktop-control-close" aria-label="Close header panel" onClick={() => setControl('')}>×</button>
            {control === 'help' ? (
              <>
                <div>
                  <p>Evidence First guide</p>
                  <h2>Build a clear investigation trail</h2>
                  <span>Use only the records you need, document the evidence you relied on, and submit when the package is ready.</span>
                </div>
                <ol>
                  <li><b>01</b><span><strong>Read the briefing</strong><small>Start with the allegation and known facts.</small></span></li>
                  <li><b>02</b><span><strong>Review records</strong><small>Open the tools needed to test the claim.</small></span></li>
                  <li><b>03</b><span><strong>Document evidence</strong><small>Pin useful objects and save concise notes.</small></span></li>
                  <li><b>04</b><span><strong>Submit a decision</strong><small>Luna coaching unlocks only after submission.</small></span></li>
                </ol>
                <div className="desktop-control-actions">
                  <button type="button" onClick={() => navigate('academy')}>Open Academy</button>
                  <button type="button" onClick={() => navigate('cases')}>Open Case Queue</button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p>Mission controls</p>
                  <h2>Display and connected services</h2>
                  <span>Your case work still saves locally first and syncs to the connected cloud account when available.</span>
                </div>
                <div className="desktop-setting-grid">
                  <div className="desktop-setting-row">
                    <span><strong>Layout</strong><small>Detected {layoutController.detectedLayout}; using {layoutController.resolvedLayout}.</small></span>
                    <div className="desktop-layout-mode-control" role="group" aria-label="Layout mode">
                      {['auto', 'mobile', 'desktop'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={layoutController.preference === mode}
                          onClick={() => layoutController.setPreference(mode)}
                        >
                          {mode[0].toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="desktop-setting-row">
                    <span><strong>Reduce motion</strong><small>Use immediate page changes and quieter animation.</small></span>
                    <input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} />
                  </label>
                  <CloudSyncControl variant="desktop" />
                  <LunaApiAccessSetting variant="desktop" />
                </div>
              </>
            )}
          </section>
        )}

        <main className="desktop-mission-content">
          <section className="desktop-page desktop-dashboard-page" hidden={activeTab !== 'dashboard'} data-desktop-surface="dashboard">
            {activeTab === 'dashboard' && (
              <DesktopDashboard
                activeCase={activeCase}
                cases={cases}
                onNavigate={navigate}
                onOpenCase={onOpenCase}
                onOpenWorkspace={openWorkspace}
                quickGenerator={quickGenerator}
                snapshot={snapshot}
              />
            )}
          </section>

          <section className="desktop-page desktop-cases-page" hidden={activeTab !== 'cases'} data-desktop-surface="cases">
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

          <section className="desktop-page desktop-workspace-page" hidden={activeTab !== 'workspace'} data-desktop-surface="workspace">
            <section className="desktop-workspace-generator" aria-label="Scenario generator">
              <header>
                <div><span className="desktop-eyebrow">Scenario lab</span><h2>Generate another training case</h2></div>
                <p>Create and open a fictional case without leaving the investigation workspace.</p>
              </header>
              {workspaceGenerator}
            </section>
            {workspace}
            {luna}
          </section>

          <section className="desktop-page desktop-academy-page" hidden={activeTab !== 'academy'} data-desktop-surface="academy">
            {activeTab === 'academy' && <AcademyThemeV1Panel onNavigate={navigate} />}
          </section>

          <section className="desktop-page desktop-progress-page" hidden={activeTab !== 'progress'} data-desktop-surface="progress">
            {activeTab === 'progress' && (
              <>
                <header className="desktop-section-intro">
                  <span className="desktop-eyebrow">Academy progress</span>
                  <h2>Saved package progress</h2>
                  <p>Review submitted training packages and reopen the cases with completed debriefs.</p>
                </header>
                <AcademyProgressPanel cases={cases} packagesByCase={snapshot.packagesByCase} onOpenCase={onOpenCase} />
              </>
            )}
          </section>

          <section className="desktop-page desktop-profile-page" hidden={activeTab !== 'profile'} data-desktop-surface="profile">
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
        </main>
      </div>
    </div>
  );
}

function DesktopDashboard({
  activeCase,
  cases,
  onNavigate,
  onOpenCase,
  onOpenWorkspace,
  quickGenerator,
  snapshot,
}) {
  const queuedCases = cases.filter((item) => item.id !== activeCase?.id).slice(0, 3);
  const progress = getActivityProgress(activeCase, snapshot);
  const reviewedForCase = snapshot.completedByCase[activeCase?.id]?.length ?? 0;
  const notesForCase = snapshot.notesByCase[activeCase?.id]?.length ?? 0;
  const packagesForCase = snapshot.packagesByCase[activeCase?.id]?.length ?? 0;

  return (
    <div className="desktop-dashboard dashboard-v1-shell" data-react-navigation-panel="dashboard">
      <section className="desktop-dashboard-hero">
        <div className="desktop-dashboard-welcome">
          <span className="desktop-eyebrow">Fraud Academy · Blue Mission Deck</span>
          <h2>Welcome back, Investigator.</h2>
          <p>Your command center keeps the active case, saved evidence, notes, and next actions together without exposing protected answers.</p>
          <div>
            <button type="button" className="desktop-hero-primary dashboard-primary-action" onClick={() => onOpenWorkspace('briefing')}>Continue investigation <span aria-hidden="true">→</span></button>
            <button type="button" onClick={() => onNavigate('cases')}>View case queue</button>
          </div>
        </div>
        <div className="desktop-dashboard-orbit" aria-hidden="true">
          <span>✦</span><i /><i /><b />
        </div>
        <div className="desktop-daily-goal">
          <span>Today’s practice</span>
          <strong>{Math.min(5, reviewedForCase)} <small>/ 5 modules</small></strong>
          <div><span style={{ width: `${(Math.min(5, reviewedForCase) / 5) * 100}%` }} /></div>
          <p>Activity reflects reviewed tools only—not case correctness.</p>
        </div>
      </section>

      <div className="desktop-dashboard-grid">
        <article className="desktop-active-case dashboard-active-case">
          <header>
            <div><span>● Active case</span><strong>{activeCase?.id}</strong></div>
            <em>{activeCase?.priority} priority</em>
          </header>
          <div className="desktop-active-case-body">
            <div>
              <p>Investigation lane</p>
              <h3>{activeCase?.type}</h3>
              <dl>
                <div><dt>Customer</dt><dd>{activeCase?.person}</dd></div>
                <div><dt>Amount</dt><dd>{activeCase?.amount}</dd></div>
                <div><dt>Reported</dt><dd>{activeCase?.reportedDate ?? activeCase?.opened}</dd></div>
                <div><dt>Status</dt><dd>{activeCase?.status}</dd></div>
              </dl>
            </div>
            <div className="desktop-case-compass" aria-hidden="true"><span>FA</span><i /><b /></div>
          </div>
          <footer>
            <div>
              <span>Investigation activity</span>
              <div aria-label={`${progress}% investigation progress`}><span style={{ width: `${progress}%` }} /></div>
              <strong>{progress}%</strong>
            </div>
            <button type="button" onClick={() => onOpenWorkspace('briefing')}>Open workspace</button>
          </footer>
        </article>

        <section className="desktop-fieldwork-summary" aria-label="Saved fieldwork summary">
          <header><span className="desktop-eyebrow">Saved fieldwork</span><h3>Active-case snapshot</h3></header>
          <div>
            <article><span aria-hidden="true">✓</span><strong>{reviewedForCase}</strong><small>Tools reviewed</small></article>
            <article><span aria-hidden="true">✎</span><strong>{notesForCase}</strong><small>Notes saved</small></article>
            <article><span aria-hidden="true">▤</span><strong>{packagesForCase}</strong><small>Packages submitted</small></article>
          </div>
          <button type="button" onClick={() => onNavigate('progress')}>Review all progress <span aria-hidden="true">→</span></button>
        </section>
      </div>

      <section className="desktop-shortcuts">
        <header><div><span className="desktop-eyebrow">Direct routes</span><h3>Open the exact workspace you need</h3></div><p>Every shortcut keeps the current case selected.</p></header>
        <div className="dashboard-quick-grid">
          <Shortcut icon="▦" title="Case Queue" detail={`${cases.length} available cases`} onClick={() => onNavigate('cases')} />
          <Shortcut icon="◈" title="Investigation Workspace" detail="Open the case briefing" onClick={() => onOpenWorkspace('briefing')} />
          <Shortcut icon="◷" title="Timeline" detail="Review case events" onClick={() => onOpenWorkspace('timeline', 'Timeline')} />
          <Shortcut icon="⌁" title="Pinned Evidence" detail="Reopen saved objects" onClick={() => onOpenWorkspace('evidence')} />
          <Shortcut icon="✎" title="Case Notes" detail={`${notesForCase} saved for this case`} onClick={() => onOpenWorkspace('notes')} />
          <Shortcut icon="⌘" title="Tool Library" detail="Choose an investigation tool" onClick={() => onOpenWorkspace('tool-menu')} />
          <Shortcut icon="◎" title="Progress" detail={`${snapshot.packages} packages saved`} onClick={() => onNavigate('progress')} />
          <Shortcut icon="✦" title="Academy" detail="Continue learning modules" onClick={() => onNavigate('academy')} />
        </div>
      </section>

      <div className="desktop-dashboard-lower">
        <section className="desktop-queue-preview">
          <header>
            <div><span className="desktop-eyebrow">Case queue</span><h3>Ready for review</h3></div>
            <button type="button" onClick={() => onNavigate('cases')}>See all cases</button>
          </header>
          <div>
            {queuedCases.map((item) => (
              <article key={item.id}>
                <span>{item.priority}</span>
                <div><strong>{item.id}</strong><h4>{item.type}</h4><p>{item.person} · {item.amount}</p></div>
                <button type="button" aria-label={`Open ${item.id}`} onClick={() => onOpenCase(item.id)}>Open <span aria-hidden="true">→</span></button>
              </article>
            ))}
          </div>
        </section>

        <aside className="desktop-luna-guide">
          <span className="desktop-luna-mark" aria-hidden="true">L</span>
          <div><span className="desktop-eyebrow">Luna guide</span><h3>Evidence first, answers later.</h3></div>
          <p>Process coaching can guide your next step. Outcome feedback stays locked until your decision package is submitted.</p>
          <button type="button" onClick={() => onNavigate('academy')}>Visit Luna Academy</button>
        </aside>
      </div>

      <section className="desktop-generator-panel">
        <header><div><span className="desktop-eyebrow">Scenario lab</span><h3>Generate a fictional training case</h3></div><p>New scenarios save locally first and join cloud sync when connected.</p></header>
        {quickGenerator}
      </section>
    </div>
  );
}

function Shortcut({ detail, icon, onClick, title }) {
  return (
    <button type="button" onClick={onClick}>
      <span aria-hidden="true">{icon}</span>
      <span><strong>{title}</strong><small>{detail}</small></span>
      <b aria-hidden="true">→</b>
    </button>
  );
}

function DesktopAtmosphere() {
  return (
    <div className="desktop-mission-atmosphere" aria-hidden="true">
      <span /><span /><span /><span /><i /><i /><b />
    </div>
  );
}
