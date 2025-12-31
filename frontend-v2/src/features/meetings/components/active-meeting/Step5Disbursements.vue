<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-if="error && !loading" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <div v-if="!loading && !error" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Members List -->
      <div class="card bg-base-100 shadow-lg rounded-lg">
        <div class="card-body p-4 md:p-6">
          <h3 class="text-lg font-semibold mb-4">Socios</h3>
          <div class="space-y-2">
            <div
              v-for="member in members"
              :key="member.id"
              @click="selectMember(member)"
              :class="[
                'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
                selectedMember && selectedMember.id === member.id
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'hover:bg-base-200 border-2 border-transparent'
              ]"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                :style="{ backgroundColor: getMemberColor(member.id) }"
              >
                {{ getInitials(member.name) }}
              </div>
              <div class="flex-1 min-w-0">
                <p
                  class="font-medium text-sm md:text-base truncate"
                  :class="
                    selectedMember && selectedMember.id === member.id
                      ? 'text-primary'
                      : 'text-base-content'
                  "
                >
                  {{ member.name }}
                </p>
              </div>
              <div v-if="hasDisbursement(member.id)" class="flex-shrink-0">
                <span class="badge badge-info badge-sm">Con desembolsos</span>
              </div>
            </div>
          </div>
          
          <div class="mt-6 pt-4 border-t border-base-300 space-y-4">
            <div class="text-center">
              <div class="text-xs md:text-sm font-light text-base-content/70 uppercase mb-1">
                Efectivo disponible
              </div>
              <div class="text-2xl md:text-3xl font-bold text-success">
                {{ formatCurrency(disbursementPlan?.available_cash || 0) }}
              </div>
            </div>
            <div class="text-center pt-4 border-t border-base-300">
              <div class="text-xs md:text-sm font-light text-base-content/70 uppercase mb-1">
                Total a desembolsar
              </div>
              <div class="text-2xl md:text-3xl font-bold text-primary">
                {{ formatCurrency(disbursementPlan?.total_to_disburse || 0) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Disbursements Panel -->
      <div class="card bg-base-100 shadow-lg rounded-lg">
        <div class="card-body p-4 md:p-6">
          <div v-if="!selectedMember" class="flex items-center justify-center h-64 text-base-content/60">
            <p class="text-center">Seleccione un socio para gestionar desembolsos.</p>
          </div>
          
          <div v-else>
            <div class="mb-6">
              <h3 class="text-lg md:text-xl font-bold mb-2 break-words">Desembolsos para {{ selectedMember.name }}</h3>
            </div>
            
            <div v-if="memberDisbursements.length > 0" class="space-y-3 md:space-y-4 mb-4 md:mb-6">
            <h4 class="font-semibold text-base md:text-lg">Desembolsos Planificados</h4>
            <div
              v-for="(disbursement, idx) in memberDisbursements"
              :key="idx"
              class="bg-base-200 p-3 md:p-4 rounded-md"
            >
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div class="flex-1 min-w-0">
                  <p class="font-semibold break-words">{{ getDisbursementTypeLabel(disbursement.type) }}</p>
                  <p v-if="disbursement.description" class="text-xs md:text-sm text-base-content/70 break-words">
                    {{ disbursement.description }}
                  </p>
                </div>
                <p class="font-mono text-lg md:text-xl font-bold flex-shrink-0">
                  {{ formatCurrency(disbursement.amount) }}
                </p>
              </div>
            </div>
          </div>

            <div class="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button class="btn btn-primary w-full sm:w-auto" @click="showLoanModal = true">
                Solicitar Préstamo
              </button>
              <button class="btn btn-secondary w-full sm:w-auto" @click="showWithdrawalModal = true">
                Solicitar Retiro
              </button>
              <button class="btn btn-accent w-full sm:w-auto" @click="showOtherModal = true">
                Otro Desembolso
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <Modal :show="showLoanModal" title="Solicitar Préstamo" @close="showLoanModal = false">
      <div class="space-y-4">
        <p class="text-sm md:text-base text-base-content/70">Funcionalidad de préstamo (simulada)</p>
        <div class="modal-action flex-col sm:flex-row gap-2">
          <button class="btn btn-outline w-full sm:w-auto" @click="showLoanModal = false">Cancelar</button>
          <button class="btn btn-primary w-full sm:w-auto" @click="handleLoan">Confirmar</button>
        </div>
      </div>
    </Modal>

    <Modal :show="showWithdrawalModal" title="Solicitar Retiro" @close="showWithdrawalModal = false">
      <div class="space-y-4">
        <p class="text-sm md:text-base text-base-content/70">Funcionalidad de retiro (simulada)</p>
        <div class="modal-action flex-col sm:flex-row gap-2">
          <button class="btn btn-outline w-full sm:w-auto" @click="showWithdrawalModal = false">Cancelar</button>
          <button class="btn btn-primary w-full sm:w-auto" @click="handleWithdrawal">Confirmar</button>
        </div>
      </div>
    </Modal>

    <Modal :show="showOtherModal" title="Otro Desembolso" @close="showOtherModal = false">
      <div class="space-y-4">
        <p class="text-sm md:text-base text-base-content/70">Funcionalidad de otro desembolso (simulada)</p>
        <div class="modal-action flex-col sm:flex-row gap-2">
          <button class="btn btn-outline w-full sm:w-auto" @click="showOtherModal = false">Cancelar</button>
          <button class="btn btn-primary w-full sm:w-auto" @click="handleOther">Confirmar</button>
        </div>
      </div>
    </Modal>

    <div v-if="hasDisbursements" class="mt-6 md:mt-8 flex flex-col items-center">
      <button 
        class="btn btn-primary w-full sm:w-auto md:btn-lg" 
        :disabled="isApplying" 
        @click="applyDisbursements"
      >
        <span v-if="isApplying" class="loading loading-spinner"></span>
        <span class="hidden sm:inline">{{ isApplying ? 'Aplicando Desembolsos...' : 'Aplicar Desembolsos y Cerrar Reunión' }}</span>
        <span class="sm:hidden">{{ isApplying ? 'Aplicando...' : 'Aplicar y Cerrar' }}</span>
      </button>
      <div v-if="applyError" class="alert alert-error mt-4 w-full">{{ applyError }}</div>
      <div v-if="applySuccess" class="alert alert-success mt-4 w-full">
        ¡Desembolsos aplicados correctamente! (simulado)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { membersApi, type Member } from '@/api/members.api'
import { meetingsApi, type DisbursementPlanItem, type DisbursementPlanPreview } from '@/api/meetings.api'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { formatCurrency } from '@/shared/utils/formatters'
import Modal from '@/shared/components/Modal.vue'

const store = useActiveMeetingStore()
const members = ref<Member[]>([])
const selectedMember = ref<Member | null>(null)
const disbursementPlan = ref<DisbursementPlanPreview | null>(null)
const localDisbursements = ref<DisbursementPlanItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showLoanModal = ref(false)
const showWithdrawalModal = ref(false)
const showOtherModal = ref(false)
const isApplying = ref(false)
const applyError = ref<string | null>(null)
const applySuccess = ref(false)

const memberDisbursements = computed(() => {
  if (!selectedMember.value) return []
  return [
    ...(disbursementPlan.value?.plan.filter(item => item.member_id === selectedMember.value!.id) || []),
    ...localDisbursements.value.filter(item => item.member_id === selectedMember.value!.id)
  ]
})

const hasDisbursements = computed(() => {
  const planItems = disbursementPlan.value?.plan.length || 0
  return planItems > 0 || localDisbursements.value.length > 0
})

function hasDisbursement(memberId: string) {
  const planHas = disbursementPlan.value?.plan.some(item => item.member_id === memberId)
  const localHas = localDisbursements.value.some(item => item.member_id === memberId)
  return planHas || localHas
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getMemberColor(memberId: string): string {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // green
    '#06b6d4', // cyan
    '#ef4444', // red
    '#6366f1', // indigo
  ]
  let hash = 0
  for (let i = 0; i < memberId.length; i++) {
    hash = memberId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getDisbursementTypeLabel(type: string) {
  const labels: Record<string, string> = {
    loan: 'Préstamo',
    withdrawal: 'Retiro',
    dividend: 'Dividendo',
    other: 'Otro'
  }
  return labels[type] || type
}

onMounted(async () => {
  loading.value = true
  try {
    members.value = await membersApi.getMembers()
    
    if (store.meetingId) {
      disbursementPlan.value = await meetingsApi.getDisbursementPlan(store.meetingId)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar datos'
  } finally {
    loading.value = false
  }
})

function selectMember(member: Member) {
  selectedMember.value = member
}

function handleLoan() {
  if (!selectedMember.value || !store.meetingId) return
  
  localDisbursements.value.push({
    member_id: selectedMember.value.id,
    type: 'loan',
    amount: 1000000,
    description: 'Préstamo simulado'
  })
  
  showLoanModal.value = false
}

function handleWithdrawal() {
  if (!selectedMember.value || !store.meetingId) return
  
  localDisbursements.value.push({
    member_id: selectedMember.value.id,
    type: 'withdrawal',
    amount: 500000,
    description: 'Retiro simulado'
  })
  
  showWithdrawalModal.value = false
}

function handleOther() {
  if (!selectedMember.value || !store.meetingId) return
  
  localDisbursements.value.push({
    member_id: selectedMember.value.id,
    type: 'other',
    amount: 200000,
    description: 'Otro desembolso simulado'
  })
  
  showOtherModal.value = false
}

async function applyDisbursements() {
  if (!store.meetingId) return
  
  isApplying.value = true
  applyError.value = null
  applySuccess.value = false
  
  try {
    // Simular ejecución de desembolsos
    const allItems = [
      ...(disbursementPlan.value?.plan || []),
      ...localDisbursements.value
    ]
    
    await meetingsApi.executeDisbursementPlan(store.meetingId, { plan: allItems })
    
    // Simular cierre de reunión
    await meetingsApi.closeMeeting(store.meetingId)
    
    applySuccess.value = true
    alert('Desembolsos aplicados y reunión cerrada exitosamente. (simulado)')
  } catch (e) {
    applyError.value = e instanceof Error ? e.message : 'Error al aplicar desembolsos'
  } finally {
    isApplying.value = false
  }
}
</script>
