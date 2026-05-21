// lib/repos/dashboardRepo.ts
import { createAdminClient } from '@/lib/db/client'

export async function countImages(): Promise<number> {
  const client = createAdminClient()
  const { count, error } = await client
    .from('images')
    .select('id', { count: 'exact', head: true })
  if (error) throw new Error(`countImages: ${error.message}`)
  return count ?? 0
}

export async function countPublishedImages(): Promise<number> {
  const client = createAdminClient()
  const { count, error } = await client
    .from('images')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)
  if (error) throw new Error(`countPublishedImages: ${error.message}`)
  return count ?? 0
}

export async function countTags(): Promise<number> {
  const client = createAdminClient()
  const { count, error } = await client
    .from('tags')
    .select('id', { count: 'exact', head: true })
  if (error) throw new Error(`countTags: ${error.message}`)
  return count ?? 0
}

export async function sumLikes(): Promise<number> {
  const client = createAdminClient()
  const { data, error } = await client.rpc('dashboard_sum_likes')
  if (error) throw new Error(`sumLikes: ${error.message}`)
  return Number(data ?? 0)
}

export async function sumLikesSince(sinceIso: string): Promise<number> {
  const client = createAdminClient()
  const { count, error } = await client
    .from('like_events' as any)
    .select('id', { count: 'exact', head: true })
    .gte('created_at', sinceIso)
  if (error) throw new Error(`sumLikesSince: ${error.message}`)
  return count ?? 0
}

export async function getLikesPerDay(
  days: number
): Promise<{ day: string; likes: number }[]> {
  const client = createAdminClient()
  const { data, error } = await client.rpc('dashboard_likes_per_day', {
    p_days: days,
  })
  if (error) throw new Error(`getLikesPerDay: ${error.message}`)
  return (data ?? []).map((row: { day: string; likes: number | string }) => ({
    day: row.day,
    likes: Number(row.likes ?? 0),
  }))
}

export async function getTopTags(
  limit: number
): Promise<{ name: string; slug: string; count: number }[]> {
  const client = createAdminClient()
  const { data, error } = await client.rpc('dashboard_top_tags', {
    p_limit: limit,
  })
  if (error) throw new Error(`getTopTags: ${error.message}`)
  return (data ?? []).map(
    (row: { name: string; slug: string; count: number | string }) => ({
      name: row.name,
      slug: row.slug,
      count: Number(row.count ?? 0),
    })
  )
}

export async function getRecentImages(limit: number) {
  const client = createAdminClient()
  const { data, error } = await client
    .from('images')
    .select('id, slug, prompt, image_url, is_published, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`getRecentImages: ${error.message}`)
  return data ?? []
}
