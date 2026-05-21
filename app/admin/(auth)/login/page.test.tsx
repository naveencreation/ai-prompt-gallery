// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { mockPush, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}))

import AdminLoginPage from './page'

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('shows error on failed login', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Bad creds' }),
    })

    render(<AdminLoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@a.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'bad' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Bad creds')).toBeInTheDocument()
    })
  })

  it('redirects to dashboard on success', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: { id: '1' } }),
    })

    render(<AdminLoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})
