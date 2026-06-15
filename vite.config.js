import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      
      '/api': {
        target: 'https://omr-production-7712.up.railway.app',  //https://omr-production-7712.up.railway.app
        changeOrigin: true,
        secure: false
      }
    }
  }
})