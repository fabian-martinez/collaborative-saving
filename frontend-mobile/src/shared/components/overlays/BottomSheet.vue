<script setup lang="ts">
import { watch, onUnmounted } from 'vue';
import { Xmark } from 'iconoir-vue/regular';

const props = defineProps<{
  modelValue: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

function close() {
  emit('update:modelValue', false);
}

// Prevenir scroll en el fondo cuando la hoja está abierta
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
);

onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
        @click="close"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="modelValue"
        class="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-3xl border-t border-slate-200 dark:border-[#1a2750] bg-white dark:bg-[#0c1532] shadow-2xl pb-safe text-slate-900 dark:text-slate-100 transition-colors duration-200"
      >
        <!-- Pull Handle -->
        <div class="pt-3 pb-2 cursor-grab active:cursor-grabbing" @click="close">
          <div class="mx-auto h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <!-- Header -->
        <div v-if="title || $slots.header" class="flex items-center justify-between px-5 pb-3 border-b border-slate-200 dark:border-[#1a2750]">
          <slot name="header">
            <h3 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">{{ title }}</h3>
            <button
              type="button"
              class="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#16244e] hover:text-slate-700 dark:hover:text-white active:scale-95 transition-all"
              @click="close"
            >
              <Xmark class="h-5 w-5" />
            </button>
          </slot>
        </div>

        <!-- Scrollable Body -->
        <div class="overflow-y-auto px-5 py-4 flex-1">
          <slot />
        </div>

        <!-- Footer / Action bar -->
        <div v-if="$slots.footer" class="border-t border-slate-200 dark:border-[#1a2750] p-4">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
