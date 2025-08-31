<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMemberDetail } from '../composables/useMemberDetail';
import StockHistoryModal from '../components/StockHistoryModal.vue';
import LoanHistoryModal from '../components/LoanHistoryModal.vue';
import OperationDetailsModal from '../components/OperationDetailsModal.vue';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  UserCircle, 
  Eye, 
  Refresh,
  X,
  WarningTriangle
} from 'iconoir-vue/regular';

// Use the composable
const {
  loading,
  error,
  memberDetail,
  memberStocks,
  memberLoans,
  memberDebtCapacity,
  memberOperations,
  stockHistory,
  loanInstallments,
  hasData,
  creditStatusColor,
  creditStatusText,
  loadStockHistory,
  loadLoanInstallments,
  refreshData,
  clearError,
  // clearModalData is no longer needed
} = useMemberDetail();

// Router
const router = useRouter();

// Modal states
const showStockHistoryModal = ref(false);
const showLoanHistoryModal = ref(false);
const showOperationDetailsModal = ref(false);
const selectedStockId = ref<string>('');
const selectedLoanId = ref<string>('');
const selectedOperationId = ref<string>('');

// Methods
const goBack = () => {
  router.push('/members');
};

const openStockHistory = async (stockId: string) => {
  selectedStockId.value = stockId;
  await loadStockHistory(stockId);
  showStockHistoryModal.value = true;
};

const openLoanHistory = async (loanId: string) => {
  selectedLoanId.value = loanId;
  await loadLoanInstallments(loanId);
  showLoanHistoryModal.value = true;
};

const viewOperationDetails = (operationId: string) => {
  selectedOperationId.value = operationId;
  showOperationDetailsModal.value = true;
};

// These functions are no longer needed since we're using v-model

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | string) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// Función para obtener el color y estilo del estado del préstamo
const getLoanStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Pendiente',
        icon: '⏳'
      };
    case 'active':
      return {
        color: 'bg-green-100 text-green-800',
        text: 'Activo',
        icon: '✅'
      };
    case 'paid':
      return {
        color: 'bg-blue-100 text-blue-800',
        text: 'Pagado',
        icon: '💰'
      };
    case 'defaulted':
      return {
        color: 'bg-red-100 text-red-800',
        text: 'En Mora',
        icon: '⚠️'
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-800',
        text: status,
        icon: '❓'
      };
  }
};

