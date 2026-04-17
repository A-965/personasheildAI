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
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        popup: path.resolve(__dirname, 'public/popup.html'),
        background: path.resolve(__dirname, 'public/background.js'),
        content: path.resolve(__dirname, 'public/content.js'),
      },
      external: [],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name].[ext]'
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
