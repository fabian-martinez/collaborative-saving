<template>
  <div class="mb-4 p-4 bg-base-200 rounded-box space-y-4">
    <div>
      <div class="text-center">
        <div class="text-sm font-light text-base-content/70 uppercase">
          Total Efectivo de Compras
        </div>
        <div class="text-3xl font-bold text-primary">
          <CopyOnDblClickNumber :value="totalCashRegistered" />
        </div>
      </div>
    </div>

    <div class="border-t border-base-300/50"></div>

    <div>
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-base-content/80">
          Compras Registradas
        </h4>
        <button
          v-if="groupedPurchases.length > 0"
          @click="isExpanded = !isExpanded"
          class="btn btn-ghost btn-xs"
          :class="{ 'btn-active': isExpanded }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 transition-transform"
            :class="{ 'rotate-180': isExpanded }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          {{ isExpanded ? 'Colapsar' : 'Ver todos' }}
        </button>
      </div>
      <div v-if="groupedPurchases.length > 0" class="space-y-2" :class="{ 'max-h-32 overflow-y-auto': !isExpanded }">
        <div
          v-for="(purchase, index) in groupedPurchases"
          :key="index"
          class="flex justify-between items-center bg-base-100/50 p-2 rounded-md text-sm"
        >
          <span class="font-medium">{{ purchase.memberName }}</span>
          <span class="font-mono text-success font-bold">
            <CopyOnDblClickNumber :value="purchase.amount" />
          </span>
        </div>
      </div>
      <p v-else class="text-base-content/60 italic text-sm text-center">
        Sin compras registradas aún.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'
import type { Operation } from '@/api/meetings.api'
import type { Member } from '@/api/members.api'

// Props
const props = defineProps<{
  totalCashRegistered: number
  registeredOperations: Operation[]
  members: Member[]
}>()

// Estado para controlar si está expandido
const isExpanded = ref(false)

// Agrupar compras por miembro
const groupedPurchases = computed(() => {
  const grouped = new Map<string, { memberName: string; amount: number }>()

  props.registeredOperations.forEach((op) => {
    if (!op.member_id) return

    const member = props.members.find(m => m.id === op.member_id)
    const memberName = member?.name || 'Desconocido'
    const amount = op.total_amount || 0

    if (grouped.has(op.member_id)) {
      const existing = grouped.get(op.member_id)!
      existing.amount += amount
    } else {
      grouped.set(op.member_id, { memberName, amount })
    }
  })

  return Array.from(grouped.values()).sort((a, b) => b.amount - a.amount)
})
</script>
