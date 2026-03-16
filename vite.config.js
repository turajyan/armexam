import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/voice': 'http://localhost:4000',
      '/minio': { target: 'http://localhost:9000', rewrite: path => path.replace(/^\/minio/, '') },
    },
  },
})
