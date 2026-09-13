<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 pb-safe px-6 pt-2">
    <div class="flex items-center justify-around max-w-md mx-auto">
      <!-- Tab 1: Yo -->
      <router-link
        to="/home"
        class="flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-150 active:scale-90"
        :class="[route.path === '/home' || route.path === '/' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200']"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="text-xs">Yo</span>
      </router-link>

      <!-- Tab 2: Fondo -->
      <router-link
        to="/fund"
        class="flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-150 active:scale-90"
        :class="[route.path === '/fund' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200']"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-xs">Fondo</span>
      </router-link>

      <!-- Tab 3: Socios -->
      <router-link
        to="/members"
        class="flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-150 active:scale-90"
        :class="[route.path === '/members' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200']"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span class="text-xs">Socios</span>
      </router-link>
    </div>
  </nav>
</template>
