import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import AcademyProgressPanel from './AcademyProgressPanel.jsx';
import AcademyThemeV1Panel from './AcademyThemeV1Panel.jsx';
import ProfileThemeV1Panel from './ProfileThemeV1Panel.jsx';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { trainingCases } from './data/cases.js';

const tabCopy = {
  dashboard: {
    eyebrow: 'Fraud Academy',
    title: 'Investigator dashboard',
    text: 'Resume the active case, review your queue, and continue the next Evidence First action.',
    icon: '✦',
  },
  cases: {
    eyebrow: 'Case Queue',
    title: 'Choose a training case',
    text: 'Open a case and continue the same investigation workspace without resetting progress.',
    icon: '▣',
  },
  academy: {
    eyebrow: 'Fraud Academy',
    title: 'Learning path',
    text: 'Practice evidence-first investigation habits: open records, expand details, search, connect objects, document, then submit.',
    icon: '▱',
  },
  progress: {
    eyebrow: 'Academy Progress',
    title: 'Saved package progress',
    text: 'Progress stays locked until a learner review package is saved. Luna scoring only appears after submission.',
    icon: '▢',
  },
  profile: {
    eyebrow: 'Agent Profile',
    title: 'Investigator development',
    text: 'Review activity-based skill proficiency, badges, saved work, and goals without exposing protected case outcomes.',
    icon: '◎',
  },
};

const navigationItems = [
  { key: 'dashboard', icon: '🏠', label: 'Home', accessibleLabel: 'Dashboard' },
  { key: 'cases', icon: '🔎', label: 'Cases', accessibleLabel: 'Cases' },
  { key: 'workspace', icon: '📎', label: 'Files', accessibleLabel: 'Workspace' },
  { key: 'academy', icon: '🌙', label: 'Luna', accessibleLabel: 'Academy' },
];

const storageKeys = {
  completed: 'fraud-academy-completed-tools-v1',
  notes: 'fraud-academy-notes-v1',
  packages: 'fraud-academy-review-packages-v1',
};

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function countValuesByCase(data) {
  return Object.values(data).reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0);
}

function buildSnapshot() {
  const completedByCase = readJson(storageKeys.completed, {});
  const notesByCase = readJson(storageKeys.notes, {});
  const packagesByCase = readJson(storageKeys.packages, {});

  return {
    reviewed: countValuesByCase(completedByCase),
    notes: countValuesByCase(notesByCase),
    packages: countValuesByCase(packagesByCase),
    completedByCase,
    notesByCase,
    packagesByCase,
  };
}

