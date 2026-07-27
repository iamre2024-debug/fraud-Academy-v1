import { test, expect } from '@playwright/test';
import { openWorkspacePages, selectToolGroup } from './workspace-page-helpers.mjs';

test('Link Analysis uses the dedicated graph, exact account matches, and evidence actions', async ({ page }, testInfo) => {
  await page.goto('/');
  await selectToolGroup(page, 'Links & Related Cases');

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const workspace = panel.locator('[data-link-analysis-workspace]');
  await expect(panel).toHaveAttribute('data-tool-name', 'Link Analysis');
  await expect(workspace).toBeVisible();
  await expect(workspace.locator('[data-link-analysis-map]')).toBeVisible();
  await expect(workspace.getByRole('heading', { name: 'Exact cross-account matches', exact: true })).toBeVisible();
  await expect(workspace.getByText('Verified Links Summary', { exact: true })).toBeVisible();
  await expect(workspace.getByText('Luna · factual link summary', { exact: true })).toBeVisible();

  const searchShell = workspace.locator('.link-analysis-search-shell');
  expect(await searchShell.evaluate((element) => element.open)).toBe(false);
  await searchShell.locator('summary').click();
  const search = workspace.getByRole('textbox', { name: 'Search Link Analysis identifier' });
  await expect(search).toHaveValue('(214) 555-0184');
  await expect(workspace.locator('[data-link-account]')).toHaveCount(3);
  await expect(searchShell.locator('summary small')).toHaveText('3 matched accounts');

  const firstAccount = workspace.locator('[data-link-account]').first();
  const firstAccountId = await firstAccount.getAttribute('data-link-account');
  await firstAccount.locator('.link-analysis-account-heading').click();
  await expect(firstAccount.locator('.link-analysis-account-detail')).toBeVisible();
  await expect(firstAccount).toContainText('Exact shared identifier');
  await expect(firstAccount).toContainText('Verified source');
  await firstAccount.getByRole('button', { name: 'Pin Link', exact: true }).click();
  await firstAccount.getByRole('button', { name: 'Open Account', exact: true }).click();
  await expect(workspace.getByRole('region', { name: /Open account/ })).toBeVisible();
  await expect(workspace.getByRole('region', { name: /Open account/ })).toContainText('Current-case boundary');

  const phoneNode = workspace.getByRole('button', { name: /Search Phone/ });
  await expect(phoneNode).toBeVisible();
  const destinationNode = workspace.getByRole('button', { name: /Search Destination ID/ });
  await expect(destinationNode).toBeVisible();
  await destinationNode.click();
  await expect(workspace.locator('[data-link-account]')).toHaveCount(2);

  await searchShell.locator('summary').click();
  await expect(search).toHaveValue('DST-CARD-4410');
  await search.fill('NO-EXACT-MATCH');
  await workspace.getByRole('button', { name: 'Search Links', exact: true }).click();
  await expect(workspace.locator('.link-analysis-account-list .link-analysis-empty strong')).toHaveText('0 matched accounts');

  await searchShell.locator('summary').click();
  await workspace.getByRole('combobox', { name: 'Choose Link Analysis identifier type' }).selectOption('email');
  await search.fill('mayatraining@example.test');
  await workspace.getByRole('button', { name: 'Search Links', exact: true }).click();
  await expect(workspace.locator('.link-analysis-account-list .link-analysis-empty strong')).toHaveText('0 matched accounts');

  await searchShell.locator('summary').click();
  await workspace.locator('.link-analysis-suggestions button').filter({ hasText: '(214) 555-0184' }).click();
  await expect(workspace.locator('[data-link-account]')).toHaveCount(3);
  await workspace.getByRole('button', { name: 'Pin Search', exact: true }).click();
  await workspace.getByRole('button', { name: 'Save Factual Summary', exact: true }).click();
  await workspace.getByRole('button', { name: 'Mark Reviewed', exact: true }).click();
  await expect(workspace.getByRole('button', { name: '✓ Link Analysis Reviewed', exact: true })).toBeVisible();

  const workflow = await openWorkspacePages(page);
  await workflow.getByRole('button', { name: /Indicators|Evidence/ }).click();
  const accountPin = `LNK-Phone Number: (214) 555-0184 · ${firstAccountId}`;
  await page.getByRole('button', { name: `Open pinned evidence ${accountPin}` }).click();
  await expect(panel).toHaveAttribute('data-tool-name', 'Link Analysis');
  await expect(page.locator('[data-opened-pinned-evidence="true"]')).not.toContainText('LNK-IDR-1002');
  await expect(search).toHaveValue('(214) 555-0184');
  await expect(workspace.locator('[data-link-account]')).toHaveCount(3);
  await expect(workspace.locator(`[data-link-account="${firstAccountId}"]`)).toHaveAttribute('data-expanded', 'true');
  await page.getByRole('button', { name: /Back to (?:Pinned Evidence|pins)/i }).click();
  await page.getByRole('button', { name: 'Open pinned evidence LNK-Phone Number: (214) 555-0184' }).click();
  await expect(search).toHaveValue('(214) 555-0184');
  await expect(workspace.locator('[data-link-account]')).toHaveCount(3);

  const forbidden = await workspace.textContent();
  expect(forbidden).not.toMatch(/\b(?:high risk|medium risk|low risk|fraud score|risk score|confirmed current fraud)\b/i);

  const layout = await page.evaluate(() => {
    const panelElement = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const map = document.querySelector('[data-link-analysis-map]');
    const accounts = document.querySelector('.link-analysis-account-list');
    const mapBox = map?.getBoundingClientRect();
    const orbitNodes = [...document.querySelectorAll('.link-analysis-orbit-node')];
    const viewportWidth = window.innerWidth;
    const fits = (element) => {
      const box = element?.getBoundingClientRect();
      return Boolean(box && box.left >= -1 && box.right <= viewportWidth + 1);
    };
    const pairedNodeSelectors = [
      ['.link-analysis-node-phone', '.link-analysis-node-email'],
      ['.link-analysis-node-device', '.link-analysis-node-bank'],
      ['.link-analysis-node-destination', '.link-analysis-node-accounts'],
    ];
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelFits: fits(panelElement),
      mapFits: fits(map),
      accountsFit: fits(accounts),
      nodesFit: Boolean(mapBox) && orbitNodes.every((node) => {
        const box = node.getBoundingClientRect();
        return box.left >= mapBox.left - 1 && box.right <= mapBox.right + 1;
      }),
      pairedNodesSeparate: pairedNodeSelectors.every(([leftSelector, rightSelector]) => {
        const left = document.querySelector(leftSelector)?.getBoundingClientRect();
        const right = document.querySelector(rightSelector)?.getBoundingClientRect();
        return Boolean(left && right && left.right <= right.left);
      }),
      columns: getComputedStyle(document.querySelector('.link-analysis-main-grid')).gridTemplateColumns.split(' ').filter(Boolean).length,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelFits).toBe(true);
  expect(layout.mapFits).toBe(true);
  expect(layout.accountsFit).toBe(true);
  expect(layout.nodesFit).toBe(true);
  expect(layout.pairedNodesSeparate).toBe(true);
  expect(layout.columns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 2);

  const undersizedControls = await page.evaluate(() => {
    const roots = [
      document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]'),
      document.querySelector('.mission-workspace-bar[data-link-analysis-header="true"]'),
    ].filter(Boolean);
    return roots.flatMap((root) => [...root.querySelectorAll('button, input, select, summary')])
      .filter((control) => {
        const box = control.getBoundingClientRect();
        const style = getComputedStyle(control);
        return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      })
      .filter((control) => control.getBoundingClientRect().height < 44)
      .map((control) => ({
        tag: control.tagName,
        label: control.getAttribute('aria-label') || control.textContent?.trim().slice(0, 60),
        height: control.getBoundingClientRect().height,
      }));
  });
  expect(undersizedControls).toEqual([]);

  if (testInfo.project.name === 'mobile-chromium') {
    await expect(page.locator('.mission-workspace-bar[data-link-analysis-header="true"]')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Choose active Link Analysis case' })).toBeVisible();
    await expect(page.locator('.mission-workspace-case-selector')).toHaveCount(0);
    const touchTargets = await page.evaluate(() => {
      const header = document.querySelector('.mission-workspace-bar[data-link-analysis-header="true"]');
      const caseSelect = header?.querySelector('select')?.getBoundingClientRect();
      const buttons = [...(header?.querySelectorAll(':scope > button') ?? [])].map((button) => {
        const box = button.getBoundingClientRect();
        return { width: box.width, height: box.height };
      });
      return {
        caseSelect: caseSelect ? { width: caseSelect.width, height: caseSelect.height } : null,
        buttons,
      };
    });
    expect(touchTargets.caseSelect?.height).toBeGreaterThanOrEqual(44);
    expect(touchTargets.buttons).toHaveLength(2);
    touchTargets.buttons.forEach(({ width, height }) => {
      expect(width).toBeGreaterThanOrEqual(44);
      expect(height).toBeGreaterThanOrEqual(44);
    });
  } else {
    await expect(workspace.getByRole('heading', { name: 'Link Analysis', exact: true })).toBeVisible();
  }
});
