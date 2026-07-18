import { useEffect, useMemo, useRef, useState } from 'react';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import ActiveCaseWorkflowRail from './ActiveCaseWorkflowRail.jsx';
import BottomInvestigationGrid from './BottomInvestigationGrid.jsx';
import CaseSummaryCard from './CaseSummaryCard.jsx';
import CategoryTileRail from './CategoryTileRail.jsx';
import Customer360Panel from './Customer360Panel.jsx';
import InvestigationToolPanel from './InvestigationToolPanel.jsx';
import SubmitDecisionPanel from './SubmitDecisionPanel.jsx';
import TimelinePanel from './TimelinePanel.jsx';
import useVisualWorkspaceActions from './useVisualWorkspaceActions.js';
import useVisualWorkspaceCaseState from './useVisualWorkspaceCaseState.js';
import VisualShellHeader from './VisualShellHeader.jsx';
import {
  groupForTool,
  investigationToolGroups,
  workspaceTools,
} from './investigationToolGroups.js';
import { rowsFor } from './visualWorkspaceModel.js';
import { resolvePinnedEvidence } from './pinnedEvidenceNavigation.js';

function stageForTool(toolName) {
  if (toolName === 'Timeline') return 'timeline';
  if (['Document Viewer', 'Document Request', 'Link Analysis'].includes(toolName)) return 'indicators';
  return 'investigate';
}

function stageForScreen(screen, toolName) {
  if (screen === 'tool' || screen === 'timeline') return stageForTool(toolName);
  if (screen === 'tool-menu') return 'investigate';
  if (screen === 'evidence' || screen === 'notes') return 'indicators';
  if (screen === 'determination') return 'determination';
  if (screen === 'debrief') return 'debrief';
  return 'briefing';
}

