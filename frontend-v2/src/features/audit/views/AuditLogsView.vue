<!--
  Copyright 2026 Collaborative Saving Project.
  All rights reserved.
-->
<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Registro de Auditoría</h1>
        <p class="text-base-content/70 mt-1">
          Historial inmutable de anulaciones, revalorizaciones y eventos administrativos sensibles.
        </p>
      </div>
      <button
        type="button"
        class="btn btn-outline btn-sm gap-2 self-start sm:self-auto"
        :disabled="loading"
        @click="fetchLogs"
      >
        <Refresh class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        Actualizar
      </button>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text text-xs font-medium">Tipo de Evento</span>
            </label>
            <select
              v-model="filters.event_type"
              class="select select-bordered select-sm w-full"
              @change="applyFilters"
            >
              <option value="">Todos los eventos</option>
              <option value="OPERATION_DELETED">Operación Anulada</option>
              <option value="REVALUATION_UNDONE">Revalorización Anulada</option>
              <option value="MEETING_CLOSED">Reunión Cerrada</option>
              <option value="LOAN_UPDATED">Préstamo Actualizado</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label py-1">
              <span class="label-text text-xs font-medium">Entidad</span>
            </label>
            <select
              v-model="filters.entity_type"
              class="select select-bordered select-sm w-full"
              @change="applyFilters"
            >
              <option value="">Todas las entidades</option>
              <option value="operation">Operación</option>
              <option value="meeting">Reunión</option>
              <option value="loan">Préstamo</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label py-1">
              <span class="label-text text-xs font-medium">ID de Reunión (UUID)</span>
            </label>
            <input
              v-model.trim="filters.meeting_id"
              type="text"
              placeholder="Filtrar por meeting_id..."
              class="input input-bordered input-sm w-full"
              @keyup.enter="applyFilters"
            />
          </div>

          <div class="form-control flex flex-row items-end gap-2">
            <button
              type="button"
              class="btn btn-primary btn-sm flex-1"
              @click="applyFilters"
            >
              Filtrar
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              @click="resetFilters"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="errorMessage" class="alert alert-error shadow-sm">
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Table Card -->
    <div class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
      <div v-if="loading" class="p-12 flex justify-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else-if="logs.length === 0" class="p-12 text-center space-y-2">
        <p class="text-base font-medium text-base-content/70">
          No hay registros de auditoría que coincidan con los filtros.
        </p>
        <p class="text-sm text-base-content/50">
          Los eventos administrativos sensibles aparecerán aquí automáticamente.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="table table-zebra table-sm">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Evento</th>
              <th>Entidad</th>
              <th>Usuario</th>
              <th>Motivo</th>
              <th class="text-right">Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="whitespace-nowrap text-xs">
                {{ formatDateTime(log.created_at) }}
              </td>
              <td>
                <span class="badge badge-sm font-medium" :class="eventBadgeClass(log.event_type)">
                  {{ eventLabel(log.event_type) }}
                </span>
              </td>
              <td class="text-xs">
                <div class="font-medium">{{ log.entity_type }}</div>
                <div class="font-mono text-[11px] text-base-content/60 truncate max-w-[140px]" :title="log.entity_id">
                  {{ log.entity_id }}
                </div>
              </td>
              <td class="text-xs">
                <div>{{ log.user_email || 'Sistema' }}</div>
                <div v-if="log.user_role" class="text-[11px] text-base-content/60 uppercase">
                  {{ log.user_role }}
                </div>
              </td>
              <td class="text-xs max-w-xs truncate" :title="log.reason || ''">
                {{ log.reason || '—' }}
              </td>
              <td class="text-right">
                <button
                  type="button"
                  class="btn btn-ghost btn-xs gap-1"
                  @click="openDetail(log)"
                >
                  <Eye class="w-4 h-4" />
                  Ver
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="!loading && pagination.totalPages > 1"
        class="flex items-center justify-between px-4 py-3 border-t border-base-200 bg-base-100 text-sm"
      >
        <span class="text-base-content/70 text-xs">
          Mostrando página {{ pagination.page }} de {{ pagination.totalPages }} ({{ pagination.total }} registros)
        </span>
        <div class="join">
          <button
            type="button"
            class="join-item btn btn-xs"
            :disabled="pagination.page <= 1"
            @click="changePage(pagination.page - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            class="join-item btn btn-xs"
            :disabled="pagination.page >= pagination.totalPages"
            @click="changePage(pagination.page + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Snapshot Detail Modal -->
    <dialog class="modal" :class="{ 'modal-open': !!selectedLog }">
      <div v-if="selectedLog" class="modal-box max-w-3xl">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 class="font-bold text-lg">Detalle de Auditoría</h3>
            <p class="text-xs text-base-content/60 mt-0.5">
              {{ eventLabel(selectedLog.event_type) }} · {{ formatDateTime(selectedLog.created_at) }}
            </p>
          </div>
          <button type="button" class="btn btn-sm btn-circle btn-ghost" @click="selectedLog = null">
            ✕
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4 bg-base-200/60 p-3 rounded-lg">
          <div>
            <span class="font-semibold">Entidad:</span>
            {{ selectedLog.entity_type }} ({{ selectedLog.entity_id }})
          </div>
          <div>
            <span class="font-semibold">Reunión:</span>
            {{ selectedLog.meeting_id || 'N/A' }}
          </div>
          <div>
            <span class="font-semibold">Usuario:</span>
            {{ selectedLog.user_email || 'Sistema' }} ({{ selectedLog.user_role || 'N/A' }})
          </div>
          <div>
            <span class="font-semibold">Motivo:</span>
            {{ selectedLog.reason || 'Sin motivo registrado' }}
          </div>
        </div>

        <div class="space-y-1">
          <div class="text-xs font-semibold text-base-content/70">Snapshot JSON (details)</div>
          <pre class="bg-base-300 p-3 rounded-lg text-xs overflow-x-auto max-h-80">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-sm" @click="selectedLog = null">Cerrar</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="selectedLog = null">
        <button type="button">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Eye, Refresh } from 'iconoir-vue/regular'
