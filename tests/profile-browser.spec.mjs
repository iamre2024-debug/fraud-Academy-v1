import { test, expect } from '@playwright/test';

const caseId = 'FA-ATO-24018';
const forbiddenProfileCopy = /(?:Correct answer|Fraud score|Red flag|Green flag|AI recommendation|Package strengths|Next coaching focus|\/100)/i;

async function seedProfileActivity(page) {
  await page.addInitScript(({ activeCaseId }) => {
    localStorage.setItem('fraud-academy-completed-tools-v1', JSON.stringify({
      [activeCaseId]: ['Case Summary', 'Customer 360', 'Identity Intel / People Search', 'Login History'],
    }));
    localStorage.setItem('fraud-academy-notes-v1', JSON.stringify({
      [activeCaseId]: ['Profile test note'],
    }));
    localStorage.setItem('fraud-academy-case-report-packets-v1', JSON.stringify({
      [activeCaseId]: [{ id: 'packet-profile-test', title: 'Neutral profile test packet' }],
    }));
    localStorage.removeItem('fraud-academy-review-packages-v1');
  }, { activeCaseId: caseId });
}

async function openProfileFromWorkspace(page) {
  await page.getByRole('button', { name: 'Open Agent profile', exact: true }).first().click();
  const profile = page.locator('[data-profile-screen="approved-theme-v1"]');
  await expect(profile).toBeVisible();
  return profile;
}

test('approved Profile opens from the agent avatar and preserves neutral responsive development metrics', async ({ page }, testInfo) => {
  await seedProfileActivity(page);
  await page.goto('/');

  const profile = await openProfileFromWorkspace(page);
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'profile');
  await expect(profile).toHaveAttribute('data-case-id', caseId);
  await expect(profile.getByRole('heading', { name: 'Learner Agent', exact: true })).toBeVisible();
  await expect(profile.getByText('Trainee Investigator', { exact: true })).toBeVisible();
  await expect(profile.locator('.profile-stat-grid article')).toHaveCount(4);
  await expect(profile.locator('.profile-skill-list article')).toHaveCount(4);
  await expect(profile.locator('.profile-badge-grid article')).toHaveCount(4);
  await expect(profile.locator('.profile-goal-grid article')).toHaveCount(3);
  await expect(profile.getByText('4', { exact: true }).first()).toBeVisible();
  expect(await profile.innerText()).not.toMatch(forbiddenProfileCopy);

  const layout = await page.evaluate(() => {
    const panel = document.querySelector('[data-profile-screen="approved-theme-v1"]');
    const mainGrid = document.querySelector('.profile-main-grid');
    const statGrid = document.querySelector('.profile-stat-grid');
    const goalGrid = document.querySelector('.profile-goal-grid');
    const viewportWidth = window.innerWidth;
    const rect = panel?.getBoundingClientRect();
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelOverflow: rect ? Math.max(0, -rect.left, rect.right - viewportWidth) : Number.POSITIVE_INFINITY,
      mainColumns: mainGrid ? getComputedStyle(mainGrid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      statColumns: statGrid ? getComputedStyle(statGrid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      goalColumns: goalGrid ? getComputedStyle(goalGrid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      position: panel ? getComputedStyle(panel).position : '',
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelOverflow).toBeLessThanOrEqual(4);
  expect(layout.position).toBe('static');
  if (testInfo.project.name === 'mobile-chromium') {
    expect(layout.mainColumns).toBe(1);
    expect(layout.statColumns).toBe(2);
    expect(layout.goalColumns).toBe(2);
  } else {
    expect(layout.mainColumns).toBe(2);
    expect(layout.statColumns).toBe(4);
    expect(layout.goalColumns).toBe(4);
  }

  await profile.getByRole('button', { name: /Continue active case/ }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'workspace');
  await expect(page.locator('.visual-case-strip')).toContainText(caseId);

  await page.getByRole('button', { name: /Dashboard/ }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'dashboard');
  await page.locator('.dashboard-agent-mark').click();
  await expect(page.locator('[data-profile-screen="approved-theme-v1"]')).toBeVisible();

  await page.locator('[data-profile-screen="approved-theme-v1"]').getByRole('button', { name: 'Open Academy Progress', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-visual-tab', 'progress');
  await expect(page.getByText('Submitted decision progress', { exact: true })).toBeVisible();
});
