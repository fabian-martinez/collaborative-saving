<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  }>(),
  {
    variant: 'neutral'
  }
);
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
    :class="{
      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': variant === 'success',
      'bg-amber-500/10 text-amber-400 border border-amber-500/20': variant === 'warning',
      'bg-rose-500/10 text-rose-400 border border-rose-500/20': variant === 'danger',
      'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20': variant === 'info',
      'bg-slate-800 text-slate-300 border border-slate-700': variant === 'neutral'
    }"
  >
    <slot />
  </span>
</template>
