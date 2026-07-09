import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  '.agent-archive-panel p',
].join(',');

const MIN_LENGTH = 88;

function getCleanText(element) {
  return element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function shouldCollapse(element) {
  if (!element || element.closest('.table-head')) return false;
  return getCleanText(element).length >= MIN_LENGTH;
}

function getLineCount(element) {
  return element.matches('.summary-copy p') ? 3 : 2;
}

function prepareTarget(record) {
  const { element, host, lines } = record;
  element.dataset.collapseReady = 'react';
  element.classList.add('collapsible-text-target');
  element.style.setProperty('--collapse-lines', String(lines));
  element.style.setProperty('--collapse-lines-mobile', String(lines));

  if (element.nextElementSibling !== host) {
    element.insertAdjacentElement('afterend', host);
  }
}

function releaseTarget(record) {
  const { element, host } = record;
  element.classList.remove('collapsible-text-target', 'text-expanded');
  element.style.removeProperty('--collapse-lines');
  element.style.removeProperty('--collapse-lines-mobile');
  delete element.dataset.collapseReady;
  host.remove();
}

function sameTargets(current, next) {
  return current.length === next.length && current.every((item, index) => (
    item.id === next[index].id
    && item.element === next[index].element
    && item.host === next[index].host
    && item.lines === next[index].lines
  ));
}

function CollapsibleTextControl({ target, expanded, onToggle }) {
  if (!target.element.isConnected || !target.host.isConnected) return null;

  return createPortal(
    <button
      type="button"
      className="text-more-button"
      aria-expanded={expanded}
      aria-label={expanded ? 'Show less text' : 'Show more text'}
      onClick={() => onToggle(target.id)}
    >
      {expanded ? 'Less' : 'More'}
    </button>,
    target.host,
  );
}

export default function VisualTextCollapse() {
  const targetIds = useRef(new WeakMap());
  const nextTargetId = useRef(1);
  const [targets, setTargets] = useState([]);
  const [expandedById, setExpandedById] = useState({});

  useEffect(() => {
    const managedTargets = new Map();
    let scanFrame = 0;

    function getTargetId(element) {
      if (!targetIds.current.has(element)) {
        targetIds.current.set(element, `visual-collapse-${nextTargetId.current}`);
        nextTargetId.current += 1;
      }
      return targetIds.current.get(element);
    }

    function scanTargets() {
      scanFrame = 0;
      const eligibleElements = [...document.querySelectorAll(COLLAPSE_SELECTOR)].filter(shouldCollapse);
      const eligibleSet = new Set(eligibleElements);

      for (const [element, record] of managedTargets.entries()) {
        if (!element.isConnected || !eligibleSet.has(element)) {
          releaseTarget(record);
          managedTargets.delete(element);
        }
      }

      const nextTargets = eligibleElements.map((element) => {
        let record = managedTargets.get(element);
        const lines = getLineCount(element);

        if (!record) {
          const host = document.createElement('span');
          host.className = 'text-more-react-host';
          host.dataset.collapseHost = 'react';
          record = { id: getTargetId(element), element, host, lines };
          managedTargets.set(element, record);
        } else if (record.lines !== lines) {
          record = { ...record, lines };
          managedTargets.set(element, record);
        }

        prepareTarget(record);
        return record;
      });

      setTargets((current) => (sameTargets(current, nextTargets) ? current : nextTargets));
    }

    function queueScan() {
      if (scanFrame) return;
      scanFrame = window.requestAnimationFrame(scanTargets);
    }

    const observer = new MutationObserver(queueScan);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener('focus', queueScan);
    queueScan();

    return () => {
      observer.disconnect();
      window.removeEventListener('focus', queueScan);
      if (scanFrame) window.cancelAnimationFrame(scanFrame);
      managedTargets.forEach(releaseTarget);
    };
  }, []);

  useEffect(() => {
    targets.forEach((target) => {
      target.element.classList.toggle('text-expanded', Boolean(expandedById[target.id]));
    });
  }, [expandedById, targets]);

  function toggleTarget(targetId) {
    setExpandedById((current) => ({ ...current, [targetId]: !current[targetId] }));
  }

  return (
    <>
      <span hidden data-react-text-collapse="true" />
      {targets.map((target) => (
        <CollapsibleTextControl
          key={target.id}
          target={target}
          expanded={Boolean(expandedById[target.id])}
          onToggle={toggleTarget}
        />
      ))}
    </>
  );
}
