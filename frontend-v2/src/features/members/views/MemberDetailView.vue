<template>
  <div class="w-full max-w-full min-w-0 min-h-[calc(100vh-4rem)] overflow-x-hidden box-border">
    <LoadingSpinner :loading="store.loading && !store.member" message="Cargando miembro..." />
    <ErrorMessage :error="store.error" />

    <div v-if="store.member && !store.loading" class="w-full max-w-full min-w-0 space-y-4 box-border">
      <!-- Barra superior -->
      <div class="flex items-center justify-between text-xs text-base-content/70">
        <button
          aria-label="Volver a miembros"
          @click="$router.push('/members')"
          class="btn btn-ghost btn-sm px-2"
        >
          ← Volver
        </button>
        <span v-if="store.lastPaymentDate" class="font-mono">
          Último pago: {{ formatDate(store.lastPaymentDate) }}
        </span>
      </div>

      <!-- Layout Principal: 2 Columnas (Sidebar + Área Financiera) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <!-- Sidebar Izquierdo: Perfil + Información Personal + Seguro Acumulado -->
        <aside class="lg:col-span-4 xl:col-span-3 space-y-4">
          <div class="card bg-base-100 border border-base-300 shadow-sm">
            <div class="card-body p-5 space-y-4">
              <div class="flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-base shrink-0">
                  {{ getInitials(store.member.name) }}
                </div>
                <div class="min-w-0">
                  <h1 class="font-semibold text-base text-base-content break-words">
                    {{ store.member.name }}
                  </h1>
                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <span :class="['badge badge-sm', store.member.status === 'active' ? 'badge-success' : 'badge-neutral']">
                      {{ store.member.status === 'active' ? 'ACTIVO' : store.member.status.toUpperCase() }}
                    </span>
                    <span class="text-xs text-base-content/60">
                      Desde {{ formatDate(store.member.registration_date || store.member.created_at || '') }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="border-t border-base-300 pt-4 space-y-3 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-base-content">Información Personal</span>
                  <button
                    class="btn btn-xs btn-link no-underline px-0"
                    @click="showEditMemberModal = true"
                  >
                    Editar
                  </button>
                </div>
                <dl class="space-y-2.5">
                  <div>
                    <dt class="text-base-content/60">Email</dt>
                    <dd class="font-medium text-base-content break-words">{{ store.member.email }}</dd>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <dt class="text-base-content/60">Identificación</dt>
                      <dd :class="store.member.identification_number ? 'text-base-content' : 'text-base-content/50 italic'">
                        {{ store.member.identification_number || 'Sin registrar' }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-base-content/60">Teléfono</dt>
                      <dd :class="store.member.phone ? 'text-base-content' : 'text-base-content/50 italic'">
                        {{ store.member.phone || 'Sin registrar' }}
                      </dd>
                    </div>
                  </div>
                  <div>
                    <dt class="text-base-content/60">Dirección</dt>
                    <dd :class="store.member.address ? 'text-base-content' : 'text-base-content/50 italic'">
                      {{ store.member.address || 'Sin registrar' }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-base-content/60">Beneficiario</dt>
                    <dd :class="store.member.beneficiary ? 'text-base-content' : 'text-base-content/50 italic'">
                      {{ store.member.beneficiary || 'Sin registrar' }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <!-- Card de Seguro Acumulado (sin botón Recalcular) -->
          <div class="card bg-base-100 border border-base-300 shadow-sm">
            <div class="card-body p-4 space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="text-base-content/70">Seguro Acumulado</span>
                <button
                  class="btn btn-xs btn-link no-underline px-0"
                  @click="activeTab = 'accounts'"
                >
                  Ver cuentas →
                </button>
              </div>
              <p class="text-xl font-bold font-mono text-base-content">
                {{ formatCurrency(store.accumulatedInsurance) }}
              </p>
              <p class="text-xs text-base-content/60">Entradas registradas del socio</p>
            </div>
          </div>
        </aside>

        <!-- Columna Derecha: 3 KPIs + 5 Pestañas -->
        <main class="lg:col-span-8 xl:col-span-9 space-y-4 min-w-0">
          <!-- 3 KPIs Principales -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              class="card bg-base-100 border border-base-300 shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
              @click="activeTab = 'stocks-dues'"
            >
              <div class="card-body p-4">
                <div class="flex items-center justify-between text-xs text-base-content/70">
                  <span>Total en Acciones</span>
                  <span class="badge badge-sm badge-success badge-outline font-mono">
                    {{ store.totalStockUnits }} {{ store.totalStockUnits === 1 ? 'unidad' : 'unidades' }}
                  </span>
                </div>
                <p class="text-2xl font-bold font-mono text-primary mt-1">
                  {{ formatCurrency(store.totalInStocks) }}
                </p>
                <p class="text-xs text-base-content/60">
                  {{ activeSubscriptionsCount }} {{ activeSubscriptionsCount === 1 ? 'suscripción activa' : 'suscripciones activas' }}
                </p>
              </div>
            </div>

            <div
              class="card bg-base-100 border border-base-300 shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
              @click="activeTab = 'loans-schedule'"
            >
              <div class="card-body p-4">
                <div class="flex items-center justify-between text-xs text-base-content/70">
                  <span>Préstamos Activos</span>
                  <span class="badge badge-sm badge-warning badge-outline font-mono">
                    {{ store.activeLoansCount }} {{ store.activeLoansCount === 1 ? 'préstamo' : 'préstamos' }}
                  </span>
                </div>
                <p class="text-2xl font-bold font-mono text-primary mt-1">
                  {{ formatCurrency(store.activeLoansTotalAmount) }}
                </p>
                <p class="text-xs text-base-content/60">Saldo pendiente total</p>
              </div>
            </div>

            <div
              class="card bg-base-100 border border-base-300 shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
              @click="activeTab = 'loans-schedule'"
            >
              <div class="card-body p-4">
                <div class="flex items-center justify-between text-xs text-base-content/70">
                  <span>Próxima Cuota</span>
                  <span v-if="store.nextDueInfo.date" class="badge badge-sm badge-ghost font-mono">
                    {{ formatDate(store.nextDueInfo.date) }}
                  </span>
                </div>
                <p class="text-2xl font-bold font-mono text-primary mt-1">
                  {{ formatCurrency(store.nextDueInfo.amount) }}
                </p>
                <p class="text-xs text-base-content/60">
                  {{ store.nextDueInfo.loanType ? `${store.nextDueInfo.loanType} · 1 mes tras último pago` : 'Sin cuotas programadas' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Sistema de 5 Pestañas -->
          <div class="card bg-base-100 border border-base-300 shadow-sm w-full max-w-full min-w-0">
            <div class="card-body p-4 w-full max-w-full min-w-0 overflow-x-hidden">
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
                    @edit-loan="handleEditLoan"
                    @view-loan-detail="handleViewLoanBreakdown"
                  />
                </template>

                <template #content-loans-schedule>
                  <TabLoansAndSchedule
                    :member-id="memberId"
                    :store="store"
                    @edit-loan="handleEditLoan"
                    @view-loan-detail="handleViewLoanBreakdown"
                  />
                </template>

                <template #content-stocks-dues>
                  <TabStocksAndDues
                    :member-id="memberId"
                    :store="store"
                  />
                </template>

                <template #content-accounts>
                  <TabMemberAccounts
                    :member-id="memberId"
                    :store="store"
                  />
                </template>

                <template #content-movements>
                  <TabMovements
                    :member-id="memberId"
                    :store="store"
                    @view-payment-detail="handleViewPaymentDetail"
                  />
                </template>
              </Tabs>
            </div>
          </div>
        </main>
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

    <PaymentDetailModal
      :visible="selectedPaymentId !== null"
      :payment="selectedPayment"
      @close="selectedPaymentId = null"
    />

    <EditLoanTermsModal
      :visible="editingLoan !== null"
      :loan="editingLoan"
      @close="editingLoan = null"
      @saved="handleLoanEdited"
    />

    <LoanBreakdownModal
      :visible="detailLoan !== null"
      :loan="detailLoan"
      :projected-payments="store.paymentSchedule?.projected_payments || []"
      @close="detailLoan = null"
    />

    <Modal :show="showEditMemberModal" title="Editar Socio" @close="showEditMemberModal = false">
      <MemberForm
        v-if="store.member"
        :initial-data="{
          name: store.member.name,
          email: store.member.email,
          identification_number: store.member.identification_number,
          phone: store.member.phone,
          address: store.member.address,
          beneficiary: store.member.beneficiary
        }"
        @submit="handleUpdateMember"
        @cancel="showEditMemberModal = false"
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMemberDetailStore } from '../stores/memberDetail'
import { useActiveMeetingStore } from '@/features/meetings/stores/activeMeeting'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import Tabs from '@/shared/components/Tabs.vue'
import type { Tab } from '@/shared/components/Tabs.vue'
import RegisterPaymentModal from '../components/RegisterPaymentModal.vue'
import PaymentDetailModal from '../components/PaymentDetailModal.vue'
import EditLoanTermsModal from '../components/EditLoanTermsModal.vue'
import LoanBreakdownModal from '../components/LoanBreakdownModal.vue'
import MemberForm from '../components/MemberForm.vue'
import Modal from '@/shared/components/Modal.vue'
import TabResumen from './tabs/TabResumen.vue'
import TabLoansAndSchedule from './tabs/TabLoansAndSchedule.vue'
import TabStocksAndDues from './tabs/TabStocksAndDues.vue'
import TabMemberAccounts from './tabs/TabMemberAccounts.vue'
import TabMovements from './tabs/TabMovements.vue'
import { formatDate, formatCurrency } from '@/shared/utils/formatters'
import { membersApi, type CreateMemberRequest, type Loan } from '@/api/members.api'

const route = useRoute()
const store = useMemberDetailStore()
const activeMeetingStore = useActiveMeetingStore()

const memberId = computed(() => route.params.id as string)
const activeMeetingId = computed(() => activeMeetingStore.meetingId)

const activeTab = ref('resumen')

const showRegisterPaymentModal = ref(false)
const showEditMemberModal = ref(false)
const selectedPaymentId = ref<string | null>(null)
const editingLoan = ref<Loan | null>(null)
const detailLoan = ref<Loan | null>(null)

const selectedPayment = computed(() => {
  if (!selectedPaymentId.value) return null
  return store.payments.find(p => p.operation_id === selectedPaymentId.value) || null
})

const activeSubscriptionsCount = computed(() => {
  return store.stockSubscriptions.filter(s => s.status === 'active').length
})

const tabs = computed<Tab[]>(() => [
  { id: 'resumen', label: 'Resumen' },
  { id: 'loans-schedule', label: `Préstamos y Cronograma (${store.activeLoansCount})` },
  { id: 'stocks-dues', label: 'Acciones' },
  { id: 'accounts', label: 'Cuentas' },
  { id: 'movements', label: 'Movimientos' }
])

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

async function loadInitialData() {
  const id = memberId.value
  if (!id) return

  await store.fetchMember(id)

  try {
    await Promise.all([
      store.fetchDues(id),
      store.fetchPayments(id),
      store.fetchPurchases(id),
      store.fetchLoans(id),
      store.fetchStockSubscriptions(id),
      store.fetchMemberLedgerEntries(id)
    ])
  } catch (error) {
    console.error('Error cargando datos iniciales:', error)
  }
}

function handlePaymentSuccess() {
  const id = memberId.value
  Promise.all([
    store.fetchDues(id),
    store.fetchPayments(id),
    store.fetchLoans(id),
    store.fetchPaymentSchedule(id),
    store.fetchMemberLedgerEntries(id)
  ])
}

function handleLoanEdited() {
  const id = memberId.value
  Promise.all([
    store.fetchLoans(id),
    store.fetchDues(id),
    store.fetchPaymentSchedule(id, { months: 12 })
  ])
}

function handleEditLoan(loan: Loan) {
  editingLoan.value = loan
}

function handleViewLoanBreakdown(loan: Loan) {
  detailLoan.value = loan
  if (!store.paymentSchedule && memberId.value) {
    store.fetchPaymentSchedule(memberId.value, { months: 12 }).catch(() => {})
  }
}

async function handleUpdateMember(data: CreateMemberRequest) {
  if (!memberId.value) return
  await membersApi.updateMember(memberId.value, {
    name: data.name,
    email: data.email,
    identification_number: data.identification_number,
    phone: data.phone,
    address: data.address,
    beneficiary: data.beneficiary
  })
  showEditMemberModal.value = false
  await store.fetchMember(memberId.value)
}

function handleViewDetail(type: string, id: string) {
  if (type === 'movements' && id !== 'all') {
    handleViewPaymentDetail(id)
  } else {
    activeTab.value = type
  }
}

function handleViewPaymentDetail(paymentId: string) {
  activeTab.value = 'movements'
  selectedPaymentId.value = paymentId
}

watch(
  activeTab,
  (newTab) => {
    const id = memberId.value
    if (!id || !store.member) return

    if (newTab === 'loans-schedule' && !store.paymentSchedule) {
      store.fetchPaymentSchedule(id, { months: 12 }).catch(() => {})
    } else if (newTab === 'accounts' && store.ledgerEntries.length === 0) {
      store.fetchMemberLedgerEntries(id).catch(() => {})
    }
  },
  { flush: 'post' }
)

onMounted(async () => {
  await activeMeetingStore.fetchActiveMeeting()
  await loadInitialData()
})
</script>
