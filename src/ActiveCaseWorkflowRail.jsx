const workflowStages = [
  { key: 'briefing', step: '01', label: 'Case Briefing', icon: '▣' },
  { key: 'investigate', step: '02', label: 'Investigate', icon: '⌕' },
  { key: 'timeline', step: '03', label: 'Timeline', icon: '◷' },
  { key: 'indicators', step: '04', label: 'Indicators', icon: '⌘' },
  { key: 'determination', step: '05', label: 'Determination', icon: '◇' },
  { key: 'debrief', step: '06', label: 'Debrief', icon: '☾' },
];

export default function ActiveCaseWorkflowRail({ activeStage, stageStatus, onStageSelect }) {
  return (
    <nav className="ornate-card active-case-workflow" aria-label="Active case workflow">
      <div className="active-case-workflow-heading">
        <div>
          <p>Active case workflow</p>
          <h2>Move through the investigation in a clear, neutral order</h2>
        </div>
        <span aria-hidden="true">✦</span>
      </div>
      <ol className="active-case-workflow-list">
        {workflowStages.map((stage) => {
          const status = stageStatus[stage.key] ?? { label: 'Open', state: 'open' };
          const active = activeStage === stage.key;
          return (
            <li key={stage.key}>
              <button
                type="button"
                className={`${active ? 'active' : ''} ${status.state ?? 'open'}`}
                onClick={() => onStageSelect(stage.key)}
                aria-current={active ? 'step' : undefined}
                data-workflow-stage-button={stage.key}
              >
                <span className="workflow-stage-number">{stage.step}</span>
                <span className="workflow-stage-icon" aria-hidden="true">{stage.icon}</span>
                <strong>{stage.label}</strong>
                <small>{status.label}</small>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
