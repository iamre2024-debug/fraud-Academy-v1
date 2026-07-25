# Fraud Academy cloud persistence

## Result

Fraud Academy keeps its existing offline recovery paths and adds encrypted, cloud-backed recovery:

- generated scenarios remain IndexedDB-first with the existing localStorage migration and fallback;
- case progress, notes, note drafts, pinned evidence, decision drafts, learner packages, action history, document requests, Quick Pad state, and completed debriefs remain immediately recoverable from browser storage;
- the browser encrypts and compresses the complete recovery snapshot before it calls the same-origin cloud endpoint;
- the browser sends only a SHA-256 recovery-code identifier; the endpoint combines that identifier with a server-only HMAC secret and stores only the encrypted payload, so the recovery code and encryption key never leave the browser;
- a recovery code connects another browser or device to the same encrypted snapshot;
- item-level versions merge concurrent notes, pinned evidence, reviewed tools, packages, actions, debriefs, and generated cases;
- compare-and-set cloud revisions prevent a stale device from silently overwriting a newer snapshot;
- newer item tombstones preserve explicit pinned-evidence removals;
- offline writes remain local and retry automatically after the browser emits the `online` event.

## Required production environment variables

Create an Upstash Redis database, open its **Connect** section, choose **REST**, and copy the HTTPS REST URL and read/write REST token.

Set these server-side variables in the Vercel project:

```text
UPSTASH_REDIS_REST_URL=https://YOUR-DATABASE.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_READ_WRITE_REST_TOKEN
CLOUD_SYNC_HMAC_SECRET=YOUR_64_CHARACTER_RANDOM_HEX_VALUE
```

Generate the HMAC secret locally:

```bash
openssl rand -hex 32
```

Optional origin allowlist:

```text
CLOUD_SYNC_ALLOWED_ORIGIN=https://fraud-academy-v1.vercel.app
```

Leave `CLOUD_SYNC_ALLOWED_ORIGIN` blank to allow only the current deployment origin. Add comma-separated exact origins when both Production and named Preview deployments must use cloud sync.

Do not create `VITE_UPSTASH_*` variables. The Upstash token and HMAC secret must stay in the serverless function environment and must never be embedded in the browser bundle.

### Vercel steps

1. Open the `fraud-academy-v1` Vercel project.
2. Open **Settings → Environment Variables**.
3. Add the three required variables above to **Production**. Add them to **Preview** only if preview deployments should use the same recovery database.
4. Mark the REST token and HMAC secret as sensitive values.
5. Redeploy Production. Vercel applies changed environment variables only to a new deployment.
6. Open the app, go to **Settings → Cloud save**, and press **Sync now**. The status should become **Cloud current**.

Upstash exposes the expected `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` values in the database Connect view. Its REST API accepts Redis commands over HTTPS with bearer-token authorization. Vercel environment variables are scoped by deployment environment and require a redeploy after a value changes.

## Device recovery flow

1. On the current device, open **Settings → Cloud save**.
2. Press **Copy** beside the private recovery code and store the code somewhere private.
3. On another device, open the same settings panel.
4. Paste the code into **Restore on another device** and press **Use code**.
5. Keep the app open until the status says **Cloud current**.

The recovery code is both the cloud namespace credential and the source for client-side encryption. Losing it does not delete the current device's local data, but it prevents a clean browser from decrypting the cloud snapshot. Anyone with the code can restore that snapshot, so it should not be posted or shared publicly.

## Migration behavior

The migration is additive and non-destructive:

1. Existing generated scenarios continue their one-time `localStorage → IndexedDB` migration in `generatedCaseRepository.js`.
2. On the first cloud-capable launch, existing case-scoped localStorage values are assigned per-item or per-case version metadata. Their public storage keys and values do not change.
3. The first cloud sync merges that local snapshot with any existing encrypted cloud snapshot.
4. The merged result is written back to the established localStorage keys and IndexedDB generated-case store.
5. No local case, note, pin, package, or scenario is cleared merely because the cloud is empty or unavailable.
6. Existing saved learner packages still unlock Luna. When a learner opens an unlocked debrief for the first time, the completed deterministic/API review is persisted under `fraud-academy-completed-debriefs-v1` and joins subsequent cloud snapshots.

When the required server environment variables are absent or Upstash is unavailable, Settings reports **Local recovery** or **Sync paused**. The browser-local and IndexedDB recovery copies remain active, and pending changes retry later.

## Verification

```bash
npm run cloud-persistence-smoke-check
npm run build
npx playwright test tests/cloud-persistence-browser.spec.mjs
```

The static/pure test covers encryption round trips, concurrent offline note and pin merges, generated-case union, debrief persistence, pin-removal tombstones, API environment boundaries, and conflict handling anchors. Playwright runs the recovery flow on desktop Chromium and Pixel 7, closes and reopens the app, restores a clean device from the recovery code, and verifies an offline Quick Pad edit survives a forced cloud revision conflict.
