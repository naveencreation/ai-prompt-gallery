import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockRequireAdminSession, mockSignedUploadUrl } = vi.hoisted(() => ({
  mockRequireAdminSession: vi.fn(),
  mockSignedUploadUrl: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  requireAdminSession: mockRequireAdminSession,
}))

vi.mock('@/lib/storage/factory', () => ({
  storage: { signedUploadUrl: mockSignedUploadUrl },
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

  it('returns 200 with signed URL for admin', async () => {
    mockRequireAdminSession.mockResolvedValue({ id: 'admin-1' })
    mockSignedUploadUrl.mockResolvedValue({ signedUrl: 'https://signed.url', publicUrl: 'https://public.url' })
    const request = new NextRequest(new URL('http://localhost/api/admin/upload-signature'), {
      method: 'POST',
      body: JSON.stringify({ path: 'test.webp' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.signedUrl).toBe('https://signed.url')
  })
})
