import { ref, watch } from 'vue';

const TEXT_SCALE_KEY = 'cs_mobile_text_scale';

// Inicializar estado desde localStorage (por defecto tamaño normal)
const initialIsLarge = typeof localStorage !== 'undefined'
  ? localStorage.getItem(TEXT_SCALE_KEY) === 'large'
  : false;

const isLargeText = ref<boolean>(initialIsLarge);

function applyTextScale(large: boolean) {
  if (typeof document !== 'undefined') {
    if (large) {
      document.documentElement.classList.add('text-scale-lg');
    } else {
      document.documentElement.classList.remove('text-scale-lg');
    }
  }
}

// Aplicar inmediatamente al cargar
applyTextScale(isLargeText.value);

watch(isLargeText, (val) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TEXT_SCALE_KEY, val ? 'large' : 'normal');
  }
  applyTextScale(val);
});

export function useTextScale() {
  function toggleTextScale() {
    isLargeText.value = !isLargeText.value;
  }

  function setTextScale(large: boolean) {
    isLargeText.value = large;
  }

  return {
    isLargeText,
    toggleTextScale,
    setTextScale
  };
}
