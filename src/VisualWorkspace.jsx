import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import MobileMissionWorkspace from './MobileMissionWorkspace.jsx';
import CaseQuickPad from './CaseQuickPad.jsx';
import {
  canonicalToolName,
  canonicalToolNames,
  groupForTool,
  investigationToolGroups,
  workspaceTools,
} from './investigationToolGroups.js';
import { rowsFor } from './visualWorkspaceModel.js';
import { resolvePinnedEvidence } from './pinnedEvidenceNavigation.js';
import {
  quickPadItemSupportsTool,
  quickPadQueryForTool,
  quickPadSearchCapableTools,
  quickPadSearchRoute,
  quickPadSourceRoute,
} from './data/quickPadRouting.js';

function stageForTool(toolName) {
  if (toolName === 'Timeline') return 'timeline';
  if (['Document Viewer', 'Document Request', 'Link Analysis'].includes(toolName)) return 'indicators';
  return 'investigate';
}

function stageForWorkspaceScreen(screen, toolName) {
  if (screen === 'tool') return stageForTool(toolName);
  if (screen === 'tool-menu') return 'investigate';
  if (screen === 'timeline') return 'timeline';
  if (screen === 'indicators' || screen === 'evidence' || screen === 'notes') return 'indicators';
  if (screen === 'determination' || screen === 'submit') return 'determination';
  if (screen === 'debrief') return 'debrief';
  return 'briefing';
}

