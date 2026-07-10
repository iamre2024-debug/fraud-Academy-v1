import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSystemAccessRecords } from './data/systemAccessRecords.js';

export default function SystemAccessLane({ activeCaseId }) {
  const [host, setHost] = useState(null);
  const records = useMemo(() => getSystemAccessRecords(activeCaseId), [activeCaseId]);

  useEffect(() => {
    const frame = document.querySelector('.visual-os-frame');
    const anchor = document.querySelector('.bottom-investigation-grid') ?? document.querySelector('.submit-decision-panel') ?? document.querySelector('.activity-panel');
    if (!frame || !anchor) return undefined;

    let laneHost = frame.querySelector('.system-access-lane-host');
    const created = !laneHost;
    if (!laneHost) {
      laneHost = document.createElement('div');
      laneHost.className = 'system-access-lane-host';
      anchor.insertAdjacentElement('beforebegin', laneHost);
    }

    setHost(laneHost);
    return () => {
      if (created) laneHost.remove();
    };
  }, []);

  const panel = (
    <section className="ornate-card system-access-lane" aria-label="Insider vendor API open banking lane">
      <div className="card-title-row">
        <div>
          <h2>⌘ Insider / Vendor / API / Open Banking Lane</h2>
          <p>Neutral system-access evidence. This lane shows whether internal users, vendors, APIs, or permissioned third-party connections touched the case objects.</p>
        </div>
        <span>⌘</span>
      </div>
      <div className="system-access-grid">
        {records.map((record) => (
          <article key={record.id}>
            <small>{record.lane}</small>
            <strong>{record.event}</strong>
            <p>{record.actor} · {record.object}</p>
            <em>{record.observed} · {record.status}</em>
            <p>{record.context}</p>
          </article>
        ))}
      </div>
      {!records.length && <p>No system-access records are attached to this training case yet.</p>}
    </section>
  );

  return host ? createPortal(panel, host) : null;
}
