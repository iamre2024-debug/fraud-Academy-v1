const cases = [
  { id: 'FA-ATO-24018', person: 'Maya Sterling', type: 'Account Takeover', priority: 'High' },
  { id: 'FA-CB-24007', person: 'Jordan Ellis', type: 'Chargeback Claim', priority: 'Medium' },
  { id: 'FA-CR-24003', person: 'Avery Brooks', type: 'Credit Risk Review', priority: 'Medium' },
];

const tabCopy = {
  dashboard: {
    eyebrow: 'Command Dashboard',
    title: 'Investigation overview',
    text: 'A neutral command view for active training cases, saved packages, reviewed tools, and the next Evidence First action.',
  },
  cases: {
    eyebrow: 'Case Queue',
    title: 'Choose a training case',
    text: 'Open a case and continue the same investigation workspace without resetting the gothic neon shell.',
  },
  academy: {
    eyebrow: 'Fraud Academy',
    title: 'Learning path',
    text: 'Practice evidence-first investigation habits: open records, expand details, search, build link analysis, generate reports, document, then submit.',
  },
  progress: {
    eyebrow: 'Academy Progress',
    title: 'Saved package progress',
    text: 'Progress stays locked until a learner review package is saved. Luna scoring only appears after submission.',
  },
};

function readJson(key, fallback) {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function countValuesByCase(key) {
  const data = readJson(key, {});
  return Object.values(data).reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0);
}

function ensurePanel() {
  let panel = document.querySelector('.visual-nav-panel');
  if (panel) return panel;

  panel = document.createElement('section');
  panel.className = 'ornate-card visual-nav-panel';
  panel.setAttribute('aria-live', 'polite');

  const anchor = document.querySelector('.visual-categories');
  if (anchor?.parentNode) {
    anchor.parentNode.insertBefore(panel, anchor.nextSibling);
  } else {
    document.querySelector('.visual-os-frame')?.appendChild(panel);
  }

  return panel;
}

function selectCase(caseId) {
  const select = document.querySelector('.visual-case-switcher select');
  if (!select) return;
  select.value = caseId;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  setTab('workspace');
}

function dashboardMarkup() {
  const reviewed = countValuesByCase('fraud-academy-completed-tools-v1');
  const notes = countValuesByCase('fraud-academy-notes-v1');
  const packages = countValuesByCase('fraud-academy-review-packages-v1');
  const packets = countValuesByCase('fraud-academy-case-report-packets-v1');

  return `
    <div class="nav-stat-grid">
      <article><strong>${cases.length}</strong><span>Active cases</span></article>
      <article><strong>${reviewed}</strong><span>Reviewed tools</span></article>
      <article><strong>${notes}</strong><span>Notebook notes</span></article>
      <article><strong>${packages}</strong><span>Saved packages</span></article>
    </div>
    <div class="nav-action-row">
      <button data-tab-jump="cases">Open Case Queue</button>
      <button data-tab-jump="workspace">Return to Workspace</button>
      <button data-tab-jump="progress">View Progress</button>
    </div>
    <p class="nav-microcopy">${packets} structured Case Report packet(s) saved across the training workspace.</p>
  `;
}

function casesMarkup() {
  return `
    <div class="nav-case-grid">
      ${cases.map((item) => `
        <button class="nav-case-card" data-case-id="${item.id}">
          <span>${item.type}</span>
          <strong>${item.person}</strong>
          <small>${item.id} · ${item.priority} priority</small>
        </button>
      `).join('')}
    </div>
  `;
}

function academyMarkup() {
  const steps = ['Evidence First', 'Open records', 'Expand details', 'Search objects', 'Link analysis', 'Generate report', 'Case report', 'Submit package'];
  return `
    <div class="nav-learning-grid">
      ${steps.map((step, index) => `
        <article>
          <span>${String(index + 1).padStart(2, '0')}</span>
          <strong>${step}</strong>
          <p>${index === 0 ? 'No answer leaks before submission.' : 'Practice this step inside the live case workspace.'}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function progressMarkup() {
  const packagesByCase = readJson('fraud-academy-review-packages-v1', {});
  return `
    <div class="nav-progress-list">
      ${cases.map((item) => {
        const saved = packagesByCase[item.id] ?? [];
        const latest = saved[0];
        return `
          <article class="${latest ? 'unlocked' : 'locked'}">
            <div>
              <span>${item.type}</span>
              <strong>${item.person}</strong>
              <p>${latest ? `Saved ${latest.savedAt}` : 'Submit a review package to unlock Luna progress.'}</p>
            </div>
            <em>${latest ? 'Unlocked' : 'Locked'}</em>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderPanel(tab) {
  const panel = ensurePanel();
  if (tab === 'workspace') {
    panel.innerHTML = '';
    return;
  }

  const copy = tabCopy[tab] ?? tabCopy.dashboard;
  const body = tab === 'dashboard'
    ? dashboardMarkup()
    : tab === 'cases'
      ? casesMarkup()
      : tab === 'academy'
        ? academyMarkup()
        : progressMarkup();

  panel.innerHTML = `
    <div class="visual-nav-heading">
      <div>
        <p>${copy.eyebrow}</p>
        <h2>${copy.title}</h2>
        <span>${copy.text}</span>
      </div>
      <div aria-hidden="true">${tab === 'progress' ? '▢' : tab === 'academy' ? '▱' : tab === 'cases' ? '▣' : '⌂'}</div>
    </div>
    ${body}
  `;

  panel.querySelectorAll('[data-tab-jump]').forEach((button) => {
    button.addEventListener('click', () => setTab(button.getAttribute('data-tab-jump')));
  });

  panel.querySelectorAll('[data-case-id]').forEach((button) => {
    button.addEventListener('click', () => selectCase(button.getAttribute('data-case-id')));
  });
}

function normalizeTab(text) {
  const clean = String(text).toLowerCase();
  if (clean.includes('dashboard')) return 'dashboard';
  if (clean.includes('cases')) return 'cases';
  if (clean.includes('academy')) return 'academy';
  if (clean.includes('progress')) return 'progress';
  return 'workspace';
}

function setTab(tab) {
  document.body.dataset.visualTab = tab;
  document.querySelectorAll('.visual-bottom-nav button').forEach((button) => {
    button.classList.toggle('active', normalizeTab(button.textContent) === tab);
  });
  renderPanel(tab);
  document.querySelector('.visual-os-frame')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function wireNavigation() {
  const buttons = document.querySelectorAll('.visual-bottom-nav button');
  if (!buttons.length) return false;

  buttons.forEach((button) => {
    if (button.dataset.navWired === 'true') return;
    button.dataset.navWired = 'true';
    button.addEventListener('click', () => setTab(normalizeTab(button.textContent)));
  });

  if (!document.body.dataset.visualTab) setTab('workspace');
  return true;
}

const timer = window.setInterval(() => {
  if (wireNavigation()) window.clearInterval(timer);
}, 250);

window.addEventListener('storage', () => renderPanel(document.body.dataset.visualTab || 'workspace'));
window.addEventListener('focus', () => renderPanel(document.body.dataset.visualTab || 'workspace'));
