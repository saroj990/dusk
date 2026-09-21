import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Optional: set Ollama base URL to http://localhost:5173/ollama
      '/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ollama/, ''),
      },
      '/brave-search': {
        target: 'https://api.search.brave.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/brave-search/, '/res/v1/web/search'),
      },
      '/ddg-search': {
        target: 'https://api.duckduckgo.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ddg-search/, ''),
      },
      '/ddg-html': {
        target: 'https://html.duckduckgo.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ddg-html/, '/html'),
      },
    },
  },
  preview: {
    proxy: {
      '/brave-search': {
        target: 'https://api.search.brave.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/brave-search/, '/res/v1/web/search'),
      },
      '/ddg-search': {
        target: 'https://api.duckduckgo.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ddg-search/, ''),
      },
      '/ddg-html': {
        target: 'https://html.duckduckgo.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ddg-html/, '/html'),
      },
    },
  },
})
