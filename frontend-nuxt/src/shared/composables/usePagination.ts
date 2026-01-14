import { ref, computed, type Ref } from 'vue'

export interface PaginationState {
  page: number
  limit: number
  total: number
}

export function usePagination(initialLimit: number = 20) {
  const page: Ref<number> = ref(1)
  const limit: Ref<number> = ref(initialLimit)
  const total: Ref<number> = ref(0)

  const totalPages = computed(() => Math.ceil(total.value / limit.value))
  const hasNextPage = computed(() => page.value < totalPages.value)
  const hasPreviousPage = computed(() => page.value > 1)
  const startIndex = computed(() => (page.value - 1) * limit.value + 1)
  const endIndex = computed(() => Math.min(page.value * limit.value, total.value))

  function setPage(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages.value) {
      page.value = newPage
    }
  }

  function nextPage() {
    if (hasNextPage.value) {
      page.value++
    }
  }

  function previousPage() {
    if (hasPreviousPage.value) {
      page.value--
    }
  }

  function setLimit(newLimit: number) {
    limit.value = newLimit
    page.value = 1 // Reset to first page when changing limit
  }

  function setTotal(newTotal: number) {
    total.value = newTotal
    // Adjust page if current page is beyond total pages
    if (page.value > totalPages.value && totalPages.value > 0) {
      page.value = totalPages.value
    }
  }

  function reset() {
    page.value = 1
    limit.value = initialLimit
    total.value = 0
  }

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    setPage,
    nextPage,
    previousPage,
    setLimit,
    setTotal,
    reset
  }
}

