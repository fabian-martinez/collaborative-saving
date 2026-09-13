<script setup lang="ts">
import { useRoute } from 'vue-router';
import { User, Coins, Group } from 'iconoir-vue/regular';

const route = useRoute();
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 bg-white/95 dark:bg-[#080e22]/95 backdrop-blur-xl border-t border-slate-200 dark:border-[#162348] pb-safe px-6 pt-2 transition-colors duration-200">
    <div class="flex items-center justify-around max-w-md mx-auto">
      <!-- Tab 1: Yo -->
      <router-link
        to="/home"
        class="flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-150 active:scale-90"
        :class="[route.path === '/home' || route.path === '/' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200']"
      >
        <User class="w-5 h-5" />
        <span class="text-xs">Yo</span>
      </router-link>

      <!-- Tab 2: Fondo -->
      <router-link
        to="/fund"
        class="flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-150 active:scale-90"
        :class="[route.path === '/fund' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200']"
      >
        <Coins class="w-5 h-5" />
        <span class="text-xs">Fondo</span>
      </router-link>

      <!-- Tab 3: Socios -->
      <router-link
        to="/members"
        class="flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-150 active:scale-90"
        :class="[route.path === '/members' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200']"
      >
        <Group class="w-5 h-5" />
        <span class="text-xs">Socios</span>
      </router-link>
    </div>
  </nav>
</template>
