import { test, expect } from '@playwright/test';
import { selectToolGroup } from './workspace-page-helpers.mjs';

test('responsive payment records stay inside the viewport', async ({ page }, testInfo) => {
  await page.goto('/');

  await selectToolGroup(page, /Business & Payment Verification/);

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const selector = panel.getByRole('combobox', { name: 'Choose investigation tool' });
  await selector.selectOption('Payment Verification');
  await expect(panel).toHaveAttribute('data-tool-name', 'Payment Verification');

  const recordList = panel.locator('.payment-record-list');
  const detail = panel.locator('.payment-detail-panel');
  await expect(recordList.getByRole('button').first()).toBeVisible();
  await expect(detail).toBeVisible();

  const layout = await page.evaluate(() => {
    const panelElement = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const recordListElement = document.querySelector('.payment-record-list');
    const detailElement = document.querySelector('.payment-detail-panel');
    const viewportWidth = window.innerWidth;
    const withinViewport = (element) => {
      const rect = element?.getBoundingClientRect();
      return Boolean(rect && rect.left >= -1 && rect.right <= viewportWidth + 1);
    };

    return {
      panelFits: withinViewport(panelElement),
      listFits: withinViewport(recordListElement),
      detailFits: withinViewport(detailElement),
      panelOverflow: panelElement.scrollWidth - panelElement.clientWidth,
      listTop: recordListElement?.getBoundingClientRect().top ?? 0,
      detailTop: detailElement?.getBoundingClientRect().top ?? 0,
    };
  });

  expect(layout.panelFits).toBe(true);
  expect(layout.listFits).toBe(true);
  expect(layout.detailFits).toBe(true);
  expect(layout.panelOverflow).toBeLessThanOrEqual(1);

  if (testInfo.project.name === 'mobile-chromium') {
    expect(layout.detailTop).toBeGreaterThan(layout.listTop + 20);
  } else {
    expect(Math.abs(layout.listTop - layout.detailTop)).toBeLessThanOrEqual(2);
  }

  const activeCaseId = await page.locator('.visual-case-switcher select').inputValue();
  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', activeCaseId);
  await expect(page.getByText('Evidence First lock is active.')).toBeAttached();
});