export default function VisualWorkspace({ activeCaseId, cases = enrichTrainingCases(baseCases), layoutMode = 'desktop', onCaseChange, onNavigate, requestedWorkspaceScreen, onWorkspaceScreenChange }) {
  const initialWorkspaceScreen = requestedWorkspaceScreen || 'briefing';
  const [activeStage, setActiveStage] = useState(() => stageForWorkspaceScreen(initialWorkspaceScreen, 'Login History'));
  const [workspaceScreen, setWorkspaceScreen] = useState(() => initialWorkspaceScreen);
  const [categoryKey, setCategoryKey] = useState('digital');
  const [tool, setTool] = useState('Login History');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [openedPinnedEvidence, setOpenedPinnedEvidence] = useState(null);
  const [linkSearchRequest, setLinkSearchRequest] = useState(null);
  const [linkSearchSnapshot, setLinkSearchSnapshot] = useState(null);
  const [linkSearchResetKey, setLinkSearchResetKey] = useState(0);
  const submitRef = useRef(null);
  const workspaceScreenHistory = useRef([]);
  const requestedWorkspaceScreenRef = useRef(requestedWorkspaceScreen);
  const linkSearchSequenceRef = useRef(0);

  const activeCase = cases.find((item) => item.id === activeCaseId) ?? cases[0];

  const queueLinkSearch = useCallback(({
    query: nextQuery,
    identifierType = '',
    accountId = '',
    revealSearch = true,
  } = {}) => {
    const cleanQuery = String(nextQuery ?? '').trim();
    if (!cleanQuery) {
      setLinkSearchRequest(null);
      setLinkSearchSnapshot(null);
      return;
    }
    linkSearchSequenceRef.current += 1;
    const nextSearch = {
      caseId: activeCase.id,
      query: cleanQuery,
      identifierType,
      accountId,
      revealSearch,
    };
    setLinkSearchRequest({
      id: linkSearchSequenceRef.current,
      tool: 'Link Analysis',
      ...nextSearch,
    });
    setLinkSearchSnapshot(nextSearch);
  }, [activeCase.id]);

  const consumeLinkSearch = useCallback((requestId) => {
    setLinkSearchRequest((current) => current?.id === requestId ? null : current);
  }, []);

  const clearOpenedPinnedEvidence = useCallback(() => {
    setOpenedPinnedEvidence(null);
    setExpandedId('');
  }, []);

  const rememberLinkSearch = useCallback((nextSearch) => {
    setLinkSearchSnapshot(nextSearch?.query
      ? { ...nextSearch, caseId: activeCase.id }
      : null);
  }, [activeCase.id]);

  const clearWorkspaceSearchContext = useCallback(() => {
    setQuery('');
    setLinkSearchRequest(null);
    setLinkSearchSnapshot(null);
    setLinkSearchResetKey((current) => current + 1);
    setOpenedPinnedEvidence(null);
  }, []);

  useEffect(() => {
    const nextScreen = requestedWorkspaceScreen || 'briefing';
    workspaceScreenHistory.current = [];
    requestedWorkspaceScreenRef.current = nextScreen;
    setActiveStage(stageForWorkspaceScreen(nextScreen, tool));
    setWorkspaceScreen(nextScreen);
    clearWorkspaceSearchContext();
    setExpandedId('');
  }, [activeCase.id]);

  useEffect(() => {
    onWorkspaceScreenChange?.(workspaceScreen);
  }, [onWorkspaceScreenChange, workspaceScreen]);

  useEffect(() => {
    if (!requestedWorkspaceScreen || requestedWorkspaceScreen === requestedWorkspaceScreenRef.current) return;
    requestedWorkspaceScreenRef.current = requestedWorkspaceScreen;
    if (requestedWorkspaceScreen !== workspaceScreen) {
      workspaceScreenHistory.current = [
        ...workspaceScreenHistory.current,
        currentWorkspaceSnapshot(),
      ].slice(-16);
      setActiveStage(stageForWorkspaceScreen(requestedWorkspaceScreen, tool));
      setWorkspaceScreen(requestedWorkspaceScreen);
    }
    resetWorkspacePageScroll();
  }, [requestedWorkspaceScreen, tool, workspaceScreen]);

  const {
    tray,
    notes,
    noteDraft,
    currentCompleted,
    decisionDraft,
    reviewPackages,
    actionLog,
    documentRequests,
    quickPad,
    payrollInvestigation,
    setTrayByCase,
    setNotesByCase,
    setNoteDraft,
    setCompletedByCase,
    setDecisionByCase,
    setPackagesByCase,
    setActionsByCase,
    setDocumentRequestsByCase,
    setQuickPadByCase,
    setPayrollInvestigationsByCase,
  } = useVisualWorkspaceCaseState(activeCase);
  const availableToolNames = useMemo(() => {
    const available = new Set(canonicalToolNames(activeCase.availableTools?.length ? activeCase.availableTools : workspaceTools));
    if (layoutMode === 'mobile') {
      available.delete('KYB Review');
      available.delete('System Access Lane');
    }
    return available;
  }, [activeCase, layoutMode]);
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
  const collectedIndicators = packageStatus.indicatorSummary.selectedCount;
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
      label: collectedIndicators ? `${collectedIndicators} selected` : 'Open',
      state: collectedIndicators ? 'in-progress' : 'open',
    },
    determination: {
      label: hasReviewPackage ? 'Decision saved' : packageStatus.ready ? 'Ready to submit' : 'Draft incomplete',
      state: hasReviewPackage ? 'complete' : packageStatus.ready ? 'ready' : 'in-progress',
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

  function currentWorkspaceSnapshot(screen = workspaceScreen) {
    return {
      screen,
      activeStage,
      categoryKey,
      tool: activeTool,
      query,
      expandedId,
      openedPinnedEvidence,
      linkSearchSnapshot: activeTool === 'Link Analysis' ? linkSearchSnapshot : null,
    };
  }

  function showWorkspaceScreen(nextScreen, { replace = false, forceHistory = false } = {}) {
    if (!replace && (workspaceScreen !== nextScreen || forceHistory)) {
      workspaceScreenHistory.current = [
        ...workspaceScreenHistory.current,
        currentWorkspaceSnapshot(),
      ].slice(-16);
    }
    setWorkspaceScreen(nextScreen);
    resetWorkspacePageScroll();
  }

  function goBackWorkspaceScreen() {
    const history = [...workspaceScreenHistory.current];
    const previous = history.pop() ?? {
      screen: 'briefing',
      activeStage: 'briefing',
      categoryKey,
      tool: activeTool,
      query: '',
      expandedId: '',
      openedPinnedEvidence: null,
    };
    workspaceScreenHistory.current = history;
    const previousTool = canonicalToolName(previous.tool ?? activeTool);
    const previousPinnedLink = previousTool === 'Link Analysis'
      && previous.openedPinnedEvidence?.tool === 'Link Analysis'
      ? previous.openedPinnedEvidence
      : null;
    const previousLinkSearch = previousPinnedLink?.query
      ? {
          query: previousPinnedLink.query,
          identifierType: previousPinnedLink.identifierType,
          accountId: previousPinnedLink.accountId,
          revealSearch: true,
        }
      : previousTool === 'Link Analysis'
        ? previous.linkSearchSnapshot
        : null;
    setWorkspaceScreen(previous.screen);
    setActiveStage(previous.activeStage ?? stageForWorkspaceScreen(previous.screen, previous.tool));
    setCategoryKey(previous.categoryKey ?? categoryKey);
    setTool(previousTool);
    if (previousLinkSearch?.query) {
      setQuery('');
      queueLinkSearch(previousLinkSearch);
    } else {
      setQuery(previous.query ?? '');
      setLinkSearchRequest(null);
      setLinkSearchSnapshot(null);
    }
    setExpandedId(previous.expandedId ?? '');
    setOpenedPinnedEvidence(previous.openedPinnedEvidence ?? null);
    resetWorkspacePageScroll();
  }

  function openTool(
    nextTool,
    nextStage = stageForTool(nextTool),
    {
      scroll = true,
      query: nextQuery = '',
      identifierType = '',
      accountId = '',
      revealSearch = true,
    } = {},
  ) {
    const canonicalTool = canonicalToolName(nextTool);
    if (!availableToolNames.has(canonicalTool)) return;
    const nextCategory = visibleCategories.find((item) => item.tools.includes(canonicalTool)) ?? groupForTool(canonicalTool) ?? visibleCategories[0];
    onNavigate('workspace');
    setActiveStage(nextStage);
    setCategoryKey(nextCategory.key);
    setTool(canonicalTool);
    if (canonicalTool === 'Link Analysis') {
      setQuery('');
      if (nextQuery) {
        queueLinkSearch({
          query: nextQuery,
          identifierType,
          accountId,
          revealSearch,
        });
      } else {
        setLinkSearchRequest(null);
        setLinkSearchSnapshot(null);
        setLinkSearchResetKey((current) => current + 1);
      }
    } else {
      setQuery(nextQuery);
      setLinkSearchRequest(null);
      setLinkSearchSnapshot(null);
    }
    setExpandedId('');
    setOpenedPinnedEvidence(null);
    const nextScreen = canonicalTool === 'Timeline' ? 'timeline' : 'tool';
    showWorkspaceScreen(nextScreen, {
      forceHistory: workspaceScreen === nextScreen && activeTool !== nextTool,
    });
    if (!scroll || isMobileLayout()) return;
    scrollToWorkspace('.activity-panel');
  }

  function openPinnedEvidence(item) {
    const resolved = resolvePinnedEvidence(item, activeCase, visibleWorkspaceTools);
    if (!resolved) {
      setQuery('');
      setLinkSearchRequest(null);
      setLinkSearchSnapshot(null);
      setOpenedPinnedEvidence({ value: item, tool: '', row: null, unresolved: true });
      showWorkspaceScreen('evidence');
      recordAction('Pinned evidence source unavailable', `${item} could not be matched to an available source record.`, 'Pinned Evidence');
      return;
    }

    openTool(resolved.tool, stageForTool(resolved.tool), {
      scroll: false,
      query: resolved.query,
      identifierType: resolved.identifierType,
      accountId: resolved.accountId,
      revealSearch: resolved.tool === 'Link Analysis',
    });
    setExpandedId(resolved.tool === 'Link Analysis' ? (resolved.accountId ?? '') : resolved.recordId);
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
    setLinkSearchRequest(null);
    setOpenedPinnedEvidence(null);
    setActiveStage('indicators');
    showWorkspaceScreen('evidence');
  }

  function removeUnavailablePinnedEvidence(item) {
    removePin(item);
    setLinkSearchRequest(null);
    setOpenedPinnedEvidence(null);
  }

  function changeCase(nextCaseId) {
    const nextCase = cases.find((item) => item.id === nextCaseId);
    const nextTools = new Set(canonicalToolNames(nextCase?.availableTools?.length ? nextCase.availableTools : workspaceTools));
    const nextCategory = investigationToolGroups
      .map((group) => ({ ...group, tools: group.tools.filter((toolName) => nextTools.has(toolName)) }))
      .find((group) => group.tools.length);
    onCaseChange(nextCaseId);
    setActiveStage('briefing');
    setCategoryKey(nextCategory?.key ?? 'identity');
    setTool(nextCategory?.tools[0] ?? 'Customer 360');
    clearWorkspaceSearchContext();
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
    clearWorkspaceSearchContext();
    setExpandedId('');
    showWorkspaceScreen('tool');
  }

  function openRelatedCase(nextCaseId) {
    if (!cases.some((item) => item.id === nextCaseId)) return;
    recordAction('Opened related case', `${nextCaseId} opened from Link Analysis.`, 'Link Analysis');
    if (nextCaseId !== activeCase.id) onCaseChange(nextCaseId, 'briefing');
    setActiveStage('briefing');
    clearWorkspaceSearchContext();
    setExpandedId('');
    workspaceScreenHistory.current = [];
    showWorkspaceScreen('briefing', { replace: true });
  }

  function openRelatedAccount(nextCaseId, accountId) {
    if (nextCaseId === activeCase.id) {
      openTool('Customer 360', 'investigate', { query: accountId });
      setExpandedId(accountId);
      return;
    }
    openRelatedCase(nextCaseId);
  }

  function jumpDecision() {
    onNavigate('workspace');
    setActiveStage('determination');
    showWorkspaceScreen(hasReviewPackage ? 'submit' : 'determination');
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

  function openDebrief(reviewPackageOverride = null) {
    if (!reviewPackageOverride && !hasReviewPackage) {
      jumpDecision();
      return;
    }
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

  function updateQuickPad(updater) {
    setQuickPadByCase((current) => {
      const currentPad = current[activeCase.id] ?? { items: [], scratch: '', lastSavedAt: '' };
      return {
        ...current,
        [activeCase.id]: {
          ...updater(currentPad),
          lastSavedAt: new Date().toISOString(),
        },
      };
    });
  }

  function quickPin({
    label,
    value,
    sourceTool = activeTool,
    sourceRecordId = '',
    identifierType = '',
  }) {
    if (!value) return;
    updateQuickPad((current) => {
      const canonicalSourceTool = canonicalToolName(sourceTool);
      const id = `${canonicalSourceTool}:${label}:${value}`;
      const item = {
        id,
        label,
        value: String(value),
        sourceTool: canonicalSourceTool,
        sourceRecordId,
        identifierType,
      };
      return {
        ...current,
        items: [item, ...(current.items ?? []).filter((saved) => saved.id !== id)],
      };
    });
    recordAction('Saved to Quick Pad', `${label} ${value} kept available for lookup.`, sourceTool);
  }

  function removeQuickPadItem(itemId) {
    updateQuickPad((current) => ({
      ...current,
      items: (current.items ?? []).filter((item) => item.id !== itemId),
    }));
  }

  function setQuickPadScratch(scratch) {
    updateQuickPad((current) => ({ ...current, scratch }));
  }

  function saveQuickPadScratch() {
    if (!quickPad.scratch.trim()) return;
    saveNote(quickPad.scratch, 'Quick Pad note');
    setQuickPadScratch('');
  }

  function useQuickPadItem(item) {
    if (!canUseQuickPadItem(item)) return;
    const route = quickPadSearchRoute(item, activeTool);
    if (activeTool === 'Link Analysis') {
      clearOpenedPinnedEvidence();
      queueLinkSearch(route);
    } else {
      setQuery(route?.query ?? '');
    }
    recordAction('Used Quick Pad value', `${item.label} entered in ${activeTool} search.`, 'Quick Pad');
  }

  function canUseQuickPadItem(item) {
    return ['tool', 'timeline'].includes(workspaceScreen)
      && quickPadSearchCapableTools.has(activeTool)
      && quickPadItemSupportsTool(item, activeTool, layoutMode)
      && Boolean(quickPadQueryForTool(item, activeTool));
  }

  function openQuickPadSource(item) {
    const route = quickPadSourceRoute(item, {
      availableTools: availableToolNames,
      layoutMode,
    });
    if (!route) return;
    openTool(route.sourceTool, stageForTool(route.sourceTool), {
      query: route.query,
      identifierType: route.identifierType,
    });
    setExpandedId(route.sourceTool === 'Link Analysis' ? '' : route.expandedId);
    recordAction('Opened Quick Pad source', `${item.label} reopened in ${route.sourceTool}.`, 'Quick Pad');
  }

  function selectWorkflowStage(nextStage) {
    onNavigate('workspace');
    if (nextStage === 'debrief' && !hasReviewPackage) return;
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
      showWorkspaceScreen(isMobileLayout() ? 'indicators' : 'evidence');
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
          indicators: 'Case Indicators Review',
          evidence: 'Pinned Evidence',
          notes: 'Case Notes',
          determination: 'Determination',
          submit: 'Submit Decision',
          debrief: 'Luna Debrief',
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
    expandedId,
    revealLinkAnalysisSearch: openedPinnedEvidence?.tool === 'Link Analysis',
    setExpandedId,
    pin,
    saveNote,
    markReviewed,
    currentCompleted,
    jumpDecision,
    notes,
    cases,
    openDocumentAccountCase,
    openRelatedCase,
    openRelatedAccount,
    documentRequests,
    setDocumentRequestsByCase,
    recordAction,
    quickPin,
    payrollInvestigation,
    setPayrollInvestigationsByCase,
    openedPinnedEvidence,
    linkSearchRequest,
    linkSearchResetKey,
    consumeLinkSearch,
    onManualLinkSearch: clearOpenedPinnedEvidence,
    onLinkSearchCommitted: rememberLinkSearch,
  };

  const quickPadLayer = (
    <CaseQuickPad
      activeCase={activeCase}
      items={quickPad.items ?? []}
      scratch={quickPad.scratch ?? ''}
      lastSavedAt={quickPad.lastSavedAt ?? ''}
      notes={notes}
      onScratchChange={setQuickPadScratch}
      onRemove={removeQuickPadItem}
      onUse={useQuickPadItem}
      onOpenSource={openQuickPadSource}
      onSaveToNotes={saveQuickPadScratch}
      portalToBody={layoutMode === 'mobile'}
      canUseItem={canUseQuickPadItem}
      canOpenItem={(item) => Boolean(quickPadSourceRoute(item, {
        availableTools: availableToolNames,
        layoutMode,
      }))}
    />
  );

  if (layoutMode === 'mobile') {
    return (
      <>
        <MobileMissionWorkspace
        activeCase={activeCase}
        activeStage={activeStage}
        activeTool={activeTool}
        activeToolProps={activeToolProps}
        actionLog={actionLog}
        cases={cases}
        categoryKey={categoryKey}
        changeCase={changeCase}
        currentCompleted={currentCompleted}
        decisionDraft={decisionDraft}
        documentRequests={documentRequests}
        goBackWorkspaceScreen={goBackWorkspaceScreen}
        jumpDecision={jumpDecision}
        noteDraft={noteDraft}
        notes={notes}
        onNavigate={onNavigate}
        openCaseQueue={openCaseQueue}
        openDebrief={openDebrief}
        openedPinnedEvidence={openedPinnedEvidence}
        openMoreTools={openMoreTools}
        openNotes={openNotes}
        openPinnedEvidence={openPinnedEvidence}
        openTool={openTool}
        packageStatus={packageStatus}
        pin={pin}
        recordAction={recordAction}
        removePin={removePin}
        removeUnavailablePinnedEvidence={removeUnavailablePinnedEvidence}
        returnToPinnedEvidence={returnToPinnedEvidence}
        reviewPackages={reviewPackages}
        selectWorkflowStage={selectWorkflowStage}
        setCategoryKey={setCategoryKey}
        setExpandedId={setExpandedId}
        setNoteDraft={setNoteDraft}
        setTool={setTool}
        showWorkspaceScreen={showWorkspaceScreen}
        stageStatus={stageStatus}
        submitDecision={submitDecision}
        submitNote={submitNote}
        submitRef={submitRef}
        tray={tray}
        updateDecision={updateDecision}
        updateDecisionIndicator={updateDecisionIndicator}
        visibleCategories={visibleCategories}
        visibleWorkspaceTools={visibleWorkspaceTools}
        workspaceScreen={workspaceScreen}
        />
        {quickPadLayer}
      </>
    );
  }

  return (
    <>
    <main className="visual-os-shell">
      <section className="visual-os-frame mission-deck-frame" data-workspace-screen={workspaceScreen} data-active-tool={activeTool}>
        <div className="mission-deck-atmosphere" aria-hidden="true">
          <span /><span /><span /><span /><span />
          <i /><i />
        </div>
        <VisualShellHeader
          activeCase={activeCase}
          cases={cases}
          changeCase={changeCase}
          onNavigate={onNavigate}
        />

        <nav className="mobile-workspace-page-header" aria-label="Workspace page navigation">
          <button type="button" onClick={goBackWorkspaceScreen} disabled={workspaceScreen === 'briefing'} aria-label="Back to previous workspace page">‹ Back</button>
          <span><small>{activeCase.id}</small><strong>{workspaceScreenTitle}</strong></span>
          <label className="mobile-mission-case-picker">
            <span className="sr-only">Active case</span>
            <select value={activeCase.id} onChange={(event) => changeCase(event.target.value)} aria-label="Choose active mission case">
              {cases.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
            </select>
          </label>
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
            activeCase={activeCase}
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
            clearSearchContext={clearWorkspaceSearchContext}
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
          {openedPinnedEvidence?.unresolved && (
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
            onMobileViewChange={(nextView) => showWorkspaceScreen(nextView)}
          />
        </div>

        {activeStage === 'determination' && (
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
              submitDecision={submitDecision}
              openDebrief={openDebrief}
              openEvidence={() => {
                setActiveStage('indicators');
                showWorkspaceScreen('evidence');
              }}
              openNotes={openNotes}
            />
          </div>
        )}
        <div className="decision-luna-portal-anchor" hidden />
        <nav className="visual-bottom-nav" aria-hidden="true" />
      </section>
    </main>
    {!['determination', 'submit', 'debrief'].includes(workspaceScreen) && quickPadLayer}
    </>
  );
}
