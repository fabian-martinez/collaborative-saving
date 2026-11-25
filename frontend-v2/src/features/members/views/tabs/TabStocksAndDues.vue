<template>
  <div class="py-4 space-y-4 w-full max-w-full min-w-0 overflow-x-hidden">
    <!-- Suscripciones de Acciones (sin barras de progreso, con Valor de suscripción y Cuota) -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-base-content">
        Suscripciones de Acciones ({{ store.totalStockUnits }} unidades)
      </h3>
      <span class="text-xs font-semibold font-mono text-base-content">
        Total: {{ formatCurrency(store.totalInStocks) }}
      </span>
    </div>

    <LoadingSpinner :loading="store.loadingSubscriptions" message="Cargando suscripciones..." />

    <div
      v-if="!store.loadingSubscriptions && activeSubscriptions.length === 0"
      class="text-center py-6 text-xs text-base-content/60 border border-base-300 rounded-xl"
    >
      No hay suscripciones activas
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        v-for="sub in activeSubscriptions"
        :key="sub.id"
        class="bg-base-200/60 border border-base-300 rounded-xl p-4 space-y-3 text-xs"
      >
        <div class="flex justify-between items-start gap-2">
          <div>
            <p class="font-semibold text-sm text-base-content">{{ sub.stock_type }}</p>
            <p class="text-base-content/70">
              {{ sub.quantity }} {{ sub.quantity === 1 ? 'unidad' : 'unidades' }}
            </p>
          </div>
          <span class="badge badge-sm badge-success">Activa</span>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2 border-t border-base-300">
          <div>
            <span class="text-base-content/70">Valor de suscripción</span>
            <p class="font-bold text-sm font-mono mt-0.5 text-base-content">
              {{ formatCurrency(store.getSubscriptionFinancials(sub).subscriptionValue) }}
            </p>
          </div>
          <div>
            <span class="text-base-content/70">Cuota</span>
            <p class="font-bold text-sm font-mono mt-0.5 text-warning">
              {{ formatCurrency(store.getSubscriptionFinancials(sub).currentFee) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import { formatCurrency } from '@/shared/utils/formatters'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

const props = defineProps<{
  memberId: string
  store: ReturnType<typeof useMemberDetailStore>
}>()

const activeSubscriptions = computed(() => {
  return props.store.stockSubscriptions.filter(sub => sub.status === 'active')
})
</script>
