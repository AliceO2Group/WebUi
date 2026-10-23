import { createRequire } from 'node:module';
import path from 'node:path';
import { defineConfig } from 'vite';

const webUi = path.resolve(import.meta.dirname, 'node_modules/@aliceo2/web-ui');
const requireFromWebUi = createRequire(path.join(webUi, 'package.json'));

export default defineConfig({
  resolve: {
    alias: {
      '/js/src': path.join(webUi, 'Frontend/js/src'),
      '/mithril': path.dirname(requireFromWebUi.resolve('mithril')),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: { external: [/^\/mithril\//] },
  },
});
