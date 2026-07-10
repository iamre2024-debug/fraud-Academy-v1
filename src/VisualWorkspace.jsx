import { useEffect, useMemo, useRef, useState } from 'react';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import { buildReviewPackage, getReviewPackageStatus } from './data/reviewPackage.js';
import ActiveToolPanel from './ActiveToolPanel.jsx';
import BottomInvestigationGrid from './BottomInvestigationGrid.jsx';
import CaseSummaryCard from './CaseSummaryCard.jsx';
import CategoryTileRail from './CategoryTileRail.jsx';
import SubmitDecisionPanel from './SubmitDecisionPanel.jsx';
import VisualShellHeader from './VisualShellHeader.jsx';
import {
  AGENT_ID,
  buildPacket,
  categories,
  defaultDecisionDraft,
  readStorage,
  rowsFor,
  storageKeys,
  writeStorage,
} from './visualWorkspaceModel.js';

export default function VisualWorkspace({ activeCaseId, cases = enrichTrainingCases(baseCases), onCaseChange, onNavigate }) {
  const [categoryKey, setCategoryKey] = useState('digital');
  const [tool, setTool] = useState('Login History');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [trayByCase, setTrayByCase] = useState(() => readStorage(storageKeys.tray, {}));
  const [notesByCase, setNotesByCase] = useState(() => readStorage(storageKeys.notes, {}));
  const [completedByCase, setCompletedByCase] = useState(() => readStorage(storageKeys.completed, {}));
  const [decisionByCase, setDecisionByCase] = useState(() => readStorage(storageKeys.decisions, {}));
  const [packagesByCase, setPackagesByCase] = useState(() => readStorage(storageKeys.packages, {}));
  const [packetsByCase, setPacketsByCase] = useState(() => readStorage(storageKeys.reportPackets, {}));
  const submitRef = useRef(null);

  const activeCase = cases.find((item) => item.id === activeCaseId) ?? cases[0];
  const activeCategory = categories.find((item) => item.key === categoryKey) ?? categories[1];
  const tray = trayByCase[activeCase.id] ?? [activeCase.trainingId];
  const notes = notesByCase[activeCase.id] ?? [];
  const currentCompleted = completedByCase[activeCase.id] ?? ['Case Summary'];
  const decisionDraft = decisionByCase[activeCase.id] ?? defaultDecisionDraft;
  const reviewPackages = packagesByCase[activeCase.id] ?? [];
  const reportPackets = packetsByCase[activeCase.id] ?? [];
  const data = rowsFor(tool, activeCase, reportPackets);
  const rows = useMemo(() => data.rows.filter((row) => !query || row.detail.toLowerCase().includes(query.toLowerCase())), [data.rows, query]);
  const activeRow = rows.find((row) => row.id === expandedId) ?? rows[0];
  const packageStatus = getReviewPackageStatus({ completedTools: currentCompleted, tray, notes, draft: decisionDraft, reportPackets });

  useEffect(() => writeStorage(storageKeys.tray, trayByCase), [trayByCase]);
  useEffect(() => writeStorage(storageKeys.notes, notesByCase), [notesByCase]);
  useEffect(() => writeStorage(storageKeys.completed, completedByCase), [completedByCase]);
  useEffect(() => writeStorage(storageKeys.decisions, decisionByCase), [decisionByCase]);
  useEffect(() => writeStorage(storageKeys.packages, packagesByCase), [packagesByCase]);
  useEffect(() => writeStorage(storageKeys.reportPackets, packetsByCase), [packetsByCase]);

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

  function pin(value) {
    if (!value) return;
    setTrayByCase((current) => {
      const caseTray = current[activeCase.id] ?? [activeCase.trainingId];
      return { ...current, [activeCase.id]: [...new Set([...caseTray, value])] };
    });
  }

  function saveNote(text, type = 'Investigation note') {
    const clean = text.trim();
    if (!clean) return;
    const timestamp = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const noteLine = `${timestamp} · ${type} · ${clean}`;
    setNotesByCase((current) => ({ ...current, [activeCase.id]: [noteLine, ...(current[activeCase.id] ?? [])] }));
  }

  function markReviewed(toolName = tool) {
    setCompletedByCase((current) => {
      const caseTools = current[activeCase.id] ?? ['Case Summary'];
      return { ...current, [activeCase.id]: [...new Set([...caseTools, toolName])] };
    });
    saveNote(`${toolName}: reviewed and neutral report generated.`, 'Tool review');
  }

  function saveCaseReportPacket(row = activeRow) {
    if (!row) return;
    const packet = buildPacket(row, tool, activeCase);
    setPacketsByCase((current) => {
      const casePackets = current[activeCase.id] ?? [];
      const deduped = casePackets.filter((item) => item.key !== packet.key);
      return { ...current, [activeCase.id]: [packet, ...deduped].slice(0, 30) };
    });
    saveNote(`Case Report packet saved from ${tool}: ${row.id}.`, 'Case report packet');
  }

  function updateDecision(field, value) {
    setDecisionByCase((current) => ({
      ...current,
      [activeCase.id]: { ...(current[activeCase.id] ?? defaultDecisionDraft), [field]: value },
    }));
  }

  function submitNote(event) {
    event.preventDefault();
    saveNote(noteDraft, 'Investigation note');
    setNoteDraft('');
  }

  function submitDecision(event) {
    event.preventDefault();
    const status = getReviewPackageStatus({ completedTools: currentCompleted, tray, notes, draft: decisionDraft, reportPackets });
    if (!status.ready) {
      saveNote(`Submit Decision checklist checked. ${status.messages[0]}`, 'Decision checklist');
      return;
    }

    const reviewPackage = buildReviewPackage({
      caseId: activeCase.id,
      agentId: AGENT_ID,
      draft: decisionDraft,
      completedTools: currentCompleted,
      tray,
      notes,
      reportPackets,
      packageStatus: status,
    });

    setPackagesByCase((current) => ({ ...current, [activeCase.id]: [reviewPackage, ...(current[activeCase.id] ?? [])] }));
    window.dispatchEvent(new CustomEvent('fraud-academy:package-saved', { detail: { caseId: activeCase.id, packageId: reviewPackage.id } }));
    markReviewed('Submit Decision');
    saveNote('Submit Decision: learner review package saved. Post-submission Luna debrief can now read the saved package state.', 'Decision package');
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
