<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-if="error && !loading" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <div v-if="!loading && !error" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Members List -->
      <div class="card bg-base-100 shadow-lg rounded-lg">
        <div class="card-body p-4 md:p-6">
          <h3 class="text-lg font-semibold mb-4">Socios</h3>
          <div class="space-y-2">
            <div
              v-for="member in members"
              :key="member.id"
              @click="selectMember(member)"
              :class="[
                'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
                selectedMember && selectedMember.id === member.id
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'hover:bg-base-200 border-2 border-transparent'
              ]"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                :style="{ backgroundColor: getMemberColor(member.id) }"
              >
                {{ getInitials(member.name) }}
              </div>
              <div class="flex-1 min-w-0">
                <p
                  class="font-medium text-sm md:text-base truncate"
                  :class="
                    selectedMember && selectedMember.id === member.id
                      ? 'text-primary'
                      : 'text-base-content'
                  "
                >
                  {{ member.name }}
                </p>
              </div>
              <div v-if="hasPurchase(member.id)" class="flex-shrink-0">
                <span class="badge badge-success badge-sm">Con compras</span>
              </div>
            </div>
          </div>
          
          <div class="mt-6 pt-4 border-t border-base-300">
            <div class="text-center">
              <div class="text-xs md:text-sm font-light text-base-content/70 uppercase mb-1">
                Total En Acciones Compradas
              </div>
              <div class="text-2xl md:text-3xl font-bold text-base-content">
                {{ formatCurrency(totalPurchasedShares) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Purchase Form -->
      <div class="card bg-base-100 shadow-lg rounded-lg">
        <div class="card-body p-4 md:p-6">
          <div v-if="!selectedMember" class="flex items-center justify-center h-64 text-base-content/60">
            <p class="text-center">Seleccione un socio para registrar una compra.</p>
          </div>
          
          <div v-else>
            <div class="mb-6">
              <h2 class="text-xl md:text-2xl font-bold mb-2">Registrar compra de acciones</h2>
              <p class="text-base md:text-lg text-base-content/80 break-words">{{ selectedMember.name }}</p>
            </div>

            <div v-if="localPurchase.stock_id" class="space-y-4">
              <div class="bg-base-200 p-3 md:p-4 rounded-lg">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-base md:text-lg break-words">{{ getStockName(localPurchase.stock_id) }}</p>
                    <p class="text-xs md:text-sm text-base-content/70 break-words">
                      {{ localPurchase.quantity }} uds. x {{ formatCurrency(getStockValue(localPurchase.stock_id)) }} c/u
                    </p>
                  </div>
                  <p class="font-mono text-xl md:text-2xl font-bold text-primary flex-shrink-0">
                    {{ formatCurrency(localPurchase.quantity * getStockValue(localPurchase.stock_id)) }}
                  </p>
                </div>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Forma de Pago</span>
                </label>
                <select v-model="localPurchase.payment_method" class="select select-bordered w-full">
                  <option value="cash">Efectivo</option>
                  <option value="credit">Crédito</option>
                  <option value="mixed">Mixto</option>
                </select>
              </div>

              <div class="mt-6 flex justify-end gap-2">
                <button class="btn btn-outline w-full md:w-auto" @click="clearPurchase">
                  Cancelar
                </button>
                <button 
                  class="btn btn-primary w-full md:w-auto md:btn-lg" 
                  @click="confirmPurchase"
                  :disabled="isSubmitting"
                >
                  <span v-if="isSubmitting" class="loading loading-spinner"></span>
                  <span v-else>Confirmar Compra</span>
                </button>
              </div>
            </div>

            <div v-else class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Tipo de Acción</span>
                </label>
                <select v-model="localPurchase.stock_id" class="select select-bordered w-full">
                  <option value="">Seleccione una acción</option>
                  <option v-for="stock in stocks" :key="stock.id" :value="stock.id">
                    {{ stock.type }} - {{ formatCurrency(stock.value) }} c/u
                  </option>
                </select>
              </div>

              <div v-if="localPurchase.stock_id" class="form-control">
                <label class="label">
                  <span class="label-text">Cantidad</span>
                </label>
                <input
                  v-model.number="localPurchase.quantity"
                  type="number"
                  min="1"
                  class="input input-bordered w-full"
                  placeholder="Cantidad de acciones"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 md:mt-8 pt-4 border-t">
      <div class="text-right mt-4">
        <button class="btn btn-success w-full md:w-auto" @click="$emit('completed')">
          Finalizar registro de compras
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { membersApi, type Member } from '@/api/members.api'
import { stocksApi, type Stock } from '@/api/stocks.api'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { formatCurrency } from '@/shared/utils/formatters'
import type { MemberPurchase } from '@/api/members.api'

const emit = defineEmits<{
  completed: []
}>()

const store = useActiveMeetingStore()
const members = ref<Member[]>([])
const stocks = ref<Stock[]>([])
const selectedMember = ref<Member | null>(null)
const registeredPurchases = ref<MemberPurchase[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const isSubmitting = ref(false)

const localPurchase = ref({
  stock_id: '',
  quantity: 1,
  payment_method: 'cash'
})

const totalPurchasedShares = computed(() => 
  registeredPurchases.value.reduce((sum, p) => sum + p.total_value, 0)
)

function hasPurchase(memberId: string) {
  return registeredPurchases.value.some(p => {
    // Los purchases del mock no tienen member_id directo, pero podemos verificar por otros medios
    return true // Simplificado para mockup
  })
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getMemberColor(memberId: string): string {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // green
    '#06b6d4', // cyan
    '#ef4444', // red
    '#6366f1', // indigo
  ]
  let hash = 0
  for (let i = 0; i < memberId.length; i++) {
    hash = memberId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getStockName(stockId: string) {
  const stock = stocks.value.find(s => s.id === stockId)
  return stock?.type || 'Desconocido'
}

function getStockValue(stockId: string) {
  const stock = stocks.value.find(s => s.id === stockId)
  return stock?.value || 0
}

function clearPurchase() {
  localPurchase.value = {
    stock_id: '',
    quantity: 1,
    payment_method: 'cash'
  }
}

onMounted(async () => {
  loading.value = true
  try {
    [members.value, stocks.value] = await Promise.all([
      membersApi.getMembers(),
      stocksApi.getStocks()
    ])
    
    // Cargar compras registradas si hay meetingId
    if (store.meetingId) {
      // Para mockup, usar datos mock directamente
      registeredPurchases.value = []
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar datos'
  } finally {
    loading.value = false
  }
})

function selectMember(member: Member) {
  selectedMember.value = member
  clearPurchase()
}

async function confirmPurchase() {
  if (!selectedMember.value || !localPurchase.value.stock_id || !store.meetingId) {
    return
  }

  isSubmitting.value = true
  
  try {
    const stockValue = getStockValue(localPurchase.value.stock_id)
    const totalValue = localPurchase.value.quantity * stockValue
    
    // Simular registro de compra (estado local)
    const purchase: MemberPurchase = {
      stock_subscription_id: `sub-${Date.now()}`,
      stock_id: localPurchase.value.stock_id,
      stock_type: getStockName(localPurchase.value.stock_id),
      quantity: localPurchase.value.quantity,
      unit_value: stockValue,
      total_value: totalValue,
      purchase_date: new Date().toISOString(),
      meeting_id: store.meetingId,
      operation_id: `op-${Date.now()}`,
      loan: null
    }
    
    registeredPurchases.value.push(purchase)
    store.addPurchase(purchase)
    
    // Limpiar formulario
    clearPurchase()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al registrar compra'
  } finally {
    isSubmitting.value = false
  }
}
</script>