// Computed property para ordenar los préstamos (activos primero)
const sortedLoans = computed(() => {
  if (!memberLoans.value?.loans) return [];
  
  return [...memberLoans.value.loans].sort((a, b) => {
    // Prioridad: active > pending > defaulted > paid
    const priority = { active: 1, pending: 2, defaulted: 3, paid: 4 };
    const priorityA = priority[a.status as keyof typeof priority] || 5;
    const priorityB = priority[b.status as keyof typeof priority] || 5;
    
    return priorityA - priorityB;
  });
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <button
              @click="goBack"
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft class="w-5 h-5 text-gray-600" />
            </button>
            <h1 class="text-xl font-semibold text-gray-900">
              Detalle del Miembro
            </h1>
          </div>
          
          <div class="flex items-center space-x-3">
            <button
              @click="refreshData"
              :disabled="loading"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Refresh class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
              Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <WarningTriangle class="w-5 h-5 text-red-400 mr-3 mt-0.5" />
          <div class="flex-1">
            <h3 class="text-sm font-medium text-red-800">
              Error al cargar los datos
            </h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
          <button
            @click="clearError"
            class="ml-auto -mr-1.5 -my-1.5 bg-red-50 text-red-500 rounded-full p-1.5 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <span class="sr-only">Cerrar</span>
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !hasData" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Cargando información del miembro...</p>
      </div>
    </div>

    <!-- Content -->
    <div v-if="hasData" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Member Basic Info -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <UserCircle class="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900">{{ memberDetail?.name }}</h2>
              <p class="text-gray-600">{{ memberDetail?.email }}</p>
              <p class="text-sm text-gray-500">ID: {{ memberDetail?.identificationNumber }}</p>
            </div>
          </div>
          
          <div class="text-right">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {{ memberDetail?.status }}
            </span>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="flex items-center space-x-3">
            <MapPin class="w-5 h-5 text-gray-400" />
            <div>
              <p class="text-sm font-medium text-gray-900">Dirección</p>
              <p class="text-sm text-gray-600">{{ memberDetail?.address || 'No especificada' }}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-3">
            <Phone class="w-5 h-5 text-gray-400" />
            <div>
              <p class="text-sm font-medium text-gray-900">Teléfono</p>
              <p class="text-sm text-gray-600">{{ memberDetail?.phone || 'No especificado' }}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-3">
            <User class="w-5 h-5 text-gray-400" />
            <div>
              <p class="text-sm font-medium text-gray-900">Beneficiario</p>
              <p class="text-sm text-gray-600">{{ memberDetail?.beneficiary || 'No especificado' }}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-3">
            <Calendar class="w-5 h-5 text-gray-400" />
            <div>
              <p class="text-sm font-medium text-gray-900">Fecha de Registro</p>
              <p class="text-sm text-gray-600">{{ memberDetail?.registrationDate ? formatDate(memberDetail.registrationDate) : 'No especificada' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Debt Capacity Card -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Capacidad de Endeudamiento</h3>
          <span :class="['text-sm font-medium', creditStatusColor]">
            {{ creditStatusText }}
          </span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{{ formatCurrency(memberDebtCapacity?.totalSavings || 0) }}</p>
            <p class="text-sm text-gray-600">Total Ahorros</p>
          </div>
          
          <div class="text-center">
            <p class="text-2xl font-bold text-red-600">{{ formatCurrency(memberDebtCapacity?.totalCredits || 0) }}</p>
            <p class="text-sm text-gray-600">Total Créditos</p>
          </div>
          
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(memberDebtCapacity?.availableCapacity || 0) }}</p>
            <p class="text-sm text-gray-600">Capacidad Disponible</p>
          </div>
          
          <div class="text-center">
            <p class="text-2xl font-bold text-indigo-600">{{ formatPercentage(memberDebtCapacity?.utilization || 0) }}</p>
            <p class="text-sm text-gray-600">Utilización</p>
          </div>
        </div>
      </div>

      <!-- Stocks Section -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Acciones del Miembro</h3>
          <div class="text-right">
            <p class="text-sm text-gray-600">Total: {{ formatCurrency(memberStocks?.totalValue || 0) }}</p>
            <p class="text-sm text-gray-600">Contribución Mensual: {{ formatCurrency(memberStocks?.totalMonthlyContribution || 0) }}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="stock in memberStocks?.stocks"
            :key="stock.id"
            class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="openStockHistory(stock.id)"
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-medium text-gray-900">{{ stock.name }}</h4>
              <Eye class="w-4 h-4 text-gray-400" />
            </div>
            
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Cantidad:</span>
                <span class="text-sm font-medium">{{ stock.quantity }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Valor:</span>
                <span class="text-sm font-medium">{{ formatCurrency(stock.value) }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Contribución:</span>
                <span class="text-sm font-medium">{{ formatCurrency(stock.requiredContribution) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loans Section -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Préstamos del Miembro</h3>
          <div class="text-right">
            <p class="text-sm text-gray-600">Total Aprobado: {{ formatCurrency(memberLoans?.totalApprovedAmount || 0) }}</p>
            <p class="text-sm text-gray-600">Saldo Pendiente: {{ formatCurrency(memberLoans?.totalOutstandingBalance || 0) }}</p>
          </div>
        </div>
        
        <!-- Resumen de estados de préstamos -->
        <div class="mb-4 flex flex-wrap gap-2">
          <div v-if="memberLoans?.loans" class="flex items-center space-x-4 text-sm">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              ⏳ {{ memberLoans.loans.filter(l => l.status === 'pending').length }} Pendientes
            </span>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✅ {{ memberLoans.loans.filter(l => l.status === 'active').length }} Activos
            </span>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              💰 {{ memberLoans.loans.filter(l => l.status === 'paid').length }} Pagados
            </span>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              ⚠️ {{ memberLoans.loans.filter(l => l.status === 'defaulted').length }} En Mora
            </span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="loan in sortedLoans"
            :key="loan.id"
            class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="openLoanHistory(loan.id)"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <h4 class="font-medium text-gray-900">{{ loan.loanType }}</h4>
                <span :class="['inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', getLoanStatusInfo(loan.status).color]">
                  {{ getLoanStatusInfo(loan.status).icon }} {{ getLoanStatusInfo(loan.status).text }}
                </span>
              </div>
              <Eye class="w-4 h-4 text-gray-400" />
            </div>
            
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Monto:</span>
                <span class="text-sm font-medium">{{ formatCurrency(loan.approvedAmount) }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Saldo:</span>
                <span class="text-sm font-medium">{{ formatCurrency(loan.outstandingBalance) }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Cuota Mensual:</span>
                <span class="text-sm font-medium">{{ formatCurrency(loan.monthlyPaymentAmount) }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Tasa:</span>
                <span class="text-sm font-medium">{{ formatPercentage(loan.interestRate * 100) }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Plazo:</span>
                <span class="text-sm font-medium">{{ loan.term }} meses</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Transacciones Recientes</h3>
          <div class="text-right">
            <p class="text-sm text-gray-600">Total: {{ memberOperations?.length || 0 }} operaciones</p>
          </div>
        </div>
        
        <!-- No Operations Message -->
        <div v-if="!memberOperations || memberOperations.length === 0" class="text-center py-8">
          <div class="text-gray-400 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 class="text-lg font-medium text-gray-900 mb-2">No hay transacciones registradas</h4>
          <p class="text-gray-600 max-w-md mx-auto">
            Este miembro aún no tiene transacciones registradas en el sistema. Las transacciones aparecerán aquí cuando se realicen operaciones como:
          </p>
          <ul class="text-sm text-gray-500 mt-3 space-y-1">
            <li>• Compra o venta de acciones</li>
            <li>• Pagos de préstamos</li>
            <li>• Contribuciones obligatorias</li>
            <li>• Dividendos o revalorizaciones</li>
          </ul>
        </div>
        
        <!-- Transactions Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="operation in memberOperations?.slice(0, 10)" :key="operation.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(operation.date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ operation.description }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ operation.type }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    @click="viewOperationDetails(operation.id)"
                    class="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Eye class="w-3 h-3 mr-1" />
                    Ver Detalle
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Stock History Modal -->
    <StockHistoryModal
      v-model="showStockHistoryModal"
      :stock-name="stockHistory?.stockName || ''"
      :nominal-value="stockHistory?.nominalValue || 0"
      :required-contribution="stockHistory?.requiredContribution || 0"
      :transactions="stockHistory?.transactions || []"
    />

    <!-- Loan History Modal -->
    <LoanHistoryModal
      v-model="showLoanHistoryModal"
      :loan-amount="loanInstallments?.loanAmount || 0"
      :term="`${loanInstallments?.term || 0} meses`"
      :interest-rate="`${((loanInstallments?.interestRate || 0) * 100).toFixed(1)}%`"
      :paid-installments="loanInstallments?.installments?.filter((i: any) => i.status === 'paid') || []"
      :pending-installments="loanInstallments?.installments?.filter((i: any) => i.status === 'pending') || []"
    />

    <!-- Operation Details Modal -->
    <OperationDetailsModal
      v-model="showOperationDetailsModal"
      :operation-id="selectedOperationId"
    />
  </div>
</template>