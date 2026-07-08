import { useMemo, useState } from 'react';
import { buildScenarioPreviewRows, scenarioInputFields, scenarioSafetyRules, scenarioTemplates } from './data/scenarioEngine.js';

export default function ScenarioEnginePanel() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(scenarioTemplates[0].id);
  const previewRows = useMemo(() => buildScenarioPreviewRows(), []);
  const selectedTemplate = scenarioTemplates.find((item) => item.id === selectedTemplateId) ?? scenarioTemplates[0];
  const selectedPreview = previewRows.find((item) => item.templateId === selectedTemplate.id) ?? previewRows[0];

  return (
    <aside className="scenario-engine-shell" aria-label="Scenario Engine foundation">
      <div className="scenario-engine-card">
        <div className="scenario-engine-header">
          <div>
            <p className="eyebrow">Scenario Engine</p>
            <h3>Template forge</h3>
            <p>Fictional case seeds stay neutral. No score, answer, or Luna decision coaching appears before submission.</p>
          </div>
          <span aria-hidden="true">🎲</span>
        </div>

        <div className="scenario-template-tabs" aria-label="Scenario templates">
          {scenarioTemplates.map((template) => (
            <button key={template.id} className={template.id === selectedTemplate.id ? 'selected' : ''} onClick={() => setSelectedTemplateId(template.id)}>
              {template.claimType}
            </button>
          ))}
        </div>

        <article className="scenario-template-card">
          <span className="case-pill soft">{selectedTemplate.claimType}</span>
          <h4>{selectedTemplate.title}</h4>
          <p>{selectedTemplate.caseReason}</p>
          <small>{selectedTemplate.investigatorQuestion}</small>
        </article>

        <div className="scenario-mini-grid">
          <ScenarioStat label="Required tools" value={String(selectedTemplate.requiredFamilies.length)} />
          <ScenarioStat label="Packet objects" value={String(selectedTemplate.evidencePacket.length)} />
          <ScenarioStat label="Locked" value="Until submit" />
        </div>

        <div className="scenario-section">
          <h4>Generated packet preview</h4>
          <div className="scenario-packet-list">
            {selectedPreview.evidencePacket.slice(0, 5).map((packet) => (
              <article key={packet.id}>
                <strong>{packet.packet}</strong>
                <span>{packet.status}</span>
                <small>{packet.purpose}</small>
              </article>
            ))}
          </div>
        </div>

        <details className="scenario-section compact">
          <summary>Generator inputs</summary>
          <ul>
            {scenarioInputFields.map((field) => <li key={field.id}><strong>{field.label}</strong><span>{field.helper}</span></li>)}
          </ul>
        </details>

        <details className="scenario-section compact">
          <summary>Evidence First safety rules</summary>
          <ul>{scenarioSafetyRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
        </details>
      </div>
    </aside>
  );
}

function ScenarioStat({ label, value }) {
  return <div className="scenario-stat"><small>{label}</small><strong>{value}</strong></div>;
}
