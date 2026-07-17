import { buildReviewPackage, getReviewPackageStatus } from './data/reviewPackage.js';
import { readDocumentFulfillments } from './data/documentRequestFulfillment.js';
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
  setActionsByCase,
}) {
  const packageStatus = getReviewPackageStatus({
    activeCase,
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
    recordAction('Pinned evidence', `${value} added to the Investigation Tray.`, tool);
  }

  function removePin(value) {
    if (!value) return;
    setTrayByCase((current) => ({
      ...current,
      [activeCase.id]: (current[activeCase.id] ?? [activeCase.trainingId]).filter((item) => item !== value),
    }));
    recordAction('Removed pinned evidence', `${value} removed from the Investigation Tray.`, 'Pinned Evidence');
  }

  function recordAction(action, detail, source = tool) {
    const timestamp = new Date().toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const entry = {
      id: `${activeCase.id}-ACT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: timestamp,
      action,
      detail,
      source,
    };
    setActionsByCase((current) => ({
      ...current,
      [activeCase.id]: [entry, ...(current[activeCase.id] ?? [])],
    }));
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
    recordAction('Saved note', `${type} added to the case notebook.`, type);
  }

  function markReviewed(toolName = tool) {
    setCompletedByCase((current) => {
      const caseTools = current[activeCase.id] ?? ['Case Summary'];
      return {
        ...current,
        [activeCase.id]: [...new Set([...caseTools, toolName])],
      };
    });
    recordAction('Marked tool reviewed', `${toolName} marked reviewed.`, toolName);
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

  function updateDecisionIndicator(indicatorId, field, value) {
    setDecisionByCase((current) => {
      const currentDraft = current[activeCase.id] ?? defaultDecisionDraft;
      const currentIndicators = currentDraft.indicators ?? {};
      const currentIndicator = currentIndicators[indicatorId] ?? { selected: false, proof: '', explanation: '' };
      return {
        ...current,
        [activeCase.id]: {
          ...currentDraft,
          indicators: {
            ...currentIndicators,
            [indicatorId]: {
              ...currentIndicator,
              [field]: value,
            },
          },
        },
      };
    });
  }

  function submitNote(event) {
    event.preventDefault();
    saveNote(noteDraft, 'Investigation note');
    setNoteDraft('');
  }

  function submitDecision(event) {
    event.preventDefault();
    const status = getReviewPackageStatus({
      activeCase,
      completedTools: currentCompleted,
      tray,
      notes,
      draft: decisionDraft,
    });

    const reviewPackage = buildReviewPackage({
      caseId: activeCase.id,
      agentId: AGENT_ID,
      activeCase,
      draft: decisionDraft,
      completedTools: currentCompleted,
      tray,
      notes,
      documentRequests: Object.values(readDocumentFulfillments(activeCase.id)),
      packageStatus: status,
    });

    setPackagesByCase((current) => ({
      ...current,
      [activeCase.id]: [reviewPackage, ...(current[activeCase.id] ?? [])],
    }));
    recordAction('Saved submitted decision record', 'Submitted Decision Record saved; Luna Briefing is available.', 'Submit Decision');
    window.dispatchEvent(new CustomEvent('fraud-academy:package-saved', {
      detail: { caseId: activeCase.id, packageId: reviewPackage.id, reviewPackage },
    }));
    markReviewed('Submit Decision');
    saveNote(
      'Submit Decision: Submitted Decision Record saved. Luna Briefing can now read the saved decision state.',
      'Submitted decision record',
    );
  }

  return {
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
  };
}
