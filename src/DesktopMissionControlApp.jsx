import { useEffect, useMemo, useState } from 'react';
import AcademyProgressPanel from './AcademyProgressPanel.jsx';
import AcademyThemeV1Panel from './AcademyThemeV1Panel.jsx';
import CasesThemeV1Panel from './CasesThemeV1Panel.jsx';
import CloudSyncControl from './CloudSyncControl.jsx';
import LunaApiAccessSetting from './LunaApiAccessSetting.jsx';
import ProfileThemeV1Panel from './ProfileThemeV1Panel.jsx';
import useDesktopThemeMode, { desktopThemeModes } from './useDesktopThemeMode.js';

const reducedMotionKey = 'fraud-academy-reduced-motion-v1';

const storageKeys = {
  completed: 'fraud-academy-completed-tools-v1',
  notes: 'fraud-academy-notes-v1',
  packages: 'fraud-academy-review-packages-v1',
  quickPad: 'fraud-academy-quick-pad-v1',
  tray: 'fraud-academy-visual-tray-v1',
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
  const quickPadByCase = readJson(storageKeys.quickPad, {});
  const trayByCase = readJson(storageKeys.tray, {});
  return {
    completedByCase,
    notesByCase,
    packagesByCase,
    quickPadByCase,
    trayByCase,
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
  const desktopTheme = useDesktopThemeMode();
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

  function openQuickPad(tab = 'ids') {
    openWorkspace('briefing');
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('fraud-academy:quick-pad-open', {
        detail: { caseId: activeCaseId, tab },
      }));
    }, 80);
  }

  return (
    <div
      className="desktop-mission-control-v2"
      data-desktop-page={activeTab}
      data-desktop-theme={desktopTheme.resolvedTheme}
      data-desktop-theme-preference={desktopTheme.preference}
    >
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
            <h1 aria-label={activeTab === 'dashboard' ? 'Investigator dashboard' : undefined}>
              {activeTab === 'dashboard' ? 'Mission Control' : copy.title}
            </h1>
            <span>{copy.text}</span>
          </div>
          <div className="desktop-topbar-actions">
            <button type="button" className="desktop-active-case-chip" onClick={() => openWorkspace('briefing')}>
              <span>Active case</span><strong>{activeCase?.id}</strong>
            </button>
            <DesktopThemeControl controller={desktopTheme} />
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
                  <div className="desktop-setting-row">
                    <span><strong>Desktop theme</strong><small>Using {desktopTheme.resolvedTheme} mode; Auto follows this computer.</small></span>
                    <DesktopThemeControl controller={desktopTheme} compact />
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

        <div className="desktop-stage-grid">
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

          <DesktopCaseUtilityRail
            activeCase={activeCase}
            onNavigate={navigate}
            onOpenQuickPad={openQuickPad}
            onOpenWorkspace={openWorkspace}
            snapshot={snapshot}
          />
        </div>
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
  const queuedCases = cases.filter((item) => item.id !== activeCase?.id).slice(0, 4);
  const progress = getActivityProgress(activeCase, snapshot);
  const caseNotes = snapshot.notesByCase[activeCase?.id] ?? [];
  const notesForCase = caseNotes.length;
  const packagesForCase = snapshot.packagesByCase[activeCase?.id]?.length ?? 0;
  const pinnedEvidence = snapshot.trayByCase[activeCase?.id] ?? [];
  const workflowSteps = [
    { icon: '⌕', label: 'Briefing', screen: 'briefing' },
    { icon: '▦', label: 'Investigate', screen: 'tool-menu' },
    { icon: '◷', label: 'Timeline', screen: 'timeline', tool: 'Timeline' },
    { icon: '⌁', label: 'Evidence', screen: 'evidence' },
    { icon: '⚖', label: 'Decision', screen: 'determination' },
    { icon: '✦', label: 'Debrief', screen: 'debrief', locked: packagesForCase === 0 },
  ];

  return (
    <div className="desktop-dashboard dashboard-v1-shell" data-react-navigation-panel="dashboard">
      <div className="desktop-command-deck">
        <div className="desktop-command-main">
          <article className="desktop-case-hero desktop-active-case dashboard-active-case">
            <div className="desktop-case-hero-copy">
              <span className="desktop-eyebrow">Active case · Evidence First</span>
              <h2>{activeCase?.id}</h2>
              <p>{activeCase?.summary ?? `${activeCase?.type} training investigation for ${activeCase?.person}.`}</p>
              <dl>
                <div><dt>Customer</dt><dd>{activeCase?.person}</dd></div>
                <div><dt>Case type</dt><dd>{activeCase?.type}</dd></div>
                <div><dt>Amount</dt><dd>{activeCase?.amount}</dd></div>
                <div><dt>Priority</dt><dd>{activeCase?.priority}</dd></div>
              </dl>
              <div className="desktop-case-hero-actions">
                <button type="button" className="desktop-hero-primary dashboard-primary-action" onClick={() => onOpenWorkspace('briefing')}>
                  Continue Investigation <span aria-hidden="true">→</span>
                </button>
                <button type="button" onClick={() => onNavigate('cases')}>View Case Queue</button>
              </div>
            </div>
            <div className="desktop-case-sky" aria-hidden="true">
              <div className="desktop-case-visual-label">
                <span>Current focus</span>
                <strong>Build the evidence trail</strong>
              </div>
              <div className="desktop-case-orbit">
                <i /><i />
                <span className="desktop-observatory">FA</span>
              </div>
              <div className="desktop-case-signal">
                <span><b />Records</span>
                <span><b />Evidence</span>
                <span><b />Decision</span>
              </div>
            </div>
            <footer>
              <span>Investigation activity</span>
              <div aria-label={`${progress}% investigation progress`}><span style={{ width: `${progress}%` }} /></div>
              <strong>{progress}%</strong>
            </footer>
          </article>

          <nav className="desktop-case-path" aria-label="Active case workflow">
            {workflowSteps.map((step) => (
              <button
                key={step.label}
                type="button"
                disabled={step.locked}
                aria-disabled={step.locked}
                onClick={() => onOpenWorkspace(step.screen, step.tool)}
              >
                <span aria-hidden="true">{step.icon}</span>
                <strong>{step.label}</strong>
                {step.locked && <small>Submit first</small>}
              </button>
            ))}
          </nav>

          <section className="desktop-shortcuts">
            <header>
              <div><span className="desktop-eyebrow">Investigation tools</span><h3>Open the exact workspace you need</h3></div>
              <p>Every route keeps {activeCase?.id} selected.</p>
            </header>
            <div className="dashboard-quick-grid">
              <Shortcut icon="▦" title="Case Queue" detail={`${cases.length} available cases`} onClick={() => onNavigate('cases')} />
              <Shortcut icon="◈" title="Investigation Workspace" detail="Open the case briefing" onClick={() => onOpenWorkspace('briefing')} />
              <Shortcut icon="◷" title="Timeline" detail="Review case events" onClick={() => onOpenWorkspace('timeline', 'Timeline')} />
              <Shortcut icon="⌁" title="Pinned Evidence" detail={`${pinnedEvidence.length} saved objects`} onClick={() => onOpenWorkspace('evidence')} />
              <Shortcut icon="✎" title="Case Notes" detail={`${notesForCase} saved for this case`} onClick={() => onOpenWorkspace('notes')} />
              <Shortcut icon="⌘" title="Tool Library" detail="Choose an investigation tool" onClick={() => onOpenWorkspace('tool-menu')} />
              <Shortcut icon="◎" title="Progress" detail={`${snapshot.packages} packages saved`} onClick={() => onNavigate('progress')} />
              <Shortcut icon="✦" title="Academy" detail="Continue learning modules" onClick={() => onNavigate('academy')} />
            </div>
          </section>

          <section className="desktop-recent-cases">
            <header>
              <div><span className="desktop-eyebrow">Recent cases</span><h3>Continue another investigation</h3></div>
              <button type="button" onClick={() => onNavigate('cases')}>View all cases <span aria-hidden="true">→</span></button>
            </header>
            <div>
              {queuedCases.map((item) => (
                <article key={item.id}>
                  <span aria-hidden="true">▦</span>
                  <div><strong>{item.id}</strong><p>{item.type}</p><small>{item.person} · {item.amount}</small></div>
                  <button type="button" aria-label={`Open ${item.id}`} onClick={() => onOpenCase(item.id)}>Open <span aria-hidden="true">→</span></button>
                </article>
              ))}
            </div>
          </section>

          <section className="desktop-generator-panel">
            <header><div><span className="desktop-eyebrow">Scenario lab</span><h3>Generate a fictional training case</h3></div><p>New scenarios save locally first and join cloud sync when connected.</p></header>
            {quickGenerator}
          </section>
        </div>

      </div>
    </div>
  );
}

