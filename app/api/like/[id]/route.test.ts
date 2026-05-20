import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockAddLike } = vi.hoisted(() => ({
  mockAddLike: vi.fn(),
}))

vi.mock('@/lib/services/likeService', () => ({
  addLike: mockAddLike,
}))

import { POST } from './route'

function req(id: string, forwardedFor?: string) {
  return new NextRequest(
    new URL(`http://localhost/api/like/${id}`),
    forwardedFor ? { headers: { 'x-forwarded-for': forwardedFor } } : {}
  )
}

describe('POST /api/like/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 429 when rate limited', async () => {
    mockAddLike.mockRejectedValue(new Error('RATE_LIMITED'))
    const response = await POST(req('img-1', '1.2.3.4'), {
      params: Promise.resolve({ id: 'img-1' }),
    })
    expect(response.status).toBe(429)
  })

  it('returns 200 and calls addLike when allowed', async () => {
    mockAddLike.mockResolvedValue(5)
    const response = await POST(req('img-1', '1.2.3.4'), {
      params: Promise.resolve({ id: 'img-1' }),
    })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.count).toBe(5)
    expect(mockAddLike).toHaveBeenCalledWith('img-1', '1.2.3.4')
  })
})
