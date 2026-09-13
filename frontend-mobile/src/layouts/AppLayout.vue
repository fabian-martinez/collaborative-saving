<script setup lang="ts">
import AppHeader from '@/shared/components/navigation/AppHeader.vue';
import BottomNavBar from '@/shared/components/navigation/BottomNavBar.vue';
</script>

<template>
  <div class="h-full w-full flex flex-col bg-[#f4f6fa] dark:bg-[#080e22] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
    <!-- Top Bar -->
    <AppHeader />

    <!-- Main Scrollable Screen with proper margins -->
    <main class="flex-1 overflow-y-auto pb-safe-nav no-scrollbar">
      <div class="max-w-md mx-auto px-4.5 sm:px-5 py-4 space-y-4 sm:space-y-4.5">
        <slot />
      </div>
    </main>

    <!-- Bottom Navigation Bar -->
    <BottomNavBar />
  </div>
</template>
