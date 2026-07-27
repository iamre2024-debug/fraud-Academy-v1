import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const read = (file) => fs.readFileSync(path.join(rootDir, file), 'utf8');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const index = read('index.html');
const entrypoint = read('src/main.jsx');
const serviceWorker = read('public/sw.js');
const failures = [];

if (manifest.display !== 'standalone') failures.push('manifest must use standalone display mode');
if (manifest.start_url !== '/') failures.push('manifest must start at the app root');
if (manifest.theme_color !== '#02152b') failures.push('manifest must use the Blue Mission Deck browser color');
if (manifest.background_color !== '#010713') failures.push('manifest must use the Blue Mission Deck launch background');
if (!manifest.icons?.some((icon) => icon.src === '/icon.svg')) failures.push('manifest must include the Fraud Academy icon');
if (!index.includes('<link rel="manifest" href="/manifest.webmanifest"')) failures.push('index must link the web app manifest');
if (!index.includes('<meta name="theme-color" content="#02152b"')) failures.push('index must use the Blue Mission Deck theme color');
if (!entrypoint.includes("navigator.serviceWorker.register('/sw.js')")) failures.push('the application must register its service worker');

for (const anchor of [
  "const CACHE_VERSION = 'v2'",
  'const CACHE_NAME = `fraud-academy-shell-${CACHE_VERSION}`',
  "const APP_SHELL = ['/', '/manifest.webmanifest', '/icon.svg', '/icon-maskable.svg']",
  "url.pathname.startsWith('/api/')",
  "request.mode === 'navigate'",
  'offlineFallback()',
  'event.waitUntil(refresh.catch(() => {}))',
  'self.skipWaiting()',
  'self.clients.claim()',
]) {
  if (!serviceWorker.includes(anchor)) failures.push(`service worker is missing required behavior: ${anchor}`);
}

if (failures.length) {
  console.error('PWA smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('PWA smoke check passed. Fraud Academy has Blue Mission Deck install metadata, an update-safe app shell, and offline navigation fallback.');
