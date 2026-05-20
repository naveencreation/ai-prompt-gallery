import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockCache,
  mockStorage,
  mockLogger,
  mockImageRepo,
  mockTagRepo,
} = vi.hoisted(() => ({
  mockCache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  mockStorage: {
    signedUploadUrl: vi.fn(),
    publicUrl: vi.fn(),
    delete: vi.fn(),
  },
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  mockImageRepo: {
    findPublishedImages: vi.fn(),
    findImageBySlug: vi.fn(),
    findImageById: vi.fn(),
    findAllImages: vi.fn(),
    insertImage: vi.fn(),
    updateImage: vi.fn(),
    deleteImage: vi.fn(),
    slugExists: vi.fn(),
  },
  mockTagRepo: {
    findTagsByImageId: vi.fn(),
    findOrCreateTag: vi.fn(),
    setImageTags: vi.fn(),
    findImagesByTagSlug: vi.fn(),
  },
}))

vi.mock('@/lib/cache/factory', () => ({
  cache: mockCache,
}))

vi.mock('@/lib/storage/factory', () => ({
  storage: mockStorage,
}))

vi.mock('@/lib/observability/logger', () => ({
  logger: mockLogger,
}))

vi.mock('@/lib/repos/imageRepo', () => mockImageRepo)

vi.mock('@/lib/repos/tagRepo', () => mockTagRepo)

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'abc123'),
}))

import {
  getGalleryPage,
  getImageBySlug,
  getImageByIdPublic,
  createImage,
  updateImage,
  deleteImage,
} from './imageService'

