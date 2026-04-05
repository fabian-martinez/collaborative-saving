<template>
  <div
    :id="receiptId"
    class="bg-base-100 p-4 md:p-6 rounded-2xl shadow-lg font-sans print-container"
  >
    <div class="flex justify-between items-start mb-4 md:mb-6 no-print">
      <div class="flex-1 text-center">
        <h2 class="text-xl md:text-2xl font-bold">{{ title }}</h2>
        <p class="text-base md:text-lg text-base-content/80 wrap-break-word">
          {{ memberName }}
        </p>
      </div>
      <button
        @click="$emit('open-print-modal')"
        class="btn btn-outline btn-secondary btn-sm ml-4"
        title="Vista previa e imprimir recibo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        Imprimir
      </button>
    </div>
    <div class="print-header print-only">
      <h2 class="text-2xl font-bold text-center mb-2">{{ title }}</h2>
      <p class="text-lg text-center mb-1">{{ memberName }}</p>
      <p class="text-sm text-center text-base-content/70">{{ printDate }}</p>
    </div>
    <div class="space-y-3 md:space-y-4">
      <OperationDetails
        v-for="op in viewedOperations"
        :key="op.id || op.operation_id"
        :operation="op"
      />
      <div
        class="mt-6 md:mt-8 pt-4 border-t-2 border-dashed border-base-300/50 print-total"
      >
        <div
          class="flex items-baseline justify-between text-lg md:text-xl lg:text-2xl font-bold gap-2"
        >
          <span class="shrink-0">{{ totalLabel }}</span>
          <div
            class="hidden md:block print-show grow border-b-2 border-dotted border-base-300/70 mx-2 md:mx-4"
          ></div>
          <span
            class="shrink-0 text-primary font-mono text-base md:text-xl lg:text-2xl whitespace-nowrap no-print"
          >
            <CopyOnDblClickNumber :value="viewedTotal" />
          </span>
          <span
            class="shrink-0 text-primary font-mono text-base md:text-xl lg:text-2xl whitespace-nowrap print-only"
          >
            {{ formatCurrency(viewedTotal) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '@/shared/utils/formatters'
import OperationDetails from '@/shared/components/OperationDetails.vue'
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'

// Props with defaults
const props = withDefaults(defineProps<{
  memberName: string
  printDate: string
  viewedOperations: any[]
  viewedTotal: number
  title?: string
  totalLabel?: string
  receiptId?: string
}>(), {
  title: 'Detalle del Pago',
  totalLabel: 'Total Pagado:',
  receiptId: 'payment-receipt-print'
})

// Emits
defineEmits<{
  'open-print-modal': []
}>()
</script>
