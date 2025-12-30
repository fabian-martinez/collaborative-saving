<template>
  <div class="join flex justify-center" v-if="totalPages > 1">
    <button
      @click="$emit('page-change', page - 1)"
      :disabled="page === 1"
      class="join-item btn"
    >
      Anterior
    </button>
    <span class="join-item btn btn-disabled">
      Página {{ page }} de {{ totalPages }} ({{ startIndex }}-{{ endIndex }} de {{ total }})
    </span>
    <button
      @click="$emit('page-change', page + 1)"
      :disabled="page === totalPages"
      class="join-item btn"
    >
      Siguiente
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  page: number
  totalPages: number
  total: number
  startIndex: number
  endIndex: number
}>()

defineEmits<{
  'page-change': [page: number]
}>()
</script>

