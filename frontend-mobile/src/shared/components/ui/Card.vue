<script setup lang="ts">
defineProps<{
  clickable?: boolean;
  padded?: boolean;
  highlighted?: boolean;
}>();
</script>

<template>
  <div
    class="rounded-2xl border transition-all duration-200"
    :class="[
      highlighted
        ? 'bg-gradient-to-br from-emerald-50/80 via-white to-white dark:from-[#092224] dark:via-[#0e1838] dark:to-[#0e1838] border-emerald-300/80 dark:border-emerald-500/40 shadow-md shadow-emerald-500/5 dark:shadow-emerald-950/30'
        : 'bg-white dark:bg-[#0e1838] border-slate-200 dark:border-[#1a2750] shadow-sm dark:shadow-md dark:shadow-[#05091a]/60',
      padded !== false ? 'p-4 sm:p-5' : '',
      clickable ? 'active:scale-[0.98] cursor-pointer hover:border-slate-300 dark:hover:border-[#253770]' : ''
    ]"
  >
    <slot />
  </div>
</template>
