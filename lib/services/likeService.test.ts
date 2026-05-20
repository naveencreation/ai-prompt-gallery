import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCache, mockRateLimit, mockLogger, mockLikeRepo } = vi.hoisted(() => ({
  mockCache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
  },
  mockRateLimit: {
    check: vi.fn(),
  },
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  mockLikeRepo: {
    getLikeCount: vi.fn(),
    incrementLike: vi.fn(),
  },
}))

vi.mock('@/lib/cache/factory', () => ({
  cache: mockCache,
}))

vi.mock('@/lib/ratelimit/factory', () => ({
  rateLimit: mockRateLimit,
}))

vi.mock('@/lib/observability/logger', () => ({
  logger: mockLogger,
}))

vi.mock('@/lib/repos/likeRepo', () => mockLikeRepo)

import { getLikeCount, addLike } from './likeService'

describe('likeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getLikeCount', () => {
    it('returns cached count when available', async () => {
      mockCache.get.mockResolvedValue(42)
      const result = await getLikeCount('img-1')
      expect(result).toBe(42)
      expect(mockLikeRepo.getLikeCount).not.toHaveBeenCalled()
    })

    it('falls back to repo and caches the result', async () => {
      mockCache.get.mockResolvedValue(null)
      mockLikeRepo.getLikeCount.mockResolvedValue(7)
      const result = await getLikeCount('img-1')
      expect(result).toBe(7)
      expect(mockLikeRepo.getLikeCount).toHaveBeenCalledWith('img-1')
      expect(mockCache.set).toHaveBeenCalledWith('likes:img-1', 7, expect.any(Number))
    })
  })

  describe('addLike', () => {
    it('increments like and returns new count', async () => {
      mockRateLimit.check.mockResolvedValue(true)
      mockLikeRepo.incrementLike.mockResolvedValue(8)

      const result = await addLike('img-1', '192.168.1.1')

      expect(result).toBe(8)
      expect(mockRateLimit.check).toHaveBeenCalledWith(
        'like:192.168.1.1:img-1',
        expect.any(Number),
        expect.any(Number)
      )
      expect(mockLikeRepo.incrementLike).toHaveBeenCalledWith('img-1')
      expect(mockCache.set).toHaveBeenCalledWith('likes:img-1', 8, expect.any(Number))
      expect(mockLogger.info).toHaveBeenCalledWith('like.added', { imageId: 'img-1', ip: '192.168.1.1' })
    })

    it('throws RATE_LIMITED when rate limit exceeded', async () => {
      mockRateLimit.check.mockResolvedValue(false)

      await expect(addLike('img-1', '192.168.1.1')).rejects.toThrow('RATE_LIMITED')
      expect(mockLikeRepo.incrementLike).not.toHaveBeenCalled()
    })
  })
})
