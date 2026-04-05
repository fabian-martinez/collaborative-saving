import { ref } from 'vue'

// Estado compartido usando patrón singleton
const isCollapsed = ref(false)  // Estado compactado en desktop
const isMobileOpen = ref(false) // Estado abierto en móvil

// Methods
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function toggleMobile() {
  isMobileOpen.value = !isMobileOpen.value
}

function closeMobile() {
  isMobileOpen.value = false
}

export function useSidebar() {
  // Return objeto consistente con estado compartido
  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    toggleMobile,
    closeMobile
  }
}
