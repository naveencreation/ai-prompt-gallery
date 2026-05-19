// lib/repos/imageRepo.ts
import { createAdminClient } from '@/lib/db/client'
import { encodeCursor, decodeCursor } from '@/lib/utils/cursor'
import { PAGE_SIZE } from '@/lib/constants/limits'
import type { CreateImage, UpdateImage } from '@/lib/db/schema'

const SELECT_PUBLIC =
  'id, slug, image_url, width, height, prompt, description, model, display_order, created_at'

const SELECT_FULL =
  'id, slug, storage_key, storage_provider, image_url, width, height, prompt, description, model, is_published, display_order, created_at, updated_at'

export async function findPublishedImages(cursor?: string, limit = PAGE_SIZE) {
  const client = createAdminClient()
  let query = client
    .from('images')
    .select(SELECT_PUBLIC)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor)
    query = query.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`)
  }

  const { data, error } = await query
  if (error) throw new Error(`findPublishedImages: ${error.message}`)

  const hasMore = (data?.length ?? 0) > limit
  const rows = hasMore ? data!.slice(0, limit) : (data ?? [])
  const nextCursor = hasMore
    ? encodeCursor({ createdAt: rows.at(-1)!.created_at, id: rows.at(-1)!.id })
    : null

  return { rows, nextCursor }
}

export async function findImageBySlug(slug: string) {
  const client = createAdminClient()
  const { data, error } = await client
    .from('images')
    .select(SELECT_FULL)
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  if (error) return null
  return data
}

export async function findImageById(id: string) {
  const client = createAdminClient()
  const { data, error } = await client
    .from('images')
    .select(SELECT_FULL)
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function findAllImages(cursor?: string, limit = PAGE_SIZE) {
  const client = createAdminClient()
  let query = client
    .from('images')
    .select(SELECT_FULL)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor)
    query = query.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`)
  }

  const { data, error } = await query
  if (error) throw new Error(`findAllImages: ${error.message}`)

  const hasMore = (data?.length ?? 0) > limit
  const rows = hasMore ? data!.slice(0, limit) : (data ?? [])
  const nextCursor = hasMore
    ? encodeCursor({ createdAt: rows.at(-1)!.created_at, id: rows.at(-1)!.id })
    : null

  return { rows, nextCursor }
}

export async function insertImage(input: CreateImage) {
  const client = createAdminClient()
  const { data, error } = await client
    .from('images')
    .insert(input)
    .select(SELECT_FULL)
    .single()
  if (error) throw new Error(`insertImage: ${error.message}`)
  return data!
}

export async function updateImage(id: string, input: UpdateImage) {
  const client = createAdminClient()
  const { data, error } = await client
    .from('images')
    .update(input)
    .eq('id', id)
    .select(SELECT_FULL)
    .single()
  if (error) throw new Error(`updateImage: ${error.message}`)
  return data!
}

export async function deleteImage(id: string) {
  const client = createAdminClient()
  const { error } = await client.from('images').delete().eq('id', id)
  if (error) throw new Error(`deleteImage: ${error.message}`)
}

export async function slugExists(slug: string): Promise<boolean> {
  const client = createAdminClient()
  const { count, error } = await client
    .from('images')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)
  if (error) return false
  return (count ?? 0) > 0
}
