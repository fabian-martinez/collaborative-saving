<template>
  <div class="p-6 bg-base-200 min-h-screen">
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Card 1: Total Savings -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Ahorro Total</h2>
          <p class="text-4xl font-bold">$12,345.67</p>
          <p class="text-sm text-gray-500">+5.2% vs el mes pasado</p>
        </div>
      </div>

      <!-- Card 2: Total Members -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Miembros Activos</h2>
          <p class="text-4xl font-bold">42</p>
           <p class="text-sm text-gray-500">+2 nuevos este mes</p>
        </div>
      </div>

      <!-- Card 3: Stock Value -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Valor de las Acciones</h2>
          <ul class="list-disc pl-5">
            <li><span class="font-bold">Acción A:</span> $150.25</li>
            <li><span class="font-bold">Acción B:</span> $85.50</li>
          </ul>
           <p class="text-sm text-gray-500">Actualizado en la última junta</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <!-- Chart 1: Collections per meeting -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Recaudado por Reunión</h2>
          <div style="height: 400px;">
            <Bar :data="collectionsByMeetingData" :options="chartOptions" />
          </div>
        </div>
      </div>

      <!-- Chart 2: Stock value history -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Valor de la Acción (Histórico)</h2>
          <div style="height: 400px;">
            <Line :data="stockHistoryData" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>
     <div class="grid grid-cols-1 gap-6 mt-6">
       <!-- Chart 3: Asset Distribution -->
      <div class="card bg-base-100 shadow-xl lg:col-span-1">
        <div class="card-body">
          <h2 class="card-title">Distribución de Activos</h2>
          <div class="flex justify-center">
            <div style="height: 300px; width: 300px;">
                <Pie :data="assetDistributionData" :options="pieChartOptions" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bar, Line, Pie } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, type ChartOptions } from 'chart.js'
import { ref } from 'vue'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement)

const collectionsByMeetingData = ref({
  labels: ['Reunión 1', 'Reunión 2', 'Reunión 3', 'Reunión 4', 'Reunión 5'],
  datasets: [
    {
      label: 'Recaudado ($)',
      backgroundColor: '#f87979',
      data: [1250, 1380, 1120, 1490, 1540]
    }
  ]
})

const stockHistoryData = ref({
  labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
  datasets: [
    {
      label: 'Acción A',
      borderColor: '#42A5F5',
      backgroundColor: 'rgba(66, 165, 245, 0.5)',
      data: [120, 125, 122, 130, 145, 150.25]
    },
    {
      label: 'Acción B',
      borderColor: '#FF7043',
      backgroundColor: 'rgba(255, 112, 67, 0.5)',
      data: [80, 82, 85, 83, 88, 85.50]
    }
  ]
})

const assetDistributionData = ref({
    labels: ['Préstamos Activos', 'Caja', 'Inversiones'],
    datasets: [
        {
            backgroundColor: ['#41B883', '#E46651', '#00D8FF'],
            data: [65, 25, 10]
        }
    ]
})

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false
})

const pieChartOptions = ref<ChartOptions<'pie'>>({
  responsive: true,
  maintainAspectRatio: false,
   plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Distribución de Activos'
    }
  }
})

</script>