export default function VisualWorkspace({ activeCaseId, cases = enrichTrainingCases(baseCases), onCaseChange, onNavigate, requestedWorkspaceScreen, onWorkspaceScreenChange }) {
  const [activeStage, setActiveStage] = useState('briefing');
  const [workspaceScreen, setWorkspaceScreen] = useState('briefing');
  const [categoryKey, setCategoryKey] = useState('digital');
  const [tool, setTool] = useState('Login History');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [openedPinnedEvidence, setOpenedPinnedEvidence] = useState(null);
  const submitRef = useRef(null);
  const workspaceScreenHistory = useRef([]);
  const requestedWorkspaceScreenRef = useRef(requestedWorkspaceScreen);

  const activeCase = cases.find((item) => item.id === activeCaseId) ?? cases[0];

  useEffect(() => {
    const nextScreen = requestedWorkspaceScreen || 'briefing';
    workspaceScreenHistory.current = [];
    requestedWorkspaceScreenRef.current = nextScreen;
    setActiveStage(stageForScreen(nextScreen, tool));
    setWorkspaceScreen(nextScreen);
    setOpenedPinnedEvidence(null);
  }, [activeCase.id]);

  useEffect(() => {
    onWorkspaceScreenChange?.(workspaceScreen);
  }, [onWorkspaceScreenChange, workspaceScreen]);

  useEffect(() => {
    if (!requestedWorkspaceScreen || requestedWorkspaceScreen === requestedWorkspaceScreenRef.current) return;
    requestedWorkspaceScreenRef.current = requestedWorkspaceScreen;
    if (requestedWorkspaceScreen !== workspaceScreen) setWorkspaceScreen(requestedWorkspaceScreen);
    setActiveStage(stageForScreen(requestedWorkspaceScreen, tool));
    resetWorkspacePageScroll();
  }, [requestedWorkspaceScreen, tool, workspaceScreen]);

  const {
    tray,
    notes,
    currentCompleted,
    decisionDraft,
    reviewPackages,
    actionLog,
    setTrayByCase,
    setNotesByCase,
    setCompletedByCase,
    setDecisionByCase,
    setPackagesByCase,
    setActionsByCase,
  } = useVisualWorkspaceCaseState(activeCase);
  const availableToolNames = useMemo(() => new Set(activeCase.availableTools?.length ? activeCase.availableTools : workspaceTools), [activeCase]);
  const visibleCategories = useMemo(() => investigationToolGroups
    .map((group) => ({ ...group, tools: group.tools.filter((toolName) => availableToolNames.has(toolName)) }))
    .filter((group) => group.tools.length), [availableToolNames]);
  const visibleWorkspaceTools = useMemo(() => workspaceTools.filter((toolName) => availableToolNames.has(toolName)), [availableToolNames]);
  const activeTool = visibleWorkspaceTools.includes(tool) ? tool : visibleCategories[0]?.tools[0] ?? tool;
  const activeCategory = visibleCategories.find((item) => item.tools.includes(activeTool))
    ?? visibleCategories.find((item) => item.key === categoryKey)
    ?? visibleCategories[0]
    ?? groupForTool(activeTool)
    ?? investigationToolGroups[0];
  const data = rowsFor(activeTool, activeCase);
  const rows = useMemo(() => data.rows.filter((row) => !query || row.detail.toLowerCase().includes(query.toLowerCase())), [data.rows, query]);
  const activeRow = rows.find((row) => row.id === expandedId) ?? rows[0];
  const {
    packageStatus,
    pin,
    removePin,
    saveNote,
    markReviewed,
    updateDecision,
    updateDecisionIndicator,
    submitNote,
    submitDecision,
    recordAction,
  } = useVisualWorkspaceActions({
    activeCase,
    tool: activeTool,
    activeRow,
    tray,
    notes,
    currentCompleted,
    decisionDraft,
    noteDraft,
    setNoteDraft,
    setTrayByCase,
    setNotesByCase,
    setCompletedByCase,
    setDecisionByCase,
    setPackagesByCase,
    setActionsByCase,
  });

  const reviewedWorkspaceTools = visibleWorkspaceTools.filter((toolName) => currentCompleted.includes(toolName)).length;
  const collectedIndicators = tray.length + notes.length;
  const hasReviewPackage = reviewPackages.length > 0;
  const stageStatus = {
    briefing: {
      label: currentCompleted.includes('Case Summary') ? 'Reviewed' : 'Open',
      state: currentCompleted.includes('Case Summary') ? 'complete' : 'open',
    },
    investigate: {
      label: `${reviewedWorkspaceTools}/${visibleWorkspaceTools.length} reviewed`,
      state: reviewedWorkspaceTools === visibleWorkspaceTools.length ? 'complete' : reviewedWorkspaceTools > 0 ? 'in-progress' : 'open',
    },
    timeline: {
      label: currentCompleted.includes('Timeline') ? 'Reviewed' : 'Open',
      state: currentCompleted.includes('Timeline') ? 'complete' : 'open',
    },
    indicators: {
      label: collectedIndicators ? `${collectedIndicators} collected` : 'Open',
      state: collectedIndicators ? 'in-progress' : 'open',
    },
    determination: {
      label: hasReviewPackage ? 'Decision saved' : 'Ready to submit',
      state: hasReviewPackage ? 'complete' : 'ready',
    },
    debrief: {
      label: hasReviewPackage ? 'Available' : 'Locked',
      state: hasReviewPackage ? 'complete' : 'locked',
    },
  };

  function resetWorkspaceInlineScroll() {
    [
      document.documentElement,
      document.body,
      document.getElementById('root'),
      document.querySelector('.visual-os-frame'),
    ].forEach((element) => {
      if (element) element.scrollLeft = 0;
    });
  }

  function scrollToWorkspace(selector, delay = 50) {
    window.setTimeout(() => {
      resetWorkspaceInlineScroll();
      document.querySelector(selector)?.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
      resetWorkspaceInlineScroll();
    }, delay);
  }

  function isMobileLayout() {
    return document.body.dataset.layoutMode === 'mobile';
  }

  function resetWorkspacePageScroll() {
    window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 0);
  }

  function showWorkspaceScreen(nextScreen, { replace = false } = {}) {
    setWorkspaceScreen((current) => {
      if (current === nextScreen) return current;
      if (!replace) workspaceScreenHistory.current = [...workspaceScreenHistory.current, current].slice(-16);
      return nextScreen;
    });
    resetWorkspacePageScroll();
  }

  function goBackWorkspaceScreen() {
    const history = [...workspaceScreenHistory.current];
    const previous = history.pop() ?? 'briefing';
    workspaceScreenHistory.current = history;
    setWorkspaceScreen(previous);
    const previousStage = previous === 'tool-menu' || previous === 'tool'
      ? 'investigate'
      : previous === 'evidence' || previous === 'notes'
        ? 'indicators'
        : previous === 'workflow'
          ? null
          : previous;
    if (previousStage) setActiveStage(previousStage);
    resetWorkspacePageScroll();
  }

  function openTool(nextTool, nextStage = stageForTool(nextTool), { scroll = true } = {}) {
    if (!availableToolNames.has(nextTool)) return;
    const nextCategory = visibleCategories.find((item) => item.tools.includes(nextTool)) ?? groupForTool(nextTool) ?? visibleCategories[0];
    onNavigate('workspace');
    setActiveStage(nextStage);
    setCategoryKey(nextCategory.key);
    setTool(nextTool);
    setQuery('');
    setExpandedId('');
    setOpenedPinnedEvidence(null);
    showWorkspaceScreen(nextTool === 'Timeline' ? 'timeline' : 'tool');
    if (!scroll || isMobileLayout()) return;
    scrollToWorkspace('.activity-panel');
  }

  function openPinnedEvidence(item) {
    const resolved = resolvePinnedEvidence(item, activeCase, visibleWorkspaceTools);
    if (!resolved) {
      setOpenedPinnedEvidence({ value: item, tool: '', row: null, unresolved: true });
      showWorkspaceScreen('evidence');
      recordAction('Pinned evidence source unavailable', `${item} could not be matched to an available source record.`, 'Pinned Evidence');
      return;
    }

    openTool(resolved.tool, stageForTool(resolved.tool), { scroll: false });
    setQuery(resolved.query);
    setExpandedId(resolved.recordId);
    setOpenedPinnedEvidence(resolved);
    recordAction('Opened pinned evidence', `${item} reopened in ${resolved.tool}.`, 'Pinned Evidence');
    window.setTimeout(() => {
      const context = document.querySelector('[data-opened-pinned-evidence="true"]');
      const pageHeader = document.querySelector('.mobile-workspace-page-header');
      if (!context) return;
      const headerOffset = (pageHeader?.getBoundingClientRect().height ?? 0) + 12;
      context.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
      window.scrollBy({ top: -headerOffset, left: 0, behavior: 'auto' });
    }, 100);
  }

  function returnToPinnedEvidence() {
    setOpenedPinnedEvidence(null);
    setActiveStage('indicators');
    showWorkspaceScreen('evidence');
  }

  function changeCase(nextCaseId) {
    const nextCase = cases.find((item) => item.id === nextCaseId);
    const nextTools = new Set(nextCase?.availableTools?.length ? nextCase.availableTools : workspaceTools);
    const nextCategory = investigationToolGroups
      .map((group) => ({ ...group, tools: group.tools.filter((toolName) => nextTools.has(toolName)) }))
      .find((group) => group.tools.length);
    onCaseChange(nextCaseId);
    setActiveStage('briefing');
    setCategoryKey(nextCategory?.key ?? 'identity');
    setTool(nextCategory?.tools[0] ?? 'Customer 360');
    setQuery('');
    setExpandedId('');
    workspaceScreenHistory.current = [];
    showWorkspaceScreen('briefing', { replace: true });
  }

  function openDocumentAccountCase(nextCaseId) {
    if (nextCaseId === activeCase.id) return;
    onCaseChange(nextCaseId, 'tool');
    setActiveStage('indicators');
    setCategoryKey('evidence');
    setTool('Document Viewer');
    setQuery('');
    setExpandedId('');
    showWorkspaceScreen('tool');
  }

  function jumpDecision() {
    onNavigate('workspace');
    setActiveStage('determination');
    showWorkspaceScreen('determination');
    window.setTimeout(() => {
      resetWorkspaceInlineScroll();
      submitRef.current?.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
      resetWorkspaceInlineScroll();
    }, 80);
  }

  function openNotes() {
    onNavigate('workspace');
    setActiveStage('indicators');
    showWorkspaceScreen('notes');
    if (isMobileLayout()) return;
    scrollToWorkspace('.notebook-card', 80);
  }

  function openDebrief() {
    onNavigate('workspace');
    setActiveStage('debrief');
    showWorkspaceScreen('debrief');
    if (!isMobileLayout()) scrollToWorkspace('.luna-visual-panel', 80);
  }

  function openMoreTools() {
    onNavigate('workspace');
    setActiveStage('investigate');
    showWorkspaceScreen('tool-menu');
    if (isMobileLayout()) return;
    scrollToWorkspace('[data-workflow-stage="investigate"]', 80);
  }

  function openCaseQueue() {
    recordAction('Opened Case Queue', 'Returned to Case Queue from Case Briefing.', 'Case Briefing');
    onNavigate('cases');
  }

  function selectWorkflowStage(nextStage) {
    onNavigate('workspace');
    setActiveStage(nextStage);

    if (nextStage === 'briefing') {
      showWorkspaceScreen('briefing');
      if (isMobileLayout()) return;
      scrollToWorkspace('[data-workflow-stage="briefing"]');
      return;
    }
    if (nextStage === 'investigate') {
      showWorkspaceScreen('tool-menu');
      if (isMobileLayout()) return;
      scrollToWorkspace('[data-workflow-stage="investigate"]');
      return;
    }
    if (nextStage === 'timeline') {
      openTool('Timeline', 'timeline');
      return;
    }
    if (nextStage === 'indicators') {
      showWorkspaceScreen('evidence');
      if (isMobileLayout()) return;
      scrollToWorkspace('[data-workflow-stage="indicators"]');
      return;
    }
    if (nextStage === 'determination') {
      jumpDecision();
      return;
    }
    showWorkspaceScreen('debrief');
    if (!isMobileLayout()) scrollToWorkspace('.luna-visual-panel', 80);
  }

  const workspaceScreenTitle = workspaceScreen === 'tool'
    ? activeTool
    : workspaceScreen === 'timeline'
      ? 'Case Timeline'
      : {
          briefing: 'Case Briefing',
          workflow: 'Case Pages',
          'tool-menu': 'Investigation Tools',
          evidence: 'Pinned Evidence',
          notes: 'Case Notes',
          determination: 'Submit Decision',
          debrief: 'Luna Briefing',
        }[workspaceScreen] ?? 'Workspace';

  const activeToolProps = {
    activeCategory,
    activeCase,
    tool: activeTool,
    openTool,
    query,
    setQuery,
    data,
    rows,
    activeRow,
    setExpandedId,
    pin,
    saveNote,
    markReviewed,
    currentCompleted,
    jumpDecision,
    notes,
    cases,
    openDocumentAccountCase,
  };

  return (
    <main className="visual-os-shell">
      <section className="visual-os-frame" data-workspace-screen={workspaceScreen}>
        <VisualShellHeader
          activeCase={activeCase}
          cases={cases}
          changeCase={changeCase}
          onNavigate={onNavigate}
        />

        <nav className="mobile-workspace-page-header" aria-label="Workspace page navigation">
          <button type="button" onClick={goBackWorkspaceScreen} disabled={workspaceScreen === 'briefing'} aria-label="Back to previous workspace page">‹ Back</button>
          <span><small>{activeCase.id}</small><strong>{workspaceScreenTitle}</strong></span>
          <button type="button" onClick={() => (workspaceScreen === 'workflow' ? goBackWorkspaceScreen() : showWorkspaceScreen('workflow'))}>{workspaceScreen === 'workflow' ? 'Close' : 'Pages'}</button>
        </nav>

        <ActiveCaseWorkflowRail
          activeStage={activeStage}
          stageStatus={stageStatus}
          onStageSelect={selectWorkflowStage}
        />

        <div data-workflow-stage="briefing" data-workspace-page="briefing">
          <CaseSummaryCard
            activeCase={activeCase}
            pin={pin}
            openTool={openTool}
            jumpDecision={jumpDecision}
            openNotes={openNotes}
            openMoreTools={openMoreTools}
            openQueue={openCaseQueue}
            actionLog={actionLog}
            recordAction={recordAction}
          />
        </div>

        <section className="workflow-investigate-stage" data-workflow-stage="investigate" data-workspace-page="tool-menu" aria-label="Investigate stage categories">
          <CategoryTileRail
            categories={visibleCategories}
            categoryKey={categoryKey}
            currentCompleted={currentCompleted}
            onNavigate={onNavigate}
            onInvestigate={() => {
              setActiveStage('investigate');
              showWorkspaceScreen('tool');
            }}
            setCategoryKey={setCategoryKey}
            setTool={setTool}
            setExpandedId={setExpandedId}
          />
        </section>

        <div className="workflow-active-tool-stage" data-active-workflow-stage={activeStage} data-workspace-page="tool">
          {openedPinnedEvidence && !openedPinnedEvidence.unresolved && (
            <section className="opened-pinned-evidence" data-opened-pinned-evidence="true" aria-label="Opened pinned evidence source">
              <header>
                <div><p>Opened from Pinned Evidence</p><h2>{openedPinnedEvidence.value}</h2><span>Source tool: {openedPinnedEvidence.tool}</span></div>
                <button type="button" onClick={returnToPinnedEvidence}>Back to Pinned Evidence</button>
              </header>
              {openedPinnedEvidence.row ? (
                <dl>
                  {openedPinnedEvidence.row.values.slice(0, 7).map((value, index) => (
                    <div key={`${openedPinnedEvidence.row.id}-${data.columns[index] ?? index}`}><dt>{data.columns[index] ?? `Field ${index + 1}`}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
              ) : <p>The source tool is open with this saved identifier already entered in its search.</p>}
            </section>
          )}
          {activeTool === 'Customer 360' ? (
            <Customer360Panel {...activeToolProps} />
          ) : activeTool === 'Timeline' ? (
            <TimelinePanel {...activeToolProps} />
          ) : (
            <InvestigationToolPanel {...activeToolProps} />
          )}
        </div>

        <div data-workflow-stage="indicators" data-workspace-page="indicators" data-mobile-indicator-view={workspaceScreen}>
          <BottomInvestigationGrid
            tray={tray}
            removePin={removePin}
            onOpenPinned={openPinnedEvidence}
            noteDraft={noteDraft}
            setNoteDraft={setNoteDraft}
            submitNote={submitNote}
            notes={notes}
            mobileView={workspaceScreen}
            onMobileViewChange={(nextView) => showWorkspaceScreen(nextView)}
          />
        </div>

        {(activeStage === 'determination' || workspaceScreen === 'determination') && (
          <div data-workflow-stage="determination" data-workspace-page="determination">
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
              removePin={removePin}
              toolNames={visibleWorkspaceTools}
              saveNote={saveNote}
            />
          </div>
        )}
        <div className="decision-luna-portal-anchor" hidden />
        <nav className="visual-bottom-nav" aria-hidden="true" />
      </section>
    </main>
  );
}
