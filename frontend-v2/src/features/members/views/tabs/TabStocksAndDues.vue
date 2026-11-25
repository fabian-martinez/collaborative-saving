<template>
  <div class="py-4 space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
    <!-- Suscripciones de Acciones (sin barras de progreso, con Valor de suscripción y Cuota) -->
    <div class="space-y-3">
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
          class="bg-base-200/60 border border-base-300 rounded-xl p-4 space-y-3 text-xs cursor-pointer hover:border-primary/50 transition-colors"
          @click="$emit('view-subscription', sub.id)"
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

    <!-- Obligaciones y Aportes -->
    <div class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-sm font-semibold text-base-content">Obligaciones y Aportes</h3>
        <div class="flex gap-1.5 text-xs">
          <button
            :class="['btn btn-xs', duesFilter === 'pending' ? 'btn-primary' : 'btn-ghost border border-base-300']"
            @click="duesFilter = 'pending'"
          >
            Pendientes ({{ store.dues.length }})
          </button>
          <button
            :class="['btn btn-xs', duesFilter === 'paid' ? 'btn-primary' : 'btn-ghost border border-base-300']"
            @click="duesFilter = 'paid'"
          >
            Pagadas ({{ paidContributionPayments.length }})
          </button>
        </div>
      </div>

      <div
        v-if="duesFilter === 'pending'"
        class="border border-base-300 rounded-xl divide-y divide-base-300 text-xs"
      >
        <div v-if="store.dues.length === 0" class="p-6 text-center text-base-content/60">
          No hay obligaciones pendientes
        </div>
        <div
          v-for="due in store.dues"
          :key="due.reference_id || due.description"
          class="p-3.5 flex items-center justify-between gap-3"
        >
          <div>
            <p class="font-semibold text-base-content">{{ due.description }}</p>
            <span :class="due.type === 'stock_fee' ? 'text-warning' : 'text-base-content/60'">
              {{ formatDueOrPaymentType(due.type) }}
            </span>
          </div>
          <span class="font-bold font-mono text-sm text-base-content">
            {{ formatCurrency(due.amount) }}
          </span>
        </div>
      </div>

      <div
        v-else
        class="border border-base-300 rounded-xl divide-y divide-base-300 text-xs"
      >
        <div v-if="paidContributionPayments.length === 0" class="p-6 text-center text-base-content/60">
          No hay pagos de aportes o cuotas registrados
        </div>
        <div
          v-for="payment in paidContributionPayments"
          :key="payment.operation_id"
          class="p-3.5 flex items-center justify-between gap-3"
        >
          <div>
            <p class="font-semibold text-base-content">{{ formatDueOrPaymentType(payment.type) }}</p>
            <span class="text-base-content/60">{{ formatDate(payment.date) }}</span>
          </div>
          <span class="font-bold font-mono text-sm text-success">
            {{ formatCurrency(payment.total_amount) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { formatDueOrPaymentType } from '@/features/members/utils/memberLabels'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

const props = defineProps<{
  memberId: string
  store: ReturnType<typeof useMemberDetailStore>
}>()

defineEmits<{
  'view-subscription': [subscriptionId: string]
}>()

const duesFilter = ref<'pending' | 'paid'>('pending')

const activeSubscriptions = computed(() => {
  return props.store.stockSubscriptions.filter(sub => sub.status === 'active')
})

const paidContributionPayments = computed(() => {
  return props.store.payments.filter(
    p => p.type === 'mandatory_contribution' || p.type === 'stock_fee' || p.type === 'insurance'
  )
})
</script>
