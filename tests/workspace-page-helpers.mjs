import { expect } from '@playwright/test';

const workflowStages = [
  { names: ['briefing', 'case briefing'], buttonName: /\b(?:case )?briefing\b/i, screen: 'briefing' },
  { names: ['investigate'], buttonName: /\binvestigate\b/i, screen: 'tool-menu' },
  { names: ['timeline'], buttonName: /\btimeline\b/i, screen: 'timeline' },
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
  const groups = page.locator('[data-investigation-tool-groups="approved-theme-v1"]');
  if (await groups.isVisible()) return groups;

  await openWorkflowStage(page, /Investigate/);
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

/**
 * Guards the mobile card regressions where a grid track shrank to only a few
 * pixels and rendered otherwise normal labels as vertical, one-letter stacks.
 * The check deliberately measures rendered geometry instead of depending on a
 * particular CSS declaration.
 */
export async function expectReadableMobileCards(cards, {
  minimumCardWidth = 220,
  textSelector = 'h2, h3, h4, strong, small, p, dt, dd, em, button',
} = {}) {
  await expect(cards.first()).toBeVisible();
  const measurements = await cards.evaluateAll((nodes, options) => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && box.width > 0
        && box.height > 0;
    };
    const normalizedText = (element) => String(element.textContent ?? '').replace(/\s+/g, ' ').trim();
    const viewportWidth = window.innerWidth;
    const renderedCards = nodes.filter(visible);
    const narrowText = [];
    const nonHorizontalText = [];
    const breakAllText = [];

    renderedCards.forEach((card, cardIndex) => {
      card.querySelectorAll(options.textSelector).forEach((element) => {
        if (!visible(element)) return;
        const text = normalizedText(element);
        if (text.length < 4) return;
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const fontSize = Number.parseFloat(style.fontSize) || 12;
        if (box.width < fontSize * 2.25 && box.height > fontSize * 2.2) {
          narrowText.push({ cardIndex, text, width: box.width, height: box.height, fontSize });
        }
        if (!String(style.writingMode).startsWith('horizontal')) {
          nonHorizontalText.push({ cardIndex, text, writingMode: style.writingMode });
        }
        if (style.wordBreak === 'break-all') {
          breakAllText.push({ cardIndex, text });
        }
      });
    });

    return {
      cardCount: renderedCards.length,
      cards: renderedCards.map((card) => {
        const box = card.getBoundingClientRect();
        return {
          width: box.width,
          left: box.left,
          right: box.right,
          insideViewport: box.left >= -1 && box.right <= viewportWidth + 1,
        };
      }),
      narrowText,
      nonHorizontalText,
      breakAllText,
    };
  }, { textSelector });

  expect(measurements.cardCount).toBeGreaterThan(0);
  expect(measurements.cards.every(({ width }) => width >= minimumCardWidth)).toBe(true);
  expect(measurements.cards.every(({ insideViewport }) => insideViewport)).toBe(true);
  expect(measurements.narrowText).toEqual([]);
  expect(measurements.nonHorizontalText).toEqual([]);
  expect(measurements.breakAllText).toEqual([]);
}
