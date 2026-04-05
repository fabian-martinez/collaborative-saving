import { defineStore } from 'pinia'
import { ref } from 'vue'
import { membersApi, type Member } from '@/api/members.api'

export const useMembersStore = defineStore('members', () => {
  const members = ref<Member[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMembers() {
    loading.value = true
    error.value = null
    try {
      members.value = await membersApi.getMembers()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar miembros'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createMember(data: Parameters<typeof membersApi.createMember>[0]) {
    loading.value = true
    error.value = null
    try {
      const newMember = await membersApi.createMember(data)
      members.value.push(newMember)
      return newMember
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al crear miembro'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateMember(id: string, data: Parameters<typeof membersApi.updateMember>[1]) {
    loading.value = true
    error.value = null
    try {
      const updatedMember = await membersApi.updateMember(id, data)
      const index = members.value.findIndex(m => m.id === id)
      if (index !== -1) {
        members.value[index] = updatedMember
      }
      return updatedMember
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al actualizar miembro'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteMember(id: string) {
    loading.value = true
    error.value = null
    try {
      await membersApi.deleteMember(id)
      members.value = members.value.filter(m => m.id !== id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al eliminar miembro'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    members,
    loading,
    error,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember
  }
})
