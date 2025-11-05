<template>
  <div class="container mx-auto pt-10 pb-4">
    <!-- Título y acciones principales -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
      <div>
        <h1 class="text-3xl font-bold">Administración de Acciones</h1>
        <p class="text-gray-500">Gestiona los diferentes tipos de acciones y sus valores</p>
      </div>
      <button class="btn btn-primary flex items-center gap-2" @click="openCreateModal">
        <Plus class="w-5 h-5" /> Añadir Tipo de Acción
      </button>
    </div>

    <!-- Tarjetas de resumen -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="stat bg-white shadow rounded-xl border border-blue-100">
        <div class="stat-figure text-green-600">
          <PiggyBank class="w-7 h-7" />
        </div>
        <div class="stat-title text-gray-500">Valor Total</div>
        <div class="stat-value text-blue-900 text-2xl" :title="formatCurrency(totalValue)">{{ formatCompactCurrency(totalValue) }}</div>
      </div>
      <div class="stat bg-white shadow rounded-xl border border-blue-100">
        <div class="stat-figure text-blue-500">
          <StatsUpSquare class="w-7 h-7" />
        </div>
        <div class="stat-title text-gray-500">Aporte Mensual Total</div>
        <div class="stat-value text-blue-700 text-2xl" :title="formatCurrency(totalMonthlyContribution)">{{ formatCompactCurrency(totalMonthlyContribution) }}</div>
      </div>
      <div class="stat bg-white shadow rounded-xl border border-blue-100">
        <div class="stat-figure text-purple-600">
          <Clock class="w-7 h-7" />
        </div>
        <div class="stat-title text-gray-500">Tipos de Acciones</div>
        <div class="stat-value text-purple-700">{{ filteredStocks.length }}</div>
      </div>
      <div class="stat bg-white shadow rounded-xl border border-blue-100">
        <div class="stat-figure text-orange-600">
          <Group class="w-7 h-7" />
        </div>
        <div class="stat-title text-gray-500">Total Suscripciones</div>
        <div class="stat-value text-orange-700 text-2xl" :title="formatCompactNumber(totalSubscriptions)">{{ formatCompactNumber(totalSubscriptions) }}</div>
      </div>
    </div>

    <!-- Buscador -->
    <div class="mb-4 flex items-center justify-between">
      <input
        v-model="search"
        type="text"
        placeholder="Buscar por tipo de acción..."
        class="input input-bordered w-full max-w-md"
      />
      <span class="ml-4 text-gray-500 text-sm">{{ filteredStocks.length }} resultados</span>
    </div>

    <!-- Tabla de acciones -->
    <div class="overflow-x-auto bg-white rounded-xl shadow border border-blue-100">
      <table class="table w-full">
        <thead class="bg-blue-50">
          <tr>
            <th>Tipo/Nombre</th>
            <th>Valor Actual (Bs.)</th>
            <th>Aporte Mensual (Bs.)</th>
            <th class="text-center">Suscripciones</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="text-center p-4">
              <span class="loading loading-lg"></span>
            </td>
          </tr>
          <tr v-else-if="error">
            <td colspan="5" class="text-center text-error p-4">{{ error }}</td>
          </tr>
          <tr v-else-if="filteredStocks.length === 0">
            <td colspan="5" class="text-center p-4">No hay tipos de acciones registrados.</td>
          </tr>
          <tr v-for="stock in filteredStocks" :key="stock.id">
            <td class="font-semibold">{{ stock.type }}</td>
            <td>{{ formatCurrency(stock.value) }}</td>
            <td>{{ formatCurrency(stock.monthlyContribution) }}</td>
            <td class="text-center">
              <span class="badge badge-info badge-lg">
                {{ stock.subscriptionCount ?? 0 }}
              </span>
            </td>
            <td class="flex items-center justify-center gap-2">
              <RouterLink :to="{ name: 'stock-details', params: { id: stock.id } }" class="btn btn-ghost btn-xs flex items-center gap-1" title="Ver Detalles">
                <Page class="w-5 h-5 text-blue-700" /> Ver
              </RouterLink>
              <button class="btn btn-ghost btn-xs flex items-center gap-1" @click="openEditModal(stock)" title="Editar">
                <EditPencil class="w-5 h-5 text-green-600" /> Editar
              </button>
              <button class="btn btn-error btn-xs flex items-center gap-1" @click="handleDeleteStock(stock.id)" :disabled="isDeleting" title="Eliminar">
                <Trash class="w-5 h-5 text-red-500" /> Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <StockFormModal
      v-model="isModalOpen"
      :stock-to-edit="stockToEdit"
      @stock-saved="handleStockSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { stocksService } from '../services/stocksService';
import type { Stock } from '../types';
import StockFormModal from '../components/StockFormModal.vue';
import { Plus, PiggyBank, StatsUpSquare, Clock, Page, EditPencil, Trash, Group } from 'iconoir-vue/regular';

const stocks = ref<Stock[]>([]);
const loading = ref(false);
const isDeleting = ref(false);
const error = ref<string | null>(null);

const isModalOpen = ref(false);
const stockToEdit = ref<Stock | null>(null);
const search = ref('');

const filteredStocks = computed(() => {
  if (!search.value) return stocks.value;
  const s = search.value.toLowerCase();
  return stocks.value.filter(stock =>
    stock.type.toLowerCase().includes(s)
  );
});

const totalValue = computed(() =>
  filteredStocks.value.reduce((sum, stock) => {
    const subscriptions = stock.subscriptionCount ?? 0;
    return sum + (stock.value * subscriptions);
  }, 0)
);
const totalMonthlyContribution = computed(() =>
  filteredStocks.value.reduce((sum, stock) => {
    const subscriptions = stock.subscriptionCount ?? 0;
    return sum + (stock.monthlyContribution * subscriptions);
  }, 0)
);
const totalSubscriptions = computed(() =>
  filteredStocks.value.reduce((sum, stock) => sum + (stock.subscriptionCount ?? 0), 0)
);

function formatCurrency(value: number | undefined | null) {
  if (value == null || isNaN(value)) return '$0.00';
  return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 });
}

function formatCompactCurrency(value: number | undefined | null) {
  if (value == null || isNaN(value)) return '$0';
  if (value === 0) return '$0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e6) {
    return `${sign}$${(absValue / 1e6).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}M`;
  } else if (absValue >= 1e3) {
    return `${sign}$${(absValue / 1e3).toFixed(1)}K`;
  } else {
    return formatCurrency(value);
  }
}

function formatCompactNumber(value: number | undefined | null) {
  if (value == null || isNaN(value)) return '0';
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}M`;
  } else if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(1)}K`;
  } else {
    return value.toLocaleString();
  }
}

async function fetchStocks() {
  loading.value = true;
  error.value = null;
  try {
    stocks.value = await stocksService.getStocks();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    error.value = `Error al cargar las acciones: ${message}`;
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  stockToEdit.value = null;
  isModalOpen.value = true;
}

function openEditModal(stock: Stock) {
  stockToEdit.value = stock;
  isModalOpen.value = true;
}

function handleStockSaved() {
  fetchStocks();
}

async function handleDeleteStock(id: string) {
  if (!confirm('¿Está seguro de que desea eliminar este tipo de acción?')) {
    return;
  }
  isDeleting.value = true;
  error.value = null;
  try {
    await stocksService.deleteStock(id);
    await fetchStocks();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    error.value = `Error al eliminar la acción: ${message}`;
    console.error(e);
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  fetchStocks();
});
</script> 