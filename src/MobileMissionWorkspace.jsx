import BottomInvestigationGrid from './BottomInvestigationGrid.jsx';
import CategoryTileRail from './CategoryTileRail.jsx';
import Customer360Panel from './Customer360Panel.jsx';
import InvestigationToolPanel from './InvestigationToolPanel.jsx';
import MobileMissionCaseBriefing from './MobileMissionCaseBriefing.jsx';
import SubmitDecisionPanel from './SubmitDecisionPanel.jsx';
import TimelinePanel from './TimelinePanel.jsx';

const screenCopy = {
  briefing: ['🗃️', 'Case Briefing'],
  workflow: ['🧭', 'Mission Path'],
  'tool-menu': ['🧬', 'Evidence Map'],
  evidence: ['⭐', 'Pinned Evidence'],
  notes: ['📝', 'Case Notes'],
  determination: ['✅', 'Submit Decision'],
  debrief: ['🌙', 'Luna Debrief'],
};

const missionStages = [
  ['briefing', '🗃️', 'Briefing', 'Read the intake and statement'],
  ['investigate', '🧬', 'Investigate', 'Choose evidence tools'],
  ['timeline', '⏱️', 'Timeline', 'Sequence the activity'],
  ['indicators', '⭐', 'Evidence', 'Review pins and notes'],
  ['determination', '✅', 'Decision', 'Submit the learner package'],
  ['debrief', '🌙', 'Debrief', 'Unlock manager coaching'],
];

