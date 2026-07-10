import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { addGeneratedCase, readGeneratedCases } from './data/generatedCases.js';

export default function GeneratedCaseControls() {
  const [host, setHost] = useState(null);
  const [count, setCount] = useState(() => readGeneratedCases().length);

  useEffect(() => {
    const frame = document.querySelector('.visual-os-frame');
    const anchor = document.querySelector('.case-info-bar');
    if (!frame || !anchor) return undefined;

    let generatorHost = frame.querySelector('.generated-case-control-host');
    const created = !generatorHost;
    if (!generatorHost) {
      generatorHost = document.createElement('div');
      generatorHost.className = 'generated-case-control-host';
      anchor.insertAdjacentElement('afterend', generatorHost);
    }

    setHost(generatorHost);
    return () => {
      if (created) generatorHost.remove();
    };
  }, []);

  function generateCase() {
    addGeneratedCase();
    setCount(readGeneratedCases().length);
    window.setTimeout(() => window.location.reload(), 150);
  }

  const panel = (
    <section className="generated-case-controls" aria-label="Generated case controls">
      <div>
        <strong>Generated Case Queue</strong>
        <span>{count} generated training case{count === 1 ? '' : 's'} saved locally</span>
      </div>
      <button type="button" onClick={generateCase}>✦ Generate Case</button>
    </section>
  );

  return host ? createPortal(panel, host) : null;
}
