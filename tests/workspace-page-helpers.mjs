import { expect } from '@playwright/test';

export async function openWorkspacePages(page) {
  const workflow = page.locator('.active-case-workflow');
  if (await workflow.isVisible()) return workflow;

  const pagesButton = page.getByRole('button', { name: 'Pages', exact: true });
  await expect(pagesButton).toBeVisible();
  await pagesButton.click();
  await expect(workflow).toBeVisible();
  return workflow;
}

export async function openWorkflowStage(page, stageName) {
  const workflow = await openWorkspacePages(page);
  await workflow.getByRole('button', { name: stageName }).click();
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
  const groupButton = groups.getByRole('button', { name: groupName });
  await expect(groupButton).toBeVisible();
  await groupButton.click();
  return groups;
}
