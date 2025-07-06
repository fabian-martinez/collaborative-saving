<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useUserStore } from './features/auth/stores/user'
import AppSidebar from '@/shared/layout/AppSidebar.vue'
import AppHeader from '@/shared/layout/AppHeader.vue'

const userStore = useUserStore()

onMounted(() => {
  userStore.fetchRole()
})
</script>

<template>
  <div class="flex h-screen bg-base-300">
    <AppSidebar />
    <div class="flex flex-1 flex-col">
      <AppHeader />
      <main class="flex-1 p-6 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style>
/* Se pueden añadir estilos globales aquí si es necesario, 
   pero se priorizará el uso de clases de Tailwind. 
   El CSS de base está en main.css */
</style>
