<template>
  <dialog class="modal" :class="{ 'modal-open': show }">
    <div class="modal-box max-w-lg">
      <h3 class="font-bold text-lg mb-4">Retiro de Acciones para {{ member?.name }}</h3>
      <div v-if="(memberStocks?.length || 0) > 0">
        <div class="mb-4">
          <table class="table w-full">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Valor actual</th>
                <th>Retirar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(stock, idx) in memberStocks || []" :key="`${stock.stockId}-${idx}`">
                <td>{{ stock.stockType }}</td>
                <td>{{ stock.quantity }}</td>
                <td>{{ formatCurrency(stock.currentValue) }}</td>
                <td>
                  <input type="number" min="0" :max="stock.quantity" v-model.number="withdrawals[idx].quantity" class="input input-bordered input-sm w-20" step="any" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="mb-4" v-if="withdrawalSummary.length > 0">
          <label class="block font-semibold mb-2">Resumen de retiro:</label>
          <div class="bg-base-200 p-3 rounded">
            <ul class="text-sm space-y-1">
              <li v-for="(item, idx) in withdrawalSummary" :key="`${item.stockId}-${idx}`">
                {{ item.stockType }}: {{ item.quantity }} x {{ formatCurrency(item.currentValue) }} = <span class="font-mono font-semibold">{{ formatCurrency(item.total) }}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div class="mb-4">
          <label class="block font-semibold mb-1">Valor estimado de retiro</label>
          <input type="text" :value="formatCurrency(estimatedTotal)" class="input input-bordered w-full" disabled />
        </div>
        
        <div class="mb-4">
          <label class="label cursor-pointer justify-start gap-3">
            <input type="checkbox" v-model="autoMatchAmount" class="checkbox checkbox-primary" />
            <span class="label-text">Igualar monto entregado al valor estimado</span>
          </label>
        </div>
        
        <div class="mb-4">
          <label class="block font-semibold mb-1">Monto entregado</label>
          <input 
            type="text" 
            :value="deliveredAmountDisplay"
            @input="onDeliveredAmountInput"
            @blur="onDeliveredAmountBlur"
            class="input input-bordered w-full font-mono text-right" 
            :disabled="autoMatchAmount" 
          />
        </div>
        
        <div class="mb-4">
          <label class="block font-semibold mb-1">Pendiente por entregar</label>
          <input type="text" :value="formatCurrency(estimatedTotal - deliveredAmount)" class="input input-bordered w-full" disabled />
        </div>
        
        <div class="modal-action flex justify-between items-center">
          <button class="btn btn-outline" type="button" @click="$emit('cancel')">Cancelar</button>
          <button class="btn btn-primary" type="button" @click="saveWithdrawal">Guardar Retiro</button>
        </div>
      </div>
      <div v-else class="text-base-content/60 italic mb-4">
        No hay acciones registradas para este socio.
        <div class="modal-action">
          <button class="btn btn-outline" type="button" @click="$emit('cancel')">Cerrar</button>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click.prevent="$emit('cancel')">Cerrar</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { formatCurrency, formatMoneyInput, parseMoneyInput } from '@/shared/utils/formatters'
import type { Member } from '@/api/members.api'

// Defines structure for props (Derived from Subscription + Stock Value)
export interface MemberStockForWithdrawal {
  stockId: string;
  stockType: string;
  quantity: number;
  currentValue: number;
}
interface Withdrawal {
  stockId: string;
  quantity: number;
}

const props = defineProps<{
  show: boolean,
  member: Member | null,
  memberStocks?: MemberStockForWithdrawal[]
}>()
const emit = defineEmits(['save', 'cancel'])

const withdrawals = ref<Withdrawal[]>([])
const deliveredAmount = ref(0)
const deliveredAmountDisplay = ref('')
const autoMatchAmount = ref(true)

// Helper para encontrar un stock por su ID
const findStockById = (stockId: string) => {
  return (props.memberStocks || []).find(s => s.stockId === stockId)
}

const estimatedTotal = computed(() => {
  return withdrawals.value.reduce((sum, w) => {
    const stock = findStockById(w.stockId)
    return sum + (w.quantity * (stock?.currentValue || 0))
  }, 0)
})

watch(() => props.memberStocks, (newStocks) => {
  withdrawals.value = (newStocks || []).map(stock => ({ stockId: stock.stockId, quantity: 0 }))
  deliveredAmount.value = 0
  deliveredAmountDisplay.value = formatMoneyInput(0)
}, { immediate: true })

// Cuando autoMatchAmount está activado, igualar deliveredAmount con estimatedTotal
watch([autoMatchAmount, estimatedTotal], ([isAuto, total]) => {
  if (isAuto) {
    deliveredAmount.value = total
    deliveredAmountDisplay.value = formatMoneyInput(total)
  }
}, { immediate: true })

watch(deliveredAmount, (newValue) => {
  if (!autoMatchAmount.value) {
    deliveredAmountDisplay.value = formatMoneyInput(newValue);
  }
});

function onDeliveredAmountInput(event: Event) {
  if (autoMatchAmount.value) return;
  
  const target = event.target as HTMLInputElement;
  const rawValue = target.value;
  
  if (rawValue === '') {
    deliveredAmountDisplay.value = '';
    deliveredAmount.value = 0;
    return;
  }

  const cleaned = rawValue.replace(/[^\d.,]/g, '');
  deliveredAmountDisplay.value = cleaned;
  
  const parsed = parseMoneyInput(cleaned);
  deliveredAmount.value = parsed;
}

function onDeliveredAmountBlur() {
  if (autoMatchAmount.value) return;
  
  const parsed = parseMoneyInput(deliveredAmountDisplay.value);
  deliveredAmount.value = parsed;
  deliveredAmountDisplay.value = formatMoneyInput(parsed);
}

const withdrawalSummary = computed(() => {
  return withdrawals.value
    .map((w) => {
      const stock = findStockById(w.stockId)
      return {
        stockId: w.stockId,
        stockType: stock?.stockType || '',
        quantity: w.quantity,
        currentValue: stock?.currentValue || 0,
        total: w.quantity * (stock?.currentValue || 0)
      }
    })
    .filter(item => item.quantity > 0)
})

function saveWithdrawal() {
  // Mapear withdrawals con los datos completos de stockType y currentValue
  const withdrawalsWithDetails = withdrawals.value
    .map((w) => {
      const stock = findStockById(w.stockId)
      return {
        stockId: w.stockId,
        stockType: stock?.stockType || '',
        quantity: w.quantity,
        currentValue: stock?.currentValue || 0
      }
    })
    .filter(w => w.quantity > 0)
  
  emit('save', {
    withdrawals: withdrawalsWithDetails,
    estimatedTotal: estimatedTotal.value,
    deliveredAmount: deliveredAmount.value,
    pending: estimatedTotal.value - deliveredAmount.value
  })
}
</script>
