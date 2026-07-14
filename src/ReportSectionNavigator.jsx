import { useEffect, useState } from 'react';

export default function ReportSectionNavigator({ sections, className, sectionAttribute, renderItems }) {
  const [selectedId, setSelectedId] = useState('');
  const selected = sections.find((section) => section.id === selectedId);

  useEffect(() => setSelectedId(''), [sections]);

  if (selected) {
    return (
      <section className={`focused-report-page ${className}-focused`} data-focused-report-section={selected.id}>
        <header>
          <button type="button" onClick={() => setSelectedId('')} aria-label="Back to report sections">←</button>
          <div><p>{selected.subtitle}</p><h4>{selected.title}</h4></div>
        </header>
        {renderItems(selected.items)}
      </section>
    );
  }

  return (
    <section className={`report-section-menu ${className}-menu`} aria-label="Report sections">
      {sections.map((section) => (
        <button type="button" key={section.id} onClick={() => setSelectedId(section.id)} {...{ [sectionAttribute]: section.id }}>
          <div><strong>{section.title}</strong><span>{section.subtitle}</span></div>
          <em>{section.items?.length ?? 0} records ›</em>
        </button>
      ))}
    </section>
  );
}
