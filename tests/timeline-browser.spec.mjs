import { test, expect } from '@playwright/test';

const secondCase = { id: 'FA-CB-24007', person: 'Jordan Ellis' };
const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate|suggested first tool|investigator question)\b/i;

async function openTimeline(page) {
  const workflow = page.locator('.active-case-workflow');
  await workflow.getByRole('button', { name: /Timeline/ }).click();
  const timeline = page.locator('[data-timeline-screen="approved-theme-v1"]');
  await expect(timeline).toBeVisible();
  return timeline;
}

test('approved Timeline preserves sequence review, evidence actions, and responsive safety', async ({ page }, testInfo) => {
  await page.goto('/');

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing).toBeVisible();
  const timeline = await openTimeline(page);

  await expect(timeline).toHaveAttribute('data-case-id', /FA-/);
  await expect(timeline.getByRole('heading', { name: 'Case Timeline', exact: true })).toBeVisible();
  await expect(timeline.getByText('Working question', { exact: true })).toBeVisible();
  await expect(timeline.locator('.timeline-metrics article')).toHaveCount(4);

  const events = timeline.locator('[data-timeline-event]');
  await expect(events.first()).toBeVisible();
  const eventCount = await events.count();
  expect(eventCount).toBeGreaterThan(0);

  const layout = await page.evaluate(() => {
    const panel = document.querySelector('[data-timeline-screen="approved-theme-v1"]');
    const workspace = document.querySelector('.timeline-workspace');
    const stream = document.querySelector('.timeline-stream');
    const detail = document.querySelector('.timeline-detail');
    const metrics = document.querySelector('.timeline-metrics');
    const viewportWidth = window.innerWidth;
    const box = (element) => element?.getBoundingClientRect();
    const fits = (element) => {
      const rect = box(element);
      return Boolean(rect && rect.left >= -1 && rect.right <= viewportWidth + 1);
    };

    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelFits: fits(panel),
      streamFits: fits(stream),
      detailFits: fits(detail),
      workspaceColumns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      metricColumns: metrics ? getComputedStyle(metrics).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      streamTop: box(stream)?.top ?? 0,
      detailTop: box(detail)?.top ?? 0,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelFits).toBe(true);
  expect(layout.streamFits).toBe(true);
  expect(layout.detailFits).toBe(true);

  if (testInfo.project.name === 'mobile-chromium') {
    expect(layout.workspaceColumns).toBe(1);
    expect(layout.metricColumns).toBe(2);
    expect(layout.detailTop).toBeGreaterThan(layout.streamTop + 20);
  } else {
    expect(layout.workspaceColumns).toBe(2);
    expect(layout.metricColumns).toBe(4);
    expect(Math.abs(layout.streamTop - layout.detailTop)).toBeLessThanOrEqual(2);
  }

  const firstEventId = await events.first().getAttribute('data-timeline-event');
  expect(firstEventId).toBeTruthy();
  const search = timeline.getByRole('textbox', { name: 'Search Timeline records' });
  await search.fill(firstEventId);
  await expect(timeline.locator('[data-timeline-event]')).toHaveCount(1);
  await search.clear();

  const sourceFilter = timeline.getByRole('combobox', { name: 'Filter Timeline by source' });
  const sourceOption = await sourceFilter.locator('option').nth(1).textContent();
  expect(sourceOption).toBeTruthy();
  await sourceFilter.selectOption({ label: sourceOption });
  expect(await timeline.locator('[data-timeline-event]').count()).toBeGreaterThan(0);
  await sourceFilter.selectOption('all');

  if (eventCount > 1) {
    const secondEvent = timeline.locator('[data-timeline-event]').nth(1);
    const secondEventId = await secondEvent.getAttribute('data-timeline-event');
    await secondEvent.getByRole('button', { name: 'Open event', exact: true }).click();
    await expect(timeline.locator(`[data-timeline-event="${secondEventId}"]`)).toHaveClass(/selected/);
    await expect(timeline.locator('.timeline-detail')).toContainText(secondEventId);
  }

  const detail = timeline.locator('.timeline-detail');
  await detail.getByRole('button', { name: 'Pin event', exact: true }).click();
  await expect(page.locator('.tray-card')).toContainText('Pinned');
  await detail.getByRole('button', { name: 'Save timeline note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('Timeline event');

  await timeline.getByRole('button', { name: 'Mark Timeline reviewed', exact: true }).click();
  await expect(timeline.getByRole('button', { name: '✓ Timeline reviewed', exact: true })).toBeVisible();

  const nextRoutes = timeline.getByRole('navigation', { name: 'Timeline next routes' });
  await nextRoutes.getByRole('button', { name: 'Open Document Viewer', exact: true }).click();
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toHaveAttribute('data-tool-name', 'Document Viewer');

  const timelineForDecision = await openTimeline(page);
  await timelineForDecision.getByRole('navigation', { name: 'Timeline next routes' })
    .getByRole('button', { name: 'Open Submit Decision', exact: true })
    .click();
  await expect(page.locator('.submit-decision-panel')).toBeVisible();
  await expect(page.locator('.submit-decision-panel')).toContainText('Evidence First protection');

  const selector = page.locator('.visual-case-switcher select');
  await selector.selectOption(secondCase.id);
  await expect(selector).toHaveValue(secondCase.id);
  await expect(briefing.getByText(secondCase.person, { exact: true }).first()).toBeVisible();
  const secondTimeline = await openTimeline(page);
  await expect(secondTimeline).toHaveAttribute('data-case-id', secondCase.id);
  await expect(secondTimeline.locator('[data-timeline-event]').first()).toBeVisible();

  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', secondCase.id);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);
});
