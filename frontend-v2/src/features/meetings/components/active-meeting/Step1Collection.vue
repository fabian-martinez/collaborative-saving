<template>
  <div>
    <div v-if="loadingMembers" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-if="error && !loadingMembers" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <div v-if="!loadingMembers && !error" class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  : isMemberPaid(member.id)
                  ? 'bg-base-200/50 cursor-not-allowed opacity-60'
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
              <div v-if="isMemberPaid(member.id)" class="flex-shrink-0">
                <span class="badge badge-success badge-sm">Registrado</span>
              </div>
            </div>
          </div>
          
          <div class="mt-6 pt-4 border-t border-base-300">
            <div class="text-center">
              <div class="text-xs md:text-sm font-light text-base-content/70 uppercase mb-1">
                Total Aportes Recaudados
              </div>
              <div class="text-2xl md:text-3xl font-bold text-base-content">
                {{ formatCurrency(totalCollected) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Form -->
      <div class="card bg-base-100 shadow-lg rounded-lg">
        <div class="card-body p-4 md:p-6">
          <div v-if="!selectedMember" class="flex items-center justify-center h-64 text-base-content/60">
            <p class="text-center">Seleccione un socio para ver sus deudas o detalles de pago.</p>
          </div>
          
          <div v-else-if="loadingDues" class="flex items-center justify-center h-64">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
          
          <div v-else>
            <div class="mb-6">
              <h2 class="text-xl md:text-2xl font-bold mb-2">Registrar Pago</h2>
              <p class="text-base md:text-lg text-base-content/80 break-words">{{ selectedMember.name }}</p>
            </div>

            <div v-if="memberDues.length > 0" class="space-y-4">
              <div v-for="due in memberDues" :key="due.type" class="py-3 border-b border-base-300">
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between items-start">
                    <p class="font-semibold text-base md:text-lg break-words">{{ due.description }}</p>
                    <p class="font-mono text-lg md:text-xl font-bold flex-shrink-0 ml-4">
                      {{ formatCurrency(due.amount) }}
                    </p>
                  </div>
                  <p v-if="due.details" class="text-xs md:text-sm text-base-content/70 break-words">
                    Interés: {{ formatCurrency(due.details.interest || 0) }} | 
                    Capital: {{ formatCurrency(due.details.principal || 0) }}
                  </p>
                </div>
              </div>

              <div class="mt-6 pt-4 border-t-2 border-dashed border-base-300">
                <div class="flex justify-between items-baseline">
                  <span class="text-lg md:text-xl font-bold">Total a Pagar:</span>
                  <span class="text-2xl md:text-3xl font-bold text-success font-mono">
                    {{ formatCurrency(totalToPay) }}
                  </span>
                </div>
              </div>

              <div class="mt-6 flex justify-end">
                <button 
                  class="btn btn-success w-full md:w-auto md:btn-lg" 
                  @click="handlePayment"
                  :disabled="isSubmitting"
                >
                  <span v-if="isSubmitting" class="loading loading-spinner"></span>
                  <span v-else>Confirmar Pago</span>
                </button>
              </div>
            </div>
            <div v-else class="text-center text-base-content/60 py-8">
              Este socio no tiene deudas pendientes.
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-6 md:mt-8 pt-4 border-t">
      <div class="text-right mt-4">
        <button class="btn btn-success w-full md:w-auto" @click="$emit('completed')">
          Finalizar Solicitud de Aportes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { membersApi, type Member, type MemberDue } from '@/api/members.api'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { formatCurrency } from '@/shared/utils/formatters'

const emit = defineEmits<{
  completed: []
}>()

const store = useActiveMeetingStore()
const members = ref<Member[]>([])
const selectedMember = ref<Member | null>(null)
const memberDues = ref<MemberDue[]>([])
const completedPayments = ref<Array<{ memberName: string; amount: number }>>([])
const paidMemberIds = ref<string[]>([])
const loadingMembers = ref(false)
const loadingDues = ref(false)
const error = ref<string | null>(null)
const isSubmitting = ref(false)

const totalCollected = computed(() => 
  completedPayments.value.reduce((sum, p) => sum + p.amount, 0)
)

const totalToPay = computed(() => 
  memberDues.value.reduce((sum, due) => sum + due.amount, 0)
)

function isMemberPaid(memberId: string) {
  return paidMemberIds.value.includes(memberId)
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getMemberColor(memberId: string): string {
  // Generar un color consistente basado en el ID del miembro
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
  // Usar el hash del ID para seleccionar un color de manera consistente
  let hash = 0
  for (let i = 0; i < memberId.length; i++) {
    hash = memberId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

onMounted(async () => {
  loadingMembers.value = true
  try {
    members.value = await membersApi.getMembers()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar miembros'
  } finally {
    loadingMembers.value = false
  }
})

async function selectMember(member: Member) {
  if (isMemberPaid(member.id)) {
    return
  }
  
  selectedMember.value = member
  loadingDues.value = true
  error.value = null
  
  try {
    const dues = await membersApi.getMemberDues(member.id)
    memberDues.value = dues
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar deudas'
    memberDues.value = []
  } finally {
    loadingDues.value = false
  }
}

async function handlePayment() {
  if (!selectedMember.value || memberDues.value.length === 0) {
    return
  }

  isSubmitting.value = true
  
  try {
    // Simular registro de pago (estado local)
    const totalAmount = totalToPay.value
    completedPayments.value.push({
      memberName: selectedMember.value.name,
      amount: totalAmount
    })
    
    paidMemberIds.value.push(selectedMember.value.id)
    
    // Actualizar store con el pago
    store.addPayment({
      member_id: selectedMember.value.id,
      total_amount: totalAmount,
      payments: memberDues.value.map(due => ({
        type: due.type,
        amount: due.amount,
        description: due.description
      }))
    })
    
    // Limpiar selección
    selectedMember.value = null
    memberDues.value = []
    
    // Actualizar resumen en store
    store.updateSummaryFromLocalState()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al registrar pago'
  } finally {
    isSubmitting.value = false
  }
}
</script>
