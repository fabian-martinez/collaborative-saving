<template>
  <div class="container mx-auto p-4 md:p-6 max-w-7xl">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold text-base-content">Préstamos</h1>
      <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto">
        <select v-model="filterStatus" class="select select-bordered w-full md:w-auto bg-base-100">
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagado</option>
          <option value="consolidated">Consolidado</option>
        </select>
        <select v-model="filterMemberId" class="select select-bordered w-full md:w-auto bg-base-100">
          <option value="">Todos los socios</option>
          <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
        <div class="relative w-full md:w-auto">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar..."
            class="input input-bordered w-full md:w-80 pl-10 bg-base-100"
          />
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
        </div>
      </div>
    </div>
    
    <div class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body p-0 overflow-hidden">
        <LoadingSpinner :loading="loading" class="p-8" />
        <ErrorMessage :error="error" class="m-4" />
        
        <DataTable
          v-if="!loading && !error"
          :data="filteredItems"
          :columns="columns"
          :actions="true"
          :empty-message="searchQuery ? 'No se encontraron préstamos' : 'No hay préstamos registrados'"
          row-key="id"
        >
          <template #actions="{ item }">
            <button @click="viewLoan(item.id)" class="btn btn-primary btn-sm">Ver Detalle</button>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'iconoir-vue/regular'
import { loansApi, type Loan } from '@/api/loans.api'
import { membersApi, type Member } from '@/api/members.api'
import { useSearchableList } from '@/shared/composables/useSearchableList'
import DataTable, { type Column } from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const router = useRouter()
const loans = ref<Loan[]>([])
const members = ref<Member[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const membersMap = computed(() => {
  return members.value.reduce((acc, m) => {
    acc[m.id] = m.name
    return acc
  }, {} as Record<string, string>)
})

const mappedLoans = computed(() => {
  return loans.value.map(l => ({
    ...l,
    memberName: membersMap.value[l.member_id] || l.member_id
  }))
})

const filterStatus = ref('active')
const filterMemberId = ref('')

const filteredByDropdowns = computed(() => {
  return mappedLoans.value.filter(loan => {
    const matchStatus = !filterStatus.value || loan.status.toLowerCase() === filterStatus.value.toLowerCase()
    const matchMember = !filterMemberId.value || loan.member_id === filterMemberId.value
    return matchStatus && matchMember
  })
})

// Búsqueda contextual
const { searchQuery, filteredItems } = useSearchableList<any>(filteredByDropdowns, [
  'loan_type',
  'status',
  'memberName'
])

const columns: Column[] = [
  { key: 'memberName', label: 'Miembro' },
  { key: 'loan_type', label: 'Tipo' },
  { key: 'approved_amount', label: 'Monto Aprobado', format: 'currency' },
  { key: 'outstanding_balance', label: 'Saldo Pendiente', format: 'currency' },
  { key: 'status', label: 'Estado' }
]

onMounted(async () => {
  loading.value = true
  try {
    const [loansData, membersData] = await Promise.all([
      loansApi.getLoans(),
      membersApi.getMembers()
    ])
    loans.value = loansData
    members.value = membersData
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar datos'
  } finally {
    loading.value = false
  }
})

function viewLoan(id: string) {
  router.push(`/loans/${id}`)
}
</script>