export default function MobileMissionWorkspace({
  activeCase,
  activeStage,
  activeTool,
  activeToolProps,
  actionLog,
  cases,
  categoryKey,
  changeCase,
  currentCompleted,
  decisionDraft,
  goBackWorkspaceScreen,
  jumpDecision,
  noteDraft,
  notes,
  onNavigate,
  openCaseQueue,
  openDebrief,
  openedPinnedEvidence,
  openMoreTools,
  openNotes,
  openPinnedEvidence,
  openTool,
  packageStatus,
  pin,
  recordAction,
  removePin,
  returnToPinnedEvidence,
  reviewPackages,
  selectWorkflowStage,
  setCategoryKey,
  setExpandedId,
  setNoteDraft,
  setTool,
  showWorkspaceScreen,
  stageStatus,
  submitDecision,
  submitNote,
  submitRef,
  tray,
  updateDecision,
  updateDecisionIndicator,
  visibleCategories,
  workspaceScreen,
}) {
  const [screenIcon, screenTitle] = workspaceScreen === 'tool' || workspaceScreen === 'timeline'
    ? [workspaceScreen === 'timeline' ? '⏱️' : toolIcon(activeTool), workspaceScreen === 'timeline' ? 'Case Timeline' : activeTool]
    : screenCopy[workspaceScreen] ?? ['🛰️', 'Mission Workspace'];
  const isRoot = workspaceScreen === 'briefing';
  const isTool = workspaceScreen === 'tool' || workspaceScreen === 'timeline';

  return (
    <main className="mission-workspace-v3" data-workspace-screen={workspaceScreen} data-active-tool={activeTool}>
      <header className="mission-workspace-bar">
        <button type="button" className="mission-workspace-back" disabled={isRoot} onClick={goBackWorkspaceScreen} aria-label="Back to previous mission screen">‹</button>
        <div><span>{screenIcon}</span><p>{activeCase.id}</p><h1>{screenTitle}</h1></div>
        <button type="button" className={workspaceScreen === 'workflow' ? 'active' : ''} onClick={() => workspaceScreen === 'workflow' ? goBackWorkspaceScreen() : showWorkspaceScreen('workflow')} aria-label="Open mission pages">☷</button>
      </header>

      <section className="mission-workspace-case-selector" aria-label="Active mission file">
        <span>ACTIVE FILE</span>
        <label className="visual-case-switcher">
          <select value={activeCase.id} onChange={(event) => changeCase(event.target.value)} aria-label="Choose active mission case">
            {cases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.person}</option>)}
          </select>
        </label>
        <strong>{activeCase.status}</strong>
      </section>

      <div className="mission-workspace-surface">
        {workspaceScreen === 'briefing' && (
          <MobileMissionCaseBriefing
            activeCase={activeCase}
            jumpDecision={jumpDecision}
            openMoreTools={openMoreTools}
            openNotes={openNotes}
            openQueue={openCaseQueue}
            openTool={openTool}
            pin={pin}
            recordAction={recordAction}
          />
        )}

        {workspaceScreen === 'workflow' && (
          <MissionPath
            activeCase={activeCase}
            activeStage={activeStage}
            onSelect={selectWorkflowStage}
            stageStatus={stageStatus}
          />
        )}

        {workspaceScreen === 'tool-menu' && (
          <section className="mission-evidence-page" data-workflow-stage="investigate">
            <header className="mission-evidence-heading"><span>🧬</span><div><p>Connected evidence map</p><h2>Choose where to investigate</h2><small>Every tool opens as its own full mission screen.</small></div></header>
            <CategoryTileRail
              activeCase={activeCase}
              categories={visibleCategories}
              categoryKey={categoryKey}
              currentCompleted={currentCompleted}
              onNavigate={onNavigate}
              onInvestigate={() => showWorkspaceScreen('tool')}
              setCategoryKey={setCategoryKey}
              setTool={setTool}
              setExpandedId={setExpandedId}
            />
          </section>
        )}

        {isTool && (
          <section
            className={[
              'mission-tool-page',
              activeTool === 'Document Request' ? 'mission-document-request-page' : '',
              activeTool === 'Login History' ? 'mission-login-history-page' : '',
            ].filter(Boolean).join(' ')}
            data-document-request-page={activeTool === 'Document Request' ? 'true' : undefined}
            data-login-history-page={activeTool === 'Login History' ? 'true' : undefined}
            data-workflow-stage={workspaceScreen === 'timeline' ? 'timeline' : 'investigate'}
          >
            <nav className="mission-tool-actions" aria-label="Tool page actions">
              <button type="button" onClick={() => showWorkspaceScreen('tool-menu')}>🧰 All tools</button>
              <button type="button" onClick={openNotes}>📝 Notes <span>{notes.length}</span></button>
              <button type="button" onClick={jumpDecision}>✅ Decide</button>
            </nav>
            {openedPinnedEvidence && !openedPinnedEvidence.unresolved && (
              <section className="mission-opened-pin" data-opened-pinned-evidence="true">
                <div><p>Opened from pinned evidence</p><h2>{openedPinnedEvidence.value}</h2><small>Source: {openedPinnedEvidence.tool}</small></div>
                <button type="button" onClick={returnToPinnedEvidence}>Back to pins</button>
              </section>
            )}
            {activeTool === 'Document Request' && <MissionDocumentRequestHeading activeCase={activeCase} />}
            {activeTool === 'Login History' && <MissionLoginHistoryHeading activeCase={activeCase} />}
            <div className="mission-tool-content">
              {activeTool === 'Customer 360' ? (
                <Customer360Panel {...activeToolProps} />
              ) : activeTool === 'Timeline' ? (
                <TimelinePanel {...activeToolProps} />
              ) : (
                <InvestigationToolPanel {...activeToolProps} />
              )}
            </div>
          </section>
        )}

        {(workspaceScreen === 'evidence' || workspaceScreen === 'notes') && (
          <section className="mission-evidence-notebook" data-workflow-stage="indicators">
            <header><span>{workspaceScreen === 'evidence' ? '⭐' : '📝'}</span><div><p>Case fieldwork</p><h2>{workspaceScreen === 'evidence' ? 'Pinned evidence deck' : 'Investigation notebook'}</h2></div></header>
            <BottomInvestigationGrid
              tray={tray}
              removePin={removePin}
              onOpenPinned={openPinnedEvidence}
              noteDraft={noteDraft}
              setNoteDraft={setNoteDraft}
              submitNote={submitNote}
              notes={notes}
              mobileView={workspaceScreen}
              onMobileViewChange={showWorkspaceScreen}
            />
          </section>
        )}

        {workspaceScreen === 'determination' && (
          <section className="mission-decision-page" data-workflow-stage="determination">
            <header className="mission-decision-page-heading"><span>✅</span><div><p>Final mission path</p><h2>Build the decision package</h2><small>The outcome remains protected until you submit.</small></div></header>
            <SubmitDecisionPanel
              submitRef={submitRef}
              packageStatus={packageStatus}
              tray={tray}
              notes={notes}
              reviewPackages={reviewPackages}
              decisionDraft={decisionDraft}
              activeCase={activeCase}
              updateDecision={updateDecision}
              updateDecisionIndicator={updateDecisionIndicator}
              submitDecision={submitDecision}
              openDebrief={openDebrief}
            />
          </section>
        )}

        {workspaceScreen === 'debrief' && <div className="decision-luna-portal-anchor" />}
        {workspaceScreen !== 'debrief' && <div className="decision-luna-portal-anchor" hidden />}
      </div>

      <footer className="mission-workspace-status">
        <span>⭐ {tray.length} pinned</span><span>📝 {notes.length} notes</span><span>📡 {actionLog.length} actions</span>
      </footer>
    </main>
  );
}

