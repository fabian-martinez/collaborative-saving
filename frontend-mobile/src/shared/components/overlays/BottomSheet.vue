<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { Xmark } from 'iconoir-vue/regular';

const props = defineProps<{
  modelValue: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const sheetRef = ref<HTMLElement | null>(null);
const bodyScrollRef = ref<HTMLElement | null>(null);

const isDragging = ref(false);
const dragY = ref(0);

let startY = 0;
let startTime = 0;
let canDrag = false;

function close() {
  emit('update:modelValue', false);
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return;
  startY = e.touches[0].clientY;
  startTime = Date.now();

  const target = e.target as HTMLElement;
  const isInsideScrollable = bodyScrollRef.value && bodyScrollRef.value.contains(target);

  if (isInsideScrollable) {
    // Si el usuario toca dentro del contenido con scroll, solo permitimos arrastrar
    // si el scroll está en el tope absoluto
    canDrag = (bodyScrollRef.value?.scrollTop || 0) <= 0;
  } else {
    // Tirador superior, header o footer siempre permiten arrastrar
    canDrag = true;
  }
}

function onTouchMove(e: TouchEvent) {
  if (!canDrag || e.touches.length !== 1) return;

  const currentY = e.touches[0].clientY;
  const delta = currentY - startY;

  // Si estamos en el área desplazable y el scroll ya no está en el tope
  if (bodyScrollRef.value && (bodyScrollRef.value.scrollTop || 0) > 0) {
    canDrag = false;
    dragY.value = 0;
    isDragging.value = false;
    return;
  }

  // Solo permitir arrastre hacia abajo
  if (delta > 0) {
    isDragging.value = true;
    dragY.value = delta;
    if (e.cancelable) {
      e.preventDefault();
    }
  } else {
    dragY.value = 0;
    isDragging.value = false;
  }
}

function onTouchEnd() {
  if (!canDrag) return;
  canDrag = false;

  if (isDragging.value) {
    isDragging.value = false;
    const elapsed = Math.max(1, Date.now() - startTime);
    const velocity = dragY.value / elapsed; // px/ms

    // Umbral de cierre: más de 90px de desplazamiento o velocidad rápida (> 0.4px/ms)
    if (dragY.value > 90 || velocity > 0.4) {
      const sheetHeight = sheetRef.value?.clientHeight || 450;
      dragY.value = sheetHeight;
      setTimeout(() => {
        close();
        dragY.value = 0;
      }, 200);
      return;
    }

    // Si no superó el umbral, regresar suavemente a 0
    dragY.value = 0;
  }
}

// Prevenir scroll en el fondo cuando la hoja está abierta y resetear drag
watch(
  () => props.modelValue,
  (isOpen) => {
    dragY.value = 0;
    isDragging.value = false;
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
        class="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        :style="{
          opacity: isDragging && dragY > 0 ? Math.max(0.15, 1 - (dragY / 400)) : undefined
        }"
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
        ref="sheetRef"
        class="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-3xl border-t border-slate-200 dark:border-[#1a2750] bg-white dark:bg-[#0c1532] shadow-2xl pb-safe text-slate-900 dark:text-slate-100 transition-colors duration-200 touch-pan-y"
        :style="{
          transform: isDragging || dragY > 0 ? `translate3d(0, ${dragY}px, 0)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <!-- Pull Handle Area -->
        <div class="pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0" @click="close">
          <div class="mx-auto h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 transition-transform active:scale-95" />
        </div>

        <!-- Header -->
        <div v-if="title || $slots.header" class="flex items-center justify-between px-5 pb-3 border-b border-slate-200 dark:border-[#1a2750] shrink-0">
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
        <div ref="bodyScrollRef" class="overflow-y-auto px-5 py-4 flex-1 overscroll-contain">
          <slot />
        </div>

        <!-- Footer / Action bar -->
        <div v-if="$slots.footer" class="border-t border-slate-200 dark:border-[#1a2750] p-4 shrink-0">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
