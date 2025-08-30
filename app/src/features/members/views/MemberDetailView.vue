<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { Member } from '../types';
import StockHistoryModal from '../components/StockHistoryModal.vue';
import LoanHistoryModal from '../components/LoanHistoryModal.vue';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  UserCircle, 
  StatUp, 
  Clock, 
  Eye, 
  Page 
} from 'iconoir-vue/regular';

// Type definitions
interface Stock {
  id: string;
  name: string;
  quantity: number;
  value: number;
  nominalValue: number;
  requiredContribution: number;
}

interface Loan {
  id: string;
  amount: number;
  outstanding_balance: number;
  status: string;
  term: string;
  interestRate: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
}

interface StockTransaction {
  id: string;
  date: string;
  period: string;
  description: string;
  amount: number;
  status: 'Pagado' | 'Pendiente' | 'Vencido';
}

interface LoanInstallment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  paymentDate?: string;
  principal: number;
  interest: number;
  total: number;
  status: 'Pagada' | 'Pendiente' | 'Vencida';
}

interface LoanInstallments {
  paid: LoanInstallment[];
  pending: LoanInstallment[];
}

// Mock data for demonstration purposes
const member = ref<Member | null>({
  id: '1',
  name: 'Carlos Rodríguez',
  email: 'carlos@example.com',
  identificationNumber: '1234567890',
});

const memberDetails = ref({
  status: 'Activo',
  address: 'Calle 123 #45-67',
  registrationDate: '14/1/2022',
  beneficiary: 'Ana Rodríguez',
  phone: '555-1234'
});

const debtCapacity = ref({
  totalSavings: 495000,
  totalCredits: 750000,
  availableCapacity: 735000,
  totalCapacity: 1485000,
  utilization: 51,
  creditStatus: 'Buena'
});

const stocks = ref<Stock[]>([
  { 
    id: 'stock-1', 
    name: 'Acción Básica', 
    quantity: 2, 
    value: 220000,
    nominalValue: 100000,
    requiredContribution: 10000
  },
  { 
    id: 'stock-2', 
    name: 'Acción Premium', 
    quantity: 1, 
    value: 275000,
    nominalValue: 150000,
    requiredContribution: 15000
  },
]);

const loans = ref<Loan[]>([
  { 
    id: 'loan-1', 
    amount: 1000000, 
    outstanding_balance: 750000, 
    status: 'Desembolsado',
    term: '12 meses',
    interestRate: '12% anual'
  },
]);

const transactions = ref<Transaction[]>([
  { 
    id: 'txn-1', 
    date: '9/4/2023', 
    description: 'Aporte mensual acción básica', 
    amount: 20000 
  },
  { 
    id: 'txn-2', 
    date: '9/4/2023', 
    description: 'Aporte mensual acción premium', 
    amount: 25000 
  },
  { 
    id: 'txn-3', 
    date: '9/4/2023', 
    description: 'Aporte para actividad social de mayo', 
    amount: 5000 
  },
]);

// Stock transactions mock data
const stockTransactions = ref<Record<string, StockTransaction[]>>({
  'stock-1': [
    {
      id: 'tx-1',
      date: '9/4/2023',
      period: '2023-04',
      description: 'Aporte mensual acción básica',
      amount: 20000,
      status: 'Pagado'
    },
    {
      id: 'tx-2',
      date: '8/3/2023',
      period: '2023-03',
      description: 'Aporte mensual acción básica',
      amount: 20000,
      status: 'Pagado'
    }
  ],
  'stock-2': [
    {
      id: 'tx-3',
      date: '9/4/2023',
      period: '2023-04',
      description: 'Aporte mensual acción premium',
      amount: 25000,
      status: 'Pagado'
    }
  ]
});

