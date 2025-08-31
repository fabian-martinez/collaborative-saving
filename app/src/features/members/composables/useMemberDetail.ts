import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { membersService } from '../services/membersService';
import { operationsService } from '@/features/operations/services/operationsService';
import { stocksService } from '../services/stocksService';
import { loansService } from '../services/loansService';
import type {
  MemberDetailResponse,
  MemberStocksResponse,
  MemberLoansResponse,
  DebtCapacityResponse,
  MemberSummaryResponse,
  StockTransactionHistory,
  LoanInstallments,
} from '../types';
import type { Operation } from '@/features/operations/types';

export function useMemberDetail() {
  const route = useRoute();
  const memberId = computed(() => route.params.id as string);

  // State
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Member data
  const memberDetail = ref<MemberDetailResponse | null>(null);
  const memberStocks = ref<MemberStocksResponse | null>(null);
  const memberLoans = ref<MemberLoansResponse | null>(null);
  const memberDebtCapacity = ref<DebtCapacityResponse | null>(null);
  const memberSummary = ref<MemberSummaryResponse | null>(null);
  const memberOperations = ref<Operation[]>([]);

  // Modal data
  const stockHistory = ref<StockTransactionHistory | null>(null);
  const loanInstallments = ref<LoanInstallments | null>(null);

  // Computed properties
  const hasData = computed(() => 
    memberDetail.value && 
    memberStocks.value && 
    memberLoans.value && 
    memberDebtCapacity.value
  );

  const creditStatusColor = computed(() => {
    if (!memberDebtCapacity.value) return 'text-gray-500';
    
    switch (memberDebtCapacity.value.creditStatus) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-500';
    }
  });

  const creditStatusText = computed(() => {
    if (!memberDebtCapacity.value) return '';
    
    switch (memberDebtCapacity.value.creditStatus) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Buena';
      case 'moderate': return 'Moderada';
      case 'high': return 'Alta';
      default: return 'Desconocida';
    }
  });

  // Methods
  const loadMemberData = async () => {
    if (!memberId.value) return;

    loading.value = true;
    error.value = null;

    try {
      // Load all member data in parallel
      const [
        detail,
        stocks,
        loans,
        debtCapacity,
        summary,
        operations
      ] = await Promise.all([
        membersService.getMemberDetail(memberId.value),
        membersService.getMemberStocks(memberId.value),
        membersService.getMemberLoans(memberId.value),
        membersService.getMemberDebtCapacity(memberId.value),
        membersService.getMemberSummary(memberId.value),
        operationsService.getOperations({ memberId: memberId.value }),
      ]);

      memberDetail.value = detail;
      memberStocks.value = stocks;
      memberLoans.value = loans;
      memberDebtCapacity.value = debtCapacity;
      memberSummary.value = summary;
      memberOperations.value = operations.data;

    } catch (err) {
      console.error('Error loading member data:', err);
      error.value = err instanceof Error ? err.message : 'Error al cargar los datos del miembro';
    } finally {
      loading.value = false;
    }
  };

  const loadStockHistory = async (stockId: string) => {
    if (!memberId.value) return;

    try {
      const history = await stocksService.getStockTransactionHistory(stockId, memberId.value);
      stockHistory.value = history;
    } catch (err) {
      console.error('Error loading stock history:', err);
      error.value = err instanceof Error ? err.message : 'Error al cargar el historial de acciones';
    }
  };

  const loadLoanInstallments = async (loanId: string) => {
    if (!memberId.value) return;

    try {
      const installments = await loansService.getLoanInstallments(loanId);
      loanInstallments.value = installments;
    } catch (err) {
      console.error('Error loading loan installments:', err);
      error.value = err instanceof Error ? err.message : 'Error al cargar las cuotas del préstamo';
    }
  };

  const refreshData = async () => {
    await loadMemberData();
  };

  const clearError = () => {
    error.value = null;
  };

  const clearModalData = () => {
    stockHistory.value = null;
    loanInstallments.value = null;
  };

  // Load data on mount
  onMounted(() => {
    loadMemberData();
  });

  return {
    // State
    loading,
    error,
    memberDetail,
    memberStocks,
    memberLoans,
    memberDebtCapacity,
    memberSummary,
    memberOperations,
    stockHistory,
    loanInstallments,

    // Computed
    hasData,
    creditStatusColor,
    creditStatusText,

    // Methods
    loadMemberData,
    loadStockHistory,
    loadLoanInstallments,
    refreshData,
    clearError,
    clearModalData,
  };
}
