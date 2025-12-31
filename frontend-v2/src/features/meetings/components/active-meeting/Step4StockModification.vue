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
              <div v-if="hasOperations(member.id)" class="flex-shrink-0">
                <span class="badge badge-info badge-sm">Con operaciones</span>
              </div>
            </div>
          </div>
          
          <div class="mt-6 pt-4 border-t border-base-300">
            <div class="text-center">
              <div class="text-xs md:text-sm font-light text-base-content/70 uppercase mb-1">
                Total Operaciones
              </div>
              <div class="text-2xl md:text-3xl font-bold text-base-content">
                {{ registeredOperations.length }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Operations Panel -->
      <div class="card bg-base-100 shadow-lg rounded-lg">
        <div class="card-body p-4 md:p-6">
          <div v-if="!selectedMember" class="flex items-center justify-center h-64 text-base-content/60">
            <p class="text-center">Seleccione un socio para realizar modificaciones de acciones.</p>
          </div>
          
          <div v-else>
            <div class="mb-6">
              <h3 class="text-lg md:text-xl font-bold mb-2 break-words">Acciones para {{ selectedMember.name }}</h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
            <button class="btn btn-primary w-full md:w-auto md:btn-lg" @click="showTransferModal = true">
              Transferir Acciones
            </button>
            <button class="btn btn-secondary w-full md:w-auto md:btn-lg" @click="showLoanPaymentModal = true">
              Usar para Pago de Créditos
            </button>
            <button class="btn btn-info w-full md:w-auto md:btn-lg" @click="showExchangeModal = true">
              Modificar Acciones
            </button>
          </div>

            <div v-if="memberOperations.length > 0" class="mt-6">
              <h4 class="font-semibold mb-3">Operaciones Registradas</h4>
              <div class="space-y-2">
                <div
                  v-for="op in memberOperations"
                  :key="op.id"
                  class="bg-base-200 p-3 rounded-md"
                >
                  <div class="flex justify-between items-center">
                    <span class="font-semibold">{{ op.description }}</span>
                    <span class="badge badge-sm">{{ getOperationTypeLabel(op.type) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <Modal :show="showTransferModal" title="Transferir Acciones" @close="showTransferModal = false">
      <div class="space-y-4">
        <p class="text-sm md:text-base text-base-content/70">Funcionalidad de transferencia (simulada)</p>
        <div class="modal-action flex-col sm:flex-row gap-2">
          <button class="btn btn-outline w-full sm:w-auto" @click="showTransferModal = false">Cancelar</button>
          <button class="btn btn-primary w-full sm:w-auto" @click="handleTransfer">Confirmar</button>
        </div>
      </div>
    </Modal>

    <Modal :show="showLoanPaymentModal" title="Pago de Crédito con Acciones" @close="showLoanPaymentModal = false">
      <div class="space-y-4">
        <p class="text-sm md:text-base text-base-content/70">Funcionalidad de pago con acciones (simulada)</p>
        <div class="modal-action flex-col sm:flex-row gap-2">
          <button class="btn btn-outline w-full sm:w-auto" @click="showLoanPaymentModal = false">Cancelar</button>
          <button class="btn btn-primary w-full sm:w-auto" @click="handleLoanPayment">Confirmar</button>
        </div>
      </div>
    </Modal>

    <Modal :show="showExchangeModal" title="Modificar Acciones" @close="showExchangeModal = false">
      <div class="space-y-4">
        <p class="text-sm md:text-base text-base-content/70">Funcionalidad de intercambio (simulada)</p>
        <div class="modal-action flex-col sm:flex-row gap-2">
          <button class="btn btn-outline w-full sm:w-auto" @click="showExchangeModal = false">Cancelar</button>
          <button class="btn btn-primary w-full sm:w-auto" @click="handleExchange">Confirmar</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { membersApi, type Member } from '@/api/members.api'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import Modal from '@/shared/components/Modal.vue'

const emit = defineEmits<{
  completed: []
}>()

const store = useActiveMeetingStore()
const members = ref<Member[]>([])
const selectedMember = ref<Member | null>(null)
const registeredOperations = ref<Array<{ id: string; type: string; description: string; member_id: string }>>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showTransferModal = ref(false)
const showLoanPaymentModal = ref(false)
const showExchangeModal = ref(false)

const memberOperations = computed(() => {
  if (!selectedMember.value) return []
  return registeredOperations.value.filter(op => op.member_id === selectedMember.value!.id)
})

function hasOperations(memberId: string) {
  return registeredOperations.value.some(op => op.member_id === memberId)
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

function getOperationTypeLabel(type: string) {
  const labels: Record<string, string> = {
    TRANSFER: 'Transferencia',
    LOAN_PAYMENT: 'Pago Crédito',
    STOCK_MODIFICATION: 'Modificación'
  }
  return labels[type] || type
}

onMounted(async () => {
  loading.value = true
  try {
    members.value = await membersApi.getMembers()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar miembros'
  } finally {
    loading.value = false
  }
})

function selectMember(member: Member) {
  selectedMember.value = member
}

function handleTransfer() {
  if (!selectedMember.value || !store.meetingId) return
  
  registeredOperations.value.push({
    id: `op-${Date.now()}`,
    type: 'TRANSFER',
    description: 'Transferencia de acciones (simulada)',
    member_id: selectedMember.value.id
  })
  
  store.addStockOperation({
    type: 'TRANSFER',
    member_id: selectedMember.value.id
  })
  
  showTransferModal.value = false
}

function handleLoanPayment() {
  if (!selectedMember.value || !store.meetingId) return
  
  registeredOperations.value.push({
    id: `op-${Date.now()}`,
    type: 'LOAN_PAYMENT',
    description: 'Pago de crédito con acciones (simulada)',
    member_id: selectedMember.value.id
  })
  
  store.addStockOperation({
    type: 'LOAN_PAYMENT',
    member_id: selectedMember.value.id
  })
  
  showLoanPaymentModal.value = false
}

function handleExchange() {
  if (!selectedMember.value || !store.meetingId) return
  
  registeredOperations.value.push({
    id: `op-${Date.now()}`,
    type: 'STOCK_MODIFICATION',
    description: 'Intercambio de acciones (simulada)',
    member_id: selectedMember.value.id
  })
  
  store.addStockOperation({
    type: 'STOCK_MODIFICATION',
    member_id: selectedMember.value.id
  })
  
  showExchangeModal.value = false
}
</script>
