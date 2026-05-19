// lib/services/likeService.ts
import * as likeRepo from '@/lib/repos/likeRepo'
import { cache } from '@/lib/cache/factory'
import { rateLimit } from '@/lib/ratelimit/factory'
import { logger } from '@/lib/observability/logger'
import { CACHE_TTL_LIKE } from '@/lib/constants/cache'
import { LIKE_RATE_LIMIT, LIKE_RATE_WINDOW } from '@/lib/constants/limits'

export async function getLikeCount(imageId: string): Promise<number> {
  const cacheKey = `likes:${imageId}`
  const cached = await cache.get<number>(cacheKey)
  if (cached !== null) return cached

  const count = await likeRepo.getLikeCount(imageId)
  await cache.set(cacheKey, count, CACHE_TTL_LIKE)
  return count
}

export async function addLike(imageId: string, ip: string): Promise<number> {
  const allowed = await rateLimit.check(
    `like:${ip}:${imageId}`,
    LIKE_RATE_LIMIT,
    LIKE_RATE_WINDOW
  )
  if (!allowed) throw new Error('RATE_LIMITED')

  const count = await likeRepo.incrementLike(imageId)
  await cache.set(`likes:${imageId}`, count, CACHE_TTL_LIKE)
  logger.info('like.added', { imageId, ip })
  return count
}
