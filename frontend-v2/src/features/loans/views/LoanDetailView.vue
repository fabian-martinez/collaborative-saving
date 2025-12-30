<template>
  <div class="loan-detail-view">
    <h1>Detalle de Préstamo</h1>
    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />
    <div v-if="loan">
      <p>Miembro: {{ loan.member_id }}</p>
      <p>Tipo: {{ loan.loan_type }}</p>
      <p>Monto Aprobado: {{ formatCurrency(loan.approved_amount) }}</p>
      <p>Saldo Pendiente: {{ formatCurrency(loan.outstanding_balance) }}</p>
      <p>Estado: {{ loan.status }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { loansApi, type Loan } from '@/api/loans.api'
import { formatCurrency } from '@/shared/utils/formatters'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const route = useRoute()
const loan = ref<Loan | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    loan.value = await loansApi.getLoanById(route.params.id as string)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar préstamo'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.loan-detail-view {
  padding: 2rem;
}
</style>

