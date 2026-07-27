import { useId } from 'react';

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
  const id = useId();
  const auraId = `${id}-aura`;
  const uniformId = `${id}-uniform`;
  const eyeId = `${id}-eye`;

  return (
    <span
      className={`mobile-luna-portrait ${className}`.trim()}
      style={{ '--luna-size': `${size}px` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 120" focusable="false">
        <defs>
          <radialGradient id={auraId} cx=".48" cy=".35" r=".7">
            <stop offset="0" stopColor="#baf8ff" stopOpacity=".65" />
            <stop offset=".55" stopColor="#278bff" stopOpacity=".28" />
            <stop offset="1" stopColor="#8e64ff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={uniformId} x1=".2" y1=".05" x2=".8" y2="1">
            <stop offset="0" stopColor="#1954a2" />
            <stop offset=".55" stopColor="#0a2a65" />
            <stop offset="1" stopColor="#061738" />
          </linearGradient>
          <radialGradient id={eyeId} cx=".35" cy=".3" r=".75">
            <stop offset="0" stopColor="#bdf9ff" />
            <stop offset=".32" stopColor="#35d5ff" />
            <stop offset=".68" stopColor="#1471de" />
            <stop offset="1" stopColor="#071a4d" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="58" r="57" fill={`url(#${auraId})`} />
        <circle cx="60" cy="57" r="52" fill="none" stroke="#44bfff" strokeOpacity=".24" />

        <path d="M89 91c15-1 19 10 8 17-6 3-13 .6-16-3.8" fill="none" stroke="#f6fbff" strokeWidth="8" strokeLinecap="round" />
        <path d="M31 53 24 20l28 19M89 53l7-33-28 19" fill="#fbfdff" stroke="#b9e9ff" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="m29 28 3 15 12-9M91 28l-3 15-12-9" fill="#f4a7d3" opacity=".84" />

        <path d="M27 55c0-23 14-38 33-38s33 15 33 38v8c0 22-14.2 35-33 35S27 85 27 63Z" fill="#fbfdff" stroke="#b9e9ff" strokeWidth="2.2" />
        <path d="M42 28c4-4 10-6 18-6s14 2 18 6" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 58c5-2 9-6 12-11M90 58c-5-2-9-6-12-11" fill="none" stroke="#d7f2ff" strokeWidth="2" opacity=".8" />

        <ellipse cx="45.5" cy="58" rx="10.5" ry="12.5" fill={`url(#${eyeId})`} stroke="#0a2e69" strokeWidth="1.2" />
        <ellipse cx="74.5" cy="58" rx="10.5" ry="12.5" fill={`url(#${eyeId})`} stroke="#0a2e69" strokeWidth="1.2" />
        <ellipse cx="46.5" cy="59.5" rx="4.3" ry="6.8" fill="#061530" />
        <ellipse cx="73.5" cy="59.5" rx="4.3" ry="6.8" fill="#061530" />
        <circle cx="42.5" cy="53.2" r="3.1" fill="#fff" />
        <circle cx="70.5" cy="53.2" r="3.1" fill="#fff" />
        <circle cx="49.6" cy="64.5" r="1.4" fill="#8ff5ff" />
        <circle cx="77.4" cy="64.5" r="1.4" fill="#8ff5ff" />

        <path d="M48 75c3.4-2 7.5-3 12-3s8.6 1 12 3" fill="none" stroke="#edf8ff" strokeWidth="3" strokeLinecap="round" />
        <path d="m56 72 4 3.7 4-3.7-4-2Z" fill="#eb88bd" />
        <path d="M60 76c-2.7 4-7 4.4-10.2 1.2M60 76c2.7 4 7 4.4 10.2 1.2" fill="none" stroke="#63728d" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M39 72H20M40 77H22M81 72h19M80 77h18" stroke="#c8e4ee" strokeWidth="1.6" strokeLinecap="round" />

        <path d="M22 119c2-22 15-34 38-34s36 12 38 34Z" fill={`url(#${uniformId})`} stroke="#4cd8ff" strokeWidth="2" />
        <path d="m43 90 17 13 17-13" fill="none" stroke="#85dfff" strokeWidth="2.2" />
        <path d="M34 94c-6.5 6-8 14-8 25M86 94c6.5 6 8 14 8 25" fill="none" stroke="#071b43" strokeWidth="5" />
        <path d="m60 96 3.3 6.7 7.4 1.1-5.3 5.2 1.2 7.3-6.6-3.4-6.6 3.4 1.2-7.3-5.3-5.2 7.4-1.1Z" fill="#f3a2dc" stroke="#f8d8f0" strokeWidth="1" />
        <path d="M46 93c-4 4-8 5-12 5M74 93c4 4 8 5 12 5" fill="none" stroke="#f9fdff" strokeWidth="7" strokeLinecap="round" />

        <path d="m99 13 2.2 5.6 5.7 2.2-5.7 2.2-2.2 5.7-2.2-5.7-5.7-2.2 5.7-2.2Z" fill="#ff92d5" />
        <path d="m15 31 1.5 3.8 3.8 1.5-3.8 1.5-1.5 3.8-1.5-3.8-3.8-1.5 3.8-1.5Z" fill="#76e9ff" />
      </svg>
    </span>
  );
}
