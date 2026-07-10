import { useEffect, useState } from 'react';
import VisualWorkspace from './VisualWorkspace.jsx';
import VisualNavigation from './VisualNavigation.jsx';
import VisualTextCollapse from './VisualTextCollapse.jsx';
import LunaPostSubmissionPanel from './LunaPostSubmissionPanel.jsx';
import GeneratedCaseControls from './GeneratedCaseControls.jsx';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';

export default function VisualApp() {
  const [caseCatalog, setCaseCatalog] = useState(() => enrichTrainingCases(baseCases));
  const [activeTab, setActiveTab] = useState('workspace');
  const [activeCaseId, setActiveCaseId] = useState(() => enrichTrainingCases(baseCases)[0]?.id ?? '');

  useEffect(() => {
    document.body.dataset.visualTab = activeTab;
  }, [activeTab]);

  function openCase(caseId) {
    setActiveCaseId(caseId);
    setActiveTab('workspace');
  }

  function handleGeneratedCase(nextCase) {
    const nextCatalog = enrichTrainingCases(baseCases);
    setCaseCatalog(nextCatalog);
    openCase(nextCase.id);
  }

  return (
    <>
      <VisualWorkspace
        activeCaseId={activeCaseId}
        cases={caseCatalog}
        onCaseChange={openCase}
        onNavigate={setActiveTab}
      />
      <GeneratedCaseControls onCaseGenerated={handleGeneratedCase} />
      <LunaPostSubmissionPanel activeCaseId={activeCaseId} />
      <VisualNavigation
        activeTab={activeTab}
        cases={caseCatalog}
        onNavigate={setActiveTab}
        onOpenCase={openCase}
      />
      <VisualTextCollapse />
    </>
  );
}
