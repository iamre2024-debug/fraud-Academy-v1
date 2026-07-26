import { test, expect } from '@playwright/test';
import {
  expectReadableMobileCards,
  selectToolGroup,
} from './workspace-page-helpers.mjs';

const documentRequestStorageKey = 'fraud-academy-document-requests-v2';

function investigationPanel(page) {
  return page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
}

async function openDocumentRequest(page) {
  await page.locator('.visual-case-switcher select').selectOption('FA-CB-24007');
  await selectToolGroup(page, /Documents & Requests/);
  const panel = investigationPanel(page);
  await panel.getByRole('combobox', { name: 'Choose investigation tool' }).selectOption('Document Request');
  await expect(panel).toHaveAttribute('data-tool-name', 'Document Request');
  const workspace = panel.locator('[data-document-request-screen="reference-dashboard-v2"]');
  await expect(workspace).toBeVisible();
  return { panel, workspace };
}

function readDocumentAttempt(page, documentId) {
  return page.evaluate(({ key, caseId, id }) => {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    const entry = saved?.[caseId]?.[id];
    const attempts = Array.isArray(entry) ? entry : entry?.attempts ?? [];
    return attempts.at(-1) ?? null;
  }, { key: documentRequestStorageKey, caseId: 'FA-CB-24007', id: documentId });
}

test('Document Request records outbound requests, reminders, and receipts without creating customer evidence', async ({ page }) => {
  test.setTimeout(75_000);
  await page.goto('/');

  const { panel, workspace } = await openDocumentRequest(page);
  await expect(workspace.getByRole('heading', { name: 'Document Request', exact: true })).toBeVisible();
  await expect(workspace.getByRole('region', { name: 'Document request summary' })).toContainText('Requested');
  await expect(workspace.getByRole('columnheader', { name: 'Document Type' })).toBeVisible();
  await expect(workspace.getByRole('columnheader', { name: 'Last Reminder' })).toBeVisible();

  let cancellationRow = workspace.locator('[data-document-request-row="DOC-511"]');
  await expect(cancellationRow).toContainText('Cancellation confirmation');
  await expect(cancellationRow).toContainText('Not Requested');
  await expect(cancellationRow.getByRole('button', { name: /View Documents/ })).toHaveCount(0);

  await workspace.getByRole('button', { name: '＋ Request Document', exact: true }).click();
  const requestDialog = workspace.getByRole('dialog', { name: 'Request Document' });
  await expect(requestDialog).toBeVisible();
  await expect(requestDialog).toContainText('does not create a customer response or document');
  await requestDialog.getByLabel('Document').selectOption('DOC-511');
  await requestDialog.getByLabel('Delivery method').selectOption('Email');
  await requestDialog.getByLabel('Message / reason').fill(
    'Please provide the complete cancellation confirmation, including the cancellation date and method.',
  );
  await requestDialog.getByRole('button', { name: 'Send Request', exact: true }).click();

  await expect(workspace.getByRole('status')).toContainText('Cancellation confirmation requested through Email');
  cancellationRow = workspace.locator('[data-document-request-row="DOC-511"]');
  await expect(cancellationRow).toContainText('Awaiting');
  await expect(cancellationRow.getByRole('button', { name: /Send Reminder/ })).toBeVisible();
  await expect(cancellationRow.getByRole('button', { name: /Record Received/ })).toBeVisible();

  let attempt = await readDocumentAttempt(page, 'DOC-511');
  expect(attempt).toMatchObject({
    sourceDocumentId: 'DOC-511',
    documentTitle: 'Cancellation confirmation',
    requestDeliveryChannel: 'Email',
    responseStatus: '',
    fileCount: 0,
    customerSubmission: null,
  });

  await cancellationRow.getByRole('button', { name: /Send Reminder/ }).click();
  await expect(workspace.getByRole('status')).toContainText('Cancellation confirmation reminder sent through Email');
  attempt = await readDocumentAttempt(page, 'DOC-511');
  expect(attempt.reminders).toHaveLength(1);
  expect(attempt.customerSubmission).toBeNull();

  await cancellationRow.getByRole('button', { name: /Record Received/ }).click();
  const receiptDialog = workspace.getByRole('dialog', { name: 'Record Received Document' });
  await expect(receiptDialog).toBeVisible();
  await expect(receiptDialog).toContainText('never generates a document image or customer submission');
  await receiptDialog.getByLabel('Receipt status').selectOption('Received');
  await receiptDialog.getByLabel('Files received').fill('2');
  await receiptDialog.getByLabel('Receipt note').fill(
    'Two files were received outside the simulator; source pages still require separate evidence intake.',
  );
  await receiptDialog.getByRole('button', { name: 'Record Receipt', exact: true }).click();

  await expect(workspace.getByRole('status')).toContainText('No training document was generated automatically');
  await expect(cancellationRow).toContainText('Received');
  await expect(cancellationRow).toContainText('Metadata only');
  await expect(cancellationRow.getByText('2', { exact: true })).toBeVisible();
  await expect(cancellationRow.getByRole('button', { name: /View Documents/ })).toHaveCount(0);

  attempt = await readDocumentAttempt(page, 'DOC-511');
  expect(attempt.responseStatus).toBe('Received');
  expect(attempt.fileCount).toBe(2);
  expect(attempt.customerSubmission).toBeNull();
  expect(attempt.manualReceipt).toMatchObject({
    status: 'Received',
    fileCount: 2,
  });

  await page.reload();
  const reopened = await openDocumentRequest(page);
  cancellationRow = reopened.workspace.locator('[data-document-request-row="DOC-511"]');
  await expect(cancellationRow).toContainText('Received');
  await expect(cancellationRow).toContainText('Metadata only');
  await expect(cancellationRow.getByRole('button', { name: /View Documents/ })).toHaveCount(0);

  await reopened.workspace.getByRole('textbox', { name: 'Search Document Request records' }).fill('Cancellation confirmation');
  await expect(reopened.workspace.locator('[data-document-request-row]')).toHaveCount(1);
  await reopened.workspace.getByRole('button', { name: 'Mark Document Request reviewed', exact: true }).click();
  await expect(reopened.workspace.getByRole('button', { name: '✓ Document Request reviewed', exact: true })).toBeVisible();
  await reopened.workspace.getByRole('navigation', { name: 'Document request next routes' })
    .getByRole('button', { name: 'Open Submit Decision', exact: true })
    .click();
  await expect(panel.locator('.submit-decision-panel')).toBeVisible();
});

