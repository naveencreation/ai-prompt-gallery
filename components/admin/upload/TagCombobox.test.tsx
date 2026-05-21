// @vitest-environment jsdom

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(Element.prototype as any).scrollIntoView = function () {}

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TagCombobox from './TagCombobox'

describe('TagCombobox', () => {
  it('renders empty and opens popover', () => {
    render(<TagCombobox value={[]} onChange={vi.fn()} suggestions={['cyberpunk', 'portrait']} />)
    expect(screen.queryByText('cyberpunk')).not.toBeInTheDocument()
    const btn = screen.getByRole('button', { name: /add tag/i })
    fireEvent.click(btn)
    expect(screen.getByText('cyberpunk')).toBeInTheDocument()
  })

  it('adds a tag from suggestions', () => {
    const onChange = vi.fn()
    render(<TagCombobox value={[]} onChange={onChange} suggestions={['cyberpunk']} />)
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }))
    fireEvent.click(screen.getByText('cyberpunk'))
    expect(onChange).toHaveBeenCalledWith(['cyberpunk'])
  })

  it('removes a tag via X button', () => {
    const onChange = vi.fn()
    render(<TagCombobox value={['cyberpunk']} onChange={onChange} suggestions={[]} />)
    const removeBtn = screen.getByRole('button', { name: /remove cyberpunk/i })
    fireEvent.click(removeBtn)
    expect(onChange).toHaveBeenCalledWith([])
  })
})
