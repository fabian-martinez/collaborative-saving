<template>
  <div class="step-navigator mb-4 md:mb-8">
    <!-- Stepper Visual -->
    <div class="flex items-center justify-center mb-4 md:mb-6">
      <div class="flex items-center justify-between w-full max-w-4xl gap-2">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="flex items-center flex-1"
        >
          <div class="flex flex-col items-center">
            <div
              class="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all z-10 relative"
              :class="
                currentStep === step.number
                  ? 'bg-primary text-primary-content'
                  : isStepCompleted(step.number)
                  ? 'bg-success text-success-content'
                  : 'bg-base-300 text-base-content/60'
              "
            >
              <CheckCircle 
                v-if="isStepCompleted(step.number)"
                class="w-6 h-6 md:w-7 md:h-7"
              />
              <span v-else>{{ step.number }}</span>
            </div>
            <span
              class="mt-2 text-xs md:text-sm font-medium text-center whitespace-nowrap"
              :class="
                currentStep === step.number
                  ? 'text-primary'
                  : isStepCompleted(step.number)
                  ? 'text-success'
                  : 'text-base-content/60'
              "
            >
              {{ step.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Botones de Navegación -->
    <div class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
      <button
        class="btn btn-ghost w-full sm:w-auto text-base-content/70"
        :disabled="currentStep === 1"
        @click="handlePrevious"
      >
        ← Anterior
      </button>
      <button
        class="btn btn-primary w-full sm:w-auto"
        :disabled="currentStep === 5"
        @click="handleNext"
      >
        Siguiente →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle } from 'iconoir-vue/regular'

const props = defineProps<{
  currentStep: number
}>()

const emit = defineEmits<{
  stepChange: [step: number]
}>()

const steps = computed(() => [
  { number: 1, name: 'Recaudación' },
  { number: 2, name: 'Revalorización' },
  { number: 3, name: 'Compra' },
  { number: 4, name: 'Modificación' },
  { number: 5, name: 'Desembolsos' }
])

function isStepCompleted(stepNumber: number): boolean {
  return stepNumber < props.currentStep
}

function handlePrevious() {
  if (props.currentStep > 1) {
    emit('stepChange', props.currentStep - 1)
  }
}

function handleNext() {
  if (props.currentStep < 5) {
    emit('stepChange', props.currentStep + 1)
  }
}
</script>

