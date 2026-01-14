<template>
  <div class="w-full max-w-full min-w-0 min-h-[calc(100vh-4rem)] overflow-x-hidden box-border">
    <LoadingSpinner :loading="store.loading && !store.member" message="Cargando miembro..." />
    <ErrorMessage :error="store.error" />

    <div v-if="store.member && !store.loading" class="w-full max-w-full min-w-0 overflow-x-hidden box-border">
      <!-- Header del Socio -->
      <div class="card bg-base-100 shadow-lg mb-6 w-full max-w-full min-w-0 box-border">
        <div class="card-body w-full max-w-full min-w-0 overflow-x-hidden box-border">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <button @click="$router.push('/members')" class="btn btn-ghost self-start sm:self-auto">← Volver</button>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8 text-center sm:text-left">
            <div class="shrink-0">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl sm:text-4xl font-bold shadow-lg">
                {{ getInitials(store.member.name) }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl sm:text-4xl font-bold text-base-content mb-2 break-words">{{ store.member.name }}</h1>
              <div class="flex gap-2">
                <span :class="['badge', store.member.status === 'active' ? 'badge-success' : 'badge-neutral']">
                  {{ store.member.status === 'active' ? 'ACTIVO' : store.member.status.toUpperCase() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Summary Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 w-full max-w-full min-w-0 overflow-x-hidden box-border">
          <div class="stat bg-base-100 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow" @click="activeTab = 'stocks'">
            <div class="stat-figure text-primary text-2xl">📊</div>
            <div class="stat-title">Total en Acciones</div>
            <div class="stat-value text-primary font-mono">{{ formatCurrency(store.totalInStocks) }}</div>
          </div>
          <div class="stat bg-base-100 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow" @click="activeTab = 'loans'">
            <div class="stat-figure text-primary text-2xl">💰</div>
            <div class="stat-title">Préstamos Activos</div>
            <div class="stat-value text-primary font-mono">{{ formatCurrency(store.activeLoansTotalAmount) }}</div>
            <div class="stat-desc">{{ store.activeLoansCount }} préstamo{{ store.activeLoansCount !== 1 ? 's' : '' }}</div>
          </div>
          <div class="stat bg-base-100 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow" @click="activeTab = 'dues'">
            <div class="stat-figure text-primary text-2xl">📋</div>
            <div class="stat-title">Cuotas Pendientes</div>
            <div class="stat-value text-primary font-mono">{{ formatCurrency(store.totalPendingDues) }}</div>
          </div>
          <div class="stat bg-base-100 rounded-lg shadow-md">
            <div class="stat-figure text-primary text-2xl">🛡️</div>
            <div class="stat-title">Seguro Calculado</div>
            <div class="stat-value text-primary font-mono">{{ formatCurrency(insuranceAmount) }}</div>
            <div class="stat-actions">
              <button class="btn btn-sm btn-ghost" @click.stop="recalculateInsurance">Recalcular</button>
            </div>
          </div>
          </div>
        </div>
      </div>

      <!-- Información Personal -->
      <div class="card bg-base-100 shadow-lg mb-8 w-full max-w-full min-w-0 box-border">
        <div class="card-body w-full max-w-full min-w-0 overflow-x-hidden box-border">
          <div class="collapse collapse-arrow bg-base-100 border border-base-300 rounded-lg">
            <input type="checkbox" />
            <div class="collapse-title text-base font-medium">
              Información Personal
            </div>
            <div class="collapse-content">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 py-4">
                <div class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-base-content/70">📧 Email</span>
                  <span class="text-base text-base-content break-words">{{ store.member.email }}</span>
                </div>
                <div class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-base-content/70">🆔 Identificación</span>
                  <span class="text-base text-base-content break-words">{{ store.member.identification_number || 'N/A' }}</span>
                </div>
                <div class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-base-content/70">📱 Teléfono</span>
                  <span class="text-base text-base-content break-words">{{ store.member.phone || 'N/A' }}</span>
                </div>
                <div class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-base-content/70">📍 Dirección</span>
                  <span class="text-base text-base-content break-words">{{ store.member.address || 'N/A' }}</span>
                </div>
                <div class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-base-content/70">👤 Beneficiario</span>
                  <span class="text-base text-base-content break-words">{{ store.member.beneficiary || 'N/A' }}</span>
                </div>
                <div class="flex flex-col gap-2">
                  <span class="text-sm font-semibold text-base-content/70">📅 Fecha de Registro</span>
                  <span class="text-base text-base-content break-words">{{ formatDate(store.member.registration_date || store.member.created_at || '') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sistema de Tabs -->
      <div class="card bg-base-100 shadow-lg w-full max-w-full min-w-0">
        <div class="card-body w-full max-w-full min-w-0 overflow-x-hidden">
          <Tabs
            :tabs="tabs"
            :model-value="activeTab"
            :lazy="true"
            :scrollable="true"
            @update:model-value="activeTab = $event"
          >
        <template #content-resumen>
          <TabResumen
            :member="store.member!"
            :store="store"
            @view-detail="handleViewDetail"
          />
        </template>

        <template #content-stocks>
          <TabStocks
            :member-id="memberId"
            :store="store"
            @view-subscription="handleViewSubscription"
          />
        </template>

        <template #content-loans>
          <TabLoans
            :member-id="memberId"
            :store="store"
            @view-loan="handleViewLoan"
            @pay-loan="handlePayLoan"
          />
        </template>

        <template #content-payments>
          <TabPayments
            :member-id="memberId"
            :store="store"
            @view-payment-detail="handleViewPaymentDetail"
          />
        </template>

        <template #content-dues>
          <TabDues
            :member-id="memberId"
            :store="store"
            :meeting-id="activeMeetingId"
            @register-payment="showRegisterPaymentModal = true"
          />
        </template>

        <template #content-schedule>
          <TabSchedule
            :member-id="memberId"
            :store="store"
          />
        </template>

        <template #content-history>
          <TabHistory
            :member-id="memberId"
            :store="store"
          />
        </template>
          </Tabs>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <RegisterPaymentModal
      :visible="showRegisterPaymentModal"
      :member-id="memberId"
      :dues="store.dues"
      :meeting-id="activeMeetingId || undefined"
      @close="showRegisterPaymentModal = false"
      @success="handlePaymentSuccess"
    />

    <StockSubscriptionDetail
      :visible="selectedSubscriptionId !== null"
      :member-id="memberId"
      :subscription-id="selectedSubscriptionId"
      @close="selectedSubscriptionId = null"
      @exchange="handleExchange"
      @transfer="handleTransfer"
      @use-for-payment="handleUseForPayment"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMemberDetailStore } from '../stores/memberDetail'
import { useActiveMeetingStore } from '@/features/meetings/stores/activeMeeting'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import Tabs from '@/shared/components/Tabs.vue'
import type { Tab } from '@/shared/components/Tabs.vue'
import RegisterPaymentModal from '../components/RegisterPaymentModal.vue'
import StockSubscriptionDetail from '../components/StockSubscriptionDetail.vue'
import TabResumen from './tabs/TabResumen.vue'
import TabStocks from './tabs/TabStocks.vue'
import TabLoans from './tabs/TabLoans.vue'
import TabPayments from './tabs/TabPayments.vue'
import TabDues from './tabs/TabDues.vue'
import TabSchedule from './tabs/TabSchedule.vue'
import TabHistory from './tabs/TabHistory.vue'
import { formatDate, formatCurrency } from '@/shared/utils/formatters'

const route = useRoute()
const router = useRouter()
const store = useMemberDetailStore()
const activeMeetingStore = useActiveMeetingStore()

const memberId = computed(() => route.params.id as string)
const activeMeetingId = computed(() => activeMeetingStore.meetingId)

const activeTab = ref('resumen')
const showRegisterPaymentModal = ref(false)
const selectedSubscriptionId = ref<string | null>(null)
const insuranceAmount = ref(0)
const insuranceCapitalPayment = ref(0)

const tabs: Tab[] = [
  { id: 'resumen', label: 'Resumen Financiero' },
  { id: 'stocks', label: 'Acciones y Suscripciones' },
  { id: 'loans', label: 'Préstamos' },
  { id: 'payments', label: 'Pagos y Transacciones' },
  { id: 'dues', label: 'Cuotas y Obligaciones' },
  { id: 'schedule', label: 'Cronograma de Pagos' },
  { id: 'history', label: 'Historial de Operaciones' }
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

async function loadInitialData() {
  const id = memberId.value
  if (!id) return
  
  await store.fetchMember(id)
  
  // Cargar datos básicos iniciales
  try {
    await Promise.all([
      store.fetchDues(id),
      store.fetchPayments(id),
      store.fetchPurchases(id),
      store.fetchLoans(id),
      store.fetchStockSubscriptions(id),
      store.fetchInsurance(id)
    ])
    
    if (store.insurance) {
      insuranceAmount.value = store.insurance.insurance_amount
    }
  } catch (error) {
    console.error('Error cargando datos iniciales:', error)
  }
}

async function recalculateInsurance() {
  if (!memberId.value) return
  await store.fetchInsurance(memberId.value, insuranceCapitalPayment.value || undefined)
  if (store.insurance) {
    insuranceAmount.value = store.insurance.insurance_amount
  }
}

function handlePaymentSuccess() {
  // Recargar datos relevantes
  const id = memberId.value
  Promise.all([
    store.fetchDues(id),
    store.fetchPayments(id),
    store.fetchLoans(id),
    store.fetchPaymentSchedule(id)
  ])
}

function handleViewDetail(type: string, id: string) {
  // Navegar o mostrar detalles según el tipo
  console.log('View detail:', type, id)
}

function handleViewSubscription(subscriptionId: string) {
  selectedSubscriptionId.value = subscriptionId
}

function handleViewLoan(loanId: string) {
  activeTab.value = 'loans'
  // Scroll to loan
}

function handlePayLoan(loanId: string) {
  activeTab.value = 'dues'
  showRegisterPaymentModal.value = true
}

function handleViewPaymentDetail(paymentId: string) {
  console.log('View payment detail:', paymentId)
}

function handleExchange(subscription: any) {
  console.log('Exchange:', subscription)
  // Navigate to exchange modal or form
}

function handleTransfer(subscription: any) {
  console.log('Transfer:', subscription)
  // Navigate to transfer modal or form
}

function handleUseForPayment(subscription: any) {
  console.log('Use for payment:', subscription)
  // Navigate to payment form with stock selected
}

// Cargar datos cuando cambia el tab activo (lazy loading)
watch(activeTab, (newTab, oldTab) => {
  const id = memberId.value
  if (!id || !store.member) return

  switch (newTab) {
    case 'stocks':
      if (store.stockSubscriptions.length === 0) {
        store.fetchStockSubscriptions(id).catch(() => {})
        store.fetchExchanges(id).catch(() => {})
        store.fetchTransfers(id).catch(() => {})
        store.fetchStockLoanPayments(id).catch(() => {})
      }
      break
    case 'schedule':
      if (!store.paymentSchedule) {
        store.fetchPaymentSchedule(id, { months: 12 }).catch(() => {})
      }
      break
    case 'history':
      if (store.exchanges.length === 0) {
        store.fetchExchanges(id).catch(() => {})
        store.fetchTransfers(id).catch(() => {})
        store.fetchStockLoanPayments(id).catch(() => {})
      }
      break
  }
}, { flush: 'post' })

onMounted(async () => {
  await activeMeetingStore.fetchActiveMeeting()
  await loadInitialData()
})
</script>

<style scoped>
/* Animación de entrada */
.card {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
