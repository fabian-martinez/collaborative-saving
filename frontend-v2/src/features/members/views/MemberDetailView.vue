<template>
  <div class="member-detail-view">
    <LoadingSpinner :loading="store.loading" message="Cargando miembro..." />
    <ErrorMessage :error="store.error" />

    <div v-if="store.member && !store.loading" class="member-detail">
      <div class="member-header">
        <h1>{{ store.member.name }}</h1>
        <button @click="$router.push('/members')" class="back-button">← Volver</button>
      </div>

      <div class="member-info">
        <div class="info-section">
          <h2>Información General</h2>
          <p><strong>Email:</strong> {{ store.member.email }}</p>
          <p><strong>Identificación:</strong> {{ store.member.identification_number || 'N/A' }}</p>
          <p><strong>Teléfono:</strong> {{ store.member.phone || 'N/A' }}</p>
          <p><strong>Dirección:</strong> {{ store.member.address || 'N/A' }}</p>
          <p><strong>Beneficiario:</strong> {{ store.member.beneficiary || 'N/A' }}</p>
          <p><strong>Estado:</strong> {{ store.member.status }}</p>
        </div>

        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tab-button', { active: activeTab === tab.id }]"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="tab-content">
          <div v-if="activeTab === 'purchases'">
            <h3>Compras de Acciones</h3>
            <DataTable
              :data="store.purchases"
              :columns="purchaseColumns"
              empty-message="No hay compras registradas"
            />
          </div>
          <div v-if="activeTab === 'payments'">
            <h3>Pagos</h3>
            <DataTable
              :data="store.payments"
              :columns="paymentColumns"
              empty-message="No hay pagos registrados"
            />
          </div>
          <div v-if="activeTab === 'dues'">
            <h3>Cuotas</h3>
            <DataTable
              :data="store.dues"
              :columns="dueColumns"
              empty-message="No hay cuotas registradas"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMemberDetailStore } from '../stores/memberDetail'
import DataTable from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const route = useRoute()
const store = useMemberDetailStore()
const activeTab = ref('purchases')

const tabs = [
  { id: 'purchases', label: 'Compras' },
  { id: 'payments', label: 'Pagos' },
  { id: 'dues', label: 'Cuotas' }
]

const purchaseColumns = [
  { key: 'stock_type', label: 'Tipo de Acción' },
  { key: 'quantity', label: 'Cantidad', format: 'number' },
  { key: 'unit_value', label: 'Valor Unitario', format: 'currency' },
  { key: 'total_value', label: 'Valor Total', format: 'currency' },
  { key: 'purchase_date', label: 'Fecha', format: 'date' }
]

const paymentColumns = [
  { key: 'type', label: 'Tipo' },
  { key: 'total_amount', label: 'Monto', format: 'currency' },
  { key: 'date', label: 'Fecha', format: 'date' }
]

const dueColumns = [
  { key: 'type', label: 'Tipo' },
  { key: 'description', label: 'Descripción' },
  { key: 'amount', label: 'Monto', format: 'currency' }
]

onMounted(async () => {
  const memberId = route.params.id as string
  await store.fetchMember(memberId)
  await Promise.all([
    store.fetchPurchases(memberId),
    store.fetchPayments(memberId),
    store.fetchDues(memberId)
  ])
})
</script>

<style scoped>
.member-detail-view {
  padding: 2rem;
}

.member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.back-button {
  background-color: #95a5a6;
  color: white;
  padding: 0.5rem 1rem;
}

.member-info {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-section {
  margin-bottom: 2rem;
}

.info-section p {
  margin: 0.5rem 0;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #ddd;
  margin-bottom: 1rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: #666;
}

.tab-button.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.tab-content {
  padding: 1rem 0;
}
</style>

