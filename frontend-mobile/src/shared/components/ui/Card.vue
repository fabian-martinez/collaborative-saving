<script setup lang="ts">
defineProps<{
  clickable?: boolean;
  padded?: boolean;
  highlighted?: boolean;
}>();
</script>

<template>
  <div
    class="rounded-2xl sm:rounded-3xl border transition-all duration-200"
    :class="[
      highlighted
        ? 'bg-gradient-to-br from-emerald-50/90 via-white to-white dark:from-[#092224] dark:via-[#0e1838] dark:to-[#0e1838] border-emerald-300 dark:border-emerald-500/40 shadow-sm dark:shadow-md dark:shadow-emerald-950/20'
        : 'bg-white dark:bg-[#0e1838] border-slate-200/90 dark:border-[#1a2750] shadow-sm dark:shadow-md dark:shadow-[#05091a]/60',
      padded !== false ? 'p-6 sm:p-7' : '',
      clickable ? 'active:scale-[0.98] cursor-pointer hover:border-slate-300 dark:hover:border-[#253770]' : ''
    ]"
  >
    <slot />
  </div>
</template>
