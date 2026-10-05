/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { exportToCSV, exportTableToCSV } from '../src/shared/utils/export'
import { useToast } from '../src/shared/composables/useToast'

/**
 * @vitest-environment jsdom
 */

describe('export.ts', () => {
  beforeEach(() => {
    const { toasts } = useToast()
    toasts.value.splice(0, toasts.value.length)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('exportToCSV', () => {
    it('should trigger toast.warning and not call window.alert when data is empty', () => {
      // Arrange
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const { toasts } = useToast()

      // Act
      exportToCSV([], 'test-export')

      // Assert
      expect(alertSpy).not.toHaveBeenCalled()
      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe('warning')
      expect(toasts.value[0].message).toBe('No hay datos para exportar')
    })

    it('should create and click a download link when data is provided', () => {
      // Arrange
      const clickMock = vi.fn()
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.body)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.body)
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: vi.fn(),
        style: {},
        click: clickMock,
      } as unknown as HTMLElement)
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url')
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      const data = [{ col1: 'val1', col2: 100 }]

      // Act
      exportToCSV(data, 'data-file')

      // Assert
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(appendChildSpy).toHaveBeenCalled()
      expect(clickMock).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url')
    })
  })

  describe('exportTableToCSV', () => {
    it('should trigger toast.warning and not call window.alert when data is empty', () => {
      // Arrange
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const { toasts } = useToast()

      // Act
      exportTableToCSV([], [{ key: 'id', label: 'ID' }], 'test-table-export')

      // Assert
      expect(alertSpy).not.toHaveBeenCalled()
      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe('warning')
      expect(toasts.value[0].message).toBe('No hay datos para exportar')
    })

    it('should create and click a download link when table data is provided', () => {
      // Arrange
      const clickMock = vi.fn()
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.body)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.body)
      vi.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: vi.fn(),
        style: {},
        click: clickMock,
      } as unknown as HTMLElement)
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-table-url')
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      const data = [{ id: '1', name: 'Test' }]
      const columns = [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }]

      // Act
      exportTableToCSV(data, columns, 'table-file')

      // Assert
      expect(clickMock).toHaveBeenCalled()
    })
  })
})
