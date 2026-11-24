/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AuditLogsView from './AuditLogsView.vue'
import { auditApi } from '@/api/audit.api'

vi.mock('@/api/audit.api', () => ({
  auditApi: {
    getAuditLogs: vi.fn()
  }
}))

describe('AuditLogsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders audit logs from API and opens detail modal', async () => {
    vi.mocked(auditApi.getAuditLogs).mockResolvedValue({
      data: [
        {
          id: 'audit-1',
          event_type: 'OPERATION_DELETED',
          entity_type: 'operation',
          entity_id: 'op-123',
          meeting_id: 'meet-123',
          user_id: 'user-1',
          user_email: 'admin@example.com',
          user_role: 'admin',
          reason: 'Cobro duplicado',
          details: { amount: 50000 },
          created_at: '2026-11-24T16:00:00.000Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    })

    const wrapper = mount(AuditLogsView)
    await flushPromises()

    expect(auditApi.getAuditLogs).toHaveBeenCalledWith({
      event_type: undefined,
      entity_type: undefined,
      meeting_id: undefined,
      page: 1,
      limit: 20
    })
    expect(wrapper.text()).toContain('Operación Anulada')
    expect(wrapper.text()).toContain('admin@example.com')
    expect(wrapper.text()).toContain('Cobro duplicado')

    await wrapper.find('tbody button').trigger('click')
    expect(wrapper.text()).toContain('Detalle de Auditoría')
    expect(wrapper.text()).toContain('"amount": 50000')
  })

  it('shows empty state when no logs match filters', async () => {
    vi.mocked(auditApi.getAuditLogs).mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    })

    const wrapper = mount(AuditLogsView)
    await flushPromises()

    expect(wrapper.text()).toContain(
      'No hay registros de auditoría que coincidan con los filtros.'
    )
  })
})
