const caseDetails = {
  'FA-ATO-24018': {
    name: 'Maya Sterling',
    claimId: 'CLM-ATO-24018',
    amount: '$742.18',
    transaction: 'Northstar Digital Market · card not present · debit card ending 4410',
    summary: 'Customer reports an unauthorized card purchase. Access, device, session, transaction, and evidence records are available for investigator review.',
  },
  'FA-CB-24007': {
    name: 'Jordan Ellis',
    claimId: 'CLM-CB-24007',
    amount: '$189.44',
    transaction: 'StreamBox Premium · recurring card billing · credit card ending 8841',
    summary: 'Customer states a subscription merchant continued billing after cancellation. Merchant history, prior billing, and requested document status need review.',
  },
  'FA-CR-24003': {
    name: 'Avery Brooks',
    claimId: 'CLM-CR-24003',
    amount: '$2,400.00',
    transaction: 'Credit line usage request · payment setup packet · Destination ID token',
    summary: 'System alert opened a credit risk review after new account activity and rapid usage request. Identity, payment, and account activity records need review.',
  },
};

const deviceIdByCase = {
  'FA-ATO-24018': {
    'iPhone 16': 'DEV-MAYA-IP16-001',
    'Chrome Mobile': 'DEV-MAYA-CHRM-002',
  },
  'FA-CB-24007': {
    'Android phone': 'DEV-JORDAN-AND-001',
    'Desktop Chrome': 'DEV-JORDAN-DSK-002',
  },
  'FA-CR-24003': {
    'Mobile Safari': 'DEV-AVERY-SAF-001',
  },
};

function activeCaseId() {
  const caseText = document.querySelector('.case-info-bar em')?.textContent?.trim();
  return caseText && caseDetails[caseText] ? caseText : 'FA-ATO-24018';
}

function activeToolName() {
  return document.querySelector('.tool-select')?.value ?? '';
}

function ensureCaseSummaryMeta() {
  const caseId = activeCaseId();
  const detail = caseDetails[caseId];
  const summaryCopy = document.querySelector('.case-summary-visual .summary-copy');
  if (!summaryCopy || !detail) return;

  let meta = summaryCopy.querySelector('.case-summary-meta-grid');
  if (!meta) {
    meta = document.createElement('div');
    meta.className = 'case-summary-meta-grid';
    summaryCopy.appendChild(meta);
  }

  if (meta.dataset.caseId === caseId) return;
  meta.dataset.caseId = caseId;
  meta.innerHTML = `
    <article><small>Name</small><strong>${detail.name}</strong></article>
    <article><small>Claim ID</small><strong>${detail.claimId}</strong></article>
    <article><small>Total claim amount</small><strong>${detail.amount}</strong></article>
    <article class="wide"><small>Transaction / payee info</small><strong>${detail.transaction}</strong></article>
    <article class="wide"><small>Short summary</small><strong>${detail.summary}</strong></article>
  `;
}

function triggerCategory(label) {
  const button = [...document.querySelectorAll('.visual-category-row button')]
    .find((item) => item.textContent.toLowerCase().includes(label.toLowerCase()));
  button?.click();
}

function setTool(toolName) {
  const select = document.querySelector('.tool-select');
  if (!select) return false;
  const option = [...select.options].find((item) => item.value === toolName);
  if (!option) return false;
  select.value = toolName;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function openTool(categoryLabel, toolName) {
  triggerCategory(categoryLabel);
  window.setTimeout(() => {
    setTool(toolName);
    document.querySelector('.activity-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.dispatchEvent(new Event('fraud-academy:repair-needed'));
  }, 120);
}

function ensureSummaryActionButtons() {
  const actions = document.querySelector('.case-summary-visual .summary-actions');
  if (!actions || actions.dataset.investigationRepair === 'true') return;
  actions.dataset.investigationRepair = 'true';

  const identityButton = document.createElement('button');
  identityButton.type = 'button';
  identityButton.textContent = '▣ Identity Intel ›';
  identityButton.addEventListener('click', () => openTool('Identity', 'Identity Intelligence'));

  const reportButton = document.createElement('button');
  reportButton.type = 'button';
  reportButton.textContent = '📄 Case Report ›';
  reportButton.addEventListener('click', () => openTool('Investigation', 'Case Report'));

  const decisionButton = document.createElement('button');
  decisionButton.type = 'button';
  decisionButton.className = 'primary-action decision-jump-button';
  decisionButton.textContent = '🪄 Submit Decision ›';
  decisionButton.addEventListener('click', () => {
    document.querySelector('.submit-decision-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  actions.append(identityButton, reportButton, decisionButton);
}

function repairDeviceIntelligenceTable() {
  if (activeToolName() !== 'Device Intelligence') return;

  const caseId = activeCaseId();
  const idMap = deviceIdByCase[caseId] ?? {};
  const header = document.querySelector('.activity-row.table-head');
  const rows = [...document.querySelectorAll('.activity-table .activity-row:not(.table-head)')];

  if (header && header.dataset.deviceCaseId !== caseId) {
    const columns = [...header.querySelectorAll('span')];
    if (columns[0]) columns[0].textContent = 'Device ID';
    if (columns[1]) columns[1].textContent = 'Device / Browser';
    header.dataset.deviceCaseId = caseId;
  }

  rows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > span')];
    const deviceName = cells[1]?.textContent?.trim();
    if (!deviceName) return;
    const fallbackId = `DEV-${deviceName.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 18)}`;
    const deviceId = idMap[deviceName] ?? fallbackId;
    if (row.dataset.deviceId === deviceId) return;
    if (cells[0]) cells[0].innerHTML = `<small>${deviceId}</small>`;
    row.dataset.deviceId = deviceId;
  });

  let note = document.querySelector('.device-id-context-note');
  if (!note) {
    note = document.createElement('div');
    note.className = 'device-id-context-note';
    note.innerHTML = '<strong>Device ID logic</strong><p>Repeated device names keep the same fictional Device ID for this customer. New devices use a new Device ID so the investigator can separate normal history from new device activity.</p>';
    document.querySelector('.tool-purpose-card')?.appendChild(note);
  }
}

function ensureDecisionRouteInToolPanel() {
  const panel = document.querySelector('.tool-purpose-card');
  if (!panel || panel.querySelector('.decision-route-mini')) return;
  const route = document.createElement('button');
  route.type = 'button';
  route.className = 'decision-route-mini';
  route.textContent = 'Need to decide? Open Submit Decision';
  route.addEventListener('click', () => document.querySelector('.submit-decision-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  panel.appendChild(route);
}

function runInvestigationRepairs() {
  ensureCaseSummaryMeta();
  ensureSummaryActionButtons();
  repairDeviceIntelligenceTable();
  ensureDecisionRouteInToolPanel();
}

function queueRepair() {
  window.requestAnimationFrame(runInvestigationRepairs);
}

window.addEventListener('load', queueRepair);
window.addEventListener('focus', queueRepair);
window.addEventListener('fraud-academy:repair-needed', queueRepair);
document.addEventListener('change', (event) => {
  if (event.target?.matches?.('.visual-case-switcher select, .tool-select')) queueRepair();
});
document.addEventListener('click', (event) => {
  if (event.target?.closest?.('.visual-category-row button, .visual-bottom-nav button, .nav-case-card')) {
    window.setTimeout(queueRepair, 120);
  }
});

queueRepair();
window.setTimeout(queueRepair, 400);
window.setTimeout(queueRepair, 1200);
