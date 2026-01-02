<template>
  <div class="space-y-4">
    <!-- Filtros -->
    <div class="flex flex-col md:flex-row gap-4">
      <select v-model="filterType" class="select select-bordered">
        <option value="">Todas</option>
        <option value="MONTHLY_PAYMENT">Aportes Mensuales</option>
        <option value="LOAN_DISBURSEMENT">Desembolsos</option>
        <option value="LOAN_PAYMENT">Pagos de Préstamos</option>
        <option value="STOCK_PURCHASE">Compras de Acciones</option>
        <option value="ASSET_REVALUATION">Revalorizaciones</option>
      </select>
      <select v-model="filterMeetingId" class="select select-bordered flex-1">
        <option value="">Todas las reuniones</option>
        <option
          v-for="meeting in meetingsList"
          :key="meeting.id"
          :value="meeting.id"
        >
          Reunión #{{ getMeetingNumber(meeting.id) }} - {{ formatDate(meeting.date) }}
        </option>
      </select>
      <select v-model="filterMemberId" class="select select-bordered flex-1">
        <option value="">Todos los miembros</option>
        <option
          v-for="member in membersList"
          :key="member.id"
          :value="member.id"
        >
          {{ member.name }}
        </option>
      </select>
    </div>

    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />

    <!-- Lista de Operaciones -->
    <div v-if="!loading && !error" class="space-y-4">
      <div
        v-for="group in groupedOperations"
        :key="group.meetingId"
        class="card bg-base-100 shadow-lg"
      >
        <div class="card-body">
          <div class="flex items-center gap-2 mb-4">
            <span class="badge badge-primary">Reunión #{{ group.meetingNumber }}</span>
            <span class="text-sm text-base-content/70">
              {{ formatDate(group.meetingDate) }}
            </span>
          </div>
          
          <div class="space-y-2">
            <div
              v-for="operation in group.operations"
              :key="operation.id"
              class="bg-base-200 rounded-lg overflow-hidden"
            >
              <div
                class="flex items-center gap-4 p-3 hover:bg-base-300 transition-colors cursor-pointer"
                @click="toggleOperation(operation.id)"
              >
                <div class="flex-1">
                  <div class="font-semibold">{{ getOperationLabel(operation.type) }}</div>
                  <div class="text-sm text-base-content/70">
                    {{ operation.description || 'Sin descripción' }}
                  </div>
                  <div class="text-xs text-base-content/50 mt-1">
                    {{ formatDate(operation.date) }} · {{ generateOperationCode(operation) }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold">{{ formatCurrency(getOperationAmount(operation)) }}</div>
                  <div class="text-xs text-base-content/50">
                    {{ getEntriesCount(operation) }} asientos
                  </div>
                </div>
                <div class="flex-shrink-0">
                  <svg
                    class="w-5 h-5 transition-transform"
                    :class="{ 'rotate-90': expandedOperations.has(operation.id) }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              <!-- Tabla de Asientos Contables -->
              <div
                v-if="expandedOperations.has(operation.id) && operation.entries && operation.entries.length > 0"
                class="border-t border-base-300 p-4 bg-base-100"
              >
                <div class="mb-2 font-semibold text-sm">ASIENTOS CONTABLES</div>
                <div class="overflow-x-auto">
                  <table class="table table-sm w-full">
                    <thead>
                      <tr>
                        <th class="text-left">Código</th>
                        <th class="text-left">Cuenta</th>
                        <th class="text-right">Debe</th>
                        <th class="text-right">Haber</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="entry in operation.entries" :key="entry.id">
                        <td>{{ getAccountCode(entry.account_type) }}</td>
                        <td>{{ getAccountName(entry.account_type) }}</td>
                        <td class="text-right">
                          {{ entry.amount > 0 ? formatCurrency(entry.amount) : '-' }}
                        </td>
                        <td class="text-right">
                          {{ entry.amount < 0 ? formatCurrency(Math.abs(entry.amount)) : '-' }}
                        </td>
                      </tr>
                      <tr class="font-bold border-t-2 border-base-300">
                        <td colspan="2">Total:</td>
                        <td class="text-right">{{ formatCurrency(getTotalDebit(operation)) }}</td>
                        <td class="text-right">{{ formatCurrency(getTotalCredit(operation)) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="groupedOperations.length === 0" class="text-center py-8 text-base-content/60">
        No se encontraron operaciones
      </div>
    </div>

    <Pagination
      v-if="operations.total > 0"
      :page="page"
      :total-pages="totalPages"
      :total="operations.total"
      :start-index="(page - 1) * limit + 1"
      :end-index="Math.min(page * limit, operations.total)"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { operationsApi, type Operation } from '@/api/operations.api'
import { meetingsApi, type Meeting } from '@/api/meetings.api'
import { membersApi, type Member } from '@/api/members.api'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import Pagination from '@/shared/components/Pagination.vue'
import { ACCOUNT_TYPE_LABELS, type AccountType } from '@/features/ledger/constants/account-types'

const loading = ref(false)
const error = ref<string | null>(null)
const operations = ref<{ data: Operation[]; page: number; limit: number; total: number }>({
  data: [],
  page: 1,
  limit: 10,
  total: 0
})
const page = ref(1)
const limit = ref(10)
const filterType = ref('')
const filterMeetingId = ref('')
const filterMemberId = ref('')
const meetings = ref<Map<string, { date: Date; number: number }>>(new Map())
const meetingsList = ref<Meeting[]>([])
const membersList = ref<Member[]>([])
const expandedOperations = ref<Set<string>>(new Set())

const totalPages = computed(() => Math.ceil(operations.value.total / limit.value))

// Agrupar operaciones por reunión
const groupedOperations = computed(() => {
  const groups = new Map<string, {
    meetingId: string
    meetingNumber: number
    meetingDate: Date
    operations: Operation[]
  }>()

  operationsFiltered.value.forEach(op => {
    const meeting = meetings.value.get(op.meeting_id)
    if (!meeting) return

    if (!groups.has(op.meeting_id)) {
      groups.set(op.meeting_id, {
        meetingId: op.meeting_id,
        meetingNumber: meeting.number,
        meetingDate: meeting.date,
        operations: []
      })
    }
    groups.get(op.meeting_id)!.operations.push(op)
  })

  return Array.from(groups.values()).sort((a, b) => 
    b.meetingDate.getTime() - a.meetingDate.getTime()
  )
})

const getOperationLabel = (type: string) => {
  const labels: Record<string, string> = {
    MONTHLY_PAYMENT: 'Aporte mensual socios',
    LOAN_DISBURSEMENT: 'Desembolso préstamo',
    LOAN_PAYMENT: 'Pago cuota préstamo',
    STOCK_PURCHASE: 'Compra de acciones',
    ASSET_REVALUATION: 'Revalorización acciones',
    INTEREST_ACCRUAL: 'Intereses generados',
    PROVISION: 'Provisión cartera'
  }
  return labels[type] || type
}

const generateOperationCode = (operation: Operation): string => {
  const typePrefix: Record<string, string> = {
    MONTHLY_PAYMENT: 'APO',
    LOAN_DISBURSEMENT: 'PRE',
    LOAN_PAYMENT: 'PAG',
    ASSET_REVALUATION: 'REV',
    INTEREST_ACCRUAL: 'INT',
    PROVISION: 'PRC'
  }
  const prefix = typePrefix[operation.type] || 'OP'
  const date = new Date(operation.date)
  const year = date.getFullYear()
  const number = operation.id.substring(0, 3).toUpperCase()
  return `${prefix}-${year}-${number}`
}

// Mapeo de códigos de cuenta
const ACCOUNT_CODES: Record<string, string> = {
  CASH: '1101',
  LOANS_RECEIVABLE: '1201',
  INVESTMENT_IN_STOCKS: '1301',
  DIVIDENDS_PAYABLE: '2101',
  STOCK_CAPITAL: '3101',
  STOCK_TRANSFER: '3102',
  REVALUATION_SURPLUS: '3103',
  MEMBER_EQUITY: '3104',
  ACCUMULATED_SURPLUS: '3105',
  INTEREST_INCOME: '4101',
  FEE_INCOME: '4102',
  MANDATORY_CONTRIBUTION_INCOME: '4103',
  INSURANCE_INCOME: '4104',
  DIVIDEND_EXPENSE: '5101',
  OTHER_EXPENSES: '5102',
  NOVELTY_LOSS: '5103'
}

const getAccountCode = (accountType: string): string => {
  return ACCOUNT_CODES[accountType] || '---'
}

const getAccountName = (accountType: string): string => {
  return ACCOUNT_TYPE_LABELS[accountType as AccountType] || accountType
}

const getOperationAmount = (operation: Operation): number => {
  if (!operation.entries || operation.entries.length === 0) return 0
  // Retornar el total de débitos (montos positivos)
  return operation.entries
    .filter(entry => entry.amount > 0)
    .reduce((sum, entry) => sum + entry.amount, 0)
}

const getEntriesCount = (operation: Operation): number => {
  return operation.entries?.length || 0
}

const getTotalDebit = (operation: Operation): number => {
  if (!operation.entries || operation.entries.length === 0) return 0
  return operation.entries
    .filter(entry => entry.amount > 0)
    .reduce((sum, entry) => sum + entry.amount, 0)
}

const getTotalCredit = (operation: Operation): number => {
  if (!operation.entries || operation.entries.length === 0) return 0
  return operation.entries
    .filter(entry => entry.amount < 0)
    .reduce((sum, entry) => sum + Math.abs(entry.amount), 0)
}

const toggleOperation = (operationId: string) => {
  if (expandedOperations.value.has(operationId)) {
    expandedOperations.value.delete(operationId)
  } else {
    expandedOperations.value.add(operationId)
  }
}

const getMeetingNumber = (meetingId: string): number => {
  // Primero intentar obtener del mapa
  const meeting = meetings.value.get(meetingId)
  if (meeting) return meeting.number
  
  // Si no está en el mapa, calcular desde la lista completa
  const index = meetingsList.value.findIndex(m => m.id === meetingId)
  if (index !== -1) {
    return meetingsList.value.length - index
  }
  
  return 0
}

async function fetchOperations() {
  loading.value = true
  error.value = null
  try {
    operations.value = await operationsApi.getOperations({
      page: page.value,
      limit: limit.value,
      type: filterType.value || undefined,
      meeting_id: filterMeetingId.value || undefined,
      member_id: filterMemberId.value || undefined,
      order_by: 'DESC'
    })

    // Obtener información de reuniones
    const meetingIds = [...new Set(operations.value.data.map(op => op.meeting_id))]
    const allMeetings = await meetingsApi.getMeetings()
    
    allMeetings.forEach((meeting, index) => {
      if (meetingIds.includes(meeting.id)) {
        meetings.value.set(meeting.id, {
          date: new Date(meeting.date),
          number: allMeetings.length - index
        })
      }
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar operaciones'
  } finally {
    loading.value = false
  }
}

async function loadMeetingsAndMembers() {
  try {
    const [meetings, members] = await Promise.all([
      meetingsApi.getMeetings(),
      membersApi.getMembers()
    ])
    
    meetingsList.value = meetings
    membersList.value = members.sort((a, b) => a.name.localeCompare(b.name))
    
    // Actualizar el mapa de reuniones con todos los datos
    meetings.forEach((meeting, index) => {
      meetings.value.set(meeting.id, {
        date: new Date(meeting.date),
        number: meetings.length - index
      })
    })
  } catch (e) {
    console.error('Error al cargar reuniones y miembros:', e)
  }
}

function handlePageChange(newPage: number) {
  page.value = newPage
  fetchOperations()
}

watch([filterType, filterMeetingId, filterMemberId], () => {
  // Resetear a la primera página cuando cambien los filtros
  page.value = 1
  fetchOperations()
})

onMounted(async () => {
  await loadMeetingsAndMembers()
  await fetchOperations()
})

// Función de exportación
async function exportData() {
  // Obtener todas las operaciones sin paginación para exportar
  try {
    const allOperations = await operationsApi.getOperations({
      limit: 10000,
      type: filterType.value || undefined,
      meeting_id: filterMeetingId.value || undefined,
      member_id: filterMemberId.value || undefined,
      order_by: 'DESC'
    })

    // Obtener todas las reuniones para mapear
    const allMeetings = await meetingsApi.getMeetings()
    const meetingsMap = new Map<string, { date: Date; number: number }>()
    
    allMeetings.forEach((meeting, index) => {
      meetingsMap.set(meeting.id, {
        date: new Date(meeting.date),
        number: allMeetings.length - index
      })
    })

    const exportData: Record<string, unknown>[] = allOperations.data.map(op => {
      const meeting = meetingsMap.get(op.meeting_id)
      return {
        'Código': generateOperationCode(op),
        'Tipo': getOperationLabel(op.type),
        'Descripción': op.description || 'Sin descripción',
        'Reunión': meeting ? `Reunión #${meeting.number}` : '',
        'Fecha Reunión': meeting ? formatDate(meeting.date) : '',
        'Fecha Operación': formatDate(op.date),
        'ID Operación': op.id
      }
    })

    const { exportToCSV } = await import('@/shared/utils/export')
    exportToCSV(exportData, `operaciones-${new Date().toISOString().split('T')[0]}`)
  } catch (e) {
    console.error('Error al exportar operaciones:', e)
    alert('Error al exportar operaciones')
  }
}

defineExpose({
  exportData
})
</script>

