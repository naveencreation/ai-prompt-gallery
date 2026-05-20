// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { mockPush, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

import LogoutButton from './LogoutButton'

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('calls DELETE /api/admin/auth and redirects to login', async () => {
    ;(global.fetch as any).mockResolvedValue({ ok: true })

    render(<LogoutButton />)
    fireEvent.click(screen.getByRole('button', { name: /log out/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/auth', {
        method: 'DELETE',
      })
      expect(mockPush).toHaveBeenCalledWith('/admin/login')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})
