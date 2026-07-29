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

function visibleLocator(locator) {
  return locator.filter({ visible: true });
}

export async function openCaseQueue(page) {
  const mobileNavigation = page.getByRole('navigation', { name: 'Mission navigation' });
  if (await mobileNavigation.isVisible()) {
    await mobileNavigation.getByRole('button', { name: 'Cases', exact: true }).click();
    const mobileQueue = page.locator('[data-mobile-case-queue="reference-v1"]');
    await expect(mobileQueue).toBeVisible();
    return mobileQueue;
  }

  await page.getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: 'Cases', exact: true })
    .click();
  const desktopQueue = page.locator('[data-cases-theme-v1="approved"]');
  await expect(desktopQueue).toBeVisible();
  return desktopQueue;
}

export async function generateCaseFromQueue(page, {
  alertReason,
  count,
  customerType,
  difficulty,
  evidenceDepth,
  product,
  scenario,
  workflow,
} = {}) {
  const queue = await openCaseQueue(page);
  const isMobileQueue = await queue.getAttribute('data-mobile-case-queue');
  let generator = queue;

  if (isMobileQueue) {
    await queue.getByRole('button', { name: /Create a fictional training case/ }).click();
    generator = queue.locator('#mobile-case-generator-dialog');
    await expect(generator).toBeVisible();
  }

  const label = (mobile, desktop) => (isMobileQueue ? mobile : desktop);
  const values = [
    [customerType, label('Customer type', 'Generate case customer type')],
    [product, label('Product', 'Generate case product')],
    [workflow, label('Review workflow', 'Generate case review workflow')],
    [alertReason, label('Alert reason', 'Generate case alert reason')],
    [scenario, label('Scenario', 'Generate case scenario')],
    [difficulty, label('Difficulty', 'Generate case difficulty')],
    [evidenceDepth, label('Evidence depth', 'Generate case evidence depth')],
    [count, label('Cases', 'Generate case count')],
  ];

  for (const [value, accessibleName] of values) {
    if (value !== undefined) {
      await generator.getByRole('combobox', { name: accessibleName, exact: true }).selectOption(String(value));
    }
  }

  await generator.getByRole('button', {
    name: isMobileQueue ? 'Generate training case' : 'Generate cases',
    exact: true,
  }).click();
  await expect(page.locator('[data-workspace-page="briefing"]')).toBeVisible();
  return queue;
}

export function activeCaseSelector(page) {
  return visibleLocator(page.locator(
    '.mission-workspace-case-selector select, '
    + '.visual-case-switcher select',
  )).first();
}

export async function selectActiveCase(page, caseId) {
  const selector = activeCaseSelector(page);
  if (await selector.isVisible()) {
    await selector.selectOption(caseId);
    await expect(selector).toHaveValue(caseId);
    return;
  }

  const toolActionsButton = visibleLocator(page.locator(
    '.mission-workspace-bar button[aria-controls="mobile-tool-actions-menu"]',
  )).first();
  await expect(toolActionsButton).toBeVisible();
  await toolActionsButton.click();

  const actions = page.locator('#mobile-tool-actions-menu');
  await expect(actions).toBeVisible();
  const menuSelector = actions.getByRole('combobox', { name: /Choose active .* case/ });
  await menuSelector.selectOption(caseId);
  await expect(actions).toHaveCount(0);
}

export async function openCaseFromQueue(page, caseId, action = 'Open Workspace') {
  const queue = await openCaseQueue(page);
  const isMobileQueue = Boolean(await queue.getAttribute('data-mobile-case-queue'));
  if (isMobileQueue) {
    const card = queue.locator('article').filter({ hasText: caseId });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: action, exact: true }).click();
  } else {
    await queue.getByRole('searchbox', { name: 'Search cases' }).fill(caseId);
    const card = queue.locator('.case-queue-item').filter({ hasText: caseId });
    await expect(card).toBeVisible();
    await card.locator('.nav-case-card').click();
  }
  await expect(page.locator(
    isMobileQueue && action === 'Open Workspace'
      ? '[data-workspace-page="tool-menu"]'
      : '[data-workspace-page="briefing"]',
  )).toBeVisible();
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

  const directMobilePagesButton = page.getByRole('button', {
    name: 'Open mission pages',
    exact: true,
  });
  if (await directMobilePagesButton.isVisible()) {
    await directMobilePagesButton.click();
    await expect(mobileWorkflow).toBeVisible();
    return mobileWorkflow;
  }

  const customerActionsButton = page.getByRole('button', {
    name: 'Open Customer 360 actions',
    exact: true,
  });
  if (await customerActionsButton.isVisible()) {
    await customerActionsButton.click();
    await page.getByRole('dialog', { name: 'Customer 360 actions' })
      .getByRole('button', { name: /All tools/ })
      .click();
  }

  const toolActionsButton = visibleLocator(page.locator(
    '.mission-workspace-bar button[aria-controls="mobile-tool-actions-menu"]',
  )).first();
  if (await toolActionsButton.isVisible()) {
    await toolActionsButton.click();
    await page.locator('#mobile-tool-actions-menu')
      .getByRole('button', { name: /All tools/ })
      .click();
  }

  const backToBusinessSearch = page.getByRole('button', {
    name: 'Back to Business Intelligence',
    exact: true,
  });
  if (await backToBusinessSearch.isVisible()) await backToBusinessSearch.click();

  const backToToolMap = page.getByRole('button', {
    name: 'Back to Tool Map',
    exact: true,
  });
  if (await backToToolMap.isVisible()) await backToToolMap.click();

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

  const toolActionsButton = visibleLocator(page.locator(
    '.mission-workspace-bar button[aria-controls="mobile-tool-actions-menu"]',
  )).first();
  if (await toolActionsButton.isVisible()) {
    await toolActionsButton.click();
    await page.locator('#mobile-tool-actions-menu')
      .getByRole('button', { name: /All tools/ })
      .click();
    await expect(mobileMap).toBeVisible();
    return mobileMap;
  }

  const businessBackButton = page.getByRole('button', {
    name: 'Back to Business Intelligence',
    exact: true,
  });
  if (await businessBackButton.isVisible()) await businessBackButton.click();

  const intelBackButton = page.getByRole('button', {
    name: 'Back to Tool Map',
    exact: true,
  });
  if (await intelBackButton.isVisible()) {
    await intelBackButton.click();
    await expect(mobileMap).toBeVisible();
    return mobileMap;
  }

  const mobileToolActions = page.getByRole('navigation', { name: 'Tool page actions' });
  if (await mobileToolActions.isVisible()) {
    await mobileToolActions.getByRole('button', { name: /All tools/ }).click();
    await expect(mobileMap).toBeVisible();
    return mobileMap;
  }

  await openWorkflowStage(page, /Investigate/);
  if (await mobileMap.isVisible()) return mobileMap;
  await expect(desktopGroups).toBeVisible();
  return desktopGroups;
}

export async function selectToolGroup(page, groupName, toolName) {
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
    const targetTool = toolName ?? mobileGroup?.defaultTool;
    const toolButton = targetTool
      ? tray.getByRole('button', { name: `Open ${targetTool}`, exact: true })
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

  if (toolName) {
    const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
    const selector = panel.getByRole('combobox', { name: 'Choose investigation tool' });
    await expect(selector).toBeVisible();
    if (await selector.inputValue() !== toolName) await selector.selectOption(toolName);
    await expect(panel).toHaveAttribute('data-tool-name', toolName);
  }
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
