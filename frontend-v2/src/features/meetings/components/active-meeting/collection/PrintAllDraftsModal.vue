<template>
  <dialog class="modal" :class="{ 'modal-open': isOpen }">
    <div class="modal-box max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="flex flex-col items-center gap-4">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p>Generando borradores ({{ progress }}/{{ total }})...</p>
        </div>
      </div>
      
      <div v-else>
        <div class="flex justify-between items-center mb-4 no-print">
          <h3 class="font-bold text-xl">Vista Previa: Todos los Borradores</h3>
          <button
            class="btn btn-sm btn-circle btn-ghost"
            @click="$emit('close')"
          >
            ✕
          </button>
        </div>
        
        <div v-if="allReceipts.length === 0" class="text-center py-8">
          <p>No hay recibos pendientes por generar.</p>
        </div>

        <div id="print-all-drafts-content" class="bg-base-100 font-sans">
          <!-- Iterate over each member's form/receipt -->
          <div v-for="(receipt, index) in allReceipts" :key="receipt.member.id" 
               class="receipt-page print-container relative overflow-hidden" 
               :class="{'mb-12 border-b-4 pb-8 no-print': index !== allReceipts.length - 1}">
               
            <div class="watermark-draft">BORRADOR</div>
            
            <div class="text-center mb-6 relative z-10">
              <h2 class="text-2xl font-bold">Recibo de Pago</h2>
              <p class="text-lg text-base-content/80">{{ receipt.member.name }}</p>
              <p class="text-sm text-center text-base-content/70">{{ printDate }}</p>
            </div>
            
            <div class="space-y-4 relative z-10 px-2">
              <!-- Acciones -->
              <div v-if="receipt.stockDues.length > 0">
                <h4 class="text-lg font-semibold border-b-2 border-base-300 pb-2">Acciones</h4>
                <div v-for="due in receipt.stockDues" :key="due.description" class="flex justify-between items-baseline py-2">
                  <div>
                    <p class="font-semibold">{{ due.description }}</p>
                    <p class="text-sm text-base-content/70" v-if="due.stock_quantity">
                      {{ formatNumber(Number(due.stock_quantity || 0)) }} uds. x {{ formatCurrency(due.monthly_contribution || 0) }} c/u
                    </p>
                  </div>
                  <div class="grow border-b-2 border-dotted border-base-300 mx-4"></div>
                  <p class="font-mono text-lg shrink-0">{{ formatCurrency(due.amount) }}</p>
                </div>
              </div>
              
              <!-- Préstamos -->
              <div v-if="receipt.loanDues.length > 0">
                <h4 class="text-lg font-semibold border-b-2 border-base-300 pb-2 mt-4">Préstamos</h4>
                <div v-for="due in receipt.loanDues" :key="due.description" class="py-2">
                  <div class="flex items-baseline">
                    <p class="font-semibold">{{ due.description }}</p>
                    <div class="grow border-b-2 border-dotted border-base-300 mx-4"></div>
                    <p class="font-mono text-lg shrink-0">{{ formatCurrency(due.amount) }}</p>
                  </div>
                  <div v-if="due.details" class="pl-4 mt-2 text-sm text-base-content/80 border-l-2 border-base-300 space-y-1">
                    <div class="flex justify-between w-64 max-w-full"><span>Saldo actual:</span><span class="font-mono">{{ formatCurrency(due.details.outstanding_balance ?? 0) }}</span></div>
                    <div class="flex justify-between w-64 max-w-full"><span>Abono Capital:</span><span class="font-mono">{{ formatCurrency(due.amount - (due.details.interest || 0)) }}</span></div>
                    <div class="flex justify-between w-64 max-w-full"><span>Intereses:</span><span class="font-mono font-semibold text-accent">{{ formatCurrency(due.details.interest || 0) }}</span></div>
                  </div>
                </div>
              </div>
              
              <!-- Otros -->
              <div v-if="receipt.otherDues.length > 0">
                <h4 class="text-lg font-semibold border-b-2 border-base-300 pb-2 mt-4">Otros Aportes</h4>
                <div v-for="due in receipt.otherDues" :key="due.description" class="flex justify-between items-baseline py-2">
                  <p class="font-semibold">{{ due.description }}</p>
                  <div class="grow border-b-2 border-dotted border-base-300 mx-4"></div>
                  <p class="font-mono text-lg shrink-0">{{ formatCurrency(due.amount) }}</p>
                </div>
              </div>
              
              <!-- Total -->
              <div class="mt-8 pt-4 border-t-2 border-dashed flex justify-between font-bold text-2xl">
                <span>Total a Pagar:</span>
                <span class="font-mono text-primary">{{ formatCurrency(receipt.total) }}</span>
              </div>
            </div>
            
          </div>
        </div>
        
        <div class="modal-action no-print" v-if="allReceipts.length > 0">
          <button class="btn btn-ghost" @click="$emit('close')">Cancelar</button>
          <button class="btn btn-primary" @click="printAll">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Todo
          </button>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop no-print" @submit.prevent="$emit('close')">
      <button type="submit">cerrar</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { membersApi, type Member, type MemberDue } from '@/api/members.api'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import { usePrintReceipt } from '@/shared/composables/usePrintReceipt'

