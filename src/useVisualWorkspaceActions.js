import { buildReviewPackage, getReviewPackageStatus } from './data/reviewPackage.js';
import {
  AGENT_ID,
  buildPacket,
  defaultDecisionDraft,
} from './visualWorkspaceModel.js';

export default function useVisualWorkspaceActions({
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
}) {
  const packageStatus = getReviewPackageStatus({
    completedTools: currentCompleted,
    tray,
    notes,
    draft: decisionDraft,
    reportPackets,
  });

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
    const timestamp = new Date().toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const noteLine = `${timestamp} · ${type} · ${clean}`;
    setNotesByCase((current) => ({
      ...current,
      [activeCase.id]: [noteLine, ...(current[activeCase.id] ?? [])],
    }));
  }

  function markReviewed(toolName = tool) {
    setCompletedByCase((current) => {
      const caseTools = current[activeCase.id] ?? ['Case Summary'];
      return {
        ...current,
        [activeCase.id]: [...new Set([...caseTools, toolName])],
      };
    });
    saveNote(`${toolName}: reviewed and neutral report generated.`, 'Tool review');
  }

  function saveCaseReportPacket(row = activeRow) {
    if (!row) return;
    const packet = buildPacket(row, tool, activeCase);
    setPacketsByCase((current) => {
      const casePackets = current[activeCase.id] ?? [];
      const deduped = casePackets.filter((item) => item.key !== packet.key);
      return {
        ...current,
        [activeCase.id]: [packet, ...deduped].slice(0, 30),
      };
    });
    saveNote(`Case Report packet saved from ${tool}: ${row.id}.`, 'Case report packet');
  }

  function updateDecision(field, value) {
    setDecisionByCase((current) => ({
      ...current,
      [activeCase.id]: {
        ...(current[activeCase.id] ?? defaultDecisionDraft),
        [field]: value,
      },
    }));
  }

  function submitNote(event) {
    event.preventDefault();
    saveNote(noteDraft, 'Investigation note');
    setNoteDraft('');
  }

  function submitDecision(event) {
    event.preventDefault();
    const status = getReviewPackageStatus({
      completedTools: currentCompleted,
      tray,
      notes,
      draft: decisionDraft,
      reportPackets,
    });

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

    setPackagesByCase((current) => ({
      ...current,
      [activeCase.id]: [reviewPackage, ...(current[activeCase.id] ?? [])],
    }));
    window.dispatchEvent(new CustomEvent('fraud-academy:package-saved', {
      detail: { caseId: activeCase.id, packageId: reviewPackage.id },
    }));
    markReviewed('Submit Decision');
    saveNote(
      'Submit Decision: learner review package saved. Post-submission Luna debrief can now read the saved package state.',
      'Decision package',
    );
  }

  return {
    packageStatus,
    pin,
    saveNote,
    markReviewed,
    saveCaseReportPacket,
    updateDecision,
    submitNote,
    submitDecision,
  };
}
