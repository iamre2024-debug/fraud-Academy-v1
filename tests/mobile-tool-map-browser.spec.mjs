import { expect, test } from '@playwright/test';
import { openToolGroups } from './workspace-page-helpers.mjs';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  });
  await page.setViewportSize({ width: 390, height: 844 });
});

function cluster(toolMap, label) {
  return toolMap.locator('.mobile-tool-map-cluster').filter({ hasText: label });
}

async function expectNonIntersectingMapNodes(page, width) {
  await page.setViewportSize({ width, height: 1100 });

  const geometry = await page.locator('[data-mobile-tool-map="reference-v1"]').evaluate((toolMap) => {
    const canvas = toolMap.querySelector('.mobile-tool-map-canvas')?.getBoundingClientRect();
    const nodes = [...toolMap.querySelectorAll('.mobile-tool-map-cluster, .mobile-tool-map-overview')]
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          name: node.textContent.trim().replace(/\s+/g, ' '),
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      });
    const intersections = [];

    for (let firstIndex = 0; firstIndex < nodes.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < nodes.length; secondIndex += 1) {
        const first = nodes[firstIndex];
        const second = nodes[secondIndex];
        const horizontalOverlap = Math.min(first.right, second.right) - Math.max(first.left, second.left);
        const verticalOverlap = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
        if (horizontalOverlap > 0.5 && verticalOverlap > 0.5) {
          intersections.push({
            first: first.name,
            second: second.name,
            horizontalOverlap,
            verticalOverlap,
          });
        }
      }
    }

    return {
      canvas: canvas && {
        left: canvas.left,
        top: canvas.top,
        right: canvas.right,
        bottom: canvas.bottom,
      },
      documentWidth: document.documentElement.scrollWidth,
      nodes,
      intersections,
    };
  });

  expect(geometry.nodes).toHaveLength(6);
  expect(geometry.intersections).toEqual([]);
  expect(geometry.documentWidth).toBeLessThanOrEqual(width + 1);
  expect(geometry.nodes.every((node) => node.width >= 44 && node.height >= 44)).toBe(true);
  expect(geometry.nodes.every((node) => (
    node.left >= geometry.canvas.left - 0.5
    && node.top >= geometry.canvas.top - 0.5
    && node.right <= geometry.canvas.right + 0.5
    && node.bottom <= geometry.canvas.bottom + 0.5
  ))).toBe(true);
}

test('Tool Map nodes remain separate and contained at supported narrow widths', async ({ page }) => {
  await page.goto('/');

  const toolMap = await openToolGroups(page);
  await expect(toolMap).toBeVisible();
  await expect(toolMap.locator('.mobile-tool-map-cluster')).toHaveCount(5);
  await expect(toolMap.locator('.mobile-tool-map-overview')).toHaveCount(1);
  await expect(toolMap.locator('#mobile-tool-map-tray')).toHaveCount(0);

  for (const width of [320, 360, 390]) {
    await expectNonIntersectingMapNodes(page, width);
  }
});

test('Tool Map opens map-first and reveals real tool actions only after a cluster tap', async ({ page }) => {
  await page.goto('/');

  let toolMap = await openToolGroups(page);
  await expect(toolMap).toBeVisible();
  await expect(toolMap.locator('#mobile-tool-map-tray')).toHaveCount(0);
  await expect(toolMap.locator('.mobile-tool-map-cluster[aria-pressed="true"]')).toHaveCount(0);

  const evidenceCluster = cluster(toolMap, 'Evidence & Workflow');
  await evidenceCluster.click();
  await expect(evidenceCluster).toHaveAttribute('aria-pressed', 'true');

  let tray = toolMap.getByRole('region', { name: 'Evidence & Workflow tools' });
  await tray.getByRole('button', { name: 'Close selected tool group', exact: true }).click();
  await expect(toolMap.locator('#mobile-tool-map-tray')).toHaveCount(0);
  await expect(evidenceCluster).toHaveAttribute('aria-pressed', 'false');

  await evidenceCluster.click();
  tray = toolMap.getByRole('region', { name: 'Evidence & Workflow tools' });
  await tray.getByRole('button', { name: 'Open Document Viewer', exact: true }).click();
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]'))
    .toHaveAttribute('data-tool-name', 'Document Viewer');

  toolMap = await openToolGroups(page);
  await expect(toolMap).toBeVisible();
  await expect(toolMap.locator('#mobile-tool-map-tray')).toHaveCount(0);
  await expect(cluster(toolMap, 'Evidence & Workflow')).toHaveAttribute('aria-pressed', 'false');

  await cluster(toolMap, 'Evidence & Workflow').click();
  tray = toolMap.getByRole('region', { name: 'Evidence & Workflow tools' });
  await expect(tray.getByRole('button', { name: 'Open Document Viewer', exact: true })).toHaveClass(/active/);

  const financialCluster = cluster(toolMap, 'Transactions & Financial');
  await financialCluster.click();
  await expect(financialCluster).toHaveAttribute('aria-pressed', 'true');
  await expect(cluster(toolMap, 'Evidence & Workflow')).toHaveAttribute('aria-pressed', 'false');
  await expect(toolMap.getByRole('region', { name: 'Transactions & Financial tools' })).toBeVisible();

  await page.waitForTimeout(50);
  await expect(financialCluster).toHaveAttribute('aria-pressed', 'true');

  await toolMap.getByRole('region', { name: 'Transactions & Financial tools' })
    .getByRole('button', { name: 'Open Transaction History', exact: true })
    .click();
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]'))
    .toHaveAttribute('data-tool-name', 'Transaction History');

  toolMap = await openToolGroups(page);
  await expect(toolMap.locator('#mobile-tool-map-tray')).toHaveCount(0);
  await expect(cluster(toolMap, 'Transactions & Financial')).toHaveAttribute('aria-pressed', 'false');

  await cluster(toolMap, 'Transactions & Financial').click();
  await expect(
    toolMap.getByRole('region', { name: 'Transactions & Financial tools' })
      .getByRole('button', { name: /Transaction History/ }),
  ).toHaveClass(/active/);
});
