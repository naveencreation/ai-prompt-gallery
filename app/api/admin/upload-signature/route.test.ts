import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockRequireAdminSession, mockSignedUploadUrl, mockPublicUrl } = vi.hoisted(() => ({
  mockRequireAdminSession: vi.fn(),
  mockSignedUploadUrl: vi.fn(),
  mockPublicUrl: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  requireAdminSession: mockRequireAdminSession,
}))

vi.mock('@/lib/storage/factory', () => ({
  storage: { signedUploadUrl: mockSignedUploadUrl, publicUrl: mockPublicUrl },
}))

import { POST } from './route'

describe('POST /api/admin/upload-signature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not admin', async () => {
    mockRequireAdminSession.mockRejectedValue(new Error('Unauthorized'))
    const request = new NextRequest(new URL('http://localhost/api/admin/upload-signature'), {
      method: 'POST',
      body: JSON.stringify({ path: 'test.webp' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 200 with signed URL + publicUrl for admin', async () => {
    mockRequireAdminSession.mockResolvedValue({ id: 'admin-1' })
    mockSignedUploadUrl.mockResolvedValue({ signedUrl: 'https://signed.url', path: 'test.webp' })
    mockPublicUrl.mockReturnValue('https://public.url')
    const request = new NextRequest(new URL('http://localhost/api/admin/upload-signature'), {
      method: 'POST',
      body: JSON.stringify({ path: 'test.webp' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.signedUrl).toBe('https://signed.url')
    expect(body.publicUrl).toBe('https://public.url')
    expect(body.path).toBe('test.webp')
  })

  it('auto-generates path from filename when path omitted', async () => {
    mockRequireAdminSession.mockResolvedValue({ id: 'admin-1' })
    mockSignedUploadUrl.mockResolvedValue({ signedUrl: 'https://signed.url', path: 'originals/abc123.png' })
    mockPublicUrl.mockReturnValue('https://public.url/originals/abc123.png')
    const request = new NextRequest(new URL('http://localhost/api/admin/upload-signature'), {
      method: 'POST',
      body: JSON.stringify({ filename: 'my-image.png' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.path).toMatch(/^originals\/.*\.png$/)
    expect(body.publicUrl).toBe('https://public.url/originals/abc123.png')
  })
})
