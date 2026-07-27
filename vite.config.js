import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const swCacheVersion = `v2-${Date.now().toString(36)}`;
const swVersionPattern = /^const CACHE_VERSION = '[^']*';$/m;

function serviceWorkerCacheVersion() {
  let resolvedRoot = process.cwd();
  let resolvedOutDir = 'dist';

  return {
    name: 'fraud-academy-sw-cache-version',
    apply: 'build',
    configResolved(config) {
      resolvedRoot = config.root;
      resolvedOutDir = config.build.outDir;
    },
    closeBundle() {
      try {
        const swPath = path.resolve(resolvedRoot, resolvedOutDir, 'sw.js');
        if (!fs.existsSync(swPath)) return;
        const source = fs.readFileSync(swPath, 'utf8');
        if (!swVersionPattern.test(source)) return;
        fs.writeFileSync(
          swPath,
          source.replace(swVersionPattern, `const CACHE_VERSION = '${swCacheVersion}';`),
        );
      } catch (error) {
        console.warn('[sw-cache-version] could not stamp sw.js:', error?.message ?? error);
      }
    },
  };
}

function chunkFor(id) {
  const normalized = id.replace(/\\/g, '/');
  if (normalized.includes('/node_modules/')) {
    if (/\/node_modules\/(react|react-dom|scheduler)\//.test(normalized)) return 'vendor';
    return undefined;
  }
  if (normalized.includes('/src/data/')) return 'case-data';
  return undefined;
}

export default defineConfig({
  plugins: [react(), serviceWorkerCacheVersion()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: chunkFor,
      },
    },
  },
});
