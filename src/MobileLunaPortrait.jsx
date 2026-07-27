import { useId } from 'react';
import lunaMobilePortrait from './assets/luna-mobile.webp';

export function MobileFraudShield({ size = 38, className = '' }) {
  const gradientId = useId();

  return (
    <span
      className={`mobile-fraud-shield ${className}`.trim()}
      style={{ '--shield-size': `${size}px` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 56" focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#74efff" />
            <stop offset=".48" stopColor="#168cff" />
            <stop offset="1" stopColor="#625cff" />
          </linearGradient>
        </defs>
        <path
          d="M24 2.8c6.7 4.1 13.6 5.7 20.2 6.7v14.8c0 13.8-7.8 23.1-20.2 28.9C11.6 47.4 3.8 38.1 3.8 24.3V9.5C10.4 8.5 17.3 6.9 24 2.8Z"
          fill="#071a3b"
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
        />
        <path d="m24 14 2.8 8.1 8.2 2.8-8.2 2.9L24 36l-2.8-8.2-8.2-2.9 8.2-2.8Z" fill="#ff9edc" />
        <circle cx="24" cy="25" r="5.2" fill="#fff" opacity=".2" />
      </svg>
    </span>
  );
}

export default function MobileLunaPortrait({ size = 54, className = '' }) {
  return (
    <span
      className={`mobile-luna-portrait ${className}`.trim()}
      style={{ '--luna-size': `${size}px` }}
      aria-hidden="true"
    >
      <img
        src={lunaMobilePortrait}
        alt=""
        decoding="async"
        draggable="false"
      />
    </span>
  );
}
