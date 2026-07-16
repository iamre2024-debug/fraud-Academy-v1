import { useEffect, useMemo, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { buildCoreToolRecords } from './data/coreToolRecords.js';

function fieldPairs(columns, values) {
  return columns.map((column, index) => ({
    label: column,
    value: values[index] ?? 'Not recorded',
  }));
}

function searchableText(row) {
  return `${row.id} ${row.label} ${row.detail} ${row.values.join(' ')}`.toLowerCase();
}

function uniqueSources(rows) {
  return [...new Set(rows.map((row) => String(row.values[3] ?? 'Other')))].sort((a, b) => a.localeCompare(b));
}

export default function TimelinePanel({
  activeCase,
  query,
  setQuery,
  data,
  activeRow,
  setExpandedId,
  pin,
  saveNote,
  markReviewed,
  currentCompleted,
  openTool,
  jumpDecision,
}) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const timelineData = buildCoreToolRecords('Timeline', activeCase, data) ?? data;
  const sources = useMemo(() => uniqueSources(timelineData.rows), [timelineData.rows]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredEvents = useMemo(
    () => timelineData.rows.filter((row) => {
      const matchesQuery = !normalizedQuery || searchableText(row).includes(normalizedQuery);
      const matchesSource = sourceFilter === 'all' || String(row.values[3] ?? 'Other') === sourceFilter;
      return matchesQuery && matchesSource;
    }),
    [normalizedQuery, sourceFilter, timelineData.rows],
  );
  const selectedId = selectedEventId || activeRow?.id;
  const selectedEvent = filteredEvents.find((row) => row.id === selectedId) ?? filteredEvents[0];
  const selectedFields = useMemo(
    () => selectedEvent ? fieldPairs(timelineData.columns, selectedEvent.values) : [],
    [selectedEvent, timelineData.columns],
  );
  const reviewed = currentCompleted.includes('Timeline');
  const linkedObjects = new Set(timelineData.rows.map((row) => row.values[4]).filter(Boolean)).size;

  useEffect(() => {
    setSelectedEventId('');
    setSourceFilter('all');
  }, [activeCase.id]);

  function openEvent(rowId) {
    setSelectedEventId(rowId);
    setExpandedId(rowId);
  }

  function saveTimelineNote() {
    if (!selectedEvent) return;
    saveNote(`Timeline event ${selectedEvent.id}: ${selectedEvent.detail}`, 'Timeline event');
  }

  return (
    <section
      className="ornate-card activity-panel timeline-theme-v1"
      data-timeline-screen="approved-theme-v1"
      data-case-id={activeCase.id}
    >
      <header className="timeline-header">
        <div>
          <p className="timeline-eyebrow">Workflow Review · Evidence First</p>
          <h2>Case Timeline</h2>
          <p>Review recorded events in sequence, connect each entry to its source, and preserve only the facts needed for the case package.</p>
        </div>
        <div className="timeline-header-actions">
          <span>{activeCase.id}</span>
          <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
        </div>
      </header>

      <section className="timeline-question" aria-labelledby="timeline-question-heading">
        <div aria-hidden="true">⌁</div>
        <div>
          <p>Working question</p>
          <h3 id="timeline-question-heading">What happened, in what recorded order, and which source verifies each event?</h3>
          <span>The timeline organizes available records. It does not determine the case outcome.</span>
        </div>
      </section>

      <section className="timeline-metrics" aria-label="Timeline review summary">
        <article><span>Events available</span><strong>{timelineData.rows.length}</strong></article>
        <article><span>Sources represented</span><strong>{sources.length}</strong></article>
        <article><span>Linked objects</span><strong>{linkedObjects}</strong></article>
        <article><span>Review status</span><strong>{reviewed ? 'Reviewed' : 'Open'}</strong></article>
      </section>

      <section className="timeline-controls" aria-label="Timeline controls">
        <label>
          <span>Search timeline</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search event, time, source, linked object, or detail..."
            aria-label="Search Timeline records"
          />
        </label>
        <label>
          <span>Source</span>
          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            aria-label="Filter Timeline by source"
          >
            <option value="all">All sources</option>
            {sources.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
        </label>
        <span className="timeline-result-count" aria-live="polite">{filteredEvents.length} of {timelineData.rows.length} shown</span>
      </section>

      <div className="timeline-workspace">
        <section className="timeline-stream" aria-labelledby="timeline-stream-heading">
          <header className="timeline-section-heading">
            <div>
              <p>Recorded sequence</p>
              <h3 id="timeline-stream-heading">Available timeline events</h3>
            </div>
            <span>{filteredEvents.length} shown</span>
          </header>

          <div className="timeline-event-list">
            {filteredEvents.map((row, index) => {
              const selected = selectedEvent?.id === row.id;
              return (
                <article
                  key={row.id}
                  className={`timeline-event-card ${selected ? 'selected' : ''}`}
                  data-timeline-event={row.id}
                >
                  <div className="timeline-event-marker" aria-hidden="true"><span>{index + 1}</span></div>
                  <div className="timeline-event-content">
                    <header>
                      <div>
                        <span>{String(row.values[1] ?? 'Time not recorded')}</span>
                        <h4>{String(row.values[2] ?? row.label)}</h4>
                      </div>
                      <span>{String(row.values[3] ?? 'Source')}</span>
                    </header>
                    <dl>
                      <div><dt>Linked object</dt><dd>{String(row.values[4] ?? 'Not recorded')}</dd></div>
                      <div><dt>Event ID</dt><dd>{row.id}</dd></div>
                    </dl>
                    <DirectCollapsibleText lines={2} mobileLines={3}>{String(row.values[6] ?? row.detail)}</DirectCollapsibleText>
                    <div className="timeline-event-actions">
                      <button type="button" onClick={() => openEvent(row.id)}>{selected ? 'Event open' : 'Open event'}</button>
                      <button type="button" onClick={() => pin(row.pin)}>Pin event</button>
                    </div>
                  </div>
                </article>
              );
            })}
            {!filteredEvents.length && (
              <div className="timeline-empty" role="status">
                No timeline events match the current search and source filter. Clear or revise the controls to continue.
              </div>
            )}
          </div>
        </section>

        <aside className="timeline-detail" aria-label="Expanded timeline event">
          {selectedEvent ? (
            <>
              <header className="timeline-detail-heading">
                <div>
                  <p>Expanded event</p>
                  <h3>{selectedEvent.id}</h3>
                  <span>{selectedEvent.label}</span>
                </div>
                <button type="button" onClick={() => pin(selectedEvent.pin)}>Pin event</button>
              </header>

              <dl className="timeline-field-grid">
                {selectedFields.map((field) => (
                  <div key={`${selectedEvent.id}-${field.label}`}>
                    <dt>{field.label}</dt>
                    <dd><DirectCollapsibleText lines={3} mobileLines={4}>{String(field.value)}</DirectCollapsibleText></dd>
                  </div>
                ))}
              </dl>

              <section className="timeline-verification-card">
                <p>Sequence review</p>
                <h4>Verify this event against its source record</h4>
                <DirectCollapsibleText lines={3} mobileLines={4}>
                  Compare {selectedEvent.id} with {String(selectedEvent.values[3] ?? 'the recorded source')}, linked object {String(selectedEvent.values[4] ?? 'not recorded')}, and pinned evidence.
                </DirectCollapsibleText>
              </section>

              <div className="timeline-detail-actions">
                <button type="button" onClick={saveTimelineNote}>Save timeline note</button>
              </div>
            </>
          ) : (
            <div className="timeline-empty" role="status">Open an event to review its full details.</div>
          )}
        </aside>
      </div>

      <nav className="timeline-next-routes" aria-label="Timeline next routes">
        <button type="button" onClick={() => openTool('Transaction History')}>Open Transaction History</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="timeline-review-bar">
        <div>
          <strong>Timeline review</strong>
          <span>{reviewed ? 'Recorded sequence reviewed for this case.' : 'Review the event sequence and source links before marking this workflow step complete.'}</span>
        </div>
        <button type="button" onClick={() => markReviewed('Timeline')}>
          {reviewed ? '✓ Timeline reviewed' : 'Mark Timeline reviewed'}
        </button>
      </footer>
    </section>
  );
}
