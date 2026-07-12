import { useEffect, useState } from 'react';
import VisualWorkspace from './VisualWorkspace.jsx';
import VisualNavigation from './VisualNavigation.jsx';
import VisualTextCollapse from './VisualTextCollapse.jsx';
import LunaPostSubmissionPanel from './LunaPostSubmissionPanel.jsx';
import GeneratedCaseControls from './GeneratedCaseControls.jsx';
import CasesThemeV1Panel from './CasesThemeV1Panel.jsx';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import { combineCaseCatalog, listGeneratedCases } from './data/generatedCaseRepository.js';

const enrichedBaseCases = enrichTrainingCases(baseCases);

export default function VisualApp() {
  const [caseCatalog, setCaseCatalog] = useState(enrichedBaseCases);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeCaseId, setActiveCaseId] = useState(() => enrichedBaseCases[0]?.id ?? '');
  const activeCase = caseCatalog.find((item) => item.id === activeCaseId) ?? caseCatalog[0];

  useEffect(() => {
    let cancelled = false;

    listGeneratedCases()
      .then((generatedCases) => {
        if (cancelled) return;
        setCaseCatalog(enrichTrainingCases(combineCaseCatalog(baseCases, generatedCases)));
      })
      .catch(() => {
        if (!cancelled) setCaseCatalog(enrichedBaseCases);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.body.dataset.visualTab = activeTab;
  }, [activeTab]);

  function openCase(caseId) {
    setActiveCaseId(caseId);
    setActiveTab('workspace');
  }

  function handleGeneratedCase(nextCase) {
    setCaseCatalog((current) => enrichTrainingCases(combineCaseCatalog(baseCases, [nextCase, ...current.filter((item) => !baseCases.some((base) => base.id === item.id))])));
    openCase(nextCase.id);
  }

  function returnToQueue() {
    setActiveTab('cases');
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }

  function returnToWorkspace() {
    setActiveTab('workspace');
    window.setTimeout(() => document.querySelector('.active-case-workflow')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function viewCaseSummary() {
    setActiveTab('workspace');
    window.setTimeout(() => document.querySelector('[data-workflow-stage="briefing"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
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
      <LunaPostSubmissionPanel
        activeCase={activeCase}
        activeCaseId={activeCaseId}
        onBackToWorkspace={returnToWorkspace}
        onViewCaseSummary={viewCaseSummary}
        onReturnToQueue={returnToQueue}
      />
      <VisualNavigation
        activeTab={activeTab}
        activeCaseId={activeCaseId}
        cases={caseCatalog}
        onNavigate={setActiveTab}
        onOpenCase={openCase}
      />
      <CasesThemeV1Panel
        active={activeTab === 'cases'}
        activeCaseId={activeCaseId}
        cases={caseCatalog}
        onOpenCase={openCase}
      />
      <VisualTextCollapse />
    </>
  );
}
