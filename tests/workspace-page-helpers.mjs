import { expect } from '@playwright/test';

export async function openWorkspacePages(page) {
  const desktopWorkflow = page.locator('.active-case-workflow');
  if (await desktopWorkflow.isVisible()) return desktopWorkflow;

  const mobileWorkflow = page.locator('.mission-path-v3');
  if (await mobileWorkflow.isVisible()) return mobileWorkflow;

  const desktopPagesButton = page.getByRole('button', { name: 'Pages', exact: true });
  const usesDesktopPages = await desktopPagesButton.count() > 0;
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
  const stageButton = workflow.getByRole('button', { name: stageName });
  const label = (await stageButton.innerText()).toLowerCase();
  const expectedScreen = [
    ['briefing', 'briefing'],
    ['investigate', 'tool-menu'],
    ['timeline', 'timeline'],
    ['determination', 'determination'],
    ['debrief', 'debrief'],
  ].find(([stage]) => label.includes(stage))?.[1];

  await stageButton.click();

  if (expectedScreen) {
    await expect(page.locator('.visual-os-frame, .mission-workspace-v3')).toHaveAttribute('data-workspace-screen', expectedScreen);
  }
  if (expectedScreen === 'debrief') {
    await expect(page.locator('[data-luna-screen="approved-theme-v1"]')).toBeVisible();
  }
}

export async function openToolGroups(page) {
  const groups = page.locator('[data-investigation-tool-groups="approved-theme-v1"]');
  if (await groups.isVisible()) return groups;

  await openWorkflowStage(page, /Investigate/);
  await expect(groups).toBeVisible();
  return groups;
}

export async function selectToolGroup(page, groupName) {
  const groups = await openToolGroups(page);
  const groupButton = groups.locator('.visual-category-row > button').filter({ hasText: groupName });
  await expect(groupButton).toBeVisible();
  await groupButton.click();
  return groups;
}

export async function runPaymentVerification(panel, {
  bankCode,
  destinationId,
  ownerName,
}) {
  await panel.getByRole('textbox', { name: 'Bank Code', exact: true }).fill(bankCode);
  await panel.getByRole('textbox', { name: 'Destination ID', exact: true }).fill(destinationId);
  await panel.getByRole('textbox', { name: 'Owner or business name', exact: true }).fill(ownerName);
  await panel.getByRole('button', { name: 'Run verification', exact: true }).click();
  await expect(panel.locator('.payment-detail-panel')).toBeVisible();
  return panel.locator('.payment-detail-panel');
}
