<template>
  <div class="pending-payments-view space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Pagos Pendientes</h1>
        <p class="text-base-content/70">Gestiona los pagos pendientes, aprobados o rechazados.</p>
      </div>
      <div class="flex gap-2">
        <button @click="loadData" class="btn btn-primary" :disabled="store.isLoading">
          <Refresh class="w-5 h-5" :class="{ 'animate-spin': store.isLoading }" />
          Actualizar
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-base-200 p-4 rounded-lg flex flex-col sm:flex-row gap-4">
      <div class="form-control w-full max-w-xs">
        <label class="label"><span class="label-text">Estado</span></label>
        <select class="select select-bordered" v-model="filters.status" @change="loadData">
          <option value="">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
          <option value="paid">Pagados</option>
        </select>
      </div>
      
      <div class="form-control w-full max-w-xs">
        <label class="label"><span class="label-text">Tipo</span></label>
        <select class="select select-bordered" v-model="filters.type" @change="loadData">
          <option value="">Todos</option>
          <option value="dividend">Dividendo</option>
          <option value="stock_withdrawal">Retiro de Acciones</option>
          <option value="loan">Préstamo</option>
          <option value="partial_settlement">Liquidación Parcial</option>
          <option value="other">Otro</option>
        </select>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="store.error" class="alert alert-error">
      <InfoCircle class="w-6 h-6" />
      <span>{{ store.error }}</span>
    </div>

    <!-- Loading state -->
    <div v-if="store.isLoading && store.payments.length === 0" class="flex justify-center p-8">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto bg-base-100 rounded-box border border-base-200">
      <table class="table w-full">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Miembro</th>
            <th>Tipo</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Notas</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.payments.length === 0">
            <td colspan="7" class="text-center py-8 text-base-content/50">
              No hay pagos que coincidan con los filtros actuales.
            </td>
          </tr>
          <tr v-for="payment in store.payments" :key="payment.id" class="hover">
            <td>{{ formatDate(payment.createdAt) }}</td>
            <td>
              <div class="font-bold">{{ payment.memberName || 'Usuario Desconocido' }}</div>
            </td>
            <td>{{ formatType(payment.type) }}</td>
            <td class="font-bold text-success">{{ formatCurrency(payment.amount) }}</td>
            <td>
              <div class="badge" :class="getStatusBadgeClass(payment.status)">
                {{ formatStatus(payment.status) }}
              </div>
            </td>
            <td class="max-w-xs truncate" :title="payment.notes || ''">
              {{ payment.notes || '-' }}
            </td>
            <td class="text-right flex justify-end gap-2">
              <button 
                class="btn btn-sm btn-ghost btn-square" 
                @click="openEditModal(payment)"
                title="Editar"
              >
                <Edit class="w-4 h-4 text-primary" />
              </button>
              <button 
                class="btn btn-sm btn-ghost btn-square" 
                @click="confirmDelete(payment)"
                :disabled="payment.status === 'paid'"
                title="Eliminar"
              >
                <Trash class="w-4 h-4 text-error" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Modal -->
    <EditPendingPaymentModal 
      modalId="edit-payment-modal"
      :payment="selectedPayment"
      @close="selectedPayment = null"
      @updated="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePendingPaymentsStore } from '../stores/pendingPaymentsStore'
import { Refresh, Edit, Trash, InfoCircle } from 'iconoir-vue/regular'
import type { PendingPayment } from '@/api/pending-payments.api'
import EditPendingPaymentModal from '../components/EditPendingPaymentModal.vue'

const store = usePendingPaymentsStore()

const filters = ref({
  status: 'pending',
  type: ''
})

const selectedPayment = ref<PendingPayment | null>(null)

const loadData = () => {
  store.fetchPayments({
    status: filters.value.status || undefined,
    type: filters.value.type || undefined
  })
}

onMounted(() => {
  loadData()
})

const openEditModal = (payment: PendingPayment) => {
  selectedPayment.value = payment
  setTimeout(() => {
    const dialog = document.getElementById('edit-payment-modal') as HTMLDialogElement
    if (dialog) dialog.showModal()
  }, 50)
}

const confirmDelete = async (payment: PendingPayment) => {
  if (confirm(`¿Estás seguro de eliminar el pago pendiente de ${payment.memberName} por ${formatCurrency(payment.amount)}?`)) {
    await store.deletePayment(payment.id)
  }
}

// Helpers
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount)
}

const formatType = (type: string) => {
  const map: Record<string, string> = {
    'dividend': 'Dividendo',
    'stock_withdrawal': 'Retiro de Acciones',
    'loan': 'Préstamo',
    'other': 'Otro',
    'partial_settlement': 'Liquidación Parcial'
  }
  return map[type] || type
}

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    'pending': 'Pendiente',
    'approved': 'Aprobado',
    'rejected': 'Rechazado',
    'paid': 'Pagado'
  }
  return map[status] || status
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'pending': return 'badge-warning'
    case 'approved': return 'badge-info'
    case 'paid': return 'badge-success'
    case 'rejected': return 'badge-error'
    default: return 'badge-ghost'
  }
}
</script>

<style scoped>
.pending-payments-view {
  padding: 2rem;
}
</style>
