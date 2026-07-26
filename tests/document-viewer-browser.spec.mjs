import { test, expect } from '@playwright/test';
import {
  expectReadableMobileCards,
  selectToolGroup,
} from './workspace-page-helpers.mjs';

const documentRequestStorageKey = 'fraud-academy-document-requests-v2';
const decisionStorageKey = 'fraud-academy-decision-drafts-v1';
const forbiddenViewerCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate)\b/i;

async function openUnlockedViewer(page) {
  await page.locator('.visual-case-switcher select').selectOption('FA-CB-24007');
  await selectToolGroup(page, /Documents & Requests/);
  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await panel.getByRole('combobox', { name: 'Choose investigation tool' }).selectOption('Document Viewer');
  await expect(panel).toHaveAttribute('data-tool-name', 'Document Viewer');

  const viewer = panel.locator('[data-document-viewer-screen="evidence-workspace-v2"]');
  await expect(viewer).toBeVisible();
  const accountSearch = viewer.getByRole('textbox', { name: 'Search by Account ID' });
  await viewer.getByRole('button', { name: 'Use active case Account ID', exact: true }).click();
  await expect(accountSearch).toHaveValue('ACCT-24007-8841');
  await expect(viewer.getByRole('heading', { name: 'Customer documents are locked', exact: true })).toBeVisible();
  await viewer.getByRole('button', { name: 'Search account', exact: true }).click();
  await expect(viewer.getByRole('heading', { name: 'Customer documents are locked', exact: true })).toHaveCount(0);
  await expect(viewer).toContainText('Jordan Ellis');
  await expect(viewer.locator('[data-document-record]').first()).toBeVisible();
  return { panel, viewer };
}

async function openDocument(viewer, title) {
  const search = viewer.getByRole('textbox', { name: 'Search Document Viewer records' });
  await search.fill(title);
  const record = viewer.locator('[data-document-record]').filter({ hasText: title });
  await expect(record).toHaveCount(1);
  await record.locator('.document-record-open').click();
  return { search, record };
}

async function returnToInbox(viewer, projectName) {
  if (projectName === 'mobile-chromium') {
    await viewer.getByRole('button', { name: '‹ Inbox', exact: true }).click();
  }
}

