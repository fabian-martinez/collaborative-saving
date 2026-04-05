<template>
  <div class="card bg-base-100 shadow-lg rounded-lg">
    <div class="card-body p-4 md:p-6">
      <h3 class="text-lg font-semibold mb-4">Socios</h3>
      <div class="space-y-2">
        <div
          v-for="member in members"
          :key="member.id"
          @click="$emit('select-member', member)"
          :class="[
            'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
            isSelected(member.id)
              ? 'bg-primary/10 border-2 border-primary'
            : isMemberPaid(member.id)
              ? 'bg-base-200/50 cursor-not-allowed'
              : 'hover:bg-base-200 border-2 border-transparent'
          ]"
        >
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            :class="{ 'opacity-50': isMemberPaid(member.id) }"
            :style="{ backgroundColor: getMemberColor(member.id) }"
          >
            {{ getInitials(member.name) }}
          </div>
          <div class="flex-1 min-w-0">
            <p
              class="font-medium text-xs md:text-sm wrap-break-word line-clamp-2 leading-tight"
              :class="
                isSelected(member.id)
                  ? 'text-primary'
                  : isMemberPaid(member.id)
                  ? 'text-base-content/50'
                  : 'text-base-content'
              "
            >
              {{ member.name }}
            </p>
          </div>
          <div v-if="isMemberPaid(member.id)" class="shrink-0">
            <span class="badge badge-success badge-sm">
              <span class="hidden md:inline">Pagado</span>
            </span>
          </div>
          <div v-else-if="hasPendingPurchase && hasPendingPurchase(member.id)" class="shrink-0">
            <span class="badge badge-warning badge-sm">
              <span class="hidden md:inline">Pendiente</span>
            </span>
          </div>
          <div v-else-if="hasCompletedPurchase && hasCompletedPurchase(member.id)" class="shrink-0">
            <span class="badge badge-success badge-sm">
              <span class="hidden md:inline">Con compras</span>
            </span>
          </div>
          <div v-else-if="hasDisbursement && hasDisbursement(member.id)" class="shrink-0">
            <span class="badge badge-info badge-sm">
              <span class="hidden md:inline">Con desembolsos</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Member } from '@/api/members.api'

// Props
const props = defineProps<{
  members: Member[]
  selectedMember: Member | null
  isMemberPaid: (memberId: string) => boolean
  getInitials: (name: string) => string
  getMemberColor: (memberId: string) => string
  hasPendingPurchase?: (memberId: string) => boolean
  hasCompletedPurchase?: (memberId: string) => boolean
  hasDisbursement?: (memberId: string) => boolean
}>()

// Usar ref para el ID seleccionado para mejor compatibilidad con Safari
// Safari puede tener problemas con computed que dependen de props de objetos
const selectedMemberId = ref<string | null>(props.selectedMember?.id || null)

// Watch el prop selectedMember para actualizar el ID (necesario para Safari)
watch(
  () => props.selectedMember?.id,
  (newId) => {
    selectedMemberId.value = newId || null
  },
  { immediate: true }
)

// Función helper para verificar si un miembro está seleccionado
// Comparación directa de strings primitivos (más confiable en Safari)
const isSelected = (memberId: string): boolean => {
  return selectedMemberId.value === memberId
}

// Emits
const emit = defineEmits<{
  'select-member': [member: Member]
}>()
</script>
