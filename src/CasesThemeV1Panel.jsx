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
  if (item?.creditDecision?.deadline) return 'Credit SLA';
  if (item?.priority === 'High') return 'Priority SLA';
  if (item?.priority === 'Low') return 'Routine SLA';
  return 'Standard SLA';
}

function matchesScope(item, scope, activeCaseId, packagesByCase) {
  const state = getCaseState(item, activeCaseId, packagesByCase).toLowerCase();
  if (scope === 'all') return true;
  if (scope === 'active') return !hasSavedPackage(item, packagesByCase) && state !== 'paused';
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

function documentSummary(item) {
  const documents = item?.documentRequests ?? item?.documents ?? [];
  const requested = documents.filter((document) => /requested|pending/i.test(document.status ?? '')).length;
  return requested ? `${documents.length} documents · ${requested} requested` : `${documents.length} documents`;
}

function selectedClaimType(claimTypes, claimTypeId) {
  return claimTypes.find((item) => item.id === claimTypeId) ?? claimTypes[0] ?? null;
}

export default function CasesThemeV1Panel({
  active = false,
  activeCaseId = '',
  cases = [],
  claimTypes = [],
  onGenerateCases,
  onOpenCase,
}) {
  const [panelHost, setPanelHost] = useState(null);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('active');
  const [priority, setPriority] = useState('all');
  const [lane, setLane] = useState('all');
  const [sortMode, setSortMode] = useState('priority');
  const [viewMode, setViewMode] = useState('detail');
  const [selectedCaseId, setSelectedCaseId] = useState(activeCaseId || cases[0]?.id || '');
  const [packagesByCase, setPackagesByCase] = useState(readPackagesByCase);
  const [generatorClaimTypeId, setGeneratorClaimTypeId] = useState(claimTypes[0]?.id ?? 'account-takeover');
  const [generatorScenarioId, setGeneratorScenarioId] = useState(claimTypes[0]?.scenarios?.[0]?.id ?? '');
  const [generatorDifficulty, setGeneratorDifficulty] = useState('standard');
  const [generatorDepth, setGeneratorDepth] = useState('standard');
  const [generatorCount, setGeneratorCount] = useState('1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mobileGeneratorOpen, setMobileGeneratorOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

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
    const nextClaimType = selectedClaimType(claimTypes, generatorClaimTypeId);
    if (!nextClaimType) return;
    if (nextClaimType.id !== generatorClaimTypeId) setGeneratorClaimTypeId(nextClaimType.id);
    if (!nextClaimType.scenarios.some((scenario) => scenario.id === generatorScenarioId)) {
      setGeneratorScenarioId(nextClaimType.scenarios[0]?.id ?? '');
    }
  }, [claimTypes, generatorClaimTypeId, generatorScenarioId]);

  useEffect(() => {
    if (cases.some((item) => item.id === selectedCaseId)) return;
    setSelectedCaseId(activeCaseId || cases[0]?.id || '');
  }, [activeCaseId, cases, selectedCaseId]);

  useEffect(() => {
    const refresh = () => setPackagesByCase(readPackagesByCase());
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
    if (!active) {
      setMobilePreviewOpen(false);
      setMobileFiltersOpen(false);
      setMobileGeneratorOpen(false);
    }
  }, [active]);

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
        item.lane,
        item.subtype,
        item.scenarioTitle,
        item.priority,
        item.status,
        item.queueReason,
      ].filter(Boolean).join(' ').toLowerCase();

      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && matchesScope(item, scope, activeCaseId, packagesByCase)
        && (priority === 'all' || item.priority === priority)
        && (lane === 'all' || item.lane === lane);
    });

    return sortCases(matches, sortMode);
  }, [activeCaseId, cases, lane, packagesByCase, priority, query, scope, sortMode]);

  const generatorClaimType = selectedClaimType(claimTypes, generatorClaimTypeId);
  const laneOptions = [...new Set(cases.map((item) => item.lane).filter(Boolean))].sort();

  async function generateConfiguredCases() {
    if (!onGenerateCases || isGenerating || !generatorClaimType) return;
    setIsGenerating(true);
    try {
      const createdCases = await onGenerateCases({
        claimTypeId: generatorClaimType.id,
        scenarioId: generatorScenarioId,
        randomizeScenario: generatorClaimType.hideScenarioAnswer,
        difficulty: generatorDifficulty,
        evidenceDepth: generatorDepth,
        count: generatorCount,
      });
      const firstCase = createdCases?.[0];
      if (firstCase) {
        setSelectedCaseId(firstCase.id);
        setScope('generated');
        setQuery('');
        setMobileGeneratorOpen(false);
        setMobilePreviewOpen(true);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  function isMobileLayout() {
    return typeof document !== 'undefined' && document.body.dataset.layoutMode === 'mobile';
  }

  function openQueueItem(itemId) {
    setSelectedCaseId(itemId);
    onOpenCase?.(itemId);
  }

  function previewQueueItem(itemId) {
    setSelectedCaseId(itemId);
    if (isMobileLayout()) setMobilePreviewOpen(true);
  }

  if (!active || !panelHost) return null;

  const panel = (
    <section className="cases-theme-v1-panel" data-cases-theme-v1="approved" aria-label="Case Queue">
      <header className="cases-theme-v1-heading">
        <div>
          <p>Fraud Academy</p>
          <h2>Case Queue</h2>
          <span>Find the right training case, preview the allegation, and open the investigation workspace without losing progress.</span>
        </div>
        <div className="cases-theme-v1-mark" aria-hidden="true">▣</div>
      </header>

      <div className="case-queue-mobile-actions" aria-label="Mobile case queue controls">
        <button
          type="button"
          className={mobileFiltersOpen ? 'active' : ''}
          aria-expanded={mobileFiltersOpen}
          aria-controls="case-queue-mobile-filters"
          aria-label="Open case filters"
          onClick={() => setMobileFiltersOpen((current) => !current)}
        >
          <span aria-hidden="true">⌕</span>
          Filters
        </button>
        <button
          type="button"
          className={mobileGeneratorOpen ? 'active' : ''}
          aria-expanded={mobileGeneratorOpen}
          aria-controls="case-queue-mobile-generator"
          aria-label="Open case generator"
          onClick={() => setMobileGeneratorOpen((current) => !current)}
        >
          <span aria-hidden="true">✦</span>
          Generate
        </button>
      </div>

      <section
        id="case-queue-mobile-generator"
        className="case-generator-v2"
        data-mobile-expanded={mobileGeneratorOpen}
        aria-label="Generate fictional training cases"
      >
        <header>
          <div>
            <p>Case generator</p>
            <h3>Create training cases</h3>
            <span>Select a Bible-v2 claim lane. Answer-bearing payroll and business-payment evidence patterns stay hidden and randomized.</span>
          </div>
          <span className="case-generator-v2-count">Unlimited queue</span>
        </header>

        <div className="case-generator-v2-controls">
          <label>
            <span>Claim type</span>
            <select value={generatorClaimTypeId} onChange={(event) => setGeneratorClaimTypeId(event.target.value)} aria-label="Generate case claim type">
              {claimTypes.map((claimType) => <option key={claimType.id} value={claimType.id}>{claimType.label}</option>)}
            </select>
          </label>
          <label>
            <span>Scenario</span>
            {generatorClaimType?.hideScenarioAnswer ? (
              <select value="randomized" disabled aria-label="Generate case scenario">
                <option value="randomized">Randomized hidden evidence pattern</option>
              </select>
            ) : (
              <select value={generatorScenarioId} onChange={(event) => setGeneratorScenarioId(event.target.value)} aria-label="Generate case scenario">
                {(generatorClaimType?.scenarios ?? []).map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.title}</option>)}
              </select>
            )}
          </label>
          <label>
            <span>Difficulty</span>
            <select value={generatorDifficulty} onChange={(event) => setGeneratorDifficulty(event.target.value)} aria-label="Generate case difficulty">
              <option value="light">Light</option>
              <option value="standard">Standard</option>
              <option value="deep">Deep</option>
            </select>
          </label>
          <label>
            <span>Evidence depth</span>
            <select value={generatorDepth} onChange={(event) => setGeneratorDepth(event.target.value)} aria-label="Generate case evidence depth">
              <option value="light">Light packet</option>
              <option value="standard">Standard packet</option>
              <option value="deep">Deep packet</option>
            </select>
          </label>
          <label>
            <span>Cases</span>
            <select value={generatorCount} onChange={(event) => setGeneratorCount(event.target.value)} aria-label="Generate case count">
              <option value="1">1 case</option>
              <option value="5">5 cases</option>
              <option value="10">10 cases</option>
              <option value="25">25 cases</option>
            </select>
          </label>
          <button type="button" onClick={generateConfiguredCases} disabled={isGenerating || !generatorClaimType}>
            {isGenerating ? 'Generating cases...' : 'Generate cases'}
          </button>
        </div>

        {generatorClaimType && (
          <div className="case-generator-v2-context">
            <span><strong>Lane:</strong> {generatorClaimType.lane}</span>
            <span><strong>Packet includes:</strong> {generatorClaimType.evidenceAreas.slice(0, 3).join(' · ')}</span>
            <span><strong>Available tools:</strong> {generatorClaimType.availableTools.slice(0, 4).join(' · ')}</span>
          </div>
        )}
      </section>

      <section className="case-queue-summary" aria-label="Case queue summary">
        <article><strong>{cases.length}</strong><span>Total cases</span></article>
        <article><strong>{scopeCounts.active}</strong><span>Active</span></article>
        <article><strong>{scopeCounts.generated}</strong><span>Generated</span></article>
        <article><strong>{scopeCounts.completed}</strong><span>Completed</span></article>
      </section>

      <section
        id="case-queue-mobile-filters"
        className="case-queue-controls"
        data-mobile-expanded={mobileFiltersOpen}
        aria-label="Case queue controls"
      >
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
          <span>Claim lane</span>
          <select value={lane} onChange={(event) => setLane(event.target.value)} aria-label="Claim lane">
            <option value="all">All lanes</option>
            {laneOptions.map((item) => <option key={item} value={item}>{item}</option>)}
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
                      onClick={() => openQueueItem(item.id)}
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
                        {item.lane && <span>{item.lane}</span>}
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
                      onClick={() => previewQueueItem(item.id)}
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
                  setScope('active');
                  setPriority('all');
                  setLane('all');
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </section>

        {selectedCase && (
          <aside
            className="case-queue-preview"
            data-mobile-open={mobilePreviewOpen}
            aria-label="Selected case preview"
            aria-hidden={isMobileLayout() && !mobilePreviewOpen}
          >
            <button type="button" className="case-queue-preview-close" onClick={() => setMobilePreviewOpen(false)} aria-label="Close selected case preview">‹ Back to cases</button>
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
              <div><dt>Lane</dt><dd>{selectedCase.lane ?? 'Not supplied'}</dd></div>
              <div><dt>{['payroll-direct-deposit', 'email-bec'].includes(selectedCase.claimTypeId) ? 'Alert type' : 'Subtype'}</dt><dd>{selectedCase.subtype ?? 'Not supplied'}</dd></div>
              <div><dt>Reported</dt><dd>{selectedCase.reportedDate ?? selectedCase.opened}</dd></div>
              <div><dt>Documents</dt><dd>{documentSummary(selectedCase)}</dd></div>
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

            {selectedCase.chargebackDecision && (
              <section className="case-queue-credit-sla case-queue-chargeback-details" aria-label="Chargeback review details">
                <span>Chargeback review details</span>
                <dl>
                  <div><dt>Reason code guide</dt><dd>{selectedCase.chargebackDecision.reasonCode}</dd></div>
                  <div><dt>Response deadline</dt><dd>{selectedCase.chargebackDecision.responseDeadline}</dd></div>
                  <div><dt>Merchant packet</dt><dd>{selectedCase.chargebackDecision.merchantEvidence}</dd></div>
                  <div><dt>Review records</dt><dd>{selectedCase.chargebackDecision.authorizationReview}</dd></div>
                </dl>
              </section>
            )}

            {selectedCase.creditDecision && (
              <section className="case-queue-credit-sla" aria-label="Credit case review details">
                <span>Credit review details</span>
                <dl>
                  <div><dt>Deadline</dt><dd>{selectedCase.creditDecision.deadline}</dd></div>
                  <div><dt>Reason code</dt><dd>{selectedCase.creditDecision.reasonCode}</dd></div>
                  <div><dt>Documentation</dt><dd>{documentSummary(selectedCase)}</dd></div>
                  <div><dt>Escalation</dt><dd>{selectedCase.creditDecision.escalationPath}</dd></div>
                </dl>
              </section>
            )}

            <div className="case-queue-preview-meta">
              <span>{isGeneratedCase(selectedCase) ? 'Generated training case' : 'Built-in training case'}</span>
              <span>{selectedCase.opened}</span>
              <span>{selectedCase.trainingId}</span>
            </div>

            <button type="button" className="case-queue-primary-action" onClick={() => onOpenCase?.(selectedCase.id)}>
              Open Case Briefing <span aria-hidden="true">→</span>
            </button>
          </aside>
        )}
      </div>
    </section>
  );

  return createPortal(panel, panelHost);
}
