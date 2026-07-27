import { test, expect } from '@playwright/test';
import { createGeneratedCase } from '../src/data/generatedCases.js';
import {
  getDecisionCallGroups,
  getFinalFindingChoices,
} from '../src/data/reviewPackage.js';
import { openWorkflowStage, openWorkspacePages } from './workspace-page-helpers.mjs';

const personalCase = createGeneratedCase({
  index: 97001,
  customerType: 'personal',
  productType: 'deposit-account',
  workflowType: 'personal-account-takeover',
  difficulty: 'standard',
  evidenceDepth: 'standard',
});

const businessCase = createGeneratedCase({
  index: 97002,
  customerType: 'business',
  productType: 'payroll-product',
  workflowType: 'payroll-change-alert',
  difficulty: 'standard',
  evidenceDepth: 'standard',
});

function validReviewChoices(caseRecord) {
  return {
    operationalDecision: getDecisionCallGroups(caseRecord)
      .flatMap((group) => group.options)
      .find((choice) => choice !== 'Deny'),
    finalFinding: getFinalFindingChoices(caseRecord)
      .find((finding) => finding === 'Inconclusive')
      ?? getFinalFindingChoices(caseRecord)[0],
  };
}

async function seedReviewCases(page) {
  await page.addInitScript((records) => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => undefined },
    });
    const byCase = Object.fromEntries(records.map((record) => [record.id, []]));
    const notesByCase = Object.fromEntries(records.map((record) => [
      record.id,
      [`Jul 27, 9:41 AM · Investigation note · Reviewed record ${record.id} and documented the available evidence before choosing an action and finding.`],
    ]));
    const trayByCase = Object.fromEntries(records.map((record, index) => [
      record.id,
      [`${index ? 'DST' : 'DEV'}-${record.id}-001`],
    ]));
    localStorage.setItem('fraud-academy-generated-cases-v1', JSON.stringify(records));
    localStorage.setItem('fraud-academy-completed-tools-v1', JSON.stringify(byCase));
    localStorage.setItem('fraud-academy-visual-tray-v1', JSON.stringify(trayByCase));
    localStorage.setItem('fraud-academy-notes-v1', JSON.stringify(notesByCase));
    localStorage.setItem('fraud-academy-review-packages-v1', JSON.stringify(byCase));
    localStorage.removeItem('fraud-academy-decision-drafts-v1');
    localStorage.removeItem('fraud-academy-debriefs-v1');
    localStorage.removeItem('fraud-academy-layout-mode-v1');
  }, [personalCase, businessCase]);
}

async function chooseCase(page, caseRecord) {
  const selector = page.locator('.visual-case-switcher select').first();
  await expect(selector.locator(`option[value="${caseRecord.id}"]`)).toHaveCount(1);
  await selector.selectOption(caseRecord.id);
  await expect(selector).toHaveValue(caseRecord.id);
}

async function openDecision(page) {
  await openWorkflowStage(page, /Determination/);
  const decision = page.locator('[data-decision-screen="approved-theme-v1"]');
  await expect(decision).toBeVisible();
  await expect(decision).toHaveAttribute('data-decision-layout', 'reference-final-review');
  return decision;
}

async function assertWithinViewport(page, selector) {
  const layout = await page.locator(selector).evaluate((panel) => {
    const rect = panel.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      panelOverflow: Math.max(0, -rect.left, rect.right - window.innerWidth),
    };
  });
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelOverflow).toBeLessThanOrEqual(4);
}

