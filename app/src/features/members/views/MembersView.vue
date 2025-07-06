<template>
  <div>
    <div class="container mx-auto pt-12 pb-24">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Administración de Socios</h1>
      </div>

      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Cédula</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="text-center">Cargando socios...</td>
            </tr>
            <tr v-else-if="error">
              <td colspan="4" class="text-center text-error">Error al cargar los socios.</td>
            </tr>
            <tr v-else-if="members.length === 0">
              <td colspan="4" class="text-center">No hay socios registrados.</td>
            </tr>
            <tr v-for="member in members" :key="member.id">
              <td>{{ member.name }}</td>
              <td>{{ member.email }}</td>
              <td>{{ member.identificationNumber }}</td>
              <td class="flex items-center justify-center gap-2">
                <button class="btn btn-ghost btn-xs" @click="viewMember(member.id)">Detalles</button>
                <button class="btn btn-ghost btn-xs" @click="editMember(member)">Editar</button>
                <button class="btn btn-error btn-xs" @click="deleteMember(member.id)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Botón de Acción Flotante para Añadir Socio -->
    <button class="btn btn-primary btn-circle fixed bottom-10 right-10 shadow-lg z-10" @click="openCreateModal" aria-label="Añadir socio">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <!-- Modal para Crear/Editar Socio -->
    <CreateMemberModal
      v-model="isMemberModalOpen"
      :member-to-edit="selectedMember"
      @member-created="handleMemberUpsert"
      @member-updated="handleMemberUpsert"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import CreateMemberModal from '@/features/members/components/CreateMemberModal.vue'
import type { Member } from '@/features/members/types'

const members = ref<Member[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const isMemberModalOpen = ref(false)
const router = useRouter()

const selectedMember = ref<Member | null>(null)

async function fetchMembers() {
  loading.value = true
  error.value = null
  try {
    const response = await api.get<Member[]>('/members')
    members.value = response
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'An unknown error occurred.'
    console.error('Failed to fetch members:', e)
  } finally {
    loading.value = false
  }
}

function handleMemberUpsert() {
  fetchMembers();
}

function viewMember(memberId: string) {
  router.push({ name: 'member-details', params: { id: memberId } })
}

function openCreateModal() {
  selectedMember.value = null
  isMemberModalOpen.value = true
}

function editMember(member: Member) {
  selectedMember.value = member
  isMemberModalOpen.value = true
}

async function deleteMember(memberId: string) {
  if (confirm('¿Estás seguro de que quieres eliminar este socio?')) {
    try {
      await api.delete(`/members/${memberId}`)
      await fetchMembers() // Recargar la lista de socios
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Ocurrió un error desconocido.'
      alert(`Error al eliminar el socio: ${message}`)
      console.error('Failed to delete member:', e)
    }
  }
}

onMounted(() => {
  fetchMembers()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style> 