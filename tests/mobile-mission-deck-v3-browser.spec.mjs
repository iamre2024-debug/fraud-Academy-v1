import { expect, test } from '@playwright/test';

async function capture(page, testInfo, name) {
  if (process.env.CAPTURE_MISSION_VISUALS !== '1') return;
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
}

async function captureElement(locator, testInfo, name) {
  if (process.env.CAPTURE_MISSION_VISUALS !== '1') return;
  await locator.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    animations: 'disabled',
  });
}

async function assertPhoneGeometry(page) {
  const geometry = await page.evaluate(() => {
    const dock = document.querySelector('.mission-mobile-dock')?.getBoundingClientRect();
    const root = document.querySelector('.mission-mobile-root')?.getBoundingClientRect();
    const buttons = [...document.querySelectorAll('.mission-mobile-dock button')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height, label: button.textContent.trim() };
    });
    return {
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      root: root ? { left: root.left, right: root.right, width: root.width } : null,
      dock: dock ? { left: dock.left, right: dock.right, bottom: dock.bottom } : null,
      viewportHeight: window.innerHeight,
      buttons,
    };
  });

  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.root.left).toBeGreaterThanOrEqual(0);
  expect(geometry.root.right).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.root.width).toBeGreaterThanOrEqual(geometry.viewport - 1);
  expect(geometry.dock.left).toBeGreaterThanOrEqual(0);
  expect(geometry.dock.right).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.dock.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
  expect(geometry.buttons).toHaveLength(6);
  expect(geometry.buttons.every((button) => button.width >= 44 && button.height >= 44)).toBe(true);
  expect(geometry.buttons.map((button) => button.label)).toEqual(['⌂Home', '▣Cases', '⊞Workspace', '◇Academy', '☾Agent', '❝Quotes']);
}

async function assertHomePanelGeometry(page, expectedColumns) {
  const geometry = await page.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      return {
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height,
      };
    };
    const overflow = (selector) => {
      const element = document.querySelector(selector);
      return element ? {
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
      } : null;
    };
    const grid = document.querySelector('.mobile-dashboard-panels');
    return {
      viewportWidth: window.innerWidth,
      columns: grid
        ? getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length
        : 0,
      grid: rect('.mobile-dashboard-panels'),
      agent: rect('.mobile-dashboard-agent'),
      agentCopy: rect('.mobile-dashboard-agent-copy'),
      agentPortrait: rect('.mobile-dashboard-agent-portrait'),
      luna: rect('.mobile-dashboard-agent-portrait .mobile-luna-portrait'),
      quote: rect('.mobile-dashboard-quote'),
      quoteHeading: rect('.mobile-dashboard-quote-heading'),
      quoteText: rect('.mobile-dashboard-quote > strong'),
      quoteCaption: rect('.mobile-dashboard-quote-caption'),
      quoteArrow: rect('.mobile-dashboard-quote-arrow'),
      agentOverflow: overflow('.mobile-dashboard-agent'),
      quoteOverflow: overflow('.mobile-dashboard-quote'),
    };
  });

  const inside = (outer, inner) => (
    inner.left >= outer.left - 1
    && inner.right <= outer.right + 1
    && inner.top >= outer.top - 1
    && inner.bottom <= outer.bottom + 1
  );
  const intersectionArea = (a, b) => (
    Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  );

  expect(geometry.columns).toBe(expectedColumns);
  for (const panel of [geometry.grid, geometry.agent, geometry.quote]) {
    expect(panel.left).toBeGreaterThanOrEqual(0);
    expect(panel.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  }
  for (const child of [geometry.agentCopy, geometry.agentPortrait, geometry.luna]) {
    expect(inside(geometry.agent, child)).toBe(true);
  }
  for (const child of [
    geometry.quoteHeading,
    geometry.quoteText,
    geometry.quoteCaption,
    geometry.quoteArrow,
  ]) {
    expect(inside(geometry.quote, child)).toBe(true);
  }
  expect(geometry.agentCopy.width).toBeGreaterThan(60);
  expect(geometry.luna.width).toBeGreaterThanOrEqual(80);
  expect(intersectionArea(geometry.agentCopy, geometry.agentPortrait)).toBe(0);
  expect(intersectionArea(geometry.agent, geometry.quote)).toBe(0);
  expect(geometry.agentOverflow.scrollWidth).toBeLessThanOrEqual(geometry.agentOverflow.clientWidth + 1);
  expect(geometry.agentOverflow.scrollHeight).toBeLessThanOrEqual(geometry.agentOverflow.clientHeight + 1);
  expect(geometry.quoteOverflow.scrollWidth).toBeLessThanOrEqual(geometry.quoteOverflow.clientWidth + 1);
  expect(geometry.quoteOverflow.scrollHeight).toBeLessThanOrEqual(geometry.quoteOverflow.clientHeight + 1);
}

