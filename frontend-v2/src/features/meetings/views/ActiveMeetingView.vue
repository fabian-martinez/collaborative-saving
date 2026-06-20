<template>
  <div class="active-meeting-view bg-base-200 h-full max-h-full flex flex-col overflow-hidden">
    <!-- Header Superior -->
    <div class="bg-base-100 border-b border-base-200 flex-shrink-0">
      <div class="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between">
        <button 
          @click="goBackToMeetings"
          class="btn btn-ghost btn-sm gap-2 text-base-content/60 hover:text-base-content font-medium text-sm normal-case p-0 bg-transparent hover:bg-transparent"
        >
          <NavArrowLeft class="w-5 h-5" />
          <span>Volver a Reuniones</span>
        </button>
        
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 px-3 py-1 bg-error/5 border border-error/30 rounded-full text-error text-xs font-bold">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
            </span>
            <span>Reunión #{{ store.meeting?.id || '' }} En Curso</span>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 md:px-6 py-1.5 w-full flex-1 flex flex-col overflow-hidden min-h-0">
      <LoadingSpinner :loading="store.loading" />
      <ErrorMessage :error="store.error" />
      
      <div v-if="store.meeting && !store.loading" class="flex-1 flex flex-col overflow-hidden min-h-0">
        <MeetingSummaryCard :summary="store.summary" class="flex-shrink-0" />
        <StepNavigator 
          :current-step="store.currentStep"
          @step-change="handleStepChange"
          class="flex-shrink-0 mt-2"
        />
        
        <!-- Contenido de los pasos -->
        <div class="mt-2.5 flex-1 overflow-hidden min-h-0">
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
      
      <div v-else-if="!store.loading && !store.meeting" class="text-center py-12 flex-shrink-0">
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
