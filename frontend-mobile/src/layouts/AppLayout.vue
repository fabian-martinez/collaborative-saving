<script setup lang="ts">
import AppHeader from '@/shared/components/navigation/AppHeader.vue';
import BottomNavBar from '@/shared/components/navigation/BottomNavBar.vue';
</script>

<template>
  <div class="h-full w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
    <!-- Top Bar -->
    <AppHeader />

    <!-- Main Scrollable Screen -->
    <main class="flex-1 overflow-y-auto pb-safe-nav no-scrollbar">
      <div class="max-w-md mx-auto px-4 py-3 space-y-4">
        <slot />
      </div>
    </main>

    <!-- Bottom Navigation Bar -->
    <BottomNavBar />
  </div>
</template>