// Loan installments mock data
const loanInstallments = ref<Record<string, LoanInstallments>>({
  'loan-1': {
    paid: [
      {
        id: 'inst-1',
        installmentNumber: 1,
        dueDate: '24/3/2023',
        paymentDate: '22/3/2023',
        principal: 78863,
        interest: 10000,
        total: 88863,
        status: 'Pagada'
      },
      {
        id: 'inst-2',
        installmentNumber: 2,
        dueDate: '24/4/2023',
        paymentDate: '21/4/2023',
        principal: 79652,
        interest: 9211,
        total: 88863,
        status: 'Pagada'
      }
    ],
    pending: [
      {
        id: 'inst-3',
        installmentNumber: 3,
        dueDate: '24/5/2023',
        principal: 80449,
        interest: 8414,
        total: 88863,
        status: 'Pendiente'
      }
    ]
  }
});

// Modal states
const isStockHistoryModalOpen = ref(false);
const isLoanHistoryModalOpen = ref(false);
const selectedStock = ref<Stock | null>(null);
const selectedLoan = ref<Loan | null>(null);

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const memberId = route.params.id as string;
  // TODO: Implement API call when ready
  // try {
  //   member.value = await membersService.getMemberById(memberId);
  //   // also fetch stocks, loans and transactions summary for the member
  // } catch (error) {
  //   console.error('Error fetching member details:', error);
  // }
});

// Watch for modal close to clean up selected data
watch(isStockHistoryModalOpen, (newValue) => {
  if (!newValue) {
    selectedStock.value = null;
  }
});

watch(isLoanHistoryModalOpen, (newValue) => {
  if (!newValue) {
    selectedLoan.value = null;
  }
});

const printReceipt = (transactionId: string) => {
  alert(`Imprimiendo recibo para la transacción ${transactionId}...`);
  // Here you would typically generate a PDF or open a new window with the receipt.
};

const viewStockHistory = (stockId: string) => {
  selectedStock.value = stocks.value.find(s => s.id === stockId) || null;
  isStockHistoryModalOpen.value = true;
};

const viewLoanDetails = (loanId: string) => {
  selectedLoan.value = loans.value.find(l => l.id === loanId) || null;
  isLoanHistoryModalOpen.value = true;
};

const goToMembersList = () => {
  router.push({ name: 'members-list' });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2
  }).format(amount);
};
</script>

