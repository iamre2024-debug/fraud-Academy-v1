import { test, expect } from '@playwright/test';

const secondCase = { id: 'FA-CB-24007', person: 'Jordan Ellis' };
const forbiddenPreSubmissionCopy = /\b(?:fraud score|red flags?|green flags?|correct answer|AI recommendations?|fraudulent|legitimate|suggested first tool|investigator question)\b/i;

test('approved Investigation tools are contextual, functional, and responsive', async ({ page }, testInfo) => {
  await page.goto('/');

  const briefing = page.locator('[data-case-briefing-screen="approved-theme-v1"]');
  await expect(briefing).toBeVisible();
  await briefing.getByRole('button', { name: /Begin Investigation/ }).click();

  const customer360 = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer360).toBeVisible();
  await customer360.getByRole('navigation', { name: 'Customer 360 related tools' })
    .getByRole('button', { name: 'Identity Intel', exact: true })
    .click();

  const groupRail = page.locator('[data-investigation-tool-groups="approved-theme-v1"]');
  const toolPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(groupRail).toBeVisible();
  await expect(groupRail.getByRole('button')).toHaveCount(7);
  await expect(groupRail.getByRole('button', { name: /Identity & Customer/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(toolPanel).toBeVisible();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Identity Intel / People Search');
  await expect(toolPanel.getByRole('heading', { name: 'Identity Intel / People Search', exact: true })).toBeVisible();
  await expect(toolPanel.getByText('Working question', { exact: true })).toBeVisible();
  await expect(toolPanel.locator('.investigation-tool-flow span')).toHaveCount(8);
  await expect(toolPanel.getByText('Identity report hidden until a search is run.', { exact: true })).toBeVisible();
  await expect(toolPanel.locator('.identity-intel-summary')).toHaveCount(0);

  const identitySearch = toolPanel.getByRole('textbox', { name: 'Search Identity Intel records' });
  await identitySearch.fill('TRN-8842-19');
  await toolPanel.getByRole('button', { name: 'Run People Search', exact: true }).click();
  await expect(toolPanel.getByRole('heading', { name: 'Maya Sterling', exact: true })).toBeVisible();
  await expect(toolPanel.locator('.identity-intel-summary dl > div')).toHaveCount(10);
  await expect(toolPanel.locator('.identity-intel-counts article')).toHaveCount(12);
  await expect(toolPanel.locator('.identity-intel-sections button')).toHaveCount(17);
  await expect(toolPanel.getByRole('heading', { name: 'Identity Summary', exact: true })).toBeVisible();
  await expect(toolPanel.getByRole('heading', { name: 'Case objects to compare', exact: true })).toBeVisible();

  const layout = await page.evaluate(() => {
    const groups = document.querySelector('.investigation-tool-groups-theme-v1 .visual-category-row');
    const workspace = document.querySelector('.identity-intel-workspace');
    const recordsPanel = document.querySelector('.identity-intel-sections');
    const detail = document.querySelector('.identity-intel-report');
    const evidence = document.querySelector('.identity-intel-evidence');
    const toolPanelElement = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const viewportWidth = window.innerWidth;
    const rect = (element) => element?.getBoundingClientRect();
    const fits = (element) => {
      const box = rect(element);
      return Boolean(box && box.left >= -1 && box.right <= viewportWidth + 1);
    };

    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelFits: fits(toolPanelElement),
      recordsFit: fits(recordsPanel),
      detailFits: fits(detail),
      groupColumns: groups ? getComputedStyle(groups).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      workspaceColumns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      recordsTop: rect(recordsPanel)?.top ?? 0,
      detailTop: rect(detail)?.top ?? 0,
      evidenceTop: rect(evidence)?.top ?? 0,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.panelFits).toBe(true);
  expect(layout.recordsFit).toBe(true);
  expect(layout.detailFits).toBe(true);

  if (testInfo.project.name === 'mobile-chromium') {
    expect(layout.groupColumns).toBe(2);
    expect(layout.workspaceColumns).toBe(1);
    expect(layout.detailTop).toBeGreaterThan(layout.recordsTop + 20);
  } else {
    expect(layout.groupColumns).toBe(6);
    expect(layout.workspaceColumns).toBe(3);
    expect(Math.abs(layout.recordsTop - layout.detailTop)).toBeLessThanOrEqual(2);
    expect(Math.abs(layout.evidenceTop - layout.detailTop)).toBeLessThanOrEqual(2);
  }

  await toolPanel.getByRole('button', { name: 'Email History', exact: true }).click();
  await expect(toolPanel.getByRole('heading', { name: 'Email History', exact: true })).toBeVisible();
  await toolPanel.locator('.identity-intel-summary').getByRole('button', { name: 'Pin profile', exact: true }).click();
  await expect(page.locator('.tray-card')).toContainText('Pinned');
  await toolPanel.getByRole('button', { name: 'Save section note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('Identity Intel');
  await toolPanel.getByRole('button', { name: 'Mark Identity Intel / People Search reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: '✓ Identity Intel / People Search reviewed', exact: true })).toBeVisible();

  await groupRail.getByRole('button', { name: /Login, Device & IP/ }).click();
  const toolSelect = toolPanel.getByRole('combobox', { name: 'Choose investigation tool' });
  await expect(toolSelect).toHaveValue('Login History');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Login History');
  await expect(groupRail.getByRole('button', { name: /Login, Device & IP/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(toolPanel.getByText('Every recorded login is available below.', { exact: false })).toBeVisible();
  await expect(toolPanel.locator('.login-history-summary article')).toHaveCount(6);

  const loginRecords = toolPanel.locator('[data-login-history-record]');
  await expect(loginRecords.first()).toBeVisible();
  const firstLoginId = await loginRecords.first().getAttribute('data-login-history-record');
  const loginSearch = toolPanel.getByRole('textbox', { name: 'Search Login History records' });
  await loginSearch.fill(firstLoginId);
  await expect(loginRecords).toHaveCount(1);
  await loginSearch.clear();

  await loginRecords.first().click();
  await expect(toolPanel.locator('.login-detail-panel')).toContainText(firstLoginId);
  await toolPanel.getByRole('button', { name: 'Pin session', exact: true }).click();
  await expect(page.locator('.tray-card')).toContainText('Pinned');
  await toolPanel.getByRole('button', { name: 'Save login note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('Login History');
  await toolPanel.getByRole('button', { name: 'Mark Login History reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: '✓ Login History reviewed', exact: true })).toBeVisible();

  await toolSelect.selectOption('Session History');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Session History');
  await expect(toolPanel.getByRole('heading', { name: 'After login, what did the user do?', exact: true })).toBeVisible();
  await expect(toolPanel.locator('.session-history-summary article')).toHaveCount(6);

  const sessionRecords = toolPanel.locator('[data-session-history-record]');
  await expect(sessionRecords.first()).toBeVisible();
  const firstSessionId = await sessionRecords.first().getAttribute('data-session-history-record');
  const sessionSearch = toolPanel.getByRole('textbox', { name: 'Search Session History records' });
  await sessionSearch.fill(firstSessionId);
  await expect(sessionRecords).toHaveCount(1);
  await sessionSearch.clear();

  await sessionRecords.first().click();
  await expect(toolPanel.locator('.session-detail-panel')).toContainText(firstSessionId);
  await toolPanel.getByRole('button', { name: 'Pin session', exact: true }).click();
  await expect(page.locator('.tray-card')).toContainText('Pinned');
  await toolPanel.getByRole('button', { name: 'Save session note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('Session History');
  await toolPanel.getByRole('button', { name: 'Mark Session History reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: '✓ Session History reviewed', exact: true })).toBeVisible();

  await toolSelect.selectOption('IP Intelligence');
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'IP Intelligence');
  await expect(toolPanel.getByRole('heading', { name: 'Where did the connection originate, and has it been seen elsewhere?', exact: true })).toBeVisible();
  await expect(toolPanel.locator('.ip-intel-summary article')).toHaveCount(6);
  await expect(toolPanel.getByText('Run an IP lookup to reveal', { exact: true }).first()).toBeVisible();

  const ipRecords = toolPanel.locator('[data-ip-intelligence-record]');
  await expect(ipRecords.first()).toBeVisible();
  const firstIpRecordId = await ipRecords.first().getAttribute('data-ip-intelligence-record');
  const ipSearch = toolPanel.getByRole('textbox', { name: 'Search IP Intelligence records' });
  await ipSearch.fill(firstIpRecordId.replace('IP-', ''));
  await expect(ipRecords).toHaveCount(1);
  await expect(toolPanel.getByText('Run an IP lookup to reveal', { exact: true })).toHaveCount(0);

  await ipRecords.first().click();
  await expect(toolPanel.locator('.ip-detail-panel')).toContainText(firstIpRecordId.replace('IP-', ''));
  await toolPanel.getByRole('button', { name: 'Pin IP address', exact: true }).click();
  await expect(page.locator('.tray-card')).toContainText('Pinned');
  await toolPanel.getByRole('button', { name: 'Save IP note', exact: true }).click();
  await expect(page.locator('.notebook-card')).toContainText('IP Intelligence');
  await toolPanel.getByRole('button', { name: 'Mark IP Intelligence reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: '✓ IP Intelligence reviewed', exact: true })).toBeVisible();

  await groupRail.getByRole('button', { name: /Transactions & Financial/ }).click();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Transaction History');
  await expect(toolPanel.getByRole('heading', { name: 'Transaction History', exact: true })).toBeVisible();

  await groupRail.getByRole('button', { name: /Business & Payment Verification/ }).click();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Payment Verification');
  await expect(toolPanel.getByRole('heading', { name: 'Payment Verification', exact: true })).toBeVisible();

  await toolPanel.getByRole('button', { name: 'Mark Payment Verification reviewed', exact: true }).click();
  await expect(toolPanel.getByRole('button', { name: '✓ Payment Verification reviewed', exact: true })).toBeVisible();

  await toolPanel.getByRole('navigation', { name: 'Payment verification next routes' })
    .getByRole('button', { name: 'Open Timeline', exact: true })
    .click();
  await expect(page.locator('[data-investigation-tools-screen="approved-theme-v1"]')).toHaveCount(0);
  await expect(page.locator('.activity-panel')).toContainText('Timeline');

  const selector = page.locator('.visual-case-switcher select');
  await selector.selectOption(secondCase.id);
  await expect(selector).toHaveValue(secondCase.id);
  await expect(briefing.getByText(secondCase.person, { exact: true }).first()).toBeVisible();
  await expect(toolPanel).toHaveAttribute('data-tool-name', 'Login History');
  await expect(toolPanel.locator('.investigation-tool-header-actions')).toContainText(secondCase.id);

  const lunaPanel = page.locator('.luna-visual-panel.locked');
  await expect(lunaPanel).toBeAttached();
  await expect(lunaPanel).toHaveAttribute('data-case-id', secondCase.id);
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenPreSubmissionCopy);
});
