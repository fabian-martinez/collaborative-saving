<template>
  <div class="flex h-screen bg-base-300">
    <AppSidebar />
    <div class="flex flex-1 flex-col ml-72">
      <AppHeader />
      <main class="flex-1 p-6 overflow-y-auto mt-16">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from '@/shared/layout/AppSidebar.vue'
import AppHeader from '@/shared/layout/AppHeader.vue'
</script>

