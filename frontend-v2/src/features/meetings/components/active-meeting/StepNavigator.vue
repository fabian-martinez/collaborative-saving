<template>
  <div class="step-navigator card bg-base-100 border border-base-200 shadow-sm mb-1.5 rounded-xl">
    <div class="card-body p-1.5">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 md:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-base-200">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="flex-1 flex items-center justify-center py-1 sm:py-0 sm:px-1.5 first:pl-0 last:pr-0"
        >
          <!-- Active Step -->
          <div
            v-if="currentStep === step.number"
            class="flex items-center gap-2 bg-teal-700 text-white px-3 py-1.5 rounded-lg shadow-sm font-semibold text-xs w-full sm:w-auto justify-center"
          >
            <span class="w-4.5 h-4.5 rounded-full bg-white text-teal-700 flex items-center justify-center text-[10px] font-bold shrink-0">
              {{ step.number }}
            </span>
            <span>{{ step.name }}</span>
          </div>

          <!-- Completed Step -->
          <div
            v-else-if="isStepCompleted(step.number)"
            class="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs cursor-pointer hover:text-emerald-700 transition-colors w-full justify-center"
            @click="handleStepClick(step.number)"
          >
            <!-- Checkmark Icon -->
            <Check class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{{ step.name }}</span>
          </div>

          <!-- Future Step -->
          <div
            v-else
            class="flex items-center gap-1.5 text-base-content/40 font-semibold text-xs cursor-pointer hover:text-base-content/60 transition-colors w-full justify-center"
            @click="handleStepClick(step.number)"
          >
            <span class="text-base-content/30 text-[10px]">{{ step.number }}</span>
            <span>{{ step.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'iconoir-vue/regular'

const props = defineProps<{
  currentStep: number
}>()

const emit = defineEmits<{
  stepChange: [step: number]
}>()

const steps = computed(() => [
  { number: 1, name: 'Cobranzas' },
  { number: 2, name: 'Revalorización' },
  { number: 3, name: 'Compra Acciones' },
  { number: 4, name: 'Modificar Acciones' },
  { number: 5, name: 'Desembolsos' }
])

function isStepCompleted(stepNumber: number): boolean {
  return stepNumber < props.currentStep
}

function handleStepClick(stepNumber: number) {
  emit('stepChange', stepNumber)
}
</script>


