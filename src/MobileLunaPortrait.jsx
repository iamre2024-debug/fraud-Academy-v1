export default function MobileLunaPortrait({ size = 54, className = '' }) {
  return (
    <span
      className={`mobile-luna-portrait ${className}`.trim()}
      style={{ '--luna-size': `${size}px` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" focusable="false">
        <defs>
          <linearGradient id="luna-uniform" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#153e80" />
            <stop offset="1" stopColor="#071a42" />
          </linearGradient>
          <linearGradient id="luna-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9af3ff" stopOpacity=".7" />
            <stop offset="1" stopColor="#a177ff" stopOpacity=".2" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r="45" fill="url(#luna-glow)" opacity=".48" />
        <path d="M23 39 19 17l21 13M73 39l4-22-21 13" fill="#f8fbff" stroke="#bfe9ff" strokeWidth="2" strokeLinejoin="round" />
        <path d="M25 23 22 32l10-5M71 23l3 9-10-5" fill="#f3a8d5" opacity=".75" />
        <path d="M25 42c0-15 10-25 23-25s23 10 23 25v12c0 14-10 24-23 24S25 68 25 54Z" fill="#f8fbff" stroke="#bfe9ff" strokeWidth="2" />
        <path d="M20 88c2-18 12-27 28-27s26 9 28 27Z" fill="url(#luna-uniform)" stroke="#4fdcff" strokeWidth="2" />
        <path d="M38 63 48 73l10-10" fill="none" stroke="#ec9ad7" strokeWidth="3" strokeLinecap="round" />
        <path d="M39 75h18v9H39z" fill="#07152d" stroke="#68e5ff" strokeWidth="1.5" rx="2" />
        <path d="M44 79h8" stroke="#ff9cdc" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="39" cy="44" rx="3.2" ry="4" fill="#102348" />
        <ellipse cx="57" cy="44" rx="3.2" ry="4" fill="#102348" />
        <circle cx="40" cy="42.7" r="1" fill="#8ff4ff" />
        <circle cx="58" cy="42.7" r="1" fill="#8ff4ff" />
        <path d="m45 52 3 2.5 3-2.5-3-1.5Z" fill="#ed92c7" />
        <path d="M48 55c-2 3-5 3-7 1M48 55c2 3 5 3 7 1" fill="none" stroke="#617092" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M34 54H20M35 58H22M62 54h14M61 58h13" stroke="#b7d9e9" strokeWidth="1.3" strokeLinecap="round" />
        <path d="m69 15 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#ff9bd7" />
      </svg>
    </span>
  );
}
