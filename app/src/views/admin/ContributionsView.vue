<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase'
import NavBar from '@/components/NavBar.vue'

interface Member {
  id: string
  name: string
}

const members = ref<Member[]>([])
const selectedMember = ref<string | null>(null)
const amount = ref<number | null>(null)
const loading = ref(false)

async function getMembers() {
  try {
    const { data, error } = await supabase.from('members').select('id, name').order('name')
    if (error) throw error
    members.value = data
  } catch (err) {
    console.error('Error fetching members:', err)
  }
}

async function handleAddContribution() {
  if (!selectedMember.value || !amount.value) {
    alert('Please select a member and enter an amount.')
    return
  }

  try {
    loading.value = true
    const { error } = await supabase.rpc('add_contribution', {
      p_member_id: selectedMember.value,
      p_amount: amount.value,
    })

    if (error) throw error
    alert('Contribution added successfully!')
    selectedMember.value = null
    amount.value = null
  } catch (err) {
    if (err instanceof Error) {
      alert(err.message)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getMembers()
})
</script>

<template>
  <div>
    <NavBar />
    <div class="container mx-auto pt-12 pb-24">
      <h1 class="text-3xl font-bold mb-6">Add Contribution</h1>
      <div class="card w-full max-w-lg bg-base-100 shadow-xl">
        <div class="card-body">
          <form @submit.prevent="handleAddContribution">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Select Member</span>
              </label>
              <select v-model="selectedMember" class="select select-bordered" required>
                <option disabled :value="null">-- Please select a member --</option>
                <option v-for="member in members" :key="member.id" :value="member.id">
                  {{ member.name }}
                </option>
              </select>
            </div>
            <div class="form-control mt-4">
              <label class="label">
                <span class="label-text">Amount</span>
              </label>
              <input
                v-model.number="amount"
                type="number"
                placeholder="0.00"
                class="input input-bordered"
                required
              />
            </div>
            <div class="form-control mt-6">
              <button class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="loading loading-spinner"></span>
                Add Contribution
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template> 