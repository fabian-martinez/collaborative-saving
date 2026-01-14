<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bell, Menu, Calendar } from 'iconoir-vue/regular'
import { useSidebar } from '@/shared/composables/useSidebar'
import { useMeetingsStore } from '@/features/meetings/stores/meetings'
import { formatDate } from '@/shared/utils/formatters'

const notifications = ref(0) // Mock - esto vendrá del store después
const userInitials = ref('AD') // Mock - esto vendrá del store después
const { isCollapsed, toggleMobile } = useSidebar()

const meetingsStore = useMeetingsStore()
const activeMeeting = computed(() => meetingsStore.activeMeeting)
const hasActiveMeeting = computed(() => activeMeeting.value !== null)
const formattedMeetingDate = computed(() => {
  if (!activeMeeting.value) return ''
  return formatDate(activeMeeting.value.date)
})
</script>

<template>
  <header
    class="bg-base-100 shadow-md p-4 fixed top-0 right-0 left-0 z-10 transition-all duration-300"
    :class="{
      'lg:left-72': !isCollapsed,
      'lg:left-20': isCollapsed
    }"
  >
    <div class="flex items-center justify-between gap-4">
      <!-- Botón hamburguesa (solo móvil) -->
      <button
        @click="toggleMobile"
        class="btn btn-ghost btn-circle lg:hidden"
      >
        <Menu class="w-6 h-6" />
      </button>

      <!-- Reunión Activa -->
      <div
        v-if="hasActiveMeeting"
        class="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg border border-primary/20"
      >
        <Calendar class="w-5 h-5" />
        <div class="flex flex-col">
          <span class="text-xs font-semibold">Reunión Activa</span>
          <span class="text-xs">{{ formattedMeetingDate }}</span>
        </div>
      </div>

      <!-- Spacer para empujar elementos a la derecha -->
      <div class="flex-1"></div>

      <!-- Right Side: Notifications and User -->
      <div class="flex items-center gap-4">
        <!-- Notifications -->
        <div class="relative">
          <button class="btn btn-ghost btn-circle">
            <Bell class="w-6 h-6" />
            <span
              v-if="notifications > 0"
              class="absolute top-0 right-0 badge badge-error badge-xs"
            >
              {{ notifications }}
            </span>
          </button>
        </div>

        <!-- User Avatar -->
        <div class="avatar placeholder">
          <div class="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center">
            <span class="text-sm font-semibold">{{ userInitials }}</span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

