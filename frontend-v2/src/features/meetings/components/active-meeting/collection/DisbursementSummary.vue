<template>
  <div class="card bg-base-100 shadow-lg rounded-lg mb-6 sticky top-4 z-10">
    <div class="card-body p-4 md:p-6">
      <h3 class="text-lg font-semibold mb-4 text-center">Resumen de Caja</h3>
      <div class="space-y-4">
        <div class="text-center">
          <div class="text-xs md:text-sm font-light text-base-content/70 uppercase mb-1">
            Efectivo disponible
          </div>
          <div class="text-2xl md:text-3xl font-bold text-success">
            <CopyOnDblClickNumber :value="availableCash" />
          </div>
        </div>
        <div class="text-center pt-4 border-t border-base-300">
          <div class="text-xs md:text-sm font-light text-base-content/70 uppercase mb-1">
            Total a desembolsar
          </div>
          <div class="text-2xl md:text-3xl font-bold text-primary">
            <CopyOnDblClickNumber :value="totalToDisburse" />
          </div>
        </div>
        <div class="text-center pt-4 border-t border-base-300">
            <div class="text-xs md:text-sm font-light text-base-content/70 uppercase mb-1">
            Saldo final
            </div>
            <div 
            class="text-xl md:text-2xl font-bold"
            :class="finalBalance >= 0 ? 'text-base-content' : 'text-error'"
            >
            <CopyOnDblClickNumber :value="finalBalance" />
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'

const props = defineProps<{
  availableCash: number
  totalToDisburse: number
}>()

const finalBalance = computed(() => props.availableCash - props.totalToDisburse)
</script>
