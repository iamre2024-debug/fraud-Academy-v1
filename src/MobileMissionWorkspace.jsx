import { useEffect, useMemo, useRef, useState } from 'react';
import BottomInvestigationGrid from './BottomInvestigationGrid.jsx';
import InvestigationToolPanel from './InvestigationToolPanel.jsx';
import {
  Mobile360LunaBadge,
  MobileCustomer360Reference,
} from './Mobile360ReferencePages.jsx';
import {
  MobileCaseIndicatorsReview,
  MobileDeterminationPage,
} from './MobileCaseReviewPages.jsx';
import MobileMissionCaseBriefing from './MobileMissionCaseBriefing.jsx';
import MobileToolMap from './MobileToolMap.jsx';
import SubmitDecisionPanel from './SubmitDecisionPanel.jsx';
import TimelinePanel from './TimelinePanel.jsx';
import { getCustomer360Dossier } from './data/customer360Dossier.js';

const screenCopy = {
  briefing: ['🗃️', 'Case Briefing'],
  workflow: ['🧭', 'Mission Path'],
  'tool-menu': ['🧬', 'Evidence Map'],
  indicators: ['◈', 'Case Indicators Review'],
  evidence: ['⭐', 'Pinned Evidence'],
  notes: ['📝', 'Case Notes'],
  determination: ['✓', 'Determination'],
  submit: ['✓', 'Submit Decision'],
  debrief: ['🌙', 'Luna Debrief'],
};