function DesktopCaseUtilityRail({
  activeCase,
  onNavigate,
  onOpenQuickPad,
  onOpenWorkspace,
  snapshot,
}) {
  const caseNotes = snapshot.notesByCase[activeCase?.id] ?? [];
  const notesForCase = caseNotes.length;
  const packagesForCase = snapshot.packagesByCase[activeCase?.id]?.length ?? 0;
  const pinnedEvidence = snapshot.trayByCase[activeCase?.id] ?? [];
  const quickPad = snapshot.quickPadByCase[activeCase?.id] ?? { items: [], scratch: '' };
  const reviewedForCase = snapshot.completedByCase[activeCase?.id]?.length ?? 0;

  return (
    <aside className="desktop-utility-rail" aria-label="Case utilities">
      <header className="desktop-utility-rail-heading">
        <div>
          <span className="desktop-eyebrow">Case desk</span>
          <h2>{activeCase?.id ?? 'No active case'}</h2>
        </div>
        <span className="desktop-utility-live"><i /> Saved</span>
      </header>

      <UtilityCard
        actionLabel="Open Quick Pad"
        eyebrow="Working clipboard"
        icon="▤"
        onAction={() => onOpenQuickPad('ids')}
        title="Quick Pad"
      >
        {quickPad.items?.length ? (
          <ul>
            {quickPad.items.slice(0, 3).map((item) => (
              <li key={item.id}><span>{item.label}</span><strong>{item.value}</strong></li>
            ))}
          </ul>
        ) : (
          <p>No lookup IDs saved yet. Add an Account ID, Bank Code, Destination ID, or Device ID while reviewing records.</p>
        )}
        {quickPad.scratch?.trim() && <blockquote>{quickPad.scratch}</blockquote>}
      </UtilityCard>

      <UtilityCard
        actionLabel="View Pinned Evidence"
        eyebrow={`${pinnedEvidence.length} saved`}
        icon="⌁"
        onAction={() => onOpenWorkspace('evidence')}
        title="Pinned Evidence"
      >
        {pinnedEvidence.length ? (
          <ul>
            {pinnedEvidence.slice(0, 3).map((item, index) => (
              <li key={`${String(item)}-${index}`}><span>Evidence {index + 1}</span><strong>{formatPinnedEvidence(item)}</strong></li>
            ))}
          </ul>
        ) : <p>Evidence you pin during record review will remain available here.</p>}
      </UtilityCard>

      <UtilityCard
        actionLabel="Open Case Notes"
        eyebrow={`${notesForCase} saved`}
        icon="✎"
        onAction={() => onOpenWorkspace('notes')}
        title="Case Notes"
      >
        {caseNotes.length ? (
          <ul>
            {caseNotes.slice(-2).reverse().map((note, index) => (
              <li key={`${String(note)}-${index}`}><span>Saved note</span><strong>{formatNote(note)}</strong></li>
            ))}
          </ul>
        ) : <p>Document neutral observations and evidence connections without recording a protected answer.</p>}
      </UtilityCard>

      <section className="desktop-luna-card">
        <div className="desktop-luna-orbit" aria-hidden="true"><span>L</span></div>
        <span className="desktop-eyebrow">Luna</span>
        <h3>Evidence first, answers later.</h3>
        <p>Process guidance is available now. Outcome feedback unlocks only after a valid decision is submitted.</p>
        <div>
          <span><strong>{reviewedForCase}</strong><small>Tools reviewed</small></span>
          <span><strong>{packagesForCase}</strong><small>Packages</small></span>
        </div>
        <button type="button" onClick={() => onNavigate('academy')}>Visit Luna Academy</button>
      </section>
    </aside>
  );
}

