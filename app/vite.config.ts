import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  build: { chunkSizeWarningLimit: 1000 },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/xtream-api': {
        target: 'http://ctn34.xyz:8080',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/xtream-api/, ''),
      },
      '/xtream': {
        target: 'http://dzcvip1.xyz:2095',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/xtream/, ''),
      },
      '/p2095': {
        target: 'http://dzcvip1.xyz:2095',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/p2095/, ''),
      },
      '/p8080': {
        target: 'http://dzcvip1.xyz:8080',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/p8080/, ''),
      },
      '/tv8daion': {
        target: 'https://tv8.daioncdn.net',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/tv8daion/, ''),
      },
    },
  },
});
