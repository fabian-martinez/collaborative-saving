<script setup lang="ts">
import { computed } from 'vue'
import { 
  PiggyBank, 
  Bank, 
  Wallet, 
  UserCircle,
  ArrowRight,
  ArrowLeft
} from 'iconoir-vue/regular'

const props = defineProps<{
  type: string
  description: string
  amount: number
  timestamp: string
  memberName?: string
}>()

const icon = computed(() => {
  switch (props.type) {
    case 'MANDATORY_CONTRIBUTION':
      return PiggyBank
    case 'LOAN_DISBURSEMENT':
      return Bank
    case 'LOAN_PAYMENT':
      return Wallet
    case 'MEMBER_REGISTRATION':
      return UserCircle
    default:
      return UserCircle
  }
})

const amountColor = computed(() => {
  if (props.amount === 0) return 'text-base-content/60'
  return props.amount > 0 ? 'text-success' : 'text-error'
})

const formattedAmount = computed(() => {
  if (props.amount === 0) return ''
  const sign = props.amount > 0 ? '+' : ''
  return `${sign}${formatCurrency(Math.abs(props.amount))}`
})

const relativeTime = computed(() => {
  const now = new Date()
  const time = new Date(props.timestamp)
  const diffMs = now.getTime() - time.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return diffMins <= 1 ? 'Hace un momento' : `Hace ${diffMins} minutos`
  } else if (diffHours < 24) {
    return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`
  } else if (diffDays === 1) {
    return 'Ayer'
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`
  } else {
    return time.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
</script>

<template>
  <div class="flex items-start gap-3 p-3 hover:bg-base-200 rounded-lg transition-colors">
    <div class="flex-shrink-0 mt-1">
      <component :is="icon" class="w-5 h-5 text-primary" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium">{{ description }}</p>
      <p v-if="memberName" class="text-xs text-base-content/60 mt-1">{{ memberName }}</p>
    </div>
    <div class="flex flex-col items-end flex-shrink-0">
      <p v-if="formattedAmount" :class="['text-sm font-semibold', amountColor]">
        {{ formattedAmount }}
      </p>
      <p class="text-xs text-base-content/60 mt-1">{{ relativeTime }}</p>
    </div>
  </div>
</template>

