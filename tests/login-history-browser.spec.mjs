import { test, expect } from '@playwright/test';

test('Login History keeps its evidence flow and uses the dedicated mobile authentication console', async ({ page }, testInfo) => {
  await page.goto('/');

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();

  const customer360 = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await customer360.getByRole('navigation', { name: 'Customer 360 related tools' })
    .getByRole('button', { name: 'Login History', exact: true })
    .click();

  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Login History');
  await expect(toolPanel.locator('.login-history-summary article')).toHaveCount(6);
  await expect(toolPanel.locator('[data-login-history-record]').first()).toBeVisible();

  const firstLoginId = await toolPanel.locator('[data-login-history-record]').first().getAttribute('data-login-history-record');
  const search = toolPanel.getByRole('textbox', { name: 'Search Login History records' });
  await search.fill(firstLoginId);
  await expect(toolPanel.locator('[data-login-history-record]')).toHaveCount(1);
  await expect(toolPanel.locator('.login-detail-panel')).toContainText(firstLoginId);
  await search.clear();

  await toolPanel.getByRole('combobox', { name: 'Filter Login History by result' }).selectOption({ index: 1 });
  await expect(toolPanel.locator('[data-login-history-record]').first()).toBeVisible();
  await toolPanel.getByRole('button', { name: 'Clear filters', exact: true }).click();

  if (testInfo.project.name === 'mobile-chromium') {
    const loginMission = page.locator('[data-login-history-page="true"]');
    await expect(loginMission).toBeVisible();
    await expect(loginMission.getByRole('heading', { name: 'Login History', exact: true })).toBeVisible();
    await expect(loginMission.getByRole('list', { name: 'Login history evidence workflow' })).toContainText('Locate');
    await expect(loginMission.getByRole('list', { name: 'Login history evidence workflow' })).toContainText('Document');
    await expect(toolPanel.locator(':scope > .investigation-tool-header')).toBeHidden();
    await expect(toolPanel.locator(':scope > .investigation-tool-question')).toBeHidden();
    await expect(toolPanel.locator(':scope > .investigation-tool-controls')).toBeHidden();

    const layout = await page.evaluate(() => {
      const list = document.querySelector('.mission-login-history-page .login-record-list');
      const summary = document.querySelector('.mission-login-history-page .login-history-summary');
      const detail = document.querySelector('.mission-login-history-page .login-detail-panel');
      const workflow = document.querySelector('.mission-login-history-heading ol');
      const viewport = window.innerWidth;
      const fits = (element) => {
        const box = element?.getBoundingClientRect();
        return Boolean(box && box.left >= -1 && box.right <= viewport + 1);
      };
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewport,
        listFits: fits(list),
        detailFits: fits(detail),
        workflowColumns: workflow ? getComputedStyle(workflow).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
        summaryScrollable: summary ? summary.scrollWidth > summary.clientWidth : false,
        listScrollMode: list ? getComputedStyle(list).overflowY : '',
        listHeight: list?.getBoundingClientRect().height ?? 0,
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport + 1);
    expect(layout.listFits).toBe(true);
    expect(layout.detailFits).toBe(true);
    expect(layout.workflowColumns).toBe(4);
    expect(layout.summaryScrollable).toBe(true);
    expect(layout.listScrollMode).toBe('auto');
    expect(layout.listHeight).toBeLessThanOrEqual(295);
  } else {
    await expect(toolPanel.getByRole('heading', { name: 'Who logged in, when, and from where?', exact: true })).toBeVisible();
  }

  await toolPanel.getByRole('button', { name: 'Pin login event', exact: true }).click();
  await toolPanel.getByRole('button', { name: 'Save login note', exact: true }).click();
  await toolPanel.getByRole('button', { name: 'Mark Login History reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: '✓ Login History reviewed', exact: true })).toBeVisible();
});
