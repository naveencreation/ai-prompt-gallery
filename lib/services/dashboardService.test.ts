// lib/services/dashboardService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockRepo } = vi.hoisted(() => {
  return {
    mockRepo: {
      countImages: vi.fn(),
      countPublishedImages: vi.fn(),
      countTags: vi.fn(),
      sumLikes: vi.fn(),
      sumLikesSince: vi.fn(),
      getLikesPerDay: vi.fn(),
      getTopTags: vi.fn(),
      getRecentImages: vi.fn(),
    },
  }
})

vi.mock('@/lib/repos/dashboardRepo', () => mockRepo)

// Reset cache between tests so cached values don't leak
const store = new Map<string, unknown>()
vi.mock('@/lib/cache/factory', () => {
  return {
    cache: {
      get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      set: vi.fn((key: string, value: unknown) => {
        store.set(key, value)
        return Promise.resolve()
      }),
      del: vi.fn(),
      incr: vi.fn(),
    },
  }
})

beforeEach(() => {
  store.clear()
})

import {
  getDashboardStats,
  getLikesTimeseries,
  getTopTags,
  getRecentUploads,
} from './dashboardService'

describe('getDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns counts and computes like delta', async () => {
    mockRepo.countImages.mockResolvedValue(10)
    mockRepo.countPublishedImages.mockResolvedValue(8)
    mockRepo.countTags.mockResolvedValue(5)
    mockRepo.sumLikes.mockResolvedValue(42)
    mockRepo.sumLikesSince.mockResolvedValue(12)

    const result = await getDashboardStats()

    expect(result.images.total).toBe(10)
    expect(result.images.published).toBe(8)
    expect(result.tags.total).toBe(5)
    expect(result.likes.total).toBe(42)
    expect(result.likes.last7d).toBe(12)
    expect(result.likes.delta).toBe(0)
  })

  it('computes positive delta when prior window had fewer likes', async () => {
    mockRepo.countImages.mockResolvedValue(1)
    mockRepo.countPublishedImages.mockResolvedValue(1)
    mockRepo.countTags.mockResolvedValue(1)
    mockRepo.sumLikes.mockResolvedValue(1)
    // sumLikesSince gets called twice:
    // first with -7d, then with -14d (which returns 12 + 10 = 22, so prior 7d = 10)
    mockRepo.sumLikesSince.mockResolvedValueOnce(12).mockResolvedValueOnce(22)

    const result = await getDashboardStats()

    // likesLast7d = 12, likesPrior7d = 22 - 12 = 10
    // delta = (12 - 10) / 10 * 100 = 20
    expect(result.likes.delta).toBe(20)
  })

  it('handles zero prior window without NaN', async () => {
    mockRepo.countImages.mockResolvedValue(1)
    mockRepo.countPublishedImages.mockResolvedValue(1)
    mockRepo.countTags.mockResolvedValue(1)
    mockRepo.sumLikes.mockResolvedValue(1)
    mockRepo.sumLikesSince.mockResolvedValueOnce(0).mockResolvedValueOnce(0)

    const result = await getDashboardStats()

    expect(result.likes.delta).toBe(0)
  })
})

describe('getLikesTimeseries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns data from repo and caches it', async () => {
    mockRepo.getLikesPerDay.mockResolvedValue([
      { day: '2024-01-01', likes: 1 },
      { day: '2024-01-02', likes: 3 },
    ])

    const first = await getLikesTimeseries(7)
    expect(first).toHaveLength(2)
    expect(mockRepo.getLikesPerDay).toHaveBeenCalledTimes(1)

    // Second call should hit cache and skip repo
    const second = await getLikesTimeseries(7)
    expect(second).toEqual(first)
    expect(mockRepo.getLikesPerDay).toHaveBeenCalledTimes(1)
  })
})

describe('getTopTags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns top tags from repo', async () => {
    mockRepo.getTopTags.mockResolvedValue([
      { name: 'cyberpunk', slug: 'cyberpunk', count: 42 },
    ])

    const result = await getTopTags(5)
    expect(result).toHaveLength(1)
    expect(result[0]?.slug).toBe('cyberpunk')
    expect(mockRepo.getTopTags).toHaveBeenCalledWith(5)
  })
})

describe('getRecentUploads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps repo rows to RecentUpload shape', async () => {
    mockRepo.getRecentImages.mockResolvedValue([
      {
        id: 'img-1',
        slug: 'test-image',
        prompt: 'A test prompt',
        image_url: 'http://example.com/img.png',
        is_published: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ])

    const result = await getRecentUploads(6)
    expect(result).toHaveLength(1)
    expect(result[0]!).toMatchObject({
      id: 'img-1',
      slug: 'test-image',
      imageUrl: 'http://example.com/img.png',
      isPublished: true,
    })
  })
})