test('Link Analysis keeps match summaries neutral and opens filterable account and case details', async ({ page }, testInfo) => {
  test.setTimeout(75_000);
  if (testInfo.project.name === 'desktop-chromium') {
    await page.addInitScript(() => {
      localStorage.setItem('fraud-academy-layout-mode-v1', 'desktop');
      localStorage.setItem('fraud-academy-desktop-theme-v1', 'day');
    });
  }
  await page.goto('/');

  await selectToolGroup(page, /Connections/);
  const panel = investigationPanel(page);
  await panel.getByRole('combobox', { name: 'Choose investigation tool' }).selectOption('Link Analysis');
  await expect(panel).toHaveAttribute('data-tool-name', 'Link Analysis');
  const workspace = panel.locator('[data-link-analysis-screen="reference-v1"]');
  await expect(workspace).toBeVisible();

  const summary = workspace.getByRole('region', { name: /Link summary for/i });
  await expect(summary).toContainText('20 matched accounts');
  await expect(summary.getByRole('heading', { name: 'Luna Link Summary', exact: true })).toBeVisible();
  await expect(summary).toContainText('A match count alone does not establish misuse');
  await expect(summary).toContainText('Common shared-use context');
  await expect(summary).toContainText('Review-required context');
  expect(await summary.innerText()).not.toMatch(/\b(?:this is fraud|fraud confirmed|fraudulent account)\b/i);

  if (testInfo.project.name === 'mobile-chromium') {
    await expectReadableMobileCards(workspace.locator('.link-account-mobile-card:visible'), {
      minimumCardWidth: 240,
    });
  }

  const filters = workspace.locator('.link-filter-list');
  await filters.getByLabel('On Hold', { exact: true }).check();
  const visibleResults = testInfo.project.name === 'mobile-chromium'
    ? workspace.locator('.link-account-mobile-card:visible')
    : workspace.locator('.link-account-table tbody tr:visible');
  await expect(visibleResults).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    await expect(visibleResults.nth(index)).toContainText('On Hold');
  }

  await filters.getByLabel('All Linked Accounts', { exact: true }).check();
  const firstResult = testInfo.project.name === 'mobile-chromium'
    ? workspace.locator('.link-account-mobile-card:visible').first()
    : workspace.locator('.link-account-table tbody tr:visible').first();
  if (testInfo.project.name === 'mobile-chromium') {
    await firstResult.getByRole('button', { name: 'Open account', exact: true }).click();
  } else {
    await firstResult.getByRole('button', { name: /Open account ACCT-/ }).click();
  }

  const accountDetail = workspace.getByRole('complementary', { name: 'Linked account details' });
  await expect(accountDetail).toBeVisible();
  await expect(accountDetail).toContainText('Status information');
  await expect(accountDetail).toContainText('Identifier relationship');
  await expect(accountDetail).toContainText('Recorded history');
  await accountDetail.getByRole('button', { name: 'Open Linked Case', exact: true }).click();

  const caseDetail = workspace.getByRole('complementary', { name: 'Linked case details' });
  await expect(caseDetail).toBeVisible();
  await expect(caseDetail).not.toContainText(/case record summary/i);
  await expect(caseDetail).toContainText('Verify the underlying dates and records');
  await expect(caseDetail.getByRole('button', { name: 'Open Account', exact: true })).toBeVisible();
  await expect(caseDetail.getByRole('button', { name: 'Open Linked Case', exact: true })).toBeVisible();
  await expect(caseDetail.getByRole('button', { name: 'Pin Linked Record', exact: true })).toBeVisible();
  if (testInfo.project.name === 'mobile-chromium') {
    await expectReadableMobileCards(caseDetail, {
      minimumCardWidth: 240,
      textSelector: 'h3, h4, strong, p, dt, dd, small, button',
    });
  }
  await caseDetail.getByRole('button', { name: 'Add to Case Notes', exact: true }).click();
  await expect.poll(async () => {
    const notes = await page.evaluate(() => (
      JSON.parse(localStorage.getItem('fraud-academy-notes-v1') || '{}')
    ));
    return (notes[Object.keys(notes)[0]] ?? []).some((note) => String(note).includes('Link Analysis'));
  }).toBe(true);

  await workspace.getByLabel('Choose Link Analysis identifier type').selectOption('email');
  const recordedEmail = await workspace.getByLabel('Search Link Analysis exact identifier').inputValue();
  expect(recordedEmail).toContain('@');
  await workspace.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(workspace.getByRole('region', { name: /Link summary for/i })).toContainText('matched accounts');

  if (testInfo.project.name === 'desktop-chromium') {
    await page.locator('button[aria-label="Night theme"]:visible').click();
    await expect(page.locator('body')).toHaveAttribute('data-desktop-theme', 'night');
    await expect(workspace).toBeVisible();
    await page.locator('button[aria-label="Day theme"]:visible').click();
    await expect(page.locator('body')).toHaveAttribute('data-desktop-theme', 'day');
  }
});
