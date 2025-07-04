<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import type { Session } from '@supabase/supabase-js'

const props = defineProps<{ session: Session }>()

const loading = ref(true)
const username = ref('')

async function getProfile() {
  try {
    loading.value = true
    const { user } = props.session

    const { data, error, status } = await supabase
      .from('members')
      .select(`name`)
      .eq('id', user.id)
      .single()

    if (error && status !== 406) throw error

    if (data) {
      username.value = data.name
    }
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message)
    }
  } finally {
    loading.value = false
  }
}

async function updateProfile() {
  try {
    loading.value = true
    const { user } = props.session

    const updates = {
      name: username.value,
      updated_at: new Date(),
    }

    const { error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error
    alert('Profile updated successfully!')
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message)
    }
  } finally {
    loading.value = false
  }
}

async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) console.error('Error signing out:', error)
}

onMounted(() => {
  getProfile()
})
</script>

<template>
  <div class="card w-96 bg-base-100 shadow-xl mx-auto">
    <div class="card-body">
      <h2 class="card-title">My Account</h2>
      <form @submit.prevent="updateProfile">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Email</span>
          </label>
          <input type="text" :value="session.user.email" disabled class="input input-bordered" />
        </div>
        <div class="form-control">
          <label class="label" for="username">
            <span class="label-text">Name</span>
          </label>
          <input id="username" type="text" v-model="username" class="input input-bordered" />
        </div>

        <div class="form-control mt-6">
          <button class="btn btn-primary" :disabled="loading">
             <span v-if="loading" class="loading loading-spinner"></span>
            Update Profile
          </button>
        </div>
      </form>
    </div>
  </div>
</template> 