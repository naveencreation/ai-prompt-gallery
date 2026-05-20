import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSearch } = vi.hoisted(() => ({
  mockSearch: {
    query: vi.fn(),
  },
}))

vi.mock('@/lib/search/factory', () => ({
  search: mockSearch,
}))

import { searchImages } from './searchService'

describe('searchService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delegates to search adapter', async () => {
    mockSearch.query.mockResolvedValue([{ id: '1', slug: 'a', prompt: 'b', imageUrl: 'c', rank: 0 }])
    const result = await searchImages('cat')
    expect(mockSearch.query).toHaveBeenCalledWith('cat', undefined)
    expect(result).toHaveLength(1)
  })

  it('passes options through', async () => {
    mockSearch.query.mockResolvedValue([])
    await searchImages('dog', { limit: 10, cursor: 'abc' })
    expect(mockSearch.query).toHaveBeenCalledWith('dog', { limit: 10, cursor: 'abc' })
  })

  it('returns empty array for blank query', async () => {
    const result = await searchImages('   ')
    expect(result).toEqual([])
    expect(mockSearch.query).not.toHaveBeenCalled()
  })

  it('trims whitespace from query', async () => {
    mockSearch.query.mockResolvedValue([])
    await searchImages('  space  ')
    expect(mockSearch.query).toHaveBeenCalledWith('space', undefined)
  })
})
