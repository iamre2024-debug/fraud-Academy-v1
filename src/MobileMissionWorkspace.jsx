import { useRef } from 'react';
import BottomInvestigationGrid from './BottomInvestigationGrid.jsx';
import CategoryTileRail from './CategoryTileRail.jsx';
import DecisionFlagChecklist from './DecisionFlagChecklist.jsx';
import InvestigationToolPanel from './InvestigationToolPanel.jsx';
import MobileLinkAnalysisPanel from './MobileLinkAnalysisPanel.jsx';
import MobileLunaPortrait, { MobileFraudShield } from './MobileLunaPortrait.jsx';
import MobileMissionCaseBriefing from './MobileMissionCaseBriefing.jsx';
import {
  MobileBusiness360Page,
  MobileCustomer360Page,
  MobileEmployeeProfilePage,
  MobileFinancialInvestigationPage,
  MobilePayrollHistoryPage,
} from './MobileReferenceToolPages.jsx';
import SubmitDecisionPanel from './SubmitDecisionPanel.jsx';
import TimelinePanel from './TimelinePanel.jsx';

const screenCopy = {
  briefing: ['🗃️', 'Case Briefing'],
  workflow: ['🧭', 'Mission Path'],
  'tool-menu': ['🧬', 'Evidence Map'],
  evidence: ['⭐', 'Pinned Evidence'],
  notes: ['📝', 'Case Notes'],
  indicators: ['◇', 'Case Indicators'],
  determination: ['✅', 'Submit Decision'],
  debrief: ['🌙', 'Luna Debrief'],
};

const openMobileSettingsEvent = 'fraud-academy:open-mobile-settings';

