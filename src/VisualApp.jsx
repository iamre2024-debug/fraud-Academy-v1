import { useEffect, useRef, useState } from 'react';
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
import { cloudSyncEvents, initializeCloudSync } from './data/cloudSyncClient.js';
import {
  makeResumeSessionResource,
  normalizeResumeSession,
  readResumeSession,
} from './data/resumeSession.js';
import { storageKeys } from './data/persistenceKeys.js';
import { writeStorage } from './visualWorkspaceModel.js';

const enrichedBaseCases = enrichTrainingCases(baseCases);

export default function VisualApp() {
  const [initialResumeSession] = useState(() => readResumeSession());
  const [caseCatalog, setCaseCatalog] = useState(enrichedBaseCases);
  const [activeTab, setActiveTab] = useState(() => initialResumeSession?.activeTab ?? 'workspace');
  const [activeCaseId, setActiveCaseId] = useState(() => initialResumeSession?.activeCaseId || enrichedBaseCases[0]?.id || '');
  const [workspaceScreen, setWorkspaceScreen] = useState(() => initialResumeSession?.workspaceScreen ?? 'briefing');
  const [workspaceTool, setWorkspaceTool] = useState(() => initialResumeSession?.activeTool ?? 'Login History');
  const skipInitialResumeWrite = useRef(true);
  const activeCase = caseCatalog.find((item) => item.id === activeCaseId) ?? caseCatalog[0];
  const layoutController = useResponsiveLayoutMode();

  useEffect(() => {
    let cancelled = false;
    let cloudHydrated = false;

    const refreshGeneratedCases = async ({ restoreResume = false } = {}) => {
      try {
        const generatedCases = await listGeneratedCases();
        if (cancelled) return;
        const nextCatalog = enrichTrainingCases(combineCaseCatalog(baseCases, generatedCases));
        setCaseCatalog(nextCatalog);

        if (!restoreResume) {
          if (
            !cloudHydrated
            && initialResumeSession?.activeCaseId
            && !nextCatalog.some((item) => item.id === initialResumeSession.activeCaseId)
          ) {
            setActiveCaseId(nextCatalog[0]?.id ?? '');
          }
          return;
        }
        const session = readResumeSession();
        if (!session) return;
        const nextCaseId = nextCatalog.some((item) => item.id === session.activeCaseId)
          ? session.activeCaseId
          : nextCatalog[0]?.id ?? '';
        setActiveTab(session.activeTab);
        setActiveCaseId(nextCaseId);
        setWorkspaceScreen(session.workspaceScreen);
        setWorkspaceTool(session.activeTool);
      } catch {
        if (!cancelled) setCaseCatalog(enrichedBaseCases);
      }
    };

    const handleGeneratedCasesUpdated = (event) => {
      if (event.detail?.reason === 'cloud-hydrated') return;
      refreshGeneratedCases();
    };
    const handleCloudHydration = () => {
      cloudHydrated = true;
      refreshGeneratedCases({ restoreResume: true });
    };

    window.addEventListener('fraud-academy:generated-cases-updated', handleGeneratedCasesUpdated);
    window.addEventListener(cloudSyncEvents.hydration, handleCloudHydration);
    initializeCloudSync();
    refreshGeneratedCases();

    return () => {
      cancelled = true;
      window.removeEventListener('fraud-academy:generated-cases-updated', handleGeneratedCasesUpdated);
      window.removeEventListener(cloudSyncEvents.hydration, handleCloudHydration);
    };
  }, []);

  useEffect(() => {
    if (skipInitialResumeWrite.current) {
      skipInitialResumeWrite.current = false;
      return;
    }

    const session = normalizeResumeSession({
      activeTab,
      activeCaseId,
      workspaceScreen,
      activeTool: workspaceTool,
    });
    writeStorage(storageKeys.resumeSession, makeResumeSessionResource(session));
  }, [activeCaseId, activeTab, workspaceScreen, workspaceTool]);

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

  function openMobileWorkspace(nextWorkspaceScreen = 'briefing') {
    setWorkspaceScreen(nextWorkspaceScreen);
    setActiveTab('workspace');
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
          onOpenWorkspace={openMobileWorkspace}
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
              requestedWorkspaceTool={workspaceTool}
              onWorkspaceToolChange={setWorkspaceTool}
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
        requestedWorkspaceTool={workspaceTool}
        onWorkspaceToolChange={setWorkspaceTool}
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
