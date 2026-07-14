import { buildReviewPackage, getReviewPackageStatus } from './data/reviewPackage.js';
import {
  AGENT_ID,
  buildPacket,
  defaultDecisionDraft,
} from './visualWorkspaceModel.js';

function normalizeExistingPin(item, activeCase) {
  if (typeof item !== 'string') return item;
  return {
    id: `legacy-${activeCase.id}-${item}`,
    label: item,
    value: item,
    sourceTool: item === activeCase.trainingId ? 'Customer 360' : '',
    caseId: activeCase.id,
    pinnedAt: 0,
  };
}

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

  function pin(value, options = {}) {
    if (!value) return;
    const label = typeof value === 'string' ? value : value.label ?? value.value ?? value.id;
    const sourceTool = options.sourceTool ?? value.sourceTool ?? tool;
    const pinId = options.id ?? value.id ?? `${sourceTool}:${label}`;
    const nextPin = {
      id: pinId,
      label,
      value: typeof value === 'string' ? value : value.value ?? label,
      sourceTool,
      recordId: options.recordId ?? value.recordId ?? activeRow?.id ?? '',
      caseId: activeCase.id,
      pinnedAt: Date.now(),
    };

    setTrayByCase((current) => {
      const caseTray = (current[activeCase.id] ?? [activeCase.trainingId]).map((item) => normalizeExistingPin(item, activeCase));
      const withoutExisting = caseTray.filter((item) => item.id !== pinId && item.label !== label);
      return { ...current, [activeCase.id]: [nextPin, ...withoutExisting].slice(0, 25) };
    });
  }

  function removePin(pinId) {
    setTrayByCase((current) => {
      const caseTray = (current[activeCase.id] ?? []).map((item) => normalizeExistingPin(item, activeCase));
      return { ...current, [activeCase.id]: caseTray.filter((item) => item.id !== pinId) };
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
    saveNote(`Evidence packet saved from ${tool}: ${row.id}.`, 'Evidence packet');
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
    removePin,
    saveNote,
    markReviewed,
    saveCaseReportPacket,
    updateDecision,
    submitNote,
    submitDecision,
  };
}
