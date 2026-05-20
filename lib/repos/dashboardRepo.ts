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
  const { data, error } = await client.from('like_counts').select('count')
  if (error) throw new Error(`sumLikes: ${error.message}`)
  return (data ?? []).reduce((sum, row) => sum + (row.count ?? 0), 0)
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

export async function getLikesPerDay(days: number): Promise<{ day: string; likes: number }[]> {
  const client = createAdminClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - (days - 1))
  cutoff.setHours(0, 0, 0, 0)

  const { data, error } = await client
    .from('like_events' as any)
    .select('created_at')
    .gte('created_at', cutoff.toISOString())

  if (error) throw new Error(`getLikesPerDay: ${error.message}`)

  // Group by day
  const counts = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]!
    counts.set(key, 0)
  }

  for (const row of (data ?? []) as any[]) {
    const key = (row.created_at as string).split('T')[0]!
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([day, likes]) => ({ day, likes }))
    .sort((a, b) => a.day.localeCompare(b.day))
}

export async function getTopTags(limit: number): Promise<{ name: string; slug: string; count: number }[]> {
  const client = createAdminClient()
  const { data, error } = await client
    .from('image_tags')
    .select('tag_id, tags(name, slug)')

  if (error) throw new Error(`getTopTags: ${error.message}`)

  // Aggregate counts
  const tagMap = new Map<string, { name: string; slug: string; count: number }>()
  for (const row of data ?? []) {
    const tag = (row as any).tags
    if (!tag) continue
    const key = tag.slug
    const existing = tagMap.get(key)
    if (existing) {
      existing.count += 1
    } else {
      tagMap.set(key, { name: tag.name, slug: tag.slug, count: 1 })
    }
  }

  return Array.from(tagMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
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
