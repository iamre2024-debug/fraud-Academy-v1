import { useEffect, useRef, useState } from 'react';
import BottomInvestigationGrid from './BottomInvestigationGrid.jsx';
import CategoryTileRail from './CategoryTileRail.jsx';
import InvestigationToolPanel from './InvestigationToolPanel.jsx';
import {
  Mobile360LunaBadge,
  MobileBusiness360Reference,
  MobileCustomer360Reference,
} from './Mobile360ReferencePages.jsx';
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
  const [screenIcon, screenTitle] = workspaceScreen === 'tool' || workspaceScreen === 'timeline'
    ? [workspaceScreen === 'timeline' ? '⏱️' : toolIcon(activeTool), workspaceScreen === 'timeline' ? 'Case Timeline' : activeTool]
    : screenCopy[workspaceScreen] ?? ['🛰️', 'Mission Workspace'];
  const isRoot = workspaceScreen === 'briefing';
  const isTool = workspaceScreen === 'tool' || workspaceScreen === 'timeline';
  const is360Tool = isTool && ['Customer 360', 'Business 360'].includes(activeTool);
  const [mobile360MenuOpen, setMobile360MenuOpen] = useState(false);
  const [mobile360DetailRequest, setMobile360DetailRequest] = useState({ detail: '', token: 0 });
  const mobile360ActionButtonRef = useRef(null);
  const mobile360MenuCloseRef = useRef(null);
  const mobile360ProfileName = activeTool === 'Customer 360'
    ? activeCase.customer?.identity?.legalName ?? activeCase.person ?? 'Customer'
    : activeCase.businessProfile?.legalName ?? activeCase.profile?.business ?? activeCase.businessName ?? 'Business';

  useEffect(() => {
    setMobile360MenuOpen(false);
  }, [activeCase.id, activeTool, workspaceScreen]);

  useEffect(() => {
    if (!mobile360MenuOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === 'Escape') setMobile360MenuOpen(false);
    }

    document.body.setAttribute('data-mobile-360-actions', 'open');
    document.addEventListener('keydown', closeOnEscape);
    window.setTimeout(() => mobile360MenuCloseRef.current?.focus(), 0);

    return () => {
      document.body.removeAttribute('data-mobile-360-actions');
      document.removeEventListener('keydown', closeOnEscape);
      mobile360ActionButtonRef.current?.focus();
    };
  }, [mobile360MenuOpen]);

  function requestMobile360Detail(detail) {
    setMobile360DetailRequest((current) => ({ detail, token: current.token + 1 }));
    setMobile360MenuOpen(false);
  }

  function pinMobile360Profile() {
    const pinValue = activeTool === 'Customer 360'
      ? `${activeCase.trainingId ?? 'C360-REL'} · ${mobile360ProfileName}`
      : `${activeTool} profile · ${mobile360ProfileName}`;
    activeToolProps.pin?.(pinValue);
    setMobile360MenuOpen(false);
  }

  function markMobile360Reviewed() {
    activeToolProps.markReviewed?.(activeTool);
    setMobile360MenuOpen(false);
  }

  return (
    <section className="mission-workspace-v3" data-workspace-screen={workspaceScreen} data-active-tool={activeTool}>
      <header className="mission-workspace-bar" data-mobile-360-header={is360Tool ? 'true' : undefined}>
        <button type="button" className="mission-workspace-back" disabled={isRoot} onClick={goBackWorkspaceScreen} aria-label="Back to previous mission screen">‹</button>
        <div>
          <span>{screenIcon}</span>
          {is360Tool ? (
            <>
              <h1>{screenTitle}</h1>
              <p className="mobile-360-home-base">{activeTool === 'Customer 360' ? 'Customer home base' : 'Business home base'}</p>
            </>
          ) : (
            <>
              <p>{activeCase.id}</p>
              <h1>{screenTitle}</h1>
            </>
          )}
        </div>
        {is360Tool && (
          <Mobile360LunaBadge
            actionLabel={activeTool === 'Business 360' ? 'Open Luna Business Research' : undefined}
            onClick={activeTool === 'Business 360' ? () => requestMobile360Detail('research') : undefined}
          />
        )}
        <button
          ref={is360Tool ? mobile360ActionButtonRef : undefined}
          type="button"
          className={workspaceScreen === 'workflow' ? 'active' : ''}
          onClick={() => {
            if (is360Tool) {
              setMobile360MenuOpen((open) => !open);
            } else if (workspaceScreen === 'workflow') {
              goBackWorkspaceScreen();
            } else {
              showWorkspaceScreen('workflow');
            }
          }}
          aria-controls={is360Tool ? 'mobile-360-actions-menu' : undefined}
          aria-expanded={is360Tool ? mobile360MenuOpen : undefined}
          aria-label={is360Tool ? `Open ${activeTool} actions` : 'Open mission pages'}
        >
          {is360Tool ? '•••' : '☷'}
        </button>
      </header>

      {is360Tool && mobile360MenuOpen && (
        <div
          className="mobile-360-actions-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setMobile360MenuOpen(false);
          }}
        >
          <section
            id="mobile-360-actions-menu"
            className="mobile-360-actions-menu"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeTool} actions`}
          >
            <header>
              <div>
                <p>{activeTool}</p>
                <h2>Profile actions</h2>
              </div>
              <button ref={mobile360MenuCloseRef} type="button" onClick={() => setMobile360MenuOpen(false)} aria-label="Close profile actions">×</button>
            </header>
            <nav aria-label={`${activeTool} detail pages`}>
              {activeTool === 'Business 360' ? (
                <>
                  <button type="button" onClick={() => requestMobile360Detail('profile')}>🏢 Business profile</button>
                  <button type="button" onClick={() => requestMobile360Detail('owners')}>👥 Owners &amp; control</button>
                  <button type="button" onClick={() => requestMobile360Detail('research')}>🌙 Luna Business Research</button>
                  <button type="button" onClick={() => requestMobile360Detail('notes')}>📝 Recent notes</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => requestMobile360Detail('profile')}>👤 Customer profile</button>
                  <button type="button" onClick={() => requestMobile360Detail('updates')}>🗂️ Profile updates</button>
                  <button type="button" onClick={() => requestMobile360Detail('security')}>🛡️ Trusted devices &amp; security</button>
                  <button type="button" onClick={() => requestMobile360Detail('accounts')}>💳 Accounts &amp; products</button>
                  <button type="button" onClick={() => requestMobile360Detail('relationship')}>💞 Relationship</button>
                  <button type="button" onClick={() => requestMobile360Detail('notes')}>📝 Recent notes</button>
                </>
              )}
            </nav>
            <nav className="mobile-360-workflow-actions" aria-label="Investigation workflow actions">
              <button type="button" onClick={pinMobile360Profile}>⭐ Pin profile</button>
              <button type="button" onClick={() => { openNotes(); setMobile360MenuOpen(false); }}>📝 Case notes</button>
              <button type="button" onClick={() => { showWorkspaceScreen('tool-menu'); setMobile360MenuOpen(false); }}>🧰 All tools</button>
              <button type="button" onClick={markMobile360Reviewed}>
                {currentCompleted.includes(activeTool) ? '✓ Reviewed' : '✓ Mark reviewed'}
              </button>
              <button type="button" onClick={() => { jumpDecision(); setMobile360MenuOpen(false); }}>✅ Submit Decision</button>
            </nav>
          </section>
        </div>
      )}

      {!is360Tool && (
        <section className="mission-workspace-case-selector" aria-label="Active mission file">
          <span>ACTIVE FILE</span>
          <label className="visual-case-switcher">
            <select value={activeCase.id} onChange={(event) => changeCase(event.target.value)} aria-label="Choose active mission case">
              {cases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.person}</option>)}
            </select>
          </label>
          <strong>{activeCase.status}</strong>
        </section>
      )}

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
          <section className="mission-evidence-page" data-workflow-stage="investigate" data-workspace-page="tool-menu">
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
            data-workspace-page={workspaceScreen === 'timeline' ? 'timeline' : 'tool'}
          >
            {!is360Tool && (
              <nav className="mission-tool-actions" aria-label="Tool page actions">
                <button type="button" onClick={() => showWorkspaceScreen('tool-menu')}>🧰 All tools</button>
                <button type="button" onClick={openNotes}>📝 Notes <span>{notes.length}</span></button>
                <button type="button" onClick={jumpDecision}>✅ Decide</button>
              </nav>
            )}
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
                <MobileCustomer360Reference
                  {...activeToolProps}
                  detailRequest={mobile360DetailRequest}
                />
              ) : activeTool === 'Business 360' ? (
                <MobileBusiness360Reference
                  {...activeToolProps}
                  detailRequest={mobile360DetailRequest}
                />
              ) : activeTool === 'Timeline' ? (
                <TimelinePanel {...activeToolProps} />
              ) : (
                <InvestigationToolPanel {...activeToolProps} />
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

      {!is360Tool && (
        <footer className="mission-workspace-status">
          <span>⭐ {tray.length} pinned</span><span>📝 {notes.length} notes</span><span>📡 {actionLog.length} actions</span>
        </footer>
      )}
    </section>
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

function MissionPath({ activeCase, activeStage, onSelect, stageStatus }) {
  return (
    <section className="mission-path-v3" data-workspace-page="workflow">
      <header><span>🧭</span><div><p>{activeCase.id}</p><h2>Investigation mission path</h2><small>Jump between pages without losing your place.</small></div></header>
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
