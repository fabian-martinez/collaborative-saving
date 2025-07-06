<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold">Reunión Activa</h1>
    <p class="mb-4">Esta es la interfaz para registrar las transacciones de los socios durante la reunión en curso.</p>

    <div class="form-control w-full max-w-xs">
      <label class="label">
        <span class="label-text">Seleccione un socio</span>
      </label>
      <select v-model="selectedMember" class="select select-bordered">
        <option disabled selected>¿Quién está pagando?</option>
        <option v-for="member in members" :key="member.id" :value="member.id">
          {{ member.name }}
        </option>
      </select>
    </div>

    <div v-if="loadingDues" class="mt-4 text-center">
      <span class="loading loading-spinner"></span>
      <p>Cargando deudas...</p>
    </div>

    <form v-if="transactionPayments.length > 0 && !loadingDues" @submit.prevent="handleRecordTransaction" class="mt-6">
      <h2 class="text-xl font-bold mb-2">Registrar Pago</h2>
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Descripción</th>
              <th class="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(due, index) in transactionPayments" :key="index">
              <td>{{ due.description }}</td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  v-model.number="due.amount"
                  class="input input-bordered input-sm w-full max-w-xs text-right"
                />
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th class="text-right">Total</th>
              <th class="text-right text-lg">{{ totalAmount.toFixed(2) }}</th>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="mt-6 text-right">
        <button type="submit" class="btn btn-primary" :disabled="loadingTransaction">Registrar Pago</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { membersService } from '@/features/members/services/membersService'
import { meetingsService } from '@/features/meetings/services/meetings'
import type { Member } from '@/features/members/types'
import type { Payment } from '@/features/meetings/types'

const members = ref<Member[]>([])
const selectedMember = ref<string | null>(null)
const memberDues = ref<Payment[]>([])
const transactionPayments = ref<Payment[]>([])
const loadingDues = ref(false)
const loadingTransaction = ref(false)

async function fetchMembers() {
  try {
    members.value = await membersService.getMembers()
  } catch (error) {
    console.error('Error fetching members:', error)
  }
}

async function fetchMemberDues(memberId: string) {
  if (!memberId) {
    memberDues.value = []
    return
  }
  try {
    loadingDues.value = true
    memberDues.value = await meetingsService.getActiveMeetingMemberDues(memberId)
  } catch (error) {
    console.error('Error fetching member dues:', error)
    memberDues.value = []
  } finally {
    loadingDues.value = false
  }
}

onMounted(() => {
  fetchMembers()
})

watch(selectedMember, (newMemberId) => {
  if (newMemberId) {
    fetchMemberDues(newMemberId)
  } else {
    memberDues.value = []
  }
})

watch(memberDues, (newDues) => {
  // Deep copy to allow editing without affecting the original calculated dues
  transactionPayments.value = JSON.parse(JSON.stringify(newDues))
})

const totalAmount = computed(() => {
  return transactionPayments.value.reduce((sum, due) => sum + Number(due.amount), 0)
})

async function handleRecordTransaction() {
  if (!selectedMember.value) {
    alert('Por favor, seleccione un socio.')
    return
  }

  try {
    loadingTransaction.value = true
    await meetingsService.recordMeetingTransactions({
      memberId: selectedMember.value,
      payments: transactionPayments.value,
    })
    alert(`Registrando pago por un total de: ${totalAmount.value.toFixed(2)}`)
    // Reset form
    selectedMember.value = null
    memberDues.value = []
  } catch (error) {
    console.error('Error recording transaction', error)
    alert('Failed to record transaction.')
  } finally {
    loadingTransaction.value = false
  }
}
</script>

<style scoped>
/* Estilos específicos para esta vista si son necesarios */
</style> 