/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useToast } from '../src/shared/composables/useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const { toasts } = useToast()
    toasts.value.splice(0, toasts.value.length)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should add success toast with default duration (3000ms)', () => {
    // Arrange
    const { toasts, success } = useToast()

    // Act
    success('Operación exitosa')

    // Assert
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Operación exitosa')
    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[0].duration).toBe(3000)
  })

  it('should add error toast with default duration (5000ms)', () => {
    // Arrange
    const { toasts, error } = useToast()

    // Act
    error('Ha ocurrido un error')

    // Assert
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Ha ocurrido un error')
    expect(toasts.value[0].type).toBe('error')
    expect(toasts.value[0].duration).toBe(5000)
  })

  it('should add warning toast with default duration (4000ms)', () => {
    // Arrange
    const { toasts, warning } = useToast()

    // Act
    warning('Advertencia de prueba')

    // Assert
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Advertencia de prueba')
    expect(toasts.value[0].type).toBe('warning')
    expect(toasts.value[0].duration).toBe(4000)
  })

  it('should add info toast with default duration (3000ms)', () => {
    // Arrange
    const { toasts, info } = useToast()

    // Act
    info('Información importante')

    // Assert
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Información importante')
    expect(toasts.value[0].type).toBe('info')
    expect(toasts.value[0].duration).toBe(3000)
  })

  it('should automatically remove toast when duration expires', () => {
    // Arrange
    const { toasts, success } = useToast()
    success('Mensaje temporal', 2000)
    expect(toasts.value).toHaveLength(1)

    // Act
    vi.advanceTimersByTime(2000)

    // Assert
    expect(toasts.value).toHaveLength(0)
  })

  it('should manually remove toast by id', () => {
    // Arrange
    const { toasts, info, removeToast } = useToast()
    info('Mensaje 1')
    info('Mensaje 2')
    expect(toasts.value).toHaveLength(2)
    const firstId = toasts.value[0].id

    // Act
    removeToast(firstId)

    // Assert
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Mensaje 2')
  })
})
