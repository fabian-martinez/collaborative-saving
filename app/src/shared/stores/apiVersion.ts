import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'api_version'
const DEFAULT_VERSION = 'v1'

export const useApiVersionStore = defineStore('apiVersion', () => {
  // Leer desde localStorage o usar valor por defecto
  const storedVersion = localStorage.getItem(STORAGE_KEY) || DEFAULT_VERSION
  const version = ref<'v1' | 'v2'>(storedVersion as 'v1' | 'v2')

  // Computed para saber si está usando v2
  const isV2 = computed(() => version.value === 'v2')

  // Función para cambiar la versión
  function setVersion(newVersion: 'v1' | 'v2') {
    version.value = newVersion
    localStorage.setItem(STORAGE_KEY, newVersion)
  }

  // Función para alternar entre v1 y v2
  function toggleVersion() {
    const newVersion = version.value === 'v1' ? 'v2' : 'v1'
    setVersion(newVersion)
  }

  return {
    version,
    isV2,
    setVersion,
    toggleVersion,
  }
})

