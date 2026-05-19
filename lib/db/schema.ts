// lib/db/schema.ts
import { z } from 'zod'

export const ImageSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  storage_key: z.string(),
  storage_provider: z.string(),
  image_url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  prompt: z.string().min(1),
  description: z.string().nullable(),
  model: z.string().nullable(),
  is_published: z.boolean(),
  display_order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const CreateImageSchema = z.object({
  slug: z.string().min(1).max(100),
  storage_key: z.string().min(1),
  storage_provider: z.enum(['supabase', 'cloudinary']).default('supabase'),
  image_url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  prompt: z.string().min(1),
  description: z.string().optional(),
  model: z.string().optional(),
  is_published: z.boolean().default(false),
  display_order: z.number().optional(),
})

export const UpdateImageSchema = CreateImageSchema.partial().omit({ slug: true })

export const TagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
})

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50),
})

export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
})

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type Image = z.infer<typeof ImageSchema>
export type CreateImage = z.infer<typeof CreateImageSchema>
export type UpdateImage = z.infer<typeof UpdateImageSchema>
export type Tag = z.infer<typeof TagSchema>
export type CreateTag = z.infer<typeof CreateTagSchema>
export type Pagination = z.infer<typeof PaginationSchema>
