import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { trainingCases } from './data/cases.js';

const tabCopy = {
  dashboard: {
    eyebrow: 'Command Dashboard',
    title: 'Investigation overview',
    text: 'A calm command view for active training cases, saved packages, reviewed tools, and the next Evidence First action.',
    icon: '☾',
  },
  cases: {
    eyebrow: 'Case Queue',
    title: 'Choose a training case',
    text: 'Open a case and continue the same investigation workspace without resetting saved notes, reports, or progress.',
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
    icon: '✦',
  },
};

const navigationItems = [
  { key: 'dashboard', icon: '⌂', label: 'Dashboard' },
  { key: 'cases', icon: '▣', label: 'Cases' },
  { key: 'workspace', icon: '◈', label: 'Workspace' },
  { key: 'academy', icon: '▱', label: 'Academy' },
  { key: 'progress', icon: '✦', label: 'Progress' },
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
    packagesByCase,
  };
}

export default function VisualNavigation({ activeTab = 'workspace', cases = trainingCases, onNavigate, onOpenCase }) {
  const [panelHost, setPanelHost] = useState(null);
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const snapshot = useMemo(() => buildSnapshot(), [activeTab, snapshotVersion]);

  useEffect(() => {
    const frame = document.querySelector('.visual-os-frame');
    const anchor = document.querySelector('.visual-categories');
    if (!frame || !anchor) return undefined;

    let host = frame.querySelector('.visual-react-nav-host');
    const created = !host;
    if (!host) {
      host = document.createElement('div');
      host.className = 'visual-react-nav-host';
      anchor.insertAdjacentElement('afterend', host);
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
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const panel = activeTab === 'workspace' ? null : (
    <NavigationPanel
      activeTab={activeTab}
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

function NavigationPanel({ activeTab, cases, snapshot, onNavigate, onOpenCase }) {
  const copy = tabCopy[activeTab] ?? tabCopy.dashboard;

  return (
    <section className="ornate-card visual-nav-panel" aria-live="polite" data-react-navigation-panel={activeTab}>
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
      {activeTab === 'dashboard' && <DashboardPanel cases={cases} snapshot={snapshot} onNavigate={onNavigate} />}
      {activeTab === 'cases' && <CasesPanel cases={cases} packagesByCase={snapshot.packagesByCase} onOpenCase={onOpenCase} />}
      {activeTab === 'academy' && <AcademyPanel />}
      {activeTab === 'progress' && <ProgressPanel cases={cases} packagesByCase={snapshot.packagesByCase} />}
    </section>
  );
}

function DashboardPanel({ cases, snapshot, onNavigate }) {
  const unlockedCases = cases.filter((item) => (snapshot.packagesByCase[item.id] ?? []).length > 0).length;

  return (
    <>
      <div className="nav-stat-grid" aria-label="Workspace totals">
        <article><strong>{cases.length}</strong><span>Active cases</span></article>
        <article><strong>{snapshot.reviewed}</strong><span>Reviewed tools</span></article>
        <article><strong>{snapshot.notes}</strong><span>Notebook notes</span></article>
        <article><strong>{snapshot.packages}</strong><span>Saved packages</span></article>
      </div>
      <div className="nav-dashboard-brief">
        <div>
          <span>Evidence First status</span>
          <strong>{unlockedCases} of {cases.length} cases submitted</strong>
          <p>Investigation outcomes remain hidden until each learner package is saved.</p>
        </div>
        <div>
          <span>Case reports</span>
          <strong>{snapshot.packets} packet{snapshot.packets === 1 ? '' : 's'} saved</strong>
          <p>Reports, notes, and generated cases remain scoped to their original case.</p>
        </div>
      </div>
      <div className="nav-action-row">
        <button type="button" onClick={() => onNavigate('cases')}>Open Case Queue</button>
        <button type="button" onClick={() => onNavigate('workspace')}>Return to Workspace</button>
        <button type="button" onClick={() => onNavigate('progress')}>View Progress</button>
      </div>
    </>
  );
}

function CasesPanel({ cases, packagesByCase, onOpenCase }) {
  return (
    <div className="nav-case-grid">
      {cases.map((item) => {
        const submitted = (packagesByCase[item.id] ?? []).length > 0;
        return (
          <button key={item.id} type="button" className="nav-case-card" onClick={() => onOpenCase(item.id)}>
            <span>{item.type}</span>
            <strong>{item.person}</strong>
            <small>{item.id} · {item.priority} priority</small>
            <em>{submitted ? 'Package saved' : 'Investigation open'}</em>
          </button>
        );
      })}
    </div>
  );
}

function AcademyPanel() {
  return (
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
  );
}

function ProgressPanel({ cases, packagesByCase }) {
  return (
    <div className="nav-progress-list">
      {cases.map((item) => {
        const latest = (packagesByCase[item.id] ?? [])[0];
        return (
          <article key={item.id} className={latest ? 'unlocked' : 'locked'}>
            <div>
              <span>{item.type}</span>
              <strong>{item.person}</strong>
              <DirectCollapsibleText as="p" lines={2} mobileLines={2}>
                {latest ? `Saved ${latest.savedAt}` : 'Submit a review package to unlock Luna progress.'}
              </DirectCollapsibleText>
            </div>
            <em>{latest ? 'Unlocked' : 'Locked'}</em>
          </article>
        );
      })}
    </div>
  );
}
