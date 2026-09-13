<script setup lang="ts">
import { computed, type Component } from 'vue';
import Card from './Card.vue';
import AmountDisplay from './AmountDisplay.vue';
import Badge from './Badge.vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    icon?: Component;
    iconColor?: 'blue' | 'amber' | 'purple' | 'emerald' | 'rose' | 'slate' | 'indigo' | 'default';
    badgeText?: string;
    badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    amount?: number | string | null;
    amountLabel?: string;
    amountSize?: 'hero' | 'xl' | 'lg' | 'md' | 'sm';
    amountVariant?: 'default' | 'success' | 'danger' | 'warning' | 'muted';
    highlighted?: boolean;
    clickable?: boolean;
  }>(),
  {
    iconColor: 'blue',
    badgeVariant: 'info',
    amountSize: 'hero',
    amountVariant: 'default'
  }
);

const iconColorClass = computed(() => {
  switch (props.iconColor) {
    case 'emerald':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'amber':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'purple':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    case 'rose':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    case 'indigo':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
    case 'slate':
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    case 'blue':
    default:
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  }
});
</script>

<template>
  <Card :highlighted="highlighted" :clickable="clickable" class="space-y-4">
    <!-- Header: Icon + Title/Subtitle + Badge or Action -->
    <div class="flex items-center justify-between gap-3 m-2">
      <div class="flex items-center gap-2.5 min-w-0">
        <!-- Icon Slot or Dynamic Icon Component -->
        <slot name="header-icon">
          <div v-if="icon" class="p-2 rounded-xl shrink-0" :class="iconColorClass">
            <component :is="icon" class="w-5 h-5" />
          </div>
        </slot>

        <div v-if="title || subtitle" class="min-w-0">
          <h3 v-if="title" class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider truncate">
            {{ title }}
          </h3>
          <span v-if="subtitle" class="text-xs text-slate-500 dark:text-slate-400 block truncate">
            {{ subtitle }}
          </span>
        </div>
      </div>

      <!-- Right Header: Badge or Header Action -->
      <div class="shrink-0 flex items-center gap-2">
        <slot name="header-action">
          <Badge v-if="badgeText" :variant="badgeVariant">
            {{ badgeText }}
          </Badge>
        </slot>
        <slot name="header-extra" />
      </div>
    </div>

    <!-- Hero Amount Section -->
    <div v-if="amount !== undefined && amount !== null" class="pt-0.5 pb-1 m-2">
      <slot name="amount-before" />
      <span v-if="amountLabel" class="text-xs text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">
        {{ amountLabel }}
      </span>
      <AmountDisplay :amount="amount" :size="amountSize" :variant="amountVariant" />
      <slot name="amount-after" />
    </div>

    <!-- Body Section (Desglose, Lista de items, Grid) -->
    <div v-if="$slots.default" class="space-y-3 pt-3 border-t border-slate-200/80 dark:border-[#17254e] m-2">
      <slot />
    </div>

    <!-- Action Buttons Slot -->
    <div v-if="$slots.actions" class="flex items-center gap-2.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 m-2">
      <slot name="actions" />
    </div>
  </Card>
</template>
