import { ref, watch } from 'vue';

const THEME_KEY = 'cs_mobile_theme';

// Inicializar estado desde localStorage o default a dark
const initialIsDark = localStorage.getItem(THEME_KEY) !== null
  ? localStorage.getItem(THEME_KEY) === 'dark'
  : true; // Default dark mode premium

const isDark = ref<boolean>(initialIsDark);

function applyTheme(dark: boolean) {
  if (typeof document !== 'undefined') {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }

    // Actualizar color de la barra de estado móvil
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', dark ? '#080e22' : '#f8fafc');
    }
  }
}

// Aplicar inmediatamente al cargar
applyTheme(isDark.value);

watch(isDark, (val) => {
  localStorage.setItem(THEME_KEY, val ? 'dark' : 'light');
  applyTheme(val);
});

export function useThemeMode() {
  function toggleTheme() {
    isDark.value = !isDark.value;
  }

  function setTheme(dark: boolean) {
    isDark.value = dark;
  }

  return {
    isDark,
    toggleTheme,
    setTheme
  };
}
