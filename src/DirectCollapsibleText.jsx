import { isValidElement, useMemo, useState } from 'react';

function textFromChildren(value) {
  if (Array.isArray(value)) return value.map(textFromChildren).join(' ');
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (isValidElement(value)) return textFromChildren(value.props.children);
  return '';
}

export default function DirectCollapsibleText({
  as: Tag = 'p',
  children,
  className = '',
  expanded: controlledExpanded,
  lines = 2,
  mobileLines = lines,
  minLength = 88,
  showButton = true,
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const cleanText = useMemo(() => textFromChildren(children).replace(/\s+/g, ' ').trim(), [children]);
  const shouldCollapse = cleanText.length >= minLength;
  const expanded = controlledExpanded ?? internalExpanded;
  const targetClassName = [
    className,
    shouldCollapse ? 'collapsible-text-target' : '',
    expanded ? 'text-expanded' : '',
  ].filter(Boolean).join(' ');
  const collapseStyle = shouldCollapse
    ? { '--collapse-lines': String(lines), '--collapse-lines-mobile': String(mobileLines) }
    : undefined;

  return (
    <>
      <Tag
        className={targetClassName || undefined}
        data-direct-collapse={shouldCollapse ? 'true' : undefined}
        style={collapseStyle}
      >
        {children}
      </Tag>
      {shouldCollapse && showButton && (
        <button
          type="button"
          className="text-more-button"
          aria-expanded={expanded}
          aria-label={expanded ? 'Show less text' : 'Show more text'}
          onClick={() => setInternalExpanded((current) => !current)}
        >
          {expanded ? 'Less' : 'More'}
        </button>
      )}
    </>
  );
}
