<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Administración de Acciones</h1>
      <button class="btn btn-primary" @click="openCreateModal">
        Añadir Tipo de Acción
      </button>
    </div>

    <!-- Stock List Table -->
    <div class="overflow-x-auto shadow-lg rounded-lg">
      <table class="table w-full">
        <thead>
          <tr>
            <th>Tipo/Nombre</th>
            <th>Valor Actual (Bs.)</th>
            <th>Aporte Mensual (Bs.)</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="text-center p-4">
              <span class="loading loading-lg"></span>
            </td>
          </tr>
          <tr v-else-if="error">
            <td colspan="4" class="text-center text-error p-4">{{ error }}</td>
          </tr>
          <tr v-else-if="stocks.length === 0">
            <td colspan="4" class="text-center p-4">No hay tipos de acciones registrados.</td>
          </tr>
          <tr v-for="stock in stocks" :key="stock.id">
            <td class="font-semibold">{{ stock.type }}</td>
            <td>{{ stock.value.toFixed(2) }}</td>
            <td>{{ stock.monthly_contribution.toFixed(2) }}</td>
            <td class="text-right space-x-2">
              <RouterLink :to="{ name: 'stock-details', params: { id: stock.id } }" class="btn btn-sm btn-ghost">
                Ver Detalles
              </RouterLink>
              <button class="btn btn-sm btn-outline" @click="openEditModal(stock)">Editar</button>
              <button class="btn btn-sm btn-error" @click="handleDeleteStock(stock.id)" :disabled="isDeleting">Eliminar</button>
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
import { ref, onMounted } from 'vue';
import { stocksService } from '../services/stocksService';
import type { Stock } from '../types';
import StockFormModal from '../components/StockFormModal.vue';

const stocks = ref<Stock[]>([]);
const loading = ref(false);
const isDeleting = ref(false);
const error = ref<string | null>(null);

const isModalOpen = ref(false);
const stockToEdit = ref<Stock | null>(null);

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