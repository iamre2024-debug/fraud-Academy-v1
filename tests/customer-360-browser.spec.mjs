import { test, expect } from '@playwright/test';

const secondCase = { id: 'FA-CB-24007', person: 'Jordan Ellis' };
const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate|suggested first tool|investigator question)\b/i;

test('approved Customer 360 presents real customer data in focused responsive pages', async ({ page }, testInfo) => {
  await page.goto('/');

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing).toBeVisible();
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();

  const customer360 = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer360).toBeVisible();
  await expect(customer360.getByRole('heading', { name: 'Customer 360', exact: true })).toBeVisible();
  await expect(customer360).toContainText('Maya Sterling');
  await expect(customer360).toContainText('TRN-8842-19');
  await expect(customer360).toContainText('DOB 1988-02-19');
  await expect(customer360).toContainText('Checking · Debit card · Savings');
  await expect(customer360.getByText('Current Case Snapshot', { exact: true })).toHaveCount(0);

  const relatedTools = customer360.getByRole('navigation', { name: 'Customer 360 related tools' });
  await expect(relatedTools.getByRole('button')).toHaveCount(4);
  const recordAreas = customer360.getByRole('region', { name: 'Customer 360 record areas' });
  await expect(recordAreas.getByRole('button')).toHaveCount(9);

  const overviewLayout = await page.evaluate(() => {
    const panel = document.querySelector('[data-customer-360-screen="approved-theme-v1"]');
    const menu = document.querySelector('.customer-360-page-menu');
    const viewportWidth = window.innerWidth;
    const box = panel?.getBoundingClientRect();
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelFits: Boolean(box && box.left >= -1 && box.right <= viewportWidth + 1),
      menuColumns: menu ? getComputedStyle(menu).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });
  expect(overviewLayout.documentWidth).toBeLessThanOrEqual(overviewLayout.viewportWidth + 1);
  expect(overviewLayout.panelFits).toBe(true);
  expect(overviewLayout.menuColumns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 2);

  await recordAreas.getByRole('button', { name: /Identity Snapshot/ }).click();
  let attachedPage = page.locator('[data-customer-360-page="identity"]');
  await expect(attachedPage).toBeVisible();
  await expect(attachedPage.getByRole('heading', { name: 'Identity Snapshot', exact: true })).toBeVisible();
  await expect(attachedPage).toContainText('Training ID');
  await expect(attachedPage).toContainText('1988-02-19 · 38');
  await expect(attachedPage).toContainText('Consumer checking + card');
  await attachedPage.getByRole('button', { name: 'Back to Customer 360', exact: true }).click();

  await customer360.getByRole('button', { name: /Contact Information/ }).click();
  attachedPage = page.locator('[data-customer-360-page="contact"]');
  await expect(attachedPage).toContainText('(214) 555-0184');
  await expect(attachedPage).toContainText('(972) 555-0119');
  await expect(attachedPage).toContainText('maya.training@example.test');
  await expect(attachedPage).toContainText('Irving, TX prior training address');
  await attachedPage.getByRole('button', { name: 'Back to Customer 360', exact: true }).click();

  await customer360.getByRole('button', { name: /Products & Accounts/ }).click();
  attachedPage = page.locator('[data-customer-360-page="products"]');
  await expect(attachedPage).toContainText('Checking · Debit card · Savings');
  await expect(attachedPage).toContainText('Card + one external destination');
  await attachedPage.getByRole('button', { name: 'Back to Customer 360', exact: true }).click();

  await customer360.getByRole('button', { name: /Profile Changes/ }).click();
  attachedPage = page.locator('[data-customer-360-page="profile-changes"]');
  await expect(attachedPage.locator('.customer-360-page-event')).toHaveCount(7);
  await expect(attachedPage).toContainText('Email viewed');
  await expect(attachedPage).toContainText('Debit card replaced');
  await attachedPage.getByRole('button', { name: 'Back to Customer 360', exact: true }).click();

  await customer360.getByRole('button', { name: /Related Customer Records/ }).click();
  attachedPage = page.locator('[data-customer-360-page="related-records"]');
  const search = attachedPage.getByRole('textbox', { name: 'Search related customer records' });
  await search.fill('Phone number unchanged');
  await expect(attachedPage.locator('.customer-360-page-record-list > article')).toHaveCount(1);
  await search.clear();
  await attachedPage.getByRole('button', { name: 'Back to Customer 360', exact: true }).click();

  await customer360.getByRole('button', { name: 'Mark Customer 360 reviewed', exact: true }).click();
  await expect(customer360.getByRole('button', { name: '✓ Customer 360 reviewed', exact: true })).toBeVisible();

  await relatedTools.getByRole('button', { name: 'Identity Intel', exact: true }).click();
  await expect(page.locator('[data-identity-intelligence-screen="lookup-report-v1"]')).toBeVisible();

  const allTools = page.getByRole('button', { name: /All tools/ });
  if (await allTools.isVisible().catch(() => false)) await allTools.click();
  const groupRail = page.locator('[data-investigation-tool-groups="approved-theme-v1"]');
  await groupRail.getByRole('button', { name: /Identity & Customer/ }).click();
  await expect(customer360).toBeVisible();

  if (await allTools.isVisible().catch(() => false)) await allTools.click();
  const selector = page.locator('.visual-case-switcher select');
  await selector.selectOption(secondCase.id);
  await expect(selector).toHaveValue(secondCase.id);
  await expect(briefing.getByText(secondCase.person, { exact: true }).first()).toBeVisible();
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();
  await expect(customer360).toContainText(secondCase.person);
  await expect(customer360).toContainText('1991-10-06');
  await expect(customer360).toContainText('Credit card');

  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', secondCase.id);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);
});
