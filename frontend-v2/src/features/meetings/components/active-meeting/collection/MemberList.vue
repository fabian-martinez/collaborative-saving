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
            selectedMember && selectedMember.id === member.id
              ? 'bg-primary/10 border-2 border-primary'
              : isMemberPaid(member.id)
              ? 'bg-base-200/50 cursor-not-allowed opacity-60'
              : 'hover:bg-base-200 border-2 border-transparent'
          ]"
        >
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            :style="{ backgroundColor: getMemberColor(member.id) }"
          >
            {{ getInitials(member.name) }}
          </div>
          <div class="flex-1 min-w-0">
            <p
              class="font-medium text-xs md:text-sm wrap-break-word line-clamp-2 leading-tight"
              :class="
                selectedMember && selectedMember.id === member.id
                  ? 'text-primary'
                  : 'text-base-content'
              "
            >
              {{ member.name }}
            </p>
          </div>
          <div v-if="isMemberPaid(member.id)" class="shrink-0">
            <span class="badge badge-success badge-sm">Pagado</span>
          </div>
          <div v-else-if="hasPendingPurchase && hasPendingPurchase(member.id)" class="shrink-0">
            <span class="badge badge-warning badge-sm">Pendiente</span>
          </div>
          <div v-else-if="hasCompletedPurchase && hasCompletedPurchase(member.id)" class="shrink-0">
            <span class="badge badge-success badge-sm">Con compras</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
}>()

// Emits
const emit = defineEmits<{
  'select-member': [member: Member]
}>()
</script>