test('mobile mounts the approved Fraud Academy shell and generated cases inherit the reference tool pages', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Dedicated phone renderer');
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
    window.localStorage.setItem('fraud-academy-completed-tools-v1', JSON.stringify({
      'FA-ATO-24018': ['Case Summary', 'Customer 360', 'Login History'],
      'FA-CB-24007': ['Case Summary'],
    }));
    window.localStorage.setItem('fraud-academy-notes-v1', JSON.stringify({
      'FA-ATO-24018': ['Saved evidence-first test note'],
    }));
    window.localStorage.setItem('fraud-academy-review-packages-v1', JSON.stringify({
      'FA-CB-24007': [{
        id: 'PKG-TEST-CB-1',
        caseId: 'FA-CB-24007',
        savedAt: 'Jul 27, 2026',
        completedTools: ['Case Summary'],
        reviewedRequired: 1,
        totalRequired: 6,
        pinnedEvidence: [],
        noteSnapshot: [],
      }],
    }));
  });
  await page.goto('/');

  const root = page.locator('.mission-mobile-root');
  const dock = page.getByRole('navigation', { name: 'Mission navigation' });
  await expect(root).toBeVisible();
  await expect(page.locator('.visual-os-frame')).toHaveCount(0);
  await expect(dock.getByRole('button')).toHaveCount(6);
  await dock.getByRole('button', { name: /Home/ }).click();
  const dashboard = page.locator('.mobile-reference-dashboard');
  await expect(dashboard).toBeVisible();

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 412, height: 600 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport);
    await assertPhoneGeometry(page);
    await assertHomePanelGeometry(page, viewport.width <= 340 ? 1 : 2);
    await page.locator('.mission-mobile-viewport').evaluate((element) => {
      element.scrollTop = 0;
    });
    await capture(page, testInfo, `home-dashboard-${viewport.width}`);
    await captureElement(
      dashboard.locator('.mobile-dashboard-panels'),
      testInfo,
      `home-agent-quotes-${viewport.width}`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });

  await expect(dashboard.getByRole('heading', { name: 'Good morning Ree, let’s stop fraud ✨' })).toBeVisible();
  const heroLuna = dashboard.locator('.mobile-dashboard-greeting')
    .getByRole('button', { name: 'Open Luna assistant', exact: true });
  const agentPanel = dashboard.locator('button.mobile-dashboard-agent');
  await expect(heroLuna).toContainText('Luna');
  await expect(agentPanel).toContainText('Luna');
  await expect(dashboard.locator('.mobile-dashboard-grid .mobile-dashboard-card')).toHaveCount(3);

  const activeCasesCard = dashboard.locator('.mobile-dashboard-active-case');
  const alertsCard = dashboard.locator('.mobile-dashboard-alerts');
  const workspaceCard = dashboard.locator('.mobile-dashboard-workspace');
  const academyPanel = dashboard.locator('.mobile-dashboard-academy-panel');
  await expect(activeCasesCard).toContainText('2 cases');
  await expect(activeCasesCard).toContainText('2 in review');
  await expect(alertsCard).toContainText('1 priority');
  await expect(alertsCard).toContainText('1 high-priority case');
  await expect(workspaceCard).toContainText('33%');
  await expect(workspaceCard).toContainText('3 / 9 tasks');
  await expect(academyPanel).toContainText('Academy Progress');
  await expect(academyPanel).toContainText('1 completed package');
  await expect(academyPanel.locator('dd').nth(0)).toHaveText('4');
  await expect(academyPanel.locator('dd').nth(1)).toHaveText('1');
  await expect(academyPanel.locator('dd').nth(2)).toHaveText('1');
  await expect(academyPanel.locator('button i > b')).toHaveAttribute('style', 'width: 19%;');
  await expect(dashboard.locator('.mobile-dashboard-panels')).toContainText('Agent Panel');
  await expect(dashboard.locator('.mobile-dashboard-agent-shortcuts')).toContainText('Case facts');
  await expect(dashboard.locator('.mobile-dashboard-quote')).toContainText('Fraud is clever,');
  await expect(dashboard.locator('.mobile-dashboard-quote')).toContainText('Every small step builds a fraud-free future.');
  await expect(page.getByRole('button', { name: 'Open priority cases', exact: true }).locator('i')).toHaveCount(1);
  await capture(page, testInfo, '01-approved-dashboard');

  async function returnHome() {
    await dock.getByRole('button', { name: /Home/ }).click();
    await expect(dashboard).toBeVisible();
  }

  await page.getByRole('button', { name: 'Open priority cases', exact: true }).click();
  await expect(page.locator('.cases-theme-v1-panel')).toBeVisible();
  await returnHome();

  await activeCasesCard.click();
  await expect(page.locator('.cases-theme-v1-panel')).toBeVisible();
  await returnHome();

  await alertsCard.click();
  await expect(page.locator('.cases-theme-v1-panel')).toBeVisible();
  await returnHome();

  await workspaceCard.click();
  await expect(page.locator('.mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'tool-menu');
  await expect(dock.getByRole('button', { name: /Workspace/ })).toHaveAttribute('aria-current', 'page');
  await returnHome();

  await academyPanel.getByRole('button', { name: 'Open Academy Progress', exact: true }).click();
  await expect(page.locator('[data-mission-page="progress"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mission Progress' })).toBeVisible();
  await expect(dock.getByRole('button', { name: /Academy/ })).toHaveAttribute('aria-current', 'page');
  await returnHome();

  await heroLuna.click();
  await expect(page.locator('.profile-theme-v1')).toBeVisible();
  await returnHome();

  await agentPanel.click();
  await expect(page.locator('.profile-theme-v1')).toBeVisible();
  await returnHome();

  await dashboard.locator('button.mobile-dashboard-quote').click();
  await expect(page.locator('.mobile-quotes-page')).toBeVisible();
  await expect(page.locator('.mobile-quotes-page')).toContainText('Evidence before assumptions');
  await returnHome();

  await dock.getByRole('button', { name: /Workspace/ }).click();
  await expect(page.locator('.mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'briefing');
  await expect(page.locator('.mission-briefing-v4')).toBeVisible();
  await expect(dock.getByRole('button', { name: /Cases/ })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: 'Open workspace ›', exact: true }).click();
  await expect(page.locator('[data-mobile-reference-tool="Customer 360"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /Open Quick Pad/ })).toBeVisible();

  await page.getByRole('button', { name: 'Open workspace menu' }).click();
  await page.getByRole('navigation', { name: 'Workspace shortcuts' })
    .getByRole('button', { name: /All tools/ })
    .click();
  const toolMap = page.locator('.mission-evidence-map');
  await expect(toolMap).toBeVisible();
  await expect(toolMap.locator('.mission-map-tool-node')).toHaveCount(6);
  await expect(toolMap).not.toContainText('KYB Review');
  await expect(toolMap).not.toContainText('System Access Lane');
  await capture(page, testInfo, '02-approved-tool-map');

  await page.getByRole('button', { name: 'Open workspace menu' }).click();
  await page.getByRole('navigation', { name: 'Workspace shortcuts' })
    .getByRole('button', { name: /Decide/ })
    .click();
  const decision = page.locator('.mission-decision-page');
  await expect(decision).toBeVisible();
  await expect(decision.getByRole('group', { name: 'Operational decision' })).toBeVisible();
  await expect(decision.getByRole('group', { name: 'Final investigative finding' })).toBeVisible();
  await expect(decision.getByRole('button', { name: 'Submit Decision' })).toBeDisabled();
  await capture(page, testInfo, '03-separated-decision');

  await dock.getByRole('button', { name: /Cases/ }).click();
  const queue = page.locator('.cases-theme-v1-panel');
  await expect(queue).toBeVisible();
  await queue.getByLabel('Generate case count').selectOption('1');
  await queue.getByRole('button', { name: 'Generate cases', exact: true }).click();

  await expect(page.locator('.mission-briefing-v4')).toBeVisible();
  await page.getByRole('button', { name: 'Open workspace menu' }).click();
  const generatedCaseId = await page.getByRole('combobox', { name: 'Choose active mission case' }).inputValue();
  expect(generatedCaseId).toMatch(/-G\d+$/);
  await page.getByRole('button', { name: 'Open workspace menu' }).click();
  await page.getByRole('button', { name: 'Open workspace ›', exact: true }).click();
  await expect(page.locator('[data-customer-360-screen="approved-theme-v2"]')).toHaveAttribute('data-case-id', generatedCaseId);
  await assertPhoneGeometry(page);
  await capture(page, testInfo, '04-generated-customer-360');
});