function MissionDocumentRequestHeading({ activeCase }) {
  return (
    <header className="mission-document-request-heading">
      <span className="mission-document-request-icon" aria-hidden="true">📨</span>
      <div>
        <p>Paperwork mission · {activeCase.id}</p>
        <h2>Document Request</h2>
        <small>Send a request, track the customer response, then review the returned source document.</small>
      </div>
      <ol aria-label="Document request workflow">
        <li className="active"><i />Request</li>
        <li><i />Receive</li>
        <li><i />Review</li>
      </ol>
    </header>
  );
}

function MissionLoginHistoryHeading({ activeCase }) {
  return (
    <header className="mission-login-history-heading">
      <span className="mission-login-history-icon" aria-hidden="true">🛡️</span>
      <div>
        <p>Authentication mission · {activeCase.id}</p>
        <h2>Login History</h2>
        <small>Trace the access attempt, compare authentication signals, and connect the session without deciding the claim early.</small>
      </div>
      <ol aria-label="Login history evidence workflow">
        <li className="active"><i />Locate</li>
        <li><i />Compare</li>
        <li><i />Connect</li>
        <li><i />Document</li>
      </ol>
    </header>
  );
}

function MissionPath({ activeCase, activeStage, onSelect, stageStatus }) {
  return (
    <section className="mission-path-v3">
      <header><span>🧭</span><div><p>{activeCase.id}</p><h2>Investigation mission path</h2><small>Jump between pages without losing your place.</small></div></header>
      <div className="mission-path-line" aria-hidden="true"><i /><i /><i /></div>
      <div className="mission-path-list">
        {missionStages.map(([key, icon, title, detail], index) => (
          <button key={key} type="button" className={activeStage === key ? 'active' : ''} onClick={() => onSelect(key)}>
            <span>{icon}</span>
            <span><small>0{index + 1}</small><strong>{title}</strong><p>{detail}</p></span>
            <em data-state={stageStatus[key]?.state}>{stageStatus[key]?.label}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function toolIcon(tool) {
  if (/document/i.test(tool)) return '📁';
  if (/customer|identity|employee/i.test(tool)) return '👤';
  if (/device|login|session|ip/i.test(tool)) return '📱';
  if (/financial|transaction|payment|payroll/i.test(tool)) return '💳';
  if (/business|merchant|kyb/i.test(tool)) return '🏢';
  if (/link/i.test(tool)) return '🧬';
  return '🔎';
}