export default function VisualNavigation({ activeTab = 'workspace', activeCaseId = '', cases = trainingCases, onNavigate, onOpenCase }) {
  const [panelHost, setPanelHost] = useState(null);
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const snapshot = useMemo(() => buildSnapshot(), [activeTab, snapshotVersion]);

  useEffect(() => {
    const frame = document.querySelector('.visual-os-frame');
    const anchor = document.querySelector('.visual-categories');
    if (!frame || !anchor) return undefined;

    const panelAnchor = anchor.closest('.workflow-investigate-stage') ?? anchor;
    let host = frame.querySelector('.visual-react-nav-host');
    const created = !host;
    if (!host) {
      host = document.createElement('div');
      host.className = 'visual-react-nav-host';
      panelAnchor.insertAdjacentElement('afterend', host);
    }

    setPanelHost(host);
    return () => {
      if (created) host.remove();
    };
  }, []);

  useEffect(() => {
    setSnapshotVersion((current) => current + 1);
    document.querySelector('.visual-os-frame')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeTab]);

  useEffect(() => {
    const refresh = () => setSnapshotVersion((current) => current + 1);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('fraud-academy:package-saved', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('fraud-academy:package-saved', refresh);
    };
  }, []);

  const panel = activeTab === 'workspace' ? null : (
    <NavigationPanel
      activeTab={activeTab}
      activeCaseId={activeCaseId}
      cases={cases}
      snapshot={snapshot}
      onNavigate={onNavigate}
      onOpenCase={onOpenCase}
    />
  );

  return (
    <>
      {panelHost && createPortal(panel, panelHost)}
      <nav className="visual-bottom-nav visual-react-bottom-nav mission-route-dock" aria-label="Main navigation" data-react-navigation="true">
        {navigationItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={activeTab === item.key ? 'active' : ''}
            data-mission-route={item.key}
            onClick={() => onNavigate(item.key)}
            aria-label={item.accessibleLabel}
            aria-current={activeTab === item.key ? 'page' : undefined}
          >
            {item.icon}<span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

function NavigationPanel({ activeTab, activeCaseId, cases, snapshot, onNavigate, onOpenCase }) {
  const copy = tabCopy[activeTab] ?? tabCopy.dashboard;

  return (
    <section className={`ornate-card visual-nav-panel mission-deck-panel mission-deck-panel-${activeTab} ${activeTab === 'dashboard' ? 'dashboard-theme-v1' : ''}`} aria-live="polite" data-react-navigation-panel={activeTab}>
      <div className="visual-nav-heading">
        <div>
          <p>{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <DirectCollapsibleText as="span" lines={2} mobileLines={2}>
            {copy.text}
          </DirectCollapsibleText>
        </div>
        <button type="button" className="visual-nav-profile-entry" aria-label="Open Agent profile" onClick={() => onNavigate('profile')}>
          <span>LA</span><small>Agent</small>
        </button>
        <div aria-hidden="true">{copy.icon}</div>
      </div>
      {activeTab === 'dashboard' && (
        <DashboardPanel
          activeCaseId={activeCaseId}
          cases={cases}
          snapshot={snapshot}
          onNavigate={onNavigate}
          onOpenCase={onOpenCase}
        />
      )}
      {activeTab === 'cases' && <CasesPanel cases={cases} onOpenCase={onOpenCase} />}
      {activeTab === 'academy' && (
        <AcademyThemeV1Panel
          activeCaseId={activeCaseId}
          cases={cases}
          snapshot={snapshot}
          onNavigate={onNavigate}
          onOpenCase={onOpenCase}
        />
      )}
      {activeTab === 'progress' && (
        <AcademyProgressPanel cases={cases} packagesByCase={snapshot.packagesByCase} onOpenCase={onOpenCase} />
      )}
      {activeTab === 'profile' && (
        <ProfileThemeV1Panel
          activeCaseId={activeCaseId}
          cases={cases}
          snapshot={snapshot}
          onNavigate={onNavigate}
          onOpenCase={onOpenCase}
        />
      )}
    </section>
  );
}

function DashboardPanel({ activeCaseId, cases, snapshot, onNavigate, onOpenCase }) {
  const activeCase = cases.find((item) => item.id === activeCaseId) ?? cases[0];
  const queuedCases = cases.filter((item) => item.id !== activeCase?.id).slice(0, 2);
  const reviewedForCase = snapshot.completedByCase[activeCase?.id]?.length ?? 0;
  const notesForCase = snapshot.notesByCase[activeCase?.id]?.length ?? 0;
  const packagesForCase = snapshot.packagesByCase[activeCase?.id]?.length ?? 0;
  const progress = Math.min(100, 18 + reviewedForCase * 4 + notesForCase * 3 + packagesForCase * 20);
  const dailyGoal = Math.min(5, reviewedForCase);

  return (
    <div className="dashboard-v1-shell">
      <header className="dashboard-welcome-card dashboard-mission-header">
        <div className="dashboard-mission-brand">
          <span aria-hidden="true">🛡️</span>
          <div><strong>Fraud Academy</strong><small>Blue Mission Deck</small></div>
        </div>
        <div className="dashboard-daily-goal">
          <span>🎯 Daily Goal</span>
          <strong>{dailyGoal} / 5 modules</strong>
          <div aria-label={`${dailyGoal} of 5 daily modules complete`}><span style={{ width: `${(dailyGoal / 5) * 100}%` }} /></div>
        </div>
        <button type="button" className="dashboard-agent-mark dashboard-luna-launcher" aria-label="Open Agent profile" onClick={() => onNavigate('profile')}>
          <span aria-hidden="true">🐱</span><small>Luna 🌙</small>
        </button>
        <div className="dashboard-mission-orbit" aria-hidden="true"><i /><i /><i /></div>
      </header>

      {activeCase && (
        <section className="dashboard-mission-stack" aria-label="Mission case deck">
          {queuedCases.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`dashboard-stack-case dashboard-stack-case-${index + 1}`}
              onClick={() => onOpenCase(item.id)}
            >
              <span>{item.id}</span><small>{index ? 'In Progress' : 'Review'}</small>
            </button>
          ))}
          <article className="dashboard-active-case" aria-label="Active case">
            <MissionLighthouseArt />
            <div className="dashboard-active-case-copy">
              <span className="dashboard-kicker">● Active Case</span>
              <div className="dashboard-case-title-row">
                <div>
                  <h3>{activeCase.id}</h3>
                  <p>{activeCase.type}</p>
                </div>
                <span className={`dashboard-priority priority-${String(activeCase.priority).toLowerCase()}`}>{activeCase.priority} priority</span>
              </div>
              <dl className="dashboard-case-mission-facts">
                <div><dt>👤 Customer</dt><dd>{activeCase.person}</dd></div>
                <div><dt>📅 Reported</dt><dd>{activeCase.reportedDate ?? activeCase.opened}</dd></div>
                <div><dt>💵 Amount</dt><dd>{activeCase.amount}</dd></div>
              </dl>
              <div className="dashboard-progress-row">
                <span>Investigation progress</span>
                <div className="dashboard-progress-track" aria-label={`${progress}% investigation progress`}>
                  <span style={{ width: `${progress}%` }} />
                </div>
                <strong>{progress}%</strong>
              </div>
            </div>
            <div className="dashboard-investigation-ribbon" aria-hidden="true">UNDER INVESTIGATION</div>
            <button type="button" className="dashboard-primary-action" onClick={() => onOpenCase(activeCase.id)}>
              Open workspace <span aria-hidden="true">›</span>
            </button>
          </article>
        </section>
      )}

      <div className="dashboard-quick-grid dashboard-mission-drawers" aria-label="Dashboard shortcuts">
        <button type="button" onClick={() => onNavigate('cases')}>
          <span className="dashboard-quick-icon">▣</span>
          <span><strong>Case Queue</strong><small>{cases.length} available cases</small></span>
        </button>
        <button type="button" onClick={() => onNavigate('workspace')}>
          <span className="dashboard-quick-icon">◈</span>
          <span><strong>Investigation Workspace</strong><small>{snapshot.reviewed} tools reviewed</small></span>
        </button>
        <button type="button" onClick={() => onNavigate('workspace')}>
          <span className="dashboard-quick-icon">◷</span>
          <span><strong>Timeline</strong><small>Review case events</small></span>
        </button>
        <button type="button" onClick={() => onNavigate('progress')}>
          <span className="dashboard-quick-icon">▱</span>
          <span><strong>Progress</strong><small>{snapshot.packages} packages</small></span>
        </button>
      </div>

      <section className="dashboard-summary-grid" aria-label="Recent work summary">
        <article><strong>{snapshot.notes}</strong><span>Saved notes</span></article>
        <article><strong>{snapshot.reviewed}</strong><span>Reviewed tools</span></article>
        <article><strong>{snapshot.packages}</strong><span>Submitted packages</span></article>
      </section>

      <aside className="dashboard-luna-card">
        <div className="dashboard-luna-orb" aria-hidden="true">L</div>
        <div>
          <span className="dashboard-kicker">Luna guide</span>
          <strong>Process coaching stays neutral</strong>
          <p>Luna can guide the workflow, but case scoring remains locked until the decision package is submitted.</p>
        </div>
      </aside>
    </div>
  );
}

function MissionLighthouseArt() {
  return (
    <svg className="dashboard-lighthouse-art" viewBox="0 0 320 330" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="mission-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#143c66" stopOpacity="0.55" />
          <stop offset="1" stopColor="#020d1b" stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id="mission-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9beaff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#9beaff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#9beaff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="320" height="330" fill="url(#mission-sky)" />
      <g fill="#7de5ff">
        <circle cx="34" cy="44" r="1.5" /><circle cx="76" cy="83" r="1" /><circle cx="239" cy="42" r="1.2" /><circle cx="292" cy="91" r="1.4" />
      </g>
      <path d="M125 176 L306 129 L304 161 L126 189 Z" fill="url(#mission-beam)" />
      <path d="M18 284 C76 245 142 269 193 250 C236 235 281 245 320 227 L320 330 L0 330 Z" fill="#06111d" />
      <path d="M202 277 L221 149 L248 149 L266 277 Z" fill="#b7d5e5" opacity="0.86" />
      <path d="M213 151 L218 131 L251 131 L257 151 Z" fill="#0a1726" stroke="#6fdfff" strokeWidth="2" />
      <rect x="221" y="116" width="28" height="17" rx="2" fill="#d6f4ff" stroke="#77e5ff" strokeWidth="2" />
      <path d="M218 116 L235 103 L252 116 Z" fill="#10253a" stroke="#77e5ff" strokeWidth="2" />
      <rect x="230" y="92" width="9" height="13" fill="#85e9ff" />
      <path d="M188 284 C224 270 274 275 320 255 L320 330 L166 330 Z" fill="#020914" opacity="0.9" />
      <path d="M0 302 C65 288 99 310 157 295 C214 279 258 310 320 288" fill="none" stroke="#2fcfff" strokeOpacity="0.45" strokeWidth="2" />
    </svg>
  );
}

function CasesPanel({ cases, onOpenCase }) {
  return (
    <div className="nav-case-grid">
      {cases.map((item) => (
        <button key={item.id} type="button" className="nav-case-card" onClick={() => onOpenCase(item.id)}>
          <span>{item.type}</span>
          <strong>{item.person}</strong>
          <small>{item.id} · {item.priority} priority</small>
        </button>
      ))}
    </div>
  );
}
