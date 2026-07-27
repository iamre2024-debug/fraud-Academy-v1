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

function runtimeTimelineRows(activeCase, actionLog = [], notes = [], documentRequests = {}, reviewPackages = []) {
  const rows = [];
  const makeRow = (id, time, event, source, linkedObject, detail, pin = linkedObject) => ({
    id,
    values: [id, time || 'Time not recorded', event, source, linkedObject || activeCase.id, activeCase.id, detail],
    pin: pin || id,
    label: event,
    detail,
  });

  if (activeCase.allegation) {
    rows.push(makeRow(
      `TML-${activeCase.id}-ALLEGATION`,
      activeCase.reportedDate ?? activeCase.opened,
      'Reported allegation',
      'Case Briefing',
      activeCase.id,
      activeCase.allegation,
      activeCase.id,
    ));
  }

  Object.values(documentRequests).flatMap((request) => request?.attempts ?? []).forEach((attempt) => {
    rows.push(makeRow(
      `TML-${attempt.requestId}`,
      attempt.requestedDate,
      'Document request sent',
      'Document Request',
      attempt.sourceDocumentId,
      `${attempt.documentTitle} requested through ${attempt.requestDeliveryChannel}.`,
      attempt.requestId,
    ));
    if (attempt.responseCheckedAt) {
      rows.push(makeRow(
        `TML-${attempt.responseId || attempt.attemptId}-RESPONSE`,
        attempt.receivedDate === 'Not received' ? attempt.responseCheckedAt : attempt.receivedDate,
        attempt.customerSubmission?.pages?.length ? 'Document received' : 'Document response checked',
        'Document Request',
        attempt.responseId || attempt.sourceDocumentId,
        `${attempt.documentTitle}: ${attempt.responseStatus || 'response checked'}.`,
        attempt.responseId || attempt.sourceDocumentId,
      ));
    }
  });

  actionLog.forEach((entry) => {
    rows.push(makeRow(
      `TML-${entry.id}`,
      entry.time,
      entry.action,
      entry.source || 'Investigation activity',
      activeCase.id,
      entry.detail,
      entry.id,
    ));
  });

  notes.forEach((note, index) => {
    const [time = 'Time not recorded', type = 'Investigator note', ...detailParts] = String(note).split(' · ');
    rows.push(makeRow(
      `TML-${activeCase.id}-NOTE-${index + 1}`,
      time,
      'Investigator note',
      type,
      activeCase.id,
      detailParts.join(' · ') || String(note),
      `NOTE-${activeCase.id}-${index + 1}`,
    ));
  });

  reviewPackages.forEach((reviewPackage, index) => {
    const decision = reviewPackage.operationalDecision || reviewPackage.choice || 'Decision recorded';
    const finding = reviewPackage.finalFinding ? ` Final finding: ${reviewPackage.finalFinding}.` : '';
    rows.push(makeRow(
      `TML-${reviewPackage.id || `${activeCase.id}-DECISION-${index + 1}`}`,
      reviewPackage.savedAt,
      'Decision submitted',
      'Submit Decision',
      reviewPackage.id || activeCase.id,
      `Operational decision: ${decision}.${finding}`,
      reviewPackage.id || activeCase.id,
    ));
  });

  return rows;
}

function timelineSortValue(value, fallbackDate) {
  let display = String(value ?? '').trim();
  if (/^\d{1,2}:\d{2}\s*[AP]M$/i.test(display)) display = `${fallbackDate} ${display}`;
  display = display.replace(/\s+[·-]\s+/, ' ');
  const parsed = new Date(display);
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
}

function mergeTimelineRows(baseRows, runtimeRows, fallbackDate) {
  const seen = new Set();
  return [...baseRows, ...runtimeRows]
    .filter((row) => {
      const key = `${row.values[1]}|${row.values[2]}|${row.values[3]}|${row.values[4]}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => timelineSortValue(left.values[1], fallbackDate) - timelineSortValue(right.values[1], fallbackDate));
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
  actionLog = [],
  notes = [],
  documentRequests = {},
  reviewPackages = [],
}) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const baseTimelineData = buildCoreToolRecords('Timeline', activeCase, data) ?? data;
  const runtimeRows = useMemo(
    () => runtimeTimelineRows(activeCase, actionLog, notes, documentRequests, reviewPackages),
    [activeCase, actionLog, documentRequests, notes, reviewPackages],
  );
  const timelineData = useMemo(() => ({
    ...baseTimelineData,
    rows: mergeTimelineRows(
      baseTimelineData.rows,
      runtimeRows,
      activeCase.reportedDate ?? activeCase.opened ?? 'Training date',
    ),
  }), [activeCase.opened, activeCase.reportedDate, baseTimelineData, runtimeRows]);
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
        <button
          type="button"
          onClick={() => openTool(
            activeCase.availableTools?.includes('Transaction History')
              ? 'Transaction History'
              : activeCase.availableTools?.includes('Payroll History')
                ? 'Payroll History'
                : 'Financial Investigation',
          )}
        >
          Open {activeCase.availableTools?.includes('Transaction History')
            ? 'Transaction History'
            : activeCase.availableTools?.includes('Payroll History')
              ? 'Payroll History'
              : 'Financial Investigation'}
        </button>
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
