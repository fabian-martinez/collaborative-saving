<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-2">Reunión en Curso</h1>
    
    <!-- Meeting Balance -->
    <div class="mb-8 p-4 bg-base-200 rounded-box grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
      <div>
        <p class="text-sm font-semibold text-base-content/70">Recaudo Total</p>
        <p class="text-4xl font-bold text-success">{{ activeMeetingStore.totalCollection.toFixed(2) }}</p>
      </div>
       <div>
        <p class="text-sm font-semibold text-base-content/70">Efectivo Disponible</p>
        <p class="text-4xl font-bold text-primary">{{ availableCash.toFixed(2) }}</p>
      </div>
      <div>
        <p class="text-sm font-semibold text-base-content/70">Intereses Generados</p>
        <p class="text-4xl font-bold text-info">{{ activeMeetingStore.totalInterest.toFixed(2) }}</p>
      </div>
    </div>

    <!-- Stepper Visual -->
    <ul class="steps w-full mb-8">
      <li class="step" :class="{ 'step-primary': activeMeetingStore.currentStep >= 1 }">Recaudo</li>
      <li class="step" :class="{ 'step-primary': activeMeetingStore.currentStep >= 2 }">Revalorización</li>
      <li class="step" :class="{ 'step-primary': activeMeetingStore.currentStep >= 3 }">Nuevas Operaciones</li>
      <li class="step" :class="{ 'step-primary': activeMeetingStore.currentStep === 4 }">Desembolsos</li>
    </ul>

    <!-- Contenido de la Etapa Actual -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <Step1Collection 
            v-if="activeMeetingStore.currentStep === 1" 
            @completed="goToNextStep"
            @update:total-collected="activeMeetingStore.setTotalCollection"
            @update:total-interest="activeMeetingStore.setTotalInterest"
        />
        <Step2Revaluation v-if="activeMeetingStore.currentStep === 2" @completed="goToNextStep" />
        <Step3Operations v-if="activeMeetingStore.currentStep === 3" @completed="goToNextStep" />
        <Step4Disbursements v-if="activeMeetingStore.currentStep === 4" @completed="finishMeeting" />
      </div>
    </div>

    <!-- Botones de navegación temporal para desarrollo -->
    <div class="mt-8 flex justify-between">
       <button 
        class="btn btn-secondary" 
        @click="goToPreviousStep" 
        :disabled="activeMeetingStore.currentStep === 1"
      >
        Anterior
      </button>
      <button 
        class="btn btn-primary" 
        @click="goToNextStep" 
        :disabled="activeMeetingStore.currentStep === 4"
      >
        Siguiente
      </button>
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
import Step3Operations from '../components/Step3Operations.vue'
import Step4Disbursements from '../components/Step4Disbursements.vue'

const activeMeetingStore = useActiveMeetingStore()
const operations = ref<Operation[]>([])
const availableCash = ref(0)

async function fetchOperations() {
  if (activeMeetingStore.meetingId) {
    try {
      operations.value = await operationsService.getOperations(activeMeetingStore.meetingId)
      calculateAvailableCash()
    } catch (error) {
      console.error("Error fetching operations for cash calculation:", error)
    }
  }
}

function calculateAvailableCash() {
  const totalIn = activeMeetingStore.totalCollection
  
  const totalOut = operations.value
    .filter(op => op.type === 'LOAN_DISBURSEMENT')
    .reduce((sum, op) => sum + (op.total_credit || 0), 0)
    
  availableCash.value = totalIn - totalOut
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

watch(() => activeMeetingStore.totalCollection, () => {
  calculateAvailableCash()
})

watch(() => activeMeetingStore.currentStep, (newStep, oldStep) => {
  if (newStep !== oldStep) {
    fetchOperations()
  }
})

function goToNextStep() {
  if (activeMeetingStore.currentStep < 4) {
    activeMeetingStore.goToStep(activeMeetingStore.currentStep + 1)
  }
}

function goToPreviousStep() {
  if (activeMeetingStore.currentStep > 1) {
    activeMeetingStore.goToStep(activeMeetingStore.currentStep - 1)
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