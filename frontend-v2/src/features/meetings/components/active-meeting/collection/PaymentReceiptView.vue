<template>
  <div
    :id="receiptId"
    class="bg-base-100 p-3 md:p-4 rounded-xl shadow-md font-sans print-container"
  >
    <div class="flex justify-between items-start mb-2 md:mb-3 no-print">
      <div class="flex-1 text-center">
        <h2 class="text-sm md:text-base font-bold">{{ title }}</h2>
        <p class="text-xs font-semibold text-base-content/80 wrap-break-word mt-0.5">
          {{ memberName }}
        </p>
      </div>
      <button
        @click="$emit('open-print-modal')"
        class="btn btn-outline btn-secondary btn-xs ml-4 rounded font-semibold"
        title="Vista previa e imprimir recibo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-3.5 w-3.5 mr-1"
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
      <h2 class="text-base font-bold text-center mb-1">{{ title }}</h2>
      <p class="text-sm text-center mb-0.5">{{ memberName }}</p>
      <p class="text-xs text-center text-base-content/70">{{ printDate }}</p>
    </div>
    <div class="space-y-2">
      <OperationDetails
        v-for="op in viewedOperations"
        :key="op.id || op.operation_id"
        :operation="op"
      />
      <div
        class="mt-4 pt-3 border-t border-dashed border-base-300 print-total"
      >
        <div
          class="flex items-baseline justify-between text-xs md:text-sm font-bold gap-2"
        >
          <span class="shrink-0">{{ totalLabel }}</span>
          <div
            class="hidden md:block print-show grow border-b border-dotted border-base-200 mx-2"
          ></div>
          <span
            class="shrink-0 text-primary font-mono text-xs md:text-sm whitespace-nowrap no-print font-extrabold"
          >
            <CopyOnDblClickNumber :value="viewedTotal" />
          </span>
          <span
            class="shrink-0 text-primary font-mono text-xs md:text-sm whitespace-nowrap print-only font-extrabold"
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
withDefaults(defineProps<{
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