test('Document Viewer rotates, compares, exports, and saves evidence assessment separately from the case decision', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto('/');
  const { panel, viewer } = await openUnlockedViewer(page);

  await expect(viewer.getByRole('navigation', { name: 'Document folders' })).toBeVisible();
  await expect(viewer.locator('[data-document-record]')).toHaveCount(8);
  if (testInfo.project.name === 'mobile-chromium') {
    await expectReadableMobileCards(viewer.locator('.document-record-list article:visible'), {
      minimumCardWidth: 220,
      textSelector: '.document-record-open strong, .document-record-open small, .document-record-open span, .document-record-open em, .document-record-compare',
    });
  }
  const { search } = await openDocument(viewer, 'Billing history statement');

  const mobileReview = viewer.locator('.document-mobile-review-shell');
  if (testInfo.project.name === 'mobile-chromium') {
    await expect(mobileReview).toBeVisible();
    await expectReadableMobileCards(mobileReview, {
      minimumCardWidth: 220,
      textSelector: '.document-mobile-summary-header h3, .document-mobile-summary-header p, .document-mobile-summary-header span, .document-mobile-review-tabs button',
    });
    await mobileReview.getByRole('tab', { name: /Document/ }).click();
  }
  const documentSurface = testInfo.project.name === 'mobile-chromium'
    ? mobileReview
    : viewer.getByRole('main', { name: 'Document preview' });
  await expect(documentSurface.locator('.document-page')).toContainText('Account billing ledger');
  await expect(documentSurface.locator('.document-page')).toContainText('StreamBox Premium');
  await expect(documentSurface.locator('.document-page')).toContainText('Fictional training document');

  if (testInfo.project.name === 'desktop-chromium') {
    const pageControls = documentSurface.getByRole('region', { name: 'Document page controls' });
    await pageControls.getByRole('button', { name: 'Rotate document clockwise', exact: true }).click();
    await expect(documentSurface.locator('.document-page')).toHaveAttribute('style', /--document-rotation:\s*90deg/);
    await pageControls.getByRole('button', { name: 'Zoom in document', exact: true }).click();
    await expect(pageControls.getByText('110%', { exact: true })).toBeVisible();
  }

  const downloadPromise = page.waitForEvent('download');
  if (testInfo.project.name === 'mobile-chromium') {
    await mobileReview.getByRole('button', { name: 'Export', exact: true }).click();
  } else {
    await viewer.locator('.document-toolbar-actions').getByRole('button', { name: 'Training copy', exact: true }).click();
  }
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('BILL-HIST');

  if (testInfo.project.name === 'desktop-chromium') {
    const inspector = viewer.getByRole('complementary', { name: 'Document details' });
    await inspector.getByRole('button', { name: 'Mark as Verified', exact: true }).click();
    await expect(inspector.getByRole('button', { name: 'Mark as Verified', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await inspector.getByLabel('Completeness').selectOption('Incomplete');
    await inspector.getByLabel('Claim effect').selectOption('Does not support claim');
    await inspector.getByLabel('More evidence needed').selectOption('Yes');

    await expect.poll(async () => page.evaluate(({ requestKey, decisionKey }) => {
      const requestState = JSON.parse(localStorage.getItem(requestKey) || '{}');
      const decisionState = JSON.parse(localStorage.getItem(decisionKey) || '{}');
      return {
        action: requestState['FA-CB-24007']?.['BILL-HIST::viewer-review']?.viewerReview?.action,
        assessment: decisionState['FA-CB-24007']?.documentAssessment,
      };
    }, { requestKey: documentRequestStorageKey, decisionKey: decisionStorageKey })).toEqual({
      action: 'verified',
      assessment: expect.objectContaining({
        readability: 'Readable',
        completeness: 'Incomplete',
        claimEffect: 'Does not support claim',
        additionalEvidenceNeeded: 'Yes',
      }),
    });
  }

  await returnToInbox(viewer, testInfo.project.name);
  await search.clear();
  const customerRecord = viewer.locator('[data-document-record]').filter({ hasText: 'Customer dispute form' });
  const statementRecord = viewer.locator('[data-document-record]').filter({ hasText: 'Billing history statement' });
  await customerRecord.getByRole('button', { name: 'Compare', exact: true }).click();
  await statementRecord.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(viewer.locator('.document-compare-grid article')).toHaveCount(2);
  await expect(viewer.getByRole('region', { name: 'Document comparison' })).toContainText('Customer dispute form');
  await expect(viewer.getByRole('region', { name: 'Document comparison' })).toContainText('Billing history statement');

  const geometry = await page.evaluate(() => {
    const root = document.querySelector('[data-document-viewer-screen="evidence-workspace-v2"]');
    const box = root?.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      left: box?.left,
      right: box?.right,
    };
  });
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(await viewer.innerText()).not.toMatch(forbiddenViewerCopy);

  await viewer.getByRole('button', { name: 'Mark Document Viewer reviewed', exact: true }).click();
  await expect(viewer.getByRole('button', { name: 'Document Viewer reviewed', exact: true })).toBeVisible();
  await viewer.getByRole('navigation', { name: 'Document Viewer next routes' })
    .getByRole('button', { name: 'Open Document Request', exact: true })
    .click();
  await expect(panel).toHaveAttribute('data-tool-name', 'Document Request');
});

test('Document Viewer restores isolated note drafts from local recovery and the cloud-synced case slice', async ({ page }, testInfo) => {
  test.setTimeout(75_000);
  await page.goto('/');
  let { viewer } = await openUnlockedViewer(page);

  const firstRecord = viewer.locator('[data-document-record]').first();
  const firstDocumentId = await firstRecord.getAttribute('data-document-record');
  await firstRecord.locator('.document-record-open').click();
  let noteBox;
  if (testInfo.project.name === 'mobile-chromium') {
    const mobileReview = viewer.locator('.document-mobile-review-shell');
    await mobileReview.getByRole('tab', { name: /Notes/ }).click();
    noteBox = mobileReview.getByRole('textbox', { name: 'Mobile document investigator note' });
  } else {
    noteBox = viewer.getByRole('textbox', { name: 'Document investigator note' });
  }

  const draft = `Unsaved source review for ${firstDocumentId}`;
  await noteBox.fill(draft);
  const localDraftKey = `fraud-academy-document-draft:FA-CB-24007:${firstDocumentId}`;
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), localDraftKey)).toBe(draft);
  await expect.poll(() => page.evaluate(({ key, documentId }) => {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    return saved['FA-CB-24007']?.[`${documentId}::viewer-draft`]?.viewerDraft;
  }, { key: documentRequestStorageKey, documentId: firstDocumentId })).toBe(draft);

  await page.reload();
  ({ viewer } = await openUnlockedViewer(page));
  const restoredRecord = viewer.locator(`[data-document-record="${firstDocumentId}"]`);
  await restoredRecord.locator('.document-record-open').click();
  if (testInfo.project.name === 'mobile-chromium') {
    const mobileReview = viewer.locator('.document-mobile-review-shell');
    await mobileReview.getByRole('tab', { name: /Notes/ }).click();
    noteBox = mobileReview.getByRole('textbox', { name: 'Mobile document investigator note' });
  } else {
    noteBox = viewer.getByRole('textbox', { name: 'Document investigator note' });
  }
  await expect(noteBox).toHaveValue(draft);

  await returnToInbox(viewer, testInfo.project.name);
  const secondRecord = viewer.locator('[data-document-record]').nth(1);
  const secondDocumentId = await secondRecord.getAttribute('data-document-record');
  await secondRecord.locator('.document-record-open').click();
  if (testInfo.project.name === 'mobile-chromium') {
    const mobileReview = viewer.locator('.document-mobile-review-shell');
    await mobileReview.getByRole('tab', { name: /Notes/ }).click();
    noteBox = mobileReview.getByRole('textbox', { name: 'Mobile document investigator note' });
  } else {
    noteBox = viewer.getByRole('textbox', { name: 'Document investigator note' });
  }
  await expect(noteBox).toHaveValue('');
  expect(await page.evaluate((key) => localStorage.getItem(key), `fraud-academy-document-draft:FA-CB-24007:${secondDocumentId}`)).toBeNull();
});