const props = defineProps<{
  isOpen: boolean
  members: Member[]
  printDate: string
}>()

defineEmits<{
  close: []
}>()

interface DraftReceipt {
  member: Member
  stockDues: MemberDue[]
  loanDues: MemberDue[]
  otherDues: MemberDue[]
  total: number
}

const isLoading = ref(false)
const progress = ref(0)
const total = ref(0)
const allReceipts = ref<DraftReceipt[]>([])

const dummyMember = ref({ name: 'Todos_los_Borradores' } as Member)

const printHelpers = usePrintReceipt(
  dummyMember,
  'print-all-drafts-content',
  'payment-receipt-print-container',
  'payment-receipt-print'
)

watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    await loadAllDrafts()
  }
})

async function loadAllDrafts() {
  isLoading.value = true
  progress.value = 0
  total.value = props.members.length
  allReceipts.value = []
  
  for (const member of props.members) {
    try {
      const dues = await membersApi.getMemberDues(member.id)
      const capitalPayment = dues
        .filter((due) => due.type === 'loan_payment')
        .reduce((sum, due) => sum + (due.details?.principal || 0), 0)
        
      const { insurance_amount } = await membersApi.getMemberInsurance(member.id, capitalPayment)
      if (insurance_amount > 0) {
        dues.push({
          type: 'insurance',
          description: 'Seguro de deuda',
          amount: insurance_amount,
        })
      }
      
      const stockDues = dues.filter(d => d.type === 'stock_fee')
      const loanDues = dues.filter(d => d.type === 'loan_payment')
      const otherDues = dues.filter(d => ['mandatory_contribution', 'fee', 'insurance'].includes(d.type) && d.amount > 0)
      
      const totalAmount = dues.reduce((sum, d) => sum + Number(d.amount || 0), 0)
      
      // Only include members with dues
      if (totalAmount > 0) {
        allReceipts.value.push({
          member,
          stockDues,
          loanDues,
          otherDues,
          total: totalAmount
        })
      }
    } catch (e) {
      console.error(`Error loading dues for member ${member.name}`, e)
    }
    progress.value++
  }
  
  isLoading.value = false
}

function printAll() {
  printHelpers.printReceipt()
}
</script>

<style scoped>
.watermark-draft {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 8rem;
  font-weight: bold;
  color: #9ca3af !important; /* gray-400 */
  opacity: 0.15 !important;
  pointer-events: none;
  z-index: 0;
  user-select: none;
  white-space: nowrap;
}

@media print {
  .watermark-draft {
    color: #9ca3af !important;
    opacity: 0.2 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .receipt-page {
    page-break-after: always;
  }
  .receipt-page:last-child {
    page-break-after: auto;
  }
  
  /* Reset background and shadow for print */
  #print-all-drafts-container {
    background: transparent !important;
  }
}
</style>
