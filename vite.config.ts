import { defineConfig } from 'vite';

export default defineConfig({
  // Göreli yollar: build çıktısı herhangi bir alt klasörden (GitHub Pages vb.) çalışır.
  base: './',
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
});
