<template>
  <div class="mt-4 p-4 bg-base-200 rounded-box space-y-4">
    <div>
      <div class="text-center">
        <div class="text-sm font-light text-base-content/70 uppercase">
          Total Aportes Recaudados
        </div>
        <div class="text-3xl font-bold text-primary">
          <CopyOnDblClickNumber :value="totalCollected" />
        </div>
      </div>
    </div>

    <div class="border-t border-base-300/50"></div>

    <div>
      <h4 class="font-semibold text-center text-base-content/80 mb-2">
        Pagos Registrados
      </h4>
      <div v-if="completedPayments.length > 0" class="space-y-2">
        <div
          v-for="(payment, index) in completedPayments"
          :key="index"
          class="flex justify-between items-center bg-base-100/50 p-2 rounded-md text-sm"
        >
          <span class="font-medium">{{ payment.memberName }}</span>
          <span class="font-mono text-success font-bold">
            <CopyOnDblClickNumber :value="payment.amount" />
          </span>
        </div>
      </div>
      <p v-else class="text-base-content/60 italic text-sm text-center">
        Sin pagos aún.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'

// Props
defineProps<{
  totalCollected: number
  completedPayments: Array<{ memberName: string; amount: number }>
}>()
</script>

