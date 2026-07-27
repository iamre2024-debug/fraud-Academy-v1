import { useId } from 'react';

function safeId(value) {
  return String(value).replace(/[^a-z0-9_-]/gi, '');
}

export function LunaMascot({ className = '', title = 'Luna, your Fraud Academy guide' }) {
  const id = safeId(useId());
  const fur = `luna-fur-${id}`;
  const hoodie = `luna-hoodie-${id}`;
  const glow = `luna-glow-${id}`;
  const eye = `luna-eye-${id}`;

  return (
    <svg
      className={className}
      viewBox="0 0 280 244"
      role="img"
      aria-label={title}
      focusable="false"
    >
      <defs>
        <linearGradient id={fur} x1="0" y1="0" x2="0.78" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.55" stopColor="#edf7ff" />
          <stop offset="1" stopColor="#c6ddf1" />
        </linearGradient>
        <linearGradient id={hoodie} x1="0.18" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#153f78" />
          <stop offset="0.5" stopColor="#082a56" />
          <stop offset="1" stopColor="#03152f" />
        </linearGradient>
        <radialGradient id={eye} cx="45%" cy="32%" r="72%">
          <stop offset="0" stopColor="#aaf7ff" />
          <stop offset="0.35" stopColor="#38bfff" />
          <stop offset="0.7" stopColor="#1064c8" />
          <stop offset="1" stopColor="#020a19" />
        </radialGradient>
        <filter id={glow} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="4.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="luna-mascot-stars" aria-hidden="true">
        <path d="M27 60h7M30.5 56.5v7" stroke="#ff70d8" strokeWidth="2.4" strokeLinecap="round" filter={`url(#${glow})`} />
        <path d="M242 40h10M247 35v10" stroke="#79eaff" strokeWidth="2.4" strokeLinecap="round" filter={`url(#${glow})`} />
        <path d="M254 121h7M257.5 117.5v7" stroke="#ff70d8" strokeWidth="2" strokeLinecap="round" filter={`url(#${glow})`} />
        <circle cx="47" cy="117" r="2.6" fill="#77e9ff" filter={`url(#${glow})`} />
        <circle cx="227" cy="86" r="2.4" fill="#ff7adc" filter={`url(#${glow})`} />
      </g>

      <path
        d="M69 169c-35 2-45 35-27 52 10 9 27 5 31-8 4-12-5-20-15-17"
        fill="none"
        stroke={`url(#${fur})`}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path d="M93 151c8-24 30-38 56-38s49 14 57 38l8 57c1 12-8 22-20 22H104c-12 0-21-10-20-22z" fill={`url(#${hoodie})`} stroke="#2b78c7" strokeWidth="3" />
      <path d="M96 151c14 11 31 17 53 17s40-6 54-17" fill="none" stroke="#3c8bd2" strokeWidth="3" opacity="0.72" />
      <path d="M112 126c7 13 18 20 37 20s31-7 38-20" fill="none" stroke="#79dfff" strokeWidth="3" opacity="0.65" />
      <path d="M110 141l-8 55M190 141l8 55" stroke="#011127" strokeWidth="3.5" opacity="0.7" />
      <path d="M133 196h32v34h-32z" fill="#041a39" opacity="0.82" />
      <path d="M148 178l5.8 11.2 12.4 1.8-9 8.8 2.1 12.3-11.3-5.8-11.1 5.8 2.1-12.3-9-8.8 12.4-1.8z" fill="#ff83da" stroke="#b9f5ff" strokeWidth="2.3" filter={`url(#${glow})`} />

      <path d="M103 205c-9 0-16 7-16 16s9 13 23 11l13-2-2-23z" fill={`url(#${fur})`} stroke="#a9c9e1" strokeWidth="2" />
      <path d="M176 207l-2 23 13 2c14 2 23-2 23-11s-7-16-16-16z" fill={`url(#${fur})`} stroke="#a9c9e1" strokeWidth="2" />

      <path d="M96 154c-14 8-21 21-19 36 1 11 10 18 19 14 8-3 11-12 8-20l-3-9" fill={`url(#${hoodie})`} stroke="#2b78c7" strokeWidth="3" strokeLinecap="round" />
      <path d="M204 154c8 2 17-1 22-9 5-9 3-19-2-27-4-7-1-16 6-18 9-3 17 6 17 15 0 10 5 16 12 19" fill="none" stroke={`url(#${fur})`} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="259" cy="135" rx="15" ry="12" fill={`url(#${fur})`} stroke="#a9c9e1" strokeWidth="2" transform="rotate(18 259 135)" />
      <circle cx="252" cy="128" r="2.5" fill="#ffb2d4" />
      <circle cx="260" cy="126" r="2.5" fill="#ffb2d4" />
      <circle cx="267" cy="130" r="2.5" fill="#ffb2d4" />

      <path d="M81 55L70 13l42 21c11-8 24-12 38-12 15 0 29 4 40 12l42-21-11 44c7 12 10 25 8 39-4 36-36 61-79 61s-75-25-79-61c-2-15 1-29 10-41z" fill={`url(#${fur})`} stroke="#a9c9e1" strokeWidth="3" />
      <path d="M80 27l25 14-17 14zM220 27l-25 14 17 14z" fill="#ffb9d8" opacity="0.9" />
      <path d="M91 45c-8 14-11 27-9 42" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.7" />

      <ellipse cx="116" cy="87" rx="24" ry="29" fill="#f7fbff" stroke="#9cc9e8" strokeWidth="2.2" />
      <ellipse cx="184" cy="87" rx="24" ry="29" fill="#f7fbff" stroke="#9cc9e8" strokeWidth="2.2" />
      <ellipse cx="117" cy="90" rx="15" ry="21" fill={`url(#${eye})`} />
      <ellipse cx="183" cy="90" rx="15" ry="21" fill={`url(#${eye})`} />
      <ellipse cx="113" cy="82" rx="5" ry="7" fill="#fff" />
      <ellipse cx="179" cy="82" rx="5" ry="7" fill="#fff" />
      <circle cx="122" cy="100" r="2.6" fill="#bff8ff" />
      <circle cx="188" cy="100" r="2.6" fill="#bff8ff" />
      <path d="M100 66c9-8 21-10 31-4M169 62c11-6 23-4 31 4" fill="none" stroke="#506d87" strokeWidth="3.2" strokeLinecap="round" />
      <ellipse cx="150" cy="117" rx="11" ry="7.5" fill="#ff9dc4" stroke="#a95c86" strokeWidth="1.5" />
      <path d="M150 124c-2 9-14 10-19 3M150 124c2 9 14 10 19 3" fill="none" stroke="#7b4a68" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M93 115l-35-6M95 122l-39 3M207 115l35-6M205 122l39 3" stroke="#8ba9be" strokeWidth="2" strokeLinecap="round" />
      <circle cx="101" cy="118" r="7" fill="#ffb5d3" opacity="0.5" />
      <circle cx="199" cy="118" r="7" fill="#ffb5d3" opacity="0.5" />
    </svg>
  );
}

