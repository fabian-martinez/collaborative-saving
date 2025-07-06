<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Member } from '../types';
// import { membersService } from '../services/membersService';

// Mock data for demonstration purposes
const member = ref<Member | null>({
  id: '1',
  name: 'Juan Perez',
  email: 'juan.perez@example.com',
  identificationNumber: '123456789',
});

const stocks = ref([
  { id: 'stock-1', name: 'Acciones Ordinarias', quantity: 150, value: 15000 },
  { id: 'stock-2', name: 'Acciones Preferentes', quantity: 50, value: 7500 },
]);

const loans = ref([
  { id: 'loan-1', amount: 50000, outstanding_balance: 25000, next_payment_due: '2024-08-15' },
  { id: 'loan-2', amount: 10000, outstanding_balance: 10000, next_payment_due: '2024-09-01' },
]);

const transactions = ref([
  { id: 'txn-1', date: '2024-07-20', description: 'Aporte obligatorio', amount: 1000 },
  { id: 'txn-2', date: '2024-07-15', description: 'Compra de acciones', amount: -500 },
  { id: 'txn-3', date: '2024-07-10', description: 'Desembolso de préstamo', amount: -50000 },
  { id: 'txn-4', date: '2024-07-01', description: 'Pago de cuota de préstamo', amount: 2500 },
]);

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const memberId = route.params.id as string;
  // try {
  //   // Uncomment the following lines when the API is ready
  //   // member.value = await membersService.getMemberById(memberId);
  //   // also fetch stocks, loans and transactions summary for the member
  // } catch (error) {
  //   console.error('Error fetching member details:', error);
  // }
});

const printReceipt = (transactionId: string) => {
  alert(`Imprimiendo recibo para la transacción ${transactionId}...`);
  // Here you would typically generate a PDF or open a new window with the receipt.
};

const goToMembersList = () => {
  router.push({ name: 'members-list' });
};
</script>

<template>
  <div class="p-8 bg-base-200 min-h-screen">
    <div v-if="member" class="max-w-4xl mx-auto">
      <div class="mb-6">
        <button @click="goToMembersList" class="btn btn-primary btn-outline">
          &larr; Volver a la lista de socios
        </button>
      </div>

      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title text-3xl mb-4">{{ member.name }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p><strong>No. Identificación:</strong> {{ member.identificationNumber }}</p>
            <p><strong>Email:</strong> {{ member.email }}</p>
          </div>
        </div>
      </div>

      <!-- Summaries -->
      <div class="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
        <!-- Stocks Summary -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="card-title">Resumen de Acciones</h3>
            <div class="overflow-x-auto mt-4">
              <table class="table w-full">
                <thead>
                  <tr>
                    <th>Tipo de Acción</th>
                    <th class="text-right">Cantidad</th>
                    <th class="text-right">Valor Estimado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stock in stocks" :key="stock.id" class="hover">
                    <td>{{ stock.name }}</td>
                    <td class="text-right">{{ stock.quantity }}</td>
                    <td class="text-right">${{ stock.value.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Loans Summary -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="card-title">Resumen de Préstamos</h3>
            <div class="overflow-x-auto mt-4">
              <table class="table w-full">
                <thead>
                  <tr>
                    <th>Monto Original</th>
                    <th class="text-right">Saldo Pendiente</th>
                    <th>Próximo Pago</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="loan in loans" :key="loan.id" class="hover">
                    <td>${{ loan.amount.toLocaleString() }}</td>
                    <td class="text-right">${{ loan.outstanding_balance.toLocaleString() }}</td>
                    <td>{{ loan.next_payment_due }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>


      <!-- Recent Transactions -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title">Últimas Transacciones</h3>
          <div class="overflow-x-auto mt-4">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th class="text-right">Monto</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tx in transactions" :key="tx.id" class="hover">
                  <td>{{ tx.date }}</td>
                  <td>{{ tx.description }}</td>
                  <td :class="['text-right', tx.amount > 0 ? 'text-success' : 'text-error']">
                    ${{ Math.abs(tx.amount).toLocaleString() }}
                  </td>
                  <td class="text-center">
                    <button @click="printReceipt(tx.id)" class="btn btn-xs btn-outline btn-primary">
                      Recibo
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center">
      <p>Cargando información del socio...</p>
    </div>
  </div>
</template>