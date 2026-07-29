import { test, expect } from '@playwright/test';
import {
  activeCaseSelector,
  generateCaseFromQueue,
  runPaymentVerification,
  selectToolGroup,
} from './workspace-page-helpers.mjs';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'mobile-chromium') return;
  await page.addInitScript(() => {
    window.localStorage.setItem('fraud-academy-layout-mode-v1', 'mobile');
  });
});

async function openPaymentVerification(page) {
  await selectToolGroup(page, /Business & Payment Verification/, 'Payment Verification');
  const panel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const selector = panel.getByRole('combobox', { name: 'Choose investigation tool' });
  if (await selector.count()) {
    if (await selector.inputValue() !== 'Payment Verification') await selector.selectOption('Payment Verification');
  }
  await expect(panel).toHaveAttribute('data-tool-name', 'Payment Verification');
  return panel;
}

async function openPaymentActions(panel) {
  const actions = panel.locator('details.payment-mission-mobile-actions');
  if (await actions.count() && !(await actions.evaluate((element) => element.open))) {
    await actions.locator('summary').click();
  }
}

test('Payment Verification gates records, handles not-found, and reveals exact lookup evidence', async ({ page }, testInfo) => {
  await page.goto('/');
  const panel = await openPaymentVerification(page);

  await expect(panel.getByRole('heading', { name: 'Verify a specific payment destination' })).toBeVisible();
  await expect(panel.getByRole('region', { name: 'Payment Verification result hidden' })).toBeVisible();
  await expect(panel.getByRole('region', { name: 'Account snapshot' })).toHaveCount(0);
  await expect(panel.getByRole('status', { name: 'Payment verification result' })).toHaveCount(0);
  const reviewButton = panel.getByRole('button', { name: 'Mark Payment Verification reviewed' });
  if (await reviewButton.count()) await expect(reviewButton).toBeDisabled();

  await panel.getByRole('button', { name: 'Run verification', exact: true }).click();
  await expect(panel.getByRole('alert')).toContainText('Bank Code, Destination ID, and person, owner, or business name are required.');

  await panel.getByRole('textbox', { name: 'Bank Code', exact: true }).fill('BC-404');
  await panel.getByRole('textbox', { name: 'Destination ID', exact: true }).fill('DST-MISSING');
  await panel.getByRole('textbox', { name: 'Owner or business name', exact: true }).fill('Maya Sterling');
  await panel.getByRole('button', { name: 'Run verification', exact: true }).click();
  await expect(panel.getByText('Destination Not Found', { exact: true }).first()).toBeVisible();
  await expect(panel.getByRole('status', { name: 'Payment verification result' })).toHaveCount(0);

  await panel.getByRole('button', { name: 'Edit search', exact: true }).click();
  await runPaymentVerification(panel, {
    bankCode: 'BC-441',
    destinationId: 'DST-CARD-4410',
    ownerName: 'Maya Sterling',
  });

  const result = panel.getByRole('status', { name: 'Payment verification result' });
  const snapshot = panel.getByRole('region', { name: 'Account snapshot' });
  await expect(result).toBeFocused();
  await expect(snapshot).toContainText('Matches person name');
  await expect(
    snapshot.locator('article').filter({ hasText: 'Account status' }).getByText('Open', { exact: true }),
  ).toBeVisible();
  await expect(snapshot).toContainText('No NSF found');
  await expect(snapshot).toContainText('7 years, 11 months');
  for (const label of ['Name relationship', 'Account status', 'NSF result', 'Time open / on record']) {
    await expect(snapshot.getByText(label, { exact: true })).toBeVisible();
  }
  for (const label of [
    'Ownership status',
    'Ownership history',
    'Prior-use history',
    'Verification activity',
    'Return / NSF history',
    'Payment type',
  ]) {
    await expect(result.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await expect(result).not.toContainText(/98%|confidence score|fraud score|ready for payments/i);
  await expect(result).not.toContainText(/\b(?:approve|deny|hold|release)\b/i);
  await expect(panel.getByRole('button', { name: 'Mark Payment Verification reviewed' })).toBeEnabled();

  await page.screenshot({ path: testInfo.outputPath(`payment-verification-result-${testInfo.project.name}.png`), fullPage: true });
});

test('Payment Verification reuses Quick Pad identifiers without revealing a result early', async ({ page }) => {
  await page.goto('/');
  const panel = await openPaymentVerification(page);
  await runPaymentVerification(panel, {
    bankCode: 'BC-441',
    destinationId: 'DST-CARD-4410',
    ownerName: 'Maya Sterling',
  });

  await openPaymentActions(panel);
  await panel.getByRole('button', { name: 'Quick Pad Bank Code', exact: true }).click();
  await panel.getByRole('button', { name: 'Quick Pad Destination ID', exact: true }).click();
  await panel.getByRole('button', { name: 'Edit search', exact: true }).click();
  await expect(panel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue('');
  await expect(panel.getByRole('textbox', { name: 'Destination ID', exact: true })).toHaveValue('');

  await page.getByRole('button', { name: 'Open Quick Pad, 2 saved items' }).click();
  let pad = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await pad.locator('article').filter({ hasText: 'Bank Code' })
    .getByRole('button', { name: 'Use here', exact: true })
    .click();
  await expect(panel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue('BC-441');
  await expect(panel.getByRole('region', { name: 'Account snapshot' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Open Quick Pad, 2 saved items' }).click();
  pad = page.getByRole('dialog', { name: 'Keep lookup details close' });
  await pad.locator('article').filter({ hasText: 'Destination ID' })
    .getByRole('button', { name: 'Use here', exact: true })
    .click();
  await expect(panel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue('BC-441');
  await expect(panel.getByRole('textbox', { name: 'Destination ID', exact: true })).toHaveValue('DST-CARD-4410');
  await expect(panel.getByRole('textbox', { name: 'Owner or business name', exact: true })).toHaveValue('');
  await expect(panel.getByRole('status', { name: 'Payment verification result' })).toHaveCount(0);

  await panel.getByRole('textbox', { name: 'Owner or business name', exact: true }).fill('Maya Sterling');
  await panel.getByRole('button', { name: 'Run verification', exact: true }).click();
  await expect(panel.getByRole('status', { name: 'Payment verification result' })).toBeVisible();
});

test('Payment Verification selects the actual account from duplicate destination records and keeps the result narrow', async ({ page }, testInfo) => {
  await page.goto('/');
  const caseSelector = activeCaseSelector(page);
  await caseSelector.selectOption('FA-CR-24003');
  await expect(caseSelector).toHaveValue('FA-CR-24003');
  const panel = await openPaymentVerification(page);

  await runPaymentVerification(panel, {
    bankCode: 'BC-204',
    destinationId: 'DST-7740',
    ownerName: 'Avery Brooks',
  });

  const result = panel.getByRole('status', { name: 'Payment verification result' });
  const snapshot = panel.getByRole('region', { name: 'Account snapshot' });
  await expect(result).toContainText('Partial Match');
  await expect(snapshot).toContainText('Partially matches person name');
  await expect(snapshot).toContainText('Open');
  await expect(snapshot).toContainText('No NSF found');
  await expect(snapshot).toContainText('First seen on the status date; no earlier history supplied');
  const confirmation = panel.locator('dl[aria-label="Searched payment identifiers"]');
  await expect(confirmation).toContainText('Source record');
  await expect(confirmation).toContainText('PAY-3302');

  for (const label of [
    'Ownership status',
    'Ownership history',
    'Prior-use history',
    'Verification activity',
    'Return / NSF history',
    'Payment type',
  ]) {
    await expect(result.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await expect(result).not.toContainText(/\b(?:approve|deny|hold|release|ready for payments)\b/i);

  const layout = await page.evaluate(() => {
    const panelElement = document.querySelector('[data-investigation-tools-screen="approved-theme-v1"]');
    const detail = document.querySelector('.payment-mission-result');
    const facts = document.querySelector('.payment-mission-facts');
    const viewportWidth = window.innerWidth;
    const fits = (element) => {
      const rect = element?.getBoundingClientRect();
      return Boolean(rect && rect.left >= -1 && rect.right <= viewportWidth + 1);
    };
    return {
      panelFits: fits(panelElement),
      detailFits: fits(detail),
      factsFit: fits(facts),
      columns: getComputedStyle(facts).gridTemplateColumns.split(' ').filter(Boolean).length,
    };
  });
  expect(layout.panelFits && layout.detailFits && layout.factsFit).toBe(true);
  expect(layout.columns).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 4);

  await page.screenshot({ path: testInfo.outputPath(`payment-verification-credit-${testInfo.project.name}.png`), fullPage: true });
});

test('Avery Customer 360 records the profile change without duplicating or prefilling Payment Verification', async ({ page }, testInfo) => {
  await page.goto('/');
  const caseSelector = activeCaseSelector(page);
  await caseSelector.selectOption('FA-CR-24003');
  await expect(caseSelector).toHaveValue('FA-CR-24003');
  await selectToolGroup(page, /Identity & Customer/);

  const customer = page.locator('[data-customer-360-screen="approved-theme-v1"]');
  await expect(customer).toBeVisible();
  let profileHistory = customer;
  if (testInfo.project.name === 'mobile-chromium') {
    await customer.getByRole('button', { name: 'View all Profile updates', exact: true }).click();
    profileHistory = page.getByRole('dialog', { name: 'Profile updates' });
    await expect(profileHistory).toBeVisible();
  } else {
    const tabs = customer.getByRole('tablist', { name: 'Customer 360 dossier tabs' });
    await tabs.getByRole('tab', { name: 'Profile History', exact: true }).click();
  }
  const profileEvent = profileHistory.locator('[data-profile-event]').filter({ hasText: 'Payment destination added' });
  await expect(profileEvent).toBeVisible();
  await expect(profileEvent).toContainText('External payment account add');
  await expect(profileEvent).toContainText('No prior external destination on file');
  await expect(profileEvent).toContainText('Bank Code BC-204 · Destination ID DST-7740');
  for (const label of ['Previous value', 'New value', 'Channel', 'Source', 'User / actor', 'Device', 'Session', 'Authentication']) {
    await expect(profileEvent.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(profileEvent).not.toContainText(/\b(?:suspicious|unauthorized|fraudulent|fraud confirmed)\b/i);
  await expect(customer.getByRole('region', { name: 'Payment Account Change', exact: true })).toHaveCount(0);
  await expect(customer.getByRole('region', { name: 'Payment Verification Inputs' })).toHaveCount(0);
  await expect(customer.getByRole('button', { name: 'Prefill Payment Verification' })).toHaveCount(0);
  if (testInfo.project.name === 'mobile-chromium') {
    await profileHistory.getByRole('button', { name: 'Close Profile updates', exact: true }).click();
  }

  const panel = await openPaymentVerification(page);
  await expect(panel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue('');
  await expect(panel.getByRole('textbox', { name: 'Destination ID', exact: true })).toHaveValue('');
  await expect(panel.getByRole('textbox', { name: 'Owner or business name', exact: true })).toHaveValue('');
  await expect(panel.getByRole('region', { name: 'Account snapshot' })).toHaveCount(0);
  await expect(panel.getByRole('status', { name: 'Payment verification result' })).toHaveCount(0);
  await expect(panel.locator('.payment-comparison-panel')).toHaveCount(0);
  await expect(panel).not.toContainText('No prior external destination on file');

  await runPaymentVerification(panel, {
    bankCode: 'BC-204',
    destinationId: 'DST-7740',
    ownerName: 'Avery Brooks',
  });
  const revealedDetail = panel.getByRole('status', { name: 'Payment verification result' });
  await expect(revealedDetail).toBeVisible();
  await expect(revealedDetail).toContainText('BC-204');
  await expect(revealedDetail).toContainText('DST-7740');
  await expect(revealedDetail).toContainText('Partially matches person name');
  await expect(revealedDetail).toContainText('PAY-3302');
  await expect(revealedDetail).toContainText('No external destination');
  await expect(revealedDetail).toContainText('A. Brooks');
  await expect(revealedDetail.getByText('Verification activity', { exact: true })).toBeVisible();
  await expect(revealedDetail).not.toContainText(/confidence score|fraud score|evidence-first summary|ready for payments/i);
  await page.screenshot({ path: testInfo.outputPath(`payment-verification-avery-account-change-${testInfo.project.name}.png`), fullPage: true });
});

test('generated payroll carries one exact account change from Payroll History into gated verification', async ({ page }, testInfo) => {
  await page.goto('/');
  await generateCaseFromQueue(page, {
    customerType: 'business',
    product: 'payroll-product',
    workflow: 'payroll-change-alert',
    alertReason: 'Employee payment destination changed',
    scenario: 'pca-scenario-04',
    difficulty: 'deep',
    evidenceDepth: 'deep',
    count: '1',
  });

  const generatedCaseId = await activeCaseSelector(page).inputValue();
  expect(generatedCaseId).toMatch(/^FA-PCA-G\d+$/);

  await selectToolGroup(page, /Business & Payment Verification/, 'Payroll History');
  const payrollPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  const toolSelector = payrollPanel.getByRole('combobox', { name: 'Choose investigation tool' });
  await expect(payrollPanel).toHaveAttribute('data-tool-name', 'Payroll History');
  const hierarchy = payrollPanel.getByRole('navigation', { name: 'Payroll History hierarchy' });
  await expect(hierarchy).toContainText('Company Payroll History');
  await expect(hierarchy).toContainText('Payroll Run Detail');
  await expect(hierarchy).toContainText('Employee Payroll History');
  await expect(hierarchy).toContainText('Individual Paystub');

  const payrollRecords = payrollPanel.getByRole('region', { name: 'Payroll History records' });
  const currentRun = payrollRecords.locator('[data-payroll-history-record]').last();
  await expect(currentRun).toBeVisible();
  await currentRun.click();

  const runDetail = payrollPanel.getByRole('region', { name: 'Payroll History detail' });
  await expect(runDetail).toBeVisible();
  const runFacts = runDetail.locator(':scope > dl').first();
  for (const label of [
    'Employee Bank Code',
    'Destination ID',
    'New account / destination',
    'Previous account / destination',
    'Change comparison',
  ]) {
    await expect(runFacts.getByText(label, { exact: true })).toBeVisible();
  }

  const paystubs = payrollPanel.getByRole('region', { name: 'Immutable employee paystubs' });
  let paymentHandoff;
  let paystubCard;
  let ownerName;
  let bankCode;
  let destinationId;
  if (testInfo.project.name === 'mobile-chromium') {
    paystubCard = paystubs.locator('[data-mobile-paystub-card]').first();
    await expect(paystubCard).toBeVisible();
    await expect(payrollPanel.locator('.payroll-table-scroll')).toHaveCount(0);
    if (!(await paystubCard.evaluate((element) => element.open))) await paystubCard.locator('summary').click();
    ownerName = (await paystubCard.locator('summary strong').first().innerText()).trim();
    const destination = paystubCard.locator('[data-mobile-paystub-destination]').first();
    await expect(destination).toBeVisible();
    const destinationFacts = destination.locator('dl').first();
    bankCode = (await destinationFacts.locator('div').filter({ hasText: /^Bank Code/ }).locator('dd').innerText()).trim();
    destinationId = (await destinationFacts.locator('div').filter({ hasText: /^Destination ID/ }).locator('dd').innerText()).trim();
    paymentHandoff = destination.getByRole('button', { name: 'Open Payment Verification', exact: true });
    await expect(paymentHandoff).toBeVisible();
  } else {
    const paystubRow = paystubs.locator('tbody tr').first();
    await expect(paystubRow).toBeVisible();
    ownerName = (await paystubRow.locator('td').first().innerText()).trim();
    const destinationText = await paystubRow.locator('td').last().locator('span').innerText();
    const destinationMatch = destinationText.match(/\b(BC-[A-Z0-9-]+)\s*·\s*(DST-[A-Z0-9-]+)\b/i);
    expect(destinationMatch).not.toBeNull();
    [, bankCode, destinationId] = destinationMatch;
    paymentHandoff = paystubRow.getByRole('button', { name: 'Open Payment Verification', exact: true });
  }
  expect(bankCode).toMatch(/^BC-[A-Z0-9-]+$/i);
  expect(destinationId).toMatch(/^DST-[A-Z0-9-]+$/i);
  expect(ownerName).not.toBe('');
  await expect(paystubs).not.toContainText(/Ownership status|Operational account status|Standing|Prior-use history/i);

  if (testInfo.project.name === 'mobile-chromium') {
    for (const width of [320, 360, 375, 390, 412]) {
      await page.setViewportSize({ width, height: 915 });
      await page.evaluate(() => new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }));
      const layout = await page.evaluate(() => {
        const pageRoot = document.querySelector('.mission-payroll-history-page');
        const card = pageRoot?.querySelector('[data-mobile-paystub-card][open]');
        const viewport = document.documentElement.clientWidth;
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const describe = (element) => ({
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 120),
          text: String(element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          left: Math.round(element.getBoundingClientRect().left * 10) / 10,
          right: Math.round(element.getBoundingClientRect().right * 10) / 10,
        });
        const outsideViewport = [...pageRoot.querySelectorAll(
          'summary, header, dl, dt, dd, section, article, button',
        )]
          .filter(visible)
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.left < -1 || rect.right > viewport + 1;
          })
          .slice(0, 12)
          .map(describe);
        const internallyOverflowing = [...card.querySelectorAll(
          'summary, header, dl, dt, dd, section, article, button',
        )]
          .filter(visible)
          .filter((element) => (
            element.scrollWidth > element.clientWidth + 1
            && !/^(?:auto|scroll)$/.test(getComputedStyle(element).overflowX)
          ))
          .slice(0, 12)
          .map(describe);
        const actionButtons = [...card.querySelectorAll('.mobile-paystub-destination-actions button')]
          .filter(visible);
        const columnCount = (element) => (
          getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
        );
        return {
          viewport,
          documentWidth: document.documentElement.scrollWidth,
          pageWidth: pageRoot.scrollWidth,
          pageClientWidth: pageRoot.clientWidth,
          cardWidth: card.scrollWidth,
          cardClientWidth: card.clientWidth,
          outsideViewport,
          internallyOverflowing,
          minimumActionHeight: Math.min(...actionButtons.map((button) => button.getBoundingClientRect().height)),
          actionColumns: columnCount(card.querySelector('.mobile-paystub-destination-actions')),
          coreFactColumns: columnCount(card.querySelector('.mobile-paystub-core-facts')),
          destinationFactColumns: columnCount(card.querySelector('.mobile-paystub-destinations article > dl')),
        };
      });

      expect(layout.documentWidth, JSON.stringify(layout, null, 2)).toBeLessThanOrEqual(layout.viewport + 1);
      expect(layout.pageWidth, JSON.stringify(layout, null, 2)).toBeLessThanOrEqual(layout.pageClientWidth + 1);
      expect(layout.cardWidth, JSON.stringify(layout, null, 2)).toBeLessThanOrEqual(layout.cardClientWidth + 1);
      expect(layout.outsideViewport, JSON.stringify(layout, null, 2)).toEqual([]);
      expect(layout.internallyOverflowing, JSON.stringify(layout, null, 2)).toEqual([]);
      expect(layout.minimumActionHeight).toBeGreaterThanOrEqual(44);
      expect(layout.actionColumns, JSON.stringify(layout, null, 2)).toBe(1);
      expect(layout.coreFactColumns, JSON.stringify(layout, null, 2)).toBe(1);
      expect(layout.destinationFactColumns, JSON.stringify(layout, null, 2)).toBe(1);
    }
  }

  await paymentHandoff.click();
  const verificationPanel = page.locator('[data-investigation-tools-screen="approved-theme-v1"]');
  await expect(verificationPanel).toHaveAttribute('data-tool-name', 'Payment Verification');
  await expect(verificationPanel.getByRole('textbox', { name: 'Bank Code', exact: true })).toHaveValue(bankCode);
  await expect(verificationPanel.getByRole('textbox', { name: 'Destination ID', exact: true })).toHaveValue(destinationId);
  await expect(verificationPanel.getByRole('textbox', { name: 'Owner or business name', exact: true })).toHaveValue(ownerName);
  await expect(verificationPanel.getByRole('region', { name: 'Account snapshot' })).toHaveCount(0);
  await expect(verificationPanel.getByRole('status', { name: 'Payment verification result' })).toHaveCount(0);
  await expect(verificationPanel.locator('.payment-comparison-panel')).toHaveCount(0);

  await verificationPanel.getByRole('button', { name: 'Run verification', exact: true }).click();
  const result = verificationPanel.getByRole('status', { name: 'Payment verification result' });
  await expect(result).toContainText(bankCode);
  await expect(result).toContainText(destinationId);
  for (const label of ['Name relationship', 'Account status', 'NSF result', 'Time open / on record']) {
    await expect(result.getByText(label, { exact: true })).toBeVisible();
  }
  for (const label of ['Ownership status', 'Prior-use history', 'Verification activity', 'Return / NSF history']) {
    await expect(result.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await expect(result).not.toContainText(/confidence score|fraud score|ready for payments/i);
  await page.screenshot({ path: testInfo.outputPath(`payment-verification-generated-payroll-${testInfo.project.name}.png`), fullPage: true });
});
