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
      '/generate-image': 'http://create-book-api:8003',
      '/generate-prompt': 'http://create-book-api:8003',
      '/generate-book': 'http://create-book-api:8003',
      '/generate-habit-chart': 'http://create-book-api:8003',
    }
  }
})
