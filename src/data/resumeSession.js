import { storageKeys } from './persistenceKeys.js';

export const resumeSessionEntryId = 'current';
export const resumeSessionSchemaVersion = 1;

export const resumeNavigationTabs = [
  'dashboard',
  'cases',
  'workspace',
  'academy',
  'progress',
  'profile',
];

export const resumeWorkspaceScreens = [
  'briefing',
  'workflow',
  'tool-menu',
  'tool',
  'timeline',
  'evidence',
  'notes',
  'determination',
  'debrief',
];

const navigationTabs = new Set(resumeNavigationTabs);
const workspaceScreens = new Set(resumeWorkspaceScreens);

function nonEmptyString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function normalizeResumeSession(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  return {
    schemaVersion: resumeSessionSchemaVersion,
    activeTab: navigationTabs.has(value.activeTab) ? value.activeTab : 'workspace',
    activeCaseId: nonEmptyString(value.activeCaseId),
    workspaceScreen: workspaceScreens.has(value.workspaceScreen) ? value.workspaceScreen : 'briefing',
    activeTool: nonEmptyString(value.activeTool, 'Login History'),
  };
}

export function makeResumeSessionResource(value) {
  const session = normalizeResumeSession(value);
  return session ? { [resumeSessionEntryId]: session } : {};
}

export function readResumeSession() {
  if (typeof window === 'undefined') return null;

  try {
    const saved = window.localStorage.getItem(storageKeys.resumeSession);
    if (!saved) return null;
    const resource = JSON.parse(saved);
    return normalizeResumeSession(resource?.[resumeSessionEntryId] ?? resource);
  } catch {
    return null;
  }
}
