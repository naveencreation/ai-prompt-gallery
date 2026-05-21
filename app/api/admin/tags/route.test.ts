import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockAdminGuard, mockFindAllTags } = vi.hoisted(() => ({
  mockAdminGuard: vi.fn(),
  mockFindAllTags: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  adminGuard: mockAdminGuard,
}))

vi.mock('@/lib/repos/tagRepo', () => ({
  findAllTags: mockFindAllTags,
}))

import { GET } from './route'

describe('GET /api/admin/tags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not admin', async () => {
    mockAdminGuard.mockResolvedValue({
      user: null,
      response: new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
        status: 401,
      }),
    })
    const request = new NextRequest(new URL('http://localhost/api/admin/tags'))
    const response = await GET(request)
    expect(response.status).toBe(401)
  })

  it('returns tags for admin', async () => {
    mockAdminGuard.mockResolvedValue({ user: { id: 'admin-1' }, response: null })
    mockFindAllTags.mockResolvedValue([
      { id: 1, name: 'cyberpunk', slug: 'cyberpunk' },
      { id: 2, name: 'portrait', slug: 'portrait' },
    ])
    const request = new NextRequest(new URL('http://localhost/api/admin/tags'))
    const response = await GET(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.tags).toHaveLength(2)
    expect(body.tags[0].name).toBe('cyberpunk')
    expect(response.headers.get('Cache-Control')).toContain('max-age=60')
  })
})
