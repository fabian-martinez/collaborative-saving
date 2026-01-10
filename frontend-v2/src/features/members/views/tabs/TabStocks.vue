<template>
  <div class="tab-stocks">
    <div class="stocks-header mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
      <div class="filters">
        <select v-model="filterStatus" class="select select-bordered">
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
      </div>
    </div>

    <LoadingSpinner :loading="store.loadingSubscriptions" message="Cargando suscripciones..." />

    <div v-if="!store.loadingSubscriptions && filteredSubscriptions.length === 0" class="text-center py-8 text-base-content/60">
      No hay suscripciones registradas
    </div>

    <div v-if="!store.loadingSubscriptions && filteredSubscriptions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 sm:gap-6">
      <div
        v-for="subscription in filteredSubscriptions"
        :key="subscription.id"
        class="card bg-base-100 border border-base-300 cursor-pointer hover:shadow-lg transition-shadow"
        @click="$emit('view-subscription', subscription.id)"
      >
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h3 class="card-title text-base sm:text-lg">{{ subscription.stock_type }}</h3>
            <span :class="['badge', 'badge-sm', subscription.status === 'active' ? 'badge-success' : 'badge-neutral']">
              {{ subscription.status === 'active' ? 'Activa' : 'Inactiva' }}
            </span>
          </div>
          <div class="space-y-2">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <span class="text-xs sm:text-sm text-base-content/70">Cantidad:</span>
              <span class="text-sm sm:text-base font-mono">{{ subscription.quantity }}</span>
            </div>
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <span class="text-xs sm:text-sm text-base-content/70">Fecha de Compra:</span>
              <span class="text-sm sm:text-base">{{ formatDate(subscription.purchase_date) }}</span>
            </div>
            <div v-if="subscription.financing_loan_id" class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <span class="text-xs sm:text-sm text-base-content/70">Préstamo:</span>
              <span class="text-sm">#{{ subscription.financing_loan_id.substring(0, 8) }}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import { formatDate } from '@/shared/utils/formatters'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

const props = defineProps<{
  memberId: string
  store: ReturnType<typeof useMemberDetailStore>
}>()

const emit = defineEmits<{
  'view-subscription': [subscriptionId: string]
}>()

const filterStatus = ref<'all' | 'active' | 'inactive'>('all')

const filteredSubscriptions = computed(() => {
  if (filterStatus.value === 'all') {
    return props.store.stockSubscriptions
  }
  return props.store.stockSubscriptions.filter(
    sub => sub.status === filterStatus.value
  )
})
</script>

<style scoped>
.tab-stocks {
  padding: 1rem 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  box-sizing: border-box;
}


</style>

