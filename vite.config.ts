import { defineConfig } from 'vite';

export default defineConfig({
  // Göreli yollar: build çıktısı herhangi bir alt klasörden (GitHub Pages vb.) çalışır.
  base: './',
  server: { port: 5173 },
  // Eski iPhone'larda (iOS 13+) da çalışsın diye yeni JavaScript sözdizimi eski karşılığına çevrilir.
  build: { chunkSizeWarningLimit: 2000, target: ['es2019', 'safari13'] },
});
