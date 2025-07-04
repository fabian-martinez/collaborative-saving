<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../supabase'

const loading = ref(false)
const email = ref('')

const handleLogin = async () => {
  try {
    loading.value = true
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
    })
    if (error) throw error
    alert('Check your email for the login link!')
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex justify-center items-center h-screen">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h1 class="card-title">Collaborative Saving</h1>
        <p>Sign in via magic link with your email below</p>
        <form @submit.prevent="handleLogin">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Email</span>
            </label>
            <input
              v-model="email"
              type="email"
              placeholder="Your email"
              class="input input-bordered"
              required
            />
          </div>
          <div class="form-control mt-6">
            <button class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner"></span>
              Send Magic Link
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template> 