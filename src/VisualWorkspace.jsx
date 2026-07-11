import { useMemo, useRef, useState } from 'react';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import ActiveCaseWorkflowRail from './ActiveCaseWorkflowRail.jsx';
import ActiveToolPanel from './ActiveToolPanel.jsx';
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
  if (toolName === 'Case Report') return 'summary';
  if (['Evidence Center', 'Document Viewer', 'Link Analysis'].includes(toolName)) return 'indicators';
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
    reportPackets,
    setTrayByCase,
    setNotesByCase,
    setCompletedByCase,
    setDecisionByCase,
    setPackagesByCase,
    setPacketsByCase,
  } = useVisualWorkspaceCaseState(activeCase);
  const activeCategory = groupForTool(tool)
    ?? investigationToolGroups.find((item) => item.key === categoryKey)
    ?? investigationToolGroups[1];
  const data = rowsFor(tool, activeCase, reportPackets);
  const rows = useMemo(() => data.rows.filter((row) => !query || row.detail.toLowerCase().includes(query.toLowerCase())), [data.rows, query]);
  const activeRow = rows.find((row) => row.id === expandedId) ?? rows[0];
  const {
    packageStatus,
    pin,
    saveNote,
    markReviewed,
    saveCaseReportPacket,
    updateDecision,
    submitNote,
    submitDecision,
  } = useVisualWorkspaceActions({
    activeCase,
    tool,
    activeRow,
    tray,
    notes,
    currentCompleted,
    decisionDraft,
    reportPackets,
    noteDraft,
    setNoteDraft,
    setTrayByCase,
    setNotesByCase,
    setCompletedByCase,
    setDecisionByCase,
    setPackagesByCase,
    setPacketsByCase,
  });

  const reviewedWorkspaceTools = workspaceTools.filter((toolName) => currentCompleted.includes(toolName)).length;
  const collectedIndicators = tray.length + notes.length + reportPackets.length;
  const hasReviewPackage = reviewPackages.length > 0;
  const stageStatus = {
    briefing: {
      label: currentCompleted.includes('Case Summary') ? 'Reviewed' : 'Open',
      state: currentCompleted.includes('Case Summary') ? 'complete' : 'open',
    },
    investigate: {
      label: `${reviewedWorkspaceTools}/${workspaceTools.length} reviewed`,
      state: reviewedWorkspaceTools === workspaceTools.length ? 'complete' : reviewedWorkspaceTools > 0 ? 'in-progress' : 'open',
    },
    timeline: {
      label: currentCompleted.includes('Timeline') ? 'Reviewed' : 'Open',
      state: currentCompleted.includes('Timeline') ? 'complete' : 'open',
    },
    summary: {
      label: currentCompleted.includes('Case Report') ? 'Reviewed' : 'Open',
      state: currentCompleted.includes('Case Report') ? 'complete' : 'open',
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
    const nextCategory = groupForTool(nextTool) ?? investigationToolGroups[1];
    onNavigate('workspace');
    setActiveStage(nextStage);
    setCategoryKey(nextCategory.key);
    setTool(nextTool);
    setQuery('');
    setExpandedId('');
    scrollToWorkspace('.activity-panel');
  }

  function changeCase(nextCaseId) {
    onCaseChange(nextCaseId);
    setActiveStage('briefing');
    setCategoryKey('digital');
    setTool('Login History');
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
    if (nextStage === 'summary') {
      openTool('Case Report', 'summary');
      return;
    }
    if (nextStage === 'indicators') {
      openTool('Evidence Center', 'indicators');
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
    tool,
    openTool,
    query,
    setQuery,
    data,
    rows,
    activeRow,
    setExpandedId,
    pin,
    saveNote,
    saveCaseReportPacket,
    markReviewed,
    currentCompleted,
    jumpDecision,
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
          />
        </div>

        <section className="workflow-investigate-stage" data-workflow-stage="investigate" aria-label="Investigate stage categories">
          <CategoryTileRail
            categories={investigationToolGroups}
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
          {tool === 'Customer 360' ? (
            <Customer360Panel {...activeToolProps} />
          ) : tool === 'Timeline' ? (
            <TimelinePanel {...activeToolProps} />
          ) : tool === 'Case Report' ? (
            <ActiveToolPanel {...activeToolProps} />
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
            reportPackets={reportPackets}
            notes={notes}
          />
        </div>

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
            submitDecision={submitDecision}
          />
        </div>
        <nav className="visual-bottom-nav" aria-hidden="true" />
      </section>
    </main>
  );
}
