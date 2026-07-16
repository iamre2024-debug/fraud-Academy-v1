import { test, expect } from '@playwright/test';

test('workspace uses separate pages and pinned evidence reopens its source record', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-visual-tray-v1', JSON.stringify({
      'FA-ATO-24018': ['TRN-8842-19', 'LOG-1005'],
    }));
  });
  await page.goto('/');

  const frame = page.locator('.visual-os-frame');
  const briefing = page.locator('[data-workspace-page="briefing"]');
  const workflow = page.getByRole('navigation', { name: 'Active case workflow' });
  const toolMenu = page.locator('[data-workspace-page="tool-menu"]');
  const toolPage = page.locator('[data-workspace-page="tool"]');
  const indicators = page.locator('[data-workspace-page="indicators"]');

  await expect(frame).toHaveAttribute('data-workspace-screen', 'briefing');
  await expect(briefing).toBeVisible();
  await expect(workflow).toBeHidden();
  await expect(toolMenu).toBeHidden();
  await expect(toolPage).toBeHidden();
  await expect(indicators).toBeHidden();
  await expect(page.locator('.luna-visual-panel')).toBeHidden();

  if (testInfo.project.name === 'mobile-chromium') {
    const briefingPager = page.getByRole('navigation', { name: 'Case Briefing pages' });
    await expect(briefingPager).toContainText('Page 1 of 6');
    await briefingPager.getByRole('button', { name: 'Next' }).click();
    await expect(briefingPager).toContainText('Briefing summary');
    await expect(page.locator('[data-mobile-briefing-page="1"]')).toBeHidden();
    await expect(page.locator('[data-mobile-briefing-page="2"]').first()).toBeVisible();
  }

  await page.getByRole('button', { name: /Begin Investigation/ }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'tool');
  await expect(page.locator('[data-customer-360-screen="approved-theme-v1"]')).toBeVisible();
  await expect(briefing).toBeHidden();

  await page.getByRole('button', { name: 'Pages' }).click();
  await workflow.getByRole('button', { name: /Investigate/ }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'tool-menu');
  await expect(toolMenu).toBeVisible();
  await toolMenu.getByRole('button', { name: /Login, Session, Device & IP/ }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'tool');
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toHaveAttribute('data-tool-name', 'Login History');
  await expect(toolMenu).toBeHidden();

  await page.getByRole('button', { name: 'Pages' }).click();
  await expect(workflow).toBeVisible();
  await workflow.getByRole('button', { name: /Indicators/ }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'evidence');
  await expect(indicators).toBeVisible();
  await expect(page.locator('.tray-card')).toBeVisible();
  await expect(page.locator('.notebook-card')).toBeHidden();

  await page.getByRole('button', { name: 'Open pinned evidence LOG-1005' }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'tool');
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toHaveAttribute('data-tool-name', 'Login History');
  await expect(page.locator('[data-opened-pinned-evidence="true"]')).toContainText('LOG-1005');
  await expect(page.getByRole('textbox', { name: 'Search Login History records' })).toHaveValue('LOG-1005');
  await expect(page.locator('[data-login-history-record="LOG-1005"]')).toBeVisible();
  await expect(page.locator('.login-detail-panel').getByRole('heading', { name: /LOG-1005/ })).toBeVisible();
  await page.waitForTimeout(180);
  const pinnedEvidenceVisibility = await page.evaluate(() => {
    const context = document.querySelector('[data-opened-pinned-evidence="true"]')?.getBoundingClientRect();
    const heading = document.querySelector('[data-opened-pinned-evidence="true"] h2')?.getBoundingClientRect();
    if (!context || !heading) return false;
    const hit = document.elementFromPoint(Math.min(window.innerWidth - 1, heading.left + 8), Math.max(1, heading.top + 8));
    return Boolean(hit && document.querySelector('[data-opened-pinned-evidence="true"]')?.contains(hit));
  });
  expect(pinnedEvidenceVisibility).toBe(true);

  await page.getByRole('button', { name: 'Back to Pinned Evidence' }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'evidence');
  await page.getByRole('button', { name: 'Remove LOG-1005 from pinned evidence' }).click();
  await expect(page.getByRole('button', { name: 'Open pinned evidence LOG-1005' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open pinned evidence TRN-8842-19' })).toBeVisible();

  await page.getByRole('button', { name: 'Notes', exact: true }).click();
  await expect(frame).toHaveAttribute('data-workspace-screen', 'notes');
  await expect(page.locator('.notebook-card')).toBeVisible();
  await expect(page.locator('.tray-card')).toBeHidden();

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    frame: document.querySelector('.visual-os-frame')?.scrollWidth ?? 0,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
  expect(widths.frame).toBeLessThanOrEqual(widths.viewport + 1);
});
