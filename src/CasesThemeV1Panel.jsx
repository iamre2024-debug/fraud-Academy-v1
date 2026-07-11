import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';

const reviewPackagesKey = 'fraud-academy-review-packages-v1';

const scopeOptions = [
  ['all', 'All'],
  ['active', 'Active'],
  ['built-in', 'Built-in'],
  ['generated', 'Generated'],
  ['new', 'New'],
  ['reviewing', 'Reviewing'],
  ['completed', 'Completed'],
  ['paused', 'Paused'],
];

const priorityOrder = {
  High: 0,
  Medium: 1,
  Low: 2,
};

function readPackagesByCase() {
  if (typeof window === 'undefined') return {};
  try {
    const saved = window.localStorage.getItem(reviewPackagesKey);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function isGeneratedCase(item) {
  return Boolean(item?.generatedAt || item?.status === 'Generated' || /-G\d+$/.test(item?.id ?? ''));
}

function hasSavedPackage(item, packagesByCase) {
  return Array.isArray(packagesByCase[item?.id]) && packagesByCase[item.id].length > 0;
}

function getCaseState(item, activeCaseId, packagesByCase) {
  if (hasSavedPackage(item, packagesByCase)) return 'Completed';
  if (item?.id === activeCaseId) return 'Active';
  if (String(item?.status).toLowerCase() === 'paused') return 'Paused';
  if (isGeneratedCase(item)) return 'Generated';
  return item?.status || 'New';
}

function getCaseTimestamp(item) {
  if (Number.isFinite(item?.generatedAt)) return item.generatedAt;
  const parsed = Date.parse(item?.opened ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatQueueAge(item) {
  const timestamp = getCaseTimestamp(item);
  if (!timestamp) return item?.opened || 'Age unavailable';

  const elapsed = Math.max(0, Date.now() - timestamp);
  const hours = Math.floor(elapsed / 3_600_000);
  if (hours < 1) return 'Under 1 hour';
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function getSlaBand(item) {
  if (item?.priority === 'High') return 'Priority SLA';
  if (item?.priority === 'Low') return 'Routine SLA';
  return 'Standard SLA';
}

function matchesScope(item, scope, activeCaseId, packagesByCase) {
  const state = getCaseState(item, activeCaseId, packagesByCase).toLowerCase();
  if (scope === 'all') return true;
  if (scope === 'active') return item.id === activeCaseId;
  if (scope === 'built-in') return !isGeneratedCase(item);
  if (scope === 'generated') return isGeneratedCase(item);
  if (scope === 'completed') return hasSavedPackage(item, packagesByCase);
  return state === scope;
}

function sortCases(items, sortMode) {
  return [...items].sort((left, right) => {
    if (sortMode === 'oldest') return getCaseTimestamp(left) - getCaseTimestamp(right);
    if (sortMode === 'newest') return getCaseTimestamp(right) - getCaseTimestamp(left);
    if (sortMode === 'type') return String(left.type).localeCompare(String(right.type));
    return (priorityOrder[left.priority] ?? 9) - (priorityOrder[right.priority] ?? 9)
      || getCaseTimestamp(right) - getCaseTimestamp(left);
  });
}

export default function CasesThemeV1Panel({ active = false, activeCaseId = '', cases = [], onOpenCase }) {
  const [panelHost, setPanelHost] = useState(null);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all');
  const [priority, setPriority] = useState('all');
  const [sortMode, setSortMode] = useState('priority');
  const [viewMode, setViewMode] = useState('detail');
  const [selectedCaseId, setSelectedCaseId] = useState(activeCaseId || cases[0]?.id || '');
  const [packagesByCase, setPackagesByCase] = useState(readPackagesByCase);

  useEffect(() => {
    const frame = document.querySelector('.visual-os-frame');
    const anchor = frame?.querySelector('.visual-react-nav-host');
    if (!frame || !anchor) return undefined;

    let host = frame.querySelector('.cases-theme-v1-host');
    const created = !host;
    if (!host) {
      host = document.createElement('div');
      host.className = 'cases-theme-v1-host';
      anchor.insertAdjacentElement('afterend', host);
    }

    setPanelHost(host);
    return () => {
      if (created) host.remove();
    };
  }, []);

  useEffect(() => {
    if (cases.some((item) => item.id === selectedCaseId)) return;
    setSelectedCaseId(activeCaseId || cases[0]?.id || '');
  }, [activeCaseId, cases, selectedCaseId]);

  useEffect(() => {
    const refresh = () => setPackagesByCase(readPackagesByCase());
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('fraud-academy:package-saved', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('fraud-academy:package-saved', refresh);
    };
  }, []);

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? cases[0],
    [cases, selectedCaseId],
  );

  const scopeCounts = useMemo(() => Object.fromEntries(scopeOptions.map(([key]) => [
    key,
    cases.filter((item) => matchesScope(item, key, activeCaseId, packagesByCase)).length,
  ])), [activeCaseId, cases, packagesByCase]);

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = cases.filter((item) => {
      const searchable = [
        item.id,
        item.person,
        item.type,
        item.priority,
        item.status,
        item.queueReason,
      ].filter(Boolean).join(' ').toLowerCase();

      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && matchesScope(item, scope, activeCaseId, packagesByCase)
        && (priority === 'all' || item.priority === priority);
    });

    return sortCases(matches, sortMode);
  }, [activeCaseId, cases, packagesByCase, priority, query, scope, sortMode]);

  if (!active || !panelHost) return null;

  const panel = (
    <section className="cases-theme-v1-panel" data-cases-theme-v1="approved" aria-label="Case Queue">
      <header className="cases-theme-v1-heading">
        <div>
          <p>Fraud Academy</p>
          <h2>Case Queue</h2>
          <span>Find the right training case, preview the allegation, and open the evidence workspace without losing progress.</span>
        </div>
        <div className="cases-theme-v1-mark" aria-hidden="true">▣</div>
      </header>

      <section className="case-queue-summary" aria-label="Case queue summary">
        <article><strong>{cases.length}</strong><span>Total cases</span></article>
        <article><strong>{scopeCounts.active}</strong><span>Active</span></article>
        <article><strong>{scopeCounts.generated}</strong><span>Generated</span></article>
        <article><strong>{scopeCounts.completed}</strong><span>Completed</span></article>
      </section>

      <section className="case-queue-controls" aria-label="Case queue controls">
        <label className="case-queue-search">
          <span>Search cases</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ID, customer, claim type, or reason"
          />
        </label>

        <label>
          <span>Priority</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="all">All priorities</option>
            <option value="High">High priority</option>
            <option value="Medium">Medium priority</option>
            <option value="Low">Low priority</option>
          </select>
        </label>

        <label>
          <span>Sort</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            <option value="priority">Priority first</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="type">Claim type</option>
          </select>
        </label>

        <div className="case-queue-view-toggle" role="group" aria-label="Case queue view">
          <button type="button" className={viewMode === 'detail' ? 'active' : ''} onClick={() => setViewMode('detail')}>Detail</button>
          <button type="button" className={viewMode === 'compact' ? 'active' : ''} onClick={() => setViewMode('compact')}>Compact</button>
        </div>
      </section>

      <nav className="case-queue-status-filters" aria-label="Case status filters">
        {scopeOptions.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={scope === key ? 'active' : ''}
            onClick={() => setScope(key)}
            aria-pressed={scope === key}
          >
            <span>{label}</span>
            <strong>{scopeCounts[key]}</strong>
          </button>
        ))}
      </nav>

      <div className="case-queue-layout">
        <section className="case-queue-results" aria-label="Available cases">
          <div className="case-queue-results-heading">
            <div>
              <strong>{filteredCases.length} case{filteredCases.length === 1 ? '' : 's'}</strong>
              <span>Results update without changing the active investigation.</span>
            </div>
            <span className="case-queue-evidence-lock">Evidence First</span>
          </div>

          {filteredCases.length ? (
            <div className={`case-queue-list view-${viewMode}`}>
              {filteredCases.map((item) => {
                const state = getCaseState(item, activeCaseId, packagesByCase);
                const origin = isGeneratedCase(item) ? 'Generated' : 'Built-in';
                const isSelected = selectedCase?.id === item.id;

                return (
                  <article
                    key={item.id}
                    className={`case-queue-item ${isSelected ? 'selected' : ''}`}
                    data-case-origin={origin.toLowerCase()}
                    data-case-state={state.toLowerCase()}
                  >
                    <button
                      type="button"
                      className="nav-case-card"
                      onClick={() => onOpenCase?.(item.id)}
                      onMouseEnter={() => setSelectedCaseId(item.id)}
                      onFocus={() => setSelectedCaseId(item.id)}
                    >
                      <span className="case-queue-card-topline">
                        <span className="case-queue-id">{item.id}</span>
                        <span className={`case-queue-priority priority-${String(item.priority).toLowerCase()}`}>{item.priority}</span>
                      </span>
                      <strong>{item.person}</strong>
                      <span className="case-queue-type">{item.type}</span>
                      <span className="case-queue-card-meta">
                        <span>{formatQueueAge(item)} in queue</span>
                        <span>{item.amount || 'Amount not listed'}</span>
                      </span>
                      <span className="case-queue-card-badges">
                        <span>{origin}</span>
                        <span>{state}</span>
                        <span>{getSlaBand(item)}</span>
                      </span>
                      <span className="case-queue-card-reason">{item.queueReason || item.allegation}</span>
                      <span className="case-queue-open-label">Open case <span aria-hidden="true">→</span></span>
                    </button>
                    <button
                      type="button"
                      className="case-queue-preview-control"
                      onClick={() => setSelectedCaseId(item.id)}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? 'Preview selected' : 'Preview details'}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="case-queue-empty" role="status">
              <strong>No cases match these filters.</strong>
              <span>Clear the search or reset the queue filters.</span>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setScope('all');
                  setPriority('all');
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </section>

        {selectedCase && (
          <aside className="case-queue-preview" aria-label="Selected case preview">
            <div className="case-queue-preview-heading">
              <div>
                <span>Selected case preview</span>
                <strong>{selectedCase.id}</strong>
              </div>
              <span className={`case-queue-priority priority-${String(selectedCase.priority).toLowerCase()}`}>{selectedCase.priority}</span>
            </div>

            <h3>{selectedCase.person}</h3>
            <p className="case-queue-preview-type">{selectedCase.type}</p>

            <dl className="case-queue-preview-facts">
              <div><dt>Queue age</dt><dd>{formatQueueAge(selectedCase)}</dd></div>
              <div><dt>Status</dt><dd>{getCaseState(selectedCase, activeCaseId, packagesByCase)}</dd></div>
              <div><dt>SLA band</dt><dd>{getSlaBand(selectedCase)}</dd></div>
              <div><dt>Amount</dt><dd>{selectedCase.amount || 'Not listed'}</dd></div>
            </dl>

            <section>
              <span>Why this case exists</span>
              <DirectCollapsibleText as="p" lines={4} mobileLines={4}>
                {selectedCase.queueReason || selectedCase.allegation}
              </DirectCollapsibleText>
            </section>

            <section>
              <span>Customer allegation or system alert</span>
              <DirectCollapsibleText as="p" lines={5} mobileLines={4}>
                {selectedCase.allegation}
              </DirectCollapsibleText>
            </section>

            <div className="case-queue-preview-meta">
              <span>{isGeneratedCase(selectedCase) ? 'Generated training case' : 'Built-in training case'}</span>
              <span>{selectedCase.opened}</span>
              <span>{selectedCase.trainingId}</span>
            </div>

            <button type="button" className="case-queue-primary-action" onClick={() => onOpenCase?.(selectedCase.id)}>
              Open selected case <span aria-hidden="true">→</span>
            </button>
          </aside>
        )}
      </div>
    </section>
  );

  return createPortal(panel, panelHost);
}
