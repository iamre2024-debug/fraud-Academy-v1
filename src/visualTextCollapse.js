const COLLAPSE_SELECTOR = [
  '.summary-copy p:not(.visual-section-title)',
  '.tool-purpose-card p',
  '.visual-nav-heading span',
  '.nav-learning-grid article p',
  '.nav-progress-list p',
  '.record-review-lanes p',
  '.decision-checklist p',
  '.luna-list-card p',
  '.academy-case-row p',
  '.academy-case-row small',
  '.notebook-list p',
  '.tray-list em',
  '.case-report-packet-panel p',
  '.agent-archive-panel p'
].join(',');

const MIN_LENGTH = 88;

function shouldCollapse(element) {
  if (!element || element.dataset.collapseReady === 'true') return false;
  const text = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  if (text.length < MIN_LENGTH) return false;
  if (element.closest('.table-head')) return false;
  return true;
}

function setLines(element) {
  if (element.matches('.summary-copy p')) {
    element.style.setProperty('--collapse-lines', '3');
    element.style.setProperty('--collapse-lines-mobile', '3');
    return;
  }

  if (element.matches('.record-review-lanes p, .decision-checklist p, .luna-list-card p')) {
    element.style.setProperty('--collapse-lines', '2');
    element.style.setProperty('--collapse-lines-mobile', '2');
    return;
  }

  element.style.setProperty('--collapse-lines', '2');
  element.style.setProperty('--collapse-lines-mobile', '2');
}

function wrapText(element) {
  element.dataset.collapseReady = 'true';
  element.classList.add('collapsible-text-target');
  setLines(element);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'text-more-button';
  button.textContent = 'More';
  button.setAttribute('aria-expanded', 'false');

  button.addEventListener('click', () => {
    const expanded = element.classList.toggle('text-expanded');
    button.textContent = expanded ? 'Less' : 'More';
    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  });

  element.insertAdjacentElement('afterend', button);
}

function applyTextCollapse() {
  document.querySelectorAll(COLLAPSE_SELECTOR).forEach((element) => {
    if (shouldCollapse(element)) wrapText(element);
  });
}

const collapseObserver = new MutationObserver(applyTextCollapse);
collapseObserver.observe(document.body, { childList: true, subtree: true });

window.setTimeout(applyTextCollapse, 250);
window.setTimeout(applyTextCollapse, 1000);
window.addEventListener('focus', applyTextCollapse);
