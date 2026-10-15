import { defineConfig } from 'vite';
export default defineConfig({ root: 'apps/web', build: { outDir: 'dist', emptyOutDir: true }, server: { port: 4173, strictPort: true } });
