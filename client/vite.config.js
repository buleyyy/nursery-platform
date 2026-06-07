import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Semua request /api/* diteruskan ke backend Express
      '/api': {
        target: 'http://localhost:3006',
        changeOrigin: true,
        // Tidak perlu rewrite — path sudah cocok
      },
    },
  },
})
