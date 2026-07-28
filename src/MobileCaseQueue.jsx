import { useEffect, useMemo, useState } from 'react';
import { claimGeneratorChoices } from './data/claimRegistry.js';
import { isValidReviewPackage } from './data/reviewPackage.js';
import { canonicalToolNames } from './investigationToolGroups.js';
import {
  publicAlertReason,
  publicCaseSearchText,
  publicCaseTaxonomy,
  publicScenarioLabel,
} from './data/publicCaseView.js';

const statusFilters = [
  ['all', 'All'],
  ['queue', 'My Queue'],
  ['progress', 'In Progress'],
  ['completed', 'Completed'],
];

function uniqueValues(items) {
  return [...new Set(items.filter(Boolean))];
}

function hasPackage(item, packagesByCase) {
  const packages = packagesByCase?.[item.id];
  return Array.isArray(packages)
    && packages.some((reviewPackage) => (
      (!reviewPackage.caseId || reviewPackage.caseId === item.id)
      && isValidReviewPackage(item, reviewPackage)
    ));
}

function queueState(item, activeCaseId, packagesByCase) {
  if (hasPackage(item, packagesByCase)) return 'Completed';
  if (item.id === activeCaseId || /review|progress|active/i.test(item.status ?? '')) return 'In Progress';
  if (/paused/i.test(item.status ?? '')) return 'Paused';
  return 'New';
}

function matchesStatus(item, filter, activeCaseId, packagesByCase) {
  const state = queueState(item, activeCaseId, packagesByCase);
  if (filter === 'all') return true;
  if (filter === 'queue') return state !== 'Completed';
  if (filter === 'progress') return state === 'In Progress';
  return state === 'Completed';
}

