import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { generateAndSaveCase, listGeneratedCases } from './data/generatedCaseRepository.js';

export default function GeneratedCaseControls({ onCaseGenerated }) {
  const [host, setHost] = useState(null);
  const [count, setCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

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
    listGeneratedCases().then((cases) => setCount(cases.length)).catch(() => setCount(0));

    return () => {
      if (created) generatorHost.remove();
    };
  }, []);

  async function generateCase() {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const nextCase = await generateAndSaveCase();
      const savedCases = await listGeneratedCases();
      setCount(savedCases.length);
      onCaseGenerated?.(nextCase);
    } finally {
      setIsGenerating(false);
    }
  }

  const panel = (
    <section className="generated-case-controls" aria-label="Generated case controls">
      <div>
        <strong>Generated Case Queue</strong>
        <span>{count} generated training case{count === 1 ? '' : 's'} saved locally</span>
      </div>
      <button type="button" onClick={generateCase} disabled={isGenerating}>
        {isGenerating ? '✦ Generating Case…' : '✦ Generate + Open Case'}
      </button>
    </section>
  );

  return host ? createPortal(panel, host) : null;
}
