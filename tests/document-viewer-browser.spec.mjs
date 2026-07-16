import { test, expect } from '@playwright/test';
import { selectToolGroup } from './workspace-page-helpers.mjs';

const requiredDocuments = [
  'Driver License Review',
  'Bank Statement',
  'EIN Assignment Notice',
  'Tax Return Transcript',
  'Utility Bill - Proof of Address',
  'Phone Ownership Report',
];

const forbiddenViewerCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate)\b/i;

test('Document Viewer requires an Account ID, then compares, annotates, and exports matching customer documents', async ({ page }, testInfo) => {
  await page.goto('/');

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing.getByRole('button', { name: 'Open Document Viewer', exact: true })).toHaveCount(0);
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();

  await expect(page.locator('[data-customer-360-screen="approved-theme-v1"]')
    .getByRole('button', { name: 'Document Viewer', exact: true })).toHaveCount(0);
  await expect(page.locator('.tray-card').getByRole('button', { name: /Document Viewer/ })).toHaveCount(0);

  await selectToolGroup(page, /Documents & Requests/);

  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const viewer = panel.locator('[data-document-viewer-screen="approved-theme-v1"]');
  const search = viewer.getByRole('textbox', { name: 'Search Document Viewer records' });

  await expect(panel).toHaveAttribute('data-tool-name', 'Document Viewer');
  await expect(panel.getByRole('heading', { name: 'Document Viewer', exact: true })).toBeVisible();
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole('heading', { name: 'Customer documents are locked', exact: true })).toBeVisible();
  await expect(viewer.locator('[data-document-record]')).toHaveCount(0);
  await expect(viewer.getByRole('navigation', { name: 'Document folders' })).toHaveCount(0);

  const accountSearch = viewer.getByRole('textbox', { name: 'Search by Account ID' });
  await accountSearch.fill('ACCT-NOT-FOUND');
  await viewer.getByRole('button', { name: 'Search account', exact: true }).click();
  await expect(viewer).toContainText('No case was found for that Account ID');
  await expect(viewer.locator('[data-document-record]')).toHaveCount(0);

  await accountSearch.fill('ACCT-24007-8841');
  await viewer.getByRole('button', { name: 'Search account', exact: true }).click();
  await expect(viewer).toContainText('Jordan Ellis');
  await expect(viewer).toContainText('FA-CB-24007');
  await expect(viewer.getByRole('navigation', { name: 'Document folders' }).getByRole('button')).toHaveCount(6);
  expect(await viewer.locator('[data-document-record]').count()).toBeGreaterThanOrEqual(9);

  for (const title of requiredDocuments) {
    await search.fill(title);
    await expect(viewer.locator('[data-document-record]')).toHaveCount(1);
    await expect(viewer.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
    await expect(viewer.locator('.document-inspector')).toContainText('Extraction confidence');
  }

  await search.fill('Bank Statement');
  const pageControls = viewer.getByRole('region', { name: 'Document page controls' });
  await expect(pageControls.getByText('Page 1 of 2', { exact: true })).toBeVisible();
  await viewer.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(pageControls.getByText('Page 2 of 2', { exact: true })).toBeVisible();
  await expect(viewer.locator('.document-page')).toContainText('Selected withdrawals');

  const downloadPromise = page.waitForEvent('download');
  await viewer.locator('.document-toolbar-actions').getByRole('button', { name: 'Export', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('DOC-BANK');

  await search.clear();
  const licenseRecord = viewer.locator('[data-document-record]').filter({ hasText: 'Driver License Review' });
  const statementRecord = viewer.locator('[data-document-record]').filter({ hasText: 'Bank Statement' });
  await licenseRecord.getByRole('button', { name: 'Compare', exact: true }).click();
  await statementRecord.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(viewer.locator('.document-compare-grid article')).toHaveCount(2);
  await expect(viewer.getByRole('region', { name: 'Document comparison' })).toContainText('Driver License Review');
  await expect(viewer.getByRole('region', { name: 'Document comparison' })).toContainText('Bank Statement');

  await statementRecord.getByRole('button', { name: /Monthly Checking Statement|Bank Statement|Open/i }).first().click();
  await viewer.locator('.document-toolbar-actions').getByRole('button', { name: 'Pin', exact: true }).click();
  await expect(page.locator('.tray-card')).toContainText('DOC-BANK');

  await viewer.getByRole('textbox', { name: 'Document investigator note' }).fill('Statement ownership and both pages were reviewed against the active customer record.');
  await viewer.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('Document review');
  await viewer.getByRole('button', { name: 'Add to summary', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('Document summary');

  const layout = await page.evaluate(() => {
    const viewerElement = document.querySelector('[data-document-viewer-screen="approved-theme-v1"]');
    const preview = document.querySelector('.document-preview-workspace');
    const pageStage = document.querySelector('.document-page-stage');
    const inspector = document.querySelector('.document-inspector');
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
      layoutColumns: viewerElement ? getComputedStyle(document.querySelector('.document-viewer-layout')).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.viewerFits).toBe(true);
  expect(layout.previewFits).toBe(true);
  expect(layout.pageStageFits).toBe(true);
  expect(layout.inspectorFits).toBe(true);
  expect(layout.layoutColumns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 3);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenViewerCopy);

  await viewer.getByRole('button', { name: 'Mark Document Viewer reviewed', exact: true }).click();
  await expect(viewer.getByRole('button', { name: 'Document Viewer reviewed', exact: true })).toBeVisible();
  await viewer.getByRole('navigation', { name: 'Document Viewer next routes' })
    .getByRole('button', { name: 'Open Document Request', exact: true })
    .click();
  await expect(panel).toHaveAttribute('data-tool-name', 'Document Request');
});
