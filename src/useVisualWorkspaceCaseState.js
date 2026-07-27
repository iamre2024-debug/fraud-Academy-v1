import { useEffect, useState } from 'react';
import {
  defaultDecisionDraft,
  readStorage,
  storageKeys,
  writeStorage,
} from './visualWorkspaceModel.js';
import { isValidReviewPackage } from './data/reviewPackage.js';

const legacyToolNames = {
  'Evidence Center': 'Document Viewer',
  'Financial Intelligence': 'Financial Investigation',
  'Business Intelligence': 'KYB Review',
};

function migrateCompletedTools(saved) {
  return Object.fromEntries(Object.entries(saved).map(([caseId, tools]) => [
    caseId,
    [...new Set((tools ?? []).map((tool) => legacyToolNames[tool] ?? tool))],
  ]));
}

export default function useVisualWorkspaceCaseState(activeCase) {
  const [trayByCase, setTrayByCase] = useState(() => readStorage(storageKeys.tray, {}));
  const [notesByCase, setNotesByCase] = useState(() => readStorage(storageKeys.notes, {}));
  const [noteDraftsByCase, setNoteDraftsByCase] = useState(() => readStorage(storageKeys.noteDrafts, {}));
  const [completedByCase, setCompletedByCase] = useState(() => migrateCompletedTools(readStorage(storageKeys.completed, {})));
  const [decisionByCase, setDecisionByCase] = useState(() => readStorage(storageKeys.decisions, {}));
  const [packagesByCase, setPackagesByCase] = useState(() => readStorage(storageKeys.packages, {}));
  const [actionsByCase, setActionsByCase] = useState(() => readStorage(storageKeys.actions, {}));
  const [documentRequestsByCase, setDocumentRequestsByCase] = useState(() => readStorage(storageKeys.documentRequests, {}));
  const [quickPadByCase, setQuickPadByCase] = useState(() => readStorage(storageKeys.quickPad, {}));

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
      setPackagesByCase(readStorage(storageKeys.packages, {}));
      setActionsByCase(readStorage(storageKeys.actions, {}));
      setDocumentRequestsByCase(readStorage(storageKeys.documentRequests, {}));
      setQuickPadByCase(readStorage(storageKeys.quickPad, {}));
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
    quickPad: quickPadByCase[caseId] ?? { items: [], scratch: '', lastSavedAt: '' },
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
