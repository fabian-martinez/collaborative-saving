import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const role = ref<string | null>(null)

  async function fetchRole() {
    // Para desarrollo, asignamos 'admin' por defecto.
    role.value = 'admin'
  }

  function clearRole() {
    role.value = null
  }

  return { role, fetchRole, clearRole }
}) 