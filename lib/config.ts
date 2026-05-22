// lib/config.ts
import { z } from 'zod'

const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    REVALIDATE_SECRET: z.string().min(16).optional(),

    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    SENTRY_DSN: z.string().url().optional(),
    AXIOM_TOKEN: z.string().optional(),
    AXIOM_DATASET: z.string().optional(),
    MEILISEARCH_HOST: z.string().url().optional(),
    MEILISEARCH_API_KEY: z.string().optional(),
  })
  .parse(process.env)

export const config = {
  cache: env.UPSTASH_REDIS_REST_URL ? 'redis' : 'memory',
  rate: env.UPSTASH_REDIS_REST_URL ? 'redis' : 'memory',
  storage:
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
      ? 'cloudinary'
      : 'supabase',
  errors: env.SENTRY_DSN ? 'sentry' : 'console',
  logs: env.AXIOM_TOKEN ? 'axiom' : 'console',
  search: env.MEILISEARCH_HOST ? 'meili' : 'postgres',
  env,
} as const
