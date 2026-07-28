import { expect } from '@playwright/test';

const workflowStages = [
  { names: ['briefing', 'case briefing'], buttonName: /\b(?:case )?briefing\b/i, screen: 'briefing' },
  { names: ['investigate'], buttonName: /\binvestigate\b/i, screen: 'tool-menu' },
  { names: ['timeline'], buttonName: /\btimeline\b/i, screen: 'timeline' },
  { names: ['indicators', 'evidence'], buttonName: /\b(?:indicators|evidence)\b/i },
  { names: ['determination', 'decision'], buttonName: /\b(?:determination|decision)\b/i, screen: 'determination' },
  { names: ['debrief'], buttonName: /\bdebrief\b/i, screen: 'debrief' },
];

const mobileToolGroups = [
  {
    names: ['identity & customer'],
    cluster: 'Identity & Customer',
    defaultTool: 'Customer 360',
  },
  {
    names: ['login, session, device & ip'],
    cluster: 'Login, Session, Device & IP',
    defaultTool: 'Login History',
  },
  {
    names: ['transactions & financial'],
    cluster: 'Transactions & Financial',
    defaultTool: 'Transaction History',
  },
  {
    names: ['merchant & disputes'],
    cluster: 'Transactions & Financial',
    defaultTool: 'Merchant Intelligence',
  },
  {
    names: ['business & payment verification'],
    cluster: 'Business & Payment Verification',
    defaultTool: 'Payment Verification',
  },
  {
    names: ['documents & requests'],
    cluster: 'Evidence & Workflow',
    defaultTool: 'Document Viewer',
  },
  {
    names: ['links & related cases'],
    cluster: 'Evidence & Workflow',
    defaultTool: 'Link Analysis',
  },
  {
    names: ['workflow review'],
    cluster: 'Evidence & Workflow',
    defaultTool: 'Timeline',
  },
];

function matchesStageRequest(stageName, candidate) {
  if (stageName instanceof RegExp) {
    const flags = stageName.flags.includes('i') ? stageName.flags : `${stageName.flags}i`;
    return new RegExp(stageName.source, flags).test(candidate);
  }
  return String(stageName).trim().toLowerCase() === candidate;
}

export async function openWorkspacePages(page) {
  const desktopWorkflow = page.locator('.active-case-workflow');
  if (await desktopWorkflow.isVisible()) return desktopWorkflow;

  const mobileWorkflow = page.locator('.mission-path-v3');
  if (await mobileWorkflow.isVisible()) return mobileWorkflow;

  const focusedMobileReview = page.locator(
    '[data-mobile-review-screen="determination"], '
    + '.mission-workspace-v3[data-workspace-screen="submit"], '
    + '[data-luna-screen="approved-theme-v1"]:visible',
  );
  if (await focusedMobileReview.first().isVisible()) {
    for (let step = 0; step < 4; step += 1) {
      const backButton = page.getByRole('button', { name: 'Back to previous mission screen', exact: true });
      if (!(await backButton.isVisible())) break;
      await backButton.click();
      if (await mobileWorkflow.isVisible()) return mobileWorkflow;
      if (await page.getByRole('button', { name: 'Open mission pages', exact: true }).isVisible()) break;
    }
  }

  const desktopPagesButton = page.getByRole('button', { name: 'Pages', exact: true });
  const usesDesktopPages = await desktopPagesButton.isVisible();
  const pagesButton = usesDesktopPages
    ? desktopPagesButton
    : page.getByRole('button', { name: 'Open mission pages', exact: true });
  await expect(pagesButton).toBeVisible();
  await pagesButton.click();

  const workflow = usesDesktopPages ? desktopWorkflow : mobileWorkflow;
  await expect(workflow).toBeVisible();
  return workflow;
}

export async function openWorkflowStage(page, stageName) {
  const workflow = await openWorkspacePages(page);
  const stage = workflowStages.find(({ names }) => names.some((name) => matchesStageRequest(stageName, name)));
  const stageButton = workflow.getByRole('button', { name: stage?.buttonName ?? stageName });
  const expectedScreen = stage?.screen;

  await expect(stageButton).toBeVisible();
  await stageButton.click();

  if (expectedScreen) {
    await expect(page.locator('.visual-os-frame, .mission-workspace-v3')).toHaveAttribute('data-workspace-screen', expectedScreen);
  }
  if (expectedScreen === 'debrief') {
    await expect(page.locator('[data-luna-screen="approved-theme-v1"]')).toBeVisible();
  }
}

export async function openToolGroups(page) {
  const desktopGroups = page.locator('[data-investigation-tool-groups="approved-theme-v1"]');
  if (await desktopGroups.isVisible()) return desktopGroups;

  const mobileMap = page.locator('[data-mobile-tool-map="reference-v1"]');
  if (await mobileMap.isVisible()) return mobileMap;

  const mobileCustomerActionsButton = page.getByRole('button', {
    name: 'Open Customer 360 actions',
    exact: true,
  });
  if (await mobileCustomerActionsButton.isVisible()) {
    await mobileCustomerActionsButton.click();
    await page.getByRole('dialog', { name: 'Customer 360 actions' })
      .getByRole('button', { name: /All tools/ })
      .click();
    await expect(mobileMap).toBeVisible();
    return mobileMap;
  }

  await openWorkflowStage(page, /Investigate/);
  if (await mobileMap.isVisible()) return mobileMap;
  await expect(desktopGroups).toBeVisible();
  return desktopGroups;
}

export async function selectToolGroup(page, groupName) {
  const groups = await openToolGroups(page);
  if (await groups.getAttribute('data-mobile-tool-map')) {
    const mobileGroup = mobileToolGroups.find(({ names }) => (
      names.some((name) => matchesStageRequest(groupName, name))
    ));
    const clusterButton = groups.locator('.mobile-tool-map-cluster').filter({
      hasText: mobileGroup?.cluster ?? groupName,
    });
    await expect(clusterButton).toBeVisible();
    await clusterButton.click();

    const tray = groups.locator('#mobile-tool-map-tray');
    await expect(tray).toBeVisible();
    const toolButton = mobileGroup?.defaultTool
      ? tray.getByRole('button', { name: new RegExp(mobileGroup.defaultTool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      : tray.getByRole('button').first();
    await expect(toolButton).toBeVisible();
    await toolButton.click();
    return groups;
  }

  const evidenceMapButton = groups.locator('.mission-map-tool-node').filter({ hasText: groupName });
  const legacyRowButton = groups.locator('.visual-category-row > button').filter({ hasText: groupName });
  const groupButton = await evidenceMapButton.isVisible() ? evidenceMapButton : legacyRowButton;
  await expect(groupButton).toBeVisible();
  await groupButton.click();
  return groups;
}

export async function runPaymentVerification(panel, {
  bankCode,
  destinationId,
  ownerName,
  person,
}) {
  await panel.getByRole('textbox', { name: 'Bank Code', exact: true }).fill(bankCode);
  await panel.getByRole('textbox', { name: 'Destination ID', exact: true }).fill(destinationId);
  await panel.getByRole('textbox', { name: 'Owner or business name', exact: true }).fill(ownerName ?? person);
  await panel.getByRole('button', { name: 'Run verification', exact: true }).click();
  const result = panel.getByRole('status', { name: 'Payment verification result' });
  await expect(result).toBeVisible();
  return result;
}
