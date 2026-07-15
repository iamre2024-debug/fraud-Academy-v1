import { useMemo, useRef, useState } from 'react';
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

function stageForTool(toolName) {
  if (toolName === 'Timeline') return 'timeline';
  if (['Document Viewer', 'Document Request', 'Link Analysis'].includes(toolName)) return 'indicators';
  return 'investigate';
}

export default function VisualWorkspace({ activeCaseId, cases = enrichTrainingCases(baseCases), onCaseChange, onNavigate }) {
  const [activeStage, setActiveStage] = useState('briefing');
  const [categoryKey, setCategoryKey] = useState('digital');
  const [tool, setTool] = useState('Login History');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const submitRef = useRef(null);

  const activeCase = cases.find((item) => item.id === activeCaseId) ?? cases[0];
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
      label: hasReviewPackage ? 'Package saved' : packageStatus.ready ? 'Ready to save' : `${packageStatus.blockers.length} open`,
      state: hasReviewPackage ? 'complete' : packageStatus.ready ? 'ready' : 'locked',
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

  function openTool(nextTool, nextStage = stageForTool(nextTool)) {
    if (!availableToolNames.has(nextTool)) return;
    const nextCategory = visibleCategories.find((item) => item.tools.includes(nextTool)) ?? groupForTool(nextTool) ?? visibleCategories[0];
    onNavigate('workspace');
    setActiveStage(nextStage);
    setCategoryKey(nextCategory.key);
    setTool(nextTool);
    setQuery('');
    setExpandedId('');
    scrollToWorkspace('.activity-panel');
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
  }

  function jumpDecision() {
    onNavigate('workspace');
    setActiveStage('determination');
    window.setTimeout(() => {
      resetWorkspaceInlineScroll();
      submitRef.current?.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
      resetWorkspaceInlineScroll();
    }, 80);
  }

  function openNotes() {
    onNavigate('workspace');
    setActiveStage('indicators');
    scrollToWorkspace('.notebook-card', 80);
  }

  function openMoreTools() {
    onNavigate('workspace');
    setActiveStage('investigate');
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
      scrollToWorkspace('[data-workflow-stage="briefing"]');
      return;
    }
    if (nextStage === 'investigate') {
      scrollToWorkspace('[data-workflow-stage="investigate"]');
      return;
    }
    if (nextStage === 'timeline') {
      openTool('Timeline', 'timeline');
      return;
    }
    if (nextStage === 'indicators') {
      openTool('Document Viewer', 'indicators');
      return;
    }
    if (nextStage === 'determination') {
      jumpDecision();
      return;
    }
    scrollToWorkspace('.luna-visual-panel', 80);
  }

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
  };

  return (
    <main className="visual-os-shell">
      <section className="visual-os-frame">
        <VisualShellHeader
          activeCase={activeCase}
          cases={cases}
          changeCase={changeCase}
          onNavigate={onNavigate}
        />

        <ActiveCaseWorkflowRail
          activeStage={activeStage}
          stageStatus={stageStatus}
          onStageSelect={selectWorkflowStage}
        />

        <div data-workflow-stage="briefing">
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

        <section className="workflow-investigate-stage" data-workflow-stage="investigate" aria-label="Investigate stage categories">
          <CategoryTileRail
            categories={visibleCategories}
            categoryKey={categoryKey}
            currentCompleted={currentCompleted}
            onNavigate={onNavigate}
            onInvestigate={() => setActiveStage('investigate')}
            setCategoryKey={setCategoryKey}
            setTool={setTool}
            setExpandedId={setExpandedId}
          />
        </section>

        <div className="workflow-active-tool-stage" data-active-workflow-stage={activeStage}>
          {activeTool === 'Customer 360' ? (
            <Customer360Panel {...activeToolProps} />
          ) : activeTool === 'Timeline' ? (
            <TimelinePanel {...activeToolProps} />
          ) : (
            <InvestigationToolPanel {...activeToolProps} />
          )}
        </div>

        <div data-workflow-stage="indicators">
          <BottomInvestigationGrid
            tray={tray}
            pin={pin}
            openTool={openTool}
            noteDraft={noteDraft}
            setNoteDraft={setNoteDraft}
            submitNote={submitNote}
            notes={notes}
          />
        </div>

        {activeStage === 'determination' && (
          <div data-workflow-stage="determination">
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
            />
          </div>
        )}
        <div className="decision-luna-portal-anchor" hidden />
        <nav className="visual-bottom-nav" aria-hidden="true" />
      </section>
    </main>
  );
}
