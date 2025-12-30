<template>
  <div class="pagination" v-if="totalPages > 1">
    <button
      @click="$emit('page-change', page - 1)"
      :disabled="page === 1"
      class="pagination-button"
    >
      Anterior
    </button>
    <span class="pagination-info">
      Página {{ page }} de {{ totalPages }} ({{ startIndex }}-{{ endIndex }} de {{ total }})
    </span>
    <button
      @click="$emit('page-change', page + 1)"
      :disabled="page === totalPages"
      class="pagination-button"
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

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.pagination-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: #3498db;
  color: white;
  border: none;
  cursor: pointer;
}

.pagination-button:hover:not(:disabled) {
  background-color: #2980b9;
}

.pagination-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.pagination-info {
  color: #666;
}
</style>

