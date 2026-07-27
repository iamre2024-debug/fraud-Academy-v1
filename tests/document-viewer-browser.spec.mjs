import { test, expect } from '@playwright/test';
import {
  openMobileWorkspaceShortcut,
  selectToolGroup,
} from './workspace-page-helpers.mjs';

const requiredDocuments = [
  'Card-network submission record',
  'Customer dispute form',
  'Merchant response letter',
  'Subscription enrollment record',
  'Billing history statement',
  'Terms and cancellation policy',
  'Account activity log',
];

const forbiddenViewerCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate)\b/i;

test('Document Viewer requires an Account ID, then compares, annotates, and exports matching customer documents', async ({ page }, testInfo) => {
  await page.goto('/');

  const briefing = testInfo.project.name === 'mobile-chromium'
    ? page.locator('.mission-briefing-v4')
    : page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing.getByRole('button', { name: 'Open Document Viewer', exact: true })).toHaveCount(0);
  if (testInfo.project.name === 'mobile-chromium') {
    await expect(briefing.getByRole('heading', { name: 'Evidence Checklist', exact: true })).toBeVisible();
    await expect(briefing.getByRole('button', { name: 'Open workspace ›', exact: true })).toBeVisible();
    await expect(briefing.getByRole('navigation', { name: 'Case briefing actions' })).toHaveCount(0);
    await openMobileWorkspaceShortcut(page, 'All tools');
    await expect(page.locator('.mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'tool-menu');
    await expect(page.locator('[data-investigation-tool-groups="approved-theme-v1"]')).toBeVisible();
  } else {
    await briefing.getByRole('button', { name: /Begin Investigation/ }).click();
    await expect(page.locator('[data-customer-360-screen="approved-theme-v1"]')
      .getByRole('button', { name: 'Document Viewer', exact: true })).toHaveCount(0);
    await expect(page.locator('.tray-card').getByRole('button', { name: /Document Viewer/ })).toHaveCount(0);
  }

  await selectToolGroup(page, /Documents & Requests/);

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const viewer = panel.locator('[data-document-viewer-screen="approved-theme-v1"]');
  const search = viewer.getByRole('textbox', { name: 'Search Document Viewer records' });

  await expect(panel).toHaveAttribute('data-tool-name', 'Document Viewer');
  const headingSurface = testInfo.project.name === 'mobile-chromium'
    ? page.locator('.mission-workspace-bar')
    : panel;
  await expect(headingSurface.getByRole('heading', { name: 'Document Viewer', exact: true })).toBeVisible();
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole('heading', { name: 'Customer documents are locked', exact: true })).toBeVisible();
  await expect(viewer.locator('[data-document-record]')).toHaveCount(0);
  await expect(viewer.getByRole('navigation', { name: 'Document folders' })).toHaveCount(0);

  const accountSearch = viewer.getByRole('textbox', { name: 'Search by Account ID' });
  await viewer.getByRole('button', { name: 'Use active case Account ID', exact: true }).click();
  await expect(accountSearch).not.toHaveValue('');
  await expect(viewer.getByRole('heading', { name: 'Customer documents are locked', exact: true })).toBeVisible();
  await expect(viewer.locator('[data-document-record]')).toHaveCount(0);
  await expect(viewer.locator('.document-account-lookup-result')).toContainText('Select Search account to confirm the match');

  await accountSearch.fill('ACCT-NOT-FOUND');
  await viewer.getByRole('button', { name: 'Search account', exact: true }).click();
  await expect(viewer).toContainText('No case was found for that Account ID');
  await expect(viewer.locator('[data-document-record]')).toHaveCount(0);

  await accountSearch.fill('ACCT-24007-8841');
  await viewer.getByRole('button', { name: 'Search account', exact: true }).click();
  await expect(viewer).toContainText('Jordan Ellis');
  await expect(viewer).toContainText('FA-CB-24007');
  await expect(viewer.getByRole('button', { name: 'Request Paperwork', exact: true }).first()).toBeVisible();
  await expect(viewer.getByRole('navigation', { name: 'Document folders' }).locator('button:not(.document-folder-request)')).toHaveCount(4);
  await expect(viewer.locator('[data-document-record]')).toHaveCount(8);

  await search.fill('no-matching-document-record');
  await expect(viewer.locator('[data-document-record]')).toHaveCount(0);
  await expect(viewer.locator('.document-record-list .document-viewer-empty')).toContainText('No documents match the current folder, status, and search.');
  if (testInfo.project.name === 'mobile-chromium') {
    await expect(viewer.locator('.document-mobile-review-shell')).toHaveCount(0);
  } else {
    await expect(viewer.getByRole('main', { name: 'Document preview' })).toContainText('Choose a document to open its viewer.');
  }
  await search.clear();

  for (const title of requiredDocuments) {
    await search.fill(title);
    await expect(viewer.locator('[data-document-record]')).toHaveCount(1);
    await viewer.locator('[data-document-record] .document-record-open').click();
    if (testInfo.project.name === 'mobile-chromium') {
      const mobileReview = viewer.locator('.document-mobile-review-shell');
      await expect(mobileReview).toBeVisible();
      await expect(mobileReview.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(mobileReview.getByRole('tablist', { name: 'Document review pages' })).toBeVisible();
      await expect(mobileReview.getByRole('tab')).toHaveCount(4);
      await expect(mobileReview.getByRole('tab', { name: /Fields/ })).toHaveAttribute('aria-selected', 'true');
      await expect(mobileReview.locator('[data-review-panel="fields"]')).toContainText('Confidence');
      if (title === requiredDocuments[0]) {
        await mobileReview.getByRole('tab', { name: /Status/ }).click();
        await expect(mobileReview.locator('[data-review-panel="status"]')).toBeVisible();
        await expect(mobileReview.locator('[data-review-panel="status"]')).toContainText('Request status');
        const stepControls = mobileReview.getByRole('navigation', { name: 'Document review step controls' });
        await stepControls.getByRole('button', { name: '‹ Back', exact: true }).click();
        await expect(mobileReview.locator('[data-review-panel="document"]')).toBeVisible();
        await stepControls.getByRole('button', { name: 'Next ›', exact: true }).click();
        await expect(mobileReview.locator('[data-review-panel="status"]')).toBeVisible();
        await mobileReview.getByRole('tab', { name: /Fields/ }).click();
      }
      await viewer.getByRole('button', { name: '‹ Inbox', exact: true }).click();
    } else {
      await expect(viewer.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
      await expect(viewer.locator('.document-inspector')).toContainText('Extraction confidence');
    }
  }

  await search.fill('Billing history statement');
  await viewer.locator('[data-document-record] .document-record-open').click();
  const mobileReview = viewer.locator('.document-mobile-review-shell');
  if (testInfo.project.name === 'mobile-chromium') {
    await mobileReview.getByRole('tab', { name: /Document/ }).click();
  }
  const documentSurface = testInfo.project.name === 'mobile-chromium'
    ? mobileReview
    : viewer.locator('.document-preview-workspace');
  const pageControls = testInfo.project.name === 'mobile-chromium'
    ? mobileReview.locator('[data-review-panel="document"] > .document-page-controls')
    : documentSurface.getByRole('region', { name: 'Document page controls' });
  await expect(pageControls).toBeVisible();
  await expect(pageControls.getByText('Page 1 of 1', { exact: true })).toBeVisible();
  await expect(documentSurface.locator('.document-page')).toContainText('Account billing ledger');
  await expect(documentSurface.locator('.document-page')).toContainText('StreamBox Premium');

  const downloadPromise = page.waitForEvent('download');
  if (testInfo.project.name === 'mobile-chromium') {
    await mobileReview.getByRole('button', { name: 'Export', exact: true }).click();
  } else {
    await viewer.locator('.document-toolbar-actions').getByRole('button', { name: 'Export', exact: true }).click();
  }
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('BILL-HIST');

  if (testInfo.project.name === 'mobile-chromium') {
    await viewer.getByRole('button', { name: '‹ Inbox', exact: true }).click();
  }
  await search.clear();
  const customerRecord = viewer.locator('[data-document-record]').filter({ hasText: 'Customer dispute form' });
  const statementRecord = viewer.locator('[data-document-record]').filter({ hasText: 'Billing history statement' });
  await customerRecord.getByRole('button', { name: 'Compare', exact: true }).click();
  await statementRecord.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(viewer.locator('.document-compare-grid article')).toHaveCount(2);
  await expect(viewer.getByRole('region', { name: 'Document comparison' })).toContainText('Customer dispute form');
  await expect(viewer.getByRole('region', { name: 'Document comparison' })).toContainText('Billing history statement');

  await statementRecord.getByRole('button', { name: /Billing history statement|Open/i }).first().click();
  if (testInfo.project.name === 'mobile-chromium') {
    await mobileReview.getByRole('button', { name: 'Pin', exact: true }).click();
    await mobileReview.getByRole('tab', { name: /Notes/ }).click();
    await mobileReview.getByRole('textbox', { name: 'Mobile document investigator note' }).fill('Statement ownership and both pages were reviewed against the active customer record.');
  } else {
    await viewer.locator('.document-toolbar-actions').getByRole('button', { name: 'Pin', exact: true }).click();
    await viewer.getByRole('textbox', { name: 'Document investigator note' }).fill('Statement ownership and both pages were reviewed against the active customer record.');
  }
  if (testInfo.project.name === 'mobile-chromium') {
    await expect.poll(async () => {
      const items = await page.evaluate(() => (
        JSON.parse(localStorage.getItem('fraud-academy-visual-tray-v1') || '{}')['FA-CB-24007'] ?? []
      ));
      return items.some((item) => String(item).includes('BILL-HIST'));
    }).toBe(true);
  } else {
    await expect(page.locator('.tray-card')).toContainText('BILL-HIST');
  }

  const noteSurface = testInfo.project.name === 'mobile-chromium' ? mobileReview : viewer;
  await noteSurface.getByRole('button', { name: 'Save note', exact: true }).click();
  if (testInfo.project.name === 'mobile-chromium') {
    await expect.poll(async () => {
      const items = await page.evaluate(() => (
        JSON.parse(localStorage.getItem('fraud-academy-notes-v1') || '{}')['FA-CB-24007'] ?? []
      ));
      return items.some((item) => String(item).includes('Document review'));
    }).toBe(true);
  } else {
    await expect(page.locator('.notebook-card')).toContainText('Document review');
  }
  await noteSurface.getByRole('button', { name: 'Add to summary', exact: true }).click();
  if (testInfo.project.name === 'mobile-chromium') {
    await expect.poll(async () => {
      const items = await page.evaluate(() => (
        JSON.parse(localStorage.getItem('fraud-academy-notes-v1') || '{}')['FA-CB-24007'] ?? []
      ));
      return items.some((item) => String(item).includes('Document summary'));
    }).toBe(true);
  } else {
    await expect(page.locator('.notebook-card')).toContainText('Document summary');
  }

  const layout = await page.evaluate(() => {
    const viewerElement = document.querySelector('[data-document-viewer-screen="approved-theme-v1"]');
    const preview = document.querySelector('.document-preview-workspace');
    const pageStage = document.querySelector('.document-page-stage');
    const inspector = document.querySelector('.document-inspector');
    const mobileReviewShell = document.querySelector('.document-mobile-review-shell');
    const mobileStep = document.querySelector('.document-viewer-layout')?.dataset.mobileReviewStep;
    const activeReviewPanel = mobileStep
      ? document.querySelector(`[data-review-panel="${mobileStep}"]`)
      : null;
    const viewportWidth = window.innerWidth;
    const fits = (element) => {
      const box = element?.getBoundingClientRect();
      return Boolean(box && box.left >= -1 && box.right <= viewportWidth + 1);
    };
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth,
      viewerFits: fits(viewerElement),
      previewFits: fits(preview),
      pageStageFits: fits(pageStage),
      inspectorFits: fits(inspector),
      mobileReviewFits: fits(mobileReviewShell),
      activeReviewPanelFits: fits(activeReviewPanel),
      layoutColumns: viewerElement ? getComputedStyle(document.querySelector('.document-viewer-layout')).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.viewerFits).toBe(true);
  if (testInfo.project.name === 'mobile-chromium') {
    expect(layout.mobileReviewFits).toBe(true);
    expect(layout.activeReviewPanelFits).toBe(true);
  } else {
    expect(layout.previewFits).toBe(true);
    expect(layout.pageStageFits).toBe(true);
    expect(layout.inspectorFits).toBe(true);
  }
  expect(layout.layoutColumns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 3);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenViewerCopy);

  if (testInfo.project.name === 'mobile-chromium') {
    await viewer.getByRole('button', { name: '‹ Inbox', exact: true }).click();
  }
  await viewer.getByRole('button', { name: 'Mark Document Viewer reviewed', exact: true }).click();
  await expect(viewer.getByRole('button', { name: 'Document Viewer reviewed', exact: true })).toBeVisible();
  await viewer.getByRole('navigation', { name: 'Document Viewer next routes' })
    .getByRole('button', { name: 'Open Document Request', exact: true })
    .click();
  await expect(panel).toHaveAttribute('data-tool-name', 'Document Request');
});

test('Document Viewer keeps prefilled access locked and restores isolated per-document drafts after reload', async ({ page }, testInfo) => {
  async function openActiveCaseViewer() {
    if (testInfo.project.name !== 'mobile-chromium') {
      const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
      await briefing.getByRole('button', { name: /Begin Investigation/ }).click();
    }
    await selectToolGroup(page, /Documents & Requests/);
    const viewer = page.locator('[data-document-viewer-screen="approved-theme-v1"]');
    const accountSearch = viewer.getByRole('textbox', { name: 'Search by Account ID' });
    await viewer.getByRole('button', { name: 'Use active case Account ID', exact: true }).click();
    await expect(accountSearch).not.toHaveValue('');
    await expect(viewer.getByRole('heading', { name: 'Customer documents are locked', exact: true })).toBeVisible();
    await expect(viewer.locator('[data-document-record]')).toHaveCount(0);
    await viewer.getByRole('button', { name: 'Search account', exact: true }).click();
    await expect(viewer.getByRole('heading', { name: 'Customer documents are locked', exact: true })).toHaveCount(0);
    await expect(viewer.locator('[data-document-record]').first()).toBeVisible();
    return viewer;
  }

  async function openNotes(viewer, documentRecord) {
    await documentRecord.locator('.document-record-open').click();
    if (testInfo.project.name === 'mobile-chromium') {
      const mobileReview = viewer.locator('.document-mobile-review-shell');
      await mobileReview.getByRole('tab', { name: /Notes/ }).click();
      return mobileReview.getByRole('textbox', { name: 'Mobile document investigator note' });
    }
    return viewer.getByRole('textbox', { name: 'Document investigator note' });
  }

  await page.goto('/');
  let viewer = await openActiveCaseViewer();
  const activeCaseId = testInfo.project.name === 'mobile-chromium'
    ? await viewer.getAttribute('data-case-id')
    : await page.locator('.visual-case-switcher select').inputValue();
  const firstRecord = viewer.locator('[data-document-record]').first();
  const firstDocumentId = await firstRecord.getAttribute('data-document-record');
  const draft = `Unsaved document draft for ${firstDocumentId}`;
  const firstDraftKey = `fraud-academy-document-draft:${activeCaseId}:${firstDocumentId}`;
  const firstNote = await openNotes(viewer, firstRecord);
  await firstNote.fill(draft);
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), firstDraftKey)).toBe(draft);

  await page.reload();
  viewer = await openActiveCaseViewer();
  const restoredRecord = viewer.locator(`[data-document-record="${firstDocumentId}"]`);
  await expect(restoredRecord).toBeVisible();
  const restoredNote = await openNotes(viewer, restoredRecord);
  await expect(restoredNote).toHaveValue(draft);

  if (testInfo.project.name === 'mobile-chromium') {
    await viewer.getByRole('button', { name: '‹ Inbox', exact: true }).click();
  }
  const secondRecord = viewer.locator('[data-document-record]').nth(1);
  const secondDocumentId = await secondRecord.getAttribute('data-document-record');
  const secondNote = await openNotes(viewer, secondRecord);
  await expect(secondNote).toHaveValue('');
  const secondDraftKey = `fraud-academy-document-draft:${activeCaseId}:${secondDocumentId}`;
  expect(await page.evaluate((key) => localStorage.getItem(key), secondDraftKey)).toBeNull();
});
