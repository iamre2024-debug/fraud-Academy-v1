import { useEffect, useMemo, useState } from 'react';

export const layoutModeStorageKey = 'fraud-academy-layout-mode-v1';
export const mobileLayoutQuery = '(max-width: 720px)';
export const mobileDeviceLayoutQuery = '(max-device-width: 820px)';

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
  return window.matchMedia(mobileLayoutQuery).matches || window.matchMedia(mobileDeviceLayoutQuery).matches ? 'mobile' : 'desktop';
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
    const queries = [window.matchMedia(mobileLayoutQuery), window.matchMedia(mobileDeviceLayoutQuery)];
    const syncDetectedLayout = () => setDetectedLayout(queries.some((query) => query.matches) ? 'mobile' : 'desktop');
    syncDetectedLayout();
    queries.forEach((query) => {
      if (query.addEventListener) query.addEventListener('change', syncDetectedLayout);
      else query.addListener?.(syncDetectedLayout);
    });
    return () => {
      queries.forEach((query) => {
        if (query.removeEventListener) query.removeEventListener('change', syncDetectedLayout);
        else query.removeListener?.(syncDetectedLayout);
      });
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
