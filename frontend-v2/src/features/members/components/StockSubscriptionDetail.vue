<template>
  <Modal :show="visible" :title="subscription ? `Detalle de Suscripción: ${subscription.stock_type}` : 'Detalle de Suscripción'" @close="$emit('close')">
    <div v-if="loading" class="flex items-center justify-center py-8">
      <LoadingSpinner message="Cargando detalles..." />
    </div>

    <div v-else-if="error" class="alert alert-error">
      <ErrorMessage :error="error" />
    </div>

    <div v-else-if="subscription" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-semibold text-base-content/70">Tipo de Acción</label>
          <div class="mt-1 text-lg">{{ subscription.stock_type }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-base-content/70">Cantidad</label>
          <div class="mt-1 text-lg font-mono">{{ subscription.quantity }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-base-content/70">Fecha de Compra</label>
          <div class="mt-1">{{ formatDate(subscription.purchase_date) }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-base-content/70">Estado</label>
          <div class="mt-1">
            <Badge :variant="subscription.status === 'active' ? 'success' : 'neutral'">
              {{ subscription.status === 'active' ? 'Activa' : 'Inactiva' }}
            </Badge>
          </div>
        </div>
        <div v-if="subscription.financing_loan_id" class="col-span-2">
          <label class="text-sm font-semibold text-base-content/70">Préstamo Asociado</label>
          <div class="mt-1">
            <button class="btn btn-sm btn-link" @click="viewLoan(subscription.financing_loan_id!)">
              Ver préstamo #{{ subscription.financing_loan_id }}
            </button>
          </div>
        </div>
      </div>

      <div class="divider">Acciones Disponibles</div>

      <div class="flex flex-wrap gap-2">
        <button class="btn btn-sm btn-outline" @click="$emit('exchange', subscription)">
          Intercambiar
        </button>
        <button class="btn btn-sm btn-outline" @click="$emit('transfer', subscription)">
          Transferir
        </button>
        <button class="btn btn-sm btn-outline" @click="$emit('use-for-payment', subscription)">
          Usar para Pago
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/shared/components/Modal.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import Badge from '@/shared/components/Badge.vue'
import { formatDate } from '@/shared/utils/formatters'
import type { StockSubscription } from '@/api/members.api'
import { membersApi } from '@/api/members.api'

const props = defineProps<{
  visible: boolean
  memberId: string
  subscriptionId: string | null
}>()

const emit = defineEmits<{
  close: []
  exchange: [subscription: StockSubscription]
  transfer: [subscription: StockSubscription]
  'use-for-payment': [subscription: StockSubscription]
  'view-loan': [loanId: string]
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const subscription = ref<StockSubscription | null>(null)

async function loadSubscription() {
  if (!props.subscriptionId) return

  loading.value = true
  error.value = null

  try {
    subscription.value = await membersApi.getStockSubscriptionById(props.memberId, props.subscriptionId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar suscripción'
  } finally {
    loading.value = false
  }
}

function viewLoan(loanId: string) {
  emit('view-loan', loanId)
}

watch(() => props.visible, (newValue) => {
  if (newValue && props.subscriptionId) {
    loadSubscription()
  } else {
    subscription.value = null
  }
})

watch(() => props.subscriptionId, () => {
  if (props.visible && props.subscriptionId) {
    loadSubscription()
  }
}, { immediate: true })
</script>

