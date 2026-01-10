<template>
  <div class="member-detail-view">
    <LoadingSpinner :loading="store.loading && !store.member" message="Cargando miembro..." />
    <ErrorMessage :error="store.error" />

    <div v-if="store.member && !store.loading" class="member-detail">
      <!-- Header del Socio -->
      <div class="member-header-section">
        <div class="header-top">
          <button @click="$router.push('/members')" class="back-button">← Volver</button>
          <div class="header-actions">
            <button class="btn btn-primary" @click="showRegisterPaymentModal = true">
              Registrar Pago
            </button>
          </div>
        </div>

        <div class="header-content">
          <div class="avatar-container">
            <div class="avatar">{{ getInitials(store.member.name) }}</div>
          </div>
          <div class="header-info">
            <h1 class="member-name">{{ store.member.name }}</h1>
            <div class="member-status">
              <Badge :variant="store.member.status === 'active' ? 'success' : 'neutral'">
                {{ store.member.status === 'active' ? 'ACTIVO' : store.member.status.toUpperCase() }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- Summary Cards Grid -->
        <div class="summary-grid">
          <SummaryCard
            title="Total en Acciones"
            :value="store.totalInStocks"
            format="currency"
            icon="📊"
            @click="activeTab = 'stocks'"
            clickable
          />
          <SummaryCard
            title="Préstamos Activos"
            :value="store.activeLoansTotalAmount"
            :subtitle="`${store.activeLoansCount} préstamo${store.activeLoansCount !== 1 ? 's' : ''}`"
            format="currency"
            icon="💰"
            @click="activeTab = 'loans'"
            clickable
          />
          <SummaryCard
            title="Cuotas Pendientes"
            :value="store.totalPendingDues"
            format="currency"
            icon="📋"
            @click="activeTab = 'dues'"
            clickable
          />
          <SummaryCard
            title="Seguro Calculado"
            :value="insuranceAmount"
            format="currency"
            icon="🛡️"
            action="Recalcular"
            @action-click="recalculateInsurance"
          />
        </div>
      </div>

      <!-- Información Personal -->
      <div class="personal-info-section">
        <ExpandableSection title="Información Personal" :default-expanded="false">
          <div class="personal-info-grid">
            <div class="info-item">
              <span class="info-label">📧 Email</span>
              <span class="info-value">{{ store.member.email }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">🆔 Identificación</span>
              <span class="info-value">{{ store.member.identification_number || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📱 Teléfono</span>
              <span class="info-value">{{ store.member.phone || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📍 Dirección</span>
              <span class="info-value">{{ store.member.address || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">👤 Beneficiario</span>
              <span class="info-value">{{ store.member.beneficiary || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📅 Fecha de Registro</span>
              <span class="info-value">{{ formatDate(store.member.registration_date || store.member.created_at || '') }}</span>
            </div>
          </div>
        </ExpandableSection>
      </div>

      <!-- Sistema de Tabs -->
      <Tabs
        :tabs="tabs"
        v-model="activeTab"
        :lazy="true"
        :scrollable="true"
        class="member-tabs"
      >
        <!-- Tab 1: Resumen Financiero -->
        <template #content-resumen>
          <TabResumen
            :member="store.member!"
            :store="store"
            @view-detail="handleViewDetail"
          />
        </template>

        <!-- Tab 2: Acciones y Suscripciones -->
        <template #content-stocks>
          <TabStocks
            :member-id="memberId"
            :store="store"
            @view-subscription="handleViewSubscription"
          />
        </template>

        <!-- Tab 3: Préstamos -->
        <template #content-loans>
          <TabLoans
            :member-id="memberId"
            :store="store"
            @view-loan="handleViewLoan"
            @pay-loan="handlePayLoan"
          />
        </template>

        <!-- Tab 4: Pagos y Transacciones -->
        <template #content-payments>
          <TabPayments
            :member-id="memberId"
            :store="store"
            @view-payment-detail="handleViewPaymentDetail"
          />
        </template>

        <!-- Tab 5: Cuotas y Obligaciones -->
        <template #content-dues>
          <TabDues
            :member-id="memberId"
            :store="store"
            :meeting-id="activeMeetingId"
            @register-payment="showRegisterPaymentModal = true"
          />
        </template>

        <!-- Tab 6: Cronograma de Pagos -->
        <template #content-schedule>
          <TabSchedule
            :member-id="memberId"
            :store="store"
          />
        </template>

        <!-- Tab 7: Historial de Operaciones -->
        <template #content-history>
          <TabHistory
            :member-id="memberId"
            :store="store"
          />
        </template>
      </Tabs>
    </div>

    <!-- Modals -->
    <RegisterPaymentModal
      :visible="showRegisterPaymentModal"
      :member-id="memberId"
      :dues="store.dues"
      :meeting-id="activeMeetingId"
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
import Badge from '@/shared/components/Badge.vue'
import Tabs, { type Tab } from '@/shared/components/Tabs.vue'
import SummaryCard from '@/shared/components/SummaryCard.vue'
import ExpandableSection from '@/shared/components/ExpandableSection.vue'
import RegisterPaymentModal from '../components/RegisterPaymentModal.vue'
import StockSubscriptionDetail from '../components/StockSubscriptionDetail.vue'
import TabResumen from './tabs/TabResumen.vue'
import TabStocks from './tabs/TabStocks.vue'
import TabLoans from './tabs/TabLoans.vue'
import TabPayments from './tabs/TabPayments.vue'
import TabDues from './tabs/TabDues.vue'
import TabSchedule from './tabs/TabSchedule.vue'
import TabHistory from './tabs/TabHistory.vue'
import { formatDate } from '@/shared/utils/formatters'

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
  await store.fetchMember(id)
  
  // Cargar datos básicos iniciales
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
watch(activeTab, (newTab) => {
  const id = memberId.value
  if (!id) return

  switch (newTab) {
    case 'stocks':
      if (store.stockSubscriptions.length === 0) {
        store.fetchStockSubscriptions(id)
        store.fetchExchanges(id)
        store.fetchTransfers(id)
        store.fetchStockLoanPayments(id)
      }
      break
    case 'schedule':
      if (!store.paymentSchedule) {
        store.fetchPaymentSchedule(id, { months: 12 })
      }
      break
    case 'history':
      if (store.exchanges.length === 0) {
        store.fetchExchanges(id)
        store.fetchTransfers(id)
        store.fetchStockLoanPayments(id)
      }
      break
  }
})

onMounted(async () => {
  await activeMeetingStore.fetchActiveMeeting()
  await loadInitialData()
})
</script>

<style scoped>
.member-detail-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.member-header-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.back-button {
  background-color: #95a5a6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #7f8c8d;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.avatar-container {
  flex-shrink: 0;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.header-info {
  flex: 1;
}

.member-name {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.member-status {
  display: flex;
  gap: 0.5rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.personal-info-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.personal-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.info-value {
  font-size: 1rem;
  color: #1f2937;
}

.member-tabs {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .member-detail-view {
    padding: 1rem;
  }

  .member-header-section {
    padding: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .header-top {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .personal-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
