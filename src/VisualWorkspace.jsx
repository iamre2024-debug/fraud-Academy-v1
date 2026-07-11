import { useMemo, useRef, useState } from 'react';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import ActiveToolPanel from './ActiveToolPanel.jsx';
import BottomInvestigationGrid from './BottomInvestigationGrid.jsx';
import CaseSummaryCard from './CaseSummaryCard.jsx';
import CategoryTileRail from './CategoryTileRail.jsx';
import SubmitDecisionPanel from './SubmitDecisionPanel.jsx';
import useVisualWorkspaceActions from './useVisualWorkspaceActions.js';
import useVisualWorkspaceCaseState from './useVisualWorkspaceCaseState.js';
import VisualShellHeader from './VisualShellHeader.jsx';
import {
  categories,
  rowsFor,
} from './visualWorkspaceModel.js';

export default function VisualWorkspace({ activeCaseId, cases = enrichTrainingCases(baseCases), onCaseChange, onNavigate }) {
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
  const activeCategory = categories.find((item) => item.key === categoryKey) ?? categories[1];
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
    noteDraft,
    setNoteDraft,
    currentCompleted,
    tray,
    notes,
    decisionDraft,
    reportPackets,
    setTrayByCase,
    setNotesByCase,
    setCompletedByCase,
    setDecisionByCase,
    setPackagesByCase,
    setPacketsByCase,
  });

  function openTool(nextTool) {
    const nextCategory = categories.find((item) => item.tools.includes(nextTool)) ?? categories[1];
    onNavigate('workspace');
    setCategoryKey(nextCategory.key);
    setTool(nextTool);
    setQuery('');
    setExpandedId('');
    window.setTimeout(() => document.querySelector('.activity-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function changeCase(nextCaseId) {
    onCaseChange(nextCaseId);
    setCategoryKey('digital');
    setTool('Login History');
    setQuery('');
    setExpandedId('');
  }

  function jumpDecision() {
    onNavigate('workspace');
    window.setTimeout(() => submitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  return (
    <main className="visual-os-shell">
      <section className="visual-os-frame">
        <VisualShellHeader
          activeCase={activeCase}
          cases={cases}
          changeCase={changeCase}
        />

        <CaseSummaryCard
          activeCase={activeCase}
          pin={pin}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />

        <CategoryTileRail
          categories={categories}
          categoryKey={categoryKey}
          currentCompleted={currentCompleted}
          onNavigate={onNavigate}
          setCategoryKey={setCategoryKey}
          setTool={setTool}
          setExpandedId={setExpandedId}
        />

        <ActiveToolPanel
          activeCategory={activeCategory}
          activeCase={activeCase}
          tool={tool}
          openTool={openTool}
          query={query}
          setQuery={setQuery}
          data={data}
          rows={rows}
          activeRow={activeRow}
          setExpandedId={setExpandedId}
          pin={pin}
          saveNote={saveNote}
          saveCaseReportPacket={saveCaseReportPacket}
          markReviewed={markReviewed}
          currentCompleted={currentCompleted}
          jumpDecision={jumpDecision}
        />

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
        <nav className="visual-bottom-nav" aria-hidden="true" />
      </section>
    </main>
  );
}