export function LighthouseMedallion({ className = '' }) {
  const id = safeId(useId());
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`sea-${id}`} cx="50%" cy="35%" r="72%">
          <stop offset="0" stopColor="#326db2" />
          <stop offset="0.52" stopColor="#0a274f" />
          <stop offset="1" stopColor="#020b1d" />
        </radialGradient>
        <linearGradient id={`beam-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c7fbff" stopOpacity="0" />
          <stop offset="0.55" stopColor="#c7fbff" stopOpacity="0.92" />
          <stop offset="1" stopColor="#c7fbff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill={`url(#sea-${id})`} stroke="#58dcff" strokeOpacity="0.55" strokeWidth="2" />
      <g fill="#b9f7ff"><circle cx="25" cy="25" r="1.4" /><circle cx="87" cy="20" r="1.2" /><circle cx="98" cy="43" r="1.1" /></g>
      <path d="M0 92c20-14 39-7 58-17 21-11 39-6 62-18v63H0z" fill="#020a17" />
      <path d="M63 96l6-47h14l8 47z" fill="#d9edf3" />
      <rect x="68" y="40" width="18" height="11" rx="2" fill="#d7f8ff" stroke="#4dd9ff" strokeWidth="2" />
      <path d="M67 40l10-10 11 10z" fill="#082746" stroke="#4dd9ff" strokeWidth="2" />
      <path d="M80 45l40-18v15L80 50z" fill={`url(#beam-${id})`} />
      <path d="M2 103c25-8 38 6 60-2 21-8 39 3 56-4" fill="none" stroke="#2d9dcc" strokeWidth="2" opacity="0.7" />
    </svg>
  );
}

export function ReviewGlyph({ type, className = '' }) {
  const common = {
    className,
    viewBox: '0 0 48 48',
    'aria-hidden': true,
    focusable: 'false',
  };

  if (type === 'pin') {
    return (
      <svg {...common}>
        <path d="M17 7h14l-2 11 7 7v4H27l-1 13-4-13h-10v-4l7-7z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'note') {
    return (
      <svg {...common}>
        <path d="M12 7h18l7 7v27H12z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M30 7v8h7M18 23h13M18 30h13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'check') {
    return (
      <svg {...common}>
        <path d="M24 4l16 7v11c0 10-6 18-16 22C14 40 8 32 8 22V11z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M16 24l6 6 11-13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'scale') {
    return (
      <svg {...common}>
        <path d="M24 7v34M14 41h20M9 15h30M24 10l-15 5M24 10l15 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M9 15L4 28h10zM39 15l-5 13h10z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'medal') {
    return (
      <svg {...common}>
        <path d="M14 5l8 15M34 5l-8 15" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.72" />
        <path d="M24 17l6 3 7-1-1 7 3 6-7 2-4 6-4-5-7 2-2-7-5-5 5-5 2-7z" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
        <path d="M24 23l2.1 4.2 4.6.7-3.3 3.2.8 4.6-4.2-2.2-4.2 2.2.8-4.6-3.3-3.2 4.6-.7z" fill="currentColor" />
      </svg>
    );
  }
  if (type === 'alert') {
    return (
      <svg {...common}>
        <path d="M24 6l20 35H4z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M24 18v11M24 35h.01" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'shield') {
    return (
      <svg {...common}>
        <path d="M24 5l16 7v10c0 10-6 18-16 22C14 40 8 32 8 22V12z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M24 14v21M14 24h20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      </svg>
    );
  }
  if (type === 'heart') {
    return (
      <svg {...common}>
        <path d="M24 41S6 31 6 17c0-7 9-12 18-3 9-9 18-4 18 3 0 14-18 24-18 24z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M24 15v18M15 24h18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
