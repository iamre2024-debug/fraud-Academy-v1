import { useMemo, useState } from 'react';
import { resolvePinnedEvidence } from './pinnedEvidenceNavigation.js';
import { rowsFor } from './visualWorkspaceModel.js';

function buildPinnedRecord(value, activeCase, toolNames) {
  const resolved = resolvePinnedEvidence(value, activeCase, toolNames);
  if (!resolved?.row) {
    return {
      value,
      source: resolved?.tool || 'Saved case evidence',
      fields: [],
    };
  }

  const columns = rowsFor(resolved.tool, activeCase).columns;
  const fields = resolved.row.values
    .map((fieldValue, index) => ({ label: columns[index] ?? `Field ${index + 1}`, value: String(fieldValue ?? 'Not recorded') }))
    .filter((field) => !/^action$/i.test(field.label) && !/^pin$/i.test(field.value))
    .slice(0, 6);

  return {
    value,
    source: resolved.tool,
    fields,
  };
}

function rationaleLine(record) {
  const usefulFields = record.fields
    .filter((field) => field.value && !record.value.includes(field.value))
    .slice(0, 3)
    .map((field) => `${field.label}: ${field.value}`)
    .join(' · ');
  return `Pinned proof: ${record.value}${usefulFields ? ` — ${usefulFields}` : ''}`;
}

export default function DecisionEvidenceNotepad({
  tray,
  notes,
  activeCase,
  toolNames,
  decisionDraft,
  updateDecision,
  removePin,
  saveNote,
}) {
  const [activeTab, setActiveTab] = useState('proof');
  const [noteDraft, setNoteDraft] = useState('');
  const records = useMemo(
    () => tray.map((value) => buildPinnedRecord(value, activeCase, toolNames)),
    [activeCase, toolNames, tray],
  );

  function addToRationale(record) {
    const line = rationaleLine(record);
    const currentReason = decisionDraft.reason.trim();
    if (currentReason.includes(record.value)) return;
    updateDecision('reason', currentReason ? `${currentReason}\n${line}` : line);
  }

  function submitDecisionNote(event) {
    event.preventDefault();
    const cleanNote = noteDraft.trim();
    if (!cleanNote) return;
    saveNote(cleanNote, 'Decision note');
    setNoteDraft('');
  }

  return (
    <section className="decision-evidence-notepad" aria-labelledby="decision-evidence-notepad-heading">
      <header>
        <div>
          <p>Saved case support</p>
          <h3 id="decision-evidence-notepad-heading">Evidence Notepad</h3>
          <span>Everything you pin stays with this case and is available here while you make the decision.</span>
        </div>
        <strong>{tray.length} pinned</strong>
      </header>

      <nav className="decision-evidence-tabs" role="tablist" aria-label="Decision evidence notepad tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'proof'}
          aria-controls="decision-pinned-proof-panel"
          id="decision-pinned-proof-tab"
          className={activeTab === 'proof' ? 'active' : ''}
          onClick={() => setActiveTab('proof')}
        >
          Pinned Proof <span>{tray.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'notes'}
          aria-controls="decision-case-notes-panel"
          id="decision-case-notes-tab"
          className={activeTab === 'notes' ? 'active' : ''}
          onClick={() => setActiveTab('notes')}
        >
          Case Notes <span>{notes.length}</span>
        </button>
      </nav>

      <div
        id="decision-pinned-proof-panel"
        role="tabpanel"
        aria-labelledby="decision-pinned-proof-tab"
        hidden={activeTab !== 'proof'}
        className="decision-pinned-proof-list"
      >
        {records.map((record) => (
          <article key={record.value} className="decision-pinned-proof-card">
            <header>
              <div><small>{record.source}</small><strong>{record.value}</strong></div>
              <button type="button" onClick={() => removePin(record.value)} aria-label={`Remove ${record.value} from decision evidence notepad`}>Remove</button>
            </header>
            {record.fields.length > 0 ? (
              <dl>
                {record.fields.map((field) => (
                  <div key={`${record.value}-${field.label}`}><dt>{field.label}</dt><dd>{field.value}</dd></div>
                ))}
              </dl>
            ) : (
              <p>This reference is saved with the case. No additional source fields are available in the current packet.</p>
            )}
            <button
              type="button"
              className="decision-add-proof-button"
              onClick={() => addToRationale(record)}
              disabled={decisionDraft.reason.includes(record.value)}
            >
              {decisionDraft.reason.includes(record.value) ? 'Added to rationale' : 'Add to rationale'}
            </button>
          </article>
        ))}
        {!records.length && (
          <div className="decision-evidence-empty" role="status">
            <strong>No proof pinned yet</strong>
            <p>Use Pin on a useful record or document. It will appear here automatically for this case.</p>
          </div>
        )}
      </div>

      <div
        id="decision-case-notes-panel"
        role="tabpanel"
        aria-labelledby="decision-case-notes-tab"
        hidden={activeTab !== 'notes'}
        className="decision-case-note-list"
      >
        <form className="decision-note-compose" onSubmit={submitDecisionNote}>
          <label htmlFor={`decision-note-${activeCase.id}`}>Add a case note</label>
          <textarea
            id={`decision-note-${activeCase.id}`}
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="Write a note about the proof, missing information, or your reasoning..."
          />
          <button type="submit" disabled={!noteDraft.trim()}>Save Note</button>
        </form>
        {notes.map((note, index) => <article key={`${note}-${index}`}>{note}</article>)}
        {!notes.length && (
          <div className="decision-evidence-empty" role="status">
            <strong>No case notes saved yet</strong>
            <p>Notes saved during the investigation will appear here beside the pinned proof.</p>
          </div>
        )}
      </div>
    </section>
  );
}
