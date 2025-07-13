<template>
  <dialog v-if="show" class="modal modal-open">
    <div class="modal-box max-w-lg">
      <h3 class="font-bold text-lg mb-4">Retiro de Acciones para {{ member?.name }}</h3>
      <div v-if="memberStocks.length > 0">
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
              <tr v-for="(stock, idx) in memberStocks" :key="stock.stockId">
                <td>{{ stock.stockType }}</td>
                <td>{{ stock.quantity }}</td>
                <td>${{ stock.currentValue.toFixed(2) }}</td>
                <td>
                  <input type="number" min="0" :max="stock.quantity" v-model.number="withdrawals[idx].quantity" class="input input-bordered input-sm w-20" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="mb-4" v-if="withdrawalSummary.length > 0">
          <label class="block font-semibold mb-2">Resumen de retiro:</label>
          <div class="bg-base-200 p-3 rounded">
            <ul class="text-sm space-y-1">
              <li v-for="item in withdrawalSummary" :key="item.stockId">
                {{ item.stockType }}: {{ item.quantity }} x ${{ item.currentValue.toFixed(2) }} = <span class="font-mono font-semibold">${{ item.total.toFixed(2) }}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div class="mb-4">
          <label class="block font-semibold mb-1">Valor estimado de retiro</label>
          <input type="text" :value="'$' + estimatedTotal.toFixed(2)" class="input input-bordered w-full" disabled />
        </div>
        
        <div class="mb-4">
          <label class="block font-semibold mb-1">Monto entregado</label>
          <input type="number" min="0" :max="estimatedTotal" v-model.number="deliveredAmount" class="input input-bordered w-full" />
        </div>
        
        <div class="mb-4">
          <label class="block font-semibold mb-1">Pendiente por entregar</label>
          <input type="text" :value="'$' + (estimatedTotal - deliveredAmount).toFixed(2)" class="input input-bordered w-full" disabled />
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

interface MemberStock {
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
  member: any,
  memberStocks: MemberStock[]
}>()
const emits = defineEmits(['save', 'cancel'])

const withdrawals = ref<Withdrawal[]>([])
const deliveredAmount = ref(0)

watch(() => props.memberStocks, (newStocks) => {
  withdrawals.value = newStocks.map(stock => ({ stockId: stock.stockId, quantity: 0 }))
  deliveredAmount.value = 0
}, { immediate: true })

const estimatedTotal = computed(() => {
  return withdrawals.value.reduce((sum, w, idx) => {
    const stock = props.memberStocks[idx]
    return sum + (w.quantity * (stock?.currentValue || 0))
  }, 0)
})

const withdrawalSummary = computed(() => {
  return withdrawals.value
    .map((w, idx) => ({
      stockId: w.stockId,
      stockType: props.memberStocks[idx].stockType,
      quantity: w.quantity,
      currentValue: props.memberStocks[idx].currentValue,
      total: w.quantity * props.memberStocks[idx].currentValue
    }))
    .filter(item => item.quantity > 0)
})

function saveWithdrawal() {
  emits('save', {
    withdrawals: withdrawals.value,
    estimatedTotal: estimatedTotal.value,
    deliveredAmount: deliveredAmount.value,
    pending: estimatedTotal.value - deliveredAmount.value
  })
}
</script> 