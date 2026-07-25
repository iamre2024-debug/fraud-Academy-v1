import { useEffect, useState } from 'react';

export const desktopThemePreferenceKey = 'fraud-academy-desktop-theme-v1';
export const desktopThemeModes = ['day', 'auto', 'night'];

function normalizePreference(value) {
  return desktopThemeModes.includes(value) ? value : 'auto';
}

function readPreference() {
  if (typeof window === 'undefined') return 'auto';
  try {
    return normalizePreference(window.localStorage.getItem(desktopThemePreferenceKey));
  } catch {
    return 'auto';
  }
}

function readSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'day';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
}

export function resolveDesktopTheme(preference, systemTheme) {
  return preference === 'auto' ? systemTheme : preference;
}

export default function useDesktopThemeMode() {
  const [preference, setPreferenceState] = useState(readPreference);
  const [systemTheme, setSystemTheme] = useState(readSystemTheme);
  const resolvedTheme = resolveDesktopTheme(preference, systemTheme);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (event) => setSystemTheme(event.matches ? 'night' : 'day');
    setSystemTheme(query.matches ? 'night' : 'day');
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    document.body.dataset.desktopThemePreference = preference;
    document.body.dataset.desktopTheme = resolvedTheme;
    try {
      window.localStorage.setItem(desktopThemePreferenceKey, preference);
    } catch {
      // The selected theme remains active for this session when storage is unavailable.
    }
    return () => {
      delete document.body.dataset.desktopThemePreference;
      delete document.body.dataset.desktopTheme;
    };
  }, [preference, resolvedTheme]);

  function setPreference(nextPreference) {
    setPreferenceState(normalizePreference(nextPreference));
  }

  return {
    preference,
    resolvedTheme,
    setPreference,
  };
}
