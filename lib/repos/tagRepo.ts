// lib/repos/tagRepo.ts
import { createAdminClient } from '@/lib/db/client'
import { encodeCursor, decodeCursor } from '@/lib/utils/cursor'
import { PAGE_SIZE } from '@/lib/constants/limits'
import type { CreateTag } from '@/lib/db/schema'

export async function findAllTags() {
  const client = createAdminClient()
  const { data, error } = await client
    .from('tags')
    .select('id, name, slug')
    .order('name')
  if (error) throw new Error(`findAllTags: ${error.message}`)
  return data ?? []
}

export async function findTagsByImageId(imageId: string) {
  const client = createAdminClient()
  const { data, error } = await client
    .from('image_tags')
    .select('tags(id, name, slug)')
    .eq('image_id', imageId)
  if (error) throw new Error(`findTagsByImageId: ${error.message}`)
  return (data ?? []).flatMap((r) => r.tags ?? [])
}

export async function findOrCreateTag(input: CreateTag) {
  // Convenience wrapper around the batch upsert below; useful when only
  // one tag is needed (e.g. tests).
  const [row] = await findOrCreateTags([input])
  if (!row) throw new Error('findOrCreateTag: empty result')
  return row
}

/**
 * Race-free batch upsert: inserts any missing tags by slug in a single
 * round-trip and returns the full set of rows. Replaces the previous
 * SELECT-then-INSERT loop which had an obvious race window and made
 * N+1 round-trips when creating an image with several tags.
 */
export async function findOrCreateTags(inputs: CreateTag[]) {
  if (inputs.length === 0) return []
  const client = createAdminClient()
  const { data, error } = await client
    .from('tags')
    .upsert(inputs, { onConflict: 'slug', ignoreDuplicates: false })
    .select('id, name, slug')
  if (error) throw new Error(`findOrCreateTags: ${error.message}`)
  return data ?? []
}

export async function setImageTags(imageId: string, tagIds: number[]) {
  const client = createAdminClient()
  await client.from('image_tags').delete().eq('image_id', imageId)
  if (tagIds.length === 0) return
  const rows = tagIds.map((tag_id) => ({ image_id: imageId, tag_id }))
  const { error } = await client.from('image_tags').insert(rows)
  if (error) throw new Error(`setImageTags: ${error.message}`)
}

export async function findImagesByTagSlug(
  tagSlug: string,
  cursor?: string,
  limit = PAGE_SIZE
) {
  const client = createAdminClient()

  const { data: tag } = await client
    .from('tags')
    .select('id, name, slug')
    .eq('slug', tagSlug)
    .single()
  if (!tag) return { tag: null, rows: [], nextCursor: null }

  // Drive the query from `images` (with `is_published = true`) so the
  // partial composite index `images_created_idx` can be used, and apply
  // the same keyset cursor pattern as the main gallery. The inner join
  // on `image_tags` filters by tag without forcing a sort in JS.
  let query = client
    .from('images')
    .select(
      'id, slug, image_url, width, height, prompt, created_at, image_tags!inner(tag_id)'
    )
    .eq('is_published', true)
    .eq('image_tags.tag_id', tag.id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor)
    query = query.or(
      `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(`findImagesByTagSlug: ${error.message}`)

  const all = data ?? []
  const hasMore = all.length > limit
  const rows = hasMore ? all.slice(0, limit) : all
  const nextCursor = hasMore
    ? encodeCursor({ createdAt: rows.at(-1)!.created_at, id: rows.at(-1)!.id })
    : null

  return { tag, rows, nextCursor }
}
