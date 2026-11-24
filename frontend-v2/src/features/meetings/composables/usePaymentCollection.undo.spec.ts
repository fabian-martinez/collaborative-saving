/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePaymentCollection } from './usePaymentCollection'
import { meetingsApi, type Operation } from '@/api/meetings.api'
import type { Member } from '@/api/members.api'

vi.mock('@/api/meetings.api', () => ({
  meetingsApi: {
    getMeetingPayments: vi.fn(),
    undoMeetingOperation: vi.fn()
  }
}))

describe('usePaymentCollection undo & rebuild', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('rebuilds completedPayments cleanly when a member payment is undone', async () => {
    const members = [
      { id: 'm1', name: 'Ana Gómez' },
      { id: 'm2', name: 'Luis Díaz' }
    ] as Member[]

    vi.mocked(meetingsApi.getMeetingPayments).mockResolvedValueOnce([
      { id: 'op-1', member_id: 'm1', total_amount: 100000 } as unknown as Operation,
      { id: 'op-2', member_id: 'm2', total_amount: 50000 } as unknown as Operation
    ])

    const collection = usePaymentCollection()
    await collection.fetchMeetingPayments('meet-1', members)

    expect(collection.paidMemberIds.value).toEqual(['m1', 'm2'])
    expect(collection.completedPayments.value).toEqual([
      { memberName: 'Ana Gómez', amount: 100000 },
      { memberName: 'Luis Díaz', amount: 50000 }
    ])
    expect(collection.paidMemberOperationIds.value.get('m1')).toEqual(['op-1'])

    // Simulate m1 undone -> only m2 remains
    vi.mocked(meetingsApi.getMeetingPayments).mockResolvedValueOnce([
      { id: 'op-2', member_id: 'm2', total_amount: 50000 } as unknown as Operation
    ])

    await collection.fetchMeetingPayments('meet-1', members)

    expect(collection.paidMemberIds.value).toEqual(['m2'])
    expect(collection.completedPayments.value).toEqual([
      { memberName: 'Luis Díaz', amount: 50000 }
    ])
  })

  it('calls undoMeetingOperation for each operationId in block', async () => {
    vi.mocked(meetingsApi.undoMeetingOperation).mockResolvedValue({
      success: true,
      operation_id: 'op-1',
      message: 'ok'
    })

    const collection = usePaymentCollection()
    await collection.undoMeetingOperations(
      'meet-1',
      ['op-1', 'op-2'],
      'Cobro erróneo'
    )

    expect(meetingsApi.undoMeetingOperation).toHaveBeenNthCalledWith(
      1,
      'meet-1',
      'op-1',
      'Cobro erróneo'
    )
    expect(meetingsApi.undoMeetingOperation).toHaveBeenNthCalledWith(
      2,
      'meet-1',
      'op-2',
      'Cobro erróneo'
    )
    expect(collection.isUndoing.value).toBe(false)
  })
})