<template>
  <div class="p-8 bg-base-200 min-h-screen">
    <div v-if="member" class="max-w-6xl mx-auto">
      <!-- Header with back button -->
      <div class="mb-6">
        <button @click="goToMembersList" class="btn btn-ghost btn-sm gap-2">
          <ArrowLeft class="w-5 h-5" />
          Volver
        </button>
        <h1 class="text-3xl font-bold mt-2">Detalle del Socio</h1>
        <p class="text-base-content/70">Información completa del socio</p>
      </div>

      <!-- Member Information Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Main Member Info -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex items-center gap-3 mb-4">
              <User class="w-6 h-6 text-primary" />
              <h2 class="card-title text-2xl">{{ member.name }}</h2>
            </div>
            <div class="badge badge-success gap-2 mb-4">
              {{ memberDetails.status }}
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <span class="font-semibold">No. Identificación:</span>
                <span>{{ member.identificationNumber }}</span>
              </div>
              <div class="flex items-center gap-3">
                <Mail class="w-5 h-5 text-base-content/70" />
                <span>{{ member.email }}</span>
              </div>
              <div class="flex items-center gap-3">
                <Phone class="w-5 h-5 text-base-content/70" />
                <span>{{ memberDetails.phone }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Member Info -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <MapPin class="w-5 h-5 text-base-content/70" />
                <span>{{ memberDetails.address }}</span>
              </div>
              <div class="flex items-center gap-3">
                <Calendar class="w-5 h-5 text-base-content/70" />
                <span>Registro: {{ memberDetails.registrationDate }}</span>
              </div>
              <div class="flex items-center gap-3">
                <UserCircle class="w-5 h-5 text-base-content/70" />
                <span>Beneficiario: {{ memberDetails.beneficiary }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Debt Capacity Section -->
      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <div class="flex items-center gap-2 mb-4">
            <StatUp class="w-6 h-6 text-primary" />
            <h3 class="card-title text-xl">Capacidad de Endeudamiento</h3>
          </div>
          <p class="text-base-content/70 mb-6">Análisis financiero basado en la relación ahorro vs crédito</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="text-center">
              <p class="text-sm text-base-content/70 mb-2">Total Ahorros</p>
              <p class="text-2xl font-bold text-success">{{ formatCurrency(debtCapacity.totalSavings) }}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-base-content/70 mb-2">Total Créditos</p>
              <p class="text-2xl font-bold text-error">{{ formatCurrency(debtCapacity.totalCredits) }}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-base-content/70 mb-2">Capacidad Disponible</p>
              <p class="text-2xl font-bold text-info">{{ formatCurrency(debtCapacity.availableCapacity) }}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-base-content/70 mb-2">Capacidad Total</p>
              <p class="text-2xl font-bold">{{ formatCurrency(debtCapacity.totalCapacity) }}</p>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <p class="text-sm text-base-content/70 mb-2">Ratio Ahorro/Crédito</p>
              <p class="text-xl font-bold">0.66:1</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-base-content/70 mb-2">Utilización</p>
              <p class="text-xl font-bold">{{ debtCapacity.utilization }}%</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-base-content/70 mb-2">Estado Crediticio</p>
              <div class="badge badge-warning gap-2">
                {{ debtCapacity.creditStatus }}
                <span class="text-xs">({{ debtCapacity.utilization }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stocks Summary -->
      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <h3 class="card-title text-xl mb-4">Resumen de Acciones</h3>
          <div class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>Tipo de Acción</th>
                  <th class="text-right">Cantidad</th>
                  <th class="text-right">Valor Estimado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stock in stocks" :key="stock.id" class="hover">
                  <td>{{ stock.name }}</td>
                  <td class="text-right">{{ stock.quantity }}</td>
                  <td class="text-right font-semibold">{{ formatCurrency(stock.value) }}</td>
                  <td class="text-center">
                    <button @click="viewStockHistory(stock.id)" class="btn btn-xs btn-outline gap-2">
                      <Clock class="w-4 h-4" />
                      Historial
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Loans Summary -->
      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <h3 class="card-title text-xl mb-4">Resumen de Préstamos</h3>
          <div class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>Monto Original</th>
                  <th class="text-right">Saldo Pendiente</th>
                  <th>Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="loan in loans" :key="loan.id" class="hover">
                  <td class="font-semibold">{{ formatCurrency(loan.amount) }}</td>
                  <td class="text-right font-semibold">{{ formatCurrency(loan.outstanding_balance) }}</td>
                  <td>
                    <div class="badge badge-info">{{ loan.status }}</div>
                  </td>
                  <td class="text-center">
                    <button @click="viewLoanDetails(loan.id)" class="btn btn-xs btn-outline gap-2">
                      <Eye class="h-4" />
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <h3 class="card-title text-xl mb-4">Últimas Transacciones</h3>
          <div class="overflow-x-auto">
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
                  <td class="text-right font-semibold text-success">{{ formatCurrency(tx.amount) }}</td>
                  <td class="text-center">
                    <button @click="printReceipt(tx.id)" class="btn btn-xs btn-outline gap-2">
                      <Page class="w-4 h-4" />
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

    <!-- Stock History Modal -->
    <StockHistoryModal
      :model-value="isStockHistoryModalOpen"
      :stock-name="selectedStock?.name || ''"
      :nominal-value="selectedStock?.nominalValue || 0"
      :required-contribution="selectedStock?.requiredContribution || 0"
      :transactions="stockTransactions[selectedStock?.id || ''] || []"
      @update:model-value="isStockHistoryModalOpen = $event"
    />

    <!-- Loan History Modal -->
    <LoanHistoryModal
      :model-value="isLoanHistoryModalOpen"
      :loan-amount="selectedLoan?.amount || 0"
      :term="selectedLoan?.term || ''"
      :interest-rate="selectedLoan?.interestRate || ''"
      :paid-installments="loanInstallments[selectedLoan?.id || '']?.paid || []"
      :pending-installments="loanInstallments[selectedLoan?.id || '']?.pending || []"
      @update:model-value="isLoanHistoryModalOpen = $event"
    />
  </div>
</template>