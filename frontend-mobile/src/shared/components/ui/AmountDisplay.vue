<script setup lang="ts">
import { computed } from 'vue';
import { formatCurrency } from '@/shared/utils/currency';
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode';

const props = withDefaults(
  defineProps<{
    amount: number | string | null | undefined;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
    variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'muted';
    customClass?: string;
  }>(),
  {
    size: 'md',
    variant: 'default',
    customClass: ''
  }
);

const { isHidden } = usePrivacyMode();

const formattedAmount = computed(() => formatCurrency(props.amount));

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-sm font-semibold';
    case 'md':
      return 'text-base font-bold';
    case 'lg':
      return 'text-xl font-bold tracking-tight';
    case 'xl':
      return 'text-2xl font-extrabold tracking-tight';
    case 'hero':
      return 'text-3xl sm:text-4xl font-black tracking-tight';
    default:
      return 'text-base font-bold';
  }
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'text-emerald-400';
    case 'success':
      return 'text-emerald-400';
    case 'danger':
      return 'text-rose-400';
    case 'warning':
      return 'text-amber-400';
    case 'muted':
      return 'text-slate-400';
    default:
      return 'text-white';
  }
});
</script>

<template>
  <span :class="[sizeClasses, variantClasses, customClass]" class="inline-flex items-center tabular-nums transition-all">
    <template v-if="isHidden">
      <span class="tracking-widest font-mono select-none opacity-80">••••••</span>
    </template>
    <template v-else>
      {{ formattedAmount }}
    </template>
  </span>
</template>
