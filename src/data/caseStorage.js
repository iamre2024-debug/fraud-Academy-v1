export const generatedCaseStorageKey = 'fraud-academy-generated-cases-v1';

function normalizeCases(value) {
  return Array.isArray(value) ? value : [];
}

export function createLocalCaseStorage({ storageKey = generatedCaseStorageKey } = {}) {
  return {
    kind: 'local',
    readAll() {
      if (typeof window === 'undefined') return [];
      try {
        const saved = window.localStorage.getItem(storageKey);
        return normalizeCases(saved ? JSON.parse(saved) : []);
      } catch {
        return [];
      }
    },
    writeAll(cases = []) {
      if (typeof window === 'undefined') return normalizeCases(cases);
      const normalized = normalizeCases(cases);
      window.localStorage.setItem(storageKey, JSON.stringify(normalized));
      return normalized;
    },
    upsert(nextCase) {
      const current = this.readAll();
      const updated = [nextCase, ...current.filter((item) => item.id !== nextCase.id)];
      this.writeAll(updated);
      return nextCase;
    },
  };
}

export function createRemoteCaseStorage({ baseUrl, fetchImpl = globalThis.fetch } = {}) {
  if (!baseUrl) throw new Error('Remote case storage requires a baseUrl.');
  if (typeof fetchImpl !== 'function') throw new Error('Remote case storage requires fetch.');

  const request = async (path, options = {}) => {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      ...options,
    });
    if (!response.ok) throw new Error(`Case storage request failed with ${response.status}.`);
    return response.status === 204 ? null : response.json();
  };

  return {
    kind: 'remote',
    async readAll() {
      return normalizeCases(await request('/cases'));
    },
    async writeAll(cases = []) {
      return normalizeCases(await request('/cases', { method: 'PUT', body: JSON.stringify(normalizeCases(cases)) }));
    },
    async upsert(nextCase) {
      return request(`/cases/${encodeURIComponent(nextCase.id)}`, { method: 'PUT', body: JSON.stringify(nextCase) });
    },
  };
}

export const localCaseStorage = createLocalCaseStorage();
