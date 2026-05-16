import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/generate-image': 'http://localhost:8003',
      '/generate-prompt': 'http://localhost:8003',
      '/generate-book': 'http://localhost:8003',
    }
  }
})