test('personal and business decision reviews use the reference screens and unlock case-scoped Luna coaching', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await seedReviewCases(page);
  await page.goto('/');

  const detectedLayout = testInfo.project.name === 'mobile-chromium' ? 'mobile' : 'desktop';
  await expect(page.locator('body')).toHaveAttribute('data-layout-detected', detectedLayout);
  await expect(page.locator('body')).toHaveAttribute('data-layout-mode', detectedLayout);

  for (const caseRecord of [personalCase, businessCase]) {
    await chooseCase(page, caseRecord);
    const decision = await openDecision(page);
    const customerType = caseRecord.customerType;
    const choices = validReviewChoices(caseRecord);

    await expect(decision).toHaveAttribute('data-case-id', caseRecord.id);
    await expect(decision).toHaveAttribute('data-customer-type', customerType);
    await expect(decision.locator('.decision-case-art')).toBeVisible();
    await expect(decision.getByRole('heading', { name: caseRecord.id, exact: true })).toBeVisible();
    await expect(decision.getByRole('heading', { name: 'Selected Decision', exact: true })).toBeVisible();
    await expect(decision.getByRole('heading', { name: 'Pinned Evidence (1)', exact: true })).toBeVisible();
    await expect(decision.getByRole('heading', { name: 'Notes', exact: true })).toBeVisible();
    await expect(decision.getByText('Nothing is selected for you.', { exact: true })).toBeVisible();

    const submit = decision.getByRole('button', { name: 'Confirm and Submit Decision', exact: true });
    await expect(submit).toBeDisabled();
    await decision.getByRole('radio', { name: choices.operationalDecision, exact: true }).check();
    await decision.getByRole('radio', { name: choices.finalFinding, exact: true }).check();
    await decision.getByRole('combobox', { name: 'Learner confidence' }).selectOption('High');
    await decision.getByRole('textbox', { name: 'Finding basis' })
      .fill(`Record ${caseRecord.id}-001 and the dated case evidence support this training decision.`);
    await expect(decision.locator('.decision-selected-summary')).toContainText(choices.operationalDecision);
    await expect(decision.locator('.decision-selected-summary')).toContainText(choices.finalFinding);
    await expect(submit).toBeEnabled();

    const lockedLuna = page.locator(`[data-luna-screen="approved-theme-v1"][data-case-id="${caseRecord.id}"][data-luna-state="locked"]`);
    await expect(lockedLuna).toBeAttached();
    await expect(lockedLuna).toBeHidden();
    const workflow = await openWorkspacePages(page);
    await expect(workflow.getByRole('button', { name: /Debrief/ })).toBeDisabled();
    await openDecision(page);

    await assertWithinViewport(page, '[data-decision-layout="reference-final-review"]');
    await submit.click();
    await expect(page.locator('.visual-os-frame, .mission-workspace-v3'))
      .toHaveAttribute('data-workspace-screen', 'debrief');

    const luna = page.locator(`[data-luna-screen="approved-theme-v1"][data-case-id="${caseRecord.id}"][data-luna-state="unlocked"]`);
    await expect(luna).toBeVisible();
    await expect(luna).toHaveAttribute('data-luna-layout', 'reference-debrief');
    await expect(luna).toHaveAttribute('data-customer-type', customerType);
    await expect(luna.locator('.luna-welcome-mascot')).toBeVisible();
    await expect(luna.getByRole('heading', { name: 'What You Did Well', exact: true })).toBeVisible();
    await expect(luna.getByRole('heading', { name: 'Evidence You Might Have Missed', exact: true })).toBeVisible();
    await expect(luna.getByRole('heading', { name: 'Risk Tip from Luna', exact: true })).toBeVisible();
    await expect(luna.getByRole('heading', { name: "Luna's Motivation", exact: true })).toBeVisible();
    if (customerType === 'business') {
      await expect(luna.locator('.luna-risk-tip, .luna-motivation')).toContainText(/business|payroll/i);
    }

    await assertWithinViewport(page, '[data-luna-layout="reference-debrief"]');
    const savedPackage = await page.evaluate((caseId) => {
      const packages = JSON.parse(localStorage.getItem('fraud-academy-review-packages-v1') || '{}');
      return packages[caseId]?.[0] ?? null;
    }, caseRecord.id);
    expect(savedPackage).toMatchObject({
      caseId: caseRecord.id,
      customerType,
      operationalDecision: choices.operationalDecision,
      finalFinding: choices.finalFinding,
      confidence: 'High',
    });

    await luna.getByRole('button', { name: 'Share Luna debrief', exact: true }).click();
    await expect(luna.locator('.luna-reference-actions [role="status"]')).toContainText('Copied');
    await luna.getByRole('button', { name: 'Back to Workspace', exact: true }).click();
    await expect(page.locator('.visual-os-frame, .mission-workspace-v3'))
      .toHaveAttribute('data-workspace-screen', 'tool-menu');
  }

  await page.reload();
  await chooseCase(page, businessCase);
  await openWorkflowStage(page, /Debrief/);
  const persistedBusinessLuna = page.locator(
    `[data-luna-layout="reference-debrief"][data-case-id="${businessCase.id}"][data-luna-state="unlocked"]`,
  );
  await expect(persistedBusinessLuna).toBeVisible();
  await expect(persistedBusinessLuna.locator('.luna-risk-tip, .luna-motivation')).toContainText(/business|payroll/i);
});
