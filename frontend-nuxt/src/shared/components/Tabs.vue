<template>
  <div class="tabs-container w-full max-w-full min-w-0">
    <div 
      class="tabs tabs-boxed w-full max-w-full min-w-0 mb-4" 
      :class="{ 'tabs-scrollable': scrollable }"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { 'tab-active': activeTab === tab.id }]"
        :disabled="tab.disabled"
        @click="!tab.disabled && selectTab(tab.id)"
      >
        <slot :name="`tab-${tab.id}`" :tab="tab">
          {{ tab.label }}
        </slot>
        <span v-if="tab.badge" class="badge badge-sm badge-primary ml-2">{{ tab.badge }}</span>
      </button>
    </div>
    <div class="tab-content-wrapper w-full max-w-full min-w-0 overflow-x-hidden">
      <div class="tab-content w-full max-w-full min-w-0">
        <slot :name="`content-${activeTab}`"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

export interface Tab {
  id: string
  label: string
  badge?: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    tabs: Tab[]
    modelValue?: string
    scrollable?: boolean
    lazy?: boolean
  }>(),
  {
    scrollable: false,
    lazy: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const activeTab = ref<string>(props.modelValue || props.tabs[0]?.id || '')

function selectTab(tabId: string) {
  if (tabId && props.tabs.find(t => t.id === tabId)) {
    activeTab.value = tabId
    emit('update:modelValue', tabId)
  }
}

onMounted(() => {
  if (props.modelValue) {
    activeTab.value = props.modelValue
  } else if (props.tabs.length > 0 && !activeTab.value) {
    activeTab.value = props.tabs[0].id
    emit('update:modelValue', props.tabs[0].id)
  }
})

watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== activeTab.value) {
    activeTab.value = newValue
  }
}, { flush: 'sync' })

watch(() => props.tabs, (newTabs) => {
  if (newTabs.length > 0 && (!activeTab.value || !newTabs.find(t => t.id === activeTab.value))) {
    activeTab.value = newTabs[0].id
    emit('update:modelValue', newTabs[0].id)
  }
}, { deep: true, flush: 'sync' })

defineExpose({
  selectTab,
  activeTab: computed(() => activeTab.value)
})
</script>

<style scoped>
.tabs-container {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.tabs-scrollable {
  overflow-x: auto;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.tabs-scrollable::-webkit-scrollbar {
  height: 4px;
}

.tabs-scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.tabs-scrollable::-webkit-scrollbar-thumb {
  background: hsl(var(--bc) / 0.3);
  border-radius: 2px;
}

.tab-content-wrapper {
  min-height: 200px;
}

.tab-content {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}
</style>
