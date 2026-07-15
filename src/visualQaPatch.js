import './visualInvestigationRepair.css';
import './visualInvestigationRepair.js';

function navigate(tab) {
  window.dispatchEvent(new CustomEvent('fraud-academy:navigate', { detail: { tab } }));
}

function clickCategory(label) {
  const button = [...document.querySelectorAll('.visual-category-row button')]
    .find((item) => item.textContent.toLowerCase().includes(label.toLowerCase()));
  button?.click();
}

function wireViewAllButton() {
  const button = [...document.querySelectorAll('.visual-section-heading button')]
    .find((item) => item.textContent.trim().toLowerCase().includes('view all') || item.textContent.trim().toLowerCase().includes('tool map'));

  if (!button || button.dataset.qaWired === 'true') return;
  button.dataset.qaWired = 'true';
  button.textContent = 'Tool Map ›';
  button.setAttribute('aria-label', 'Open Academy tool map');
  button.addEventListener('click', () => navigate('academy'));
}

function wireTrayEvidenceButton() {
  const button = [...document.querySelectorAll('.tray-card .add-evidence')]
    .find((item) => item.textContent.toLowerCase().includes('evidence'));

  if (!button || button.dataset.qaWired === 'true') return;
  button.dataset.qaWired = 'true';
  button.textContent = '✦ Open Document Viewer ›';
  button.setAttribute('aria-label', 'Open Document Viewer category');
  button.addEventListener('click', () => {
    navigate('workspace');
    window.setTimeout(() => {
      clickCategory('Evidence');
      document.querySelector('.activity-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  });
}

function wireQaControls() {
  wireViewAllButton();
  wireTrayEvidenceButton();
}

const qaTimer = window.setInterval(wireQaControls, 350);
window.setTimeout(() => window.clearInterval(qaTimer), 12000);

const observer = new MutationObserver(wireQaControls);
observer.observe(document.body, { childList: true, subtree: true });
