<template>
  <div class="tabs-container">
    <div class="tabs-wrapper" :class="{ 'tabs-scrollable': scrollable }">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id, disabled: tab.disabled }]"
        @click="!tab.disabled && selectTab(tab.id)"
      >
        <slot :name="`tab-${tab.id}`" :tab="tab">
          {{ tab.label }}
        </slot>
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
      <div class="tab-indicator" :style="indicatorStyle"></div>
    </div>
    <div class="tab-content-wrapper">
      <Transition name="fade" mode="out-in">
        <div :key="activeTab" class="tab-content">
          <slot :name="`content-${activeTab}`">
            <slot></slot>
          </slot>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'

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

const activeTab = ref(props.modelValue || props.tabs[0]?.id || '')
const indicatorPosition = ref(0)
const indicatorWidth = ref(0)
const tabRefs = ref<Map<string, HTMLElement>>(new Map())

const indicatorStyle = computed(() => ({
  transform: `translateX(${indicatorPosition.value}px)`,
  width: `${indicatorWidth.value}px`
}))

function selectTab(tabId: string) {
  activeTab.value = tabId
  emit('update:modelValue', tabId)
  updateIndicator()
}

function updateIndicator() {
  nextTick(() => {
    const activeButton = tabRefs.value.get(activeTab.value)
    if (activeButton) {
      const wrapper = activeButton.parentElement
      if (wrapper) {
        indicatorPosition.value = activeButton.offsetLeft - wrapper.offsetLeft
        indicatorWidth.value = activeButton.offsetWidth
      }
    }
  })
}

onMounted(() => {
  updateIndicator()
})

watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== activeTab.value) {
    activeTab.value = newValue
    updateIndicator()
  }
})

watch(() => props.tabs, () => {
  updateIndicator()
}, { deep: true })

defineExpose({
  selectTab,
  activeTab: computed(() => activeTab.value)
})
</script>

<style scoped>
.tabs-container {
  width: 100%;
}

.tabs-wrapper {
  position: relative;
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 1.5rem;
}

.tabs-wrapper.tabs-scrollable {
  overflow-x: auto;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.tabs-wrapper.tabs-scrollable::-webkit-scrollbar {
  height: 4px;
}

.tabs-wrapper.tabs-scrollable::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.tabs-wrapper.tabs-scrollable::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.tab-button {
  position: relative;
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-button:hover:not(.disabled) {
  color: #3498db;
}

.tab-button.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.tab-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-badge {
  background-color: #e5e7eb;
  color: #374151;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab-button.active .tab-badge {
  background-color: #3498db;
  color: white;
}

.tab-indicator {
  position: absolute;
  bottom: -2px;
  height: 2px;
  background-color: #3498db;
  transition: transform 0.3s ease, width 0.3s ease;
  z-index: 1;
}

.tab-content-wrapper {
  min-height: 200px;
}

.tab-content {
  width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

