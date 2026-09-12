import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5175,
    host: true, // Permite probar en el navegador móvil en la misma red local
    proxy: {
      '/v2': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
