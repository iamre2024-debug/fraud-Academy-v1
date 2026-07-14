import { buildReviewPackage, getReviewPackageStatus } from './data/reviewPackage.js';
import {
  AGENT_ID,
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
  noteDraft,
  setNoteDraft,
  setTrayByCase,
  setNotesByCase,
  setCompletedByCase,
  setDecisionByCase,
  setPackagesByCase,
}) {
  const packageStatus = getReviewPackageStatus({
    completedTools: currentCompleted,
    tray,
    notes,
    draft: decisionDraft,
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
    saveNote(`${toolName}: reviewed.`, 'Tool review');
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
      packageStatus: status,
    });

    setPackagesByCase((current) => ({
      ...current,
      [activeCase.id]: [reviewPackage, ...(current[activeCase.id] ?? [])],
    }));
    window.dispatchEvent(new CustomEvent('fraud-academy:package-saved', {
      detail: { caseId: activeCase.id, packageId: reviewPackage.id, reviewPackage },
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
    updateDecision,
    submitNote,
    submitDecision,
  };
}
