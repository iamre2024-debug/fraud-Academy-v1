import { test, expect } from '@playwright/test';

test('Document Request tracks case-scoped document workflow states', async ({ page }, testInfo) => {
  await page.goto('/');

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();

  const customer360 = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await customer360.getByRole('navigation', { name: 'Customer 360 related tools' })
    .getByRole('button', { name: 'Document Request', exact: true })
    .click();

  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Document Request');
  await expect(toolPanel.getByRole('heading', { name: 'What documents were requested, received, missing, or pending review for this case?', exact: true })).toBeVisible();
  await expect(toolPanel.locator('.document-request-inbox')).toBeVisible();
  await expect(toolPanel.locator('.document-request-compose-button')).toHaveText('＋ Request Paperwork');

  await toolPanel.locator('.document-request-compose-button').click();
  const composer = toolPanel.getByRole('main', { name: 'Compose paperwork request' });
  await expect(composer.getByRole('heading', { name: 'Request Paperwork', exact: true })).toBeVisible();
  await composer.getByRole('combobox', { name: 'Paperwork to request' }).selectOption({ label: 'Cancellation confirmation' });
  await composer.getByRole('combobox', { name: 'Paperwork request delivery method' }).selectOption('Email');
  await composer.getByRole('textbox', { name: 'Paperwork request reason' }).fill('Please send the cancellation confirmation showing the date and method used before renewal.');
  await composer.getByRole('button', { name: 'Send Request', exact: true }).click();

  await expect(toolPanel.locator('.document-request-confirmation')).toContainText('Cancellation confirmation request sent');
  await expect(toolPanel.getByRole('main', { name: 'Expanded document request detail' })).toContainText('Email');
  await expect(toolPanel.getByRole('main', { name: 'Expanded document request detail' })).toContainText('Requested');

  const savedRequest = await page.evaluate(() => JSON.parse(localStorage.getItem('fraud-academy-document-requests-v1') || '{}'));
  expect(savedRequest['FA-CB-24007']).toBeTruthy();
  expect(Object.values(savedRequest['FA-CB-24007']).some((request) => request.status === 'Requested' && request.deliveryChannel === 'Email')).toBe(true);

  if (testInfo.project.name === 'mobile-chromium') {
    await toolPanel.getByRole('button', { name: '‹ Inbox', exact: true }).click();
  }

  const records = toolPanel.locator('[data-document-request]');
  await expect(records.first()).toBeVisible();
  const firstRequestId = await records.first().getAttribute('data-document-request');
  expect(firstRequestId).toBeTruthy();

  const search = toolPanel.getByRole('textbox', { name: 'Search Document Request records' });
  await search.fill(firstRequestId);
  await expect(records).toHaveCount(1);
  await search.fill('no-matching-paperwork-record');
  await expect(records).toHaveCount(0);
  await expect(toolPanel.getByRole('main', { name: 'Expanded document request detail' })).toContainText('No document requests are available for this case.');
  await search.clear();

  await records.first().click();
  const detail = toolPanel.getByRole('main', { name: 'Expanded document request detail' });
  await expect(detail).toContainText(firstRequestId);
  await expect(detail).toContainText('Required / optional');
  await expect(detail).toContainText('Authenticity flag');

  await detail.getByRole('button', { name: 'Pin request', exact: true }).click();
  await expect(page.locator('.tray-card')).toContainText('Pinned');
  await detail.getByRole('button', { name: 'Save follow-up note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('Document Request');

  await toolPanel.getByRole('button', { name: 'Mark Document Request reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: '✓ Document Request reviewed', exact: true })).toBeVisible();

  const nextRoutes = toolPanel.getByRole('navigation', { name: 'Document request next routes' });
  await expect(nextRoutes.getByRole('button', { name: 'Open Document Viewer', exact: true })).toHaveCount(0);
  await nextRoutes.getByRole('button', { name: 'Open Submit Decision', exact: true }).click();
  await expect(page.locator('.submit-decision-panel')).toBeVisible();
});
