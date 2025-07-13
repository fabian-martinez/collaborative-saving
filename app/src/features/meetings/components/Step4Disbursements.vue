<template>
  <div>
    <h2 class="text-xl font-bold mb-4">Paso 4: Desembolsos y Cierre</h2>

    <div v-if="isLoading" class="flex justify-center items-center my-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-if="error" class="alert alert-error my-4">
      <span>{{ error }}</span>
    </div>

    <div v-if="!isLoading && !error" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Lista de Socios -->
      <div class="md:col-span-1">
        <h3 class="text-lg font-semibold mb-2">Socios</h3>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="member in members" :key="member.id" @click="selectMember(member)">
            <a :class="[ 'transition', selectedMember && selectedMember.id === member.id ? 'bg-primary/20 font-bold text-primary' : 'hover:bg-base-300/40' ]">
              {{ member.name }}
              <span v-if="hasAssignedLoan(member.id)" class="badge badge-info badge-sm ml-2">Assigned</span>
            </a>
          </li>
        </ul>
        <div class="mt-4 p-4 bg-base-200 rounded-box space-y-4">
          <div>
            <div class="text-center">
              <div class="text-sm font-light text-base-content/70 uppercase">Efectivo disponible</div>
              <div class="text-3xl font-bold text-success">${{ efectivoDisponible.toFixed(2) }}</div>
            </div>
          </div>
          <div class="text-center">
            <div class="text-sm font-light text-base-content/70 uppercase">Total prestado</div>
            <div class="text-2xl font-bold text-primary">${{ totalPrestado.toFixed(2) }}</div>
          </div>
        </div>
      </div>
      <!-- Recibo de préstamos/desembolsos -->
      <div class="md:col-span-2">
        <div v-if="!selectedMember" class="flex items-center justify-center h-full text-gray-500">
          <p class="text-center">Seleccione un socio para registrar un préstamo.</p>
        </div>
        <div v-else class="bg-base-100 p-8 rounded-2xl shadow-lg font-sans">
          <h3 class="text-xl font-bold mb-4">Recibo de Desembolsos para {{ selectedMember.name }}</h3>
          <div v-if="localLoans.length > 0">
            <div class="space-y-4">
              <div v-for="(loan, idx) in localLoans" :key="idx" class="py-4">
                <div class="flex items-baseline">
                  <div class="flex-shrink-0">
                    <p class="font-semibold text-lg">{{ loan.type === 'corriente' ? 'Préstamo Corriente' : 'Préstamo Ágil' }}</p>
                    <p class="text-sm text-base-content/70">Aprobado: ${{ loan.approved.toFixed(2) }}</p>
                  </div>
                  <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                  <div class="flex-shrink-0 flex items-center gap-2">
                    <button class="btn btn-ghost btn-xs" @click="editLoan(idx)">Editar</button>
                    <button class="btn btn-ghost btn-xs text-error" @click="removeLoan(idx)">Anular</button>
                    <p class="w-36 text-right font-mono text-2xl text-primary">${{ loan.delivered.toFixed(2) }}</p>
                  </div>
                </div>
                <div class="pl-4 mt-2 space-y-1 text-md text-base-content/80 border-l-2 border-base-300/80">
                  <div class="flex justify-between"><span>Tasa de interés:</span> <span>{{ loan.type === 'corriente' ? '1.5%' : '2%' }}</span></div>
                  <div class="flex justify-between"><span>Capacidad máxima:</span> <span>${{ selectedMember.maxCapacity.toFixed(2) }}</span></div>
                </div>
              </div>
              <div class="flex items-baseline text-2xl font-bold mt-6">
                <span class="flex-shrink-0">Total a entregar:</span>
                <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                <span class="flex-shrink-0 text-primary font-mono">${{ localLoans.reduce((sum, l) => sum + l.delivered, 0).toFixed(2) }}</span>
              </div>
            </div>
            <div class="text-right mt-6">
              <button class="btn btn-success btn-lg" @click="confirmDisbursements">Confirmar desembolsos</button>
            </div>
          </div>
          <div v-else class="mb-4 text-base-content/60 italic">No hay préstamos registrados aún para este socio.</div>
          <button class="btn btn-primary mt-6" @click="openModal">Solicitar/Editar Préstamo</button>
        </div>
      </div>
    </div>

    <!-- Modal de Préstamo -->
    <LoanFormModal
      :show="showModal"
      :member="selectedMember"
      :prevLoan="editingLoanIdx !== null ? localLoans[editingLoanIdx] : null"
      @save="handleSaveLoan"
      @cancel="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import LoanFormModal from './LoanFormModal.vue'

// Mock de socios
const members = ref([
  { id: '1', name: 'Juan Pérez', maxCapacity: 5000 },
  { id: '2', name: 'Ana Gómez', maxCapacity: 3000 },
  { id: '3', name: 'Luis Torres', maxCapacity: 4000 },
])

const isLoading = ref(false)
const error = ref('')
const selectedMember = ref<{ id: string; name: string; maxCapacity: number } | null>(null)

const showModal = ref(false)
const editingLoanIdx = ref<number|null>(null)

// Recibo local de préstamos por socio
const localLoansByMember = ref<Record<string, Array<{ type: string; approved: number; delivered: number }>>>({})
const localLoans = computed({
  get() {
    return selectedMember.value ? (localLoansByMember.value[selectedMember.value.id] || []) : []
  },
  set(val) {
    if (selectedMember.value) {
      localLoansByMember.value[selectedMember.value.id] = val
    }
  }
})

// Mock: efectivo disponible (puedes ajustar la lógica según la integración real)
const efectivoDisponible = computed(() => 10000 - totalPrestado.value)
const totalPrestado = computed(() => {
  // Suma todos los préstamos locales de todos los socios
  return Object.values(localLoansByMember.value).flat().reduce((sum, l) => sum + l.delivered, 0)
})

function selectMember(member: { id: string; name: string; maxCapacity: number }) {
  selectedMember.value = member
  editingLoanIdx.value = null
}

function openModal() {
  showModal.value = true
  editingLoanIdx.value = null
}

function editLoan(idx: number) {
  editingLoanIdx.value = idx
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingLoanIdx.value = null
}

function handleSaveLoan(loan: { type: string; approved: number; delivered: number }) {
  if (!selectedMember.value) return
  const loans = [...localLoans.value]
  if (editingLoanIdx.value !== null) {
    loans[editingLoanIdx.value] = { ...loan }
  } else {
    loans.push({ ...loan })
  }
  localLoans.value = loans
  closeModal()
}

function removeLoan(idx: number) {
  const loans = [...localLoans.value]
  loans.splice(idx, 1)
  localLoans.value = loans
}

function confirmDisbursements() {
  alert('Desembolsos confirmados para ' + selectedMember.value?.name + ': $' + localLoans.value.reduce((sum, l) => sum + l.delivered, 0).toFixed(2))
  // Aquí iría la lógica real de envío al backend
  localLoans.value = []
}

function hasAssignedLoan(memberId: string) {
  return (localLoansByMember.value[memberId]?.length > 0)
}
</script> 