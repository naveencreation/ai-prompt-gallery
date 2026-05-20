import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockSearchImages } = vi.hoisted(() => ({
  mockSearchImages: vi.fn(),
}))

vi.mock('@/lib/services/searchService', () => ({
  searchImages: mockSearchImages,
}))

import { GET } from './route'

function req(url: string) {
  return new NextRequest(new URL(url))
}

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid query', async () => {
    const response = await GET(req('http://localhost/api/search?q='))
    expect(response.status).toBe(400)
  })

  it('returns 200 with results and cache headers', async () => {
    mockSearchImages.mockResolvedValue({
      items: [{ id: '1', slug: 'cat', prompt: 'cat' }],
      nextCursor: null,
    })

    const response = await GET(req('http://localhost/api/search?q=cat'))
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60')
    const body = await response.json()
    expect(body.items).toHaveLength(1)
  })
})
