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
        ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/40'
        : 'bg-slate-900/80 backdrop-blur-md border-slate-800/80 shadow-sm',
      padded !== false ? 'p-4 sm:p-5' : '',
      clickable ? 'active:scale-[0.98] cursor-pointer hover:border-slate-700' : ''
    ]"
  >
    <slot />
  </div>
</template>
