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

    <form v-if="transactionDues.length > 0 && !loadingDues" @submit.prevent="handleRecordTransaction" class="mt-6">
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
            <tr v-for="due in transactionDues" :key="due.description">
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
        <button type="submit" class="btn btn-primary">Registrar Pago</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { supabase } from '@/supabase'

interface Member {
  id: string
  name: string
}

interface Due {
  type: 'mandatory_contribution' | 'stock_fee' | 'loan_payment'
  description: string
  amount: number
}

const members = ref<Member[]>([])
const selectedMember = ref<string | null>(null)
const memberDues = ref<Due[]>([])
const transactionDues = ref<Due[]>([])
const loadingDues = ref(false)

async function fetchMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching members:', error)
  } else {
    members.value = data
  }
}

async function fetchMemberDues(memberId: string) {
  if (!memberId) {
    memberDues.value = []
    return
  }
  try {
    loadingDues.value = true
    const { data, error } = await supabase.rpc('get_member_dues', {
      p_member_id: memberId,
    })

    if (error) throw error

    // La función podría devolver un JSON, hay que asegurarse que se parsea correctamente.
    // O podría devolver un array de records. Asumimos lo segundo por ahora.
    memberDues.value = data
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
  transactionDues.value = JSON.parse(JSON.stringify(newDues))
})

const totalAmount = computed(() => {
  return transactionDues.value.reduce((sum, due) => sum + Number(due.amount), 0)
})

function handleRecordTransaction() {
  if (!selectedMember.value) {
    alert('Por favor, seleccione un socio.')
    return
  }
  
  // Lógica para llamar a `record_meeting_transactions` en el Flujo 5
  console.log('Registrando transacción para:', selectedMember.value)
  console.log('Detalles:', transactionDues.value)
  alert(`Registrando pago por un total de: ${totalAmount.value.toFixed(2)}`)
}
</script>

<style scoped>
/* Estilos específicos para esta vista si son necesarios */
</style> 