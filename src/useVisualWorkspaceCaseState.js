import { useEffect, useState } from 'react';
import {
  defaultDecisionDraft,
  readStorage,
  storageKeys,
  writeStorage,
} from './visualWorkspaceModel.js';
import { isValidReviewPackage } from './data/reviewPackage.js';
import { canonicalToolName, canonicalToolNames } from './investigationToolGroups.js';

export function migrateCompletedTools(saved) {
  return Object.fromEntries(Object.entries(saved).map(([caseId, tools]) => [
    caseId,
    canonicalToolNames(tools ?? []),
  ]));
}

export function migrateQuickPads(saved) {
  return Object.fromEntries(Object.entries(saved).map(([caseId, quickPad]) => [
    caseId,
    {
      ...quickPad,
      items: (quickPad?.items ?? []).map((item) => {
        const sourceTool = canonicalToolName(item.sourceTool);
        return {
          ...item,
          sourceTool,
          id: `${sourceTool}:${item.label}:${item.value}`,
        };
      }),
    },
  ]));
}

export function migrateReviewPackages(saved) {
  return Object.fromEntries(Object.entries(saved).map(([caseId, packages]) => [
    caseId,
    (packages ?? []).map((reviewPackage) => ({
      ...reviewPackage,
      completedTools: canonicalToolNames(reviewPackage.completedTools ?? []),
      missingTools: canonicalToolNames(reviewPackage.missingTools ?? []),
    })),
  ]));
}

export default function useVisualWorkspaceCaseState(activeCase) {
  const [trayByCase, setTrayByCase] = useState(() => readStorage(storageKeys.tray, {}));
  const [notesByCase, setNotesByCase] = useState(() => readStorage(storageKeys.notes, {}));
  const [noteDraftsByCase, setNoteDraftsByCase] = useState(() => readStorage(storageKeys.noteDrafts, {}));
  const [completedByCase, setCompletedByCase] = useState(() => migrateCompletedTools(readStorage(storageKeys.completed, {})));
  const [decisionByCase, setDecisionByCase] = useState(() => readStorage(storageKeys.decisions, {}));
  const [packagesByCase, setPackagesByCase] = useState(() => migrateReviewPackages(readStorage(storageKeys.packages, {})));
  const [actionsByCase, setActionsByCase] = useState(() => readStorage(storageKeys.actions, {}));
  const [documentRequestsByCase, setDocumentRequestsByCase] = useState(() => readStorage(storageKeys.documentRequests, {}));
  const [quickPadByCase, setQuickPadByCase] = useState(() => migrateQuickPads(readStorage(storageKeys.quickPad, {})));

  useEffect(() => writeStorage(storageKeys.tray, trayByCase), [trayByCase]);
  useEffect(() => writeStorage(storageKeys.notes, notesByCase), [notesByCase]);
  useEffect(() => writeStorage(storageKeys.noteDrafts, noteDraftsByCase), [noteDraftsByCase]);
  useEffect(() => writeStorage(storageKeys.completed, completedByCase), [completedByCase]);
  useEffect(() => writeStorage(storageKeys.decisions, decisionByCase), [decisionByCase]);
  useEffect(() => {
    writeStorage(storageKeys.packages, packagesByCase);
    window.dispatchEvent(new CustomEvent('fraud-academy:packages-updated'));
  }, [packagesByCase]);
  useEffect(() => writeStorage(storageKeys.actions, actionsByCase), [actionsByCase]);
  useEffect(() => writeStorage(storageKeys.documentRequests, documentRequestsByCase), [documentRequestsByCase]);
  useEffect(() => writeStorage(storageKeys.quickPad, quickPadByCase), [quickPadByCase]);

  useEffect(() => {
    const hydrateFromRecovery = () => {
      setTrayByCase(readStorage(storageKeys.tray, {}));
      setNotesByCase(readStorage(storageKeys.notes, {}));
      setNoteDraftsByCase(readStorage(storageKeys.noteDrafts, {}));
      setCompletedByCase(migrateCompletedTools(readStorage(storageKeys.completed, {})));
      setDecisionByCase(readStorage(storageKeys.decisions, {}));
      setPackagesByCase(migrateReviewPackages(readStorage(storageKeys.packages, {})));
      setActionsByCase(readStorage(storageKeys.actions, {}));
      setDocumentRequestsByCase(readStorage(storageKeys.documentRequests, {}));
      setQuickPadByCase(migrateQuickPads(readStorage(storageKeys.quickPad, {})));
    };
    window.addEventListener('fraud-academy:cloud-hydrated', hydrateFromRecovery);
    return () => window.removeEventListener('fraud-academy:cloud-hydrated', hydrateFromRecovery);
  }, []);

  const caseId = activeCase.id;
  const noteDraft = noteDraftsByCase[caseId] ?? '';
  const reviewPackages = (packagesByCase[caseId] ?? []).filter((reviewPackage) => isValidReviewPackage(activeCase, reviewPackage));

  function setNoteDraft(nextValue) {
    setNoteDraftsByCase((current) => ({
      ...current,
      [caseId]: typeof nextValue === 'function' ? nextValue(current[caseId] ?? '') : nextValue,
    }));
  }

  return {
    tray: trayByCase[caseId] ?? [activeCase.trainingId],
    notes: notesByCase[caseId] ?? [],
    noteDraft,
    currentCompleted: completedByCase[caseId] ?? ['Case Summary'],
    decisionDraft: decisionByCase[caseId] ?? defaultDecisionDraft,
    reviewPackages,
    actionLog: [...(actionsByCase[caseId] ?? []), ...(activeCase.actionLog ?? [])],
    documentRequests: documentRequestsByCase[caseId] ?? {},
    quickPad: quickPadByCase[caseId] ?? { items: [], scratch: '' },
    setTrayByCase,
    setNotesByCase,
    setNoteDraft,
    setCompletedByCase,
    setDecisionByCase,
    setPackagesByCase,
    setActionsByCase,
    setDocumentRequestsByCase,
    setQuickPadByCase,
  };
}
