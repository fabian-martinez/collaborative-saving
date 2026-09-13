<script setup lang="ts">
import { computed } from 'vue';
import { formatCurrency } from '@/shared/utils/currency';
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode';

const props = withDefaults(
  defineProps<{
    amount: number | string | null | undefined;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
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
    case 'xs':
      return 'text-xs font-semibold';
    case 'sm':
      return 'text-xs sm:text-sm font-semibold';
    case 'md':
      return 'text-sm sm:text-base font-bold';
    case 'lg':
      return 'text-base sm:text-lg font-extrabold';
    case 'xl':
      return 'text-lg sm:text-xl font-black';
    case 'hero':
      // Tamaño grande responsivo que no desborda pantallas móviles de 360-390px
      return 'text-2xl sm:text-3xl font-black';
    default:
      return 'text-sm sm:text-base font-bold';
  }
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'text-emerald-500 dark:text-emerald-400';
    case 'danger':
      return 'text-rose-500 dark:text-rose-400';
    case 'warning':
      return 'text-amber-500 dark:text-amber-400';
    case 'muted':
      return 'text-slate-500 dark:text-slate-400';
    case 'default':
    default:
      // Números principales en blanco en modo oscuro / negro-pizarra en modo luminoso
      return 'text-slate-900 dark:text-white';
  }
});
</script>

<template>
  <span
    :class="[sizeClasses, variantClasses, customClass]"
    class="inline-flex items-center whitespace-nowrap tabular-nums shrink-0 tracking-tight transition-all"
  >
    <template v-if="isHidden">
      <span class="tracking-widest font-mono select-none opacity-70">••••••</span>
    </template>
    <template v-else>
      {{ formattedAmount }}
    </template>
  </span>
</template>
