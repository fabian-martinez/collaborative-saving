<template>
  <div 
    class="card bg-base-100 shadow-lg rounded-lg mb-6"
    :class="{ 'sticky top-4 z-10': isSticky }"
  >
    <div class="card-body p-4 md:p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Resumen de Caja</h3>
        <button 
          class="btn btn-ghost btn-sm" 
          @click="toggleSticky"
          :title="isSticky ? 'Desfijar' : 'Fijar'"
          :aria-label="isSticky ? 'Desfijar resumen' : 'Fijar resumen'"
        >
          <Pin v-if="isSticky" class="w-5 h-5 text-primary" />
          <PinSlash v-else class="w-5 h-5 text-base-content/50" />
        </button>
      </div>
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
import { computed, ref } from 'vue'
import { Pin, PinSlash } from 'iconoir-vue/regular'
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'

const props = withDefaults(defineProps<{
  availableCash: number
  totalToDisburse: number
  sticky?: boolean
}>(), {
  sticky: true
})

const isSticky = ref(props.sticky ?? true)

const toggleSticky = () => {
  isSticky.value = !isSticky.value
}

const finalBalance = computed(() => props.availableCash - props.totalToDisburse)
</script>
