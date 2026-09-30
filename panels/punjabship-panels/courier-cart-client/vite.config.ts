import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/seller-static/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
