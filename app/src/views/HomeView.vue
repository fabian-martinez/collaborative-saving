<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import type { Session } from '@supabase/supabase-js'
import Auth from '../components/Auth.vue'
// We will create the Account component next
import Account from '../components/Account.vue'

const session = ref<Session | null>(null)

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
  })

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session
  })
})
</script>

<template>
  <div class="container mx-auto pt-12 pb-24">
    <Account v-if="session" :session="session" />
    <Auth v-else />
  </div>
</template>
