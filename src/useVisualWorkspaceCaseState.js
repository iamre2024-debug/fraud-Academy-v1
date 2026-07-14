import { useEffect, useState } from 'react';
import {
  defaultDecisionDraft,
  readStorage,
  storageKeys,
  writeStorage,
} from './visualWorkspaceModel.js';

export default function useVisualWorkspaceCaseState(activeCase) {
  const [trayByCase, setTrayByCase] = useState(() => readStorage(storageKeys.tray, {}));
  const [notesByCase, setNotesByCase] = useState(() => readStorage(storageKeys.notes, {}));
  const [completedByCase, setCompletedByCase] = useState(() => readStorage(storageKeys.completed, {}));
  const [decisionByCase, setDecisionByCase] = useState(() => readStorage(storageKeys.decisions, {}));
  const [packagesByCase, setPackagesByCase] = useState(() => readStorage(storageKeys.packages, {}));

  useEffect(() => writeStorage(storageKeys.tray, trayByCase), [trayByCase]);
  useEffect(() => writeStorage(storageKeys.notes, notesByCase), [notesByCase]);
  useEffect(() => writeStorage(storageKeys.completed, completedByCase), [completedByCase]);
  useEffect(() => writeStorage(storageKeys.decisions, decisionByCase), [decisionByCase]);
  useEffect(() => writeStorage(storageKeys.packages, packagesByCase), [packagesByCase]);

  const caseId = activeCase.id;

  return {
    tray: trayByCase[caseId] ?? [activeCase.trainingId],
    notes: notesByCase[caseId] ?? [],
    currentCompleted: completedByCase[caseId] ?? ['Case Summary'],
    decisionDraft: decisionByCase[caseId] ?? defaultDecisionDraft,
    reviewPackages: packagesByCase[caseId] ?? [],
    setTrayByCase,
    setNotesByCase,
    setCompletedByCase,
    setDecisionByCase,
    setPackagesByCase,
  };
}
