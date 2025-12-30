<script setup lang="ts">
import { ref } from 'vue'
import { Search, Bell, UserCircle } from 'iconoir-vue/regular'

const searchQuery = ref('')
const notifications = ref(0) // Mock - esto vendrá del store después
const userInitials = ref('AD') // Mock - esto vendrá del store después
</script>

<template>
  <header class="bg-base-100 shadow-md p-4 fixed top-0 right-0 left-72 z-10">
    <div class="flex items-center justify-between">
      <!-- Search Bar -->
      <div class="flex-1 max-w-md">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar..."
            class="input input-bordered w-full pl-10"
          />
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

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
          <div class="bg-primary text-primary-content rounded-full w-10">
            <span class="text-sm font-semibold">{{ userInitials }}</span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

