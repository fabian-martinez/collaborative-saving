<!--
  Copyright 2026 Collaborative Saving Project.
  All rights reserved.
-->

<template>
  <Transition name="fade">
    <div
      v-if="serverStatus.shouldShowOverlay"
      class="fixed inset-0 bg-base-100/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="server-loading-title"
      aria-describedby="server-loading-desc"
      @click.stop.prevent
      @keydown.stop
    >
      <div
        class="card bg-base-100/90 shadow-2xl border border-base-content/10 p-6 max-w-md w-full text-center overscroll-contain animate-fade-in"
        @click.stop
      >
        <div class="flex flex-col items-center gap-4">
          <span
            v-if="!serverStatus.isRetrying"
            class="loading loading-spinner loading-lg text-primary"
            aria-hidden="true"
          ></span>
          <span
            v-else
            class="loading loading-spinner loading-lg text-secondary"
            aria-hidden="true"
          ></span>

          <div class="space-y-1">
            <h3 id="server-loading-title" class="text-lg font-semibold text-base-content">
              {{
                serverStatus.isTimeout
                  ? 'El servidor está tardando más de lo esperado'
                  : 'Conectando con el servidor en la nube...'
              }}
            </h3>

            <p id="server-loading-desc" class="text-sm text-base-content/70">
              <template v-if="serverStatus.isRetrying">
                Comprobando estado del servidor para reconectar...
              </template>
              <template v-else-if="serverStatus.isTimeout">
                El contenedor en la nube puede estar iniciando desde reposo (cold start) o la conexión es inestable.
              </template>
              <template v-else>
                Por favor espera un momento. Esto puede demorar unos segundos si el servicio estaba en reposo.
              </template>
            </p>
          </div>

          <div
            v-if="serverStatus.isTimeout"
            class="flex items-center justify-center gap-3 mt-3 w-full"
          >
            <button
              type="button"
              class="btn btn-primary btn-sm min-w-28"
              :disabled="serverStatus.isRetrying"
              @click="handleRetry"
            >
              <span
                v-if="serverStatus.isRetrying"
                class="loading loading-spinner loading-xs mr-1"
              ></span>
              {{ serverStatus.isRetrying ? 'Reintentando...' : 'Reintentar' }}
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              :disabled="serverStatus.isRetrying"
              @click="handleDismiss"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useServerStatusStore } from '@/shared/stores/serverStatus'

const serverStatus = useServerStatusStore()

function handleRetry(): void {
  serverStatus.retry()
}

function handleDismiss(): void {
  serverStatus.dismiss()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeInCard {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeInCard 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
