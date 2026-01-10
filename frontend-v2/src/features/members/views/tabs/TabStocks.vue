<template>
  <div class="tab-stocks">
    <div class="stocks-header">
      <div class="filters">
        <select v-model="filterStatus" class="select select-bordered">
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
      </div>
    </div>

    <LoadingSpinner :loading="store.loadingSubscriptions" message="Cargando suscripciones..." />

    <div v-if="!store.loadingSubscriptions && filteredSubscriptions.length === 0" class="text-center py-8 text-gray-500">
      No hay suscripciones registradas
    </div>

    <div v-if="!store.loadingSubscriptions && filteredSubscriptions.length > 0" class="subscriptions-grid">
      <Card
        v-for="subscription in filteredSubscriptions"
        :key="subscription.id"
        variant="bordered"
        hover
        class="subscription-card"
        @click="$emit('view-subscription', subscription.id)"
      >
        <div class="subscription-header">
          <h3 class="subscription-type">{{ subscription.stock_type }}</h3>
          <Badge :variant="subscription.status === 'active' ? 'success' : 'neutral'">
            {{ subscription.status === 'active' ? 'Activa' : 'Inactiva' }}
          </Badge>
        </div>
        <div class="subscription-body">
          <div class="subscription-info">
            <div class="info-row">
              <span class="label">Cantidad:</span>
              <span class="value font-mono">{{ subscription.quantity }}</span>
            </div>
            <div class="info-row">
              <span class="label">Fecha de Compra:</span>
              <span class="value">{{ formatDate(subscription.purchase_date) }}</span>
            </div>
            <div v-if="subscription.financing_loan_id" class="info-row">
              <span class="label">Préstamo:</span>
              <span class="value text-sm">#{{ subscription.financing_loan_id.substring(0, 8) }}...</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Card from '@/shared/components/Card.vue'
import Badge from '@/shared/components/Badge.vue'
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
  overflow-x: hidden;
  box-sizing: border-box;
}

.stocks-header {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 640px) {
  .stocks-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0;
  }
}

.subscriptions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .subscriptions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .subscriptions-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

.subscription-card {
  cursor: pointer;
}

.subscription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.subscription-type {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

@media (min-width: 640px) {
  .subscription-type {
    font-size: 1.125rem;
  }
}

.subscription-body {
  padding: 0;
}

.subscription-info > * + * {
  margin-top: 0.75rem;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0;
}

@media (min-width: 640px) {
  .info-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0;
  }
}

.info-row + .info-row {
  border-top: 1px solid #f3f4f6;
  padding-top: 0.75rem;
}

.label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

@media (min-width: 640px) {
  .label {
    font-size: 0.875rem;
  }
}

.value {
  font-size: 0.75rem;
  color: #1f2937;
  word-wrap: break-word;
  overflow-wrap: break-word;
  text-align: right;
}

@media (min-width: 640px) {
  .value {
    font-size: 0.875rem;
    text-align: left;
  }
}
</style>

