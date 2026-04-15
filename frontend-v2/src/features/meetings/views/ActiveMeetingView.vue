<template>
  <div class="active-meeting-view bg-base-200 min-h-screen">
    <!-- Header Superior -->
    <div class="bg-base-100 shadow-sm mb-4">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <button 
          @click="goBackToMeetings"
          class="btn btn-ghost btn-sm gap-2 text-base-content/70 hover:text-base-content"
        >
          <NavArrowLeft class="w-5 h-5" />
          <span class="hidden sm:inline">Volver a Reuniones</span>
          <span class="sm:hidden">Volver</span>
        </button>
        
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 px-3 py-1.5 bg-base-100 rounded-lg border border-base-300 shadow-sm">
            <div class="relative">
              <div class="w-2 h-2 bg-error rounded-full"></div>
              <div class="absolute inset-0 w-2 h-2 bg-error rounded-full animate-ping opacity-75"></div>
            </div>
            <span class="text-sm font-medium text-base-content">En Curso</span>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto p-2 md:p-4 lg:p-6">
      <LoadingSpinner :loading="store.loading" />
      <ErrorMessage :error="store.error" />
      
      <div v-if="store.meeting && !store.loading">
        <MeetingSummaryCard :summary="store.summary" />
        <StepNavigator 
          :current-step="store.currentStep"
          @step-change="handleStepChange"
        />
        
        <!-- Contenido de los pasos -->
        <div class="mt-4 md:mt-8">
          <Step1Collection 
            v-if="store.currentStep === 1" 
            @completed="handleStepCompleted" 
          />
          <Step2Revaluation 
            v-if="store.currentStep === 2" 
            @completed="handleStepCompleted" 
          />
          <Step3StockPurchase 
            v-if="store.currentStep === 3" 
            @completed="handleStepCompleted" 
          />
          <Step4StockModification 
            v-if="store.currentStep === 4" 
            @completed="handleStepCompleted" 
          />
          <Step5Disbursements 
            v-if="store.currentStep === 5" 
          />
        </div>
      </div>
      
      <div v-else-if="!store.loading && !store.meeting" class="text-center py-12">
        <p class="text-base-content/60">No hay reunión activa</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavArrowLeft } from 'iconoir-vue/regular'
import { useActiveMeetingStore } from '../stores/activeMeeting'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import MeetingSummaryCard from '../components/active-meeting/MeetingSummaryCard.vue'
import StepNavigator from '../components/active-meeting/StepNavigator.vue'
import Step1Collection from '../components/active-meeting/Step1Collection.vue'
import Step2Revaluation from '../components/active-meeting/Step2Revaluation.vue'
import Step3StockPurchase from '../components/active-meeting/Step3StockPurchase.vue'
import Step4StockModification from '../components/active-meeting/Step4StockModification.vue'
import Step5Disbursements from '../components/active-meeting/Step5Disbursements.vue'

const router = useRouter()
const store = useActiveMeetingStore()

onMounted(async () => {
  if (!store.meeting) {
    await store.fetchActiveMeeting()
  }
  if (store.meeting && !store.summary) {
    await store.fetchSummary()
  }
})

function goBackToMeetings() {
  router.push('/meetings')
}

function handleStepChange(step: number) {
  store.goToStep(step)
}

function handleStepCompleted() {
  // Avanzar al siguiente paso cuando un paso se completa
  store.nextStep()
}
</script>

<style scoped>
.active-meeting-view {
  /* Estilos movidos a la clase del template */
}
</style>
