import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  srcDir: '.',

  // SPA Mode
  ssr: false,

  // Modules
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    // '@nuxtjs/tailwindcss' // Using native v4 instead
  ],

  // CSS configuration for Tailwind v4
  css: ['./assets/css/main.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias for porting existing code easily
        '@': '/src'
      }
    },
    server: {
      proxy: {
        '/v2': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        '/ledger-entries': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
  },

  // Path alias config (Nuxt uses ~ and @ for root by default, we need to ensure @ points to src if we keep that structure or handle imports carefully)
  // Actually, standard Nuxt: @ -> root. The existing code expects @ -> src.
  // We can remap @ to src in alias, but better to check if we can make src the root source or just use alias.
  alias: {
    '@': './src'
  }
})
