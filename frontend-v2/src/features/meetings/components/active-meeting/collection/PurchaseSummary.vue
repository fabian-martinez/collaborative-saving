<template>
  <div class="mb-4 p-4 bg-base-200 rounded-box space-y-4">
    <div>
      <div class="text-center">
        <div class="text-sm font-light text-base-content/70 uppercase">
          Total En Acciones Compradas
        </div>
        <div class="text-3xl font-bold text-primary">
          <span v-if="typeof totalPurchasedShares === 'number'">
            <CopyOnDblClickNumber :value="-totalPurchasedShares" />
          </span>
          <span v-else>
            N/D
          </span>
        </div>
      </div>
    </div>
    <div class="text-center">
      <div class="text-sm font-light text-base-content/70 uppercase">Total Efectivo Recaudado</div>
      <div class="text-2xl font-bold text-success">
        <span v-if="typeof totalCashRegistered === 'number'">
          <CopyOnDblClickNumber :value="totalCashRegistered" />
        </span>
        <span v-else>
          N/D
        </span>
      </div>
    </div>
    <div class="border-t border-base-300/50"></div>
    <div>
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-base-content/80">
          Compras Registradas
        </h4>
        <button
          v-if="registeredOperations.length > 0 || (selectedMember && memberPurchases.length > 0)"
          @click="$emit('toggle-transactions')"
          class="btn btn-ghost btn-xs"
          :class="{ 'btn-active': showAllTransactions }"
        >
          {{ showAllTransactions ? 'Solo este socio' : 'Todas' }}
        </button>
      </div>
      <div v-if="showAllTransactions">
        <div v-if="registeredOperations.length > 0" class="space-y-2" :class="{ 'max-h-32 overflow-y-auto': registeredOperations.length > 3 }">
          <div
            v-for="op in registeredOperations"
            :key="op.id"
            class="bg-base-100/50 p-2 rounded-md text-sm cursor-pointer hover:bg-primary/10 transition"
            @click="$emit('show-operation', op)"
          >
            <span class="font-semibold">{{ op.description || 'Compra de acciones' }}</span>
            <span class="ml-2 text-xs text-base-content/60">
              <span v-if="typeof (op as any).total_debit === 'number'">
                <CopyOnDblClickNumber :value="(op as any).total_debit" />
              </span>
              <span v-else>
                N/D
              </span>
            </span>
          </div>
        </div>
        <p v-else class="text-base-content/60 italic text-sm text-center">Sin compras registradas aún.</p>
      </div>
      <div v-else>
        <div v-if="!selectedMember" class="text-base-content/60 italic text-sm text-center">
          Seleccione un socio para ver sus compras.
        </div>
        <div v-else>
          <div v-if="isMemberPurchasesLoading" class="text-sm text-center text-base-content/60 py-4">
            Cargando compras del socio...
          </div>
          <div v-else-if="memberPurchasesError" class="alert alert-error text-sm">
            {{ memberPurchasesError }}
          </div>
          <div v-else-if="memberPurchases.length > 0" class="space-y-2" :class="{ 'max-h-32 overflow-y-auto': memberPurchases.length > 3 }">
            <div
              v-for="purchase in memberPurchases"
              :key="purchase.stock_subscription_id"
              class="bg-base-100/50 p-3 rounded-md text-sm cursor-pointer hover:bg-primary/10 transition"
              @click="$emit('show-member-purchase', purchase)"
            >
              <div class="flex justify-between items-center">
                <span class="font-semibold">
                  {{ purchase.stock_type }} · {{ purchase.quantity }} uds
                </span>
                <span class="text-xs text-base-content/60">
                  <CopyOnDblClickNumber :value="purchase.total_value" />
                </span>
              </div>
              <div class="flex justify-between text-xs text-base-content/60 mt-1">
                <span>{{ formatPurchaseDate(purchase.purchase_date) }}</span>
                <span v-if="purchase.loan">Con financiamiento</span>
              </div>
            </div>
          </div>
          <p v-else class="text-base-content/60 italic text-sm text-center">
            Este socio no ha realizado compras en la reunión.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'
import type { Operation } from '@/api/meetings.api'
import type { MemberPurchase, Member } from '@/api/members.api'

// Props
const props = defineProps<{
  totalPurchasedShares: number
  totalCashRegistered: number
  registeredOperations: Operation[]
  showAllTransactions: boolean
  selectedMember: Member | null
  memberPurchases: MemberPurchase[]
  isMemberPurchasesLoading: boolean
  memberPurchasesError: string | null
}>()

// Emits
const emit = defineEmits<{
  'toggle-transactions': []
  'show-operation': [op: Operation]
  'show-member-purchase': [purchase: MemberPurchase]
}>()

// Helper function
function formatPurchaseDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}
</script>

