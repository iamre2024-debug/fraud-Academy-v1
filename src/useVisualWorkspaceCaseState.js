import { useEffect, useState } from 'react';
import {
  defaultDecisionDraft,
  readStorage,
  storageKeys,
  writeStorage,
} from './visualWorkspaceModel.js';
import {
  isValidReviewPackage,
  normalizeDecisionDraft,
  normalizeReviewPackage,
} from './data/reviewPackage.js';
import {
  normalizeActionsByCase,
  normalizeCompletedToolsByCase,
  normalizeNotesByCase,
  normalizeQuickPadByCase,
} from './data/caseMigration.js';
import { caseStorageMigrationEvent } from './data/cloudSyncClient.js';

export default function useVisualWorkspaceCaseState(activeCase) {
  const [trayByCase, setTrayByCase] = useState(() => readStorage(storageKeys.tray, {}));
  const [notesByCase, setNotesByCase] = useState(() => normalizeNotesByCase(readStorage(storageKeys.notes, {})));
  const [noteDraftsByCase, setNoteDraftsByCase] = useState(() => readStorage(storageKeys.noteDrafts, {}));
  const [completedByCase, setCompletedByCase] = useState(() => normalizeCompletedToolsByCase(readStorage(storageKeys.completed, {})));
  const [decisionByCase, setDecisionByCase] = useState(() => readStorage(storageKeys.decisions, {}));
  const [packagesByCase, setPackagesByCase] = useState(() => readStorage(storageKeys.packages, {}));
  const [actionsByCase, setActionsByCase] = useState(() => normalizeActionsByCase(readStorage(storageKeys.actions, {})));
  const [documentRequestsByCase, setDocumentRequestsByCase] = useState(() => readStorage(storageKeys.documentRequests, {}));
  const [quickPadByCase, setQuickPadByCase] = useState(() => normalizeQuickPadByCase(readStorage(storageKeys.quickPad, {})));
  const [payrollInvestigationsByCase, setPayrollInvestigationsByCase] = useState(() => readStorage(storageKeys.payrollInvestigations, {}));

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
  useEffect(() => writeStorage(storageKeys.payrollInvestigations, payrollInvestigationsByCase), [payrollInvestigationsByCase]);

  useEffect(() => {
    const hydrateFromRecovery = () => {
      setTrayByCase(readStorage(storageKeys.tray, {}));
      setNotesByCase(normalizeNotesByCase(readStorage(storageKeys.notes, {})));
      setNoteDraftsByCase(readStorage(storageKeys.noteDrafts, {}));
      setCompletedByCase(normalizeCompletedToolsByCase(readStorage(storageKeys.completed, {})));
      setDecisionByCase(readStorage(storageKeys.decisions, {}));
      setPackagesByCase(readStorage(storageKeys.packages, {}));
      setActionsByCase(normalizeActionsByCase(readStorage(storageKeys.actions, {})));
      setDocumentRequestsByCase(readStorage(storageKeys.documentRequests, {}));
      setQuickPadByCase(normalizeQuickPadByCase(readStorage(storageKeys.quickPad, {})));
      setPayrollInvestigationsByCase(readStorage(storageKeys.payrollInvestigations, {}));
    };
    window.addEventListener('fraud-academy:cloud-hydrated', hydrateFromRecovery);
    window.addEventListener(caseStorageMigrationEvent, hydrateFromRecovery);
    return () => {
      window.removeEventListener('fraud-academy:cloud-hydrated', hydrateFromRecovery);
      window.removeEventListener(caseStorageMigrationEvent, hydrateFromRecovery);
    };
  }, []);

  const caseId = activeCase.id;
  const noteDraft = noteDraftsByCase[caseId] ?? '';
  const decisionDraft = normalizeDecisionDraft(decisionByCase[caseId] ?? defaultDecisionDraft, activeCase);
  const reviewPackages = (packagesByCase[caseId] ?? [])
    .map((reviewPackage) => normalizeReviewPackage(reviewPackage, activeCase))
    .filter((reviewPackage) => isValidReviewPackage(activeCase, reviewPackage));

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
    decisionDraft,
    reviewPackages,
    actionLog: [
      ...(actionsByCase[caseId] ?? []),
      ...(normalizeActionsByCase({ [caseId]: activeCase.actionLog ?? [] })[caseId] ?? []),
    ],
    documentRequests: documentRequestsByCase[caseId] ?? {},
    quickPad: quickPadByCase[caseId] ?? { items: [], scratch: '' },
    payrollInvestigation: payrollInvestigationsByCase[caseId] ?? {},
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
  };
}
