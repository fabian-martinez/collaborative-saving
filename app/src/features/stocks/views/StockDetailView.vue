<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <div v-if="loading" class="text-center">
      <span class="loading loading-lg"></span>
    </div>
    <div v-else-if="error" class="alert alert-error">
      <div>
        <span>{{ error }}</span>
      </div>
    </div>
    <div v-else-if="stock" class="space-y-8">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold">Detalles de Acción: {{ stock.type }}</h1>
        <RouterLink to="/stocks" class="btn btn-ghost">
          &larr; Volver a la lista
        </RouterLink>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2">
        <span class="badge badge-info text-base">
          Tipo: {{ stock.behavior === 'DIVIDEND_YIELD' ? 'Dividendos' : 'Apreciación de Capital' }}
        </span>
      </div>

       <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Monthly Performance -->
        <div class="card bg-base-200 shadow-lg">
          <div class="card-body">
            <h3 class="card-title">Rendimiento (Último Mes)</h3>
            <p>Valor Inicial: <span class="font-mono">{{ performanceDetails.startValue.toFixed(2) }} Bs.</span></p>
            <p>Valor Final: <span class="font-mono">{{ performanceDetails.endValue.toFixed(2) }} Bs.</span></p>
            <div 
              class="text-lg font-bold" 
              :class="{
                'text-success': performanceDetails.change >= 0, 
                'text-error': performanceDetails.change < 0
              }"
            >
              Cambio: {{ performanceDetails.change.toFixed(2) }}%
            </div>
          </div>
        </div>

        <!-- Stock Holders -->
        <div class="card bg-base-200 shadow-lg lg:col-span-2">
          <div class="card-body">
            <h3 class="card-title">Miembros con esta Acción</h3>
            <div class="overflow-x-auto">
              <table class="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Miembro</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="member in stockMembers" :key="member.id">
                    <td>{{ member.name }}</td>
                    <td>{{ member.quantity }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Historical Growth Chart -->
        <div class="card bg-base-200 shadow-lg lg:col-span-3">
           <div class="card-body">
              <h3 class="card-title">Crecimiento Histórico del Valor</h3>
              <div class="h-64 md:h-96">
                <Line :data="chartData" :options="chartOptions" />
              </div>
           </div>
        </div>

       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { stocksService } from '../services/stocksService';
import type { Stock } from '../types';
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const route = useRoute();
const stock = ref<Stock | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Mock Data State
const performanceDetails = ref({ startValue: 0, endValue: 0, change: 0 });
const stockMembers = ref<{id: string, name: string, quantity: number}[]>([]);
const chartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: 'Valor de la Acción (Bs.)',
      backgroundColor: '#6366f1',
      borderColor: '#6366f1',
      data: [] as number[],
      tension: 0.1
    },
  ],
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          let label = context.dataset?.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed?.y !== null && context.parsed?.y !== undefined) {
            label += new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      ticks: {
        callback: function(value: any) {
          return `${value} Bs.`;
        }
      }
    }
  }
};

function loadMockDetails(stockData: Stock) {
  // Mock performance details
  const lastMonthValue = stockData.value * (1 - (Math.random() * 0.1 - 0.02)); // price from -2% to +8% ago
  performanceDetails.value = {
    startValue: lastMonthValue,
    endValue: stockData.value,
    change: ((stockData.value - lastMonthValue) / lastMonthValue) * 100,
  };

  // Mock members
  const memberNames = ['Juan Pérez', 'Maria García', 'Carlos Rodriguez', 'Ana Martinez', 'Luis Hernandez'];
  stockMembers.value = memberNames.slice(0, Math.floor(Math.random() * 3) + 3).map((name, index) => ({
    id: `m-${index}-${stockData.id}`,
    name,
    quantity: Math.floor(Math.random() * 20) + 1,
  }));

  // Mock chart data
  const labels: string[] = [];
  const data: number[] = [];
  let currentValue = stockData.value;
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    labels.push(date.toLocaleString('default', { month: 'short' }));
    currentValue = currentValue * (1 - (Math.random() * 0.05 - 0.015)); // Fluctuate value for previous months
    data.push(currentValue);
  }
  data[5] = stockData.value; // Ensure the last point is the current value

  chartData.value = {
    labels,
    datasets: [
      {
        label: 'Valor de la Acción (Bs.)',
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
        data,
        tension: 0.1,
      },
    ],
  };
}


onMounted(async () => {
  const stockId = route.params.id as string;
  loading.value = true;
  error.value = null;
  try {
    // In a real app, you'd fetch the specific stock by its ID
    // For now, we'll fetch all and find it.
    const allStocks = await stocksService.getStocks();
    const foundStock = allStocks.find(s => s.id === stockId);

    if (foundStock) {
      stock.value = foundStock;
      loadMockDetails(foundStock); // Load mock data based on this stock
    } else {
      throw new Error(`No se encontró la acción con ID ${stockId}`);
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    error.value = `Error al cargar los detalles de la acción: ${message}`;
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script> 