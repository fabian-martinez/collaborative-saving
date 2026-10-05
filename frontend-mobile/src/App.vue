<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from '@/layouts/AppLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

const route = useRoute();
const currentLayout = computed(() => {
  if (route.meta.layout === 'auth' || route.meta.layout === AuthLayout) {
    return AuthLayout;
  }
  return (route.meta.layout as any) || AppLayout;
});
</script>

<template>
  <component :is="currentLayout">
    <router-view />
  </component>
</template>
