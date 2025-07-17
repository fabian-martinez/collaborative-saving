<template>
  <div>
    <!-- Tarjetas de resumen -->
    <div class="container mx-auto pt-10 pb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="stat bg-white shadow rounded-xl border border-blue-100">
          <div class="stat-figure text-primary">
            <User class="w-7 h-7" />
          </div>
          <div class="stat-title text-gray-500">Total Socios</div>
          <div class="stat-value text-blue-900">{{ members.length }}</div>
        </div>
        <div class="stat bg-white shadow rounded-xl border border-green-100">
          <div class="stat-figure text-green-600">
            <User class="w-7 h-7" />
          </div>
          <div class="stat-title text-gray-500">Socios Activos</div>
          <div class="stat-value text-green-700">{{ activeMembers }}</div>
        </div>
        <div class="stat bg-white shadow rounded-xl border border-red-100">
          <div class="stat-figure text-red-500">
            <User class="w-7 h-7" />
          </div>
          <div class="stat-title text-gray-500">Socios Inactivos</div>
          <div class="stat-value text-red-600">{{ inactiveMembers }}</div>
        </div>
      </div>

      <!-- Buscador -->
      <div class="mb-4 flex items-center justify-between">
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nombre, email o cédula..."
          class="input input-bordered w-full max-w-md"
        />
        <span class="ml-4 text-gray-500 text-sm">{{ filteredMembers.length }} resultados</span>
      </div>

      <!-- Tabla de socios -->
      <div class="overflow-x-auto bg-white rounded-xl shadow border border-blue-100">
        <table class="table w-full">
          <thead class="bg-blue-50">
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Cédula</th>
              <th>Estado</th>
              <th>Fecha Registro</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center">Cargando socios...</td>
            </tr>
            <tr v-else-if="error">
              <td colspan="6" class="text-center text-error">Error al cargar los socios.</td>
            </tr>
            <tr v-else-if="filteredMembers.length === 0">
              <td colspan="6" class="text-center">No hay socios registrados.</td>
            </tr>
            <tr v-for="member in filteredMembers" :key="member.id">
              <td class="font-semibold">{{ member.name }}</td>
              <td>{{ member.email }}</td>
              <td>{{ member.identificationNumber }}</td>
              <td>
                <span
                  class="badge flex items-center gap-1 px-2 py-1 text-xs"
                  :class="!member.deletedAt ? 'badge-success bg-green-100 text-green-700' : 'badge-error bg-red-100 text-red-600'"
                >
                  <component :is="User" class="w-4 h-4" />
                  {{ !member.deletedAt ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <span class="flex items-center gap-1">
                  <Calendar class="w-4 h-4 text-blue-400" />
                  <span>{{ formatDate(member.createdAt) }}</span>
                </span>
              </td>
              <td class="flex items-center justify-center gap-2">
                <button class="btn btn-ghost btn-xs" @click="viewMember(member.id)" title="Detalles">
                  <Page class="w-5 h-5 text-blue-700" />
                </button>
                <button class="btn btn-ghost btn-xs" @click="editMember(member)" title="Editar">
                  <EditPencil class="w-5 h-5 text-green-600" />
                </button>
                <button class="btn btn-ghost btn-xs" @click="deleteMember(member.id)" title="Eliminar">
                  <Trash class="w-5 h-5 text-red-500" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Botón de Acción Flotante para Añadir Socio -->
    <button class="btn btn-primary btn-circle fixed bottom-10 right-10 shadow-lg z-10" @click="openCreateModal" aria-label="Añadir socio">
      <Plus class="h-6 w-6" />
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import CreateMemberModal from '@/features/members/components/CreateMemberModal.vue'
import type { Member } from '@/features/members/types'
import { User, Calendar, Page, EditPencil, Trash, Plus } from 'iconoir-vue/regular'

const members = ref<Member[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const isMemberModalOpen = ref(false)
const router = useRouter()
const selectedMember = ref<Member | null>(null)
const search = ref('')

const filteredMembers = computed(() => {
  if (!search.value) return members.value
  const s = search.value.toLowerCase()
  return members.value.filter(m =>
    m.name.toLowerCase().includes(s) ||
    m.email.toLowerCase().includes(s) ||
    m.identificationNumber.toLowerCase().includes(s)
  )
})

const activeMembers = computed(() => members.value.filter(m => !m.deletedAt).length)
const inactiveMembers = computed(() => members.value.filter(m => !!m.deletedAt).length)

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

function formatDate(date: string) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(() => {
  fetchMembers()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style> 