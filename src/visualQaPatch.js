import './visualInvestigationRepair.css';
import './visualInvestigationRepair.js';

function navigate(tab) {
  window.dispatchEvent(new CustomEvent('fraud-academy:navigate', { detail: { tab } }));
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

function wireQaControls() {
  wireViewAllButton();
}

const qaTimer = window.setInterval(wireQaControls, 350);
window.setTimeout(() => window.clearInterval(qaTimer), 12000);

const observer = new MutationObserver(wireQaControls);
observer.observe(document.body, { childList: true, subtree: true });
