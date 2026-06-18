import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js is intentionally isolated in a lazy WebGL chunk.
    chunkSizeWarningLimit: 550,
  },
})