const missionStages = [
  ['briefing', '🗃️', 'Briefing', 'Read the intake and statement'],
  ['investigate', '🧬', 'Investigate', 'Choose evidence tools'],
  ['timeline', '⏱️', 'Timeline', 'Sequence the activity'],
  ['indicators', '◈', 'Indicators', 'Record cues, proof, and notes'],
  ['determination', '✓', 'Decision', 'Record action and finding'],
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
  visibleWorkspaceTools,
  workspaceScreen,
}) {
  const [screenIcon, screenTitle] = workspaceScreen === 'tool' || workspaceScreen === 'timeline'
    ? [workspaceScreen === 'timeline' ? '⏱️' : toolIcon(activeTool), workspaceScreen === 'timeline' ? 'Case Timeline' : toolScreenTitle(activeTool)]
    : screenCopy[workspaceScreen] ?? ['🛰️', 'Mission Workspace'];
  const isRoot = workspaceScreen === 'briefing';
  const isTool = workspaceScreen === 'tool' || workspaceScreen === 'timeline';
  const is360Tool = isTool && activeTool === 'Customer 360';
  const ownsIntelHeader = isTool && [
    'Identity Intel / People Search',
    'Business 360',
    'Login History',
    'Session History',
  ].includes(activeTool);
  const has360Header = is360Tool;
  const isLinkAnalysis = workspaceScreen === 'tool' && activeTool === 'Link Analysis';
  const reviewIsSearchGated = [
    'Device Intelligence',
    'IP Intelligence',
    'Link Analysis',
    'Payment Verification',
  ].includes(activeTool);
  const isReviewScreen = ['indicators', 'determination', 'submit', 'debrief'].includes(workspaceScreen);
  const hasInnerReviewHeading = ['indicators', 'determination'].includes(workspaceScreen);
  const reviewSubtitle = workspaceScreen === 'debrief'
    ? 'Case Complete'
    : workspaceScreen === 'submit'
      ? 'Final Review'
      : 'Evidence Review';
  const [mobile360MenuOpen, setMobile360MenuOpen] = useState(false);
  const [mobileToolMenuOpen, setMobileToolMenuOpen] = useState(false);
  const [mobile360DetailRequest, setMobile360DetailRequest] = useState({
    detail: '',
    token: 0,
    caseId: '',
    tool: '',
  });
  const mobile360ActionButtonRef = useRef(null);
  const mobile360MenuCloseRef = useRef(null);
  const mobileToolActionButtonRef = useRef(null);
  const mobileToolMenuCloseRef = useRef(null);
  const mobile360Profile = useMemo(() => {
    if (activeTool === 'Customer 360') {
      const dossier = getCustomer360Dossier(activeCase);
      return {
        id: dossier.identity.trainingId,
        name: dossier.identity.legalName,
      };
    }
    return { id: '', name: '' };
  }, [activeCase, activeTool, activeToolProps.query]);

  useEffect(() => {
    setMobile360MenuOpen(false);
    setMobileToolMenuOpen(false);
    setMobile360DetailRequest((current) => ({
      detail: '',
      token: current.token + 1,
      caseId: activeCase.id,
      tool: activeTool,
    }));
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

  useEffect(() => {
    if (!mobileToolMenuOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === 'Escape') setMobileToolMenuOpen(false);
    }

    document.body.setAttribute('data-mobile-tool-actions', 'open');
    document.addEventListener('keydown', closeOnEscape);
    window.setTimeout(() => mobileToolMenuCloseRef.current?.focus(), 0);

    return () => {
      document.body.removeAttribute('data-mobile-tool-actions');
      document.removeEventListener('keydown', closeOnEscape);
      mobileToolActionButtonRef.current?.focus();
    };
  }, [mobileToolMenuOpen]);

  function requestMobile360Detail(detail) {
    setMobile360DetailRequest((current) => ({
      detail,
      token: current.token + 1,
      caseId: activeCase.id,
      tool: activeTool,
    }));
    setMobile360MenuOpen(false);
  }

  function pinMobile360Profile() {
    const pinValue = `${mobile360Profile.id} · ${mobile360Profile.name}`;
    activeToolProps.pin?.(pinValue);
    setMobile360MenuOpen(false);
  }

  function markMobile360Reviewed() {
    activeToolProps.markReviewed?.(activeTool);
    setMobile360MenuOpen(false);
  }

  function closeMobileToolMenu() {
    setMobileToolMenuOpen(false);
  }

  function markMobileToolReviewed() {
    activeToolProps.markReviewed?.(activeTool);
    closeMobileToolMenu();
  }

  return (
    <main className="mission-workspace-v3" data-workspace-screen={workspaceScreen} data-active-tool={activeTool}>
      {!ownsIntelHeader && (
      <header
        className={`mission-workspace-bar${isReviewScreen ? ' mission-review-bar' : ''}`}
        data-mobile-360-header={has360Header ? 'true' : undefined}
        data-link-analysis-header={isLinkAnalysis ? 'true' : undefined}
      >
        <button type="button" className="mission-workspace-back" disabled={isRoot} onClick={goBackWorkspaceScreen} aria-label="Back to previous mission screen">‹</button>
        {hasInnerReviewHeading ? (
          <div className="mission-review-title mission-review-case-title">
            <h1>{activeCase.id}</h1>
            <p>{activeCase.status}</p>
          </div>
        ) : isReviewScreen ? (
          <div className="mission-review-title">
            <h1>{screenTitle}{workspaceScreen === 'debrief' ? ' ✨' : ''}</h1>
            <p>{reviewSubtitle}</p>
          </div>
        ) : isLinkAnalysis ? (
          <div className="mission-link-analysis-header-copy">
            <h1>Link Analysis</h1>
            <label className="mission-link-analysis-case-select">
              <select value={activeCase.id} onChange={(event) => changeCase(event.target.value)} aria-label="Choose active Link Analysis case">
                {cases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.person}</option>)}
              </select>
            </label>
          </div>
        ) : (
          <div>
            <span>{screenIcon}</span>
            {has360Header ? (
            <>
              <h1>{screenTitle}</h1>
              <p className="mobile-360-home-base">Customer home base</p>
            </>
          ) : (
            <>
              <p>{activeCase.id}</p>
              <h1>{screenTitle}</h1>
            </>
            )}
          </div>
        )}
        {has360Header && (
          <Mobile360LunaBadge />
        )}
        {isReviewScreen ? (
          <span className="mission-review-header-spacer" aria-hidden="true" />
        ) : (
          <button
            ref={is360Tool ? mobile360ActionButtonRef : isTool ? mobileToolActionButtonRef : undefined}
            type="button"
            className={workspaceScreen === 'workflow' ? 'active' : ''}
            onClick={() => {
              if (is360Tool) {
                setMobile360MenuOpen((open) => !open);
              } else if (isTool) {
                setMobileToolMenuOpen((open) => !open);
              } else if (workspaceScreen === 'workflow') {
                goBackWorkspaceScreen();
              } else {
                showWorkspaceScreen('workflow');
              }
            }}
            aria-controls={is360Tool ? 'mobile-360-actions-menu' : isTool ? 'mobile-tool-actions-menu' : undefined}
            aria-expanded={is360Tool ? mobile360MenuOpen : isTool ? mobileToolMenuOpen : undefined}
            aria-label={isTool ? `Open ${activeTool} actions` : 'Open mission pages'}
          >
            {isTool ? '•••' : '☷'}
          </button>
        )}
      </header>
      )}

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
              <button type="button" onClick={() => requestMobile360Detail('profile')}>👤 Customer profile</button>
              <button type="button" onClick={() => requestMobile360Detail('updates')}>🗂️ Profile updates</button>
              <button type="button" onClick={() => requestMobile360Detail('security')}>🛡️ Trusted devices &amp; security</button>
              <button type="button" onClick={() => requestMobile360Detail('accounts')}>💳 Accounts &amp; products</button>
              <button type="button" onClick={() => requestMobile360Detail('relationship')}>💞 Relationship</button>
              <button type="button" onClick={() => requestMobile360Detail('notes')}>📝 Recent notes</button>
            </nav>
            <nav className="mobile-360-workflow-actions" aria-label="Investigation workflow actions">
              <button type="button" onClick={pinMobile360Profile}>⭐ Pin profile</button>
              <button type="button" onClick={() => { openNotes(); setMobile360MenuOpen(false); }}>📝 Case notes</button>
              <button type="button" onClick={() => { selectWorkflowStage('indicators'); showWorkspaceScreen('evidence'); setMobile360MenuOpen(false); }}>⭐ Pinned Evidence</button>
              <button type="button" onClick={() => { showWorkspaceScreen('tool-menu'); setMobile360MenuOpen(false); }}>🧰 All tools</button>
              <button type="button" onClick={markMobile360Reviewed}>
                {currentCompleted.includes(activeTool) ? '✓ Reviewed' : '✓ Mark reviewed'}
              </button>
              <button type="button" onClick={() => { jumpDecision(); setMobile360MenuOpen(false); }}>✅ Submit Decision</button>
            </nav>
          </section>
        </div>
      )}

      {isTool && !is360Tool && !ownsIntelHeader && mobileToolMenuOpen && (
        <div
          className="mobile-360-actions-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeMobileToolMenu();
          }}
        >
          <section
            id="mobile-tool-actions-menu"
            className="mobile-360-actions-menu mobile-tool-actions-menu"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeTool} actions`}
          >
            <header>
              <div>
                <p>{activeCase.id}</p>
                <h2>{activeTool}</h2>
              </div>
              <button ref={mobileToolMenuCloseRef} type="button" onClick={closeMobileToolMenu} aria-label={`Close ${activeTool} actions`}>×</button>
            </header>
            <label className="mobile-tool-action-case-select">
              <span>Active case</span>
              <select
                value={activeCase.id}
                onChange={(event) => {
                  changeCase(event.target.value);
                  closeMobileToolMenu();
                }}
                aria-label={`Choose active ${activeTool} case`}
              >
                {cases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.person}</option>)}
              </select>
            </label>
            <nav className="mobile-360-workflow-actions" aria-label={`${activeTool} workflow actions`}>
              <button type="button" onClick={() => { showWorkspaceScreen('tool-menu'); closeMobileToolMenu(); }}>🧰 All tools</button>
              <button type="button" onClick={() => { openNotes(); closeMobileToolMenu(); }}>📝 Case notes ({notes.length})</button>
              <button type="button" onClick={() => { selectWorkflowStage('indicators'); showWorkspaceScreen('evidence'); closeMobileToolMenu(); }}>⭐ Pinned evidence ({tray.length})</button>
              {!reviewIsSearchGated && (
                <button type="button" onClick={markMobileToolReviewed}>
                  {currentCompleted.includes(activeTool) ? '✓ Reviewed' : '✓ Mark reviewed'}
                </button>
              )}
              <button type="button" onClick={() => { jumpDecision(); closeMobileToolMenu(); }}>✅ Determination</button>
            </nav>
          </section>
        </div>
      )}

      {!isTool && !isReviewScreen && workspaceScreen !== 'tool-menu' && (
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
            <MobileToolMap
              activeCase={activeCase}
              activeTool={activeTool}
              availableTools={visibleWorkspaceTools}
              categories={visibleCategories}
              completedTools={currentCompleted}
              onOpenDecision={jumpDecision}
              onOpenIndicators={() => selectWorkflowStage('indicators')}
              onOpenNotes={openNotes}
              onOpenOverview={() => {
                selectWorkflowStage('briefing');
              }}
              onOpenPinnedEvidence={() => {
                selectWorkflowStage('indicators');
                showWorkspaceScreen('evidence');
              }}
              onOpenTool={openTool}
            />
          </section>
        )}

        {isTool && (
          <section
            className={[
              'mission-tool-page',
              activeTool === 'Document Request' ? 'mission-document-request-page' : '',
              activeTool === 'Merchant Intelligence' ? 'mission-merchant-reference-page' : '',
              activeTool === 'Login History' ? 'mission-login-history-page mission-login-reference-page' : '',
              activeTool === 'Session History' ? 'mission-session-history-page mission-session-reference-page' : '',
              activeTool === 'Device Intelligence' ? 'mission-device-intelligence-page mission-device-ip-reference-page' : '',
              activeTool === 'IP Intelligence' ? 'mission-ip-intelligence-page mission-device-ip-reference-page' : '',
              activeTool === 'Payroll History' ? 'mission-payroll-history-page' : '',
              activeTool === 'Identity Intel / People Search' ? 'mission-identity-intel-reference-page' : '',
              activeTool === 'Business 360' ? 'mission-business-intel-reference-page' : '',
            ].filter(Boolean).join(' ')}
            data-document-request-page={activeTool === 'Document Request' ? 'true' : undefined}
            data-merchant-reference-page={activeTool === 'Merchant Intelligence' ? 'true' : undefined}
            data-login-history-page={activeTool === 'Login History' ? 'true' : undefined}
            data-session-history-page={activeTool === 'Session History' ? 'true' : undefined}
            data-device-intelligence-page={activeTool === 'Device Intelligence' ? 'true' : undefined}
            data-ip-intelligence-page={activeTool === 'IP Intelligence' ? 'true' : undefined}
            data-payroll-history-page={activeTool === 'Payroll History' ? 'true' : undefined}
            data-identity-intel-reference-page={activeTool === 'Identity Intel / People Search' ? 'true' : undefined}
            data-business-intel-reference-page={activeTool === 'Business 360' ? 'true' : undefined}
            data-workflow-stage={workspaceScreen === 'timeline' ? 'timeline' : 'investigate'}
            data-workspace-page={workspaceScreen === 'timeline' ? 'timeline' : 'tool'}
          >
            {openedPinnedEvidence && !openedPinnedEvidence.unresolved && (
              <section className="mission-opened-pin" data-opened-pinned-evidence="true">
                <div><p>Opened from pinned evidence</p><h2>{openedPinnedEvidence.value}</h2><small>Source: {openedPinnedEvidence.tool}</small></div>
                <button type="button" onClick={returnToPinnedEvidence}>Back to pins</button>
              </section>
            )}
            <div className="mission-tool-content">
              {activeTool === 'Customer 360' ? (
                <MobileCustomer360Reference
                  {...activeToolProps}
                  detailRequest={mobile360DetailRequest}
                />
              ) : activeTool === 'Timeline' ? (
                <TimelinePanel {...activeToolProps} mobileMode />
              ) : (
                <InvestigationToolPanel
                  {...activeToolProps}
                  backToToolMap={() => showWorkspaceScreen('tool-menu')}
                  mobileMode
                />
              )}
            </div>
          </section>
        )}

        {workspaceScreen === 'indicators' && (
          <MobileCaseIndicatorsReview
            activeCase={activeCase}
            decisionDraft={decisionDraft}
            jumpDecision={jumpDecision}
            locked={reviewPackages.length > 0}
            noteDraft={noteDraft}
            notes={notes}
            openNotesPage={() => showWorkspaceScreen('notes')}
            openPinnedEvidence={openPinnedEvidence}
            openPinnedPage={() => showWorkspaceScreen('evidence')}
            packageStatus={packageStatus}
            removePin={removePin}
            setNoteDraft={setNoteDraft}
            submitNote={submitNote}
            tray={tray}
            updateDecisionIndicator={updateDecisionIndicator}
          />
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
          <MobileDeterminationPage
            submitRef={submitRef}
            packageStatus={packageStatus}
            tray={tray}
            notes={notes}
            reviewPackages={reviewPackages}
            decisionDraft={decisionDraft}
            latestPackage={reviewPackages[0] ?? null}
            activeCase={activeCase}
            locked={reviewPackages.length > 0}
            updateDecision={updateDecision}
            openIndicators={() => showWorkspaceScreen('indicators')}
            openSubmit={() => showWorkspaceScreen('submit')}
          />
        )}

        {workspaceScreen === 'submit' && (
          <SubmitDecisionPanel
            submitRef={submitRef}
            packageStatus={packageStatus}
            tray={tray}
            notes={notes}
            reviewPackages={reviewPackages}
            decisionDraft={decisionDraft}
            activeCase={activeCase}
            updateDecision={updateDecision}
            submitDecision={submitDecision}
            openDebrief={openDebrief}
            openEvidence={() => showWorkspaceScreen('evidence')}
            openNotes={openNotes}
          />
        )}

        {workspaceScreen === 'debrief' && <div className="decision-luna-portal-anchor" />}
        {workspaceScreen !== 'debrief' && <div className="decision-luna-portal-anchor" hidden />}
      </div>

      {!isTool && !has360Header && !ownsIntelHeader && !isReviewScreen && (
        <footer className="mission-workspace-status">
          <span>⭐ {tray.length} pinned</span><span>📝 {notes.length} notes</span><span>📡 {actionLog.length} actions</span>
        </footer>
      )}
    </main>
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

function toolScreenTitle(tool) {
  if (tool === 'Identity Intel / People Search') return 'Identity Intelligence';
  if (tool === 'Business 360') return 'Business Intelligence';
  return tool;
}
