/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardApi } from '../src/features/dashboard/api/dashboard.api'
import { meetingsApi } from '../src/api/meetings.api'
import type { Meeting } from '../src/api/meetings.api'

/**
 * @vitest-environment jsdom
 */

vi.mock('../src/api/meetings.api', () => ({
  meetingsApi: {
    getActiveMeeting: vi.fn(),
  },
}))

describe('dashboardApi.getNextMeeting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps active meeting correctly when active meeting exists', async () => {
    const mockActiveMeeting: Meeting = {
      id: 'meeting-123',
      date: '2024-05-20T10:00:00Z',
      status: 'active',
      notes: 'Reunión de mayo',
      created_at: '2024-05-20T10:00:00Z',
      summary: {
        participants_count: 15,
        total_stock_investment: 1500000,
        total_loans: 3,
      },
    }

    vi.mocked(meetingsApi.getActiveMeeting).mockResolvedValue(mockActiveMeeting)

    const result = await dashboardApi.getNextMeeting()

    expect(meetingsApi.getActiveMeeting).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      id: 'meeting-123',
      date: '2024-05-20T10:00:00Z',
      participants: 15,
      stock_value: 1500000,
      active_loans: 3,
    })
  })

  it('handles active meeting without summary gracefully using defaults', async () => {
    const mockActiveMeeting: Meeting = {
      id: 'meeting-456',
      date: '2024-06-01T10:00:00Z',
      status: 'active',
      notes: null,
      created_at: '2024-06-01T10:00:00Z',
    }

    vi.mocked(meetingsApi.getActiveMeeting).mockResolvedValue(mockActiveMeeting)

    const result = await dashboardApi.getNextMeeting()

    expect(result).toEqual({
      id: 'meeting-456',
      date: '2024-06-01T10:00:00Z',
      participants: 0,
      stock_value: 0,
      active_loans: 0,
    })
  })

  it('returns null when getActiveMeeting throws or fails (e.g., 404 No Active Meeting)', async () => {
    vi.mocked(meetingsApi.getActiveMeeting).mockRejectedValue(new Error('No active meeting'))

    const result = await dashboardApi.getNextMeeting()

    expect(result).toBeNull()
  })
})
