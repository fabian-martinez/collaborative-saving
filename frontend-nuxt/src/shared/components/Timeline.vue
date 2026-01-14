<template>
  <div class="timeline-container">
    <div v-for="(item, index) in items" :key="getItemKey(item, index)" class="timeline-item">
      <div class="timeline-marker" :class="getMarkerClass(item)">
        <slot name="marker" :item="item" :index="index">
          <div class="marker-dot"></div>
        </slot>
      </div>
      <div class="timeline-content">
        <div class="timeline-header">
          <slot name="header" :item="item" :index="index">
            <div class="timeline-title">{{ getItemTitle(item) }}</div>
            <div class="timeline-date">{{ formatDate(getItemDate(item)) }}</div>
          </slot>
        </div>
        <div class="timeline-body">
          <slot name="body" :item="item" :index="index">
            <div class="timeline-description">{{ getItemDescription(item) }}</div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/shared/utils/formatters'

export interface TimelineItem {
  id?: string
  date: string | Date
  title?: string
  description?: string
  status?: 'completed' | 'pending' | 'overdue' | 'upcoming'
  type?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    items: TimelineItem[]
    itemKey?: string | ((item: TimelineItem, index: number) => string)
    itemTitle?: string | ((item: TimelineItem) => string)
    itemDescription?: string | ((item: TimelineItem) => string)
    itemDate?: string | ((item: TimelineItem) => string | Date)
    dateField?: string
    titleField?: string
    descriptionField?: string
    statusField?: string
  }>(),
  {
    dateField: 'date',
    titleField: 'title',
    descriptionField: 'description',
    statusField: 'status'
  }
)

function getItemKey(item: TimelineItem, index: number): string {
  if (props.itemKey) {
    if (typeof props.itemKey === 'function') {
      return props.itemKey(item, index)
    }
    return String(item[props.itemKey] || index)
  }
  return String(item.id || index)
}

function getItemTitle(item: TimelineItem): string {
  if (props.itemTitle) {
    if (typeof props.itemTitle === 'function') {
      return props.itemTitle(item)
    }
    return String(item[props.itemTitle] || '')
  }
  return String(item[props.titleField] || '')
}

function getItemDescription(item: TimelineItem): string {
  if (props.itemDescription) {
    if (typeof props.itemDescription === 'function') {
      return props.itemDescription(item)
    }
    return String(item[props.itemDescription] || '')
  }
  return String(item[props.descriptionField] || '')
}

function getItemDate(item: TimelineItem): string | Date {
  if (props.itemDate) {
    if (typeof props.itemDate === 'function') {
      return props.itemDate(item)
    }
    return item[props.itemDate] as string | Date
  }
  return item[props.dateField] as string | Date
}

function getMarkerClass(item: TimelineItem): string {
  const status = item[props.statusField] as string || item.status || 'pending'
  return `marker-${status}`
}
</script>

<style scoped>
.timeline-container {
  position: relative;
  padding-left: 2rem;
}

.timeline-item {
  position: relative;
  padding-bottom: 2rem;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: -1.5rem;
  top: 1.5rem;
  bottom: -0.5rem;
  width: 2px;
  background-color: #e5e7eb;
}

.timeline-marker {
  position: absolute;
  left: -1.875rem;
  top: 0;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  z-index: 1;
}

.marker-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: #9ca3af;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #e5e7eb;
}

.marker-completed .marker-dot {
  background-color: #27ae60;
  box-shadow: 0 0 0 2px #d1fae5;
}

.marker-pending .marker-dot {
  background-color: #f39c12;
  box-shadow: 0 0 0 2px #fef3c7;
}

.marker-overdue .marker-dot {
  background-color: #e74c3c;
  box-shadow: 0 0 0 2px #fee2e2;
}

.marker-upcoming .marker-dot {
  background-color: #3498db;
  box-shadow: 0 0 0 2px #dbeafe;
}

.timeline-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.timeline-content:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.timeline-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}

.timeline-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.timeline-body {
  color: #4b5563;
  font-size: 0.875rem;
}

.timeline-description {
  line-height: 1.5;
}
</style>

