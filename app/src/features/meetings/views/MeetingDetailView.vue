<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Detalle de la Reunión del {{ meeting.date }}</h1>
      <p class="text-neutral-500">Reunión finalizada.</p>
    </div>

    <!-- Resumen de Ingresos y Egresos -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Ingresos -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Ingresos Totales</h2>
          <p class="text-4xl font-bold text-success">{{ formatCurrency(totalIncome) }}</p>
          <div class="mt-4 space-y-2">
            <div class="flex justify-between"><span>Aportes:</span> <span>{{ formatCurrency(income.contributions) }}</span></div>
            <div class="flex justify-between"><span>Abonos a Préstamos:</span> <span>{{ formatCurrency(income.loanPayments) }}</span></div>
            <div class="flex justify-between"><span>Intereses:</span> <span>{{ formatCurrency(income.interest) }}</span></div>
            <div class="flex justify-between"><span>Seguro:</span> <span>{{ formatCurrency(income.insurance) }}</span></div>
            <div class="flex justify-between"><span>Activos:</span> <span>{{ formatCurrency(income.assets) }}</span></div>
            <div class="flex justify-between"><span>Compras Varias:</span> <span>{{ formatCurrency(income.purchases) }}</span></div>
          </div>
        </div>
      </div>

      <!-- Egresos -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Egresos Totales</h2>
          <p class="text-4xl font-bold text-error">{{ formatCurrency(totalWithdrawals) }}</p>
          <div class="mt-4 space-y-2">
            <h3 class="font-bold mt-4">Préstamos Entregados:</h3>
            <div class="flex justify-between pl-4"><span>Ordinario:</span> <span>{{ formatCurrency(withdrawals.loansGranted.ordinary) }}</span></div>
            <div class="flex justify-between pl-4"><span>Emergencia:</span> <span>{{ formatCurrency(withdrawals.loansGranted.emergency) }}</span></div>

            <h3 class="font-bold mt-4">Otros Egresos:</h3>
            <div class="flex justify-between pl-4"><span>Entrega de Dividendos:</span> <span>{{ formatCurrency(withdrawals.dividendPayouts) }}</span></div>
            <div class="flex justify-between pl-4"><span>Retiro de Acciones:</span> <span>{{ formatCurrency(withdrawals.shareWithdrawals) }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transacciones de la Reunión -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title mb-4">Transacciones de la Reunión</h2>
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr>
                <th></th>
                <th>Tipo</th>
                <th>Miembro</th>
                <th>Monto</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(tx, index) in transactions" :key="tx.id" class="hover">
                <th>{{ index + 1 }}</th>
                <td>{{ tx.type }}</td>
                <td>{{ tx.member }}</td>
                <td :class="{'text-success': tx.amount > 0, 'text-error': tx.amount < 0}">{{ formatCurrency(tx.amount) }}</td>
                <td>{{ tx.details }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const meeting = ref({
  date: '2024-07-20',
});

const income = ref({
  contributions: 5000,
  loanPayments: 2500,
  interest: 500,
  insurance: 100,
  assets: 0,
  purchases: 1200,
});

const withdrawals = ref({
  loansGranted: {
    ordinary: 3000,
    emergency: 1000,
  },
  dividendPayouts: 400,
  shareWithdrawals: 200,
});

const transactions = ref([
  { id: 1, type: 'Aporte', member: 'Juan Perez', amount: 100, details: 'Aporte obligatorio' },
  { id: 2, type: 'Abono Préstamo', member: 'Maria Garcia', amount: 250, details: 'Cuota 3/12 Préstamo Ordinario' },
  { id: 3, type: 'Desembolso Préstamo', member: 'Pedro Rodriguez', amount: -1500, details: 'Préstamo Ordinario' },
  { id: 4, type: 'Compra Acciones', member: 'Ana Lopez', amount: 300, details: 'Compra de 3 acciones' },
  { id: 5, type: 'Pago Intereses', member: 'Carlos Sanchez', amount: 50, details: 'Intereses préstamo' },
  { id: 6, type: 'Desembolso Préstamo', member: 'Laura Gomez', amount: -500, details: 'Préstamo Emergencia' },
  { id: 7, type: 'Aporte', member: 'Pedro Rodriguez', amount: 100, details: 'Aporte obligatorio' },
]);

const totalIncome = computed(() => Object.values(income.value).reduce((sum, val) => sum + val, 0));
const totalWithdrawals = computed(() => {
  return withdrawals.value.loansGranted.ordinary +
         withdrawals.value.loansGranted.emergency +
         withdrawals.value.dividendPayouts +
         withdrawals.value.shareWithdrawals;
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};
</script>
