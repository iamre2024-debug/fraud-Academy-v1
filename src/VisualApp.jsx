import { useEffect, useState } from 'react';
import VisualWorkspace from './VisualWorkspace.jsx';
import VisualNavigation from './VisualNavigation.jsx';
import VisualTextCollapse from './VisualTextCollapse.jsx';
import SystemAccessLane from './SystemAccessLane.jsx';
import LunaPostSubmissionPanel from './LunaPostSubmissionPanel.jsx';
import { trainingCases } from './data/cases.js';

export default function VisualApp() {
  const [activeTab, setActiveTab] = useState('workspace');
  const [activeCaseId, setActiveCaseId] = useState(trainingCases[0]?.id ?? '');

  useEffect(() => {
    document.body.dataset.visualTab = activeTab;
  }, [activeTab]);

  function openCase(caseId) {
    setActiveCaseId(caseId);
    setActiveTab('workspace');
  }

  return (
    <>
      <VisualWorkspace
        activeCaseId={activeCaseId}
        onCaseChange={openCase}
        onNavigate={setActiveTab}
      />
      <SystemAccessLane activeCaseId={activeCaseId} />
      <LunaPostSubmissionPanel activeCaseId={activeCaseId} />
      <VisualNavigation
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onOpenCase={openCase}
      />
      <VisualTextCollapse />
    </>
  );
}
