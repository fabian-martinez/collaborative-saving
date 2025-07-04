import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/supabase'

export const useUserStore = defineStore('user', () => {
  const role = ref<string | null>(null)

  async function fetchRole() {
    try {
      const { data, error } = await supabase.rpc('get_my_role')
      if (error) throw error
      role.value = data
    } catch (err) {
      console.error('Error fetching user role:', err)
      role.value = null
    }
  }

  function clearRole() {
    role.value = null
  }

  return { role, fetchRole, clearRole }
}) 