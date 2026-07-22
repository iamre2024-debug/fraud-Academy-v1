export const documentViewerRouteKey = 'fraud-academy-document-viewer-route-v1';

export function queueDocumentViewerRoute(route) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(documentViewerRouteKey, JSON.stringify(route));
  } catch {
    // The viewer still opens normally when session storage is unavailable.
  }
}

export function readDocumentViewerRoute(caseId) {
  if (typeof window === 'undefined') return null;
  try {
    const route = JSON.parse(window.sessionStorage.getItem(documentViewerRouteKey) || 'null');
    return route?.caseId === caseId ? route : null;
  } catch {
    return null;
  }
}

export function clearDocumentViewerRoute() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(documentViewerRouteKey);
  } catch {
    // No cleanup is required when session storage is unavailable.
  }
}
