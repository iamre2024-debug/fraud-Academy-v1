import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import AcademyProgressPanel from './AcademyProgressPanel.jsx';
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
    text: 'Practice evidence-first investigation habits: open records, expand details, search, connect objects, generate reports, document, then submit.',
    icon: '▱',
  },
  progress: {
    eyebrow: 'Academy Progress',
    title: 'Saved package progress',
    text: 'Progress stays locked until a learner review package is saved. Luna scoring only appears after submission.',
    icon: '▢',
  },
};

const navigationItems = [
  { key: 'dashboard', icon: '⌂', label: 'Dashboard' },
  { key: 'cases', icon: '▣', label: 'Cases' },
  { key: 'workspace', icon: '◈', label: 'Workspace' },
  { key: 'academy', icon: '▱', label: 'Academy' },
];

const learningSteps = [
  ['Evidence First', 'No answer leaks before submission.'],
  ['Open records', 'Review the live case objects inside the workspace.'],
  ['Expand details', 'Open history and source context before documenting.'],
  ['Search objects', 'Find records using case-safe identifiers.'],
  ['Link analysis', 'Connect shared objects without assigning an outcome.'],
  ['Generate report', 'Save a neutral tool report into the case record.'],
  ['Case report', 'Build a documented evidence packet.'],
  ['Submit package', 'Save the learner decision only after the checklist passes.'],
];

const storageKeys = {
  completed: 'fraud-academy-completed-tools-v1',
  notes: 'fraud-academy-notes-v1',
  packages: 'fraud-academy-review-packages-v1',
  packets: 'fraud-academy-case-report-packets-v1',
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
  const packetsByCase = readJson(storageKeys.packets, {});

  return {
    reviewed: countValuesByCase(completedByCase),
    notes: countValuesByCase(notesByCase),
    packages: countValuesByCase(packagesByCase),
    packets: countValuesByCase(packetsByCase),
    completedByCase,
    notesByCase,
    packagesByCase,
    packetsByCase,
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
      <nav className="visual-bottom-nav visual-react-bottom-nav" aria-label="Main navigation" data-react-navigation="true">
        {navigationItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={activeTab === item.key ? 'active' : ''}
            onClick={() => onNavigate(item.key)}
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
    <section className={`ornate-card visual-nav-panel ${activeTab === 'dashboard' ? 'dashboard-theme-v1' : ''}`} aria-live="polite" data-react-navigation-panel={activeTab}>
      <div className="visual-nav-heading">
        <div>
          <p>{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <DirectCollapsibleText as="span" lines={2} mobileLines={2}>
            {copy.text}
          </DirectCollapsibleText>
        </div>
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
      {activeTab === 'academy' && <AcademyPanel onNavigate={onNavigate} />}
      {activeTab === 'progress' && (
        <AcademyProgressPanel cases={cases} packagesByCase={snapshot.packagesByCase} onOpenCase={onOpenCase} />
      )}
    </section>
  );
}

function DashboardPanel({ activeCaseId, cases, snapshot, onNavigate, onOpenCase }) {
  const activeCase = cases.find((item) => item.id === activeCaseId) ?? cases[0];
  const reviewedForCase = snapshot.completedByCase[activeCase?.id]?.length ?? 0;
  const notesForCase = snapshot.notesByCase[activeCase?.id]?.length ?? 0;
  const packagesForCase = snapshot.packagesByCase[activeCase?.id]?.length ?? 0;
  const progress = Math.min(100, 18 + reviewedForCase * 4 + notesForCase * 3 + packagesForCase * 20);

  return (
    <div className="dashboard-v1-shell">
      <header className="dashboard-welcome-card">
        <div>
          <span className="dashboard-kicker">Welcome back</span>
          <h3>Investigator</h3>
          <p>Pick up your active case and keep the evidence trail moving.</p>
        </div>
        <div className="dashboard-agent-mark" aria-hidden="true">☾</div>
      </header>

      {activeCase && (
        <article className="dashboard-active-case" aria-label="Active case">
          <div className="dashboard-active-case-copy">
            <span className="dashboard-kicker">Active case</span>
            <div className="dashboard-case-title-row">
              <div>
                <h3>{activeCase.id}</h3>
                <p>{activeCase.type} · {activeCase.person}</p>
              </div>
              <span className={`dashboard-priority priority-${String(activeCase.priority).toLowerCase()}`}>{activeCase.priority} priority</span>
            </div>
            <div className="dashboard-progress-row">
              <span>Investigation progress</span>
              <div className="dashboard-progress-track" aria-label={`${progress}% investigation progress`}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <strong>{progress}%</strong>
            </div>
          </div>
          <button type="button" className="dashboard-primary-action" onClick={() => onOpenCase(activeCase.id)}>
            Open Workspace <span aria-hidden="true">→</span>
          </button>
        </article>
      )}

      <div className="dashboard-quick-grid" aria-label="Dashboard shortcuts">
        <button type="button" onClick={() => onNavigate('cases')}>
          <span className="dashboard-quick-icon">▣</span>
          <span><strong>Case Queue</strong><small>{cases.length} available cases</small></span>
        </button>
        <button type="button" onClick={() => onNavigate('workspace')}>
          <span className="dashboard-quick-icon">◈</span>
          <span><strong>Evidence Workspace</strong><small>{snapshot.reviewed} tools reviewed</small></span>
        </button>
        <button type="button" onClick={() => onNavigate('workspace')}>
          <span className="dashboard-quick-icon">◷</span>
          <span><strong>Timeline</strong><small>Review case events</small></span>
        </button>
        <button type="button" onClick={() => onNavigate('progress')}>
          <span className="dashboard-quick-icon">▱</span>
          <span><strong>Reports & Progress</strong><small>{snapshot.packets} packets · {snapshot.packages} packages</small></span>
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

function AcademyPanel({ onNavigate }) {
  return (
    <>
      <div className="nav-learning-grid">
        {learningSteps.map(([step, detail], index) => (
          <article key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{step}</strong>
            <DirectCollapsibleText as="p" lines={2} mobileLines={2}>
              {detail}
            </DirectCollapsibleText>
          </article>
        ))}
      </div>
      <aside className="nav-context-card" aria-label="Academy Progress shortcut">
        <div><span>▢</span><strong>Academy Progress</strong><p>Review saved learner-package status and return to any case without adding a fifth global navigation item.</p></div>
        <button type="button" onClick={() => onNavigate('progress')}>Open Academy Progress</button>
      </aside>
    </>
  );
}
