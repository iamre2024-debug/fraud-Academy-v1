import { test, expect } from '@playwright/test';
import { selectToolGroup } from './workspace-page-helpers.mjs';

const recoveryCode = 'fa-browser-recovery-code-1234567890';
const caseId = 'FA-ATO-24018';

function createCloudMock() {
  const records = new Map();
  let conflictNextWrite = false;

  return {
    forceConflict() {
      conflictNextWrite = true;
    },
    revision() {
      return [...records.values()][0]?.revision ?? 0;
    },
    async route(route) {
      const request = route.request();
      const key = request.headers()['x-fraud-academy-sync-id'];
      const current = records.get(key) ?? { revision: 0, payload: null };

      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(current),
        });
        return;
      }

      if (request.method() === 'PUT') {
        const body = request.postDataJSON();
        if (conflictNextWrite) {
          conflictNextWrite = false;
          const conflicted = { ...current, revision: current.revision + 1 };
          records.set(key, conflicted);
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify(conflicted),
          });
          return;
        }
        if (body.baseRevision !== current.revision) {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify(current),
          });
          return;
        }
        const next = { revision: current.revision + 1, payload: body.payload };
        records.set(key, next);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ revision: next.revision }),
        });
        return;
      }

      await route.fulfill({ status: 204 });
    },
  };
}

async function installInitialRecovery(page, mobile) {
  await page.addInitScript(({ syncCode, activeCaseId, useMobile }) => {
    localStorage.setItem('fraud-academy-cloud-recovery-code-v1', syncCode);
    if (useMobile) localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
    localStorage.setItem('fraud-academy-visual-tray-v1', JSON.stringify({
      [activeCaseId]: ['TRN-8842-19', 'EVT-CLOUD-PIN'],
    }));
    localStorage.setItem('fraud-academy-notes-v1', JSON.stringify({
      [activeCaseId]: ['Jul 25 · Investigation note · Cloud recovery note.'],
    }));
    localStorage.setItem('fraud-academy-completed-tools-v1', JSON.stringify({
      [activeCaseId]: ['Case Summary', 'Login History'],
    }));
    localStorage.setItem('fraud-academy-review-packages-v1', JSON.stringify({
      [activeCaseId]: [{ id: 'PKG-CLOUD-1', caseId: activeCaseId, savedAt: 'Jul 25, 9:00 AM' }],
    }));
    localStorage.setItem('fraud-academy-completed-debriefs-v1', JSON.stringify({
      [activeCaseId]: [{
        id: 'PKG-CLOUD-1:debrief',
        caseId: activeCaseId,
        packageId: 'PKG-CLOUD-1',
        completedAt: '2026-07-25T14:00:00.000Z',
        managerReview: { managerVerdict: 'Cloud recovery debrief.' },
      }],
    }));
  }, { syncCode: recoveryCode, activeCaseId: caseId, useMobile: mobile });
}

async function openCases(page, mobile) {
  const navigation = page.getByRole('navigation', { name: mobile ? 'Mission navigation' : 'Main navigation' });
  await navigation.getByRole('button', { name: /Cases/ }).click();
  await expect(page.locator('[data-cases-theme-v1="approved"]')).toBeVisible();
}

async function generateOneCase(page, mobile) {
  await openCases(page, mobile);
  const queue = page.locator('.cases-theme-v1-panel');
  await queue.getByLabel('Generate case count').selectOption('1');
  await queue.getByRole('button', { name: 'Generate cases', exact: true }).click();
  const selector = mobile
    ? page.locator('.mission-workspace-case-selector select')
    : page.locator('.visual-case-switcher select');
  await expect.poll(() => selector.inputValue()).toMatch(/-G\d+$/);
  const generatedCaseId = await selector.inputValue();
  expect(generatedCaseId).toMatch(/-G\d+$/);
  return generatedCaseId;
}

function activeCaseSelector(page, mobile) {
  return mobile
    ? page.locator('.mission-workspace-case-selector select')
    : page.locator('.visual-case-switcher select');
}

async function openGeneratedCaseTool(page, mobile, generatedCaseId) {
  await expect(activeCaseSelector(page, mobile)).toHaveValue(generatedCaseId);
  await selectToolGroup(page, 'Login, Session, Device & IP');
  const frame = page.locator('.visual-os-frame, .mission-workspace-v3');
  await expect(frame).toHaveAttribute('data-workspace-screen', 'tool');
  await expect(frame).toHaveAttribute('data-active-tool', 'Login History');
}

async function expectResumePoint(page, generatedCaseId) {
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem('fraud-academy-resume-session-v1') || '{}').current
  ))).toEqual({
    schemaVersion: 1,
    activeTab: 'workspace',
    activeCaseId: generatedCaseId,
    workspaceScreen: 'tool',
    activeTool: 'Login History',
  });
}

async function expectRecoveredSlices(page) {
  await expect.poll(() => page.evaluate(({ activeCaseId }) => {
    const read = (key) => JSON.parse(localStorage.getItem(key) || '{}');
    return {
      pin: read('fraud-academy-visual-tray-v1')[activeCaseId]?.includes('EVT-CLOUD-PIN'),
      note: read('fraud-academy-notes-v1')[activeCaseId]?.includes('Jul 25 · Investigation note · Cloud recovery note.'),
      reviewed: read('fraud-academy-completed-tools-v1')[activeCaseId]?.includes('Login History'),
      debrief: read('fraud-academy-completed-debriefs-v1')[activeCaseId]?.[0]?.id,
    };
  }, { activeCaseId: caseId })).toEqual({
    pin: true,
    note: true,
    reviewed: true,
    debrief: 'PKG-CLOUD-1:debrief',
  });
}