function openedTime(item) {
  const parsed = Date.parse(item.opened ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortCases(items, sortMode) {
  return [...items].sort((left, right) => {
    if (sortMode === 'oldest') return openedTime(left) - openedTime(right);
    if (sortMode === 'newest') return openedTime(right) - openedTime(left);
    if (sortMode === 'workflow') {
      return publicCaseTaxonomy(left).workflowType.localeCompare(publicCaseTaxonomy(right).workflowType);
    }
    const order = { High: 0, Medium: 1, Low: 2 };
    return (order[left.priority] ?? 3) - (order[right.priority] ?? 3)
      || openedTime(right) - openedTime(left);
  });
}

function QueueGlyph({ type }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (type === 'search') return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>;
  if (type === 'filter') return <svg {...common}><path d="M3 5h18l-7 8v6l-4 2v-8z" /></svg>;
  if (type === 'case') return <svg {...common}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M8 6V3h8v3M3 11h18" /></svg>;
  return <svg {...common}><path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5" /></svg>;
}

export default function MobileCaseQueue({
  activeCaseId,
  cases = [],
  claimTypes = [],
  completedByCase = {},
  onGenerateCases,
  onOpenCaseBriefing,
  onOpenCaseWorkspace,
  packagesByCase = {},
}) {
  const generatorChoices = useMemo(() => claimGeneratorChoices(), []);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [sortMode, setSortMode] = useState('priority');
  const [visibleCount, setVisibleCount] = useState(10);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [customerType, setCustomerType] = useState(generatorChoices[0]?.id ?? '');
  const firstCustomer = generatorChoices.find((item) => item.id === customerType) ?? generatorChoices[0];
  const [productType, setProductType] = useState(firstCustomer?.products[0]?.id ?? '');
  const selectedCustomer = generatorChoices.find((item) => item.id === customerType) ?? generatorChoices[0];
  const selectedProduct = selectedCustomer?.products.find((item) => item.id === productType) ?? selectedCustomer?.products[0];
  const [workflowType, setWorkflowType] = useState(selectedProduct?.workflows[0]?.id ?? '');
  const selectedWorkflow = selectedProduct?.workflows.find((item) => item.id === workflowType) ?? selectedProduct?.workflows[0];
  const [alertReason, setAlertReason] = useState('auto');
  const [scenarioId, setScenarioId] = useState('auto');
  const [difficulty, setDifficulty] = useState('standard');
  const [evidenceDepth, setEvidenceDepth] = useState('standard');
  const [count, setCount] = useState('1');
  const [isGenerating, setIsGenerating] = useState(false);

  const productOptions = useMemo(
    () => [...new Set(cases.map((item) => publicCaseTaxonomy(item).productType).filter(Boolean))].sort(),
    [cases],
  );
  const statusCounts = useMemo(
    () => Object.fromEntries(statusFilters.map(([key]) => [
      key,
      cases.filter((item) => matchesStatus(item, key, activeCaseId, packagesByCase)).length,
    ])),
    [activeCaseId, cases, packagesByCase],
  );
  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = cases.filter((item) => (
      (!normalizedQuery || publicCaseSearchText(item).includes(normalizedQuery))
      && matchesStatus(item, statusFilter, activeCaseId, packagesByCase)
      && (priorityFilter === 'all' || item.priority === priorityFilter)
      && (productFilter === 'all' || publicCaseTaxonomy(item).productType === productFilter)
    ));
    return sortCases(matches, sortMode);
  }, [
    activeCaseId,
    cases,
    packagesByCase,
    priorityFilter,
    productFilter,
    query,
    sortMode,
    statusFilter,
  ]);
  const visibleCases = filteredCases.slice(0, visibleCount);
  const selectedClaimType = claimTypes.find((item) => item.id === selectedWorkflow?.id);
  const alertReasons = uniqueValues((selectedWorkflow?.scenarios ?? []).map((scenario) => scenario.alertReason));
  const visibleScenarios = (selectedWorkflow?.scenarios ?? []).filter(
    (scenario) => alertReason === 'auto' || scenario.alertReason === alertReason,
  );
  const selectedScenario = visibleScenarios.find((scenario) => scenario.id === scenarioId);

  useEffect(() => {
    if (!generatorOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !isGenerating) setGeneratorOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [generatorOpen, isGenerating]);

  function changeCustomer(nextCustomerId) {
    const nextCustomer = generatorChoices.find((item) => item.id === nextCustomerId) ?? generatorChoices[0];
    const nextProduct = nextCustomer?.products[0];
    setCustomerType(nextCustomer?.id ?? '');
    setProductType(nextProduct?.id ?? '');
    setWorkflowType(nextProduct?.workflows[0]?.id ?? '');
    setAlertReason('auto');
    setScenarioId('auto');
  }

  function changeProduct(nextProductId) {
    const nextProduct = selectedCustomer?.products.find((item) => item.id === nextProductId)
      ?? selectedCustomer?.products[0];
    setProductType(nextProduct?.id ?? '');
    setWorkflowType(nextProduct?.workflows[0]?.id ?? '');
    setAlertReason('auto');
    setScenarioId('auto');
  }

  async function generateCases(event) {
    event.preventDefault();
    if (!onGenerateCases || !selectedWorkflow || isGenerating) return;
    setIsGenerating(true);
    try {
      await onGenerateCases({
        customerType: selectedCustomer.id,
        productType: selectedProduct.id,
        workflowType: selectedWorkflow.id,
        alertReason: alertReason === 'auto' ? selectedScenario?.alertReason : alertReason,
        reportedAllegation: selectedScenario?.reportedAllegation,
        scenarioId,
        difficulty,
        evidenceDepth,
        count,
      });
      setGeneratorOpen(false);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="mobile-case-queue" data-mobile-case-queue="reference-v1" aria-label="Case Queue">
      <header className="mobile-case-queue-title">
        <div>
          <p>Training investigations</p>
          <h1>Case Queue</h1>
        </div>
        <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} aria-controls="mobile-case-queue-filters">
          <QueueGlyph type="filter" /> Filters
        </button>
      </header>

      <label className="mobile-case-queue-search">
        <QueueGlyph type="search" />
        <span className="sr-only">Search cases</span>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(10);
          }}
          placeholder="Search cases, customers, IDs…"
        />
      </label>

      <nav className="mobile-case-queue-tabs" aria-label="Case queue status">
        {statusFilters.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={statusFilter === key ? 'active' : ''}
            aria-pressed={statusFilter === key}
            onClick={() => {
              setStatusFilter(key);
              setVisibleCount(10);
            }}
          >
            <span className="mobile-case-queue-tab-label">{label}</span>
            <span className="mobile-case-queue-tab-count">{statusCounts[key]}</span>
          </button>
        ))}
      </nav>

      {filtersOpen && (
        <section id="mobile-case-queue-filters" className="mobile-case-queue-filters" aria-label="Advanced case filters">
          <header><div><p>Advanced filters</p><h2>Narrow the operational queue</h2></div><button type="button" onClick={() => { setPriorityFilter('all'); setProductFilter('all'); setSortMode('priority'); }}>Reset</button></header>
          <div>
            <label><span>Priority</span><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="all">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></label>
            <label><span>Product</span><select value={productFilter} onChange={(event) => setProductFilter(event.target.value)}><option value="all">All products</option>{productOptions.map((product) => <option key={product}>{product}</option>)}</select></label>
            <label><span>Sort</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value)}><option value="priority">Priority first</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="workflow">Workflow</option></select></label>
          </div>
        </section>
      )}

      <button
        type="button"
        className="mobile-case-generator-toggle"
        onClick={() => setGeneratorOpen((open) => !open)}
        aria-expanded={generatorOpen}
        aria-controls="mobile-case-generator-dialog"
      >
        <span>＋</span>
        <span><strong>Create a fictional training case</strong><small>Configure a real Evidence First scenario</small></span>
        <em>{generatorOpen ? 'Close' : 'Open'}</em>
      </button>

      {generatorOpen && (
        <div
          className="mobile-case-generator-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !isGenerating) setGeneratorOpen(false);
          }}
        >
          <section
            id="mobile-case-generator-dialog"
            className="mobile-case-generator-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-case-generator-title"
          >
            <header>
              <div><p>Evidence First setup</p><h2 id="mobile-case-generator-title">Create a fictional training case</h2></div>
              <button type="button" autoFocus onClick={() => setGeneratorOpen(false)} disabled={isGenerating} aria-label="Close case generator">×</button>
            </header>
            <form className="mobile-case-generator" onSubmit={generateCases}>
              <label><span>Customer type</span><select value={selectedCustomer?.id ?? ''} onChange={(event) => changeCustomer(event.target.value)}>{generatorChoices.map((customer) => <option key={customer.id} value={customer.id}>{customer.label}</option>)}</select></label>
              <label><span>Product</span><select value={selectedProduct?.id ?? ''} onChange={(event) => changeProduct(event.target.value)}>{(selectedCustomer?.products ?? []).map((product) => <option key={product.id} value={product.id}>{product.label}</option>)}</select></label>
              <label><span>Review workflow</span><select value={selectedWorkflow?.id ?? ''} onChange={(event) => { setWorkflowType(event.target.value); setAlertReason('auto'); setScenarioId('auto'); }}>{(selectedProduct?.workflows ?? []).map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.label}</option>)}</select></label>
              <label><span>Alert reason</span><select value={alertReason} onChange={(event) => { setAlertReason(event.target.value); setScenarioId('auto'); }}><option value="auto">Auto · neutral workflow alert</option>{alertReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></label>
              <label><span>Scenario</span><select value={scenarioId} onChange={(event) => setScenarioId(event.target.value)}><option value="auto">Auto · rotate evidence variation</option>{visibleScenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{publicScenarioLabel(scenario)}</option>)}</select></label>
              <label><span>Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="light">Light</option><option value="standard">Standard</option><option value="deep">Deep</option></select></label>
              <label><span>Evidence depth</span><select value={evidenceDepth} onChange={(event) => setEvidenceDepth(event.target.value)}><option value="light">Light packet</option><option value="standard">Standard packet</option><option value="deep">Deep packet</option></select></label>
              <label><span>Cases</span><select value={count} onChange={(event) => setCount(event.target.value)}><option value="1">1 case</option><option value="5">5 cases</option><option value="10">10 cases</option><option value="25">25 cases</option></select></label>
              <p>{selectedClaimType?.evidenceAreas?.length ? `Packet areas: ${selectedClaimType.evidenceAreas.slice(0, 3).join(' · ')}` : 'The generated case uses fictional records and keeps the finding protected until submission.'}</p>
              <button type="submit" disabled={isGenerating || !selectedWorkflow}>{isGenerating ? 'Generating…' : 'Generate training case'}</button>
            </form>
          </section>
        </div>
      )}

      <div className="mobile-case-queue-results">
        {visibleCases.map((item) => {
          const taxonomy = publicCaseTaxonomy(item);
          const state = queueState(item, activeCaseId, packagesByCase);
          const mobileTools = canonicalToolNames(item.availableTools ?? item.requiredTools ?? [])
            .filter((tool) => !['KYB Review', 'System Access Lane'].includes(tool));
          const reviewedTools = new Set(canonicalToolNames(completedByCase[item.id] ?? []));
          const reviewed = mobileTools.filter((tool) => reviewedTools.has(tool)).length;
          const totalTools = mobileTools.length;
          return (
            <article key={item.id} className={item.id === activeCaseId ? 'active' : ''}>
              <header>
                <span data-priority={String(item.priority ?? 'Standard').toLowerCase()}>{item.priority ?? 'Standard'} priority</span>
                <small>{taxonomy.workflowType}</small>
              </header>
              <div className="mobile-case-card-main">
                <div>
                  <h2>{item.id}</h2>
                  <strong>{item.person}</strong>
                </div>
                <strong>{item.amountExposure ?? item.amount ?? 'Amount not supplied'}</strong>
              </div>
              <p>{publicAlertReason(item)}</p>
              <dl>
                <div><dt><QueueGlyph type="case" />Product</dt><dd>{taxonomy.productType}</dd></div>
                <div><dt>Opened</dt><dd>{item.opened ?? 'Not supplied'}</dd></div>
              </dl>
              <div className="mobile-case-card-progress">
                <span><i style={{ width: `${totalTools ? Math.min(100, (reviewed / totalTools) * 100) : 0}%` }} /></span>
                <small>{reviewed}/{totalTools} tools reviewed · {state}</small>
              </div>
              <nav aria-label={`${item.id} case actions`}>
                <button type="button" onClick={() => onOpenCaseBriefing(item.id)}>Case Briefing</button>
                <button type="button" className="primary" onClick={() => onOpenCaseWorkspace(item.id)}>Open Workspace</button>
              </nav>
            </article>
          );
        })}
        {!visibleCases.length && (
          <section className="mobile-case-queue-empty">
            <QueueGlyph type="document" />
            <h2>No matching cases</h2>
            <p>Adjust the safe queue filters or create a fictional training case.</p>
          </section>
        )}
      </div>

      <footer className="mobile-case-queue-footer">
        <span>Showing {visibleCases.length ? 1 : 0}–{visibleCases.length} of {filteredCases.length} cases</span>
        {visibleCases.length < filteredCases.length && <button type="button" onClick={() => setVisibleCount((countValue) => countValue + 10)}>Load More ↓</button>}
      </footer>
    </section>
  );
}
