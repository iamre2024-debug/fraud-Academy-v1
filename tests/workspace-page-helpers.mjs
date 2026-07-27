import { expect } from '@playwright/test';

const workflowStages = [
  { names: ['briefing', 'case briefing'], buttonName: /\b(?:case )?briefing\b/i, screen: 'briefing' },
  { names: ['investigate'], buttonName: /\binvestigate\b/i, screen: 'tool-menu' },
  { names: ['timeline'], buttonName: /\btimeline\b/i, screen: 'timeline' },
  { names: ['indicators', 'evidence'], buttonName: /^(?:indicators|evidence)\b/i, screen: 'indicators' },
  { names: ['determination', 'decision'], buttonName: /\b(?:determination|decision)\b/i, screen: 'determination' },
  { names: ['debrief'], buttonName: /\bdebrief\b/i, screen: 'debrief' },
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

  const desktopPagesButton = page.getByRole('button', { name: 'Pages', exact: true });
  const usesDesktopPages = await desktopPagesButton.isVisible();
  if (usesDesktopPages) {
    await desktopPagesButton.click();
  } else {
    await openMobileWorkspaceShortcut(page, 'Path');
  }

  const workflow = usesDesktopPages ? desktopWorkflow : mobileWorkflow;
  await expect(workflow).toBeVisible();
  return workflow;
}

export async function openMobileWorkspaceMenu(page) {
  const menu = page.locator('.mission-workspace-overflow');
  await expect(menu).toBeVisible();
  if (!await menu.evaluate((element) => element.open)) {
    await menu.getByRole('button', { name: 'Open workspace menu', exact: true }).click();
  }
  await expect(menu.locator(':scope > section')).toBeVisible();
  return menu;
}

export async function openMobileWorkspaceShortcut(page, shortcutName) {
  const menu = await openMobileWorkspaceMenu(page);
  const shortcut = menu
    .getByRole('navigation', { name: 'Workspace shortcuts' })
    .getByRole('button')
    .filter({ hasText: shortcutName });
  await expect(shortcut).toBeVisible();
  await shortcut.click();
  return shortcut;
}

export async function openWorkflowStage(page, stageName) {
  const workflow = await openWorkspacePages(page);
  const stage = workflowStages.find(({ names }) => names.some((name) => matchesStageRequest(stageName, name)));
  const stageButton = stage
    ? workflow.locator(`[data-workflow-stage-button="${stage.names[0]}"]`)
    : workflow.getByRole('button', { name: stageName });
  const mobile = await page.locator('.mission-workspace-v3').isVisible();
  const expectedScreen = stage?.screen === 'indicators' && !mobile ? 'evidence' : stage?.screen;

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
  const groups = page.locator('[data-investigation-tool-groups="approved-theme-v1"]');
  if (await groups.isVisible()) return groups;

  if (await page.locator('.mission-workspace-v3').isVisible()) {
    await openMobileWorkspaceShortcut(page, 'All tools');
  } else {
    await openWorkflowStage(page, /Investigate/);
  }
  await expect(groups).toBeVisible();
  return groups;
}

export async function selectToolGroup(page, groupName) {
  const groups = await openToolGroups(page);
  const evidenceMapButton = groups.locator('.mission-map-tool-node').filter({ hasText: groupName });
  const legacyRowButton = groups.locator('.visual-category-row > button').filter({ hasText: groupName });
  const groupButton = await evidenceMapButton.isVisible() ? evidenceMapButton : legacyRowButton;
  await expect(groupButton).toBeVisible();
  await groupButton.click();
  return groups;
}

export async function selectCurrentGroupTool(page, toolName) {
  const mobileShell = page.locator('.mission-workspace-v3');
  if (await mobileShell.isVisible()) {
    if (await mobileShell.getAttribute('data-active-tool') === toolName) return;

    const menu = await openMobileWorkspaceMenu(page);
    const selector = menu.getByRole('combobox', { name: 'Choose mobile investigation tool', exact: true });
    await expect(selector).toBeVisible();
    if (await selector.inputValue() !== toolName) await selector.selectOption(toolName);
    await expect(mobileShell).toHaveAttribute('data-active-tool', toolName);
    return;
  }

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const selector = panel.getByRole('combobox', { name: 'Choose investigation tool', exact: true });
  await expect(selector).toBeVisible();
  if (await selector.inputValue() !== toolName) await selector.selectOption(toolName);
  await expect(panel).toHaveAttribute('data-tool-name', toolName);
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
  await expect(panel.locator('.payment-detail-panel')).toBeVisible();
  return panel.locator('.payment-detail-panel');
}
