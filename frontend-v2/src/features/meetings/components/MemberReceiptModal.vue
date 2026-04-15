<template>
  <dialog class="modal" :class="{ 'modal-open': show }">
    <div class="modal-box max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <button aria-label="Cerrar modal"
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        @click="$emit('close')"
      >
        ✕
      </button>

      <div v-if="loading" class="text-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="mt-4 text-base-content/70">Cargando recibo...</p>
      </div>

      <div
        v-else-if="receiptData"
        :id="receiptModalId"
        class="bg-base-100 p-4 md:p-6 rounded-2xl shadow-lg font-sans print-container"
      >
        <!-- Encabezado del recibo -->
        <div class="text-center border-b pb-4 mb-6">
          <h4 class="text-2xl font-bold mb-2">RECIBO DE OPERACIONES</h4>
          <p class="text-lg font-semibold">{{ receiptData.member.name }}</p>
          <p class="text-sm text-base-content/70 mt-1">
            Reunión #{{ receiptData.meeting.number }} -
            {{ formatDate(receiptData.meeting.date) }}
          </p>
          <p class="text-xs text-base-content/60 mt-2">
            Emitido: {{ formatDate(new Date()) }}
          </p>
        </div>

        <!-- Lista de operaciones -->
        <div class="space-y-4">
          <div
            v-for="operation in receiptData.operations"
            :key="operation.id"
            class="border rounded-lg p-4 space-y-3"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <component
                  :is="getOperationIcon(operation.type)"
                  class="w-5 h-5 text-base-content/70"
                />
                <span class="font-semibold">{{
                  getOperationTypeLabel(operation.type)
                }}</span>
              </div>
              <span class="text-sm text-base-content/70">{{
                formatDateTime(operation.date)
              }}</span>
            </div>

            <p v-if="operation.description" class="text-sm text-base-content/80">
              {{ operation.description }}
            </p>

            <!-- Desglose contable -->
            <div
              v-if="operation.entries && operation.entries.length > 0"
              class="bg-base-200 rounded p-3 space-y-1"
            >
              <div
                v-for="entry in operation.entries"
                :key="entry.id"
                class="flex justify-between text-xs"
              >
                <span class="text-base-content/70">{{
                  formatAccountType(entry.account_type)
                }}</span>
                <span
                  class="font-mono"
                  :class="entry.amount >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ entry.amount >= 0 ? '+' : '' }}{{ formatCurrency(entry.amount) }}
                </span>
              </div>
            </div>

            <!-- Total de la operación -->
            <div
              class="mt-2 pt-2 border-t flex justify-between"
              v-if="operationTotals(operation)"
            >
              <span class="text-sm font-semibold">Total de la operación:</span>
              <span
                class="font-mono font-bold"
                :class="
                  operationTotals(operation).netCash >= 0
                    ? 'text-success'
                    : 'text-error'
                "
              >
                {{ formatCurrency(operationTotals(operation).netCash) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Resumen final -->
        <div class="border-t-2 border-dashed pt-4 mt-6 space-y-2">
          <div class="flex justify-between">
            <span class="font-semibold">Total Ingresos:</span>
            <span class="font-mono text-success">{{
              formatCurrency(receiptData.summary.totalCashIn)
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">Total Egresos:</span>
            <span class="font-mono text-error">{{
              formatCurrency(receiptData.summary.totalCashOut)
            }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Saldo Neto:</span>
            <span
              class="font-mono"
              :class="
                receiptData.summary.netCash >= 0 ? 'text-success' : 'text-error'
              "
            >
              {{ formatCurrency(receiptData.summary.netCash) }}
            </span>
          </div>
        </div>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <p class="text-error">{{ error }}</p>
      </div>

      <!-- Botones de acción -->
      <div class="modal-action">
        <button class="btn btn-ghost" @click="$emit('close')">Cerrar</button>
        <button
          v-if="receiptData"
          class="btn btn-primary"
          @click="printReceipt"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Imprimir Recibo
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @submit.prevent="$emit('close')">
      <button type="submit">cerrar</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  UserPlus,
  Wallet,
  HandCash,
  GraphUp,
  GraphDown,
  Coins,
  StatsReport,
  Alarm,
  User,
} from 'iconoir-vue/regular'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatAccountType,
} from '@/shared/utils/formatters'
import { operationsApi, type Operation } from '@/api/operations.api'
import { membersApi, type Member } from '@/api/members.api'
import { meetingsApi, type Meeting } from '@/api/meetings.api'

const props = defineProps<{
  show: boolean
  memberId: string | null
  meetingId: string
  memberName?: string
  meetingNumber?: number
}>()

defineEmits<{
  close: []
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const operations = ref<Operation[]>([])
const member = ref<Member | null>(null)
const meeting = ref<Meeting | null>(null)

const receiptModalId = 'member-receipt-modal'

const receiptData = computed(() => {
  if (!member.value || !meeting.value || operations.value.length === 0) {
    return null
  }

  // Calcular totales
  const totalCashIn = operations.value.reduce((sum, op) => {
    const opCashIn =
      op.entries
        ?.filter((e) => e.account_type === 'CASH' && e.amount > 0)
        .reduce((s, e) => s + e.amount, 0) || 0
    return sum + opCashIn
  }, 0)

  const totalCashOut = operations.value.reduce((sum, op) => {
    const opCashOut =
      Math.abs(
        op.entries
          ?.filter((e) => e.account_type === 'CASH' && e.amount < 0)
          .reduce((s, e) => s + e.amount, 0) || 0
      ) || 0
    return sum + opCashOut
  }, 0)

  return {
    member: member.value,
    meeting: {
      ...meeting.value,
      number: props.meetingNumber || 0,
    },
    operations: operations.value,
    summary: {
      totalCashIn,
      totalCashOut,
      netCash: totalCashIn - totalCashOut,
    },
  }
})

const operationTotals = (operation: Operation) => {
  if (!operation.entries) return { cashIn: 0, cashOut: 0, netCash: 0 }

  const cashIn =
    operation.entries
      .filter((e) => e.account_type === 'CASH' && e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0) || 0

  const cashOut =
    Math.abs(
      operation.entries
        .filter((e) => e.account_type === 'CASH' && e.amount < 0)
        .reduce((sum, e) => sum + e.amount, 0) || 0
    ) || 0

  return {
    cashIn,
    cashOut,
    netCash: cashIn - cashOut,
  }
}

const getOperationIcon = (type: string) => {
  const icons: Record<string, any> = {
    MONTHLY_PAYMENT: UserPlus,
    LOAN_PAYMENT: Wallet,
    LOAN_DISBURSEMENT: HandCash,
    STOCK_PURCHASE: GraphUp,
    STOCK_WITHDRAWAL: GraphDown,
    DIVIDEND_PAYMENT: Coins,
    ASSET_REVALUATION: StatsReport,
    FEE: Alarm,
  }
  return icons[type] || User
}

const getOperationTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    MONTHLY_PAYMENT: 'Pago Mensual',
    LOAN_PAYMENT: 'Pago de Préstamo',
    LOAN_DISBURSEMENT: 'Desembolso de Préstamo',
    STOCK_PURCHASE: 'Compra de Acciones',
    STOCK_WITHDRAWAL: 'Retiro de Acciones',
    DIVIDEND_PAYMENT: 'Pago de Dividendos',
    ASSET_REVALUATION: 'Revaluación de Activos',
    FEE: 'Multa',
    MANDATORY_CONTRIBUTION: 'Aporte Obligatorio',
    INSURANCE_PAYMENT: 'Pago de Seguro',
  }
  return labels[type] || type
}

const loadReceiptData = async () => {
  if (!props.memberId || !props.meetingId) return

  loading.value = true
  error.value = null

  try {
    // 1. Obtener operaciones del socio en la reunión
    const operationsResponse = await operationsApi.getOperations({
      member_id: props.memberId,
      meeting_id: props.meetingId,
      limit: 1000,
      order_by: 'ASC',
    })
    
    // Obtener operaciones completas con entries si es necesario
    const opsWithEntries = await Promise.all(
      operationsResponse.data.map(async (op) => {
        if (!op.entries || op.entries.length === 0) {
          try {
            return await operationsApi.getOperationById(op.id)
          } catch {
            return op
          }
        }
        return op
      })
    )
    
    operations.value = opsWithEntries

    // 2. Obtener datos del miembro
    if (props.memberName) {
      member.value = {
        id: props.memberId,
        name: props.memberName,
        email: '',
        role: 'member',
        status: 'active',
        registration_date: new Date(),
      } as Member
    } else {
      member.value = await membersApi.getMemberById(props.memberId)
    }

    // 3. Obtener datos de la reunión
    meeting.value = await meetingsApi.getMeetingById(props.meetingId)
  } catch (e) {
    error.value =
      e instanceof Error
        ? e.message
        : 'Error al cargar los datos del recibo'
    console.error('Error loading receipt data:', e)
  } finally {
    loading.value = false
  }
}

const printReceipt = () => {
  window.print()
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal && props.memberId && props.meetingId) {
      loadReceiptData()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
@media print {
  .modal-action,
  .btn {
    display: none !important;
  }
  .modal-box {
    max-height: none;
    overflow: visible;
  }
}
</style>

