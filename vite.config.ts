import { defineConfig } from 'vite';

export default defineConfig({
  base: '/isc-exam-clock/',
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
