import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendTarget = process.env.BACKEND_URL || 'http://127.0.0.1:8003';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/generate-image': backendTarget,
      '/generate-prompt': backendTarget,
      '/generate-prompts': backendTarget,
      '/generate-book': backendTarget,
      '/generate-habit-chart': backendTarget,
      '/generate-core-plan': backendTarget,
      '/generate-story-pages': backendTarget,
      '/generate-audio-video': backendTarget,
      '/preview-voice': backendTarget,
      '/preview-bgm': backendTarget,
      '/generated-media': backendTarget,
      '/book-data': backendTarget,
      '/compile-full-movie': backendTarget,
      '/search-similar': backendTarget,
      '/save-agent-output': backendTarget,
      '/update-review': backendTarget,
      '/save-feedback': backendTarget,
      '/tune-script': backendTarget,
      '/get-project': backendTarget,
      '/chroma-status': backendTarget,
      '/save-project-assets': backendTarget,
      '/list-projects': backendTarget,
      '/delete-project': backendTarget,
      '/numbers-data': backendTarget,
      '/customize-alphabet': backendTarget,
      '/rhyme-presets': backendTarget,
      '/book-output': backendTarget,
    }
  }
})