describe('imageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getGalleryPage', () => {
    it('returns cached result when available', async () => {
      const cached = { rows: [], nextCursor: null }
      mockCache.get.mockResolvedValue(cached)
      const result = await getGalleryPage()
      expect(result).toBe(cached)
      expect(mockImageRepo.findPublishedImages).not.toHaveBeenCalled()
    })

    it('fetches from repo and caches when missing', async () => {
      const repoResult = { rows: [{ id: '1' }], nextCursor: null }
      mockCache.get.mockResolvedValue(null)
      mockImageRepo.findPublishedImages.mockResolvedValue(repoResult)

      const result = await getGalleryPage('cursor', 12)

      expect(result).toBe(repoResult)
      expect(mockImageRepo.findPublishedImages).toHaveBeenCalledWith('cursor', 12)
      expect(mockCache.set).toHaveBeenCalledWith('gallery:cursor:12', repoResult, expect.any(Number))
    })
  })

  describe('getImageBySlug', () => {
    it('returns cached image when available', async () => {
      mockCache.get.mockResolvedValue({ id: '1', slug: 'cat' })
      const result = await getImageBySlug('cat')
      expect(result).toEqual({ id: '1', slug: 'cat' })
      expect(mockImageRepo.findImageBySlug).not.toHaveBeenCalled()
    })

    it('fetches from repo, merges tags, and caches', async () => {
      const image = { id: '1', slug: 'cat', prompt: 'A cat' }
      mockCache.get.mockResolvedValue(null)
      mockImageRepo.findImageBySlug.mockResolvedValue(image)
      mockTagRepo.findTagsByImageId.mockResolvedValue([{ id: 1, name: 'cat', slug: 'cat' }])

      const result = await getImageBySlug('cat')

      expect(result).toEqual({ ...image, tags: [{ id: 1, name: 'cat', slug: 'cat' }] })
      expect(mockCache.set).toHaveBeenCalledWith('image:slug:cat', expect.any(Object), expect.any(Number))
    })

    it('returns null when image not found', async () => {
      mockCache.get.mockResolvedValue(null)
      mockImageRepo.findImageBySlug.mockResolvedValue(null)
      const result = await getImageBySlug('missing')
      expect(result).toBeNull()
    })
  })

  describe('getImageByIdPublic', () => {
    it('returns image with tags when published', async () => {
      const image = { id: '1', is_published: true, prompt: 'x' }
      mockImageRepo.findImageById.mockResolvedValue(image)
      mockTagRepo.findTagsByImageId.mockResolvedValue([])
      const result = await getImageByIdPublic('1')
      expect(result).toEqual({ ...image, tags: [] })
    })

    it('returns null when unpublished', async () => {
      mockImageRepo.findImageById.mockResolvedValue({ id: '1', is_published: false })
      const result = await getImageByIdPublic('1')
      expect(result).toBeNull()
    })

    it('returns null when not found', async () => {
      mockImageRepo.findImageById.mockResolvedValue(null)
      const result = await getImageByIdPublic('1')
      expect(result).toBeNull()
    })
  })

  describe('createImage', () => {
    it('creates an image with tags', async () => {
      mockImageRepo.slugExists.mockResolvedValue(false)
      mockImageRepo.insertImage.mockResolvedValue({ id: 'new-id', slug: 'test-image' })
      mockTagRepo.findOrCreateTag.mockResolvedValue({ id: 1, name: 'art', slug: 'art' })

      const input = {
        slug: 'test-image',
        storage_key: 'k',
        storage_provider: 'supabase' as const,
        image_url: 'https://example.com/img.webp',
        width: 1,
        height: 1,
        prompt: 'test image',
        is_published: false,
      }

      const result = await createImage(input, ['art'])

      expect(mockImageRepo.insertImage).toHaveBeenCalled()
      expect(mockTagRepo.findOrCreateTag).toHaveBeenCalledWith({ name: 'art', slug: 'art' })
      expect(mockTagRepo.setImageTags).toHaveBeenCalledWith('new-id', [1])
      expect(mockCache.del).toHaveBeenCalledWith('gallery:first:24')
      expect(mockLogger.info).toHaveBeenCalledWith('image.created', { id: 'new-id', slug: 'test-image' })
    })

    it('generates unique slug on collision', async () => {
      mockImageRepo.slugExists.mockResolvedValue(true)
      mockImageRepo.insertImage.mockResolvedValue({ id: 'new-id', slug: 'test-image-abc123' })

      const input = {
        slug: 'test-image',
        storage_key: 'k',
        storage_provider: 'supabase' as const,
        image_url: 'https://example.com/img.webp',
        width: 1,
        height: 1,
        prompt: 'test image',
        is_published: false,
      }

      const result = await createImage(input)
      expect(mockImageRepo.insertImage).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'test-image-abc123' })
      )
    })

    it('throws on invalid input', async () => {
      await expect(createImage({} as any)).rejects.toThrow()
    })
  })

  describe('updateImage', () => {
    it('updates image and invalidates cache', async () => {
      mockImageRepo.updateImage.mockResolvedValue({ id: '1', slug: 'updated-slug' })

      const result = await updateImage('1', { prompt: 'Updated prompt' })

      expect(mockImageRepo.updateImage).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ prompt: 'Updated prompt' })
      )
      expect(mockCache.del).toHaveBeenCalledWith('image:slug:updated-slug')
      expect(mockCache.del).toHaveBeenCalledWith('gallery:first:24')
      expect(mockLogger.info).toHaveBeenCalledWith('image.updated', { id: '1' })
    })

    it('updates tags when provided', async () => {
      mockImageRepo.updateImage.mockResolvedValue({ id: '1', slug: 's' })
      mockTagRepo.findOrCreateTag.mockResolvedValue({ id: 2, name: 'new', slug: 'new' })

      await updateImage('1', { prompt: 'x' }, ['new'])

      expect(mockTagRepo.setImageTags).toHaveBeenCalledWith('1', [2])
    })
  })

  describe('deleteImage', () => {
    it('deletes image, storage, and invalidates cache', async () => {
      mockImageRepo.findImageById.mockResolvedValue({ id: '1', storage_key: 'k', slug: 's' })

      await deleteImage('1')

      expect(mockImageRepo.deleteImage).toHaveBeenCalledWith('1')
      expect(mockStorage.delete).toHaveBeenCalledWith('k')
      expect(mockCache.del).toHaveBeenCalledWith('image:slug:s')
      expect(mockCache.del).toHaveBeenCalledWith('gallery:first:24')
      expect(mockLogger.info).toHaveBeenCalledWith('image.deleted', { id: '1' })
    })

    it('throws when image not found', async () => {
      mockImageRepo.findImageById.mockResolvedValue(null)
      await expect(deleteImage('1')).rejects.toThrow('Image not found')
    })
  })
})
