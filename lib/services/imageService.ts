// lib/services/imageService.ts
import * as imageRepo from '@/lib/repos/imageRepo'
import * as tagRepo from '@/lib/repos/tagRepo'
import { storage } from '@/lib/storage/factory'
import { cache } from '@/lib/cache/factory'
import { logger } from '@/lib/observability/logger'
import { generateSlug, generateSlugWithSuffix } from '@/lib/utils/slug'
import { CACHE_TTL_GALLERY, CACHE_TTL_IMAGE } from '@/lib/constants/cache'
import { PAGE_SIZE } from '@/lib/constants/limits'
import { CreateImageSchema, UpdateImageSchema } from '@/lib/db/schema'
import type { CreateImage, UpdateImage } from '@/lib/db/schema'
import { nanoid } from 'nanoid'

export async function getGalleryPage(cursor?: string, limit = PAGE_SIZE) {
  const cacheKey = `gallery:${cursor ?? 'first'}:${limit}`
  const cached = await cache.get<Awaited<ReturnType<typeof imageRepo.findPublishedImages>>>(
    cacheKey
  )
  if (cached) return cached

  const result = await imageRepo.findPublishedImages(cursor, limit)
  await cache.set(cacheKey, result, CACHE_TTL_GALLERY)
  return result
}

export async function getImageBySlug(slug: string) {
  const cacheKey = `image:slug:${slug}`
  const cached = await cache.get(cacheKey)
  if (cached) return cached

  const image = await imageRepo.findImageBySlug(slug)
  if (!image) return null

  const tags = await tagRepo.findTagsByImageId(image.id)
  const result = { ...image, tags }
  await cache.set(cacheKey, result, CACHE_TTL_IMAGE)
  return result
}

export async function getAllImagesAdmin(cursor?: string, limit = PAGE_SIZE) {
  return imageRepo.findAllImages(cursor, limit)
}

export async function createImage(input: CreateImage, tagNames: string[] = []) {
  const validated = CreateImageSchema.parse(input)

  // Ensure unique slug
  let slug = validated.slug || generateSlug(validated.prompt)
  if (await imageRepo.slugExists(slug)) {
    slug = generateSlugWithSuffix(validated.prompt, nanoid(6))
  }

  const image = await imageRepo.insertImage({ ...validated, slug })
  logger.info('image.created', { id: image.id, slug: image.slug })

  if (tagNames.length > 0) {
    const tags = await Promise.all(
      tagNames.map((name) => tagRepo.findOrCreateTag({ name, slug: generateSlug(name) }))
    )
    await tagRepo.setImageTags(image.id, tags.map((t) => t.id))
  }

  await invalidateGalleryCache()
  return image
}

export async function updateImage(
  id: string,
  input: UpdateImage,
  tagNames?: string[]
) {
  const validated = UpdateImageSchema.parse(input)
  const image = await imageRepo.updateImage(id, validated)
  logger.info('image.updated', { id })

  if (tagNames !== undefined) {
    const tags = await Promise.all(
      tagNames.map((name) => tagRepo.findOrCreateTag({ name, slug: generateSlug(name) }))
    )
    await tagRepo.setImageTags(id, tags.map((t) => t.id))
  }

  await cache.del(`image:slug:${image.slug}`)
  await invalidateGalleryCache()
  return image
}

export async function deleteImage(id: string) {
  const image = await imageRepo.findImageById(id)
  if (!image) throw new Error('Image not found')

  await imageRepo.deleteImage(id)
  await storage.delete(image.storage_key)
  await cache.del(`image:slug:${image.slug}`)
  await invalidateGalleryCache()
  logger.info('image.deleted', { id })
}

async function invalidateGalleryCache() {
  await cache.del('gallery:first:24')
}
