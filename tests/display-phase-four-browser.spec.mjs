import { test, expect } from '@playwright/test';
import { runPaymentVerification, selectToolGroup } from './workspace-page-helpers.mjs';

test('responsive payment records stay inside the viewport', async ({ page }, testInfo) => {
  await page.goto('/');

  await selectToolGroup(page, /Business & Payment Verification/, 'Payment Verification');

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const selector = panel.getByRole('combobox', { name: 'Choose investigation tool' });
  if (await selector.inputValue() !== 'Payment Verification') await selector.selectOption('Payment Verification');
  await expect(panel).toHaveAttribute('data-tool-name', 'Payment Verification');
  await runPaymentVerification(panel, { bankCode: 'BC-441', destinationId: 'DST-CARD-4410', ownerName: 'Maya Sterling' });

  const detail = panel.getByRole('status', { name: 'Payment verification result' });
  await expect(detail).toBeVisible();

  const layout = await page.evaluate(() => {
    const panelElement = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const detailElement = document.querySelector('.payment-mission-result');
    const viewportWidth = window.innerWidth;
    const withinViewport = (element) => {
      const rect = element?.getBoundingClientRect();
      return Boolean(rect && rect.left >= -1 && rect.right <= viewportWidth + 1);
    };

    return {
      panelFits: withinViewport(panelElement),
      detailFits: withinViewport(detailElement),
      panelOverflow: panelElement.scrollWidth - panelElement.clientWidth,
      detailTop: detailElement?.getBoundingClientRect().top ?? 0,
    };
  });

  expect(layout.panelFits).toBe(true);
  expect(layout.detailFits).toBe(true);
  expect(layout.panelOverflow).toBeLessThanOrEqual(1);

  expect(layout.detailTop).toBeGreaterThan(0);

  const activeCaseId = await page.locator('.visual-case-switcher select').inputValue();
  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', activeCaseId);
  await expect(lunaPanel.getByText('Evidence First lock is active', { exact: true })).toBeAttached();
});
