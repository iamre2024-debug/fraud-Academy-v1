import { useEffect, useMemo, useState } from 'react';
import {
  defaultDecisionDraft,
  readStorage,
  storageKeys,
  writeStorage,
} from './visualWorkspaceModel.js';

function normalizeTray(items = [], activeCase) {
  return items.map((item, index) => {
    if (typeof item !== 'string') return item;
    return {
      id: `legacy-${activeCase.id}-${index}-${item}`,
      label: item,
      value: item,
      sourceTool: item === activeCase.trainingId ? 'Customer 360' : '',
      caseId: activeCase.id,
      pinnedAt: 0,
    };
  });
}

export default function useVisualWorkspaceCaseState(activeCase) {
  const [trayByCase, setTrayByCase] = useState(() => readStorage(storageKeys.tray, {}));
  const [notesByCase, setNotesByCase] = useState(() => readStorage(storageKeys.notes, {}));
  const [completedByCase, setCompletedByCase] = useState(() => readStorage(storageKeys.completed, {}));
  const [decisionByCase, setDecisionByCase] = useState(() => readStorage(storageKeys.decisions, {}));
  const [packagesByCase, setPackagesByCase] = useState(() => readStorage(storageKeys.packages, {}));
  const [packetsByCase, setPacketsByCase] = useState(() => readStorage(storageKeys.reportPackets, {}));

  useEffect(() => writeStorage(storageKeys.tray, trayByCase), [trayByCase]);
  useEffect(() => writeStorage(storageKeys.notes, notesByCase), [notesByCase]);
  useEffect(() => writeStorage(storageKeys.completed, completedByCase), [completedByCase]);
  useEffect(() => writeStorage(storageKeys.decisions, decisionByCase), [decisionByCase]);
  useEffect(() => writeStorage(storageKeys.packages, packagesByCase), [packagesByCase]);
  useEffect(() => writeStorage(storageKeys.reportPackets, packetsByCase), [packetsByCase]);

  const caseId = activeCase.id;
  const tray = useMemo(() => normalizeTray(trayByCase[caseId] ?? [activeCase.trainingId], activeCase), [trayByCase, caseId, activeCase]);

  return {
    tray,
    notes: notesByCase[caseId] ?? [],
    currentCompleted: completedByCase[caseId] ?? ['Case Summary'],
    decisionDraft: decisionByCase[caseId] ?? defaultDecisionDraft,
    reviewPackages: packagesByCase[caseId] ?? [],
    reportPackets: packetsByCase[caseId] ?? [],
    setTrayByCase,
    setNotesByCase,
    setCompletedByCase,
    setDecisionByCase,
    setPackagesByCase,
    setPacketsByCase,
  };
}
