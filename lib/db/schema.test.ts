import { describe, it, expect } from 'vitest'
import {
  CreateImageSchema,
  UpdateImageSchema,
  PaginationSchema,
  SearchQuerySchema,
} from './schema'

describe('CreateImageSchema', () => {
  it('accepts a valid image payload', () => {
    const result = CreateImageSchema.safeParse({
      slug: 'test-image',
      storage_key: 'images/test.webp',
      storage_provider: 'supabase',
      image_url: 'https://example.com/image.webp',
      width: 1024,
      height: 768,
      prompt: 'A cat in space',
      description: 'Generated with SDXL',
      model: 'sdxl',
      is_published: true,
      display_order: 1,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = CreateImageSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects invalid URL', () => {
    const result = CreateImageSchema.safeParse({
      slug: 'test',
      storage_key: 'k',
      image_url: 'not-a-url',
      width: 1,
      height: 1,
      prompt: 'x',
    })
    expect(result.success).toBe(false)
  })

  it('defaults storage_provider to supabase', () => {
    const result = CreateImageSchema.safeParse({
      slug: 'test',
      storage_key: 'k',
      image_url: 'https://example.com/img.webp',
      width: 1,
      height: 1,
      prompt: 'x',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.storage_provider).toBe('supabase')
    }
  })
})

describe('UpdateImageSchema', () => {
  it('accepts partial updates', () => {
    const result = UpdateImageSchema.safeParse({ prompt: 'Updated prompt' })
    expect(result.success).toBe(true)
  })

  it('strips slug field from parsed output', () => {
    const result = UpdateImageSchema.safeParse({ slug: 'new-slug', prompt: 'updated' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('slug' in result.data).toBe(false)
      expect(result.data.prompt).toBe('updated')
    }
  })
})

describe('PaginationSchema', () => {
  it('defaults limit to 24', () => {
    const result = PaginationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(24)
    }
  })

  it('limits max to 100', () => {
    const result = PaginationSchema.safeParse({ limit: '200' })
    expect(result.success).toBe(false)
  })
})

describe('SearchQuerySchema', () => {
  it('requires a non-empty query', () => {
    const result = SearchQuerySchema.safeParse({ q: '' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid query with optional cursor', () => {
    const result = SearchQuerySchema.safeParse({ q: 'cyberpunk cat', cursor: 'abc' })
    expect(result.success).toBe(true)
  })
})
