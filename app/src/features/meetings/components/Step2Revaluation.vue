<template>
  <div class="space-y-6">
    <div class="prose">
      <h2 class="text-xl font-bold">Paso 2: Revalorización de Activos</h2>
      <p>
        En este paso, el sistema calcula el nuevo valor de las acciones distribuyendo las
        ganancias (intereses generados) y los aportes obligatorios recaudados en el paso
        anterior.
      </p>
    </div>

    <!-- Resumen Pre-Cálculo y Botón de Acción -->
    <div v-if="status !== 'success'" class="card border bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title">Resumen para la Revalorización</h3>
        <p>Los siguientes valores se usarán para calcular el crecimiento del fondo:</p>
        <div class="stats stats-vertical shadow-inner md:stats-horizontal">
          <div class="stat">
            <div class="stat-title">Aportes Obligatorios</div>
            <div class="stat-value text-success">${{ inputs.mandatoryContributions.toFixed(2) }}</div>
            <div class="stat-desc">Recaudado en el Paso 1</div>
          </div>
          <div class="stat">
            <div class="stat-title">Intereses Generados</div>
            <div class="stat-value text-success">${{ inputs.generatedInterest.toFixed(2) }}</div>
            <div class="stat-desc">Ganancias desde la última reunión</div>
          </div>
          <div class="stat">
            <div class="stat-title">Total a Distribuir</div>
            <div class="stat-value text-primary">${{ inputs.totalToDistribute.toFixed(2) }}</div>
            <div class="stat-desc">Suma de aportes e intereses</div>
          </div>
        </div>
        <div class="card-actions mt-4 justify-end">
          <button
            class="btn btn-primary btn-wide"
            @click="startRevaluation"
            :disabled="status === 'loading'"
          >
            <span v-if="status === 'loading'" class="loading loading-spinner"></span>
            {{ status === 'loading' ? 'Calculando...' : 'Calcular Nuevo Valor de Acciones' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Resultados de la Revalorización -->
    <div v-if="status === 'success'" class="card border bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title text-success">¡Revalorización Completada!</h3>
        <p>El valor de las acciones ha sido actualizado. El crecimiento total del fondo fue de <span class="font-bold text-success">${{ results.totalGrowth.toFixed(2) }}</span>.</p>

        <div class="mt-4 overflow-x-auto">
          <table class="table-zebra table w-full">
            <thead>
              <tr>
                <th>Tipo de Acción</th>
                <th class="text-right">Valor Anterior</th>
                <th class="text-right text-info">Aporte (Cuotas)</th>
                <th class="text-right text-info">Aporte (Interés)</th>
                <th class="text-right text-success">Crecimiento Total</th>
                <th class="text-right text-primary">Nuevo Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stock in results.stocks" :key="stock.name">
                <td>
                  <div class="font-bold">{{ stock.name }}</div>
                  <div v-if="stock.isGuaranteed" class="badge badge-secondary badge-sm">Rendimiento Fijo</div>
                </td>
                <td class="text-right">${{ stock.previousValue.toFixed(2) }}</td>
                <td class="text-right text-info">+${{ stock.growthFromContributions.toFixed(2) }}</td>
                <td class="text-right text-info">+${{ stock.growthFromInterest.toFixed(2) }}</td>
                <td class="text-right font-bold text-success">+${{ stock.totalGrowthPerShare.toFixed(2) }}</td>
                <td class="text-right font-bold text-primary">${{ stock.newValue.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
     <!-- Manejo de Errores -->
    <div v-if="status === 'error'" role="alert" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <div>
        <h3 class="font-bold">Error en el Cálculo</h3>
        <div class="text-xs">Ocurrió un problema al intentar revalorizar los activos. Por favor, inténtalo de nuevo.</div>
      </div>
       <button class="btn btn-sm" @click="resetStatus">Reintentar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

type Status = 'idle' | 'loading' | 'success' | 'error';

const status = ref<Status>('idle');

// --- DATOS DE EJEMPLO (MOCK DATA) ---

// Valores de entrada para el cálculo. En una implementación real,
// estos datos vendrían del estado de la reunión (Pinia store).
const inputs = ref({
  mandatoryContributions: 3500.00,
  generatedInterest: 875.50,
  totalToDistribute: 4375.50,
});

// Resultados del cálculo. En una implementación real,
// esto sería la respuesta del endpoint POST /meetings/active/revaluate-assets
const results = ref({
  totalGrowth: 4375.50,
  stocks: [
    {
      name: 'Acción Ordinaria',
      isGuaranteed: false,
      previousValue: 1250.00,
      growthFromContributions: 125.00,
      growthFromInterest: 28.75,
      totalGrowthPerShare: 153.75,
      newValue: 1403.75,
    },
    {
      name: 'Acción Bono',
      isGuaranteed: true,
      previousValue: 1000.00,
      growthFromContributions: 0, // Las acciones bono crecen por su rendimiento fijo, no por aportes.
      growthFromInterest: 20.00, // Rendimiento garantizado del 2% sobre 1000
      totalGrowthPerShare: 20.00,
      newValue: 1020.00,
    },
    {
      name: 'Acción Temporal',
      isGuaranteed: false,
      previousValue: 50.00,
      growthFromContributions: 5.00,
      growthFromInterest: 1.25,
      totalGrowthPerShare: 6.25,
      newValue: 56.25,
    },
  ],
});

// Simula la llamada al backend para iniciar la revalorización
const startRevaluation = async () => {
  status.value = 'loading';
  console.log('Iniciando llamada al API para revalorizar activos...');
  
  // Simulación de la llamada a la API
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simulación de una respuesta exitosa
  // Para probar el estado de error, cambia la condición a `false`
  if (Math.random() > 0.1) { // 90% de probabilidad de éxito
    console.log('Cálculo completado con éxito.', results.value);
    status.value = 'success';
  } else {
    console.error('La simulación de API falló.');
    status.value = 'error';
  }
};

const resetStatus = () => {
  status.value = 'idle';
}

</script> 