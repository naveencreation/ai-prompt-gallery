// lib/services/dashboardService.ts
import * as repo from '@/lib/repos/dashboardRepo'
import { cache } from '@/lib/cache/factory'

const TTL = 60 // seconds

function cacheKey(name: string) {
  return `dashboard:${name}`
}

export interface DashboardStats {
  images: { total: number; published: number; delta: number }
  likes: { total: number; last7d: number; delta: number }
  tags: { total: number }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const key = cacheKey('stats')
  const cached = await cache.get<DashboardStats>(key)
  if (cached) return cached

  const totalImages = await repo.countImages()
  const totalPublished = await repo.countPublishedImages()
  const totalTags = await repo.countTags()
  const totalLikes = await repo.sumLikes()

  // Delta: compare last 7d vs prior 7d for likes
  const now = new Date()
  const last7d = new Date(now)
  last7d.setDate(last7d.getDate() - 7)
  const prior7d = new Date(now)
  prior7d.setDate(prior7d.getDate() - 14)

  const likesLast7d = await repo.sumLikesSince(last7d.toISOString())
  const likesPrior7d = await repo.sumLikesSince(prior7d.toISOString()) - likesLast7d

  const deltaLikes = likesPrior7d > 0
    ? ((likesLast7d - likesPrior7d) / likesPrior7d) * 100
    : 0

  // Delta for images: compare last 30d vs prior 30d
  const last30d = new Date(now)
  last30d.setDate(last30d.getDate() - 30)
  const prior30d = new Date(now)
  prior30d.setDate(prior30d.getDate() - 60)

  // Note: countImagesSince not yet in repo; fallback to 0
  // When added, compute deltaImages similarly

  const result = {
    images: {
      total: totalImages,
      published: totalPublished,
      delta: 0, // TODO: add countImagesSince when schema supports it
    },
    likes: {
      total: totalLikes,
      last7d: likesLast7d,
      delta: Math.round(deltaLikes * 10) / 10,
    },
    tags: {
      total: totalTags,
    },
  }

  await cache.set(key, result, TTL)
  return result
}

export interface LikesPoint {
  day: string
  likes: number
}

export async function getLikesTimeseries(days = 28): Promise<LikesPoint[]> {
  const key = cacheKey(`likes_ts:${days}`)
  const cached = await cache.get<LikesPoint[]>(key)
  if (cached) return cached

  const data = await repo.getLikesPerDay(days)
  await cache.set(key, data, TTL)
  return data
}

export async function getTopTags(limit = 5): Promise<{ name: string; slug: string; count: number }[]> {
  const key = cacheKey(`top_tags:${limit}`)
  const cached = await cache.get<{ name: string; slug: string; count: number }[]>(key)
  if (cached) return cached

  const data = await repo.getTopTags(limit)
  await cache.set(key, data, TTL)
  return data
}

export interface RecentUpload {
  id: string
  slug: string
  prompt: string
  imageUrl: string
  isPublished: boolean
  createdAt: string
}

export async function getRecentUploads(limit = 6): Promise<RecentUpload[]> {
  const key = cacheKey(`recent_uploads:${limit}`)
  const cached = await cache.get<RecentUpload[]>(key)
  if (cached) return cached

  const data = await repo.getRecentImages(limit)
  const result = data.map((img) => ({
    id: img.id,
    slug: img.slug,
    prompt: img.prompt,
    imageUrl: img.image_url,
    isPublished: img.is_published,
    createdAt: img.created_at,
  }))
  await cache.set(key, result, TTL)
  return result
}
