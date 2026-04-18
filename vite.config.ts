import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      apply: 'build',
      writeBundle() {
        // Copy manifest.json to dist
        fs.copyFileSync(
          path.resolve(__dirname, 'public/manifest.json'),
          path.resolve(__dirname, 'dist/manifest.json')
        );
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  define: {
    'process.env': {}
  }
});
