import { useEffect, useMemo, useState } from 'react';

export const layoutModeStorageKey = 'fraud-academy-layout-mode-v1';
export const mobileLayoutQuery = '(max-width: 720px)';

const validPreferences = new Set(['auto', 'mobile', 'desktop']);

function readPreference() {
  if (typeof window === 'undefined') return 'auto';
  try {
    const saved = window.localStorage.getItem(layoutModeStorageKey);
    return validPreferences.has(saved) ? saved : 'auto';
  } catch {
    return 'auto';
  }
}

function detectLayout() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'desktop';
  return window.matchMedia(mobileLayoutQuery).matches ? 'mobile' : 'desktop';
}

export default function useResponsiveLayoutMode() {
  const [preference, setPreference] = useState(readPreference);
  const [detectedLayout, setDetectedLayout] = useState(detectLayout);
  const resolvedLayout = useMemo(
    () => (preference === 'auto' ? detectedLayout : preference),
    [detectedLayout, preference],
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia(mobileLayoutQuery);
    const syncDetectedLayout = (event) => setDetectedLayout(event.matches ? 'mobile' : 'desktop');
    syncDetectedLayout(query);
    if (query.addEventListener) query.addEventListener('change', syncDetectedLayout);
    else query.addListener?.(syncDetectedLayout);
    return () => {
      if (query.removeEventListener) query.removeEventListener('change', syncDetectedLayout);
      else query.removeListener?.(syncDetectedLayout);
    };
  }, []);

  useEffect(() => {
    document.body.dataset.layoutPreference = preference;
    document.body.dataset.layoutDetected = detectedLayout;
    document.body.dataset.layoutMode = resolvedLayout;
    document.documentElement.dataset.layoutMode = resolvedLayout;

    try {
      window.localStorage.setItem(layoutModeStorageKey, preference);
    } catch {
      // The current session still follows the selected mode when storage is unavailable.
    }

    window.dispatchEvent(new CustomEvent('fraud-academy:layout-mode-changed', {
      detail: { preference, detectedLayout, resolvedLayout },
    }));
  }, [detectedLayout, preference, resolvedLayout]);

  return {
    preference,
    detectedLayout,
    resolvedLayout,
    setPreference,
  };
}