const missionStages = [
  ['briefing', '🗃️', 'Briefing', 'Read the intake and statement'],
  ['investigate', '🧬', 'Investigate', 'Choose evidence tools'],
  ['timeline', '⏱️', 'Timeline', 'Sequence the activity'],
  ['indicators', '⭐', 'Indicators', 'Review factual case indicators'],
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
  documentRequests,
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
  removeUnavailablePinnedEvidence,
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
  const overflowRef = useRef(null);
  const mobileToolName = (tool) => tool === 'KYB Review' ? 'Business Intelligence' : tool;
  const internalToolName = (tool) => tool === 'Business Intelligence' ? 'KYB Review' : tool;
  const displayedTool = mobileToolName(activeTool);
  const mobileVisibleCategories = (visibleCategories ?? []).map((category) => ({
    ...category,
    tools: (category.tools ?? []).map(mobileToolName).filter((tool, index, tools) => tools.indexOf(tool) === index),
  }));
  const mobileCompleted = (currentCompleted ?? []).map(mobileToolName);
  const mobileGroupTools = (activeToolProps.activeCategory?.tools ?? [])
    .map(mobileToolName)
    .filter((tool, index, tools) => tools.indexOf(tool) === index);
  const [screenIcon, screenTitle] = workspaceScreen === 'tool' || workspaceScreen === 'timeline'
    ? [workspaceScreen === 'timeline' ? '⏱️' : toolIcon(displayedTool), workspaceScreen === 'timeline' ? 'Case Timeline' : displayedTool]
    : screenCopy[workspaceScreen] ?? ['🛰️', 'Mission Workspace'];
  const isRoot = workspaceScreen === 'briefing';
  const isTool = workspaceScreen === 'tool' || workspaceScreen === 'timeline';
  const screenSubtitle = isTool
    ? 'Factual records · Evidence First'
    : workspaceScreen === 'briefing'
      ? 'Read the allegation before reviewing evidence'
      : workspaceScreen === 'determination'
        ? 'Operational decision and final finding'
        : 'Case-specific investigation workspace';
  const referenceToolProps = {
    ...activeToolProps,
    reviewed: currentCompleted.includes(activeTool),
  };

  function openDisplaySettings() {
    overflowRef.current?.removeAttribute('open');
    window.dispatchEvent(new CustomEvent(openMobileSettingsEvent));
  }

  function runOverflowAction(action) {
    overflowRef.current?.removeAttribute('open');
    action();
  }

  return (
    <main className="mission-workspace-v3" data-workspace-screen={workspaceScreen} data-active-tool={displayedTool}>
      <header className="mission-workspace-bar">
        <button
          type="button"
          className="mission-workspace-back"
          onClick={isRoot ? openCaseQueue : goBackWorkspaceScreen}
          aria-label={isRoot ? 'Back to case queue' : 'Back to previous mission screen'}
        >
          ‹
        </button>
        <div className="mission-workspace-title">
          <MobileFraudShield size={27} />
          <p>{activeCase.id}</p><h1>{screenTitle}</h1><small>{screenSubtitle}</small>
        </div>
        <MobileLunaPortrait size={38} className="mission-workspace-luna" />
        <details ref={overflowRef} className="mission-workspace-overflow">
          <summary role="button" aria-label="Open workspace menu">•••</summary>
          <section>
            <header><span>{screenIcon}</span><div><small>Current tool</small><strong>{screenTitle}</strong></div></header>
            <label className="mission-overflow-case mission-workspace-case-selector">
              <span>Active case</span>
              <select value={activeCase.id} onChange={(event) => runOverflowAction(() => changeCase(event.target.value))} aria-label="Choose active mission case">
                {cases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.person}</option>)}
              </select>
            </label>
            {isTool && mobileGroupTools.length > 1 && (
              <label className="mission-overflow-tool">
                <span>Tool in this group</span>
                <select value={displayedTool} onChange={(event) => runOverflowAction(() => openTool(internalToolName(event.target.value)))} aria-label="Choose mobile investigation tool">
                  {mobileGroupTools.map((toolName) => <option key={toolName} value={toolName}>{toolName}</option>)}
                </select>
              </label>
            )}
            <nav aria-label="Workspace shortcuts">
              <button type="button" onClick={() => runOverflowAction(() => showWorkspaceScreen('briefing'))}>▤ <span>Briefing</span></button>
              <button type="button" onClick={() => runOverflowAction(() => showWorkspaceScreen('workflow'))}>⌁ <span>Path</span></button>
              <button type="button" onClick={() => runOverflowAction(() => showWorkspaceScreen('tool-menu'))}>⊞ <span>All tools</span></button>
              <button type="button" onClick={() => runOverflowAction(openNotes)}>✎ <span>Notes</span><b>{notes.length}</b></button>
              <button type="button" onClick={() => runOverflowAction(() => showWorkspaceScreen('evidence'))}>★ <span>Pinned</span><b>{tray.length}</b></button>
              <button type="button" onClick={() => runOverflowAction(jumpDecision)}>✓ <span>Decide</span></button>
              <button type="button" onClick={openDisplaySettings}>⚙ <span>Display</span></button>
            </nav>
          </section>
        </details>
      </header>

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
            onOpenSettings={openDisplaySettings}
            onSelect={selectWorkflowStage}
            stageStatus={stageStatus}
          />
        )}

        {workspaceScreen === 'tool-menu' && (
          <section className="mission-evidence-page" data-workflow-stage="investigate" data-workspace-page="tool-menu">
            <header className="mission-evidence-heading"><span>🧬</span><div><p>Connected evidence map</p><h2>Choose where to investigate</h2><small>Every tool opens as its own full mission screen.</small></div></header>
            <CategoryTileRail
              activeCase={activeCase}
              categories={mobileVisibleCategories}
              categoryKey={categoryKey}
              currentCompleted={mobileCompleted}
              onNavigate={onNavigate}
              onInvestigate={() => showWorkspaceScreen('tool')}
              setCategoryKey={setCategoryKey}
              setTool={(tool) => setTool(internalToolName(tool))}
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
            data-workspace-page={workspaceScreen === 'timeline' ? 'timeline' : 'tool'}
          >
            {openedPinnedEvidence && !openedPinnedEvidence.unresolved && (
              <section className="mission-opened-pin" data-opened-pinned-evidence="true">
                <div><p>Opened from pinned evidence</p><h2>{openedPinnedEvidence.value}</h2><small>Source: {openedPinnedEvidence.tool}</small></div>
                <button type="button" onClick={returnToPinnedEvidence}>Back to pins</button>
              </section>
            )}
            {activeTool === 'Document Request' && <MissionDocumentRequestHeading activeCase={activeCase} documentRequests={documentRequests} />}
            {activeTool === 'Login History' && <MissionLoginHistoryHeading activeCase={activeCase} />}
            <div className="mission-tool-content">
              {activeTool === 'Customer 360' ? (
                <MobileCustomer360Page {...referenceToolProps} />
              ) : activeTool === 'Business 360' ? (
                <MobileBusiness360Page {...referenceToolProps} />
              ) : activeTool === 'Financial Investigation' ? (
                <MobileFinancialInvestigationPage {...referenceToolProps} />
              ) : activeTool === 'Employee Profile' ? (
                <MobileEmployeeProfilePage {...referenceToolProps} />
              ) : activeTool === 'Payroll History' ? (
                <MobilePayrollHistoryPage {...referenceToolProps} />
              ) : activeTool === 'Link Analysis' ? (
                <MobileLinkAnalysisPanel {...referenceToolProps} />
              ) : activeTool === 'Timeline' ? (
                <TimelinePanel {...activeToolProps} />
              ) : (
                <InvestigationToolPanel
                  {...activeToolProps}
                  tool={displayedTool}
                  layoutMode="mobile"
                  openTool={(toolName, ...args) => openTool(internalToolName(toolName), ...args)}
                />
              )}
            </div>
          </section>
        )}

        {(workspaceScreen === 'evidence' || workspaceScreen === 'notes') && (
          <section
            className="mission-evidence-notebook"
            data-workflow-stage="indicators"
            data-workspace-page="indicators"
            data-mobile-indicator-view={workspaceScreen}
          >
            <header><span>{workspaceScreen === 'evidence' ? '⭐' : '📝'}</span><div><p>Case fieldwork</p><h2>{workspaceScreen === 'evidence' ? 'Pinned evidence deck' : 'Investigation notebook'}</h2></div></header>
            {workspaceScreen === 'evidence' && openedPinnedEvidence?.unresolved && (
              <section className="pinned-evidence-unavailable" role="alert">
                <div>
                  <p>Source record unavailable</p>
                  <h2>{openedPinnedEvidence.value}</h2>
                  <span>This pin is still saved, but its source record is not available in this case.</span>
                </div>
                <nav aria-label="Unavailable pinned evidence actions">
                  <button type="button" onClick={() => openPinnedEvidence(openedPinnedEvidence.value)}>Retry source lookup</button>
                  <button type="button" onClick={() => removeUnavailablePinnedEvidence(openedPinnedEvidence.value)}>Remove pin</button>
                </nav>
              </section>
            )}
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

        {workspaceScreen === 'indicators' && (
          <section
            className="mission-indicators-review"
            data-workflow-stage="indicators"
            data-workspace-page="indicators-review"
          >
            <header className="mission-indicators-heading">
              <div>
                <p>Case Indicators Review</p>
                <h2>Review cues and document what the records support</h2>
                <small>No conclusion is selected for you.</small>
              </div>
              <MobileLunaPortrait size={52} />
            </header>

            <section className="mission-indicator-cues" aria-label="Case claim type cues">
              <header><span>◇</span><h3>Claim type cues</h3></header>
              <div>
                <article><span>Claim type</span><strong>{activeCase.claimType ?? activeCase.type}</strong></article>
                <article><span>Scenario</span><strong>{activeCase.scenarioTitle ?? activeCase.subtype ?? 'Case review'}</strong></article>
                <article><span>Case status</span><strong>{activeCase.status}</strong></article>
              </div>
            </section>

            <DecisionFlagChecklist
              activeCase={activeCase}
              tray={tray}
              decisionDraft={decisionDraft}
              indicatorSummary={packageStatus.indicatorSummary}
              updateDecisionIndicator={updateDecisionIndicator}
            />

            <section className="mission-indicator-notes" aria-label="Evidence notes summary">
              <header><span>✎</span><div><p>Evidence notes</p><h3>{notes.length} saved note{notes.length === 1 ? '' : 's'} · {tray.length} pinned record{tray.length === 1 ? '' : 's'}</h3></div></header>
              <div>
                {(notes.length ? notes.slice(0, 3) : ['No investigator note saved yet.']).map((note, index) => (
                  <article key={`${note}-${index}`}><span>{index + 1}</span><p>{note}</p></article>
                ))}
              </div>
              <nav>
                <button type="button" onClick={() => showWorkspaceScreen('evidence')}>Review pinned evidence</button>
                <button type="button" onClick={openNotes}>Open case notes</button>
                <button type="button" onClick={jumpDecision}>Continue to Determination</button>
              </nav>
            </section>
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
              layoutMode="mobile"
              showChecklist={false}
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

function documentRequestProgress(documentRequests = {}) {
  const attempts = Object.values(documentRequests).flatMap((request) => request?.attempts ?? []);
  if (!attempts.length) return 0;
  if (attempts.some((attempt) => attempt.customerSubmission?.pages?.length)) return 2;
  return 1;
}

function MissionDocumentRequestHeading({ activeCase, documentRequests }) {
  const activeStep = documentRequestProgress(documentRequests);
  const steps = ['Request', 'Receive', 'Review'];
  return (
    <header className="mission-document-request-heading">
      <span className="mission-document-request-icon" aria-hidden="true">📨</span>
      <div>
        <p>Paperwork mission · {activeCase.id}</p>
        <h2>Document Request</h2>
        <small>Send a request, track the customer response, then review the returned source document.</small>
      </div>
      <ol aria-label="Document request workflow">
        {steps.map((step, index) => (
          <li
            key={step}
            className={index < activeStep ? 'complete' : index === activeStep ? 'active' : ''}
            aria-current={index === activeStep ? 'step' : undefined}
            data-document-request-step={step.toLowerCase()}
          >
            <i />{step}
          </li>
        ))}
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

function MissionPath({ activeCase, activeStage, onOpenSettings, onSelect, stageStatus }) {
  return (
    <section className="mission-path-v3" data-workspace-page="workflow">
      <header><span>🧭</span><div><p>{activeCase.id}</p><h2>Investigation mission path</h2><small>Jump between pages without losing your place.</small></div></header>
      <button type="button" className="mission-path-settings" aria-label="Display settings" onClick={onOpenSettings}>
        <span aria-hidden="true">🎛️</span>
        <span><strong>Display settings</strong><small>Layout, motion, sync, and Luna access</small></span>
        <em aria-hidden="true">Open ›</em>
      </button>
      <div className="mission-path-line" aria-hidden="true"><i /><i /><i /></div>
      <div className="mission-path-list">
        {missionStages.map(([key, icon, title, detail], index) => (
          <button
            key={key}
            type="button"
            className={activeStage === key ? 'active' : ''}
            onClick={() => onSelect(key)}
            disabled={stageStatus[key]?.state === 'locked'}
            aria-disabled={stageStatus[key]?.state === 'locked' ? 'true' : undefined}
          >
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
