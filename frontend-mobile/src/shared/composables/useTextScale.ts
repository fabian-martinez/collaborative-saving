import { ref, computed } from 'vue';

const TEXT_SCALE_KEY = 'cs_mobile_text_scale';

export const TEXT_SCALE_OPTIONS = [100, 115, 130, 145] as const;
export type TextScaleLevel = typeof TEXT_SCALE_OPTIONS[number];

// Obtener valor inicial guardado en localStorage
const savedScale = typeof localStorage !== 'undefined'
  ? parseInt(localStorage.getItem(TEXT_SCALE_KEY) || '100', 10)
  : 100;

const initialScale: TextScaleLevel = (TEXT_SCALE_OPTIONS as readonly number[]).includes(savedScale)
  ? (savedScale as TextScaleLevel)
  : 100;

const currentScale = ref<TextScaleLevel>(initialScale);
const isScaleSheetOpen = ref(false);

function applyScale(scale: TextScaleLevel) {
  if (typeof document !== 'undefined') {
    const baseFontSize = 16;
    const computedFontSize = (baseFontSize * scale) / 100;
    document.documentElement.style.fontSize = `${computedFontSize}px`;

    // Limpiar clases previas
    TEXT_SCALE_OPTIONS.forEach((opt) => {
      document.documentElement.classList.remove(`text-scale-${opt}`);
    });

    if (scale > 100) {
      document.documentElement.classList.add(`text-scale-${scale}`);
      document.documentElement.classList.add('text-scale-active');
    } else {
      document.documentElement.classList.remove('text-scale-active');
    }
  }
}

// Aplicar inmediatamente al cargar
applyScale(currentScale.value);

export function useTextScale() {
  const isScaled = computed(() => currentScale.value > 100);

  function setScale(scale: TextScaleLevel) {
    currentScale.value = scale;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TEXT_SCALE_KEY, scale.toString());
    }
    applyScale(scale);
  }

  function cycleScale() {
    const idx = TEXT_SCALE_OPTIONS.indexOf(currentScale.value);
    const nextIdx = (idx + 1) % TEXT_SCALE_OPTIONS.length;
    setScale(TEXT_SCALE_OPTIONS[nextIdx]);
  }

  function stepUp() {
    const idx = TEXT_SCALE_OPTIONS.indexOf(currentScale.value);
    if (idx < TEXT_SCALE_OPTIONS.length - 1) {
      setScale(TEXT_SCALE_OPTIONS[idx + 1]);
    }
  }

  function stepDown() {
    const idx = TEXT_SCALE_OPTIONS.indexOf(currentScale.value);
    if (idx > 0) {
      setScale(TEXT_SCALE_OPTIONS[idx - 1]);
    }
  }

  function resetScale() {
    setScale(100);
  }

  function openScaleSheet() {
    isScaleSheetOpen.value = true;
  }

  function closeScaleSheet() {
    isScaleSheetOpen.value = false;
  }

  return {
    currentScale,
    isScaled,
    isScaleSheetOpen,
    options: TEXT_SCALE_OPTIONS,
    setScale,
    cycleScale,
    stepUp,
    stepDown,
    resetScale,
    openScaleSheet,
    closeScaleSheet
  };
}
