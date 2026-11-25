<template>
  <div class="py-4 space-y-5 w-full max-w-full min-w-0 overflow-x-hidden">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h3 class="text-sm font-semibold text-base-content">Cuentas Contables del Socio</h3>
        <p class="text-xs text-base-content/70">
          Acumulado por cuenta según las entradas registradas por el socio.
        </p>
      </div>
      <span class="badge badge-ghost text-xs">
        {{ store.memberAccountsSummary.length }} cuentas con movimientos
      </span>
    </div>

    <LoadingSpinner :loading="store.loadingLedger" message="Cargando cuentas del socio..." />

    <div
      v-if="!store.loadingLedger && store.memberAccountsSummary.length === 0"
      class="text-center py-8 border border-base-300 rounded-xl text-xs text-base-content/60"
    >
      No hay entradas contables registradas para este socio
    </div>

    <template v-else-if="!store.loadingLedger">
      <!-- Tarjetas por cuenta -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        <div
          v-for="account in store.memberAccountsSummary"
          :key="account.accountType"
          :class="[
            'rounded-xl p-4 space-y-2 border cursor-pointer transition-colors',
            selectedAccountType === account.accountType
              ? 'bg-primary/10 border-primary'
              : 'bg-base-200/60 border-base-300 hover:border-base-content/30'
          ]"
          @click="selectedAccountType = account.accountType"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-sm text-base-content">{{ account.accountName }}</span>
            <span class="badge badge-sm badge-ghost">
              {{ account.entriesCount }} {{ account.entriesCount === 1 ? 'entrada' : 'entradas' }}
            </span>
          </div>
          <p class="text-xl font-bold font-mono text-base-content">
            {{ formatCurrency(account.balance) }}
          </p>
          <p class="text-base-content/60">
            Último movimiento: {{ account.lastDate ? formatDate(account.lastDate) : '-' }}
          </p>
        </div>
      </div>

      <!-- Desglose de entradas de la cuenta seleccionada -->
      <div v-if="activeAccount" class="space-y-2 pt-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-base-content/70">
            Detalle de Entradas · {{ activeAccount.accountName }}
          </h4>
          <select v-model="selectedAccountType" class="select select-bordered select-xs">
            <option
              v-for="acc in store.memberAccountsSummary"
              :key="acc.accountType"
              :value="acc.accountType"
            >
              {{ acc.accountName }}
            </option>
          </select>
        </div>

        <div class="overflow-x-auto border border-base-300 rounded-xl">
          <table class="table table-sm w-full text-xs">
            <thead class="bg-base-200 text-base-content/70">
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th class="text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in activeAccount.entries" :key="entry.id">
                <td class="font-mono text-base-content/70">
                  {{ formatDate(entry.operation_date || entry.created_at) }}
                </td>
                <td class="font-medium text-base-content">
                  {{ entry.description || entry.operation_description || activeAccount.accountName }}
                </td>
                <td class="text-right font-semibold font-mono">
                  {{ formatCurrency(getEntryDisplayAmount(activeAccount.accountType, entry.amount)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { isCreditNormalAccount } from '@/features/members/utils/memberLabels'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

const props = defineProps<{
  memberId: string
  store: ReturnType<typeof useMemberDetailStore>
}>()

const selectedAccountType = ref<string>('')

watch(
  () => props.store.memberAccountsSummary,
  (accounts) => {
    if (accounts.length > 0 && !accounts.some(a => a.accountType === selectedAccountType.value)) {
      selectedAccountType.value = accounts[0].accountType
    }
  },
  { immediate: true }
)

const activeAccount = computed(() => {
  return (
    props.store.memberAccountsSummary.find(a => a.accountType === selectedAccountType.value) ||
    props.store.memberAccountsSummary[0] ||
    null
  )
})

function getEntryDisplayAmount(accountType: string, rawAmount: number): number {
  return isCreditNormalAccount(accountType) ? -rawAmount : rawAmount
}
</script>
