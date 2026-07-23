import { useEffect, useState } from 'react';
import VisualWorkspace from './VisualWorkspace.jsx';
import VisualNavigation from './VisualNavigation.jsx';
import VisualTextCollapse from './VisualTextCollapse.jsx';
import LunaPostSubmissionPanel from './LunaPostSubmissionPanel.jsx';
import GeneratedCaseControls from './GeneratedCaseControls.jsx';
import CasesThemeV1Panel from './CasesThemeV1Panel.jsx';
import MobileMissionDeckApp from './MobileMissionDeckApp.jsx';
import useResponsiveLayoutMode from './useResponsiveLayoutMode.js';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import { coreClaimTypes } from './data/claimRegistry.js';
import { combineCaseCatalog, generateAndSaveCases, listGeneratedCases } from './data/generatedCaseRepository.js';

const enrichedBaseCases = enrichTrainingCases(baseCases);

export default function VisualApp() {
  const [caseCatalog, setCaseCatalog] = useState(enrichedBaseCases);
  const [activeTab, setActiveTab] = useState('workspace');
  const [activeCaseId, setActiveCaseId] = useState(() => enrichedBaseCases[0]?.id ?? '');
  const [workspaceScreen, setWorkspaceScreen] = useState('briefing');
  const activeCase = caseCatalog.find((item) => item.id === activeCaseId) ?? caseCatalog[0];
  const layoutController = useResponsiveLayoutMode();

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

  function openCase(caseId, nextWorkspaceScreen = 'briefing') {
    setActiveCaseId(caseId);
    setWorkspaceScreen(nextWorkspaceScreen);
    setActiveTab('workspace');
  }

  function handleGeneratedCase(nextCase) {
    setCaseCatalog((current) => enrichTrainingCases(combineCaseCatalog(baseCases, [nextCase, ...current.filter((item) => !baseCases.some((base) => base.id === item.id))])));
    openCase(nextCase.id);
  }

  async function handleGeneratedCases(config) {
    const createdCases = await generateAndSaveCases(config);
    setCaseCatalog((current) => enrichTrainingCases(combineCaseCatalog(
      baseCases,
      [...createdCases, ...current.filter((item) => !baseCases.some((base) => base.id === item.id))],
    )));
    if (createdCases.length === 1) openCase(createdCases[0].id);
    return createdCases;
  }

  function returnToQueue() {
    setActiveTab('cases');
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }

  function returnToWorkspace() {
    setWorkspaceScreen('tool-menu');
    setActiveTab('workspace');
    window.setTimeout(() => document.querySelector('.active-case-workflow')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function viewCaseSummary() {
    setWorkspaceScreen('briefing');
    setActiveTab('workspace');
    window.setTimeout(() => document.querySelector('[data-workflow-stage="briefing"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  if (layoutController.resolvedLayout === 'mobile') {
    return (
      <>
        <MobileMissionDeckApp
          activeTab={activeTab}
          activeCase={activeCase}
          activeCaseId={activeCaseId}
          cases={caseCatalog}
          claimTypes={coreClaimTypes}
          layoutController={layoutController}
          onGenerateCases={handleGeneratedCases}
          onNavigate={setActiveTab}
          onOpenCase={openCase}
          quickGenerator={<GeneratedCaseControls inline onCaseGenerated={handleGeneratedCase} />}
          workspace={(
            <VisualWorkspace
              activeCaseId={activeCaseId}
              cases={caseCatalog}
              layoutMode="mobile"
              onCaseChange={openCase}
              onNavigate={setActiveTab}
              requestedWorkspaceScreen={workspaceScreen}
              onWorkspaceScreenChange={setWorkspaceScreen}
            />
          )}
          luna={(
            <LunaPostSubmissionPanel
              activeCase={activeCase}
              activeCaseId={activeCaseId}
              onBackToWorkspace={returnToWorkspace}
              onViewCaseSummary={viewCaseSummary}
              onReturnToQueue={returnToQueue}
              visible={activeTab === 'workspace' && workspaceScreen === 'debrief'}
            />
          )}
        />
        <VisualTextCollapse />
      </>
    );
  }

  return (
    <>
      <VisualWorkspace
        activeCaseId={activeCaseId}
        cases={caseCatalog}
        onCaseChange={openCase}
        onNavigate={setActiveTab}
        requestedWorkspaceScreen={workspaceScreen}
        onWorkspaceScreenChange={setWorkspaceScreen}
      />
      <GeneratedCaseControls onCaseGenerated={handleGeneratedCase} />
      <LunaPostSubmissionPanel
        activeCase={activeCase}
        activeCaseId={activeCaseId}
        onBackToWorkspace={returnToWorkspace}
        onViewCaseSummary={viewCaseSummary}
        onReturnToQueue={returnToQueue}
        visible={activeTab === 'workspace' && workspaceScreen === 'debrief'}
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
        claimTypes={coreClaimTypes}
        onGenerateCases={handleGeneratedCases}
        onOpenCase={openCase}
      />
      <VisualTextCollapse />
    </>
  );
}
