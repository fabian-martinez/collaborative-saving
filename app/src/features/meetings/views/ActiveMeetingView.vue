<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-2">Reunión en Curso</h1>
    
    <!-- Meeting Balance -->
    <div class="mb-8 p-4 bg-base-200 rounded-box grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
      <div>
        <p class="text-sm font-semibold text-base-content/70">Recaudo Total</p>
        <p class="text-4xl font-bold text-success">{{ totalCollection.toFixed(2) }}</p>
      </div>
       <div>
        <p class="text-sm font-semibold text-base-content/70">Efectivo Disponible</p>
        <p class="text-4xl font-bold text-primary">{{ availableCash.toFixed(2) }}</p>
      </div>
      <div>
        <p class="text-sm font-semibold text-base-content/70">Intereses Generados</p>
        <p class="text-4xl font-bold text-info">{{ -totalInterest.toFixed(2) }}</p>
      </div>
    </div>

    <!-- Stepper Visual -->
    <ul class="steps w-full">
      <li class="step" :class="{ 'step-primary': activeMeetingStore.currentStep === 1 }">Recaudación</li>
      <li class="step" :class="{ 'step-primary': activeMeetingStore.currentStep === 2 }">Revalorización</li>
      <li class="step" :class="{ 'step-primary': activeMeetingStore.currentStep === 3 }">Compra</li>
      <li class="step" :class="{ 'step-primary': activeMeetingStore.currentStep === 4 }">Modificación</li>
      <li class="step" :class="{ 'step-primary': activeMeetingStore.currentStep === 5 }">Desembolsos</li>
    </ul>

    <!-- Botones de navegación -->
    <div class="mt-6 mb-8 flex justify-center gap-20">
      <button 
        class="btn btn-secondary px-8 py-3 min-h-12" 
        @click="goToPreviousStep" 
        :disabled="activeMeetingStore.currentStep === 1"
      >
        ← Anterior
      </button>
      <button 
        class="btn btn-primary p-10 py-3 min-h-12" 
        @click="goToNextStep" 
        :disabled="activeMeetingStore.currentStep >= 5"
        :class="{ 'btn-disabled': activeMeetingStore.currentStep >= 5 }"
      >
        Siguiente →
      </button>
    </div>

    <!-- Contenido de los pasos -->
    <div class="mt-8">
      <Step1Collection v-if="activeMeetingStore.currentStep === 1" @completed="goToNextStep" />
      <Step2Revaluation v-if="activeMeetingStore.currentStep === 2" @completed="goToNextStep" />
      <Step3StockPurchase v-if="activeMeetingStore.currentStep === 3" @completed="goToNextStep" />
      <Step4StockModification v-if="activeMeetingStore.currentStep === 4" @completed="goToNextStep" />
      <Step5Disbursements v-if="activeMeetingStore.currentStep === 5" @completed="finishMeeting" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useActiveMeetingStore } from '@/features/meetings/stores/activeMeeting'
import { operationsService } from '@/features/operations/services/operationsService'
import type { Operation } from '@/features/operations/types'
import Step1Collection from '../components/Step1Collection.vue'
import Step2Revaluation from '../components/Step2Revaluation.vue'
import Step3StockPurchase from '../components/Step3StockPurchase.vue'
import Step4StockModification from '../components/Step4StockModification.vue'
import Step5Disbursements from '../components/Step5Disbursements.vue'

const activeMeetingStore = useActiveMeetingStore()
const operations = ref<Operation[]>([])
const availableCash = ref(0)
const totalCollection = ref(0)
const totalInterest = ref(0)

async function fetchOperations() {
  if (activeMeetingStore.meetingId) {
    try {
      operations.value = await (
        await operationsService.getOperations({
          meetingId: activeMeetingStore.meetingId,
        })
      ).data
      calculateTotals()
    } catch (error) {
      console.error("Error fetching operations for cash calculation:", error)
    }
  }
}

function calculateTotals() {
  let recaudado = 0
  let efectivo = 0
  let intereses = 0

  operations.value.forEach(op => {
    op.ledger_entries.forEach(entry => {
      if (entry.account_type.toUpperCase() === 'CASH') {
        if (entry.amount > 0) recaudado += Number(entry.amount)
        efectivo += Number(entry.amount)
      }
      if (entry.account_type.toUpperCase() === 'INTEREST_INCOME') {
        intereses += Number(entry.amount)
      }
    })
  })
  totalCollection.value = recaudado
  availableCash.value = efectivo
  totalInterest.value = intereses
}

onMounted(() => {
  if (!activeMeetingStore.meetingId) {
    activeMeetingStore.fetchActiveMeeting().then(() => {
      fetchOperations()
    })
  } else {
    fetchOperations()
  }
})

watch(() => activeMeetingStore.currentStep, (newStep, oldStep) => {
  if (newStep !== oldStep) {
    fetchOperations()
  }
})

function goToNextStep() {
  console.log('goToNextStep called, current step:', activeMeetingStore.currentStep)
  if (activeMeetingStore.currentStep < 5) {
    const nextStep = activeMeetingStore.currentStep + 1
    console.log('Moving to step:', nextStep)
    activeMeetingStore.goToStep(nextStep)
  } else {
    console.log('Already at final step, cannot go next')
  }
}

function goToPreviousStep() {
  console.log('goToPreviousStep called, current step:', activeMeetingStore.currentStep)
  if (activeMeetingStore.currentStep > 1) {
    const prevStep = activeMeetingStore.currentStep - 1
    console.log('Moving to step:', prevStep)
    activeMeetingStore.goToStep(prevStep)
  } else {
    console.log('Already at first step, cannot go back')
  }
}

function finishMeeting() {
  // Lógica para finalizar y archivar la reunión
  alert('¡Reunión finalizada!')
  // Potentially reset store and redirect
  // activeMeetingStore.$reset()
  // router.push('/meetings')
}
</script>

<style scoped>
/* Estilos específicos para esta vista si son necesarios */
</style> 