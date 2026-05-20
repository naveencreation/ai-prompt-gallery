import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockRevalidateTag } = vi.hoisted(() => ({
  mockRevalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidateTag: mockRevalidateTag,
}))

import { POST } from './route'

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for invalid secret', async () => {
    const request = new NextRequest(new URL('http://localhost/api/revalidate'), {
      method: 'POST',
      body: JSON.stringify({ secret: 'wrong', tag: 'gallery' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 200 and calls revalidateTag for valid secret', async () => {
    const request = new NextRequest(new URL('http://localhost/api/revalidate'), {
      method: 'POST',
      body: JSON.stringify({ secret: 'dummy-revalidate-secret-32-chars-long', tag: 'gallery' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(mockRevalidateTag).toHaveBeenCalledWith('gallery', 'default')
  })
})
