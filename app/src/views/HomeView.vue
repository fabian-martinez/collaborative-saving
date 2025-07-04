<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'
import { supabase } from '../supabase'
import type { Session } from '@supabase/supabase-js'
import { useUserStore } from '../stores/user'
import Auth from '../components/Auth.vue'
// We will create the Account component next
import Account from '../components/Account.vue'
import NavBar from '../components/NavBar.vue'

const session = ref<Session | null>(null)
const userStore = useUserStore()

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
  })

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session
  })
})

watchEffect(() => {
  if (session.value) {
    userStore.fetchRole()
  } else {
    userStore.clearRole()
  }
})
</script>

<template>
  <div v-if="session">
    <NavBar />
    <div class="container mx-auto pt-12 pb-24">
      <Account :session="session" />
    </div>
  </div>
  <Auth v-else />
</template>
