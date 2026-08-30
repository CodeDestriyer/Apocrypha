import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Stamp a unique build id into the service worker's cache name on every build.
// public/sw.js ships the literal token `__BUILD_ID__`; here we replace it in the
// emitted dist/sw.js with a per-build id, so each deploy produces a byte-different
// sw.js. main.jsx's update check then finds a new worker and refreshes the
// installed PWA to the latest build — without this, an asset-only deploy (new
// JS/CSS but unchanged sw.js) leaves a running PWA stuck on the old version.
function swVersionStamp() {
  return {
    name: 'sw-version-stamp',
    apply: 'build',
    closeBundle() {
      const swPath = resolve(process.cwd(), 'dist/sw.js');
      try {
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const src = readFileSync(swPath, 'utf8');
        if (src.includes('__BUILD_ID__')) {
          writeFileSync(swPath, src.replaceAll('__BUILD_ID__', id));
        }
      } catch (e) {
        this.warn?.(`sw version stamp skipped: ${e.message}`);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), swVersionStamp()],
});