import { auditApi, type AuditEventType, type AuditLogItem } from '@/api/audit.api'

const logs = ref<AuditLogItem[]>([])
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const selectedLog = ref<AuditLogItem | null>(null)

const filters = reactive<{
  event_type: AuditEventType | ''
  entity_type: string
  meeting_id: string
}>({
  event_type: '',
  entity_type: '',
  meeting_id: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

async function fetchLogs() {
  loading.value = true
  errorMessage.value = null
  try {
    const response = await auditApi.getAuditLogs({
      event_type: filters.event_type || undefined,
      entity_type: filters.entity_type || undefined,
      meeting_id: filters.meeting_id || undefined,
      page: pagination.page,
      limit: pagination.limit
    })
    logs.value = response.data
    pagination.page = response.pagination.page
    pagination.limit = response.pagination.limit
    pagination.total = response.pagination.total
    pagination.totalPages = response.pagination.totalPages
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Error al cargar los registros de auditoría'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  pagination.page = 1
  fetchLogs()
}

function resetFilters() {
  filters.event_type = ''
  filters.entity_type = ''
  filters.meeting_id = ''
  pagination.page = 1
  fetchLogs()
}

function changePage(newPage: number) {
  pagination.page = newPage
  fetchLogs()
}

function openDetail(log: AuditLogItem) {
  selectedLog.value = log
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function eventLabel(eventType: AuditEventType): string {
  const labels: Record<AuditEventType, string> = {
    OPERATION_DELETED: 'Operación Anulada',
    REVALUATION_UNDONE: 'Revalorización Anulada',
    MEETING_CLOSED: 'Reunión Cerrada',
    LOAN_UPDATED: 'Préstamo Actualizado'
  }
  return labels[eventType] ?? eventType
}

function eventBadgeClass(eventType: AuditEventType): string {
  const classes: Record<AuditEventType, string> = {
    OPERATION_DELETED: 'badge-error badge-outline',
    REVALUATION_UNDONE: 'badge-warning badge-outline',
    MEETING_CLOSED: 'badge-info badge-outline',
    LOAN_UPDATED: 'badge-neutral badge-outline'
  }
  return classes[eventType] ?? 'badge-ghost'
}

onMounted(() => {
  fetchLogs()
})
</script>