test('cloud recovery survives close/reopen and restores cases on a clean device', async ({ browser, page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile-chromium';
  const cloud = createCloudMock();
  await page.context().route('**/api/cloud-sync', (route) => cloud.route(route));
  await installInitialRecovery(page, mobile);
  await page.goto('/');

  await expectRecoveredSlices(page);
  await expect.poll(() => cloud.revision()).toBeGreaterThan(0);
  const revisionBeforeGeneratedCase = cloud.revision();
  const generatedCaseId = await generateOneCase(page, mobile);
  await expect.poll(() => cloud.revision()).toBeGreaterThan(revisionBeforeGeneratedCase);
  const revisionBeforeResumePoint = cloud.revision();
  await openGeneratedCaseTool(page, mobile, generatedCaseId);
  await expectResumePoint(page, generatedCaseId);
  await expect.poll(() => cloud.revision()).toBeGreaterThan(revisionBeforeResumePoint);

  const originalContext = page.context();
  await page.close();
  const reopenedPage = await originalContext.newPage();
  await reopenedPage.goto('/');
  await expectRecoveredSlices(reopenedPage);
  await expect(activeCaseSelector(reopenedPage, mobile)).toHaveValue(generatedCaseId);
  await expect(reopenedPage.locator('.visual-os-frame, .mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'tool');
  await expect(reopenedPage.locator('.visual-os-frame, .mission-workspace-v3')).toHaveAttribute('data-active-tool', 'Login History');
  await expectResumePoint(reopenedPage, generatedCaseId);

  const restoredContext = await browser.newContext(mobile
    ? { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }
    : { viewport: { width: 1280, height: 900 } });
  await restoredContext.route('**/api/cloud-sync', (route) => cloud.route(route));
  await restoredContext.addInitScript(({ syncCode, useMobile }) => {
    localStorage.setItem('fraud-academy-cloud-recovery-code-v1', syncCode);
    if (useMobile) localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  }, { syncCode: recoveryCode, useMobile: mobile });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto('/');
  await expectRecoveredSlices(restoredPage);
  await expect(activeCaseSelector(restoredPage, mobile)).toHaveValue(generatedCaseId);
  await expect(restoredPage.locator('.visual-os-frame, .mission-workspace-v3')).toHaveAttribute('data-workspace-screen', 'tool');
  await expect(restoredPage.locator('.visual-os-frame, .mission-workspace-v3')).toHaveAttribute('data-active-tool', 'Login History');
  await expectResumePoint(restoredPage, generatedCaseId);
  await restoredContext.close();
});

test('offline Quick Pad changes retry a cloud conflict when connectivity returns', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile-chromium';
  const cloud = createCloudMock();
  await page.context().route('**/api/cloud-sync', (route) => cloud.route(route));
  await installInitialRecovery(page, mobile);
  await page.goto('/');
  await expect.poll(() => cloud.revision()).toBeGreaterThan(0);
  const revisionBeforeOfflineEdit = cloud.revision();

  await page.context().setOffline(true);
  await page.getByRole('button', { name: /Open Quick Pad/ }).click();
  const quickPad = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await quickPad.getByRole('button', { name: 'Scratch note', exact: true }).click();
  const offlineText = 'Offline follow-up: compare the destination ID after reconnecting.';
  await quickPad.getByRole('textbox', { name: 'Case Quick Pad scratch note' }).fill(offlineText);
  await expect.poll(() => page.evaluate(({ activeCaseId }) => (
    JSON.parse(localStorage.getItem('fraud-academy-quick-pad-v1') || '{}')[activeCaseId]?.scratch
  ), { activeCaseId: caseId })).toBe(offlineText);
  await quickPad.getByRole('button', { name: 'Close Quick Pad' }).click();
  await openCases(page, mobile);
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem('fraud-academy-resume-session-v1') || '{}').current?.activeTab
  ))).toBe('cases');

  cloud.forceConflict();
  await page.context().setOffline(false);
  await expect.poll(() => cloud.revision(), { timeout: 15_000 }).toBeGreaterThan(revisionBeforeOfflineEdit + 1);
  await expect.poll(() => page.evaluate(() => (
    document.querySelector('[data-cloud-sync-status="synced"]')?.getAttribute('data-cloud-sync-status')
      || localStorage.getItem('fraud-academy-cloud-recovery-code-v1')
  ))).toBeTruthy();

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'cases');
  await expect(page.locator('[data-cases-theme-v1="approved"]')).toBeVisible();
  const navigation = page.getByRole('navigation', { name: mobile ? 'Mission navigation' : 'Main navigation' });
  await navigation.getByRole('button', { name: mobile ? /Mission/ : /Workspace/ }).click();
  await page.getByRole('button', { name: /Open Quick Pad/ }).click();
  const restoredPad = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await restoredPad.getByRole('button', { name: 'Scratch note', exact: true }).click();
  await expect(restoredPad.getByRole('textbox', { name: 'Case Quick Pad scratch note' })).toHaveValue(offlineText);
});
