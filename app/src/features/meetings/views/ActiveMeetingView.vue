<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-2">Reunión en Curso</h1>
    
    <!-- Meeting Balance -->
    <div class="mb-8 p-4 bg-base-200 rounded-box grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
      <div>
        <p class="text-sm font-semibold text-base-content/70">Recaudo Total</p>
        <CopyOnDblClickNumber :value="totalCollection" class="text-4xl font-bold text-success" />
      </div>
       <div>
        <p class="text-sm font-semibold text-base-content/70">Efectivo Disponible</p>
        <CopyOnDblClickNumber :value="availableCash" class="text-4xl font-bold text-primary" />
      </div>
      <div>
        <p class="text-sm font-semibold text-base-content/70">Intereses Generados</p>
        <CopyOnDblClickNumber :value="-totalInterest" class="text-4xl font-bold text-info" />
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
      <Step5Disbursements v-if="activeMeetingStore.currentStep === 5" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useActiveMeetingStore } from '@/features/meetings/stores/activeMeeting'
import { meetingsService } from '../services/meetings'
// Type not used in current implementation
// import type { Operation } from '@/features/operations/types'
import Step1Collection from '../components/Step1Collection.vue'
import Step2Revaluation from '../components/Step2Revaluation.vue'
import Step3StockPurchase from '../components/Step3StockPurchase.vue'
import Step4StockModification from '../components/Step4StockModification.vue'
import Step5Disbursements from '../components/Step5Disbursements.vue'
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'

const activeMeetingStore = useActiveMeetingStore()
// Operations not used in current implementation
// const operations = ref<Operation[]>([])
const availableCash = ref(0)
const totalCollection = ref(0)
const totalInterest = ref(0)
const loadingSummary = ref(false)
const summaryError = ref('')

async function fetchMeetingSummary() {
  loadingSummary.value = true
  summaryError.value = ''
  try {
    // Usar getActiveMeetingWithSummary para obtener siempre la reunión activa actualizada
    const summary = await meetingsService.getActiveMeetingWithSummary()
    totalCollection.value = summary.totalCollected ?? 0
    availableCash.value = summary.totalCash ?? 0
    totalInterest.value = summary.totalInterest ?? 0
  } catch {
    summaryError.value = 'Error al obtener el resumen de la reunión'
    totalCollection.value = 0
    availableCash.value = 0
    totalInterest.value = 0
  } finally {
    loadingSummary.value = false
  }
}

onMounted(() => {
  if (!activeMeetingStore.meetingId) {
    activeMeetingStore.fetchActiveMeeting().then(() => {
      fetchMeetingSummary()
    })
  } else {
    fetchMeetingSummary()
  }
})

watch(() => activeMeetingStore.currentStep, (newStep, oldStep) => {
  if (newStep !== oldStep) {
    fetchMeetingSummary()
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

// Function not used in current implementation
// function finishMeeting() {
//   // Lógica para finalizar y archivar la reunión
//   alert('¡Reunión finalizada!')
//   // Potentially reset store and redirect
//   // activeMeetingStore.$reset()
//   // router.push('/meetings')
// }
</script>

<style scoped>
/* Estilos específicos para esta vista si son necesarios */
</style> 