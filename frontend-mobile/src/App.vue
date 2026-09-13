<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from '@/layouts/AppLayout.vue';

const route = useRoute();
const currentLayout = computed(() => route.meta.layout || AppLayout);
</script>

<template>
  <component :is="currentLayout">
    <router-view />
  </component>
</template>
