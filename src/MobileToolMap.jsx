import { useEffect, useMemo, useRef, useState } from 'react';

const clusterDefinitions = [
  {
    key: 'identity',
    label: 'Identity & Customer',
    icon: 'identity',
    categoryKeys: ['identity'],
  },
  {
    key: 'access',
    label: 'Login, Session, Device & IP',
    icon: 'device',
    categoryKeys: ['digital'],
  },
  {
    key: 'financial',
    label: 'Transactions & Financial',
    icon: 'card',
    categoryKeys: ['financial', 'merchant'],
  },
  {
    key: 'business',
    label: 'Business & Payment Verification',
    icon: 'business',
    categoryKeys: ['business'],
  },
  {
    key: 'evidence',
    label: 'Evidence & Workflow',
    icon: 'folder',
    categoryKeys: ['evidence', 'connections'],
    additionalTools: ['Timeline'],
  },
];

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function MapGlyph({ type }) {
  const common = {
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (type === 'identity') {
    return <svg {...common}><circle cx="24" cy="16" r="8" /><path d="M9 41c1.6-10 6.7-14 15-14s13.4 4 15 14" /></svg>;
  }
  if (type === 'device') {
    return <svg {...common}><rect x="14" y="4" width="20" height="40" rx="4" /><path d="M20 9h8M21 38h6" /></svg>;
  }
  if (type === 'card') {
    return <svg {...common}><rect x="5" y="10" width="38" height="28" rx="4" /><path d="M5 18h38M11 31h12" /></svg>;
  }
  if (type === 'business') {
    return <svg {...common}><path d="M7 43V17h34v26M14 17V7h20v10M3 43h42M14 25h5M29 25h5M14 33h5M29 33h5" /></svg>;
  }
  if (type === 'folder') {
    return <svg {...common}><path d="M5 12h16l4 5h18v25H5zM5 17h38" /></svg>;
  }
  return <svg {...common}><path d="M10 7h28v34H10zM16 15h16M16 22h16M16 29h10" /></svg>;
}

export default function MobileToolMap({
  activeCase,
  activeTool,
  availableTools = [],
  categories = [],
  completedTools = [],
  onOpenDecision,
  onOpenIndicators,
  onOpenNotes,
  onOpenOverview,
  onOpenPinnedEvidence,
  onOpenTool,
}) {
  const toolTrayRef = useRef(null);
  const available = useMemo(() => new Set(availableTools), [availableTools]);
  const categoryByKey = useMemo(
    () => new Map(categories.map((category) => [category.key, category])),
    [categories],
  );
  const clusters = useMemo(() => clusterDefinitions
    .map((cluster) => {
      const tools = unique([
        ...cluster.categoryKeys.flatMap((key) => categoryByKey.get(key)?.tools ?? []),
        ...(cluster.additionalTools ?? []).filter((tool) => available.has(tool)),
      ]).filter((tool) => available.has(tool));
      return {
        ...cluster,
        tools,
        reviewed: tools.filter((tool) => completedTools.includes(tool)).length,
      };
    })
    .filter((cluster) => cluster.tools.length), [available, categoryByKey, completedTools]);
  const [selectedClusterKey, setSelectedClusterKey] = useState('');
  const previousCaseIdRef = useRef(activeCase.id);
  const selectedCluster = clusters.find((cluster) => cluster.key === selectedClusterKey) ?? null;
  const reviewedTotal = availableTools.filter((tool) => completedTools.includes(tool)).length;

  useEffect(() => {
    const activeCaseChanged = previousCaseIdRef.current !== activeCase.id;
    const selectionIsAvailable = (
      !selectedClusterKey
      || clusters.some((cluster) => cluster.key === selectedClusterKey)
    );

    if (activeCaseChanged || !selectionIsAvailable) {
      setSelectedClusterKey('');
    }

    previousCaseIdRef.current = activeCase.id;
  }, [
    activeCase.id,
    clusters,
    selectedClusterKey,
  ]);

  function selectCluster(clusterKey) {
    setSelectedClusterKey(clusterKey);
    window.setTimeout(() => toolTrayRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    }), 0);
  }

  return (
    <section
      className="mobile-tool-map"
      data-mobile-tool-map="reference-v1"
      aria-label={`Investigation Tool Map for ${activeCase.id}`}
    >
      <header className="mobile-tool-map-heading">
        <div>
          <p>Connected investigation areas</p>
          <h2>Tool Map</h2>
          <span>{activeCase.id} · Choose a factual source before recording a finding.</span>
        </div>
        <strong>Evidence First</strong>
      </header>

      <div className="mobile-tool-map-canvas">
        <svg className="mobile-tool-map-connectors" viewBox="0 0 360 630" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="tool-map-line" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#9a70ff" />
              <stop offset=".5" stopColor="#32cfff" />
              <stop offset="1" stopColor="#45ebcf" />
            </linearGradient>
          </defs>
          <path d="M180 232 86 75M180 232l94-157M180 232 74 389M180 232l106 157M180 232v323" />
          <circle cx="180" cy="232" r="141" />
          <circle cx="180" cy="232" r="96" />
        </svg>

        {clusters.map((cluster) => (
          <button
            key={cluster.key}
            type="button"
            className={`mobile-tool-map-cluster mobile-tool-map-cluster-${cluster.key}${selectedCluster?.key === cluster.key ? ' active' : ''}`}
            onClick={() => selectCluster(cluster.key)}
            aria-label={`Open ${cluster.label} tool group`}
            aria-pressed={selectedCluster?.key === cluster.key}
            aria-expanded={selectedCluster?.key === cluster.key}
            aria-controls="mobile-tool-map-tray"
          >
            <span><MapGlyph type={cluster.icon} /></span>
            <strong>{cluster.label}</strong>
            <small>Reviewed {cluster.reviewed}/{cluster.tools.length}</small>
            <em>{cluster.reviewed === cluster.tools.length ? 'All reviewed' : cluster.reviewed ? 'In progress' : 'Open'}</em>
          </button>
        ))}

        <button type="button" className="mobile-tool-map-overview" onClick={onOpenOverview} aria-label="Open Case Overview from Tool Map">
          <span><MapGlyph type="overview" /></span>
          <strong>Case Overview</strong>
          <small>{reviewedTotal}/{availableTools.length} tools reviewed</small>
        </button>
      </div>

      {selectedCluster && (
        <section
          id="mobile-tool-map-tray"
          ref={toolTrayRef}
          className="mobile-tool-map-tray"
          data-mobile-tool-map-sheet="true"
          aria-label={`${selectedCluster.label} tools`}
        >
          <header>
            <div>
              <p>Selected investigation area</p>
              <h3>{selectedCluster.label}</h3>
            </div>
            <div className="mobile-tool-map-tray-actions">
              <span>{selectedCluster.reviewed}/{selectedCluster.tools.length} reviewed</span>
              <button
                type="button"
                onClick={() => setSelectedClusterKey('')}
                aria-label="Close selected tool group"
              >
                ×
              </button>
            </div>
          </header>
          <div>
            {selectedCluster.tools.map((tool) => (
              <button
                key={tool}
                type="button"
                className={activeTool === tool ? 'active' : ''}
                onClick={() => onOpenTool(tool)}
                aria-label={`Open ${tool}`}
              >
                <span>{completedTools.includes(tool) ? '✓' : '→'}</span>
                <strong>{tool}</strong>
                <small>{completedTools.includes(tool) ? 'Reviewed' : 'Open factual records'}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      <nav className="mobile-tool-map-workflow" aria-label="Evidence and workflow pages">
        <button type="button" onClick={onOpenPinnedEvidence} aria-label="Open Pinned Evidence from Tool Map"><span>☆</span><strong>Pinned Evidence</strong></button>
        <button type="button" onClick={onOpenNotes} aria-label="Open Case Notes from Tool Map"><span>▤</span><strong>Case Notes</strong></button>
        <button type="button" onClick={onOpenIndicators} aria-label="Open Indicators from Tool Map"><span>◈</span><strong>Indicators</strong></button>
        <button type="button" onClick={onOpenDecision} aria-label="Open Determination from Tool Map"><span>✓</span><strong>Determination</strong></button>
      </nav>
    </section>
  );
}