function DesktopThemeControl({ compact = false, controller }) {
  const labels = {
    day: { icon: '☀', text: 'Day' },
    auto: { icon: '◐', text: 'Auto' },
    night: { icon: '☾', text: 'Night' },
  };
  return (
    <div
      className={`desktop-theme-control${compact ? ' compact' : ''}`}
      role="group"
      aria-label={compact ? 'Desktop theme settings' : 'Desktop theme'}
    >
      {desktopThemeModes.map((mode) => (
        <button
          key={mode}
          type="button"
          aria-label={`${labels[mode].text} theme`}
          aria-pressed={controller.preference === mode}
          title={`${labels[mode].text} theme`}
          onClick={() => controller.setPreference(mode)}
        >
          <span aria-hidden="true">{labels[mode].icon}</span>
          {(mode === 'auto' || compact) && <small>{labels[mode].text}</small>}
        </button>
      ))}
    </div>
  );
}

function UtilityCard({ actionLabel, children, eyebrow, icon, onAction, title }) {
  return (
    <section className="desktop-utility-card">
      <header>
        <span aria-hidden="true">{icon}</span>
        <div><small>{eyebrow}</small><h3>{title}</h3></div>
      </header>
      <div>{children}</div>
      <button type="button" onClick={onAction}>{actionLabel} <span aria-hidden="true">→</span></button>
    </section>
  );
}

function formatPinnedEvidence(item) {
  if (typeof item === 'string') return item;
  return item?.value ?? item?.pin ?? item?.id ?? 'Saved evidence';
}

function formatNote(note) {
  if (typeof note === 'string') return note;
  return note?.text ?? note?.body ?? note?.note ?? 'Saved case note';
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
