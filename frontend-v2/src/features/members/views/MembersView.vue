<template>
  <div class="members-view p-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="m-0">Miembros</h1>
      <div class="flex items-center gap-4">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre, email o identificación..."
            class="input input-bordered w-64 pl-10"
          />
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <button @click="showCreateModal = true" class="btn btn-success">Nuevo Miembro</button>
      </div>
    </div>

    <LoadingSpinner :loading="store.loading" message="Cargando miembros..." />
    <ErrorMessage :error="store.error" />

    <DataTable
      v-if="!store.loading && !store.error"
      :data="filteredItems"
      :columns="columns"
      :actions="true"
      :empty-message="searchQuery ? 'No se encontraron miembros' : 'No hay miembros registrados'"
      row-key="id"
    >
      <!-- Date Slot -->
      <template #cell-registration_date="{ item }">
        <span class="font-medium">{{ formatDate(item.registration_date) }}</span>
      </template>

      <!-- Status Slot -->
      <template #cell-status="{ item }">
        <span class="badge" :class="getStatusBadgeClass(item.status)">
          {{ formatStatus(item.status) }}
        </span>
      </template>

      <!-- Actions Slot -->
      <template #actions="{ item }">
        <div class="flex gap-2">
           <button @click="viewMember(item.id)" class="btn btn-sm btn-ghost" title="Ver detalles">
            <Eye class="w-4 h-4" />
          </button>
          <button @click="editMember(item)" class="btn btn-sm btn-ghost" title="Editar">
             <EditPencil class="w-4 h-4" />
          </button>
          <button @click="confirmDelete(item)" class="btn btn-sm btn-ghost text-error" title="Eliminar">
            <Trash class="w-4 h-4" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Create Modal -->
    <Modal :show="showCreateModal" title="Nuevo Miembro" @close="showCreateModal = false">
      <MemberForm @submit="handleCreate" @cancel="showCreateModal = false" />
    </Modal>

    <!-- Edit Modal -->
    <Modal :show="showEditModal" title="Editar Miembro" @close="showEditModal = false">
      <MemberForm
        v-if="memberToEdit"
        :initial-data="memberToEdit"
        @submit="handleEdit"
        @cancel="showEditModal = false"
      />
    </Modal>

     <!-- Delete Confirmation Modal -->
    <Modal :show="showDeleteModal" title="Confirmar Eliminación" @close="cancelDelete">
      <div class="p-4">
        <p class="mb-4">¿Está seguro de que desea eliminar al miembro <strong>{{ memberToDelete?.name }}</strong>?</p>
        <p class="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
        <div class="flex justify-end gap-3">
          <button @click="cancelDelete" class="btn btn-ghost">Cancelar</button>
          <button @click="handleDelete" class="btn btn-error" :disabled="isDeleting">
            {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
// 1. Vue
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 2. Third-party libraries
import { Search, Eye, EditPencil, Trash } from 'iconoir-vue/regular'

// 3. Stores/Composables
import { useMembersStore } from '../stores/members'
import { useSearchableList } from '@/shared/composables/useSearchableList'

// 4. Components
import DataTable from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import Modal from '@/shared/components/Modal.vue'
import MemberForm from '../components/MemberForm.vue'

// 5. Types
import type { Member } from '@/api/members.api'

// 6. Utils/Formatters
import { formatDate } from '@/shared/utils/formatters'

const router = useRouter()
const store = useMembersStore()

// State
const showCreateModal = ref(false)
const showEditModal = ref(false)
const memberToEdit = ref<Member | null>(null)
const showDeleteModal = ref(false)
const memberToDelete = ref<Member | null>(null)
const isDeleting = ref(false)

// Contextual search
const membersRef = computed(() => store.members)
const { searchQuery, filteredItems } = useSearchableList<Member>(membersRef, [
  'name',
  'email',
  'identification_number'
])

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'identification_number', label: 'Identificación' },
  { key: 'status', label: 'Estado' },
  { key: 'registration_date', label: 'Fecha de Registro' }
]

// Lifecycle
onMounted(() => {
  store.fetchMembers()
})

// Methods
function getStatusBadgeClass(status: string): string {
  // Ajustar según los estados reales de Member
  return status === 'active' ? 'badge-success' : 'badge-ghost'
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    // Agregar otros estados si existen
  }
  return map[status] || status
}

function viewMember(id: string) {
  router.push(`/members/${id}`)
}

function editMember(member: Member) {
  memberToEdit.value = member
  showEditModal.value = true
}

async function handleEdit(data: Parameters<typeof store.updateMember>[1]) {
  if (!memberToEdit.value) return

  try {
    await store.updateMember(memberToEdit.value.id, data)
    showEditModal.value = false
    memberToEdit.value = null
  } catch (e) {
    // Error manejado por store/componente
  }
}

function confirmDelete(member: Member) {
  memberToDelete.value = member
  showDeleteModal.value = true
}

function cancelDelete() {
  showDeleteModal.value = false
  memberToDelete.value = null
}

async function handleDelete() {
  if (!memberToDelete.value) return

  isDeleting.value = true
  try {
    await store.deleteMember(memberToDelete.value.id)
    showDeleteModal.value = false
    memberToDelete.value = null
  } catch (e) {
    // El store maneja el error globalmente, pero podríamos mostrar toast aquí
  } finally {
    isDeleting.value = false
  }
}

async function handleCreate(data: Parameters<typeof store.createMember>[0]) {
  try {
    await store.createMember(data)
    showCreateModal.value = false
  } catch (e) {
    // Error manejado por store/componente
  }
}
</script>
