<template>
  <div class="overflow-x-auto">
    <table class="table table-zebra w-full">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">
            {{ column.label }}
          </th>
          <th v-if="actions" class="text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in data" :key="getRowKey(item, index)">
          <td v-for="column in columns" :key="column.key">
            <slot :name="`cell-${column.key}`" :item="item" :value="getValue(item, column.key)">
              {{ formatValue(getValue(item, column.key), column.format) }}
            </slot>
          </td>
          <td v-if="actions" class="text-center">
            <slot name="actions" :item="item" :index="index"></slot>
          </td>
        </tr>
        <tr v-if="data.length === 0">
          <td :colspan="columns.length + (actions ? 1 : 0)" class="text-center text-base-content/60 py-8">
            {{ emptyMessage }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts" generic="T">
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/shared/utils/formatters'

export interface Column {
  key: string
  label: string
  format?: 'currency' | 'date' | 'datetime' | 'number' | 'percentage'
}

const props = defineProps<{
  data: T[]
  columns: Column[]
  actions?: boolean
  emptyMessage?: string
  rowKey?: string | ((item: T) => string)
}>()

function getRowKey(item: T, index: number): string {
  if (props.rowKey) {
    if (typeof props.rowKey === 'function') {
      return props.rowKey(item)
    }
    return String((item as any)[props.rowKey] || index)
  }
  return String(index)
}

function getValue(item: T, key: string): unknown {
  return (item as any)[key]
}

function formatValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '-'
  
  switch (format) {
    case 'currency':
      return formatCurrency(Number(value))
    case 'date':
      return formatDate(String(value))
    case 'datetime':
      return formatDateTime(String(value))
    case 'number':
      return formatNumber(Number(value))
    case 'percentage':
      return `${formatNumber(Number(value) * 100)}%`
    default:
      return String(value)
  }
}
</script>

<style scoped>
.data-table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  text-align: left;
  padding: 0.75rem;
  border-bottom: 2px solid #ddd;
}

.data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.data-table tbody tr:hover {
  background-color: #f8f9fa;
}

.actions-column {
  width: 120px;
  text-align: center;
}

.actions-cell {
  text-align: center;
}

.empty-message {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>

