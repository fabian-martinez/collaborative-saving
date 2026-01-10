<template>
  <div class="p-8">
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
      <template #actions="{ item }">
        <button @click="viewMember(item.id)" class="btn btn-sm btn-primary">Ver</button>
        <button @click="editMember(item)" class="btn btn-sm btn-primary">Editar</button>
        <button @click="deleteMember(item.id)" class="btn btn-sm btn-error">Eliminar</button>
      </template>
    </DataTable>

    <Modal v-if="showCreateModal" title="Nuevo Miembro" @close="showCreateModal = false">
      <MemberForm @submit="handleCreate" @cancel="showCreateModal = false" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'iconoir-vue/regular'
import { useMembersStore } from '../stores/members'
import { useSearchableList } from '@/shared/composables/useSearchableList'
import DataTable from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import Modal from '@/shared/components/Modal.vue'
import MemberForm from '../components/MemberForm.vue'
import type { Member } from '@/api/members.api'

const router = useRouter()
const store = useMembersStore()
const showCreateModal = ref(false)

// Búsqueda contextual
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
  { key: 'registration_date', label: 'Fecha de Registro', format: 'date' }
]

onMounted(() => {
  store.fetchMembers()
})

function viewMember(id: string) {
  router.push(`/members/${id}`)
}

function editMember(member: Member) {
  // TODO: Implementar edición
  console.log('Edit member', member)
}

async function deleteMember(id: string) {
  if (confirm('¿Está seguro de eliminar este miembro?')) {
    try {
      await store.deleteMember(id)
    } catch (e) {
      console.error('Error deleting member', e)
    }
  }
}

async function handleCreate(data: Parameters<typeof store.createMember>[0]) {
  try {
    await store.createMember(data)
    showCreateModal.value = false
  } catch (e) {
    console.error('Error creating member', e)
  }
}
</script>


