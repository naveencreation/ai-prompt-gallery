import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetGalleryPage,
  mockGetImagesByTagSlug,
  mockRequireAdminSession,
  mockCreateImage,
} = vi.hoisted(() => ({
  mockGetGalleryPage: vi.fn(),
  mockGetImagesByTagSlug: vi.fn(),
  mockRequireAdminSession: vi.fn(),
  mockCreateImage: vi.fn(),
}))

vi.mock('@/lib/services/imageService', () => ({
  getGalleryPage: mockGetGalleryPage,
  getImagesByTagSlug: mockGetImagesByTagSlug,
  createImage: mockCreateImage,
}))

vi.mock('@/lib/auth', () => ({
  requireAdminSession: mockRequireAdminSession,
}))

import { GET, POST } from './route'

function req(url: string, body?: object) {
  return new NextRequest(new URL(url), body ? {
    method: 'POST',
    body: JSON.stringify(body),
  } : {})
}

describe('GET /api/images', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated gallery with cache headers', async () => {
    mockGetGalleryPage.mockResolvedValue({ items: [{ id: '1', slug: 'a' }], nextCursor: null })
    const response = await GET(req('http://localhost/api/images'))
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60')
    const json = await response.json()
    expect(json.items).toHaveLength(1)
  })

  it('filters by tag slug', async () => {
    mockGetImagesByTagSlug.mockResolvedValue({ items: [{ id: '2', slug: 'b' }], nextCursor: null })
    const response = await GET(req('http://localhost/api/images?tag=cat'))
    expect(response.status).toBe(200)
    expect(mockGetImagesByTagSlug).toHaveBeenCalled()
  })
})

describe('POST /api/images', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not admin', async () => {
    mockRequireAdminSession.mockRejectedValue(new Error('Unauthorized'))
    const response = await POST(req('http://localhost/api/images', { image: {}, tags: [] }))
    expect(response.status).toBe(401)
  })

  it('creates image when admin', async () => {
    mockRequireAdminSession.mockResolvedValue({ id: 'admin-1' })
    mockCreateImage.mockResolvedValue({ id: 'new-1', slug: 'new-slug' })
    const response = await POST(req('http://localhost/api/images', {
      image: {
        slug: 'new-slug',
        storage_key: 'k',
        storage_provider: 'supabase',
        image_url: 'https://example.com/img.webp',
        width: 1,
        height: 1,
        prompt: 'test',
        is_published: true,
      },
      tags: ['cat'],
    }))
    expect(response.status).toBe(201)
  })
})
