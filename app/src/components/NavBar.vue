<script setup lang="ts">
import { useUserStore } from '../stores/user'
import { supabase } from '../supabase'

const userStore = useUserStore()

async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) console.error('Error signing out:', error)
}
</script>

<template>
  <div class="navbar bg-base-100 shadow-lg mb-8">
    <div class="flex-1">
      <a class="btn btn-ghost text-xl">Collaborative Saving</a>
    </div>
    <div class="flex-none">
      <ul class="menu menu-horizontal px-1">
        <li v-if="userStore.role === 'admin'">
          <router-link to="/admin/contributions">Admin</router-link>
        </li>
        <li><router-link to="/">My Account</router-link></li>
        <li>
          <a @click="signOut">Logout</a>
        </li>
      </ul>
    </div>
  </div>
</template> 