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
  const genericQuestion = toolPanel.getByRole('heading', { name: 'What documents were requested, received, missing, or pending review for this case?', exact: true });
  if (testInfo.project.name === 'mobile-chromium') {
    const documentMission = page.locator('[data-document-request-page="true"]');
    await expect(documentMission).toBeVisible();
    await expect(documentMission.getByRole('heading', { name: 'Document Request', exact: true })).toBeVisible();
    await expect(toolPanel.locator(':scope > .investigation-tool-header')).toBeHidden();
    await expect(toolPanel.locator(':scope > .investigation-tool-question')).toBeHidden();
    await expect(toolPanel.locator(':scope > .investigation-tool-controls')).toBeHidden();
    const visibleHeadingGeometry = await documentMission.locator('h2, h3').evaluateAll((headings) => headings
      .filter((heading) => {
        const style = getComputedStyle(heading);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((heading) => ({
        text: heading.textContent.trim(),
        width: heading.getBoundingClientRect().width,
        height: heading.getBoundingClientRect().height,
      })));
    expect(visibleHeadingGeometry.filter(({ width, height }) => width > 0 && width < 80 && height > 70)).toEqual([]);
  } else {
    await expect(genericQuestion).toBeVisible();
  }
  await expect(toolPanel.locator('.document-request-inbox')).toBeVisible();
  await expect(toolPanel.locator('.document-request-compose-button')).toHaveText('＋ Request Paperwork');
  await expect(toolPanel.locator('[data-document-request]')).toHaveCount(1);
  await expect(toolPanel.locator('[data-document-request]').first()).toContainText('Customer dispute form');
  await expect(toolPanel.locator('[data-document-request]').filter({ hasText: 'Cancellation confirmation' })).toHaveCount(0);

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
  await expect(toolPanel.locator('[data-document-request]')).toHaveCount(2);
  await expect(toolPanel.locator('[data-document-request]').filter({ hasText: 'Cancellation confirmation request' })).toContainText('Requested');

  const savedRequest = await page.evaluate(() => JSON.parse(localStorage.getItem('fraud-academy-document-requests-v2') || '{}'));
  expect(savedRequest['FA-CB-24007']).toBeTruthy();
  expect(Object.values(savedRequest['FA-CB-24007']).some((request) => request.attempts?.some((attempt) => attempt.requestDeliveryChannel === 'Email'))).toBe(true);

  const requestDetail = toolPanel.getByRole('main', { name: 'Expanded document request detail' });
  await requestDetail.getByRole('button', { name: 'Check for Customer Response', exact: true }).click();
  await expect(toolPanel.locator('.document-request-confirmation')).toContainText('received from the customer and added to the Document Viewer');
  await expect(requestDetail).toContainText('Received');
  await expect(requestDetail).toContainText('New customer submission');
  await expect(requestDetail.getByRole('button', { name: 'Open Customer Document', exact: true })).toBeVisible();
  await expect(toolPanel.locator('[data-document-request]')).toHaveCount(3);
  await expect(toolPanel.locator('[data-document-request]').filter({ hasText: 'Cancellation confirmation request' })).toContainText('Requested');
  await expect(toolPanel.locator('[data-document-request]').filter({ hasText: 'Cancellation confirmation' }).filter({ hasText: 'Received' })).toHaveCount(1);

  const receivedRequest = await page.evaluate(() => JSON.parse(localStorage.getItem('fraud-academy-document-requests-v2') || '{}'));
  const cancellationSubmission = Object.values(receivedRequest['FA-CB-24007'])
    .flatMap((request) => request.attempts ?? [])
    .find((attempt) => attempt.responseStatus === 'Received');
  expect(cancellationSubmission?.customerSubmission?.pages?.length).toBe(1);
  expect(cancellationSubmission?.customerSubmission?.pages?.[0]?.title).toContain('StreamBox Premium Cancellation Confirmation');

  await requestDetail.getByRole('button', { name: 'Open Customer Document', exact: true }).click();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Document Viewer');
  const customerViewer = toolPanel.locator('[data-document-viewer-screen="approved-theme-v1"]');
  await expect(customerViewer.getByRole('button', { name: /Customer Evidence/ })).toHaveClass(/active/);
  await expect(customerViewer.locator('.document-page')).toContainText('StreamBox Premium Cancellation Confirmation');
  await expect(customerViewer.locator('.document-page')).toContainText('Automatic renewal turned off');
  await customerViewer.getByRole('navigation', { name: 'Document Viewer next routes' })
    .getByRole('button', { name: 'Open Document Request', exact: true })
    .click();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Document Request');

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

  await detail.getByRole('button', { name: 'View Merchant Paperwork', exact: true }).click();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Document Viewer');
  const viewer = toolPanel.locator('[data-document-viewer-screen="approved-theme-v1"]');
  await expect(viewer.getByRole('heading', { name: 'Customer documents are locked', exact: true })).toHaveCount(0);
  await expect(viewer.getByRole('button', { name: /Merchant Evidence/ })).toHaveClass(/active/);
  await expect(viewer.locator('.document-page')).toBeVisible();
  await viewer.getByRole('navigation', { name: 'Document Viewer next routes' })
    .getByRole('button', { name: 'Open Document Request', exact: true })
    .click();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Document Request');

  await toolPanel.getByRole('button', { name: 'Mark Document Request reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: '✓ Document Request reviewed', exact: true })).toBeVisible();

  const nextRoutes = toolPanel.getByRole('navigation', { name: 'Document request next routes' });
  await expect(nextRoutes.getByRole('button', { name: 'Open Document Viewer', exact: true })).toHaveCount(0);
  await nextRoutes.getByRole('button', { name: 'Open Submit Decision', exact: true }).click();
  await expect(page.locator('.submit-decision-panel')).toBeVisible();
});
