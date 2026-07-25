# Fraud Academy Desktop Mission Control v2

## Scope

Desktop Mission Control v2 replaces the legacy portal-driven desktop navigation and Dashboard composition. It does not replace the approved investigation tools, case data, Evidence First rules, generated-case repository, review-package model, or cloud persistence system.

The mobile Blue Mission Deck remains a separate renderer and is not restyled by this desktop layer.

## Runtime composition

- `src/DesktopMissionControlApp.jsx` directly renders Home, Cases, Workspace, Academy, Progress, and Profile inside one desktop shell.
- `src/desktopMissionControlV2.css` owns the light blue, navy, and peach desktop theme, fixed desktop sidebar, wide cards, wrapping rules, compact rail, and forced-desktop narrow fallback.
- `src/VisualApp.jsx` remains the owner of active case, global tab, workspace page, active tool, generated case catalog, resume state, and cloud initialization.
- `src/VisualWorkspace.jsx` remains the investigation workspace. It is mounted inside the desktop shell so case-scoped notes, pinned evidence, review state, decision drafts, and resume behavior retain their existing boundaries.
- `src/LunaPostSubmissionPanel.jsx` supports direct inline desktop composition while preserving its existing portal path for the mobile workspace.

## Navigation behavior

The desktop sidebar has four primary destinations: Dashboard, Cases, Workspace, and Academy. Progress and Agent Profile remain contextual destinations.

Home shortcuts route to the exact requested surface:

| Shortcut | Destination |
|---|---|
| Investigation Workspace | Current case briefing |
| Timeline | Workspace `timeline` with the Timeline tool |
| Pinned Evidence | Workspace `evidence` |
| Case Notes | Workspace `notes` |
| Tool Library | Workspace `tool-menu` |
| Case Queue | Cases |
| Progress | Academy Progress |
| Academy | Luna Academy |

Opening the primary Workspace destination preserves the current workspace page. Active-case and Dashboard “continue” actions intentionally open the case briefing.

## Persistence and migration

This is a presentation and routing migration. It creates no new saved-data format and requires no database migration or new environment variable.

- Existing localStorage and IndexedDB records are reused.
- Existing encrypted Supabase recovery snapshots remain compatible.
- The desktop/mobile layout preference remains device-local.
- Active tab, active case, workspace page, and active tool continue to use the existing cloud-backed resume resource.
- Offline writes still save locally first and use the existing revision-safe sync queue when connectivity returns.

The old `VisualNavigation.jsx` module remains in the repository as a compatibility reference for earlier approved-theme guards, but it is no longer mounted by the desktop runtime.

## Verification

- `scripts/desktop-mission-control-v2-smoke-check.mjs` protects direct page composition, exact workspace routes, desktop-only CSS scope, mobile isolation, and credential boundaries.
- `tests/desktop-mission-control-browser.spec.mjs` verifies full Dashboard rendering, card width safety, Timeline/Evidence/Notes/Tool Library routes, close/reopen workspace recovery, and Cases/Academy/Profile navigation.
- The existing desktop and Pixel 7 suites continue to cover case work, local recovery, cloud restore, and offline-to-online conflict retry.
