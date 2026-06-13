import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Local dev mirrors production: the app calls a relative /api and the
    // server proxies it to the backend (Vercel rewrite does this in prod).
    proxy: {
      '/api': {
        target: 'https://api.prestigeplus.services',
        changeOrigin: true,
      },
    },
  },
})
