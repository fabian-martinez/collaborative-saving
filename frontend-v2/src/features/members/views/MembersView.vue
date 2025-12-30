<template>
  <div class="members-view">
    <div class="view-header">
      <h1>Miembros</h1>
      <button @click="showCreateModal = true" class="create-button">Nuevo Miembro</button>
    </div>

    <LoadingSpinner :loading="store.loading" message="Cargando miembros..." />
    <ErrorMessage :error="store.error" />

    <DataTable
      v-if="!store.loading && !store.error"
      :data="store.members"
      :columns="columns"
      :actions="true"
      empty-message="No hay miembros registrados"
      row-key="id"
    >
      <template #actions="{ item }">
        <button @click="viewMember(item.id)" class="action-button">Ver</button>
        <button @click="editMember(item)" class="action-button">Editar</button>
        <button @click="deleteMember(item.id)" class="action-button danger">Eliminar</button>
      </template>
    </DataTable>

    <Modal v-if="showCreateModal" title="Nuevo Miembro" @close="showCreateModal = false">
      <MemberForm @submit="handleCreate" @cancel="showCreateModal = false" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMembersStore } from '../stores/members'
import DataTable from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import Modal from '@/shared/components/Modal.vue'
import MemberForm from '../components/MemberForm.vue'
import type { Member } from '@/api/members.api'

const router = useRouter()
const store = useMembersStore()
const showCreateModal = ref(false)

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

<style scoped>
.members-view {
  padding: 2rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.view-header h1 {
  margin: 0;
}

.create-button {
  background-color: #27ae60;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
}

.create-button:hover {
  background-color: #229954;
}

.action-button {
  padding: 0.25rem 0.5rem;
  margin: 0 0.25rem;
  font-size: 0.875rem;
  background-color: #3498db;
  color: white;
  border-radius: 4px;
}

.action-button:hover {
  background-color: #2980b9;
}

.action-button.danger {
  background-color: #e74c3c;
}

.action-button.danger:hover {
  background-color: #c0392b;
}
</style>

