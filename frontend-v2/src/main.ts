import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './features/auth/stores/authStore'
import './assets/main.css'

async function startApp() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  
  const authStore = useAuthStore()
  await authStore.init()

  app.use(router)
  app.mount('#app')
}

startApp()

