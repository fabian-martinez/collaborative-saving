<template>
  <div class="stock-history-chart">
    <div class="chart-header">
      <div class="chart-controls">
        <select v-model="selectedStockType" @change="updateChart" class="select-input">
          <option value="">Todas las acciones</option>
          <option value="Acciones Grandes">Acciones Grandes</option>
          <option value="Acciones Medianas">Acciones Medianas</option>
          <option value="Acciones Super">Acciones Super</option>
          <option value="Accion Mini">Accion Mini</option>
          <option value="Accion Fenix">Accion Fenix</option>
          <option value="Acciones Pequeñas">Acciones Pequeñas</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Cargando datos...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="chartData.length > 0" class="chart-container">
      <div style="height: 300px;">
        <canvas ref="chartCanvas"></canvas>
      </div>
      
      <div class="chart-summary">
        <div class="summary-item">
          <span class="label">Tipos de acciones:</span>
          <span class="value">{{ chartData.length }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total operaciones:</span>
          <span class="value">{{ totalOperations }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Período analizado:</span>
          <span class="value">{{ analysisPeriod }}</span>
        </div>
      </div>
    </div>

    <div v-else class="no-data">
      <p>No hay datos disponibles para mostrar</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Chart from 'chart.js/auto'
import { stocksService } from '../services/stocksService'
import type { StockHistoryData, StockHistoryPoint } from '../types'

interface MonthlyData {
  month: string
  quantity: number
  change: number
  operations: string[]
}

const chartCanvas = ref<HTMLCanvasElement>()
const chart = ref<Chart | null>(null)

const selectedStockType = ref('')
const loading = ref(false)
const error = ref('')
const chartData = ref<StockHistoryData[]>([])

const totalOperations = computed(() => {
  return chartData.value.reduce((total, data) => total + data.totalOperations, 0)
})

const analysisPeriod = computed(() => {
  if (chartData.value.length === 0) return 'N/A'
  
  const allDates = chartData.value.flatMap(data => 
    data.history.map(point => new Date(point.date))
  )
  
  if (allDates.length === 0) return 'N/A'
  
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
  
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short' 
    })
  }
  
  return `${formatMonth(minDate)} - ${formatMonth(maxDate)}`
})

const loadData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params: { stockType?: string; includeTransfers?: boolean; includeLoanPayments?: boolean } = {}
    
    if (selectedStockType.value) {
      params.stockType = selectedStockType.value
    }
    
    chartData.value = await stocksService.getStockHistory(params)
    updateChart()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error desconocido'
  } finally {
    loading.value = false
  }
}

const groupByMonth = (history: StockHistoryPoint[]): MonthlyData[] => {
  const monthlyMap = new Map<string, MonthlyData>()
  
  for (const point of history) {
    const date = new Date(point.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short' 
    })
    
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthLabel,
        quantity: point.quantity,
        change: 0,
        operations: []
      })
    }
    
    const monthlyData = monthlyMap.get(monthKey)!
    monthlyData.change += point.change
    monthlyData.operations.push(...point.operations)
    
    // Mantener la cantidad más reciente del mes
    if (new Date(point.date) > new Date(monthlyData.month)) {
      monthlyData.quantity = point.quantity
    }
  }
  
  // Convertir a array y ordenar por fecha
  const sortedData = Array.from(monthlyMap.values())
    .sort((a, b) => {
      const dateA = new Date(a.month + ' 1')
      const dateB = new Date(b.month + ' 1')
      return dateA.getTime() - dateB.getTime()
    })
  
  // Rellenar meses faltantes con el valor del mes anterior
  const filledData: MonthlyData[] = []
  let lastQuantity = 0
  
  for (let i = 0; i < sortedData.length; i++) {
    const currentMonth = sortedData[i]
    
    // Si es el primer mes o hay un gap, rellenar con el valor anterior
    if (i === 0) {
      lastQuantity = currentMonth.quantity
      filledData.push(currentMonth)
    } else {
      const previousMonth = sortedData[i - 1]
      const currentDate = new Date(currentMonth.month + ' 1')
      const previousDate = new Date(previousMonth.month + ' 1')
      
      // Calcular meses de diferencia
      const monthDiff = (currentDate.getFullYear() - previousDate.getFullYear()) * 12 + 
                       (currentDate.getMonth() - previousDate.getMonth())
      
      // Si hay meses faltantes, rellenar con el valor del mes anterior
      for (let j = 1; j < monthDiff; j++) {
        const missingDate = new Date(previousDate)
        missingDate.setMonth(previousDate.getMonth() + j)
        
        const missingMonthLabel = missingDate.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'short' 
        })
        
        filledData.push({
          month: missingMonthLabel,
          quantity: lastQuantity,
          change: 0,
          operations: []
        })
      }
      
      lastQuantity = currentMonth.quantity
      filledData.push(currentMonth)
    }
  }
  
  return filledData
}

const updateChart = () => {
  if (!chartCanvas.value || chartData.value.length === 0) return
  
  // Destruir chart anterior si existe
  if (chart.value) {
    chart.value.destroy()
  }
  
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return
  
  let dataToShow = chartData.value
  
  // Si hay un tipo seleccionado, filtrar solo ese tipo
  if (selectedStockType.value) {
    dataToShow = chartData.value.filter(data => data.stockType === selectedStockType.value)
  }
  
  // Crear datasets para cada tipo de acción
  const datasets = dataToShow.map((stockData, index) => {
    const colors = [
      'rgb(75, 192, 192)',
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 205, 86)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)'
    ]
    
    // Agrupar por mes
    const monthlyHistory = groupByMonth(stockData.history)
    const data = monthlyHistory.map(point => point.quantity)
    
    return {
      label: stockData.stockType,
      data,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
      tension: 0.1,
      fill: false
    }
  })
  
  // Usar las fechas del primer dataset como labels
  const labels = dataToShow.length > 0 ? 
    groupByMonth(dataToShow[0].history).map(point => point.month) : []
  
  chart.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: selectedStockType.value ? 
            `Evolución mensual de ${selectedStockType.value}` : 
            'Evolución mensual de todas las acciones'
        },
        tooltip: {
          callbacks: {
            afterLabel: function(context) {
              const datasetIndex = context.datasetIndex
              const dataIndex = context.dataIndex
              if (dataToShow[datasetIndex]) {
                const monthlyHistory = groupByMonth(dataToShow[datasetIndex].history)
                if (monthlyHistory[dataIndex]) {
                  const point = monthlyHistory[dataIndex]
                  return `Cambio del mes: ${point.change >= 0 ? '+' : ''}${point.change}`
                }
              }
              return ''
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Cantidad de Acciones'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Mes'
          }
        }
      }
    }
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stock-history-chart {
  padding: 0;
}

.chart-header {
  margin-bottom: 15px;
}

.chart-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.select-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.chart-container {
  margin-top: 15px;
}

.chart-summary {
  display: flex;
  gap: 20px;
  margin: 15px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.summary-item .label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.summary-item .value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.loading, .error, .no-data {
  text-align: center;
  padding: 40px;
  color: #666;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
