// lib/repos/tagRepo.ts
import { createAdminClient } from '@/lib/db/client'
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
  const client = createAdminClient()
  const { data: existing } = await client
    .from('tags')
    .select('id, name, slug')
    .eq('slug', input.slug)
    .single()
  if (existing) return existing

  const { data, error } = await client
    .from('tags')
    .insert(input)
    .select('id, name, slug')
    .single()
  if (error) throw new Error(`findOrCreateTag: ${error.message}`)
  return data!
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
  limit = 24
) {
  const client = createAdminClient()

  const { data: tag } = await client
    .from('tags')
    .select('id, name, slug')
    .eq('slug', tagSlug)
    .single()
  if (!tag) return { tag: null, rows: [], nextCursor: null }

  const { data, error } = await client
    .from('image_tags')
    .select('images(id, slug, image_url, width, height, prompt, created_at)')
    .eq('tag_id', tag.id)
    .limit(limit)
  if (error) throw new Error(`findImagesByTagSlug: ${error.message}`)

  const rows = (data ?? []).flatMap((r) => r.images ?? [])
  return { tag, rows, nextCursor: null }
}
